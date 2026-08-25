// scripts/export-data.js
//
// STALE as of 2026-08-25 — do not run without updating first. Two things
// have moved on since this was last touched:
//
//   1. Supabase is being phased out as the source of truth (see the CDS
//      pipeline in scripts/parse-cds-batch.py + scripts/build-cds-json.py,
//      which writes data/cds-{year}/*.json and data/cds-{year}.json
//      directly — no Supabase round trip). This script still requires
//      SUPABASE_URL/SUPABASE_SERVICE_KEY and pulls from the
//      `cds_2024_2025` / `college_scorecard` tables, which are no longer
//      being kept in sync with the newer local pipeline.
//   2. The frontend (index.html, compare.html, js/school.js, js/chanceme.js)
//      no longer fetches data/schools.json — it fetches the year-specific
//      data/schools-2025-2026.json. This script's `write('schools.json', …)`
//      call below (and the doc comment that follows) still target the old
//      filename and would silently produce a file nothing reads.
//
// Pulls both Supabase tables once and writes three static JSON files:
//
//   data/cds-2024-2025.json  — raw CDS table rows (one per year going forward)
//   data/scorecard.json      — raw College Scorecard rows
//   data/schools.json        — merged output; RENAME/RETARGET before using —
//                              see note above, this is not what the site reads
//
// Run:  npm run export
// Re-run whenever CDS or Scorecard data is updated in Supabase.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'data');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { realtime: { transport: WebSocket } }
);

function write(filename, payload) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(join(DATA_DIR, filename), JSON.stringify(payload, null, 2));
    const count = payload.schools?.length ?? '?';
    console.log(`  ✓  data/${filename}  (${count} schools)`);
}

async function run() {
    console.log('Fetching from Supabase…\n');

    const [
        { data: cdsRows,       error: cdsErr },
        { data: scorecardRows, error: scErr  },
    ] = await Promise.all([
        supabase.from('cds_2024_2025').select('*').order('slug'),
        supabase.from('college_scorecard').select('*').order('us_news_rank'),
    ]);

    if (cdsErr) throw new Error('CDS fetch failed: '       + cdsErr.message);
    if (scErr)  throw new Error('Scorecard fetch failed: ' + scErr.message);

    const today = new Date().toISOString().slice(0, 10);

    // Raw source files — one per data origin, versioned by year for CDS
    write('cds-2024-2025.json', { generated: today, cds_year: '2024-25', schools: cdsRows });
    write('scorecard.json',     { generated: today, schools: scorecardRows });

    // Merged output — college_scorecard is the base list (33 schools),
    // CDS data layered on top (31 schools; Berkeley + Vanderbilt get nulls for CDS fields)
    const cdsBySlug = new Map(cdsRows.map(s => [s.slug, s]));

    const merged = scorecardRows.map(sc => {
        const cds     = cdsBySlug.get(sc.slug) ?? {};
        const sat_avg = cds.sat_composite_25 != null && cds.sat_composite_75 != null
            ? Math.round((cds.sat_composite_25 + cds.sat_composite_75) / 2)
            : null;
        return {
            ...sc,   // scorecard: rankings, outcomes, supplementary
            ...cds,  // CDS overrides (primary source); name, acceptance_rate, scores, etc.
            sat_avg,
        };
    });

    write('schools.json', { generated: today, cds_year: '2024-25', schools: merged });

    console.log('\nDone. Commit data/schools.json to deploy the update.');
}

run().catch(err => { console.error('\n' + err.message); process.exit(1); });
