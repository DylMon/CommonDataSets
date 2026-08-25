#!/usr/bin/env python3
"""
parse-cds.py — Extract CDS fields from a PDF and save to data/cds/{slug}.json

Sends the PDF directly to Claude (native PDF input) and constrains the
response with a JSON schema (structured outputs), so the model reads the
actual PDF layout instead of a pdfplumber text dump, and the output is
guaranteed to match the schema rather than relying on prompted JSON.

Usage:
    python scripts/parse-cds.py <pdf_path> <slug>

Example:
    python scripts/parse-cds.py data/cds-pdfs/princeton.pdf princeton

Requirements:
    pip install -r requirements-cds.txt
    ANTHROPIC_API_KEY must be set in .env or the environment
"""

import base64
import sys
import json
from io import BytesIO
from pathlib import Path

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

MODEL = "claude-sonnet-5"

SYSTEM_PROMPT = (
    "You are a precise data extraction assistant for Common Data Set (CDS) "
    "university PDF forms. Extract exactly the fields defined by the response "
    "schema from the attached PDF. Omit any field entirely from your output "
    "if it is not present, not applicable, or marked 'NA' — do not include a "
    "null value for it. Convert all percentages to decimals (56% = 0.56). "
    "Ignore the CDS-Definitions appendix at the end of the document — only "
    "extract from the data sections (A through H)."
)

FIELD_INSTRUCTIONS = """\
Extract the following fields from the attached Common Data Set (CDS) PDF.

=== BASIC INFO ===

- name: full official institution name (Section A1)
- data_year: CDS reporting year, e.g. "2025-26" — read from the title/header
- city: city from A1 address
- state: 2-letter state abbreviation from A1
- location: formatted as "City, ST", e.g. "New Haven, CT"
- school_type: "Public" or "Private" (Section A2)
- website: main institution website URL from A1, no https://

=== SCALAR FIELDS ===

Admissions (Section C1):
- applicants_total / applicants_men / applicants_women: total first-time first-year applicants
- admitted_total / admitted_men / admitted_women
- enrolled_total / enrolled_men / enrolled_women
- acceptance_rate: admitted_total / applicants_total
- application_fee (Section C13)
- avg_gpa_weighted: Section C12 average high school GPA
- rd_deadline: Section C14 regular decision closing date, e.g. "1/1"

Waitlist (Section C2):
- waitlist_offered: qualified applicants offered a place
- waitlist_accepted: number accepting a place on the waitlist
- waitlist_admitted: wait-listed students ultimately admitted

Early Decision / Early Action (Sections C21-C22):
- ea_ed_type: "ED" if early decision only, "EA" if early action only, "REA" if
  restrictive early action, "ED I & II" if two ED rounds, "None" if neither
- ea_ed_deadline: closing date, e.g. "11/1"
- ea_ed_notification: notification date, e.g. "Mid-December"
- ea_apps_received: C21 ED applications received — null if EA or None
- ea_apps_admitted: C21 admitted under ED plan — null if EA or None

Test Scores (Section C9):
- sat_submitted_pct / sat_submitted_count: percent and count of enrolled
  first-year students submitting SAT
- act_submitted_pct / act_submitted_count
- sat_composite_25 / sat_composite_75
- sat_reading_25 / sat_reading_75: SAT Evidence-Based Reading and Writing
- sat_math_25 / sat_math_75
- act_composite_25 / act_composite_75
- act_math_25 / act_math_75
- act_english_25 / act_english_75

Enrollment (Section B1):
- total_undergrads / undergrads_male / undergrads_female
- retention_rate: Section B22 first-to-second year retention rate

Costs (Section G1) — use the most recent available academic year:
- tuition: private institution tuition; null if public
- tuition_in_state / tuition_out_of_state: public only; null if private
- required_fees
- room_and_board: food and housing on-campus
- books_supplies (Section G5)
- other_expenses (Section G5 "other expenses")

Student Life (Section F1, first-time first-year percentages):
- pct_out_of_state
- pct_on_campus_housing: percent living in college-owned housing

=== NESTED FIELDS ===

applicant_pools: ea/rd applied+admitted+rate, waitlist offered+accepted_spots+enrolled

gender_breakdown (Section C1): applied/accepted/enrolled, each with male+female

demographics_detail (Section B2, raw counts): first_year and undergrad, each with
nonresident_aliens, hispanic, black, white, american_indian, asian,
pacific_islander, two_or_more, unknown, total

geographic_breakdown (Section F1): out_of_state_pct, international_pct

sat_act_breakdown (Section C9): sat_submitted_count, sat_submitted_pct,
act_submitted_count, act_submitted_pct

class_rank (Section C10): top10, top25, top50, bottom50, bottom25 — leave the
whole object null if the school does not report class rank

gpa_distribution (Section C11): gpa_40, gpa_375_399, gpa_350_374, gpa_325_349,
gpa_300_324, gpa_250_299, gpa_200_249, gpa_100_199 — leave the whole object
null if not reported

admission_factors (Section C7): rigor, class_rank, academic_gpa, test_scores,
essay, recommendations, interview, extracurriculars, talent, character,
first_gen, alumni_relation, geo_residence, state_residence, religious,
racial_ethnic, volunteer, work_experience, applicant_interest — each one of
"very_important" | "important" | "considered" | "not_considered" | null

transfer_stats (Section D2): male/female/total, each with applied+admitted+enrolled
"""


