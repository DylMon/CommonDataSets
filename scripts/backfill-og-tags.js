// scripts/backfill-og-tags.js
//
// One-time retrofit: inserts the same OG/Twitter card block that
// generate-school-pages.js now bakes into newly-created pages into every
// schools/{slug}/index.html that was already on disk before that change
// (generate-school-pages.js only writes pages that don't yet exist, so it
// never touches these retroactively). Reuses each page's own already-baked
// <title>/<meta description>/canonical — no data file is read, this is a
// pure text transform of existing head content.
//
// Idempotent: skips any file that already has an og:title tag, so it's
// safe to re-run (e.g. after a school page gets hand-edited later).
//
// Run:  node scripts/backfill-og-tags.js

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCHOOLS_DIR = join(ROOT, 'schools');

function ogBlock({ title, description, url }) {
  return `  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CommonDataSets">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://commondatasets.com/images/og-share.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://commondatasets.com/images/og-share.png">
`;
}

function main() {
  const slugs = readdirSync(SCHOOLS_DIR)
    .filter(f => statSync(join(SCHOOLS_DIR, f)).isDirectory())
    .filter(f => existsSync(join(SCHOOLS_DIR, f, 'index.html')))
    .sort();

  let updated = 0, skipped = 0, failed = [];

  for (const slug of slugs) {
    const path = join(SCHOOLS_DIR, slug, 'index.html');
    const html = readFileSync(path, 'utf8');

    if (html.includes('property="og:title"')) {
      skipped++;
      continue;
    }

    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const descMatch = html.match(/<meta name="description" content="(.*?)">/);
    const canonicalMatch = html.match(/<link rel="canonical" href="(.*?)">/);

    if (!titleMatch || !descMatch || !canonicalMatch) {
      failed.push(slug);
      continue;
    }

    const block = ogBlock({
      title: titleMatch[1],
      description: descMatch[1],
      url: canonicalMatch[1],
    });

    const canonicalLine = canonicalMatch[0];
    const next = html.replace(canonicalLine, canonicalLine + '\n' + block.trimEnd());

    writeFileSync(path, next, 'utf8');
    updated++;
  }

  console.log(`Updated ${updated} page(s). Skipped ${skipped} already-tagged. Failed ${failed.length}.`);
  if (failed.length) console.log('Could not find title/description/canonical in:', failed);
}

main();
