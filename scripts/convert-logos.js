// Convert + normalize school logos.
//
// Drop any logos (png / svg / webp / jpg / gif / avif) into:
//   images/logos/_incoming/
//
// Then run:
//   node scripts/convert-logos.js            # dry run: report only
//   node scripts/convert-logos.js --write    # write PNGs into images/logos/_staged/
//   node scripts/convert-logos.js --write --commit   # also move them into images/logos/
//
// Every file becomes  <slug>.png  where <slug> is a school slug (schools/<slug>.html).
// The script guesses the slug from the filename; anything it can't match
// confidently is left as  _unmatched__<cleaned-name>.png  for you to rename by hand.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const IN_DIR    = path.join(ROOT, 'images/logos/_incoming');
const STAGE_DIR = path.join(ROOT, 'images/logos/_staged');
const LOGO_DIR  = path.join(ROOT, 'images/logos');
const SCHOOL_DIR = path.join(ROOT, 'schools');

const WRITE  = process.argv.includes('--write');
const COMMIT = process.argv.includes('--commit');

const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.tiff']);
const MAX_EDGE   = 800;   // px, longest side of the output PNG
const SVG_DENSITY = 384;  // DPI used to rasterize SVGs before the resize

// ── known schools ────────────────────────────────────────────────────────────
const SLUGS = fs.readdirSync(SCHOOL_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => f.replace(/\.html$/, ''))
  .filter(s => s !== 'school');

// slug -> full name, pulled from whichever data file is present
let NAMES = {};
for (const f of ['data/schools-2025-2026.json', 'data/schools-2024-2025.json']) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const s of j.schools ?? []) if (s.slug && s.name) NAMES[s.slug] ??= s.name;
  } catch {}
}

