// detect-school-color.js — Fill in a school's primary brand color in
// SCHOOL_META (js/school.js) if it doesn't have one yet.
//
// Case A: images/logos/{slug}.png exists -> dominant color via sharp,
//         flattened onto neutral gray first so a white/transparent
//         background can't win "dominant". Cheap, deterministic, no API call.
// Case B: no logo yet (or Case A landed on a near-white/near-black result,
//         which usually means the background won) -> shell out to
//         scripts/lookup_brand_color.py, which asks Claude (with web search)
//         for the school's official brand color.
//
// Idempotent: no-ops if SCHOOL_META already has an entry for the slug, so
// it's safe to run on every CI pass without overwriting a hand-curated color.
//
// Usage:
//   node scripts/detect-school-color.js --slug newschool --name "New School University"
//
// If --name is omitted, it's looked up from data/schools-*.json (matching
// the school's already-parsed CDS data), falling back to the slug itself.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCHOOL_JS_PATH = path.join(ROOT, 'js', 'school.js');
const LOGO_DIR = path.join(ROOT, 'images', 'logos');
const DATA_DIR = path.join(ROOT, 'data');

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i === -1 ? null : args[i + 1];
  };
  const slug = get('--slug');
  if (!slug) {
    console.error('Usage: node scripts/detect-school-color.js --slug <slug> [--name "School Name"]');
    process.exit(1);
  }
  return { slug, name: get('--name') };
}

function lookUpName(slug) {
  for (const f of fs.readdirSync(DATA_DIR)) {
    if (!/^schools-.*\.json$/.test(f)) continue;
    try {
      const { schools } = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
      const match = schools?.find(s => s.slug === slug);
      if (match?.name) return match.name;
    } catch { /* skip unreadable/malformed data files */ }
  }
  return slug;
}

function hasExistingEntry(source, slug) {
  return new RegExp(`^\\s*'${slug}':`, 'm').test(source);
}

function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}

function toHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('');
}

// Catches near-white, near-black, and near-gray pixels — logo background,
// outlines, and anti-aliasing, none of which are the "brand" color.
function isNearGrayscale(hex, threshold = 24) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const near = (a, b2) => Math.abs(a - b2) <= threshold;
  return (near(r, 255) && near(g, 255) && near(b, 255))
    || (near(r, 0) && near(g, 0) && near(b, 0))
    || (Math.max(r, g, b) - Math.min(r, g, b) < 18);
}

// A plain "most common pixel" (e.g. sharp's built-in `stats().dominant`)
// almost always returns the white/transparent background of a logo, since
// that's most of the image by pixel count. Instead: downsample, drop
// background/grayscale pixels, bin what's left into a coarse color
// histogram, and pick among the most frequent bins by weighting for
// saturation too — the brand color is usually vivid, not just common.
async function detectFromLogo(slug) {
  const logoPath = path.join(LOGO_DIR, `${slug}.png`);
  if (!fs.existsSync(logoPath)) return null;

  const SIZE = 64;
  const BIN_WIDTH = 24;
  const { data, info } = await sharp(logoPath)
    .resize(SIZE, SIZE, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bin = v => clamp255(Math.round(v / BIN_WIDTH) * BIN_WIDTH);
  const counts = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    if (isNearGrayscale(toHex({ r, g, b }))) continue;
    const key = `${bin(r)},${bin(g)},${bin(b)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return null; // logo has no non-background color — fall through to Case B

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const best = top
    .map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number);
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      return { r, g, b, score: count * (1 + saturation / 255) };
    })
    .sort((a, b) => b.score - a.score)[0];

  return { hex: toHex(best), source: `dominant non-background color of images/logos/${slug}.png` };
}

function detectFromWebSearch(name) {
  const out = execFileSync(
    'python3',
    [path.join(__dirname, 'lookup_brand_color.py'), name],
    { encoding: 'utf8' },
  );
  return JSON.parse(out.trim());
}

function insertSchoolMeta(slug, hex) {
  const source = fs.readFileSync(SCHOOL_JS_PATH, 'utf8');
  const metaStart = source.indexOf('const SCHOOL_META');
  const metaEnd = source.indexOf('\n};', metaStart);
  if (metaStart === -1 || metaEnd === -1) {
    throw new Error('Could not find SCHOOL_META object in js/school.js');
  }
  const line = `  '${slug}': { color: '${hex}' },\n`;
  const updated = source.slice(0, metaEnd + 1) + line + source.slice(metaEnd + 1);
  fs.writeFileSync(SCHOOL_JS_PATH, updated, 'utf8');
}

async function main() {
  const { slug, name: nameArg } = parseArgs();
  const source = fs.readFileSync(SCHOOL_JS_PATH, 'utf8');

  if (hasExistingEntry(source, slug)) {
    console.log(`${slug}: SCHOOL_META already has a color — skipping.`);
    return;
  }

  let result = await detectFromLogo(slug);
  if (result) {
    console.log(`${slug}: detected ${result.hex} from logo image.`);
  } else {
    const name = nameArg ?? lookUpName(slug);
    console.log(`${slug}: no usable logo — looking up official brand color for "${name}" via web search...`);
    try {
      result = detectFromWebSearch(name);
    } catch (e) {
      console.warn(`${slug}: brand color lookup failed (${e.message}) — leaving unset. `
        + `Page will fall back to the default gray hero until a color is added by hand.`);
      return;
    }
    console.log(`${slug}: detected ${result.hex} from ${result.source}.`);
  }

  insertSchoolMeta(slug, result.hex);
  console.log(`${slug}: wrote '${slug}': { color: '${result.hex}' } to js/school.js`);
}

main().catch(e => { console.error(e); process.exit(1); });
