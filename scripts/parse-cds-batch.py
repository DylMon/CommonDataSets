#!/usr/bin/env python3
"""
parse-cds-batch.py — Parse all not-yet-parsed CDS PDFs in one Message Batch.

Submits every unparsed PDF in data/cds-pdfs/{CDS_YEAR}/ as a single Anthropic
Message Batch request (50% cheaper than sequential calls, no per-request
rate-limit pressure — a good fit since this isn't latency-sensitive). Polls
until the batch finishes, then writes data/cds/{CDS_YEAR}/{slug}.json for
each school and prints a completion summary grouped by data richness.

To parse a different year, update CDS_YEAR below.

Usage:
    python scripts/parse-cds-batch.py [--force]

    --force  Re-parse schools that already have a JSON output.

Requirements:
    pip install -r requirements-cds.txt
    ANTHROPIC_API_KEY must be set in .env or the environment
"""

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

REPO_ROOT = Path(__file__).resolve().parent.parent
CDS_YEAR = "2025-2026"
PDF_DIR = REPO_ROOT / "data" / "cds-pdfs" / CDS_YEAR
OUTPUT_DIR = REPO_ROOT / "data" / "cds" / CDS_YEAR

POLL_INTERVAL_SECONDS = 30

CORE_ADMISSIONS_FIELDS = [
    "applicants_total", "admitted_total", "enrolled_total",
    "acceptance_rate", "sat_composite_25", "act_composite_25",
    "total_undergrads", "tuition",
]

RICH_FIELDS = [
    "gpa_distribution", "admission_factors", "demographics_detail",
    "transfer_stats", "class_rank", "applicant_pools",
]


def score_completeness(data: dict) -> int:
    present = sum(1 for f in CORE_ADMISSIONS_FIELDS if data.get(f) is not None)
    rich = sum(1 for f in RICH_FIELDS if data.get(f) is not None and data[f] != {})
    return present + rich


def show_group(label: str, group: list[tuple[str, int, dict]]) -> None:
    print(f"\n-- {label} ({len(group)} schools) --")
    for slug, score, data in sorted(group, key=lambda x: -x[1]):
        name = data.get("name") or slug
        core = sum(1 for f in CORE_ADMISSIONS_FIELDS if data.get(f) is not None)
        rich = sum(1 for f in RICH_FIELDS if data.get(f) is not None and data[f] != {})
        print(f"  {slug:20s}  score={score:2d}  core={core}/{len(CORE_ADMISSIONS_FIELDS)}  "
              f"rich={rich}/{len(RICH_FIELDS)}  ({name})")


def main():
    force = "--force" in sys.argv

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        sys.exit(f"No PDFs found in {PDF_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    already_done = []  # (slug, score, data)
    to_parse = []       # (slug, pdf_path)
    for pdf in pdfs:
        slug = pdf.stem
        out = OUTPUT_DIR / f"{slug}.json"
        if out.exists() and not force:
            with open(out, encoding="utf-8") as f:
                data = json.load(f)
            already_done.append((slug, score_completeness(data), data))
        else:
            to_parse.append((slug, pdf))

    print(f"Already parsed: {len(already_done)}  |  To parse: {len(to_parse)}")
    if not to_parse:
        print("Nothing to do — pass --force to re-parse existing schools.")
    else:
        client = anthropic.Anthropic()

        print(f"\nBuilding batch of {len(to_parse)} request(s)...")
        requests = []
        build_errors = []
        for slug, pdf in to_parse:
            try:
                requests.append({"custom_id": slug, "params": build_request_params(pdf)})
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
            out = OUTPUT_DIR / f"{slug}.json"
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
        rich = [(s, sc, d) for s, sc, d in all_results if sc >= 12]
        partial = [(s, sc, d) for s, sc, d in all_results if 6 <= sc < 12]
        sparse = [(s, sc, d) for s, sc, d in all_results if sc < 6]

        show_group("RICH — full CDS data", rich)
        show_group("PARTIAL — some sections missing", partial)
        show_group("SPARSE — minimal data (Section A only or parse failure)", sparse)

        print(f"\nNewly parsed: {len(newly_parsed)}  |  Errors: {len(errors)}  |  "
              f"Total on disk: {len(all_results)}\n")


if __name__ == "__main__":
    main()