# NOTE: these are named "_nullable*" for readability at the call sites below,
# but they no longer use JSON Schema unions (`anyOf`/`type: [X, "null"]`) to
# express nullability — Anthropic's structured-output schemas cap out at 16
# union-typed parameters total, and this schema has ~150 nullable fields.
# Instead, every field is simply left out of "required" so Claude can omit
# it when the PDF doesn't have it; apply_defaults() below then walks the
# response and backfills any omitted key with `null`, so the saved JSON has
# the exact same always-present-keys shape as before.
def _nullable(json_type: str) -> dict:
    return {"type": json_type}


def _nullable_enum(values: list[str]) -> dict:
    return {"type": "string", "enum": values}


def _obj(properties: dict) -> dict:
    return {
        "type": "object",
        "properties": properties,
        "required": [],
        "additionalProperties": False,
    }


def _nullable_obj(properties: dict) -> dict:
    return _obj(properties)


_pool_triple = _obj({"applied": _nullable("integer"), "admitted": _nullable("integer"), "rate": _nullable("number")})
_waitlist_pool = _obj({"offered": _nullable("integer"), "accepted_spots": _nullable("integer"), "enrolled": _nullable("integer")})
_gender_pair = _obj({"male": _nullable("integer"), "female": _nullable("integer")})
_demo_counts = _obj({
    "nonresident_aliens": _nullable("integer"),
    "hispanic": _nullable("integer"),
    "black": _nullable("integer"),
    "white": _nullable("integer"),
    "american_indian": _nullable("integer"),
    "asian": _nullable("integer"),
    "pacific_islander": _nullable("integer"),
    "two_or_more": _nullable("integer"),
    "unknown": _nullable("integer"),
    "total": _nullable("integer"),
})
_transfer_triple = _obj({"applied": _nullable("integer"), "admitted": _nullable("integer"), "enrolled": _nullable("integer")})

_IMPORTANCE = ["very_important", "important", "considered", "not_considered"]
_ADMISSION_FACTOR_KEYS = [
    "rigor", "class_rank", "academic_gpa", "test_scores", "essay", "recommendations",
    "interview", "extracurriculars", "talent", "character", "first_gen", "alumni_relation",
    "geo_residence", "state_residence", "religious", "racial_ethnic", "volunteer",
    "work_experience", "applicant_interest",
]

