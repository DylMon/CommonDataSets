/**
 * backfill-cds.js
 * Parses the 33 static school HTML files and upserts CDS-only fields
 * (deadlines, test policy, GPA, applicant pools, admission factors, etc.)
 * into Supabase — fields that the College Scorecard API doesn't provide.
 *
 * Usage:  npm run backfill
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHOOLS_DIR = path.join(__dirname, '..', 'schools');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

// Maps each slug to its HTML filename
const SLUG_TO_FILE = {
  'mit':          'MIT.html',
  'harvard':      'Harvard.html',
  'stanford':     'Stanford.html',
  'princeton':    'Princeton.html',
  'yale':         'Yale.html',
  'columbia':     'Columbia.html',
  'upenn':        'UPenn.html',
  'caltech':      'Caltech.html',
  'duke':         'Duke.html',
  'jhu':          'JHU.html',
  'northwestern': 'Northwestern.html',
  'dartmouth':    'Dartmouth.html',
  'brown':        'Brown.html',
  'vanderbilt':   'Vanderbilt.html',
  'rice':         'Rice.html',
  'washu':        'WashU.html',
  'notre-dame':   'NotreDame.html',
  'cornell':      'Cornell.html',
  'uchicago':     'UChicago.html',
  'cmu':          'CMU.html',
  'georgetown':   'Georgetown.html',
  'emory':        'Emory.html',
  'wake-forest':  'Wakeforest.html',
  'tufts':        'Tufts.html',
  'ucla':         'UCLA.html',
  'berkeley':     'Berkeley.html',
  'ucsb':         'UCSB.html',
  'uva':          'UVA.html',
  'umich':        'UMich.html',
  'unc':          'UNC.html',
  'uf':           'UF.html',
  'usc':          'USC.html',
  'nyu':          'NYU.html',
};

// ── Parsing helpers ──────────────────────────────────────────────────────────

function clean(str) {
  return (str ?? '').replace(/​/g, '').replace(/\s+/g, ' ').trim();
}

function parseNum(str) {
  if (!str) return null;
  const s = clean(str).replace(/[,$]/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

function parsePct(str) {
  if (!str) return null;
  const s = clean(str);
  if (/^(NA|N\/A|X|-|—)$/i.test(s)) return null;
  const m = s.match(/([\d.]+)%/);
  if (!m) return null;
  return parseFloat(m[1]) / 100;
}

function parseBool(str, trueStr, falseStr) {
  const s = clean(str).toLowerCase();
  if (s.includes(trueStr.toLowerCase())) return true;
  if (s.includes(falseStr.toLowerCase())) return false;
  return null;
}

function parseGpa(str) {
  const s = clean(str);
  if (/^(NA|N\/A|—|-|X)$/i.test(s)) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** Returns all table cells in a row as trimmed strings */
function rowCells(tr) {
  return [...tr.querySelectorAll('td, th')].map(el => clean(el.textContent));
}

/** Returns the first header cell text of a table (lowercased) */
function tableKey(table) {
  const first = table.querySelector('thead td, thead th');
  return first ? clean(first.textContent).toLowerCase() : '';
}

/** Find the first table whose first header cell contains a given substring */
function findTable(document, keyword) {
  const tables = document.querySelectorAll('table');
  for (const t of tables) {
    if (tableKey(t).includes(keyword.toLowerCase())) return t;
  }
  return null;
}

// ── Section parsers ──────────────────────────────────────────────────────────

function parseCards(document) {
  const result = {};
  const cards = document.querySelectorAll('.card');

  for (const card of cards) {
    const heading = clean(card.querySelector('h2')?.textContent ?? '').toLowerCase();
    const mainVal = clean(card.querySelector('.card-text p')?.textContent ?? '');
    const stats = [...card.querySelectorAll('.card-stats .stat')].map(s => ({
      label: clean(s.querySelector('.value')?.textContent ?? ''),
      value: clean(s.querySelector('.type')?.textContent ?? ''),
    }));

    if (heading.includes('acceptance rate')) {
      result.applicants_total = parseNum(stats.find(s => s.label.toLowerCase().includes('applicant'))?.value);
      result.admitted_total   = parseNum(stats.find(s => s.label.toLowerCase().includes('accept'))?.value);
      result.enrolled_total   = parseNum(stats.find(s => s.label.toLowerCase().includes('enroll'))?.value);
    }

    if (heading.includes('gpa')) {
      result.avg_gpa_weighted = parseGpa(mainVal);
    }

    if (heading.includes('undergraduate')) {
      result.total_undergrads  = parseNum(mainVal.replace(/,/g, ''));
      result.undergrads_male   = parseNum(stats.find(s => s.label.toLowerCase() === 'male')?.value);
      result.undergrads_female = parseNum(stats.find(s => s.label.toLowerCase() === 'female')?.value);
    }
  }
  return result;
}

