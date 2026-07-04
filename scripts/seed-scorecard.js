/**
 * seed-scorecard.js — Upserts data/scorecard/manual.json + College Scorecard API
 * into the college_scorecard table.
 *
 * Usage:
 *   node scripts/seed-scorecard.js          # all schools
 *   node scripts/seed-scorecard.js mit      # single slug
 *
 * Requires in .env:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *   SCORECARD_API_KEY  (free key from https://api.data.gov/signup)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import WebSocket from 'ws';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

const REPO_ROOT    = resolve(import.meta.dirname, '..');
const MANUAL_FILE  = join(REPO_ROOT, 'data', 'scorecard', 'manual.json');
const API_KEY      = process.env.SCORECARD_API_KEY;
const SCORECARD_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

// College Scorecard field names we want
// Docs: https://collegescorecard.ed.gov/data/documentation/
const SC_FIELDS = [
  'id',
  'school.name',
  // Completion
  'latest.completion.rate_suppressed.overall',    // 4yr adjusted grad rate
  'latest.completion.consumer_rate',              // 6yr 150% time rate
  // Earnings
  'latest.earnings.6_yrs_after_entry.median',
  'latest.earnings.10_yrs_after_entry.median',
  // Debt
  'latest.aid.median_debt.completers.overall',
  'latest.aid.median_debt.noncompleters',
  'latest.aid.pct_federal_loan',
  // Pell / net price
  'latest.aid.pell_grant_rate',
  'latest.cost.avg_net_price.income.0_30000',
  'latest.cost.avg_net_price.income.30001_48000',
  'latest.cost.avg_net_price.income.48001_75000',
  'latest.cost.avg_net_price.income.75001_110000',
  'latest.cost.avg_net_price.income.110001_plus',
  // Academic profile
  'latest.student.demographics.student_faculty_ratio',
  'latest.academics.program_percentage.resources_technologies_workers',  // placeholder
].join(',');

async function fetchScorecard(unitId) {
  if (!API_KEY) return null;
  const url = `${SCORECARD_URL}?id=${unitId}&fields=${SC_FIELDS}&api_key=${API_KEY}`;
  const res  = await fetch(url);
  if (!res.ok) {
    console.warn(`    Scorecard API error ${res.status} for UNITID ${unitId}`);
    return null;
  }
  const json = await res.json();
  return json?.results?.[0] ?? null;
}

function buildRow(manual, sc) {
  const row = {
    slug:               manual.slug,
    name:               manual.name,
    scorecard_id:       manual.scorecard_id ?? null,
    us_news_rank:       manual.us_news_rank ?? null,
    us_news_rank_year:  manual.us_news_rank_year ?? null,
    test_policy:        manual.test_policy ?? null,
    endowment_total:    manual.endowment_total ?? null,
    endowment_per_student: manual.endowment_per_student ?? null,
    updated_at:         new Date().toISOString(),
  };

  if (sc) {
    // Graduation
    row.graduation_rate_4yr = sc['latest.completion.rate_suppressed.overall'] ?? null;
    row.graduation_rate_6yr = sc['latest.completion.consumer_rate'] ?? null;

    // Earnings
    row.median_earnings_6yr  = sc['latest.earnings.6_yrs_after_entry.median'] ?? null;
    row.median_earnings_10yr = sc['latest.earnings.10_yrs_after_entry.median'] ?? null;

    // Debt
    row.median_debt_graduates = sc['latest.aid.median_debt.completers.overall'] ?? null;
    row.median_debt_all       = sc['latest.aid.median_debt.noncompleters'] ?? null;
    row.pct_borrowing         = sc['latest.aid.pct_federal_loan'] ?? null;

    // Financial aid
    row.pell_grant_pct          = sc['latest.aid.pell_grant_rate'] ?? null;
    row.avg_net_price_0_30k     = sc['latest.cost.avg_net_price.income.0_30000'] ?? null;
    row.avg_net_price_30_48k    = sc['latest.cost.avg_net_price.income.30001_48000'] ?? null;
    row.avg_net_price_48_75k    = sc['latest.cost.avg_net_price.income.48001_75000'] ?? null;
    row.avg_net_price_75_110k   = sc['latest.cost.avg_net_price.income.75001_110000'] ?? null;
    row.avg_net_price_110k_plus = sc['latest.cost.avg_net_price.income.110001_plus'] ?? null;

    // Academic
    row.student_faculty_ratio = sc['latest.student.demographics.student_faculty_ratio'] ?? null;
  }

  return row;
}

async function upsertSchool(manual) {
  console.log(`  ${manual.name} (${manual.slug})…`);

  let sc = null;
  if (manual.scorecard_id) {
    sc = await fetchScorecard(manual.scorecard_id);
    if (sc) console.log(`    ✓ Scorecard data fetched`);
    else     console.log(`    ⚠ No Scorecard data (API key missing or rate limited)`);
  }

  const row = buildRow(manual, sc);

  const { error } = await supabase
    .from('college_scorecard')
    .upsert(row, { onConflict: 'slug' });

  if (error) console.error(`    ERROR: ${error.message}`);
  else        console.log(`    ✓ upserted`);
}

async function main() {
  const targetSlug = process.argv[2] ?? null;
  const all = JSON.parse(readFileSync(MANUAL_FILE, 'utf8'));
  const schools = targetSlug ? all.filter(s => s.slug === targetSlug) : all;

  if (!API_KEY) {
    console.warn('\n⚠  SCORECARD_API_KEY not set — only manual data (rankings, endowment) will be seeded.\n');
  }

  console.log(`\nSeeding ${schools.length} school(s) into college_scorecard…\n`);
  for (const s of schools) {
    await upsertSchool(s);
  }
  console.log('\nDone.');
}

main().catch(console.error);
