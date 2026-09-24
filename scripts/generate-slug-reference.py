#!/usr/bin/env python3
"""
generate-slug-reference.py — Regenerate SCHOOL_SLUGS.txt from
data/schools-{year}.json.

SCHOOL_SLUGS.txt is a human-facing reference (for you or a peer dropping a
new CDS file) listing the exact slug every current school uses. Re-run this
whenever a new school is added so the list stays current.

Usage:
    python scripts/generate-slug-reference.py --year 2025-2026
"""

import argparse
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

HEADER = """\
SCHOOL SLUGS — naming convention reference
===========================================

A school's "slug" is the one identifier used everywhere in this repo:
  - CDS input filename:  data/cds-pdfs/{{year}}/{{slug}}.pdf
                          data/cds-xlsx/{{year}}/{{slug}}.xlsx
  - Parsed output:       data/cds/{{year}}/{{slug}}.json
  - Site page:           schools/{{slug}}.html
  - Logo image:          images/logos/{{slug}}.png
  - Brand color key:     SCHOOL_META['{{slug}}'] in js/school.js

To add a CDS file for a school below, name it exactly <slug>.pdf or
<slug>.xlsx and drop it in data/cds-pdfs/{{year}}/ or data/cds-xlsx/{{year}}/
on the cds-data-staging branch.


HOW TO SUBMIT A CDS FILE (via github.com — no git or terminal needed)
-----------------------------------------------------------------------
1. On the repo's github.com page, switch the branch dropdown (top-left,
   above the file list) from "main" to "cds-data-staging". Never upload
   to "main" directly — staging is where files land for review before
   anything reaches the live site.

2. Click into the matching folder for your file type and year, e.g.:
     PDF:    data -> cds-pdfs -> 2025-2026
     Excel:  data -> cds-xlsx -> 2025-2026
   If that year's folder doesn't exist yet, don't worry — step 4 creates
   it automatically.

3. Before uploading, rename your file to exactly <slug>.pdf or
   <slug>.xlsx, using the slug from the list below (or pick a new one —
   see "ADDING A SCHOOL NOT ON THIS LIST"). Renaming after upload takes
   more clicks, so do it on your computer first.

4. Click "Add file" -> "Upload files" and drag your renamed file in.
   (If the year folder from step 2 didn't exist, type the full path into
   the box instead, e.g. "data/cds-pdfs/2025-2026/berkeley.pdf" — GitHub
   creates the missing folders for you.)

5. Scroll down to the commit box at the bottom. Leave "Commit directly to
   the cds-data-staging branch" selected — NOT "Create a new branch and
   start a pull request" (cds-data-staging already exists and already is
   that holding branch). Click "Commit changes".

6. Click the "Actions" tab at the top of the repo. Within about a minute,
   a run called "Parse CDS drop" appears — click it to watch it work.
   This makes a small real API call, so don't expect it to be instant.

7. When it finishes (green check), a new commit from "cds-bot" appears on
   cds-data-staging, e.g.:
     "berkeley (2025-2026): rich (14/20) | color: detected from logo"
   That rich/partial/sparse label is a rough completeness score — a
   "sparse" result usually means something went wrong and is worth a
   second look before anyone merges it.

8. That's it on your end — nothing is live yet. Files on cds-data-staging
   stay off the public site until someone merges it into main. Let
   whoever maintains this repo know a new file is ready for review,
   rather than merging it yourself unless you've been asked to.

If the run fails (red X): click into it and read the error. The two most
common causes for a new contributor are the file landing in the wrong
branch/folder (recheck steps 1-2) or the filename not matching a clean
<slug>.pdf / <slug>.xlsx pattern (recheck step 3).


ADDING A SCHOOL NOT ON THIS LIST
---------------------------------
Pick a new slug and just use it as the filename — the pipeline creates
everything else automatically (parsed JSON, site page, sitemap entry, and a
best-effort brand color looked up via web search since there's no logo yet
to sample from). Nothing needs to be registered ahead of time.

Slug conventions to follow (so it matches the style of every slug below):
  - lowercase, hyphen-separated (e.g. "boston-university", not "BU" or
    "Boston University")
  - drop filler words: no "university"/"college"/"the" (e.g. "duke", not
    "duke-university"; "unc", not "university-of-north-carolina")
  - use the school's common short name where one exists (e.g. "berkeley",
    not "uc-berkeley"; "umich", not "university-of-michigan")
  - for multi-campus systems, keep the campus name: "uc-san-diego",
    "uc-irvine", "washington-seattle"

What still needs a human after a brand-new school's first CDS file is
parsed (the pipeline will flag these in the cds-data-staging commit
message rather than silently skip them):
  - Logo artwork — drop a PNG at images/logos/{{slug}}.png (see
    scripts/convert-logos.js to normalize raw logo files), which also
    upgrades the brand color from an AI web-search guess to one sampled
    directly from the logo on the next run
  - A quick sanity check that the auto-picked slug doesn't collide with or
    near-duplicate an existing one below


CURRENT SCHOOLS ({count} total)
--------------------------------
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", default="2025-2026", help="CDS year, e.g. 2025-2026")
    args = parser.parse_args()

    data_path = REPO_ROOT / "data" / f"schools-{args.year}.json"
    schools = sorted(json.loads(data_path.read_text(encoding="utf-8"))["schools"], key=lambda s: s["slug"])

    out_path = REPO_ROOT / "SCHOOL_SLUGS.txt"
    width = max(len(s["slug"]) for s in schools) + 2
    lines = [f"{s['slug']:<{width}} {s.get('name') or '(name not parsed)'}" for s in schools]

    out_path.write_text(HEADER.format(count=len(schools)) + "\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(schools)} schools -> {out_path}")


if __name__ == "__main__":
    main()