CDS_SCHEMA = _obj({
    "name": _nullable("string"),
    "data_year": _nullable("string"),
    "city": _nullable("string"),
    "state": _nullable("string"),
    "location": _nullable("string"),
    "school_type": _nullable_enum(["Public", "Private"]),
    "website": _nullable("string"),

    "applicants_total": _nullable("integer"),
    "applicants_men": _nullable("integer"),
    "applicants_women": _nullable("integer"),
    "admitted_total": _nullable("integer"),
    "admitted_men": _nullable("integer"),
    "admitted_women": _nullable("integer"),
    "enrolled_total": _nullable("integer"),
    "enrolled_men": _nullable("integer"),
    "enrolled_women": _nullable("integer"),
    "acceptance_rate": _nullable("number"),
    "application_fee": _nullable("integer"),
    "avg_gpa_weighted": _nullable("number"),
    "rd_deadline": _nullable("string"),

    "waitlist_offered": _nullable("integer"),
    "waitlist_accepted": _nullable("integer"),
    "waitlist_admitted": _nullable("integer"),

    "ea_ed_type": _nullable("string"),
    "ea_ed_deadline": _nullable("string"),
    "ea_ed_notification": _nullable("string"),
    "ea_apps_received": _nullable("integer"),
    "ea_apps_admitted": _nullable("integer"),

    "sat_submitted_pct": _nullable("number"),
    "sat_submitted_count": _nullable("integer"),
    "act_submitted_pct": _nullable("number"),
    "act_submitted_count": _nullable("integer"),
    "sat_composite_25": _nullable("integer"),
    "sat_composite_75": _nullable("integer"),
    "sat_reading_25": _nullable("integer"),
    "sat_reading_75": _nullable("integer"),
    "sat_math_25": _nullable("integer"),
    "sat_math_75": _nullable("integer"),
    "act_composite_25": _nullable("integer"),
    "act_composite_75": _nullable("integer"),
    "act_math_25": _nullable("integer"),
    "act_math_75": _nullable("integer"),
    "act_english_25": _nullable("integer"),
    "act_english_75": _nullable("integer"),

    "total_undergrads": _nullable("integer"),
    "undergrads_male": _nullable("integer"),
    "undergrads_female": _nullable("integer"),
    "retention_rate": _nullable("number"),

    "tuition": _nullable("integer"),
    "tuition_in_state": _nullable("integer"),
    "tuition_out_of_state": _nullable("integer"),
    "required_fees": _nullable("integer"),
    "room_and_board": _nullable("integer"),
    "books_supplies": _nullable("integer"),
    "other_expenses": _nullable("integer"),

    "pct_out_of_state": _nullable("number"),
    "pct_on_campus_housing": _nullable("number"),

    "applicant_pools": _nullable_obj({"ea": _pool_triple, "rd": _pool_triple, "waitlist": _waitlist_pool}),
    "gender_breakdown": _nullable_obj({"applied": _gender_pair, "accepted": _gender_pair, "enrolled": _gender_pair}),
    "demographics_detail": _nullable_obj({"first_year": _demo_counts, "undergrad": _demo_counts}),
    "geographic_breakdown": _nullable_obj({"out_of_state_pct": _nullable("number"), "international_pct": _nullable("number")}),
    "sat_act_breakdown": _nullable_obj({
        "sat_submitted_count": _nullable("integer"),
        "sat_submitted_pct": _nullable("number"),
        "act_submitted_count": _nullable("integer"),
        "act_submitted_pct": _nullable("number"),
    }),
    "class_rank": _nullable_obj({
        "top10": _nullable("number"), "top25": _nullable("number"), "top50": _nullable("number"),
        "bottom50": _nullable("number"), "bottom25": _nullable("number"),
    }),
    "gpa_distribution": _nullable_obj({
        "gpa_40": _nullable("number"), "gpa_375_399": _nullable("number"), "gpa_350_374": _nullable("number"),
        "gpa_325_349": _nullable("number"), "gpa_300_324": _nullable("number"), "gpa_250_299": _nullable("number"),
        "gpa_200_249": _nullable("number"), "gpa_100_199": _nullable("number"),
    }),
    "admission_factors": _nullable_obj({k: _nullable_enum(_IMPORTANCE) for k in _ADMISSION_FACTOR_KEYS}),
    "transfer_stats": _nullable_obj({"male": _transfer_triple, "female": _transfer_triple, "total": _transfer_triple}),
})


# Anthropic's document API caps a base64-encoded PDF at 32 MB (33,554,432
# bytes); leave a little headroom under that hard limit.
MAX_B64_BYTES = 33_000_000


