// scripts/generate-school-pages.js
//
// Generates the thin static SEO shell at schools/{slug}/index.html for any
// school in data/schools-2025-2026.json that doesn't already have one, and
// rewrites sitemap.xml to cover every school currently on disk. Actual page
// content (hero, stats, tables, charts) is rendered client-side by
// js/school.js from SCHOOL_SLUG — these shells only carry the
// <title>/<meta description> baked in at generation time for SEO.
//
// A directory-per-school with its own index.html (rather than a flat
// schools/{slug}.html) is what makes the URL resolve without a .html
// extension (/schools/{slug}/) — the same convention the site's own
// homepage already relies on (index.html at the root serving as /).
//
// No longer reads from Supabase — pulls straight from the local JSON file
// that's already the site's live data source.
//
// Run:  node scripts/generate-school-pages.js
// By default, only writes pages that don't already exist; existing pages
// are left untouched (their baked-in stats go stale as the JSON data
// updates, since nothing regenerates them otherwise).
//
// Run with --force to also refresh every already-existing page's title/
// description/og/twitter tags and static intro paragraph from the current
// JSON data. A page's description is only recomputed if it ends with the
// exact standard closing clause (see STANDARD_CLOSING below) — pages with
// hand-edited wording that doesn't match (e.g. Princeton's SAT range
// instead of an average) keep their existing description verbatim, but
// still get the rest of the template refresh (including the new intro
// paragraph).

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function getYearArg() {
  const i = process.argv.indexOf('--year');
  return i === -1 ? '2025-2026' : process.argv[i + 1];
}

const FORCE = process.argv.includes('--force');
const SCHOOLS_DATA_PATH = join(ROOT, 'data', `schools-${getYearArg()}.json`);
const SCHOOLS_DIR = join(ROOT, 'schools');

// The fixed closing clause every auto-generated description ends with,
// regardless of which optional stats (acceptance rate/SAT/location) are
// present. A page whose description doesn't end with this exact sentence
// has hand-edited wording (e.g. Princeton's SAT range instead of average)
// rather than just stale stats in the standard template, so --force must
// never overwrite it.
const STANDARD_CLOSING = 'SAT/ACT scores, GPA, tuition, and student demographics.';

function hasStandardDescriptionShape(html) {
  const m = html.match(/<meta name="description" content="([^"]*)">/);
  if (!m) return false;
  const parts = m[1].split(' · ');
  return parts[parts.length - 1] === STANDARD_CLOSING;
}

function extractDescription(html) {
  const m = html.match(/<meta name="description" content="([^"]*)">/);
  return m ? m[1] : null;
}

// Many existing pages use a short display name in the title (e.g. "MIT",
// "UVA", "WashU") rather than the full official s.name from the JSON (e.g.
// "Massachusetts Institute of Technology"). --force must refresh stats
// without clobbering that branding choice, so pull whatever name is
// currently in the title and keep using it.
function extractDisplayName(html) {
  const m = html.match(/<title>(.*) Common Data Set & Admissions Data - CommonDataSets<\/title>/);
  return m ? m[1] : null;
}

function buildDescription(s) {
  const parts = [`${s.name} Common Data Set (CDS) and admissions data for ${s.data_year || '2025-26'}`];
  if (s.acceptance_rate != null) parts.push(`${(s.acceptance_rate * 100).toFixed(1)}% acceptance rate`);
  const sat25 = s.sat_composite_25, sat75 = s.sat_composite_75;
  if (sat25 != null && sat75 != null) parts.push(`${Math.round((sat25 + sat75) / 2)} SAT average`);
  if (s.location) parts.push(s.location);
  parts.push('SAT/ACT scores, GPA, tuition, and student demographics.');
  return parts.join(' · ');
}

// Static, human-visible SEO copy — js/school.js never touches this (see the
// placement comment in pageHtml() below), so it's safe to hardcode here
// rather than only existing after client-side render.
function buildIntroSentence(s) {
  const possessive = s.name.endsWith('s') ? `${s.name}'` : `${s.name}'s`;
  return `Explore ${possessive} Common Data Set (CDS) data for ${s.data_year || '2025-26'}, including admissions statistics, tuition, demographics, and more.`;
}

