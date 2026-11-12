// scripts/update-school-meta.js
//
// One-off migration: rewrites the meta/og/twitter description on already-
// generated schools/{slug}/index.html pages to match the new pattern in
// generate-school-pages.js's buildDescription() (adds "Common Data Set
// (CDS)" alongside "admissions data" for SEO). generate-school-pages.js
// only writes pages that don't yet exist, so this script patches the ones
// that are already on disk.
//
// (The <title>/og:title/twitter:title change was applied separately via a
// blanket find-and-replace, since every existing page shares the exact same
// " Admissions Data - CommonDataSets" suffix regardless of description
// staleness — see commit history around 2026-11-11.)
//
// Safety: only rewrites a page's description if it exactly matches the OLD
// auto-generated pattern computed from this school's current JSON data.
// Pages whose on-page description doesn't match (hand-tuned copy, or baked-
// in stats that have since drifted from the JSON) are left untouched and
// reported for manual review — silently "fixing" stale stats as a side
// effect of a copy change would be its own, separate risk.
//
// Run:  node scripts/update-school-meta.js [--year 2025-2026] [--dry-run]

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function getYearArg() {
  const i = process.argv.indexOf('--year');
  return i === -1 ? '2025-2026' : process.argv[i + 1];
}

const DRY_RUN = process.argv.includes('--dry-run');
const SCHOOLS_DATA_PATH = join(ROOT, 'data', `schools-${getYearArg()}.json`);
const SCHOOLS_DIR = join(ROOT, 'schools');

function descriptionParts(s, labelFn) {
  const parts = [labelFn(s)];
  if (s.acceptance_rate != null) parts.push(`${(s.acceptance_rate * 100).toFixed(1)}% acceptance rate`);
  const sat25 = s.sat_composite_25, sat75 = s.sat_composite_75;
  if (sat25 != null && sat75 != null) parts.push(`${Math.round((sat25 + sat75) / 2)} SAT average`);
  if (s.location) parts.push(s.location);
  parts.push('SAT/ACT scores, GPA, tuition, and student demographics.');
  return parts.join(' · ');
}

const oldDescription = s => descriptionParts(s, s => `${s.name} admissions data for ${s.data_year || '2025-26'}`);
const newDescription = s => descriptionParts(s, s => `${s.name} Common Data Set (CDS) and admissions data for ${s.data_year || '2025-26'}`);

function countOccurrences(haystack, needle) {
  if (needle === '') return 0;
  let count = 0, idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) { count++; idx += needle.length; }
  return count;
}

function main() {
  const { schools } = JSON.parse(readFileSync(SCHOOLS_DATA_PATH, 'utf8'));

  const updated = [];
  const skippedNoFile = [];
  const skippedMismatch = [];

  for (const s of schools) {
    const filePath = join(SCHOOLS_DIR, s.slug, 'index.html');
    if (!existsSync(filePath)) { skippedNoFile.push(s.slug); continue; }

    const html = readFileSync(filePath, 'utf8');
    const oldD = oldDescription(s);
    const descCount = countOccurrences(html, oldD);

    if (descCount !== 3) {
      skippedMismatch.push({ slug: s.slug, descCount });
      continue;
    }

    const newD = newDescription(s);
    const out = html.split(oldD).join(newD);

    if (!DRY_RUN) writeFileSync(filePath, out, 'utf8');
    updated.push(s.slug);
  }

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}Updated ${updated.length} page(s).`);
  console.log(`Skipped (no file on disk): ${skippedNoFile.length}${skippedNoFile.length ? ' — ' + skippedNoFile.join(', ') : ''}`);
  console.log(`Skipped (description didn't match expected auto-generated pattern — review manually): ${skippedMismatch.length}`);
  for (const m of skippedMismatch) {
    console.log(`  - ${m.slug} (descCount=${m.descCount})`);
  }
}

main();