def _shrink_pdf_bytes(pdf_path: Path, pdf_bytes: bytes) -> bytes:
    """Drop trailing pages until the base64-encoded size fits the API limit.

    CDS PDFs put the data sections (A-H) first and the CDS-Definitions
    appendix last, so trimming from the end keeps the fields we actually
    need. Requires pypdf (only imported here, on the rare oversized file).
    """
    if len(base64.standard_b64encode(pdf_bytes)) <= MAX_B64_BYTES:
        return pdf_bytes

    from pypdf import PdfReader, PdfWriter

    reader = PdfReader(BytesIO(pdf_bytes))
    n = len(reader.pages)

    def encoded_size(page_count: int) -> int:
        writer = PdfWriter()
        for page in reader.pages[:page_count]:
            writer.add_page(page)
        buf = BytesIO()
        writer.write(buf)
        return len(base64.standard_b64encode(buf.getvalue())), buf.getvalue()

    lo, hi, best = 1, n, None
    while lo <= hi:
        mid = (lo + hi) // 2
        size, data = encoded_size(mid)
        if size <= MAX_B64_BYTES:
            best = (mid, data)
            lo = mid + 1
        else:
            hi = mid - 1

    if best is None:
        raise ValueError(f"{pdf_path.name}: cannot fit even a single page under the {MAX_B64_BYTES:,}-byte limit")

    pages_kept, data = best
    print(f"  ! {pdf_path.name}: trimmed {n} -> {pages_kept} pages to fit the API size limit "
          f"(check late sections like G/expenses on this school)")
    return data


# The full CDS schema has ~150 independently-nullable fields, which exceeds
# both structured-output limits (16 union-typed params, 24 optional params)
# no matter how the nullability is expressed. Rather than split this into a
# dozen API calls per school, prompt for plain JSON instead — Sonnet 5 is
# reliable at this with an exact key list, and apply_defaults() below
# normalizes whatever keys come back (present or not) the same way either
# way, so downstream code doesn't care which path produced the JSON.
_TOP_LEVEL_KEYS = list(CDS_SCHEMA["properties"].keys())

JSON_FORMAT_INSTRUCTIONS = (
    "Respond with ONLY a single raw JSON object — no markdown code fences, "
    "no commentary before or after. The object's top-level keys must be "
    "exactly these, in this order, and no others: " + ", ".join(_TOP_LEVEL_KEYS) + ". "
    "Omit any field (at any nesting level) you cannot find data for — do not "
    "guess or include a null value for it, just leave the key out entirely."
)


def build_request_params(pdf_path: Path) -> dict:
    """Build the messages.create() params for one CDS PDF (shared by single-file and batch runs)."""
    pdf_bytes = _shrink_pdf_bytes(pdf_path, pdf_path.read_bytes())
    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode("ascii")
    return {
        "model": MODEL,
        "max_tokens": 16000,
        "system": SYSTEM_PROMPT,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": pdf_b64}},
                {"type": "text", "text": FIELD_INSTRUCTIONS + "\n\n" + JSON_FORMAT_INSTRUCTIONS},
            ],
        }],
    }


def apply_defaults(data: dict, schema: dict = CDS_SCHEMA) -> dict:
    """Backfill keys Claude omitted with null, recursively, so the saved JSON
    always has the same full key set regardless of what the model left out."""
    result = {}
    for key, sub_schema in schema["properties"].items():
        if key not in data:
            result[key] = None
        elif sub_schema.get("type") == "object" and isinstance(data[key], dict):
            result[key] = apply_defaults(data[key], sub_schema)
        else:
            result[key] = data[key]
    return result


def _parse_json_loosely(text: str) -> dict:
    """Parse a JSON object out of freeform model text, tolerating markdown fences or stray prose."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        text = text[text.index("\n") + 1:] if "\n" in text else text
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(text[start:end + 1])


def extract_json(content_blocks) -> dict:
    """Pull the JSON text block out of a Messages API response's content list."""
    for block in content_blocks:
        if block.type == "text":
            return apply_defaults(_parse_json_loosely(block.text))
    raise ValueError("No text content block in response")


def parse_with_claude(pdf_path: Path) -> dict:
    client = anthropic.Anthropic()
    print(f"  Sending {pdf_path.name} to Claude ({MODEL})...")
    message = client.messages.create(**build_request_params(pdf_path))
    return extract_json(message.content)


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

    data = parse_with_claude(pdf_path)
    data["slug"] = slug

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    populated = sum(1 for v in data.values() if v is not None)
    total_fields = len(data)
    print(f"\nDone. {populated}/{total_fields} fields populated → {output_path}\n")


if __name__ == "__main__":
    main()
