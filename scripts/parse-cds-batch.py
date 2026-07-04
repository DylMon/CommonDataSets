#!/usr/bin/env python3
"""
parse-cds-batch.py — Run parse-cds.py for all PDFs not yet parsed.

Usage:
    python scripts/parse-cds-batch.py [--force]

    --force  Re-parse schools that already have a JSON output.

Skips schools whose slug.json already exists in data/cds/ unless --force is passed.
Prints a completion summary grouped by data richness at the end.
"""

import sys
import json
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PDF_DIR    = REPO_ROOT / "data" / "cds-pdfs"
OUTPUT_DIR = REPO_ROOT / "data" / "cds"
SCRIPT     = REPO_ROOT / "scripts" / "parse-cds.py"

CORE_ADMISSIONS_FIELDS = [
    "applicants_total", "admitted_total", "enrolled_total",
    "acceptance_rate", "sat_composite_25", "act_composite_25",
    "total_undergrads", "tuition",
]

RICH_FIELDS = [
    "gpa_distribution", "admission_factors", "demographics_detail",
    "transfer_stats", "class_rank", "applicant_pools",
]


def score_completeness(data: dict) -> tuple[int, list[str], list[str]]:
    """Return (score 0-10, present_key_fields, missing_key_fields)."""
    present, missing = [], []
    for f in CORE_ADMISSIONS_FIELDS:
        val = data.get(f)
        if val is not None:
            present.append(f)
        else:
            missing.append(f)

    rich_count = sum(
        1 for f in RICH_FIELDS
        if data.get(f) is not None and data[f] != {}
    )

    score = len(present) + rich_count
    return score, present, missing


def main():
    force = "--force" in sys.argv

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        sys.exit(f"No PDFs found in {PDF_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    results = []   # (slug, score, data, skipped_reason)
    errors  = []   # (slug, error_msg)

    total = len(pdfs)
    for i, pdf in enumerate(pdfs, 1):
        slug = pdf.stem
        out  = OUTPUT_DIR / f"{slug}.json"

        if out.exists() and not force:
            print(f"[{i}/{total}] {slug}: skipping (already parsed)")
            with open(out, encoding="utf-8") as f:
                data = json.load(f)
            score, _, _ = score_completeness(data)
            results.append((slug, score, data, "already_done"))
            continue

        print(f"\n[{i}/{total}] Parsing {slug}...")
        proc = subprocess.run(
            [sys.executable, str(SCRIPT), str(pdf), slug],
            capture_output=False,
        )

        if proc.returncode != 0:
            print(f"  ERROR: parse-cds.py exited {proc.returncode} for {slug}")
            errors.append((slug, f"exit code {proc.returncode}"))
            continue

        if not out.exists():
            errors.append((slug, "output JSON not created"))
            continue

        with open(out, encoding="utf-8") as f:
            data = json.load(f)

        score, _, _ = score_completeness(data)
        results.append((slug, score, data, None))

    # ── Summary ────────────────────────────────────────────────────────────

    print("\n" + "=" * 60)
    print("BATCH COMPLETE")
    print("=" * 60)

    if errors:
        print(f"\nFailed ({len(errors)}):")
        for slug, msg in errors:
            print(f"  ✗ {slug}: {msg}")

    # Group by richness tier
    rich    = [(s, sc, d) for s, sc, d, _ in results if sc >= 12]
    partial = [(s, sc, d) for s, sc, d, _ in results if 6 <= sc < 12]
    sparse  = [(s, sc, d) for s, sc, d, _ in results if sc < 6]

    def show_group(label, group):
        print(f"\n── {label} ({len(group)} schools) ──")
        for slug, score, data in sorted(group, key=lambda x: -x[1]):
            name = data.get("name") or slug
            core = [f for f in CORE_ADMISSIONS_FIELDS if data.get(f) is not None]
            rich_present = [f for f in RICH_FIELDS
                            if data.get(f) is not None and data[f] != {}]
            print(f"  {slug:20s}  score={score:2d}  "
                  f"core={len(core)}/{len(CORE_ADMISSIONS_FIELDS)}  "
                  f"rich={len(rich_present)}/{len(RICH_FIELDS)}  "
                  f"({name})")

    show_group("RICH — full CDS data", rich)
    show_group("PARTIAL — some sections missing", partial)
    show_group("SPARSE — minimal data (Section A only or parse failure)", sparse)

    print(f"\nTotal parsed: {len(results)}  |  Errors: {len(errors)}\n")


if __name__ == "__main__":
    main()
