// scripts/generate-school-pages.js
//
// Generates the thin static SEO shell at schools/{slug}.html for any school
// in data/schools-2025-2026.json that doesn't already have one, and rewrites
// sitemap.xml to cover every school currently on disk. Actual page content
// (hero, stats, tables, charts) is rendered client-side by js/school.js from
// SCHOOL_SLUG — these shells only carry the <title>/<meta description> baked
// in at generation time for SEO.
//
// No longer reads from Supabase — pulls straight from the local JSON file
// that's already the site's live data source.
//
// Run:  node scripts/generate-school-pages.js
// Only writes pages that don't already exist; existing pages (including the
// original 33, which may have hand-tuned descriptions) are left untouched.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCHOOLS_DATA_PATH = join(ROOT, 'data', 'schools-2025-2026.json');
const SCHOOLS_DIR = join(ROOT, 'schools');

function buildDescription(s) {
  const parts = [`${s.name} admissions data for ${s.data_year || '2025-26'}`];
  if (s.acceptance_rate != null) parts.push(`${(s.acceptance_rate * 100).toFixed(1)}% acceptance rate`);
  const sat25 = s.sat_composite_25, sat75 = s.sat_composite_75;
  if (sat25 != null && sat75 != null) parts.push(`${Math.round((sat25 + sat75) / 2)} SAT average`);
  if (s.location) parts.push(s.location);
  parts.push('SAT/ACT scores, GPA, tuition, and student demographics.');
  return parts.join(' · ');
}

function pageHtml(slug, name, description) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name} Admissions Data — CommonDataSets</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="https://commondatasets.com/schools/${slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Ropa+Sans:ital@0;1&family=Castoro:ital@0;1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/base.css?v=4">
  <link rel="stylesheet" href="../css/school-template.css?v=4">
  <script>var SCHOOL_SLUG = '${slug}';</script>
  <script src="../js/header.js?v=4" defer></script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2245119166025427" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js" defer></script>
  <script type="module" src="../js/school.js?v=4"></script>
</head>
<body>
  <div class="container">
    <div id="school-hero"></div>
    <div class="stats-strip" id="stats-strip"></div>
    <div class="school-sections" id="school-sections">
      <p class="loading">Loading…</p>
    </div>
  </div>
</body>
</html>
`;
}

function sitemapXml(slugs) {
  const schoolUrls = slugs.map(slug => `
  <url>
    <loc>https://commondatasets.com/schools/${slug}.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>https://commondatasets.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://commondatasets.com/compare.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://commondatasets.com/chanceme.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
${schoolUrls}
</urlset>
`;
}

function main() {
  const { schools } = JSON.parse(readFileSync(SCHOOLS_DATA_PATH, 'utf8'));

  const existingSlugs = new Set(
    readdirSync(SCHOOLS_DIR)
      .filter(f => f.endsWith('.html') && f !== 'school.html')
      .map(f => f.slice(0, -'.html'.length))
  );

  const created = [];
  const skipped = [];

  for (const s of schools) {
    const outPath = join(SCHOOLS_DIR, `${s.slug}.html`);
    if (existsSync(outPath)) {
      skipped.push(s.slug);
      continue;
    }
    const description = buildDescription(s);
    writeFileSync(outPath, pageHtml(s.slug, s.name, description), 'utf8');
    created.push(s.slug);
    console.log(`  + schools/${s.slug}.html`);
  }

  console.log(`\nCreated ${created.length} new page(s). Skipped ${skipped.length} already present.`);

  // Sitemap covers every school currently on disk, not just the ones created this run.
  const allSlugs = [...existingSlugs, ...created].sort();
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml(allSlugs), 'utf8');
  console.log(`Wrote sitemap.xml with ${allSlugs.length} school URLs.`);
}

main();