function parseFastFacts(document) {
  const result = {};
  const lines = document.querySelectorAll('.facts .line');

  for (const line of lines) {
    const label = clean(line.querySelector('span')?.textContent ?? '').replace(/:$/, '').toLowerCase();
    // value = full line text minus the span text
    const fullText = clean(line.textContent);
    const spanText = clean(line.querySelector('span')?.textContent ?? '');
    const value = fullText.replace(spanText, '').trim();

    if (!label || !value) continue;

    if (label === 'location')                  result.location = value;
    if (label === 'school type')               result.school_type = value;
    if (label === 'us news ranking')           result.us_news_ranking = value;
    if (label === 'ea/ed')                     result.ea_ed_type = value;
    if (label === 'ea/ed deadline')            result.ea_ed_deadline = value;
    if (label === 'regular decision deadline') result.rd_deadline = value;

    if (label === 'sat writing') {
      result.sat_writing_required = parseBool(value, 'Required', 'Not Required');
    }
    if (label === 'act writing') {
      result.act_writing_required = parseBool(value, 'Required', 'Not Required');
    }
    if (label === 'sat superscore') {
      result.sat_superscore = parseBool(value, 'Allowed', 'Not Allowed');
    }
    if (label === 'act superscore') {
      result.act_superscore = parseBool(value, 'Allowed', 'Not Allowed');
    }
    if (label === 'sat score choice') {
      result.sat_score_choice = parseBool(value, 'Allowed', 'Not Allowed');
    }
    if (label === 'act score choice') {
      result.act_score_choice = parseBool(value, 'Allowed', 'Not Allowed');
    }
  }
  return result;
}

function parseApplicantPools(document) {
  const t = findTable(document, 'early action');
  if (!t) return null;

  const rows = [...t.querySelectorAll('tbody tr')];
  const pools = {};

  for (const row of rows) {
    const cells = rowCells(row);
    if (!cells[0]) continue;
    const label = cells[0].toLowerCase();

    if (label.includes('early')) {
      pools.ea = {
        applied:   parseNum(cells[1]),
        accepted:  parseNum(cells[2]),
        rate:      parsePct(cells[3]),
      };
    } else if (label.includes('regular')) {
      pools.rd = {
        applied:   parseNum(cells[1]),
        accepted:  parseNum(cells[2]),
        rate:      parsePct(cells[3]),
      };
    } else if (label.includes('waitlist')) {
      // "460 (383 Accepted Spots)" — extract first number and parenthetical
      const offered = parseNum(cells[1].split('(')[0]);
      const acceptedMatch = cells[1].match(/\((\d+)/);
      pools.waitlist = {
        offered:         offered,
        accepted_spots:  acceptedMatch ? parseInt(acceptedMatch[1]) : null,
        enrolled:        parseNum(cells[2]),
      };
    }
  }
  return Object.keys(pools).length ? pools : null;
}

function parseTuitionExtras(document) {
  const t = findTable(document, 'total costs');
  if (!t) return null;

  const result = {};
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    const label = (cells[0] ?? '').toLowerCase();
    if (label.includes('application fee')) result.application_fee    = parseNum(cells[1]?.replace(/[$,]/g, ''));
    if (label.includes('required fees'))   result.required_fees_in   = parseNum(cells[1]?.replace(/[$,]/g, ''));
  }
  return result;
}

function parseGenderBreakdown(document) {
  const t = findTable(document, 'gender breakdown');
  if (!t) return null;

  const result = { applied: {}, accepted: {}, enrolled: {} };
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    const label = (cells[0] ?? '').toLowerCase();
    if (label === 'applied')  { result.applied  = { male: parseNum(cells[1]), female: parseNum(cells[2]) }; }
    if (label === 'accepted') { result.accepted = { male: parseNum(cells[1]), female: parseNum(cells[2]) }; }
    if (label === 'enrolled') { result.enrolled = { male: parseNum(cells[1]), female: parseNum(cells[2]) }; }
  }
  return result;
}

