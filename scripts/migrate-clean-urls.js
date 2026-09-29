// scripts/migrate-clean-urls.js
//
// ONE-TIME migration: converts every existing flat schools/{slug}.html into
// schools/{slug}/index.html (the directory-per-school convention that makes
// the URL resolve without a .html extension — see generate-school-pages.js,
// which now always writes new schools in this form), preserving each page's
// existing <title>/<meta description> exactly rather than regenerating them
// (some of the original pages have hand-tuned SEO text this must not
// clobber). The old flat path is then overwritten with a redirect stub
// pointing at the new clean URL, since GitHub Pages has no server-side
// rewrite/redirect support — this is the strongest available signal
// (canonical tag + instant meta-refresh + JS fallback) short of a real 301.
//
// Only needs to run once, against whatever schools/*.html exist right now.
// Schools added after this migration are created directly in the new form
// by generate-school-pages.js and never had an old URL to redirect from.
//
// Run:  node scripts/migrate-clean-urls.js

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCHOOLS_DIR = join(ROOT, 'schools');

function redirectStub(newPath) {
  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <link rel="canonical" href="https://commondatasets.com${newPath}">
  <meta http-equiv="refresh" content="0; url=${newPath}">
  <script>location.replace('${newPath}');</script>
</head><body><p>This page has moved to <a href="${newPath}">${newPath}</a>.</p></body></html>
`;
}

function migrateOne(slug) {
  const oldPath = join(SCHOOLS_DIR, `${slug}.html`);
  const newDir = join(SCHOOLS_DIR, slug);
  const newPath = join(newDir, 'index.html');

  const oldHtml = readFileSync(oldPath, 'utf8');
  const title = oldHtml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? `${slug} Admissions Data — CommonDataSets`;
  const description = oldHtml.match(/<meta name="description" content="([\s\S]*?)">/)?.[1] ?? '';

  const newHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="https://commondatasets.com/schools/${slug}/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Ropa+Sans:ital@0;1&family=Castoro:ital@0;1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/base.css?v=6">
  <link rel="stylesheet" href="/css/school-template.css?v=6">
  <script>var SCHOOL_SLUG = '${slug}';</script>
  <script src="/js/header.js?v=6" defer></script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2245119166025427" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js" defer></script>
  <script type="module" src="/js/school.js?v=6"></script>
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

  mkdirSync(newDir, { recursive: true });
  writeFileSync(newPath, newHtml, 'utf8');
  unlinkSync(oldPath);
  writeFileSync(oldPath, redirectStub(`/schools/${slug}/`), 'utf8');
}

function main() {
  const slugs = readdirSync(SCHOOLS_DIR)
    .filter(f => f.endsWith('.html') && f !== 'school.html')
    .map(f => f.slice(0, -'.html'.length));

  if (!slugs.length) {
    console.log('No flat schools/*.html files found — nothing to migrate.');
    return;
  }

  console.log(`Migrating ${slugs.length} school page(s)...`);
  for (const slug of slugs) {
    migrateOne(slug);
    console.log(`  ${slug}.html -> ${slug}/index.html (+ redirect stub left at ${slug}.html)`);
  }
  console.log(`\nDone. Run 'node scripts/generate-school-pages.js' next to regenerate sitemap.xml with clean URLs.`);
}

main();
