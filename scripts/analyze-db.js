/**
 * analyze-db.js — Compare the existing `schools` DB table against data/cds/ JSONs.
 *
 * Shows for each of the 33 expected schools:
 *   - DB status: present / missing, and which data_year(s) exist
 *   - JSON status: parsed and ready / not yet parsed
 *   - Key data quality flags: null acceptance_rate, null SAT, etc.
 *
 * Usage:
 *   node scripts/analyze-db.js
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import WebSocket from 'ws';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

const REPO_ROOT = resolve(import.meta.dirname, '..');
const CDS_DIR   = join(REPO_ROOT, 'data', 'cds');

const ALL_SCHOOLS = [
  { slug: 'mit',          name: 'MIT' },
  { slug: 'harvard',      name: 'Harvard' },
  { slug: 'stanford',     name: 'Stanford' },
  { slug: 'princeton',    name: 'Princeton' },
  { slug: 'yale',         name: 'Yale' },
  { slug: 'columbia',     name: 'Columbia' },
  { slug: 'upenn',        name: 'UPenn' },
  { slug: 'caltech',      name: 'Caltech' },
  { slug: 'duke',         name: 'Duke' },
  { slug: 'jhu',          name: 'JHU' },
  { slug: 'northwestern', name: 'Northwestern' },
  { slug: 'dartmouth',    name: 'Dartmouth' },
  { slug: 'brown',        name: 'Brown' },
  { slug: 'vanderbilt',   name: 'Vanderbilt' },
  { slug: 'rice',         name: 'Rice' },
  { slug: 'washu',        name: 'WashU' },
  { slug: 'notre-dame',   name: 'Notre Dame' },
  { slug: 'cornell',      name: 'Cornell' },
  { slug: 'uchicago',     name: 'UChicago' },
  { slug: 'cmu',          name: 'CMU' },
  { slug: 'georgetown',   name: 'Georgetown' },
  { slug: 'emory',        name: 'Emory' },
  { slug: 'wake-forest',  name: 'Wake Forest' },
  { slug: 'tufts',        name: 'Tufts' },
  { slug: 'ucla',         name: 'UCLA' },
  { slug: 'berkeley',     name: 'Berkeley' },
  { slug: 'ucsb',         name: 'UCSB' },
  { slug: 'uva',          name: 'UVA' },
  { slug: 'umich',        name: 'UMich' },
  { slug: 'unc',          name: 'UNC' },
  { slug: 'uf',           name: 'UF' },
  { slug: 'usc',          name: 'USC' },
  { slug: 'nyu',          name: 'NYU' },
];

async function main() {
  // Fetch all rows from the existing schools table
  const { data: dbRows, error } = await supabase
    .from('schools')
    .select('slug, data_year, name, acceptance_rate, applicants_total, admitted_total, sat_avg, act_25, act_75, tuition_in_state, tuition_out_of_state')
    .order('slug');

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  // Index DB rows by slug
  const dbBySlug = {};
  for (const row of dbRows) {
    if (!dbBySlug[row.slug]) dbBySlug[row.slug] = [];
    dbBySlug[row.slug].push(row);
  }

  // Index CDS JSON files
  const cdsFiles = new Set(
    readdirSync(CDS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  );

  // Print report
  const COLS = {
    school:  14,
    db:       6,
    year:    10,
    json:     6,
    issues:  40,
  };
  const pad = (s, n) => String(s ?? '').padEnd(n);

  console.log('\n=== Supabase DB vs data/cds/ Analysis ===\n');
  console.log(
    pad('School', COLS.school) +
    pad('In DB', COLS.db) +
    pad('DB Year', COLS.year) +
    pad('JSON', COLS.json) +
    'Data Issues'
  );
  console.log('─'.repeat(COLS.school + COLS.db + COLS.year + COLS.json + COLS.issues));

  let missingDb = 0, missingJson = 0;

  for (const school of ALL_SCHOOLS) {
    const rows   = dbBySlug[school.slug] ?? [];
    const hasDb  = rows.length > 0;
    const hasJson = cdsFiles.has(school.slug);

    const years = rows.map(r => r.data_year).join(', ');

    const issues = [];
    for (const row of rows) {
      if (row.acceptance_rate == null) issues.push('no acceptance_rate');
      if (row.applicants_total == null) issues.push('no applicants_total');
      if (row.admitted_total == null) issues.push('no admitted_total');
      if (row.sat_avg == null && row.act_25 == null) issues.push('no test scores');
      if (row.tuition_in_state == null && row.tuition_out_of_state == null) issues.push('no tuition');
    }

    console.log(
      pad(school.name, COLS.school) +
      pad(hasDb  ? '✓' : '✗', COLS.db) +
      pad(hasDb  ? years : '—', COLS.year) +
      pad(hasJson ? '✓' : '✗', COLS.json) +
      (issues.length ? issues.join('; ') : hasDb ? 'OK' : '—')
    );

    if (!hasDb)   missingDb++;
    if (!hasJson) missingJson++;
  }

  console.log('\n─'.repeat(COLS.school + COLS.db + COLS.year + COLS.json + COLS.issues));
  console.log(`\nTotal DB rows:   ${dbRows.length}`);
  console.log(`Missing from DB: ${missingDb}`);
  console.log(`CDS JSONs ready: ${cdsFiles.size} / ${ALL_SCHOOLS.length}`);
  console.log(`Still need JSON: ${missingJson}`);
  console.log(`\nNext: parse PDFs for the ${missingJson} schools without a JSON,`);
  console.log(`then run: node scripts/seed-cds.js   to load all into schools_cds.\n`);
}

main().catch(console.error);
