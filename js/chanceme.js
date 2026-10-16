// Chance Me — deterministic, formula-based admission-odds estimator.
// Everything here runs client-side against data/schools.json. No AI, no server,
// nothing typed into the form is ever transmitted anywhere.

import { loadAdmissionPlans, cdsRounds } from './admission-plans.js?v=1';
import { loadSchoolNames, nameMatches } from './school-names.js?v=1';
import { loadLatestSchools, withRankBandFixes } from './latest-schools.js?v=1';
import { loadOutsideTests, withOutsideTests } from './outside-tests.js?v=1';
import { withSatEstimates } from './sat-estimate.js?v=1';
import { loadTestPolicies } from './test-policy.js?v=1';

// Logos live at images/logos/<slug>.png. A few schools have none yet; the
// onerror hook hides the broken <img> rather than showing a torn-image icon.
const logoSrc = slug => `/images/logos/${slug}.png`;
const LOGO_ONERR = "this.style.display='none'";

export const US_STATES = [
    ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
    ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],
    ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],
    ['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],
    ['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],
    ['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
    ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
    ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],
    ['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],
    ['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],
    ['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
];

// Shared 1-10 scale used for Activities and Awards, and for the essay rating the rubric produces.
export const SCALE_10_LABELS = [
    'Very Weak', 'Weak', 'Below Average', 'Modest', 'Average',
    'Above Average', 'Good', 'Strong', 'Excellent', 'Elite',
];

// 1-5 scale used for Letters of Recommendation.
export const SCALE_5_LABELS = [
    'Weak', 'Below Average', 'Average', 'Strong', 'Exceptional',
];

// Worked examples grouped in five bands across the 1-10 scale, calibrated
// against the kind of profiles actually admitted to the selective schools
// we track (not a generic curve). Display only — shown in a collapsible
// "See examples" list under each 1-10 scale; the formula never reads them.
export const ACTIVITY_SCALE_EXAMPLES = [
    { score: '1–2', desc: 'Little to Nothing Outside Class: no clubs, teams, jobs, or regular volunteering.' },
    { score: '3–4', desc: 'Casual Involvement: general club or team member, light volunteering, no leadership.' },
    { score: '5–6', desc: 'Solid Involvement: club officer, JV/varsity athlete, sustained part-time job, heavy volunteering.' },
    { score: '7–8', desc: 'Standout Impact: president/founder/captain with real results, published research, ran a nonprofit.' },
    { score: '9–10', desc: 'National Impact: a venture reaching thousands, a recruited D1 athlete, research at top programs.' },
];

// Shown under the Activities and Awards examples: they're guides, not cutoffs.
export const SCALE_EXAMPLES_NOTE = 'These are examples, not strict cutoffs. If something you’ve done stands out more than its tier suggests, rate yourself higher.';

export const AWARD_SCALE_EXAMPLES = [
    { score: '1–2', desc: 'None or Insignificant.' },
    { score: '3–4', desc: 'School-Level Honor: department award, school-wide competition win, AP Scholar.' },
    { score: '5–6', desc: 'Regional/State Recognition: regional competition win, All-State, state science-fair placement.' },
    { score: '7–8', desc: 'National Recognition: National Merit Semifinalist/Finalist, Olympiad qualifier, published work.' },
    { score: '9–10', desc: 'International/Top Recognition: Olympiad medalist, ISEF top award, U.S. Presidential Scholar.' },
];

// Personal-essay rubric: the student picks one level (5 = best) in each of
// four categories, and the picks become the essay's 1-10 rating. Drawn from
// common personal-statement rubrics and admissions readers' checklists.
export const ESSAY_RUBRIC = [
    { key: 'theme', title: 'Theme', levels: {
        5: 'Unique, personal theme with real insight.',
        4: 'Meaningful theme with thoughtful reflection.',
        3: 'Clear theme, but a common angle.',
        2: 'Weak theme; the lesson feels tacked on.',
        1: 'No clear theme or reflection.' } },
    { key: 'show', title: 'Show, Don\'t Tell', levels: {
        5: 'Every key point shown through vivid moments.',
        4: 'Specific scenes; very little telling.',
        3: 'Some examples; key traits still stated.',
        2: 'Mostly tells, with a few examples.',
        1: 'Only claims, no examples.' } },
    { key: 'voice', title: 'Voice', levels: {
        5: 'Unmistakably you; your personality shines.',
        4: 'Sounds like you; your values come through.',
        3: 'Personal, but could be many applicants.',
        2: 'Stiff or forced; little sense of you.',
        1: 'Generic; says nothing about you.' } },
    { key: 'writing', title: 'Writing', levels: {
        5: 'Polished and tight; every paragraph builds.',
        4: 'Clear, well organized, few to no errors.',
        3: 'Readable, but drifts or has some errors.',
        2: 'Choppy or hard to follow in places.',
        1: 'Disorganized, with frequent errors.' } },
]
export const ESSAY_RUBRIC_LEVELS = { 5: 'Elite', 4: 'Strong', 3: 'Solid', 2: 'Subpar', 1: 'Weak' };

// Each pick is worth these points on the 1-10 essay scale, and the rating is
// their average, to one decimal: all Solid = 5, all Strong = 7, all
// Elite = 10. The jump to Elite is the biggest, and it's worded to be
// rare, so a top-school essay (about 8) needs real Elite picks.
// Null until every category is picked, so a half-done rubric counts as
// blank (an ordinary essay, see BLANK_RATINGS).
const ESSAY_RUBRIC_POINTS = { 1: 1, 2: 3, 3: 5, 4: 7, 5: 10 };
export function essayRubricScore(picks) {
    const vals = ESSAY_RUBRIC.map(c => picks?.[c.key]);
    if (vals.some(v => v == null)) return null;
    return Math.round(vals.reduce((a, v) => a + ESSAY_RUBRIC_POINTS[v], 0) / vals.length * 10) / 10;
}

// Class-rank slider bands: 20 five-point bands, top-of-class first. `topPct`
// is each band's midpoint (percent from the top of the class), used directly
// as the "userTopPct" input to classRankPercentile. Position 0 on the slider
// is "not ranked / skip" (null), positions 1-20 index into this array.
export const CLASS_RANK_BANDS = [
    { topPct: 2.5,  label: 'Top 5%' },
    { topPct: 7.5,  label: 'Top 5–10%' },
    { topPct: 12.5, label: 'Top 10–15%' },
    { topPct: 17.5, label: 'Top 15–20%' },
    { topPct: 22.5, label: 'Top 20–25%' },
    { topPct: 27.5, label: 'Top 25–30%' },
    { topPct: 32.5, label: 'Top 30–35%' },
    { topPct: 37.5, label: 'Top 35–40%' },
    { topPct: 42.5, label: 'Top 40–45%' },
    { topPct: 47.5, label: 'Top 45–50%' },
    { topPct: 52.5, label: 'Top 50–55%' },
    { topPct: 57.5, label: 'Top 55–60%' },
    { topPct: 62.5, label: 'Top 60–65%' },
    { topPct: 67.5, label: 'Top 65–70%' },
    { topPct: 72.5, label: 'Top 70–75%' },
    { topPct: 77.5, label: 'Top 75–80%' },
    { topPct: 82.5, label: 'Top 80–85%' },
    { topPct: 87.5, label: 'Top 85–90%' },
    { topPct: 92.5, label: 'Top 90–95%' },
    { topPct: 97.5, label: 'Bottom 5%' },
];

export function classRankBandLabel(position) {
    if (!position) return 'Not Ranked / Prefer not to say';
    return CLASS_RANK_BANDS[position - 1]?.label ?? 'Not Ranked / Prefer not to say';
}

export function classRankTopPctFromPosition(position) {
    if (!position) return null;
    return CLASS_RANK_BANDS[position - 1]?.topPct ?? null;
}

export const CHANCE_TIERS = [
    { ceiling: 0.01,  key: 'not-possible',      label: 'Extremely Unlikely' },
    { ceiling: 0.08,  key: 'highly-unlikely',    label: 'Highly Unlikely' },
    { ceiling: 0.25,  key: 'unlikely',           label: 'Unlikely' },
    { ceiling: 0.55,  key: 'toss-up',            label: 'Toss Up' },
    { ceiling: 0.80,  key: 'likely',             label: 'Likely' },
    { ceiling: 0.95,  key: 'highly-likely',      label: 'Highly Likely' },
    { ceiling: 1.001, key: 'almost-guaranteed',  label: 'Almost Guaranteed' },
];

const ACADEMIC_FACTOR_KEYS = ['rigor', 'class_rank', 'academic_gpa', 'test_scores'];
// 'interview' counts toward the holistic side of a school's own academic/holistic
// split now too, in addition to its own dynamic weight inside holisticIndex below —
// previously a school's declared interview importance was read nowhere at all.
const HOLISTIC_FACTOR_KEYS = ['essay', 'extracurriculars', 'talent', 'character', 'recommendations', 'interview'];
const IMPORTANCE_WEIGHT = { very_important: 3, important: 2, considered: 1, not_considered: 0 };

// The Common Data Set has no "need-blind for international applicants" field, so
// this is a disclosed, hand-curated list rather than sourced CDS data — a short,
// well-documented, stable set of schools (among the ones we track) that are both
// need-blind AND meet full demonstrated need for international applicants. Every
// other school defaults to need-aware for internationals, which is accurate for
// the overwhelming majority of U.S. institutions (nearly all public schools and
// all but a handful of privates limit or condition aid for international students).
const NEED_BLIND_INTERNATIONAL_SLUGS = new Set(['harvard', 'mit', 'princeton', 'yale', 'dartmouth']);

// Competitive majors (CS, Engineering, Business, etc.) are admitted at a
// meaningfully lower rate than a school's overall pool at most universities.
// We don't have per-major CDS data, so this is a disclosed, generic haircut
// on the base rate rather than a school-specific number.
const COMPETITIVE_MAJOR_MULTIPLIER = 0.7;

// ── Calibration ─────────────────────────────────────────────────────────
// Odds are anchored to each school's own typical admit: a student whose
// GPA, scores, rank, rigor and ratings all match what the school typically
// admits (medianAdmitProfile below) gets the school's base odds times
// TYPICAL_ADMIT_ODDS_RATIO. A typical admit is a strong applicant, so this is
// well above the raw acceptance rate, which is diluted by long-shot
// applications: about 13% at a school admitting 4%, 83% at one admitting
// 50%, 97% at one admitting 85%. Every school is anchored the same way, so
// results line up with each school's acceptance rate and student profile.
function typicalAdmitLogOdds(baseRate) {
    return 1.25 + 0.6 * clamp((baseRate - 0.1) / 0.7, 0, 1);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function maxOf(arr) { const v = arr.filter(x => x != null); return v.length ? Math.max(...v) : null; }

// How far each 10 points of score above or below the typical admit moves
// the odds. Above: smaller at the most selective schools, which turn away
// most equally excellent applicants (0.55 at ~0% acceptance up to 0.85).
// Below: a full step where admits are bunched near the top, so students
// well under a selective school's profile end up near zero, easing to 0.7
// at schools admitting half or more, where a student a little below the
// typical admit still has a real chance.
function slopeAbove(baseRate) {
    return clamp(0.55 + baseRate * 1.5, 0.55, 0.85);
}
function slopeBelow(baseRate) {
    return clamp(1.0 - 1.0 * Math.max(0, baseRate - 0.2), 0.7, 1.0);
}

// The score gap to the typical admit, turned into steps on the odds curve.
// Above: diminishing returns (each extra point helps a little less), since
// even a far-above-typical student is turned away often at a selective
// school. Below: the gentle slope applies only to the first 15 points;
// beyond that a steeper one, so a student far under a school's profile
// ends up unlikely even at a school that admits most applicants.
function gapSteps(diff, baseRate) {
    if (diff >= 0) return slopeAbove(baseRate) * Math.log1p(diff / 15) * 1.5;
    const d = -diff;
    return -(slopeBelow(baseRate) * Math.min(d, 15) + 1.0 * Math.max(d - 15, 0)) / 10;
}

// ── School level ─────────────────────────────────────────────────────────
// A school's own GPA figures can't be trusted for this: the CDS never says
// whether they're weighted, and many schools average weighted and
// unweighted GPAs together. So GPA is judged against what a school at this
// level of selectivity typically admits instead. Level comes from the
// acceptance rate, nudged by the class's SAT midpoint when there is one (a
// low-rate school with modest scores reads a bit lower, a high-rate school
// with very high scores a bit higher).
//
// Each anchor is a level, by acceptance rate: the typical admitted
// unweighted GPA (uw) and its spread, the typical weighted GPA on a 5.0
// scale (w) and its spread, and the typical SAT midpoint and spread (used
// only for schools that report no range). Values between
// anchors are interpolated on a log scale of the rate. These are hand-set
// estimates, not CDS figures: at a ~4% school an unweighted 3.85 lands
// around the 8th percentile, at a ~9% school around the 25th, and at a ~70%
// school around the 70th. The GPAs at the less selective end were checked
// against published admit profiles (Michigan State's middle 50% is 3.5-4.0,
// UC Riverside's 3.65-4.16, Iowa State averages 3.75): grade inflation puts
// typical admits there well above 3.3.
//
// The self-ratings are judged the same way: hol = the typical admit's
// activities/essay rating (1-10), awd = awards (1-10), small = the
// recommendations/interview rating (1-5). A 6/10 essay is below typical at
// a school admitting 4% and above typical at one admitting 80%. ap / apAvg =
// the typical admit's number of AP/IB courses and average score.
const LEVEL_ANCHORS = [
    { rate: 0.03, uw: 3.98, uwSd: 0.085, w: 4.55, wSd: 0.20, sat: 1550, satSd: 45,  hol: 8.0, awd: 7.0, small: 4.3, ap: 11, apAvg: 4.6 },
    { rate: 0.08, uw: 3.95, uwSd: 0.13,  w: 4.45, wSd: 0.22, sat: 1500, satSd: 55,  hol: 7.5, awd: 6.5, small: 4.1, ap: 10, apAvg: 4.5 },
    { rate: 0.15, uw: 3.90, uwSd: 0.16,  w: 4.35, wSd: 0.25, sat: 1440, satSd: 70,  hol: 7.0, awd: 6.0, small: 3.9, ap: 9, apAvg: 4.3 },
    { rate: 0.30, uw: 3.84, uwSd: 0.25,  w: 4.20, wSd: 0.33, sat: 1360, satSd: 90,  hol: 6.3, awd: 5.3, small: 3.6, ap: 7, apAvg: 4.0 },
    { rate: 0.50, uw: 3.74, uwSd: 0.30,  w: 4.05, wSd: 0.37, sat: 1260, satSd: 105, hol: 5.5, awd: 4.5, small: 3.3, ap: 5, apAvg: 3.7 },
    { rate: 0.70, uw: 3.66, uwSd: 0.33,  w: 3.95, wSd: 0.40, sat: 1170, satSd: 110, hol: 5.0, awd: 4.0, small: 3.0, ap: 4, apAvg: 3.4 },
    { rate: 0.90, uw: 3.55, uwSd: 0.36,  w: 3.80, wSd: 0.42, sat: 1080, satSd: 115, hol: 4.5, awd: 3.5, small: 2.8, ap: 3, apAvg: 3.2 },
];
// Spread of the self-ratings around the typical admit (1-10 and 1-5 scales).
const RATING_SD_10 = 1.6, RATING_SD_5 = 0.7;
// How much the SAT midpoint moves a school's level vs its acceptance rate.
// Smaller at test-optional schools, whose ranges count only submitters and
// so run high.
const LEVEL_SAT_SHARE = 0.35, LEVEL_SAT_SHARE_OPTIONAL = 0.15;
// Unweighted GPA counts for most of the GPA score; weighted adds a little.
const GPA_UNWEIGHTED_SHARE = 0.75;

// Standard normal CDF (Abramowitz & Stegun 7.1.26), as a 0-100 percentile.
function normalPct(z) {
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
    return 50 * (1 + Math.sign(z) * erf);
}

// Anchor values at a given acceptance rate.
function levelAt(rate) {
    const r = clamp(rate, LEVEL_ANCHORS[0].rate, LEVEL_ANCHORS[LEVEL_ANCHORS.length - 1].rate);
    let i = 0;
    while (i < LEVEL_ANCHORS.length - 2 && r > LEVEL_ANCHORS[i + 1].rate) i++;
    const a = LEVEL_ANCHORS[i], b = LEVEL_ANCHORS[i + 1];
    const f = (Math.log(r) - Math.log(a.rate)) / (Math.log(b.rate) - Math.log(a.rate));
    const out = {};
    for (const k of ['uw', 'uwSd', 'w', 'wSd', 'sat', 'satSd', 'hol', 'awd', 'small', 'ap', 'apAvg']) out[k] = a[k] + (b[k] - a[k]) * f;
    return out;
}

// The acceptance rate a school with this SAT midpoint would typically have.
function rateForSat(sat) {
    const A = LEVEL_ANCHORS;
    if (sat >= A[0].sat) return A[0].rate;
    if (sat <= A[A.length - 1].sat) return A[A.length - 1].rate;
    let i = 0;
    while (sat < A[i + 1].sat) i++;
    const f = (A[i].sat - sat) / (A[i].sat - A[i + 1].sat);
    return Math.exp(Math.log(A[i].rate) + (Math.log(A[i + 1].rate) - Math.log(A[i].rate)) * f);
}

// Rough ACT -> SAT concordance, close enough for placing a school's level
// or a student's score.
function actToSat(act) {
    return act == null ? null : clamp(1040 + (act - 20) * 34.4, 400, 1600);
}

function satMidpoint(school) {
    if (school.sat_composite_25 != null && school.sat_composite_75 != null) return (school.sat_composite_25 + school.sat_composite_75) / 2;
    if (school.act_composite_25 != null && school.act_composite_75 != null) return actToSat((school.act_composite_25 + school.act_composite_75) / 2);
    return null;
}

// The school's level as an effective acceptance rate (null without a rate).
// data/school-levels.json (attached as _levelRate) sets it directly for the
// few schools whose acceptance rate is misleading.
export function schoolLevel(school) {
    if (school._levelRate != null) return { effRate: school._levelRate, ...levelAt(school._levelRate) };
    const rate = school.acceptance_rate;
    if (rate == null || rate <= 0) return null;
    const mid = satMidpoint(school);
    const share = school._testPolicy === 'optional' ? LEVEL_SAT_SHARE_OPTIONAL : LEVEL_SAT_SHARE;
    const effRate = mid == null ? rate
        : Math.exp((1 - share) * Math.log(rate) + share * Math.log(rateForSat(mid)));
    return { effRate, ...levelAt(effRate) };
}

// ── GPA ──────────────────────────────────────────────────────────────────

export function effectiveUnweightedGpa(profile) {
    return profile.gpaUnweighted ?? null;
}

export function effectiveWeightedGpa(profile) {
    return profile.gpaWeighted ?? null;
}

// Puts a weighted GPA on a 5.0 scale: the part above 4.0 is stretched or
// squeezed so the student's school's max maps to 5.0 (a 4.3 out of 4.5 ->
// 4.6). No max given -> assume 5.0, the most common.
function weightedOn5(gpaWeighted, gpaMaxWeighted) {
    if (gpaWeighted == null) return null;
    if (gpaWeighted <= 4 || !gpaMaxWeighted || gpaMaxWeighted <= 4) return gpaWeighted;
    return 4 + (gpaWeighted - 4) / (gpaMaxWeighted - 4);
}

// GPA percentile against the school's level: mostly unweighted, a little
// weighted. Either one alone is used by itself.
export function gpaPercentile(profile, level) {
    if (!level) return null;
    const uw = effectiveUnweightedGpa(profile);
    const w = weightedOn5(effectiveWeightedGpa(profile), profile.gpaMaxWeighted);
    const uwPct = uw == null ? null : normalPct((uw - level.uw) / level.uwSd);
    const wPct = w == null ? null : normalPct((w - level.w) / level.wSd);
    const pct = uwPct != null && wPct != null ? uwPct * GPA_UNWEIGHTED_SHARE + wPct * (1 - GPA_UNWEIGHTED_SHARE)
        : uwPct ?? wPct;
    return pct == null ? null : clamp(pct, 1, 99);
}

// ── Test scores (composite only) ────────────────────────────────────────

// A bell curve fitted to the school's 25th-75th range: exactly the 25th and
// 75th percentiles at those scores, tailing off past them (a 1450 against a
// 1500-1560 range is about the 4th percentile, a 1200 about the 1st).
// Below the middle the spread is at least minSd: scores bunch against the
// top of the scale at the most selective schools, so a very narrow range
// (JHU's 1530-1565) has a longer low tail than its width suggests.
export function scorePercentile(score, p25, p75, minSd = 0) {
    if (score == null || p25 == null || p75 == null) return null;
    if (p75 <= p25) return score >= p75 ? 75 : 25;
    const mid = (p25 + p75) / 2;
    const sd = (p75 - p25) / 1.349;
    return clamp(normalPct((score - mid) / (score < mid ? Math.max(sd, minSd) : sd)), 1, 99);
}

const MIN_SAT_SD = 40, MIN_ACT_SD = 1.2;

function combinedTestPercentile(school, profile) {
    const satPct = scorePercentile(profile.sat, school.sat_composite_25, school.sat_composite_75, MIN_SAT_SD);
    const actPct = scorePercentile(profile.act, school.act_composite_25, school.act_composite_75, MIN_ACT_SD);
    return maxOf([satPct, actPct]);
}

// True when the school requires the SAT or ACT and the student gave neither:
// no estimate is shown for that school until a score is entered.
export function missingRequiredTest(school, profile) {
    return school._testPolicy === 'required' && profile.sat == null && profile.act == null;
}

// True when the student said none of their schools interview, but this one
// actually considers interviews: no estimate until that's resolved, same as
// a required test left blank.
export function missingRequiredInterview(school, profile) {
    const importance = school?.admission_factors?.interview;
    return !!profile.noInterview && !!importance && importance !== 'not_considered';
}

// Used only when a school that considers scores reports no range at all:
// a bell curve around the SAT midpoint and spread typical of its level.
function genericTestPercentile(school, profile) {
    if (school.acceptance_rate == null) return null;
    const { sat: mid, satSd } = levelAt(school.acceptance_rate);
    const pct = sat => sat == null ? null : clamp(normalPct((sat - mid) / satSd), 1, 99);
    return maxOf([pct(profile.sat), pct(actToSat(profile.act))]);
}

// ── Class rank ───────────────────────────────────────────────────────────
// CDS class-rank buckets are cumulative-from-the-top (top10 ⊆ top25 ⊆ top50)
// and top50/bottom50 are complementary halves. We convert them into five
// mutually exclusive bands and estimate the user's percentile: count bands strictly worse than the user's, plus half
// of their own band. userTopPct is the midpoint of the slider band the user
// picked (e.g. "Top 5-10%" -> 7.5).
export function classRankPercentile(userTopPct, buckets) {
    if (userTopPct == null || !buckets) return null;
    const { top10, top25, top50, bottom50, bottom25 } = buckets;
    if ([top10, top25, top50, bottom50, bottom25].every(v => v == null)) return null;

    const bands = [
        { lo: 0,  hi: 10,  frac: Math.max(top10 ?? 0, 0) },
        { lo: 10, hi: 25,  frac: Math.max((top25 ?? 0) - (top10 ?? 0), 0) },
        { lo: 25, hi: 50,  frac: Math.max((top50 ?? 0) - (top25 ?? 0), 0) },
        { lo: 50, hi: 75,  frac: Math.max((bottom50 ?? 0) - (bottom25 ?? 0), 0) },
        { lo: 75, hi: 100, frac: Math.max(bottom25 ?? 0, 0) },
    ];
    const total = bands.reduce((s, b) => s + b.frac, 0);
    if (total <= 0) return null;

    let worse = 0, own = 0;
    for (const b of bands) {
        if (userTopPct <= b.lo) worse += b.frac;
        else if (userTopPct > b.lo && userTopPct <= b.hi) own += b.frac;
    }
    return clamp((worse + own / 2) / total * 100, 1, 99);
}

// No official IB-to-AP concordance table exists; this is a disclosed, commonly-
// used rough heuristic (subtract 2 from the IB 1-7 average to land on AP's 1-5
// scale — IB 7/6 ≈ AP 5, IB 5 ≈ AP 4, IB 3 ≈ AP 1) rather than precise research,
// used only so IB students can enter their real IB average directly instead of
// converting it by hand.
export function ibToApEquivalent(ibAvg) {
    return ibAvg == null ? null : clamp(ibAvg - 2, 1, 5);
}

// ── Rigor (AP/IB load + weighted-GPA strength relative to the student's own school) ──

export function rigorScore(numCourses, avgScore, gpaWeighted, gpaMaxWeighted) {
    const parts = [];
    // != null (not truthy) so an explicit "0 rigorous courses" is real data, not
    // silently dropped and treated the same as "didn't answer."
    if (numCourses != null) parts.push({ v: clamp(numCourses / 10, 0, 1) * 100, w: 0.45 });
    if (avgScore != null) parts.push({ v: clamp(avgScore / 5, 0, 1) * 100, w: 0.35 });
    if (gpaWeighted != null && gpaMaxWeighted) parts.push({ v: clamp(gpaWeighted / gpaMaxWeighted, 0, 1) * 100, w: 0.20 });
    if (!parts.length) return 50; // no rigor data at all — neutral, not a penalty
    const totalW = parts.reduce((s, p) => s + p.w, 0);
    return clamp(parts.reduce((s, p) => s + p.v * p.w, 0) / totalW, 0, 100);
}

// ── Academic Index ──────────────────────────────────────────────────────

export function academicIndex(school, profile) {
    const level = schoolLevel(school);
    const gpaPct = gpaPercentile(profile, level);

    // Test-blind schools don't look at scores, so they're left out entirely.
    // (A required test left blank never gets this far: see missingRequiredTest.)
    const testBlind = school._testPolicy === 'blind';
    const testSpecific = testBlind ? null : combinedTestPercentile(school, profile);
    const testPct = testBlind ? null : testSpecific ?? genericTestPercentile(school, profile);
    const testSourced = testSpecific != null;

    const classRankPct = classRankPercentile(profile.classRankTopPct, school.class_rank);

    const rigor = rigorScore(profile.apCount, profile.apAvgScore, effectiveWeightedGpa(profile), profile.gpaMaxWeighted);

    // Class rank counts for less than GPA or tests: a school's rank figures
    // cover only the admits who reported one, mostly top students, so a good
    // rank can read as below average there.
    const parts = [];
    if (gpaPct != null) parts.push({ v: gpaPct, w: 0.32 });
    if (testPct != null) parts.push({ v: testPct, w: 0.30 });
    if (classRankPct != null) parts.push({ v: classRankPct, w: 0.10 });
    parts.push({ v: rigor, w: 0.18 });

    const totalW = parts.reduce((s, p) => s + p.w, 0);
    const value = clamp(parts.reduce((s, p) => s + p.v * p.w, 0) / totalW, 0, 100);

    return { value, level, gpaPct, testPct, testSourced, testBlind, classRankPct, rigor };
}

// ── Holistic Index (self-rated: Activities, Awards, Essay, LOR, Interview) ──

// Each rating as a percentile against the typical admit at the school's
// level (LEVEL_ANCHORS), like GPA. A blank rating counts as an ordinary
// applicant's (BLANK_RATINGS), not the typical admit's: otherwise skipping a
// scale would beat rating yourself honestly as good-but-not-exceptional.
const BLANK_RATINGS = { activities: 5, essay: 5, awards: 4, lor: 3, interview: 3 };
function ratingPct(rating, typical, sd) {
    return clamp(normalPct((rating - typical) / sd), 1, 99);
}

// Interview isn't a fixed weight like the others — plenty of schools don't
// interview at all, so a self-rating there shouldn't move the needle. Its
// weight scales with that specific school's own declared interview importance
// (0 at "not considered" schools, up to INTERVIEW_MAX_WEIGHT — on par with
// LOR — at schools that call it "Very Important"), and whatever weight it
// claims is taken proportionally from the other four, which always keep their
// relative 0.39 / 0.28 / 0.17 / 0.16 ratio to each other.
const HOLISTIC_BASE_WEIGHTS = { ec: 0.39, essay: 0.28, awards: 0.17, lor: 0.16 };
const INTERVIEW_MAX_WEIGHT = 0.15;
const INTERVIEW_IMPORTANCE_SCALE = { very_important: 1, important: 0.66, considered: 0.33, not_considered: 0 };

export function holisticIndex(profile, school, level = schoolLevel(school) ?? levelAt(0.5)) {
    const ec = ratingPct(profile.activitiesRating ?? BLANK_RATINGS.activities, level.hol, RATING_SD_10);
    const essay = ratingPct(profile.essayRating ?? BLANK_RATINGS.essay, level.hol, RATING_SD_10);
    const awards = ratingPct(profile.awardsRating ?? BLANK_RATINGS.awards, level.awd, RATING_SD_10);
    const lor = ratingPct(profile.lorRating ?? BLANK_RATINGS.lor, level.small, RATING_SD_5);
    const interview = ratingPct(profile.interviewRating ?? BLANK_RATINGS.interview, level.small, RATING_SD_5);

    const interviewImportance = INTERVIEW_IMPORTANCE_SCALE[school?.admission_factors?.interview] ?? 0;
    const interviewWeight = INTERVIEW_MAX_WEIGHT * interviewImportance;
    const scale = 1 - interviewWeight; // base weights already sum to 1.00

    const value =
        ec * HOLISTIC_BASE_WEIGHTS.ec * scale +
        essay * HOLISTIC_BASE_WEIGHTS.essay * scale +
        awards * HOLISTIC_BASE_WEIGHTS.awards * scale +
        lor * HOLISTIC_BASE_WEIGHTS.lor * scale +
        interview * interviewWeight;

    return { value, ec, essay, awards, lor, interview, interviewWeight };
}

// ── Per-school academic/holistic blend from CDS admission factors ──────

// Average importance of a set of factors (0-3). Averaged, not summed, so the
// six holistic factors don't outvote the four academic ones just by count.
function factorWeightMean(factors, keys) {
    if (!factors) return null;
    return keys.reduce((sum, k) => sum + (IMPORTANCE_WEIGHT[factors[k]] ?? 0), 0) / keys.length;
}

// Less selective schools decide mostly on academics even when their CDS
// rates essays and activities: the holistic share keeps its full size up to
// 20% acceptance, then shrinks to half of it at 80% and above.
function holisticSelectivityScale(rate) {
    return rate == null ? 1 : clamp(1 - (rate - 0.2) / 0.6 * 0.5, 0.5, 1);
}

// A test-blind school's CDS may still rate test scores from before it went
// blind, so they count as not considered there.
export function academicHolisticSplit(school) {
    const factors = school._testPolicy === 'blind' && school.admission_factors
        ? { ...school.admission_factors, test_scores: 'not_considered' }
        : school.admission_factors;
    const a = factorWeightMean(factors, ACADEMIC_FACTOR_KEYS);
    const h = factorWeightMean(factors, HOLISTIC_FACTOR_KEYS);
    const sourced = !(a == null || a + h === 0);
    const holistic = (sourced ? h / (a + h) : 0.45) * holisticSelectivityScale(school.acceptance_rate);
    return { academicWeight: 1 - holistic, holisticWeight: holistic, sourced };
}

// Holistic ratings can lift a student only as far as their academics are
// within reach of the school: the above-average part of the holistic score
// is scaled by the square of the academic index over 50 (capped at 1), so
// elite ratings
// can't carry academics far below a school's range. Below-average ratings
// still count in full.
export function gatedHolistic(holisticValue, academicValue) {
    if (holisticValue <= 50) return holisticValue;
    return 50 + (holisticValue - 50) * clamp(academicValue / 50, 0, 1) ** 2;
}

// ── Context modifiers ───────────────────────────────────────────────────

// Real in-state / out-of-state / international admit rates for big publics
// (data/residency-rates.json, attached as _residency). Returns the factor
// to multiply the school's base rate by for this student, or null when the
// school has no such data. A rate that isn't below the in-state rate (out-
// of-state applicants at many publics are a stronger, self-selected pool)
// counts as no residency effect: the same student is never better off from
// out of state.
export function residencyFactor(school, profile) {
    const r = school._residency;
    if (!r) return null;
    const overall = r.overall ?? school.acceptance_rate;
    if (!overall) return null;
    let rate;
    if (profile.country === 'international') rate = r.intl ?? r.outOfState;
    else if (!profile.homeState) return 1;
    else rate = profile.homeState === school.state ? r.inState : r.outOfState;
    if (rate == null || r.inState == null || r.outOfState == null) return 1;
    if (r.outOfState >= r.inState && profile.country !== 'international') return 1;
    if (profile.country === 'international' && rate >= r.inState) return 1;
    return rate / overall;
}

// For publics without real residency rates: a small bump from the CDS
// residency rating.
export function residencyModifier(school, profile) {
    if (school._residency) return 0;
    if (school.school_type !== 'Public') return 0;
    if (profile.country !== 'usa' || !profile.homeState || !school.state) return 0;
    const factors = school.admission_factors ?? {};
    const importance = IMPORTANCE_WEIGHT[factors.state_residence] ?? IMPORTANCE_WEIGHT[factors.geo_residence] ?? 0;
    return profile.homeState === school.state ? importance * 2 : -importance * 1.5;
}

// Only bites if the applicant said they'll need financial aid — a full-pay
// international applicant isn't disadvantaged by a need-aware policy — and
// only at schools that aren't on the need-blind-for-international list above.
// Income (when given) sets how severe the need-aware penalty is; leaving it
// blank defaults to the same mid-severity penalty as before, consistent with
// this being a real structural disadvantage rather than a self-rating (unlike
// the 1-10/1-5 scales, where silence counts as an ordinary applicant).
export function internationalModifier(school, profile) {
    if (profile.country !== 'international') return 0;
    if (profile.needsFinancialAid === false) return 0;
    if (NEED_BLIND_INTERNATIONAL_SLUGS.has(school.slug)) return 0;
    if (profile.incomeBand === '200k-plus') return -1;
    if (!profile.incomeBand) return -3;
    return -4;
}

export function legacyModifier(school, legacyFlag) {
    if (!legacyFlag) return 0;
    return (IMPORTANCE_WEIGHT[school.admission_factors?.alumni_relation] ?? 0) * 1.5;
}

export function firstGenModifier(school, firstGenFlag) {
    if (!firstGenFlag) return 0;
    return (IMPORTANCE_WEIGHT[school.admission_factors?.first_gen] ?? 0) * 1.5;
}

// ── Application plan (RD / EA / ED / ED II…) ────────────────────────────

// Plans come from the school's verified current-cycle rounds (_rounds, from
// data/admission-plans.json, attached at load), so a school with ED I, ED II
// and EA offers all three. Earliest plan first; the first option is the
// default for a newly added school. Several EA rounds (Auburn's EA I-IV)
// share one "ea" option since the estimate treats them alike.
export function schoolPlanOptions(school) {
    const rounds = school._rounds ?? cdsRounds(school);
    const has = re => rounds.some(r => re.test(r.type));
    const opts = [];
    if (has(/^ED( I)?$/)) opts.push({ value: 'ed', label: has(/^ED II$/) ? 'Early Decision I (ED I)' : 'Early Decision (ED)' });
    if (has(/^ED II$/))   opts.push({ value: 'ed2', label: 'Early Decision II (ED II)' });
    if (has(/^REA\b/))    opts.push({ value: 'ea', label: 'Restrictive Early Action (REA)' });
    else if (has(/^EA\b/)) opts.push({ value: 'ea', label: 'Early Action (EA)' });
    opts.push({ value: 'rd', label: 'Regular Decision' });
    return opts;
}

// Applied only when a school doesn't report an EA/RD-specific acceptance rate
// in its own CDS submission (most schools). Reflects the well-documented,
// industry-wide early-round admit-rate bump — a disclosed generic heuristic,
// not this school's own reported number.
const GENERIC_PLAN_BOOST = { ed: 1.45, ed2: 1.30, ea: 1.15, rd: 1.0 };

// A school's reported early rate overstates the boost for a typical
// applicant: early pools are stronger students who know they're
// competitive, and at many schools a big share of ED admits are recruited
// athletes and legacies. So a reported early rate is capped at this many
// times the regular rate (Tufts reports 32% ED vs 8.5% RD; Amherst 22% vs
// 6.8%).
const EARLY_RATE_CAP = { ed: 2.0, ea: 1.3 };

// Schools whose CDS early-round row is a different plan than ea_ed_type
// says (Quinnipiac lists ED, but its 93% early rate is from EA).
const EARLY_POOL_TYPE = { quinnipiac: 'EA' };

// The regular-round rate: reported, or worked out from the totals minus the
// early round when only the early round is broken out (the overall rate
// includes early admits, so it runs high for regular applicants).
function regularRate(school) {
    const pools = school.applicant_pools;
    if (pools?.rd?.rate != null) return pools.rd.rate;
    const e = pools?.ea;
    const apps = school.applicants_total, adm = school.admitted_total;
    if (e?.applied && e?.admitted != null && apps > e.applied && adm >= e.admitted) {
        return (adm - e.admitted) / (apps - e.applied);
    }
    return school.acceptance_rate;
}

function planBaseRate(school, planValue) {
    const pools = school.applicant_pools;
    const type = EARLY_POOL_TYPE[school.slug] ?? school.ea_ed_type;
    const rd = regularRate(school);

    // Only trust the school's own early-round rate when its plan type is
    // unambiguous. "ED I & II" schools report a single "ea" bucket in our
    // data that we can't confidently attribute to ED I alone, so both ed/ed2
    // fall through to the generic heuristic rather than overclaiming precision.
    if (planValue === 'ea' && (type === 'EA' || type === 'REA') && pools?.ea?.rate != null) {
        return { rate: rd ? Math.min(pools.ea.rate, rd * EARLY_RATE_CAP.ea) : pools.ea.rate, sourced: true };
    }
    if (planValue === 'ed' && type === 'ED' && pools?.ea?.rate != null) {
        return { rate: rd ? Math.min(pools.ea.rate, rd * EARLY_RATE_CAP.ed) : pools.ea.rate, sourced: true };
    }
    if (planValue === 'rd' && rd != null && rd !== school.acceptance_rate) {
        return { rate: rd, sourced: true };
    }

    const base = school.acceptance_rate;
    if (base == null) return { rate: null, sourced: false };
    const boost = GENERIC_PLAN_BOOST[planValue] ?? 1.0;
    return { rate: clamp(base * boost, 0.001, 0.98), sourced: false };
}

// ── Typical admit ───────────────────────────────────────────────────────

// The class-rank position (percent from the top) of the school's median
// ranked admit, from its CDS rank bands; null when it reports none.
function medianRankTopPct(buckets) {
    if (!buckets) return null;
    const { top10, top25, top50, bottom50, bottom25 } = buckets;
    if ([top10, top25, top50].every(v => v == null)) return null;
    const bands = [
        { lo: 0, hi: 10, frac: Math.max(top10 ?? 0, 0) },
        { lo: 10, hi: 25, frac: Math.max((top25 ?? 0) - (top10 ?? 0), 0) },
        { lo: 25, hi: 50, frac: Math.max((top50 ?? 0) - (top25 ?? 0), 0) },
        { lo: 50, hi: 75, frac: Math.max((bottom50 ?? 0) - (bottom25 ?? 0), 0) },
        { lo: 75, hi: 100, frac: Math.max(bottom25 ?? 0, 0) },
    ];
    const total = bands.reduce((s, b) => s + b.frac, 0);
    if (total <= 0) return null;
    let cum = 0;
    for (const b of bands) {
        if (cum + b.frac >= total / 2) return b.lo + (b.hi - b.lo) * ((total / 2 - cum) / (b.frac || 1));
        cum += b.frac;
    }
    return 50;
}

// What the school typically admits: GPA and ratings at its level, SAT at the
// middle of its range (or its level's typical SAT when it reports none;
// none at test-blind schools), its median class rank, and the typical
// AP/IB load for its level. Domestic, no state given.
export function medianAdmitProfile(school, level = schoolLevel(school) ?? levelAt(school.acceptance_rate ?? 0.5)) {
    const blind = school._testPolicy === 'blind';
    const sat = blind ? null
        : school.sat_composite_25 != null && school.sat_composite_75 != null ? (school.sat_composite_25 + school.sat_composite_75) / 2
        : school.act_composite_25 != null && school.act_composite_75 != null ? actToSat((school.act_composite_25 + school.act_composite_75) / 2)
        : level.sat;
    return {
        gpaUnweighted: Math.min(4, level.uw), gpaWeighted: level.w, gpaMaxWeighted: 5,
        sat, act: null, apCount: Math.round(level.ap), apAvgScore: level.apAvg,
        classRankTopPct: medianRankTopPct(school.class_rank),
        activitiesRating: level.hol, awardsRating: level.awd, essayRating: level.hol, lorRating: level.small, interviewRating: level.small,
        country: 'usa', homeState: null, firstGen: false,
    };
}

// The combined and academic scores of a school's typical admit, cached per
// school record.
const typicalCache = new WeakMap();
function typicalAdmit(school) {
    if (typicalCache.has(school)) return typicalCache.get(school);
    const prof = medianAdmitProfile(school);
    const ai = academicIndex(school, prof);
    const hi = holisticIndex(prof, school, ai.level ?? levelAt(school.acceptance_rate ?? 0.5));
    const { academicWeight, holisticWeight } = academicHolisticSplit(school);
    const out = { combined: ai.value * academicWeight + gatedHolistic(hi.value, ai.value) * holisticWeight, academic: ai.value };
    typicalCache.set(school, out);
    return out;
}

// Academics far below the school's typical admit cost extra on their own,
// whatever the school's holistic weight: at a school that leans on essays
// and activities, even ordinary ratings would otherwise keep a student with
// academics far out of range near the base rate. Applies past a 30-point
// academic gap, in full at schools admitting 20% or less and tapering to a
// quarter at 65% and above.
function academicFloorSteps(academicGap, baseRate) {
    if (academicGap <= 30) return 0;
    const scale = clamp(1 - (baseRate - 0.2) / 0.6, 0.25, 1);
    return -0.8 * (academicGap - 30) / 10 * scale;
}

// ── Probability + tier ──────────────────────────────────────────────────

export function estimateProbability(school, profile, selection = {}) {
    if (missingRequiredTest(school, profile)) return { needsTest: true };
    if (missingRequiredInterview(school, profile)) return { needsInterview: true };
    const { rate: rawPlanRate, sourced: planSourced } = planBaseRate(school, selection.plan ?? 'rd');
    if (rawPlanRate == null || rawPlanRate <= 0 || rawPlanRate >= 1) return null;

    // Big publics: start from the in-state / out-of-state rate for this student.
    const resFactor = residencyFactor(school, profile);
    const planRate = resFactor != null ? clamp(rawPlanRate * resFactor, 0.001, 0.98) : rawPlanRate;

    const competitiveMajor = !!selection.competitiveMajor;
    const base = competitiveMajor ? clamp(planRate * COMPETITIVE_MAJOR_MULTIPLIER, 0.001, 0.98) : planRate;

    const ai = academicIndex(school, profile);
    const hi = holisticIndex(profile, school, ai.level ?? levelAt(school.acceptance_rate ?? 0.5));
    const { academicWeight, holisticWeight, sourced } = academicHolisticSplit(school);
    const hiGated = gatedHolistic(hi.value, ai.value);
    const combined = ai.value * academicWeight + hiGated * holisticWeight;

    const modifier =
        residencyModifier(school, profile) +
        internationalModifier(school, profile) +
        legacyModifier(school, selection.legacy) +
        firstGenModifier(school, profile.firstGen);

    // Anchored to the school's typical admit (see typicalAdmitLogOdds).
    const typical = typicalAdmit(school);
    // At schools that weigh academics at more than 75% (formula schools
    // like the CSUs are 100%), there's no holistic part to average a score
    // toward the middle, so the same student lands further from typical;
    // scaling the gap keeps the odds curve comparable to other schools.
    const diff = (combined - typical.combined) * Math.min(1, 0.75 / academicWeight);
    const baseLogit = Math.log(base / (1 - base));
    const logit = baseLogit + typicalAdmitLogOdds(base) + gapSteps(diff, base)
        + academicFloorSteps(typical.academic - ai.value, base) + modifier / 10;
    // Never certain either way: odds stay between 0.05% and 99.5%.
    const p = clamp(1 / (1 + Math.exp(-logit)), 0.0005, 0.995);

    return {
        p, combined, typicalCombined: typical.combined, academicWeight, holisticWeight, sourced, modifier, ai, hi, hiGated,
        planBaseRate: planRate, planSourced, residencySourced: resFactor != null && resFactor !== 1,
        competitiveMajor, effectiveBaseRate: base,
    };
}

export function tierFor(p) {
    return CHANCE_TIERS.find(t => p <= t.ceiling) ?? CHANCE_TIERS[CHANCE_TIERS.length - 1];
}

// ── DOM wiring (browser only) ───────────────────────────────────────────

if (typeof document !== 'undefined') {
    const DRAFT_KEY = 'cds_chanceme_draft';

    const state = {
        targetSchools: [], // { slug, plan, legacy, competitiveMajor }
        ratings: { activities: null, awards: null, essay: null, lor: null, interview: null },
        essayRubric: {}, // { theme, show, voice, writing }: 1-5 each
    };

    let allSchools = [];
    // Search aliases (data/school-names.json), so "ASU" or "UVA" finds the school.
    let schoolNames = {};

    function loadDraft() {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw);
            Object.entries(draft.fields ?? {}).forEach(([id, v]) => {
                const el = document.getElementById(id);
                if (!el) return;
                if (el.type === 'checkbox') el.checked = !!v;
                else el.value = v;
            });
            state.targetSchools = draft.targetSchools ?? [];
            state.ratings = { ...state.ratings, ...(draft.ratings ?? {}) };
            state.essayRubric = draft.essayRubric ?? {};
            // The essay rating only comes from the rubric now (older drafts
            // saved a 1-10 pick).
            state.ratings.essay = essayRubricScore(state.essayRubric);
        } catch { /* ignore corrupt draft */ }
    }

    const FIELD_IDS = [
        'cm-gpa-unweighted', 'cm-gpa-weighted', 'cm-gpa-max-weighted',
        'cm-course-track', 'cm-ap-count', 'cm-ap-avg', 'cm-ib-count', 'cm-ib-avg',
        'cm-dual-enrollment-check', 'cm-dual-enrollment-count',
        'cm-sat', 'cm-act', 'cm-class-rank-band',
        'cm-country', 'cm-state', 'cm-first-gen', 'cm-income', 'cm-intl-aid', 'cm-no-interview',
    ];

    function saveDraft() {
        const fields = {};
        FIELD_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) fields[id] = el.type === 'checkbox' ? el.checked : el.value;
        });
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            fields, targetSchools: state.targetSchools, ratings: state.ratings, essayRubric: state.essayRubric,
        }));
    }

    function val(id) { return document.getElementById(id)?.value ?? ''; }
    function num(id) { const v = val(id); return v === '' ? null : Number(v); }
    function checked(id) { return !!document.getElementById(id)?.checked; }

    function toggleStateField() {
        const isUsa = val('cm-country') === 'usa';
        document.getElementById('cm-state-field').style.display = isUsa ? '' : 'none';
        document.getElementById('cm-intl-aid-field').style.display = isUsa ? 'none' : '';
    }

    function toggleCourseTrackFields() {
        const track = val('cm-course-track');
        document.getElementById('cm-ap-count-field').style.display = track === 'ap' ? '' : 'none';
        document.getElementById('cm-ap-avg-field').style.display = track === 'ap' ? '' : 'none';
        document.getElementById('cm-ib-count-field').style.display = track === 'ib' ? '' : 'none';
        document.getElementById('cm-ib-avg-field').style.display = track === 'ib' ? '' : 'none';
    }

    function toggleDualEnrollmentCount() {
        document.getElementById('cm-dual-enrollment-count').style.display = checked('cm-dual-enrollment-check') ? '' : 'none';
    }

    function toggleInterviewScale() {
        const noInterview = checked('cm-no-interview');
        document.getElementById('cm-scale-interview').style.display = noInterview ? 'none' : '';
        document.getElementById('cm-scale-interview-caption').style.display = noInterview ? 'none' : '';
    }

    function renderClassRankBandLabel() {
        const slider = document.getElementById('cm-class-rank-band');
        const position = Number(slider.value) || 0;
        document.getElementById('cm-class-rank-band-value').textContent = classRankBandLabel(position);
        const pct = (position / (Number(slider.max) || 20)) * 100;
        slider.style.background = `linear-gradient(to right, var(--cm-accent) 0%, var(--cm-accent) ${pct}%, #ddd ${pct}%, #ddd 100%)`;
    }

    // ── Scale pickers (activities / awards / essay / LOR) ──
    function labelsForMax(max) { return max === 5 ? SCALE_5_LABELS : SCALE_10_LABELS; }

    function renderScale(containerId, captionId, key) {
        const container = document.getElementById(containerId);
        const caption = document.getElementById(captionId);
        const max = Number(container.dataset.max) || 10;
        const labels = labelsForMax(max);
        container.innerHTML = Array.from({ length: max }, (_, i) => {
            const n = i + 1;
            const active = state.ratings[key] === n ? ' active' : '';
            return `<button type="button" class="cm-scale-btn${active}" data-val="${n}">${n}</button>`;
        }).join('');
        caption.textContent = state.ratings[key] ? labels[state.ratings[key] - 1] : '';

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.cm-scale-btn');
            if (!btn) return;
            state.ratings[key] = Number(btn.dataset.val);
            renderScale(containerId, captionId, key);
            saveDraft();
        });
    }

    // Essay rubric as a table: a level-label column, then one column per
    // category with levels 5 (top) to 1. Items go column by column so on
    // phones (one column, labels hidden) it stacks by category.
    function renderEssayRubric() {
        const el = document.getElementById('cm-essay-rubric');
        const caption = document.getElementById('cm-essay-rubric-caption');
        if (!el) return;
        const levels = [5, 4, 3, 2, 1];
        el.innerHTML = `
            <div class="cm-rubric-corner"></div>
            ${levels.map(lv => `
            <div class="cm-rubric-rowlabel"><strong>${lv}</strong>${ESSAY_RUBRIC_LEVELS[lv]}</div>`).join('')}
            ${ESSAY_RUBRIC.map(c => `
            <div class="cm-rubric-head">${c.title}</div>
            ${levels.map(lv => `
            <button type="button" class="cm-rubric-cell${state.essayRubric[c.key] === lv ? ' active' : ''}" data-key="${c.key}" data-level="${lv}">
                <span class="cm-rubric-level">${lv} · ${ESSAY_RUBRIC_LEVELS[lv]}</span>
                <span class="cm-rubric-desc">${c.levels[lv]}</span>
            </button>`).join('')}`).join('')}`;
        const picked = ESSAY_RUBRIC.filter(c => state.essayRubric[c.key] != null).length;
        const score = essayRubricScore(state.essayRubric);
        caption.textContent = score != null
            ? `Essay score: ${score}/10 (${SCALE_10_LABELS[Math.round(score) - 1]})`
            : picked ? `${picked} of ${ESSAY_RUBRIC.length} categories picked` : '';
    }

    function renderScaleExamples(containerId, examples, note) {
        const el = document.getElementById(containerId);
        if (!el) return;
        // Collapsed by default — the scale itself stays front and center, and
        // anyone unsure what a number means can open the examples.
        el.innerHTML = `
            <details class="cm-examples-toggle">
                <summary>See examples</summary>
                <div class="cm-scale-examples-list">
                    ${examples.map(ex => `
                    <div class="cm-scale-example">
                        <span class="cm-scale-example-badge">${ex.score}</span>
                        <span class="cm-scale-example-desc">${ex.desc}</span>
                    </div>`).join('')}
                </div>
                ${note ? `<p class="cm-scale-examples-note">${note}</p>` : ''}
            </details>`;
    }

    // ── Target schools ──
    function cmSchoolOptionHtml(s) {
        const picked = state.targetSchools.some(t => t.slug === s.slug);
        return `<div class="cm-school-option${picked ? ' disabled' : ''}" data-slug="${s.slug}">
            <img class="cm-school-option-logo" src="${logoSrc(s.slug)}" alt="" onerror="${LOGO_ONERR}">
            <span class="cm-school-option-name">${s.name}</span>
        </div>`;
    }

    function renderSchoolDropdown(query) {
        const dropdown = document.getElementById('cm-school-dropdown');

        // Empty query, just focused: Recently Viewed and Favorites on top,
        // same as the header search dropdown (js/header-search.js), then
        // every school under "All Schools" so the list stays browsable.
        let topSections = '';
        if (query === '') {
            const bySlug = new Map(allSchools.map(s => [s.slug, s]));
            const historySlugs = JSON.parse(localStorage.getItem('cds_recently_viewed') ?? '[]');
            const favoriteSlugs = JSON.parse(localStorage.getItem('cds_favorites') ?? '[]');
            const historyItems = historySlugs.map(s => bySlug.get(s)).filter(Boolean);
            const favoriteItems = favoriteSlugs.map(s => bySlug.get(s)).filter(Boolean);
            const sections = [];
            if (historyItems.length) sections.push(`<div class="search-dropdown-label">Recently Viewed</div>${historyItems.map(cmSchoolOptionHtml).join('')}`);
            if (favoriteItems.length) sections.push(`<div class="search-dropdown-label">Favorites</div>${favoriteItems.map(cmSchoolOptionHtml).join('')}`);
            if (sections.length) topSections = sections.join('') + '<div class="search-dropdown-label">All Schools</div>';
        }

        const results = allSchools
            .filter(s => query === '' || nameMatches(s, query.toLowerCase(), schoolNames))
            .sort((a, b) => a.name.localeCompare(b.name));

        dropdown.innerHTML = results.length
            ? topSections + results.map(cmSchoolOptionHtml).join('')
            : '<div class="cm-list-empty" style="padding:12px 16px">No schools found.</div>';
        dropdown.classList.add('open');
    }

    function renderTargetSchools() {
        const wrap = document.getElementById('cm-target-schools');
        wrap.innerHTML = state.targetSchools.map(t => {
            const s = allSchools.find(sc => sc.slug === t.slug);
            if (!s) return '';
            const planOpts = schoolPlanOptions(s)
                .map(o => `<option value="${o.value}"${t.plan === o.value ? ' selected' : ''}>${o.label}</option>`)
                .join('');
            return `<div class="cm-target-card" data-slug="${t.slug}">
                <div class="cm-target-card-header">
                    <img class="cm-school-option-logo" src="${logoSrc(t.slug)}" alt="" onerror="${LOGO_ONERR}">
                    <span class="cm-target-card-name">${s.name}</span>
                    <button type="button" class="cm-list-remove cm-target-remove" data-slug="${t.slug}" aria-label="Remove">&times;</button>
                </div>
                <div class="cm-target-card-body">
                    <div class="cm-field">
                        <label class="cm-label">Application Plan</label>
                        <select class="cm-select cm-target-plan" data-slug="${t.slug}">${planOpts}</select>
                    </div>
                    <label class="cm-checkbox-row">
                        <input type="checkbox" class="cm-target-legacy" data-slug="${t.slug}"${t.legacy ? ' checked' : ''}>
                        <span>Legacy at this school (parent/guardian alum)</span>
                    </label>
                    <label class="cm-checkbox-row">
                        <input type="checkbox" class="cm-target-competitive-major" data-slug="${t.slug}"${t.competitiveMajor ? ' checked' : ''}>
                        <span>Applying to a competitive major</span>
                    </label>
                </div>
            </div>`;
        }).join('');
    }

    function addSchool(slug) {
        if (state.targetSchools.some(t => t.slug === slug)) return;
        const school = allSchools.find(s => s.slug === slug);
        state.targetSchools.push({ slug, plan: schoolPlanOptions(school)[0].value, legacy: false, competitiveMajor: false });
        renderTargetSchools();
        saveDraft();
    }

    function removeSchool(slug) {
        state.targetSchools = state.targetSchools.filter(t => t.slug !== slug);
        renderTargetSchools();
        saveDraft();
    }

    // ── Results ──
    function buildProfile() {
        const track = val('cm-course-track'); // '', 'ap', 'ib'
        const trackCount = track === 'ap' ? num('cm-ap-count') : track === 'ib' ? num('cm-ib-count') : null;
        const trackAvgApEquivalent = track === 'ap' ? num('cm-ap-avg')
            : track === 'ib' ? ibToApEquivalent(num('cm-ib-avg'))
            : null;
        const dualCount = checked('cm-dual-enrollment-check') ? num('cm-dual-enrollment-count') : null;
        // Only combine into a real count if at least one side actually has data —
        // otherwise this should stay null (no rigor-count data at all), not 0.
        const rigorCourseCount = (trackCount != null || dualCount != null) ? (trackCount ?? 0) + (dualCount ?? 0) : null;

        const intlAid = val('cm-intl-aid');

        return {
            gpaUnweighted: num('cm-gpa-unweighted'),
            gpaWeighted: num('cm-gpa-weighted'),
            gpaMaxWeighted: num('cm-gpa-max-weighted'),
            apCount: rigorCourseCount,
            apAvgScore: trackAvgApEquivalent,
            sat: num('cm-sat'),
            act: num('cm-act'),
            classRankTopPct: classRankTopPctFromPosition(Number(val('cm-class-rank-band')) || 0),
            country: val('cm-country') || 'usa',
            homeState: val('cm-state') || null,
            firstGen: val('cm-first-gen') === 'yes',
            incomeBand: val('cm-income') || null,
            needsFinancialAid: intlAid === 'yes' ? true : intlAid === 'no' ? false : null,
            activitiesRating: state.ratings.activities,
            awardsRating: state.ratings.awards,
            essayRating: state.ratings.essay,
            lorRating: state.ratings.lor,
            interviewRating: state.ratings.interview,
            noInterview: checked('cm-no-interview'),
        };
    }

    function pctLabel(p) { return (p * 100).toFixed(1) + '%'; }
    function ordinal(n) {
        const r = Math.round(n), t = r % 100;
        return r + (t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[r % 10] ?? 'th'));
    }

    function renderResults(profile) {
        const list = document.getElementById('cm-results-list');

        list.innerHTML = state.targetSchools.map(t => {
            const school = allSchools.find(s => s.slug === t.slug);
            if (!school) return '';
            const result = estimateProbability(school, profile, t);
            const planLabel = schoolPlanOptions(school).find(o => o.value === t.plan)?.label ?? 'Regular Decision';

            if (!result || result.needsTest || result.needsInterview) {
                const message = result?.needsTest
                    ? 'This school requires the SAT or ACT. Add a score to see an estimate.'
                    : result?.needsInterview
                    ? "This school considers interviews. Uncheck \"None of my schools interview\" and rate yours to see an estimate."
                    : 'No acceptance-rate data available for this school.';
                return `<div class="cm-result-card">
                    <img class="cm-result-logo" src="${logoSrc(school.slug)}" alt="" onerror="${LOGO_ONERR}">
                    <div class="cm-result-body">
                        <div class="cm-result-name">${school.name}</div>
                        <div class="cm-result-meta">${message}</div>
                    </div>
                </div>`;
            }
            const tier = tierFor(result.p);
            const detailId = `cm-detail-${school.slug}`;
            const lvl = result.ai.level;
            return `<div class="cm-result-card border-${tier.key}">
                <img class="cm-result-logo" src="${logoSrc(school.slug)}" alt="" onerror="${LOGO_ONERR}">
                <div class="cm-result-body">
                    <div class="cm-result-name">${school.name}</div>
                    <div class="cm-result-meta">${planLabel}${result.planSourced ? '' : ' (school-specific round data unavailable - generic estimate)'} · Base rate used: ${pctLabel(result.effectiveBaseRate)}${result.competitiveMajor ? ' (competitive-major adjustment applied)' : ''}${result.residencySourced ? (profile.country === 'international' ? ' (international admit rate)' : profile.homeState === school.state ? ' (in-state admit rate)' : ' (out-of-state admit rate)') : ''}${result.sourced ? '' : ' · limited CDS data - generic academic/holistic weighting used'}</div>
                </div>
                <div class="cm-result-tier-wrap">
                    <span class="cm-tier-badge cm-tier-${tier.key}">${tier.label}</span>
                    <div class="cm-result-pct">~${pctLabel(result.p)} estimated odds</div>
                </div>
                <div class="cm-result-toggle">
                    <button type="button" data-target="${detailId}">Show breakdown</button>
                </div>
                <div class="cm-result-detail" id="${detailId}">
                    <div class="cm-detail-row"><span>Academic Index</span><span>${result.ai.value.toFixed(1)} / 100</span></div>
                    <div class="cm-detail-row"><span>Holistic Index</span><span>${result.hi.value.toFixed(1)} / 100</span></div>
                    <div class="cm-detail-row"><span>Blend used (this school's CDS weighting)</span><span>${Math.round(result.academicWeight * 100)}% academic / ${Math.round(result.holisticWeight * 100)}% holistic</span></div>
                    ${lvl ? `<div class="cm-detail-row"><span>Typical admit at this school's level</span><span>${lvl.uw.toFixed(2)} unweighted / ${lvl.w.toFixed(2)} weighted (5.0 scale)</span></div>` : ''}
                    ${result.ai.gpaPct != null ? `<div class="cm-detail-row"><span>GPA percentile</span><span>${ordinal(result.ai.gpaPct)}</span></div>` : ''}
                    ${result.ai.testBlind ? `<div class="cm-detail-row"><span>Test scores</span><span>not used - this school is test-blind</span></div>`
                        : result.ai.testPct != null ? `<div class="cm-detail-row"><span>Test-score percentile</span><span>${ordinal(result.ai.testPct)}${result.ai.testSourced ? '' : " (estimated - school doesn't report a test-score range)"}</span></div>` : ''}
                    ${result.hi.interviewWeight > 0 ? `<div class="cm-detail-row"><span>Interview weight at this school</span><span>${Math.round(result.hi.interviewWeight * 100)}% of Holistic Index</span></div>` : ''}
                    ${result.modifier !== 0 ? `<div class="cm-detail-row"><span>Residency / legacy / first-gen / international-aid adjustments</span><span>${result.modifier > 0 ? '+' : ''}${result.modifier.toFixed(1)}</span></div>` : ''}
                    ${result.competitiveMajor ? `<div class="cm-detail-row"><span>Competitive-major haircut (generic heuristic)</span><span>×0.7 on base rate</span></div>` : ''}
                    <div class="cm-detail-note">Academic Index blends your GPA against what schools this selective typically admit (mostly unweighted, partly weighted), class-rank percentile (if given), test-score percentile against this school's range (left out at test-blind schools), and course rigor. Holistic Index blends your Activities, Awards, Essay, Letters-of-Recommendation, and Interview ratings, each judged against what a typical admit at this level brings - Interview's weight above is this school's own. Strong ratings can only lift you as far as your academics are within reach of the school.</div>
                </div>
            </div>`;
        }).join('');

        list.querySelectorAll('.cm-result-toggle button').forEach(btn => {
            btn.addEventListener('click', () => {
                const detail = document.getElementById(btn.dataset.target);
                const open = detail.classList.toggle('open');
                btn.textContent = open ? 'Hide breakdown' : 'Show breakdown';
            });
        });

        document.getElementById('cm-results').style.display = '';
        document.getElementById('cm-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── Init ──
    async function init() {
        const stateSelect = document.getElementById('cm-state');
        stateSelect.innerHTML = '<option value="">Select state…</option>' +
            US_STATES.map(([code, name]) => `<option value="${code}">${name}</option>`).join('');

        // Each school's latest CDS year (same set as the home page and school
        // pages), with the same test-score and class-rank fixes the school
        // page shows: outside SAT/ACT ranges, estimated SAT composites, and
        // class rank reported as bands.
        const loadJson = (url, key) => fetch(url).then(r => (r.ok ? r.json() : {})).then(j => j[key] ?? {}).catch(() => ({}));
        const [latest, plans, names, outsideTests, testPolicies, levels, residency] = await Promise.all([
            loadLatestSchools(),
            loadAdmissionPlans(),
            loadSchoolNames(),
            loadOutsideTests(),
            loadTestPolicies(),
            loadJson('/data/school-levels.json', 'levels'),
            loadJson('/data/residency-rates.json', 'rates'),
        ]);
        schoolNames = names;
        const fixed = withSatEstimates(withOutsideTests(await withRankBandFixes(latest), outsideTests));
        // data/school-levels.json: Chance Me-only level and SAT-range corrections.
        const withSatFix = s => levels[s.slug]?.sat
            ? { ...s, sat_composite_25: levels[s.slug].sat[0], sat_composite_75: levels[s.slug].sat[1] }
            : s;
        allSchools = fixed.map(s => ({ ...withSatFix(s), _rounds: plans[s.slug] ?? cdsRounds(s), _testPolicy: testPolicies[s.slug]?.sat ?? null, _levelRate: levels[s.slug]?.rate ?? null, _residency: residency[s.slug] ?? null }));

        loadDraft();
        // A saved draft may name a plan a school no longer offers (its plans
        // were corrected since); fall back to that school's default plan.
        for (const t of state.targetSchools) {
            const school = allSchools.find(s => s.slug === t.slug);
            if (school && !schoolPlanOptions(school).some(o => o.value === t.plan)) t.plan = schoolPlanOptions(school)[0].value;
        }
        toggleStateField();
        toggleCourseTrackFields();
        toggleDualEnrollmentCount();
        toggleInterviewScale();
        renderClassRankBandLabel();
        renderTargetSchools();

        renderScale('cm-scale-activities', 'cm-scale-activities-caption', 'activities');
        renderScale('cm-scale-awards', 'cm-scale-awards-caption', 'awards');
        renderEssayRubric();
        renderScale('cm-scale-lor', 'cm-scale-lor-caption', 'lor');
        renderScale('cm-scale-interview', 'cm-scale-interview-caption', 'interview');

        renderScaleExamples('cm-scale-activities-examples', ACTIVITY_SCALE_EXAMPLES, SCALE_EXAMPLES_NOTE);
        renderScaleExamples('cm-scale-awards-examples', AWARD_SCALE_EXAMPLES, SCALE_EXAMPLES_NOTE);
        document.getElementById('cm-essay-rubric').addEventListener('click', (e) => {
            const btn = e.target.closest('.cm-rubric-cell');
            if (!btn) return;
            state.essayRubric[btn.dataset.key] = Number(btn.dataset.level);
            state.ratings.essay = essayRubricScore(state.essayRubric);
            renderEssayRubric();
            saveDraft();
        });

        document.getElementById('cm-country').addEventListener('change', () => { toggleStateField(); saveDraft(); });
        document.getElementById('cm-course-track').addEventListener('change', () => { toggleCourseTrackFields(); saveDraft(); });
        document.getElementById('cm-dual-enrollment-check').addEventListener('change', () => { toggleDualEnrollmentCount(); saveDraft(); });
        document.getElementById('cm-no-interview').addEventListener('change', () => { toggleInterviewScale(); saveDraft(); });

        document.getElementById('cm-class-rank-band').addEventListener('input', renderClassRankBandLabel);

        const schoolInput = document.getElementById('cm-school-input');
        const schoolDropdown = document.getElementById('cm-school-dropdown');
        schoolInput.addEventListener('focus', () => renderSchoolDropdown(schoolInput.value.trim()));
        schoolInput.addEventListener('input', () => renderSchoolDropdown(schoolInput.value.trim()));
        schoolDropdown.addEventListener('click', (e) => {
            const opt = e.target.closest('.cm-school-option');
            if (!opt || opt.classList.contains('disabled')) return;
            addSchool(opt.dataset.slug);
            schoolInput.value = '';
            schoolDropdown.classList.remove('open');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.cm-school-search')) schoolDropdown.classList.remove('open');
        });

        document.getElementById('cm-target-schools').addEventListener('click', (e) => {
            const btn = e.target.closest('.cm-target-remove');
            if (btn) removeSchool(btn.dataset.slug);
        });
        document.getElementById('cm-target-schools').addEventListener('change', (e) => {
            const slug = e.target.dataset.slug;
            if (!slug) return;
            const t = state.targetSchools.find(x => x.slug === slug);
            if (!t) return;
            if (e.target.classList.contains('cm-target-plan')) t.plan = e.target.value;
            if (e.target.classList.contains('cm-target-legacy')) t.legacy = e.target.checked;
            if (e.target.classList.contains('cm-target-competitive-major')) t.competitiveMajor = e.target.checked;
            saveDraft();
        });

        document.getElementById('cm-form').addEventListener('input', saveDraft);
        document.getElementById('cm-form').addEventListener('change', saveDraft);

        document.getElementById('cm-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('cm-form-error');
            errorEl.textContent = '';

            const profile = buildProfile();
            if (profile.gpaUnweighted == null && profile.sat == null && profile.act == null) {
                errorEl.textContent = 'Enter at least a GPA, SAT, or ACT score to get an estimate.';
                return;
            }
            if (state.targetSchools.length === 0) {
                errorEl.textContent = 'Add at least one target school.';
                return;
            }

            saveDraft();
            renderResults(profile);
        });
    }

    init();
}