function parseDemographicsDetail(document) {
  const t = findTable(document, 'ethnic background');
  if (!t) return null;

  const LABEL_MAP = {
    'nonresident aliens':                       'nonresident_aliens',
    'hispanic':                                 'hispanic',
    'black or african american':                'black',
    'white':                                    'white',
    'american indian or alaska native':         'american_indian',
    'asian':                                    'asian',
    'native hawaiian':                          'pacific_islander',
    'two or more races':                        'two_or_more',
    'race and/or ethnicity unknown':            'unknown',
    'total':                                    'total',
  };

  const result = { first_year: {}, undergrad: {} };
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    const rawLabel = (cells[0] ?? '').toLowerCase();
    const key = Object.keys(LABEL_MAP).find(k => rawLabel.includes(k));
    if (!key) continue;
    const field = LABEL_MAP[key];
    result.first_year[field] = parseNum(cells[1]);
    result.undergrad[field]  = parseNum(cells[2]);
  }
  return result;
}

function parseGeographic(document) {
  const t = findTable(document, 'geographic breakdown');
  if (!t) return null;

  const result = {};
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    const label = (cells[0] ?? '').toLowerCase();
    if (label.includes('in-state'))      result.in_state_pct       = parsePct(cells[1]);
    if (label.includes('out-of-state'))  result.out_of_state_pct   = parsePct(cells[1]);
    if (label.includes('international')) result.international_pct  = parsePct(cells[1]);
  }
  return result;
}

function parseSatActBreakdown(document) {
  const t = findTable(document, 'sat/act breakdown');
  if (!t) return null;

  const result = {};
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    const label = (cells[0] ?? '').toLowerCase();

    if (label.includes('sat') && label.includes('submitted')) {
      const raw = cells[1]; // e.g. "837 (75%)"
      result.sat_submitted_count = parseNum(raw.split('(')[0]);
      const pctMatch = raw.match(/\(([\d.]+)%\)/);
      result.sat_submitted_pct = pctMatch ? parseFloat(pctMatch[1]) / 100 : null;
    }
    if (label.includes('act') && label.includes('submitted')) {
      const raw = cells[1];
      result.act_submitted_count = parseNum(raw.split('(')[0]);
      const pctMatch = raw.match(/\(([\d.]+)%\)/);
      result.act_submitted_pct = pctMatch ? parseFloat(pctMatch[1]) / 100 : null;
    }
  }
  return Object.keys(result).length ? result : null;
}

function parseClassRank(document) {
  const t = findTable(document, 'class rank breakdown');
  if (!t) return null;

  const result = {};
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    const label = (cells[0] ?? '').toLowerCase();
    if (label.includes('top 10'))     result.top10    = parsePct(cells[1]);
    if (label.includes('top 25'))     result.top25    = parsePct(cells[1]);
    if (label.includes('top 50'))     result.top50    = parsePct(cells[1]);
    if (label.includes('bottom 50'))  result.bottom50 = parsePct(cells[1]);
    if (label.includes('bottom 25'))  result.bottom25 = parsePct(cells[1]);
  }
  return Object.keys(result).length ? result : null;
}

function parseGpaDistribution(document) {
  const t = findTable(document, 'gpa breakdown');
  if (!t) return null;

  const result = {};
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    const label = (cells[0] ?? '').toLowerCase();
    if (label.includes('4.0') && !label.includes('between'))   result.gpa_40      = parsePct(cells[1]);
    if (label.includes('3.75'))  result.gpa_375_399 = parsePct(cells[1]);
    if (label.includes('3.50'))  result.gpa_350_374 = parsePct(cells[1]);
    if (label.includes('3.25'))  result.gpa_325_349 = parsePct(cells[1]);
    if (label.includes('3.00'))  result.gpa_300_324 = parsePct(cells[1]);
    if (label.includes('2.50'))  result.gpa_250_299 = parsePct(cells[1]);
    if (label.includes('2.0'))   result.gpa_200_249 = parsePct(cells[1]);
    if (label.includes('1.0'))   result.gpa_100_199 = parsePct(cells[1]);
  }
  return Object.keys(result).length ? result : null;
}

