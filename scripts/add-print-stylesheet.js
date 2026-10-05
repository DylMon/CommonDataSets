// scripts/add-print-stylesheet.js
//
// One-time migration: inserts the print.css <link> into every existing
// schools/{slug}/index.html (generate-school-pages.js's template already
// carries it for any school page created after this ran). Idempotent —
// skips any file that already has the link.
//
// Run:  node scripts/add-print-stylesheet.js

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCHOOLS_DIR = join(ROOT, 'schools');

const ANCHOR = /^( *<link rel="stylesheet" href="\/css\/school-template\.css\?v=6">)(\r?\n)/m;

const slugs = readdirSync(SCHOOLS_DIR).filter(f =>
  statSync(join(SCHOOLS_DIR, f)).isDirectory() && existsSync(join(SCHOOLS_DIR, f, 'index.html'))
);

let updated = 0;
let skipped = 0;

for (const slug of slugs) {
  const path = join(SCHOOLS_DIR, slug, 'index.html');
  const html = readFileSync(path, 'utf8');
  if (html.includes('print.css')) { skipped++; continue; }
  if (!ANCHOR.test(html)) {
    console.warn(`  ! ${slug}: school-template.css link not found in expected form, skipping`);
    skipped++;
    continue;
  }
  const updatedHtml = html.replace(ANCHOR, (_, line, eol) =>
    `${line}${eol}  <link rel="stylesheet" href="/css/print.css?v=1" media="print">${eol}`);
  writeFileSync(path, updatedHtml, 'utf8');
  updated++;
}

console.log(`Updated ${updated} page(s). Skipped ${skipped} (already present or unexpected format).`);
