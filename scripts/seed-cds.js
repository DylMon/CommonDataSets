/**
 * seed-cds.js — Upserts all data/cds/*.json files into the schools_cds table.
 *
 * Usage:
 *   node scripts/seed-cds.js            # upsert all JSON files found
 *   node scripts/seed-cds.js princeton  # upsert a single school by slug
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join, basename } from 'path';
import WebSocket from 'ws';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

const REPO_ROOT = resolve(import.meta.dirname, '..');
const CDS_DIR   = join(REPO_ROOT, 'data', 'cds');

function buildRow(data) {
  // JSON keys map 1:1 to column names — just pass through.
  // Remove any keys that aren't columns (defensive).
  const {
    slug, name, data_year,
    city, state, location, school_type, website,
    applicants_total, applicants_men, applicants_women,
    admitted_total, admitted_men, admitted_women,
    enrolled_total, enrolled_men, enrolled_women,
    acceptance_rate, application_fee, avg_gpa_weighted, rd_deadline,
    waitlist_offered, waitlist_accepted, waitlist_admitted,
    ea_ed_type, ea_ed_deadline, ea_ed_notification, ea_apps_received, ea_apps_admitted,
    sat_submitted_pct, sat_submitted_count, act_submitted_pct, act_submitted_count,
    sat_composite_25, sat_composite_75,
    sat_reading_25, sat_reading_75,
    sat_math_25, sat_math_75,
    act_composite_25, act_composite_75,
    act_math_25, act_math_75,
    act_english_25, act_english_75,
    total_undergrads, undergrads_male, undergrads_female, retention_rate,
    tuition, tuition_in_state, tuition_out_of_state,
    required_fees, room_and_board, books_supplies, other_expenses,
    pct_out_of_state, pct_on_campus_housing,
    applicant_pools, gender_breakdown, demographics_detail,
    geographic_breakdown, sat_act_breakdown,
    class_rank, gpa_distribution, admission_factors, transfer_stats,
  } = data;

  return {
    slug, name, data_year,
    city, state, location, school_type, website,
    applicants_total, applicants_men, applicants_women,
    admitted_total, admitted_men, admitted_women,
    enrolled_total, enrolled_men, enrolled_women,
    acceptance_rate, application_fee, avg_gpa_weighted, rd_deadline,
    waitlist_offered, waitlist_accepted, waitlist_admitted,
    ea_ed_type, ea_ed_deadline, ea_ed_notification, ea_apps_received, ea_apps_admitted,
    sat_submitted_pct, sat_submitted_count, act_submitted_pct, act_submitted_count,
    sat_composite_25, sat_composite_75,
    sat_reading_25, sat_reading_75,
    sat_math_25, sat_math_75,
    act_composite_25, act_composite_75,
    act_math_25, act_math_75,
    act_english_25, act_english_75,
    total_undergrads, undergrads_male, undergrads_female, retention_rate,
    tuition, tuition_in_state, tuition_out_of_state,
    required_fees, room_and_board, books_supplies, other_expenses,
    pct_out_of_state, pct_on_campus_housing,
    applicant_pools, gender_breakdown, demographics_detail,
    geographic_breakdown, sat_act_breakdown,
    class_rank, gpa_distribution, admission_factors, transfer_stats,
    updated_at: new Date().toISOString(),
  };
}

async function upsertSchool(jsonPath) {
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const row  = buildRow(data);

  console.log(`  Upserting ${data.name} (${data.slug}, ${data.data_year})…`);
  const { error } = await supabase
    .from('cds_2024_2025')
    .upsert(row, { onConflict: 'slug,data_year' });

  if (error) {
    console.error(`    ERROR: ${error.message}`);
  } else {
    console.log(`    ✓ done`);
  }
}

async function main() {
  const targetSlug = process.argv[2] ?? null;

  let files;
  if (targetSlug) {
    const p = join(CDS_DIR, `${targetSlug}.json`);
    files = [p];
  } else {
    files = readdirSync(CDS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => join(CDS_DIR, f));
  }

  if (files.length === 0) {
    console.log('No JSON files found in data/cds/');
    return;
  }

  console.log(`\nSeeding ${files.length} school(s) into cds_2024_2025…\n`);
  for (const f of files) {
    await upsertSchool(f);
  }
  console.log('\nDone.');
}

main().catch(console.error);