function parseAdmissionFactors(document) {
  const t = findTable(document, 'factors of admission');
  if (!t) return null;

  // Header row tells us column order: [Factor, Very Important, Important, Considered, Not Considered]
  const headers = rowCells(t.querySelector('thead tr') ?? t.querySelector('tr'));
  const RATINGS = ['very_important', 'important', 'considered', 'not_considered'];
  const FACTOR_KEY_MAP = {
    'rigor of secondary': 'rigor',
    'class rank':         'class_rank',
    'academic gpa':       'academic_gpa',
    'standardized test':  'test_scores',
    'application essay':  'essay',
    'recommendation':     'recommendations',
    'interview':          'interview',
    'extracurricular':    'extracurriculars',
    'talent':             'talent',
    'character':          'character',
    'first generation':   'first_gen',
    'alumni':             'alumni_relation',
    'geographical':       'geo_residence',
    'state residence':    'state_residence',
    'religious':          'religious',
    'racial':             'racial_ethnic',
    'volunteer':          'volunteer',
    'work experience':    'work_experience',
    'level of applicant': 'applicant_interest',
  };

  const result = {};
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    if (!cells[0]) continue;
    const rawLabel = cells[0].toLowerCase();
    const factorKey = Object.keys(FACTOR_KEY_MAP).find(k => rawLabel.includes(k));
    if (!factorKey) continue;
    const field = FACTOR_KEY_MAP[factorKey];

    // Find which column (1-4) has an 'X'
    for (let i = 1; i <= 4; i++) {
      if ((cells[i] ?? '').trim().toUpperCase() === 'X') {
        result[field] = RATINGS[i - 1];
        break;
      }
    }
    if (!result[field]) result[field] = null;
  }
  return Object.keys(result).length ? result : null;
}

function parseTransfer(document) {
  const t = findTable(document, 'transfer applicants');
  if (!t) return null;

  const result = {};
  for (const row of t.querySelectorAll('tbody tr')) {
    const cells = rowCells(row);
    const label = (cells[0] ?? '').toLowerCase();
    if (label === 'male')   result.male   = { applied: parseNum(cells[1]), admitted: parseNum(cells[2]), enrolled: parseNum(cells[3]) };
    if (label === 'female') result.female = { applied: parseNum(cells[1]), admitted: parseNum(cells[2]), enrolled: parseNum(cells[3]) };
    if (label === 'total') {
      // "23 (4.3%)" format for admitted
      const admittedRaw = cells[2] ?? '';
      const admitted = parseNum(admittedRaw.split('(')[0]);
      const rateMatch = admittedRaw.match(/([\d.]+)%/);
      result.total = {
        applied:  parseNum(cells[1]),
        admitted,
        rate:     rateMatch ? parseFloat(rateMatch[1]) / 100 : null,
        enrolled: parseNum(cells[3]),
      };
    }
  }
  return Object.keys(result).length ? result : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function processSchool(slug, filename) {
  const filepath = path.join(SCHOOLS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  File not found: ${filename}`);
    return;
  }

  const html = fs.readFileSync(filepath, 'utf-8');
  const { document } = new JSDOM(html).window;

  const cardData          = parseCards(document);
  const fastFacts         = parseFastFacts(document);
  const applicantPools    = parseApplicantPools(document);
  const tuitionExtras     = parseTuitionExtras(document);
  const genderBreakdown   = parseGenderBreakdown(document);
  const demographicsDetail= parseDemographicsDetail(document);
  const geographicBreakdown = parseGeographic(document);
  const satActBreakdown   = parseSatActBreakdown(document);
  const classRank         = parseClassRank(document);
  const gpaDistribution   = parseGpaDistribution(document);
  const admissionFactors  = parseAdmissionFactors(document);
  const transferStats     = parseTransfer(document);

  const row = {
    slug,
    ...cardData,
    ...fastFacts,
    ...(tuitionExtras ?? {}),
    applicant_pools:      applicantPools,
    gender_breakdown:     genderBreakdown,
    demographics_detail:  demographicsDetail,
    geographic_breakdown: geographicBreakdown,
    sat_act_breakdown:    satActBreakdown,
    class_rank:           classRank,
    gpa_distribution:     gpaDistribution,
    admission_factors:    admissionFactors,
    transfer_stats:       transferStats,
  };

  // Remove nulls so we don't overwrite Scorecard data with null
  const cleanRow = Object.fromEntries(
    Object.entries(row).filter(([, v]) => v !== null && v !== undefined)
  );

  const { slug: _slug, ...updateData } = cleanRow;
  const { error } = await supabase
    .from('schools')
    .update(updateData)
    .eq('slug', slug);

  if (error) {
    console.error(`  ✗ ${slug}: ${error.message}`);
  } else {
    const fields = Object.keys(cleanRow).length - 1; // minus slug
    console.log(`  ✓ ${slug} (${fields} fields)`);
  }
}

async function main() {
  for (const [slug, filename] of Object.entries(SLUG_TO_FILE)) {
    console.log(`Parsing ${slug}…`);
    await processSchool(slug, filename);
  }
  console.log('\nDone.');
}

main().catch(console.error);
