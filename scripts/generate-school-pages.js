import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

const SCHOOL_NAMES = {
  'mit':          'MIT',
  'harvard':      'Harvard University',
  'stanford':     'Stanford University',
  'princeton':    'Princeton University',
  'yale':         'Yale University',
  'columbia':     'Columbia University',
  'upenn':        'University of Pennsylvania',
  'caltech':      'Caltech',
  'duke':         'Duke University',
  'jhu':          'Johns Hopkins University',
  'northwestern': 'Northwestern University',
  'dartmouth':    'Dartmouth College',
  'brown':        'Brown University',
  'vanderbilt':   'Vanderbilt University',
  'rice':         'Rice University',
  'washu':        'Washington University in St. Louis',
  'notre-dame':   'University of Notre Dame',
  'cornell':      'Cornell University',
  'uchicago':     'University of Chicago',
  'cmu':          'Carnegie Mellon University',
  'georgetown':   'Georgetown University',
  'emory':        'Emory University',
  'wake-forest':  'Wake Forest University',
  'tufts':        'Tufts University',
  'ucla':         'UCLA',
  'berkeley':     'UC Berkeley',
  'ucsb':         'UC Santa Barbara',
  'uva':          'University of Virginia',
  'umich':        'University of Michigan',
  'unc':          'UNC Chapel Hill',
  'uf':           'University of Florida',
  'usc':          'University of Southern California',
  'nyu':          'New York University',
};

function buildDescription(s) {
  const parts = [`${s.name} admissions data for 2023–24`];
  if (s.acceptance_rate != null) parts.push(`${(s.acceptance_rate * 100).toFixed(1)}% acceptance rate`);
  if (s.sat_avg)                 parts.push(`${s.sat_avg} SAT average`);
  if (s.location)                parts.push(s.location);
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
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/base.css?v=2">
  <link rel="stylesheet" href="../css/school-template.css?v=2">
  <script>var SCHOOL_SLUG = '${slug}';</script>
  <script src="../js/header.js?v=2" defer></script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2245119166025427" crossorigin="anonymous"></script>
  <script type="module" src="../js/school.js?v=2"></script>
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
${schoolUrls}
</urlset>
`;
}

async function main() {
  console.log('Fetching school data from Supabase…');
  const { data: schools, error } = await supabase
    .from('schools')
    .select('slug, name, acceptance_rate, sat_avg, location')
    .eq('data_year', '2023-24');

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  const bySlug = Object.fromEntries(schools.map(s => [s.slug, s]));
  const slugs = Object.keys(SCHOOL_NAMES);
  const generated = [];

  for (const slug of slugs) {
    const s = bySlug[slug];
    if (!s) {
      console.warn(`  SKIP ${slug} — not found in DB`);
      continue;
    }
    const name = s.name || SCHOOL_NAMES[slug];
    const description = buildDescription(s);
    const html = pageHtml(slug, name, description);
    const outPath = join(ROOT, 'schools', `${slug}.html`);
    writeFileSync(outPath, html, 'utf8');
    generated.push(slug);
    console.log(`  ✓ schools/${slug}.html`);
  }

  const sitemapPath = join(ROOT, 'sitemap.xml');
  writeFileSync(sitemapPath, sitemapXml(generated), 'utf8');
  console.log(`\nWrote sitemap.xml with ${generated.length} school URLs.`);
  console.log(`Generated ${generated.length} pages.`);
}

main();
