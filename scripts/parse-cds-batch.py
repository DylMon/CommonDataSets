#!/usr/bin/env python3
"""
parse-cds-batch.py — Parse all not-yet-parsed CDS PDFs/xlsx in one Message Batch.

Submits every unparsed file in data/cds-pdfs/{year}/ and data/cds-xlsx/{year}/
as a single Anthropic Message Batch request (50% cheaper than sequential
calls, no per-request rate-limit pressure — a good fit since this isn't
latency-sensitive). Polls until the batch finishes, then writes
data/cds/{year}/{slug}.json for each school and prints a completion summary
grouped by data richness.

Usage:
    python scripts/parse-cds-batch.py --year 2025-2026 [--force]

    --force  Re-parse schools that already have a JSON output.

Requirements:
    pip install -r requirements-cds.txt
    ANTHROPIC_API_KEY must be set in .env or the environment
"""

import argparse
import sys
import json
import time
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

import importlib.util

_spec = importlib.util.spec_from_file_location(
    "parse_cds", Path(__file__).resolve().parent / "parse-cds.py"
)
_parse_cds = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_parse_cds)
build_request_params = _parse_cds.build_request_params
extract_json = _parse_cds.extract_json
score_completeness = _parse_cds.score_completeness

REPO_ROOT = Path(__file__).resolve().parent.parent

POLL_INTERVAL_SECONDS = 30


def show_group(label: str, group: list[tuple[str, int, dict]]) -> None:
    print(f"\n-- {label} ({len(group)} schools) --")
    for slug, score, data in sorted(group, key=lambda x: -x[1]):
        name = data.get("name") or slug
        core = sum(1 for f in _parse_cds.CORE_ADMISSIONS_FIELDS if data.get(f) is not None)
        rich = sum(1 for f in _parse_cds.RICH_FIELDS if data.get(f) is not None and data[f] != {})
        print(f"  {slug:20s}  score={score:2d}  core={core}/{len(_parse_cds.CORE_ADMISSIONS_FIELDS)}  "
              f"rich={rich}/{len(_parse_cds.RICH_FIELDS)}  ({name})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", required=True, help="CDS year, e.g. 2025-2026")
    parser.add_argument("--force", action="store_true", help="Re-parse schools that already have a JSON output")
    args = parser.parse_args()

    pdf_dir = REPO_ROOT / "data" / "cds-pdfs" / args.year
    xlsx_dir = REPO_ROOT / "data" / "cds-xlsx" / args.year
    output_dir = REPO_ROOT / "data" / "cds" / args.year

    files = sorted(pdf_dir.glob("*.pdf")) + sorted(xlsx_dir.glob("*.xlsx"))
    if not files:
        sys.exit(f"No PDFs or xlsx files found in {pdf_dir} or {xlsx_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)

    already_done = []  # (slug, score, data)
    to_parse = []       # (slug, path)
    for path in files:
        slug = path.stem
        out = output_dir / f"{slug}.json"
        if out.exists() and not args.force:
            with open(out, encoding="utf-8") as f:
                data = json.load(f)
            already_done.append((slug, score_completeness(data), data))
        else:
            to_parse.append((slug, path))

    print(f"Already parsed: {len(already_done)}  |  To parse: {len(to_parse)}")
    if not to_parse:
        print("Nothing to do — pass --force to re-parse existing schools.")
    else:
        client = anthropic.Anthropic()

        print(f"\nBuilding batch of {len(to_parse)} request(s)...")
        requests = []
        build_errors = []
        for slug, path in to_parse:
            try:
                requests.append({"custom_id": slug, "params": build_request_params(path)})
            except Exception as e:
                build_errors.append((slug, str(e)))

        if build_errors:
            print(f"\nCould not build a request for {len(build_errors)} school(s):")
            for slug, msg in build_errors:
                print(f"  x {slug}: {msg}")

        if not requests:
            sys.exit("\nNo requests could be built.")

        batch = client.messages.batches.create(requests=requests)
        print(f"\nBatch submitted: {batch.id}")

        while batch.processing_status != "ended":
            time.sleep(POLL_INTERVAL_SECONDS)
            batch = client.messages.batches.retrieve(batch.id)
            counts = batch.request_counts
            print(f"  status={batch.processing_status}  "
                  f"processing={counts.processing} succeeded={counts.succeeded} "
                  f"errored={counts.errored} expired={counts.expired} canceled={counts.canceled}")

        print("\nBatch finished. Writing results...")
        errors = []
        newly_parsed = []  # (slug, score, data)
        for result in client.messages.batches.results(batch.id):
            slug = result.custom_id
            if result.result.type != "succeeded":
                detail = getattr(result.result, "error", None)
                errors.append((slug, f"{result.result.type}: {detail}"))
                continue
            try:
                data = extract_json(result.result.message.content)
            except (ValueError, json.JSONDecodeError) as e:
                errors.append((slug, f"could not parse response JSON: {e}"))
                continue
            data["slug"] = slug
            out = output_dir / f"{slug}.json"
            with open(out, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            newly_parsed.append((slug, score_completeness(data), data))

        print("\n" + "=" * 60)
        print("BATCH COMPLETE")
        print("=" * 60)

        if errors:
            print(f"\nFailed ({len(errors)}):")
            for slug, msg in errors:
                print(f"  x {slug}: {msg}")

        all_results = already_done + newly_parsed
        rich = [(s, sc, d) for s, sc, d in all_results if _parse_cds.completeness_label(sc) == "rich"]
        partial = [(s, sc, d) for s, sc, d in all_results if _parse_cds.completeness_label(sc) == "partial"]
        sparse = [(s, sc, d) for s, sc, d in all_results if _parse_cds.completeness_label(sc) == "sparse"]

        show_group("RICH — full CDS data", rich)
        show_group("PARTIAL — some sections missing", partial)
        show_group("SPARSE — minimal data (Section A only or parse failure)", sparse)

        print(f"\nNewly parsed: {len(newly_parsed)}  |  Errors: {len(errors)}  |  "
              f"Total on disk: {len(all_results)}\n")


if __name__ == "__main__":
    main()
