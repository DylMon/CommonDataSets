/**
 * Seed script: pulls data from the College Scorecard API and upserts into Supabase.
 *
 * Usage:
 *   npm run seed              # fetches latest year
 *   npm run seed -- --year 2022  # fetches 2022-23 data
 *
 * Requires:
 *   npm install   (already done — see package.json)
 *
 * Set in .env (repo root):
 *   SUPABASE_URL=https://wakqidqrkqyplobtlzpn.supabase.co
 *   SUPABASE_SERVICE_KEY=sb_secret_...
 *   SCORECARD_API_KEY=...
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import WebSocket from 'ws';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

const SCORECARD_BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const API_KEY = process.env.SCORECARD_API_KEY;

const yearArg = process.argv.indexOf('--year');
const YEAR    = yearArg !== -1 ? process.argv[yearArg + 1] : null;
const PREFIX  = YEAR ? `${YEAR}` : 'latest';
const DATA_YEAR = YEAR ? `${YEAR}-${String(parseInt(YEAR) + 1).slice(2)}` : '2023-24';

// College Scorecard unit_id for each school.
const SCHOOLS = [
  { slug: 'mit',         name: 'MIT',          scorecard_id: 166683 },
  { slug: 'harvard',     name: 'Harvard',       scorecard_id: 166027 },
  { slug: 'stanford',    name: 'Stanford',      scorecard_id: 243744 },
  { slug: 'princeton',   name: 'Princeton',     scorecard_id: 186131 },
  { slug: 'yale',        name: 'Yale',          scorecard_id: 130794 },
  { slug: 'columbia',    name: 'Columbia',      scorecard_id: 190150 },
  { slug: 'upenn',       name: 'UPenn',         scorecard_id: 215062 },
  { slug: 'caltech',     name: 'Caltech',       scorecard_id: 110404 },
  { slug: 'duke',        name: 'Duke',          scorecard_id: 198419 },
  { slug: 'jhu',         name: 'JHU',           scorecard_id: 162928 },
  { slug: 'northwestern',name: 'Northwestern',  scorecard_id: 147767 },
  { slug: 'dartmouth',   name: 'Dartmouth',     scorecard_id: 182670 },
  { slug: 'brown',       name: 'Brown',         scorecard_id: 217156 },
  { slug: 'vanderbilt',  name: 'Vanderbilt',    scorecard_id: 221999 },
  { slug: 'rice',        name: 'Rice',          scorecard_id: 225511 },
  { slug: 'washu',       name: 'WashU',         scorecard_id: 179867 },
  { slug: 'notre-dame',  name: 'NotreDame',     scorecard_id: 152080 },
  { slug: 'cornell',     name: 'Cornell',       scorecard_id: 190415 },
  { slug: 'uchicago',    name: 'UChicago',      scorecard_id: 144050 },
  { slug: 'cmu',         name: 'CMU',           scorecard_id: 211440 },
  { slug: 'georgetown',  name: 'Georgetown',    scorecard_id: 131496 },
  { slug: 'emory',       name: 'Emory',         scorecard_id: 139658 },
  { slug: 'wake-forest', name: 'Wakeforest',    scorecard_id: 199847 },
  { slug: 'tufts',       name: 'Tufts',         scorecard_id: 168148 },
  { slug: 'ucla',        name: 'UCLA',          scorecard_id: 110662 },
  { slug: 'berkeley',    name: 'Berkeley',      scorecard_id: 110635 },
  { slug: 'ucsb',        name: 'UCSB',          scorecard_id: 110705 },
  { slug: 'uva',         name: 'UVA',           scorecard_id: 234076 },
  { slug: 'umich',       name: 'UMich',         scorecard_id: 170976 },
  { slug: 'unc',         name: 'UNC',           scorecard_id: 199120 },
  { slug: 'uf',          name: 'UF',            scorecard_id: 134130 },
  { slug: 'usc',         name: 'USC',           scorecard_id: 123961 },
  { slug: 'nyu',         name: 'NYU',           scorecard_id: 193900 },
];

// The API returns ALL fields as flat dotted-key strings, e.g. raw['latest.cost.tuition.in_state']
const FIELDS = [
  'school.name',
  'school.city',
  'school.state',
  'school.ownership',
  'school.school_url',
  `${PREFIX}.admissions.admission_rate.overall`,
  `${PREFIX}.student.size`,
  `${PREFIX}.admissions.sat_scores.average.overall`,
  `${PREFIX}.admissions.sat_scores.25th_percentile.critical_reading`,
  `${PREFIX}.admissions.sat_scores.75th_percentile.critical_reading`,
  `${PREFIX}.admissions.sat_scores.25th_percentile.math`,
  `${PREFIX}.admissions.sat_scores.75th_percentile.math`,
  `${PREFIX}.admissions.act_scores.25th_percentile.cumulative`,
  `${PREFIX}.admissions.act_scores.75th_percentile.cumulative`,
  `${PREFIX}.admissions.act_scores.25th_percentile.math`,
  `${PREFIX}.admissions.act_scores.75th_percentile.math`,
  `${PREFIX}.admissions.act_scores.25th_percentile.english`,
  `${PREFIX}.admissions.act_scores.75th_percentile.english`,
  `${PREFIX}.cost.tuition.in_state`,
  `${PREFIX}.cost.tuition.out_of_state`,
  `${PREFIX}.cost.roomboard.oncampus`,
  `${PREFIX}.cost.booksupply`,
  `${PREFIX}.cost.otherexpense.oncampus`,
  `${PREFIX}.student.demographics.race_ethnicity.white`,
  `${PREFIX}.student.demographics.race_ethnicity.black`,
  `${PREFIX}.student.demographics.race_ethnicity.hispanic`,
  `${PREFIX}.student.demographics.race_ethnicity.asian`,
  `${PREFIX}.student.demographics.race_ethnicity.aian`,
  `${PREFIX}.student.demographics.race_ethnicity.nhpi`,
  `${PREFIX}.student.demographics.race_ethnicity.two_or_more`,
  `${PREFIX}.student.demographics.race_ethnicity.non_resident_alien`,
  `${PREFIX}.student.demographics.race_ethnicity.unknown`,
  `${PREFIX}.student.demographics.men`,
  `${PREFIX}.student.demographics.women`,
].join(',');

function get(raw, field) {
  return raw[field] ?? null;
}

function ownershipToType(n) {
  if (n === 1) return 'Public';
  if (n === 2 || n === 3) return 'Private';
  return null;
}

async function fetchSchool(unitId) {
  const url = `${SCORECARD_BASE}?id=${unitId}&fields=${FIELDS}&api_key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Scorecard fetch failed for ${unitId}: ${res.status}`);
  const json = await res.json();
  return json.results?.[0] ?? null;
}

async function seedSchool(school) {
  console.log(`Seeding ${school.name}…`);
  const raw = await fetchSchool(school.scorecard_id);

  if (!raw) {
    console.warn(`  No Scorecard data found for ${school.name} (id=${school.scorecard_id})`);
    return;
  }

  const demographics = {
    nonresident_aliens: get(raw, `${PREFIX}.student.demographics.race_ethnicity.non_resident_alien`),
    hispanic:           get(raw, `${PREFIX}.student.demographics.race_ethnicity.hispanic`),
    black:              get(raw, `${PREFIX}.student.demographics.race_ethnicity.black`),
    white:              get(raw, `${PREFIX}.student.demographics.race_ethnicity.white`),
    american_indian:    get(raw, `${PREFIX}.student.demographics.race_ethnicity.aian`),
    asian:              get(raw, `${PREFIX}.student.demographics.race_ethnicity.asian`),
    pacific_islander:   get(raw, `${PREFIX}.student.demographics.race_ethnicity.nhpi`),
    two_or_more:        get(raw, `${PREFIX}.student.demographics.race_ethnicity.two_or_more`),
    unknown:            get(raw, `${PREFIX}.student.demographics.race_ethnicity.unknown`),
    men_pct:            get(raw, `${PREFIX}.student.demographics.men`),
    women_pct:          get(raw, `${PREFIX}.student.demographics.women`),
  };

  const city  = get(raw, 'school.city');
  const state = get(raw, 'school.state');

  const row = {
    slug:                 school.slug,
    name:                 school.name,
    scorecard_id:         school.scorecard_id,
    data_year:            DATA_YEAR,
    city,
    state,
    location:             [city, state].filter(Boolean).join(', '),
    school_type:          ownershipToType(get(raw, 'school.ownership')),
    website:              get(raw, 'school.school_url'),

    acceptance_rate:      get(raw, `${PREFIX}.admissions.admission_rate.overall`),
    total_undergrads:     get(raw, `${PREFIX}.student.size`),

    sat_avg:              get(raw, `${PREFIX}.admissions.sat_scores.average.overall`),
    sat_reading_25:       get(raw, `${PREFIX}.admissions.sat_scores.25th_percentile.critical_reading`),
    sat_reading_75:       get(raw, `${PREFIX}.admissions.sat_scores.75th_percentile.critical_reading`),
    sat_math_25:          get(raw, `${PREFIX}.admissions.sat_scores.25th_percentile.math`),
    sat_math_75:          get(raw, `${PREFIX}.admissions.sat_scores.75th_percentile.math`),

    act_25:               get(raw, `${PREFIX}.admissions.act_scores.25th_percentile.cumulative`),
    act_75:               get(raw, `${PREFIX}.admissions.act_scores.75th_percentile.cumulative`),
    act_math_25:          get(raw, `${PREFIX}.admissions.act_scores.25th_percentile.math`),
    act_math_75:          get(raw, `${PREFIX}.admissions.act_scores.75th_percentile.math`),
    act_english_25:       get(raw, `${PREFIX}.admissions.act_scores.25th_percentile.english`),
    act_english_75:       get(raw, `${PREFIX}.admissions.act_scores.75th_percentile.english`),

    tuition_in_state:     get(raw, `${PREFIX}.cost.tuition.in_state`),
    tuition_out_of_state: get(raw, `${PREFIX}.cost.tuition.out_of_state`),
    room_and_board:       get(raw, `${PREFIX}.cost.roomboard.oncampus`),
    books_supplies:       get(raw, `${PREFIX}.cost.booksupply`),
    other_expenses_in:    get(raw, `${PREFIX}.cost.otherexpense.oncampus`),

    demographics,

    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('schools')
    .upsert(row, { onConflict: 'slug,data_year' });

  if (error) {
    console.error(`  Error upserting ${school.name}:`, error.message);
  } else {
    console.log(`  ✓ ${school.name}`);
  }
}

async function main() {
  console.log(`Seeding data_year=${DATA_YEAR} (prefix="${PREFIX}")…\n`);
  for (const school of SCHOOLS) {
    await seedSchool(school);
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('\nDone.');
}

main().catch(console.error);