// Hand aliases for names/abbreviations that won't slugify cleanly.
const ALIASES = {
  'uc-berkeley': 'berkeley', cal: 'berkeley', 'university-of-california-berkeley': 'berkeley',
  'university-of-california-los-angeles': 'ucla',
  'university-of-california-santa-barbara': 'ucsb', 'uc-santa-barbara': 'ucsb',
  'university-of-california-san-diego': 'uc-san-diego', ucsd: 'uc-san-diego',
  'university-of-california-irvine': 'uc-irvine', uci: 'uc-irvine',
  'university-of-california-davis': 'uc-davis', ucd: 'uc-davis',
  'university-of-california-santa-cruz': 'uc-santa-cruz', ucsc: 'uc-santa-cruz',
  'university-of-california-riverside': 'uc-riverside', ucr: 'uc-riverside',
  'university-of-california-merced': 'uc-merced',
  'johns-hopkins': 'jhu', 'johns-hopkins-university': 'jhu',
  'massachusetts-institute-of-technology': 'mit',
  'carnegie-mellon': 'cmu', 'carnegie-mellon-university': 'cmu',
  'university-of-chicago': 'uchicago', 'u-chicago': 'uchicago',
  'university-of-pennsylvania': 'upenn', penn: 'upenn',
  'university-of-michigan': 'umich', 'u-of-m': 'umich', michigan: 'umich',
  'university-of-virginia': 'uva',
  'university-of-north-carolina': 'unc', 'unc-chapel-hill': 'unc',
  'university-of-florida': 'uf', 'university-of-southern-california': 'usc',
  'new-york-university': 'nyu', 'northwestern-university': 'northwestern',
  'washington-university-in-st-louis': 'washu', 'wash-u': 'washu', 'washington-university': 'washu',
  'notre-dame-university': 'notre-dame', 'university-of-notre-dame': 'notre-dame',
  'vanderbilt-university': 'vanderbilt', vandy: 'vanderbilt',
  'georgia-institute-of-technology': 'georgia-tech', gatech: 'georgia-tech', gt: 'georgia-tech',
  'george-washington-university': 'gwu', 'george-washington': 'gwu',
  'university-of-illinois-urbana-champaign': 'uiuc', 'university-of-illinois': 'uiuc',
  'university-of-illinois-chicago': 'uic',
  'university-of-massachusetts-amherst': 'umass-amherst', umass: 'umass-amherst',
  'university-of-texas-at-austin': 'ut-austin', 'ut-austin': 'ut-austin', 'texas': 'ut-austin',
  'texas-a-m': 'texas-am', 'texas-a-m-university': 'texas-am', tamu: 'texas-am',
  'university-of-washington': 'washington-seattle', 'uw': 'washington-seattle',
  'university-of-wisconsin-madison': 'wisconsin-madison', wisconsin: 'wisconsin-madison', uw_madison: 'wisconsin-madison',
  'university-of-georgia': 'uga', 'university-of-connecticut': 'uconn', uconn: 'uconn',
  'university-of-south-florida': 'usf', 'university-of-pittsburgh': 'pitt', pittsburgh: 'pitt',
  'boston-u': 'boston-university', bu: 'boston-university',
  'college-of-william-and-mary': 'william-mary', 'william-and-mary': 'william-mary', 'william-mary': 'william-mary',
  'rensselaer-polytechnic-institute': 'rpi', 'worcester-polytechnic-institute': 'wpi',
  'rochester-institute-of-technology': 'rit', 'new-jersey-institute-of-technology': 'njit',
  'stevens-institute-of-technology': 'stevens', 'florida-international-university': 'fiu',
  'florida-state-university': 'fsu', 'florida-state': 'fsu',
  'north-carolina-state-university': 'nc-state', 'nc-state-university': 'nc-state',
  'ohio-state-university': 'ohio-state', osu: 'ohio-state',
  'penn-state-university': 'penn-state', 'pennsylvania-state-university': 'penn-state',
  'michigan-state-university': 'michigan-state', msu: 'michigan-state',
  'indiana-university': 'indiana-bloomington', 'indiana-university-bloomington': 'indiana-bloomington',
  'university-at-buffalo': 'buffalo', 'suny-buffalo': 'buffalo',
  'binghamton-university': 'binghamton', 'suny-binghamton': 'binghamton',
  'stony-brook-university': 'stony-brook', 'suny-stony-brook': 'stony-brook',
  'case-western-reserve-university': 'case-western', 'case-western-reserve': 'case-western',
  'santa-clara-university': 'santa-clara', 'american-university': 'american',
  'howard-university': 'howard', 'baylor-university': 'baylor', 'brandeis-university': 'brandeis',
  'clemson-university': 'clemson', 'drexel-university': 'drexel', 'lehigh-university': 'lehigh',
  'marquette-university': 'marquette', 'northeastern-university': 'northeastern',
  'pepperdine-university': 'pepperdine', 'purdue-university': 'purdue', 'rice-university': 'rice',
  'tulane-university': 'tulane', 'villanova-university': 'villanova',
  'virginia-tech': 'virginia-tech', 'virginia-polytechnic-institute': 'virginia-tech', vt: 'virginia-tech',
  'wake-forest-university': 'wake-forest', 'wake': 'wake-forest',
  'university-of-miami': 'miami', 'smu': 'smu', 'southern-methodist-university': 'smu',
  // resolved-by-hand entries from the first pass
  boston: 'boston-university',
  'uw-madison': 'wisconsin-madison',
  'new-jersey-it': 'njit',
  'rensselear-poly': 'rpi', 'rensselaer-poly': 'rpi', 'rensselaer-polytechnic': 'rpi',
  'rochester-inst-tech': 'rit', 'rochester-institute-tech': 'rit',
  'california-santa-cruz-ucsc-clr': 'uc-santa-cruz', 'california-santa-cruz': 'uc-santa-cruz',
  'villanova-wildcats': 'villanova',
  'virginia-tech-hokies': 'virginia-tech',
  'washington-washington-huskies': 'washington-seattle', 'washington-huskies': 'washington-seattle',
  '137-1370078-washington-washington-huskies-png': 'washington-seattle',
  washington: 'washington-seattle',
  'worcester-polytechnic-institute2': 'wpi', 'worcester-polytechnic2': 'wpi',
};

// ── filename cleanup ─────────────────────────────────────────────────────────
const NOISE = /\b(logo|logos|seal|crest|wordmark|mark|emblem|icon|official|primary|secondary|full|color|colour|rgb|cmyk|black|white|transparent|vector|hi ?res|hires|large|small|med(ium)?|copy|final|v\d+|\d{2,4}x\d{2,4}|\d+px|download|university|univ|college|the|of|at)\b/g;

