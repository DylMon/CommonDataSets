#!/usr/bin/env python3
"""
build-cds-json.py — Combine data/cds/{CDS_YEAR}/*.json into data/cds-{CDS_YEAR}.json

Local replacement for the old seed-cds.js -> Supabase -> export-data.js round
trip: reads the per-school files written by parse-cds-batch.py and writes a
single aggregate file in the same shape as data/cds-2024-2025.json, so it
stays a drop-in source for whatever assembles data/schools.json next.

Usage:
    python scripts/build-cds-json.py
"""

import json
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CDS_YEAR = "2025-2026"
CDS_YEAR_SHORT = "2025-26"
INPUT_DIR = REPO_ROOT / "data" / "cds" / CDS_YEAR
OUTPUT_PATH = REPO_ROOT / "data" / f"cds-{CDS_YEAR}.json"


def main():
    files = sorted(INPUT_DIR.glob("*.json"), key=lambda p: p.stem)
    if not files:
        raise SystemExit(f"No parsed JSON files found in {INPUT_DIR}")

    schools = []
    for i, f in enumerate(files, start=1):
        with open(f, encoding="utf-8") as fh:
            data = json.load(fh)
        data.setdefault("slug", f.stem)
        schools.append({"id": i, **data})

    payload = {
        "generated": date.today().isoformat(),
        "cds_year": CDS_YEAR_SHORT,
        "schools": schools,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)

    print(f"Wrote {len(schools)} schools -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
