# CommonDataSets

Static site publishing college admissions data (Common Data Set + College Scorecard) for ~165 schools. No frontend framework, no build step — plain HTML/CSS/vanilla JS modules served as static files.

## Architecture

- **No database.** Supabase was used historically and has been fully phased out — dependency/SQL files/scripts still reference it but nothing live uses it. Don't reintroduce it or trust old comments that mention it as "the backend."
- All data lives in static JSON under `data/`, fetched client-side with `fetch('/data/...')`. Key files: `data/schools-{year}.json` (main per-school dataset the frontend reads), `data/scorecard-{year}.json` (College Scorecard data), `data/categories.json` and `data/us-news-ranking.json` (hand-maintained overlays merged in at build time).
- `js/scorecard-merge.js` merges CDS + Scorecard data client-side; CDS wins on field collisions.
- `supabase/*.sql` is legacy schema, not applied to anything live.

## Data pipeline (local scripts, not run in CI except CDS parsing)

1. `scripts/parse-cds.py` / `parse-cds-batch.py` — Claude-assisted extraction of CDS PDFs/xlsx into `data/cds/{year}/{slug}.json`. Runs via `.github/workflows/parse-cds*.yml` on the `cds-data-staging` branch only (never main).
2. `scripts/build-cds-json.py` — aggregates per-school CDS JSON + the hand-maintained overlays into `data/cds-{year}.json` and `data/schools-{year}.json` (default year `2025-2026` — don't assume `2023-24`, that was the old pinned year and is now stale except where it's a school's genuine last-filed year under `data/cds/2023-2024/`).
3. `scripts/fetch-scorecard-2025-2026.py` — pulls College Scorecard API data into `data/scorecard-{year}.json` independently.
4. `node scripts/generate-school-pages.js` (`npm run generate`) — reads `data/schools-{year}.json` directly (no Supabase, no hardcoded name map) and writes `schools/<slug>/index.html` + `sitemap.xml` for any school that doesn't already have a page. By default, existing pages are never overwritten, so their baked-in `<title>`/meta description stats (acceptance rate, SAT, year, location) silently go stale as the JSON data updates. Run with `--force` to refresh existing pages' title/meta/og/twitter tags and the static intro paragraph (see below) from current data — it preserves each page's existing short display name (e.g. "MIT" instead of reverting to the JSON's full "Massachusetts Institute of Technology") and preserves (rather than recomputes) the description text for any page with genuinely hand-edited wording instead of just stale stats (currently only `princeton`, which uses an SAT range instead of an average — see `hasStandardDescriptionShape()` in the script).

## Static intro paragraph (SEO body copy)

Every school page has one hardcoded, human-visible sentence (`<p class="page-intro-desc school-intro-desc">`) injected by `generate-school-pages.js`'s `pageHtml()`, placed as a static sibling right after `<div id="stats-strip">`. This exists because `js/school.js` wholesale-replaces `#school-hero`/`#stats-strip`/`#school-sections` via `.innerHTML =` — anything placed *inside* those is destroyed on first render, so this sentence has to live outside all three as a sibling, where JS never touches it. `js/school.js` inserts the CTA/year-bar/quick-facts strips via `insertAdjacentHTML('afterend')` anchored at `#stats-strip`, which always lands them as the new immediate next sibling and pushes this paragraph down past all of them — so after render it ends up sitting between the quick-facts strip and the detailed CDS tables, not at the very top. Don't move this element inside any of the three JS-owned containers.

The sentence (`buildIntroSentence()`) is deliberately year-agnostic ("Explore {school}'s Common Data Set (CDS) data, including admissions statistics, tuition, and demographics.") — it's static and never updates, but `js/school.js`'s year switcher (`renderForYear`) lets visitors view older CDS years client-side, so naming a specific year here would go stale the moment someone switches. Don't reintroduce a year into this copy without also wiring it to `renderForYear`.



`npm run seed:cds` / `seed:scorecard` / `export` in package.json are the **old Supabase-era scripts** — don't use them; they're dead weight kept for reference pending removal.

## Adding or updating a school

1. Get the school's data into `data/schools-{year}.json` via the CDS/Scorecard pipeline above (not by hand-editing the JSON directly, unless just patching one field).
2. Add an entry to `SCHOOL_META` in `js/school.js` (brand color + banner filename).
3. Drop the logo at `images/logos/<slug>.png` (exact filename match, no code change needed) and the banner at `images/banners/<slug>.png`.
4. Optionally add a per-school CSS override at `css/<slug>.css` if the default brand color isn't enough.
5. Run `npm run generate` to create `schools/<slug>/index.html` and update `sitemap.xml`.
6. Commit the new/changed files.

School pages are directory-per-slug (`schools/<slug>/index.html`); old `schools/<slug>.html` files are redirect stubs only (see `scripts/migrate-clean-urls.js`) — don't edit those directly.

## Testing & linting

There is none configured — no test framework, no ESLint/Prettier config. Don't assume `npm test` or `npm run lint` exist.

## Running locally

No dev server script beyond `scripts/serve-local.py` (plain static file server, fixes `.js` MIME type on Windows). Otherwise just open the static files or serve the root with any static file server.

## Deployment

`CNAME` → `commondatasets.com`. No deploy workflow in CI — only the CDS-parsing workflows exist, and those run on a staging branch, not main. Assume deploys happen outside this repo's CI (e.g. manually or via host-level sync) unless told otherwise.