function clean(name) {
  return name
    .replace(/(\.(png|svg|webp|jpe?g|gif|avif|tiff?))+$/i, '')  // ext(s), incl. .svg.webp
    .replace(/[’'".,()[\]{}]/g, ' ')
    .replace(/[_\-—+]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')     // camelCase -> spaced
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(NOISE, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[m][n];
}

function guessSlug(cleaned) {
  if (!cleaned) return null;
  if (SLUGS.includes(cleaned)) return { slug: cleaned, how: 'exact' };
  if (ALIASES[cleaned])        return { slug: ALIASES[cleaned], how: 'alias' };

  // token containment against slug or full name
  const toks = cleaned.split('-').filter(Boolean);
  const cand = [];
  for (const slug of SLUGS) {
    const hay = (slug + '-' + clean(NAMES[slug] ?? '')).split('-').filter(Boolean);
    const hits = toks.filter(t => hay.includes(t)).length;
    if (hits) cand.push({ slug, score: hits / Math.max(toks.length, hay.length) });
  }
  cand.sort((a, b) => b.score - a.score);
  if (cand[0] && cand[0].score >= 0.5 && (!cand[1] || cand[0].score - cand[1].score > 0.15))
    return { slug: cand[0].slug, how: 'tokens' };

  // last resort: fuzzy on the raw cleaned string vs slug
  let best = null;
  for (const slug of SLUGS) {
    const dist = levenshtein(cleaned, slug);
    if (!best || dist < best.dist) best = { slug, dist };
  }
  if (best && best.dist <= 2) return { slug: best.slug, how: 'fuzzy' };
  return null;
}

// ── convert ──────────────────────────────────────────────────────────────────
async function toPng(src, dest) {
  const ext = path.extname(src).toLowerCase();
  const isSvg = ext === '.svg';
  let img = isSvg ? sharp(src, { density: SVG_DENSITY }) : sharp(src);
  const meta = await img.metadata();
  const w = meta.width ?? 0, h = meta.height ?? 0;
  if (Math.max(w, h) > MAX_EDGE) {
    img = img.resize({
      width:  w >= h ? MAX_EDGE : undefined,
      height: h > w ? MAX_EDGE : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  await img.png({ compressionLevel: 9, palette: true }).toFile(dest);
  const out = await sharp(dest).metadata();
  return { inW: w, inH: h, outW: out.width, outH: out.height, svg: isSvg };
}

async function main() {
  if (!fs.existsSync(IN_DIR)) { console.error(`missing ${IN_DIR}`); process.exit(1); }
  const files = fs.readdirSync(IN_DIR).filter(f => !f.startsWith('.'));
  if (!files.length) {
    console.log(`Nothing in images/logos/_incoming/ — drop logo files there and re-run.`);
    return;
  }
  if (WRITE) fs.mkdirSync(STAGE_DIR, { recursive: true });

  const rows = [];
  const seen = new Map(); // slug -> filename, to catch dupes

  for (const f of files.sort()) {
    const src = path.join(IN_DIR, f);
    const ext = path.extname(f).toLowerCase();
    if (ext !== '.svg' && !RASTER_EXT.has(ext)) {
      rows.push({ f, note: `skipped (unsupported ${ext})` });
      continue;
    }
    const cleaned = clean(f);
    const g = guessSlug(cleaned);
    const slug = g?.slug ?? null;
    const outName = slug ? `${slug}.png` : `_unmatched__${cleaned || 'logo'}.png`;

    let dim = '';
    if (WRITE) {
      try {
        const r = await toPng(src, path.join(STAGE_DIR, outName));
        dim = `${r.inW}x${r.inH} -> ${r.outW}x${r.outH}${r.svg ? ' (svg)' : ''}`;
      } catch (e) {
        rows.push({ f, note: `FAILED: ${e.message}` });
        continue;
      }
    }
    if (slug && seen.has(slug)) rows.push({ f, slug, how: g.how, dim, note: `DUPLICATE of ${seen.get(slug)}` });
    else {
      if (slug) seen.set(slug, f);
      rows.push({ f, slug, how: g?.how, outName, dim });
    }
  }

  // report
  const pad = (s, n) => String(s ?? '').padEnd(n);
  console.log(`\n${pad('incoming file', 34)} ${pad('->  output', 26)} ${pad('match', 8)} dims`);
  console.log('-'.repeat(96));
  for (const r of rows) {
    if (r.note && !r.slug) { console.log(`${pad(r.f, 34)} ${pad('', 26)} ${pad('', 8)} ${r.note}`); continue; }
    console.log(`${pad(r.f, 34)} ${pad('->  ' + r.outName, 26)} ${pad(r.how ?? '', 8)} ${r.dim}${r.note ? '  ' + r.note : ''}`);
  }

  const unmatched = rows.filter(r => r.outName?.startsWith('_unmatched__'));
  console.log('\n' + '-'.repeat(96));
  console.log(`${rows.length} file(s), ${seen.size} matched, ${unmatched.length} unmatched.`);
  if (unmatched.length)
    console.log(`Unmatched: rename these by hand in _staged/ (valid slugs are the schools/<slug>.html names).`);
  if (!WRITE) { console.log(`\nDry run. Re-run with --write to produce PNGs in images/logos/_staged/.`); return; }
  console.log(`\nPNGs written to images/logos/_staged/. Review them, then:`);
  console.log(`  node scripts/convert-logos.js --write --commit   # move into images/logos/`);

  if (COMMIT) {
    const staged = fs.readdirSync(STAGE_DIR).filter(f => f.endsWith('.png'));
    for (const f of staged) {
      if (f.startsWith('_unmatched__')) { console.log(`kept in _staged (unmatched): ${f}`); continue; }
      fs.renameSync(path.join(STAGE_DIR, f), path.join(LOGO_DIR, f));
      console.log(`moved  ${f}`);
    }
    console.log(`\nDone. Files are named <slug>.png, so the site picks them up automatically`);
    console.log(`(images/logos/<slug>.png). Bump the ?v= asset version if you want cache-busting.`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
