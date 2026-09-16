#!/usr/bin/env python3
"""
build-cds-json.py — Combine data/cds/{year}/*.json into data/cds-{year}.json,
then sync that to data/schools-{year}.json (the file the frontend fetches).

Local replacement for the old seed-cds.js -> Supabase -> export-data.js round
trip: reads the per-school files written by parse-cds-batch.py/parse-cds.py
and writes a single aggregate file. data/cds-{year}.json and
data/schools-{year}.json have always been kept identical by hand (a manual
`cp` after every run) — this script now does that copy itself so nothing
downstream needs a separate sync step.

Usage:
    python scripts/build-cds-json.py --year 2025-2026
"""

import argparse
import json
import re
import shutil
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Per-school filenames carry a trailing year suffix, e.g. harvard-2526.json —
# strip it to recover the bare slug when a file doesn't already set one itself.
YEAR_SUFFIX_RE = re.compile(r"-\d{4}$")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", default="2025-2026", help="CDS year, e.g. 2025-2026")
    args = parser.parse_args()

    parts = args.year.split("-")
    year_short = f"{parts[0]}-{parts[1][2:]}" if len(parts) == 2 else args.year

    input_dir = REPO_ROOT / "data" / "cds" / args.year
    cds_path = REPO_ROOT / "data" / f"cds-{args.year}.json"
    schools_path = REPO_ROOT / "data" / f"schools-{args.year}.json"

    files = sorted(input_dir.glob("*.json"), key=lambda p: p.stem)
    if not files:
        raise SystemExit(f"No parsed JSON files found in {input_dir}")

    schools = []
    for i, f in enumerate(files, start=1):
        with open(f, encoding="utf-8") as fh:
            data = json.load(fh)
        data.setdefault("slug", YEAR_SUFFIX_RE.sub("", f.stem))
        schools.append({"id": i, **data})

    payload = {
        "generated": date.today().isoformat(),
        "cds_year": year_short,
        "schools": schools,
    }

    with open(cds_path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)
    shutil.copyfile(cds_path, schools_path)

    print(f"Wrote {len(schools)} schools -> {cds_path}")
    print(f"Synced -> {schools_path}")


if __name__ == "__main__":
    main()
