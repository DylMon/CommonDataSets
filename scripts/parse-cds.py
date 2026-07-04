#!/usr/bin/env python3
"""
parse-cds.py — Extract CDS fields from a PDF and save to data/cds/{slug}.json

Usage:
    python scripts/parse-cds.py <pdf_path> <slug>

Example:
    python scripts/parse-cds.py data/cds-pdfs/princeton.pdf princeton

Requirements:
    pip install -r requirements-cds.txt
    ANTHROPIC_API_KEY must be set in .env or the environment
"""

import sys
import json
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("Missing dependency: pip install pdfplumber")

try:
    import anthropic
except ImportError:
    sys.exit("Missing dependency: pip install anthropic")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv optional; key can be set directly in environment


REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = REPO_ROOT / "data" / "cds"

SYSTEM_PROMPT = (
    "You are a precise data extraction assistant. "
    "Extract structured data from Common Data Set (CDS) university forms. "
    "Return only valid JSON with no explanation or markdown fences."
)

EXTRACT_PROMPT = """\
Extract the following fields from this Common Data Set (CDS) form text.
Return a single JSON object. Use null for any field that is not present,
not applicable, or marked "NA". All percentages → decimals (56% = 0.56).

=== BASIC INFO ===

- name: string (full official institution name, Section A1)
- data_year: string (CDS reporting year, e.g. "2024-25" — read from title/header)
- city: string (city from A1 address)
- state: string (2-letter state abbreviation from A1)
- location: string (formatted as "City, ST", e.g. "New Haven, CT")
- school_type: string — "Public" or "Private" (Section A2)
- website: string (main institution website URL from A1, no https://)

=== SCALAR FIELDS ===

Admissions (Section C1):
- applicants_total: integer (total first-time first-year applicants)
- applicants_men: integer
- applicants_women: integer
- admitted_total: integer
- admitted_men: integer
- admitted_women: integer
- enrolled_total: integer
- enrolled_men: integer
- enrolled_women: integer
- acceptance_rate: float (admitted_total / applicants_total)
- application_fee: integer (Section C13)
- avg_gpa_weighted: float (Section C12 average high school GPA)
- rd_deadline: string (Section C14 regular decision closing date, e.g. "1/1")

Waitlist (Section C2):
- waitlist_offered: integer (qualified applicants offered a place)
- waitlist_accepted: integer (number accepting a place on the waitlist)
- waitlist_admitted: integer (wait-listed students ultimately admitted)

Early Decision / Early Action (Sections C21-C22):
- ea_ed_type: string — "ED" if early decision only, "EA" if early action only,
  "REA" if restrictive early action, "ED I & II" if two ED rounds, "None" if neither
- ea_ed_deadline: string (closing date, e.g. "11/1")
- ea_ed_notification: string (notification date, e.g. "Mid-December")
- ea_apps_received: integer (C21: ED applications received — null if EA or None)
- ea_apps_admitted: integer (C21: admitted under ED plan — null if EA or None)

Test Scores (Section C9):
- sat_submitted_pct: float (percent of enrolled first-year students submitting SAT)
- sat_submitted_count: integer (number submitting SAT)
- act_submitted_pct: float
- act_submitted_count: integer
- sat_composite_25: integer
- sat_composite_75: integer
- sat_reading_25: integer (SAT Evidence-Based Reading and Writing 25th percentile)
- sat_reading_75: integer
- sat_math_25: integer
- sat_math_75: integer
- act_composite_25: integer
- act_composite_75: integer
- act_math_25: integer
- act_math_75: integer
- act_english_25: integer
- act_english_75: integer

Enrollment (Section B1):
- total_undergrads: integer (total undergraduate students)
- undergrads_male: integer
- undergrads_female: integer
- retention_rate: float (Section B22 first-to-second year retention rate)

Costs (Section G1) — use most recent available academic year:
- tuition: integer (private institution tuition; null if public)
- tuition_in_state: integer (public in-state; null if private)
- tuition_out_of_state: integer (public out-of-state; null if private)
- required_fees: integer
- room_and_board: integer (food and housing on-campus)
- books_supplies: integer (Section G5)
- other_expenses: integer (Section G5 "other expenses")

Student Life (Section F1, first-time first-year percentages):
- pct_out_of_state: float (percent from out of state)
- pct_on_campus_housing: float (percent living in college-owned housing)

=== JSONB FIELDS (nested objects) ===

applicant_pools:
{
  "ea": { "applied": int|null, "admitted": int|null, "rate": float|null },
  "rd": { "applied": int|null, "admitted": int|null, "rate": float|null },
  "waitlist": { "offered": int|null, "accepted_spots": int|null, "enrolled": int|null }
}

gender_breakdown (Section C1 — applicants/admits/enrollees by gender):
{
  "applied":   { "male": int|null, "female": int|null },
  "accepted":  { "male": int|null, "female": int|null },
  "enrolled":  { "male": int|null, "female": int|null }
}

demographics_detail (Section B2 — raw counts):
{
  "first_year": {
    "nonresident_aliens": int|null, "hispanic": int|null, "black": int|null,
    "white": int|null, "american_indian": int|null, "asian": int|null,
    "pacific_islander": int|null, "two_or_more": int|null, "unknown": int|null,
    "total": int|null
  },
  "undergrad": { ...same keys... }
}

geographic_breakdown (Section F1):
{
  "out_of_state_pct": float|null,
  "international_pct": float|null
}

sat_act_breakdown (Section C9 submission stats):
{
  "sat_submitted_count": int|null, "sat_submitted_pct": float|null,
  "act_submitted_count": int|null, "act_submitted_pct": float|null
}

class_rank (Section C10 — null entire object if school does not report rank):
{
  "top10": float|null, "top25": float|null, "top50": float|null,
  "bottom50": float|null, "bottom25": float|null
}

gpa_distribution (Section C11):
{
  "gpa_40": float|null, "gpa_375_399": float|null, "gpa_350_374": float|null,
  "gpa_325_349": float|null, "gpa_300_324": float|null, "gpa_250_299": float|null,
  "gpa_200_249": float|null, "gpa_100_199": float|null
}

admission_factors (Section C7):
Each value is one of: "very_important" | "important" | "considered" | "not_considered" | null
{
  "rigor": ..., "class_rank": ..., "academic_gpa": ..., "test_scores": ...,
  "essay": ..., "recommendations": ..., "interview": ..., "extracurriculars": ...,
  "talent": ..., "character": ..., "first_gen": ..., "alumni_relation": ...,
  "geo_residence": ..., "state_residence": ..., "religious": ...,
  "racial_ethnic": ..., "volunteer": ..., "work_experience": ..., "applicant_interest": ...
}

transfer_stats (Section D2):
{
  "male":   { "applied": int|null, "admitted": int|null, "enrolled": int|null },
  "female": { "applied": int|null, "admitted": int|null, "enrolled": int|null },
  "total":  { "applied": int|null, "admitted": int|null, "enrolled": int|null }
}

=== CDS TEXT ===

{text}
"""


