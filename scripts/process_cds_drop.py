#!/usr/bin/env python3
"""
process_cds_drop.py — CI glue for a CDS PDF/xlsx push.

Given a list of changed file paths under data/cds-pdfs/{year}/ or
data/cds-xlsx/{year}/ (as produced by `git diff` in the GitHub Actions
workflow), this:

  1. Parses each file with parse-cds.py's machinery -> data/cds/{year}/{slug}.json
  2. Runs scripts/detect-school-color.js for each newly-touched slug
     (no-ops if SCHOOL_META already has a color)
  3. Rebuilds data/cds-{year}.json + data/schools-{year}.json for every
     year touched (scripts/build-cds-json.py)
  4. Regenerates schools/{slug}.html + sitemap.xml for every year touched
     (scripts/generate-school-pages.js)
  5. Prints a human-readable summary (completeness score, color source, and
     any new-school flags) suitable for use as a commit message body —
     this is the signal a reviewer uses to decide what's safe to merge.

Usage:
    python scripts/process_cds_drop.py <path1> [path2 ...]
"""

import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
YEAR_RE = re.compile(r"^\d{4}-\d{4}$")

_spec = importlib.util.spec_from_file_location("parse_cds", REPO_ROOT / "scripts" / "parse-cds.py")
_parse_cds = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_parse_cds)


def process_one(path: Path) -> str:
    year = path.parent.name
    slug = path.stem

    if not YEAR_RE.match(year):
        return (f"! {path}: parent directory '{year}' doesn't look like a CDS year "
                f"(expected e.g. 2025-2026) — skipped. Move it to "
                f"data/{path.parent.parent.name}/{{year}}/{slug}{path.suffix} and re-push.")

    is_new = not (REPO_ROOT / "images" / "logos" / f"{slug}.png").exists() and \
        f"'{slug}':" not in (REPO_ROOT / "js" / "school.js").read_text(encoding="utf-8")

    output_dir = REPO_ROOT / "data" / "cds" / year
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{slug}.json"

    print(f"Parsing {path} -> {output_path} ...")
    data = _parse_cds.parse_with_claude(path)
    data["slug"] = slug
    output_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    score = _parse_cds.score_completeness(data)
    label = _parse_cds.completeness_label(score)

    print(f"Detecting brand color for {slug} ...")
    color_line = "color: unchanged (detection skipped or failed — see log above)"
    try:
        result = subprocess.run(
            ["node", str(REPO_ROOT / "scripts" / "detect-school-color.js"),
             "--slug", slug, "--name", data.get("name") or slug],
            capture_output=True, text=True, check=True,
        )
        print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
        last_line = result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ""
        color_line = f"color: {last_line}"
    except subprocess.CalledProcessError as e:
        print(e.stdout, e.stderr, file=sys.stderr)
        color_line = "color: detection script failed — see job log"

    summary = f"{slug} ({year}): {label} ({score}/20) | {color_line}"
    if is_new:
        summary += (f"\n    NEW SCHOOL detected — confirm '{slug}' isn't a duplicate of an "
                     f"existing entry, and drop a logo at images/logos/{slug}.png when available.")
    return summary


def main():
    paths = [Path(p) for p in sys.argv[1:]]
    if not paths:
        sys.exit("Usage: python scripts/process_cds_drop.py <path1> [path2 ...]")

    summaries = []
    years_touched = set()
    for path in paths:
        if not path.exists():
            summaries.append(f"! {path}: file not found (deleted in this push?) — skipped.")
            continue
        summaries.append(process_one(path))
        years_touched.add(path.parent.name)

    for year in sorted(years_touched):
        if not YEAR_RE.match(year):
            continue
        print(f"\nRebuilding aggregates for {year} ...")
        subprocess.run([sys.executable, str(REPO_ROOT / "scripts" / "build-cds-json.py"), "--year", year], check=True)
        subprocess.run(["node", str(REPO_ROOT / "scripts" / "generate-school-pages.js"), "--year", year], check=True)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for s in summaries:
        print(s)

    # Write the summary to a file the workflow can use directly as a commit
    # message body, since GITHUB_OUTPUT doesn't handle multi-line values well.
    (REPO_ROOT / "cds_drop_summary.txt").write_text("\n".join(summaries) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