function pageHtml(slug, name, description, introSentence) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="/favicon.png">
  <title>${name} Common Data Set & Admissions Data - CommonDataSets</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="https://commondatasets.com/schools/${slug}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CommonDataSets">
  <meta property="og:title" content="${name} Common Data Set & Admissions Data - CommonDataSets">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="https://commondatasets.com/schools/${slug}/">
  <meta property="og:image" content="https://commondatasets.com/images/og-share.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${name} Common Data Set & Admissions Data - CommonDataSets">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://commondatasets.com/images/og-share.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=Spectral:wght@500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/base.css?v=6">
  <link rel="stylesheet" href="/css/school-template.css?v=6">
  <link rel="stylesheet" href="/css/print.css?v=1" media="print">
  <script>var SCHOOL_SLUG = '${slug}';</script>
  <script src="/js/header.js?v=6" defer></script>
  <script src="/js/header-search.js?v=1" defer></script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2245119166025427" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js" defer></script>
  <script src="/js/scorecard-merge.js?v=6"></script>
  <script type="module" src="/js/school.js?v=6"></script>
</head>
<body class="page-school">
  <div class="container">
    <div id="school-hero"></div>
    <div class="stats-strip" id="stats-strip"></div>
    <!-- Static, hardcoded SEO/intro copy. js/school.js inserts the CTA/
         year-bar/quick-facts strips via insertAdjacentHTML('afterend')
         anchored at #stats-strip, which always lands them as the new
         immediate next sibling — pushing this paragraph down past all of
         them on every render. End result: hero -> stats -> those strips ->
         this sentence -> #school-sections, without this element ever being
         touched by JS. Do not move it inside #school-hero/#stats-strip/
         #school-sections — those are wholesale innerHTML-replaced. -->
    <p class="page-intro-desc school-intro-desc">${introSentence}</p>
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
    <loc>https://commondatasets.com/schools/${slug}/</loc>
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
    <loc>https://commondatasets.com/compare/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://commondatasets.com/chanceme/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://commondatasets.com/info/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>https://commondatasets.com/contact/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>https://commondatasets.com/privacy/</loc>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>

  <url>
    <loc>https://commondatasets.com/terms/</loc>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
${schoolUrls}
</urlset>
`;
}

function main() {
  const { schools } = JSON.parse(readFileSync(SCHOOLS_DATA_PATH, 'utf8'));

  const existingSlugs = new Set(
    readdirSync(SCHOOLS_DIR)
      .filter(f => statSync(join(SCHOOLS_DIR, f)).isDirectory())
      .filter(f => existsSync(join(SCHOOLS_DIR, f, 'index.html')))
  );

  const created = [];
  const refreshed = [];
  const refreshedKeepingCustomDescription = [];
  const skipped = [];

  for (const s of schools) {
    const outDir = join(SCHOOLS_DIR, s.slug);
    const outPath = join(outDir, 'index.html');

    if (existsSync(outPath)) {
      if (!FORCE) { skipped.push(s.slug); continue; }
      const existingHtml = readFileSync(outPath, 'utf8');
      const displayName = extractDisplayName(existingHtml) ?? s.name;
      const introSentence = buildIntroSentence({ ...s, name: displayName });
      const isStandard = hasStandardDescriptionShape(existingHtml);
      // Hand-edited description wording (e.g. Princeton's SAT range instead
      // of an average) is preserved verbatim rather than recomputed — but
      // the page is still rewritten so it picks up the new intro paragraph
      // and any other template changes.
      const description = isStandard
        ? buildDescription({ ...s, name: displayName })
        : extractDescription(existingHtml);
      writeFileSync(outPath, pageHtml(s.slug, displayName, description, introSentence), 'utf8');
      (isStandard ? refreshed : refreshedKeepingCustomDescription).push(s.slug);
      console.log(`  ~ schools/${s.slug}/index.html (refreshed${isStandard ? '' : ', kept custom description'})`);
      continue;
    }

    mkdirSync(outDir, { recursive: true });
    const description = buildDescription(s);
    const introSentence = buildIntroSentence(s);
    writeFileSync(outPath, pageHtml(s.slug, s.name, description, introSentence), 'utf8');
    created.push(s.slug);
    console.log(`  + schools/${s.slug}/index.html`);
  }

  console.log(`\nCreated ${created.length} new page(s). Refreshed ${refreshed.length} existing page(s). Refreshed ${refreshedKeepingCustomDescription.length} keeping custom description wording: ${refreshedKeepingCustomDescription.join(', ')}. Skipped ${skipped.length} already present (no --force).`);

  // Sitemap covers every school currently on disk, not just the ones created this run.
  const allSlugs = [...existingSlugs, ...created].sort();
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml(allSlugs), 'utf8');
  console.log(`Wrote sitemap.xml with ${allSlugs.length} school URLs.`);
}

main();