def extract_text(pdf_path: Path) -> str:
    """Extract text from data pages only, stopping before the definitions appendix."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            text = page.extract_text(layout=True) or ""
            # The definitions section always starts in the last ~35% of a CDS PDF
            if "CDS-Definitions" in text and i > int(total * 0.65):
                break
            if text.strip():
                pages.append(f"--- Page {i + 1} ---\n{text}")
    return "\n\n".join(pages)


def parse_with_claude(text: str) -> dict:
    client = anthropic.Anthropic()

    print(f"  Sending {len(text):,} chars to Claude...")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": EXTRACT_PROMPT.format(text=text)}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if the model adds them despite instructions
    if raw.startswith("```"):
        lines = raw.splitlines()
        start = 1 if lines[0].startswith("```") else 0
        end = -1 if lines[-1] == "```" else len(lines)
        raw = "\n".join(lines[start:end]).strip()

    return json.loads(raw)


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    slug = sys.argv[2]

    if not pdf_path.exists():
        sys.exit(f"PDF not found: {pdf_path}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"{slug}.json"

    print(f"\nParsing:  {pdf_path}")
    print(f"Output:   {output_path}\n")

    print("  [1/3] Extracting PDF text...")
    text = extract_text(pdf_path)
    print(f"         {len(text):,} chars extracted")

    print("  [2/3] Parsing with Claude...")
    data = parse_with_claude(text)
    data["slug"] = slug

    print("  [3/3] Writing JSON...")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    populated = sum(1 for v in data.values() if v is not None)
    total_fields = len(data)
    print(f"\nDone. {populated}/{total_fields} fields populated → {output_path}\n")


if __name__ == "__main__":
    main()
