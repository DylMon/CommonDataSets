// Chance Me — deterministic, formula-based admission-odds estimator.
// Everything here runs client-side against data/schools.json. No AI, no server,
// nothing typed into the form is ever transmitted anywhere.

const LOGOS = {
    'mit': 'MITlogo.png', 'harvard': 'harvardlogo.png', 'stanford': 'stanfordlogo.png',
    'princeton': 'princetonlogo.png', 'yale': 'yalelogo.png', 'columbia': 'Columbialogo.png',
    'upenn': 'UPennlogo.png', 'caltech': 'Caltechlogo.png', 'duke': 'Dukelogo1.png',
    'jhu': 'JHUlogo.png', 'northwestern': 'NUlogo1.png', 'dartmouth': 'dartmouthlogo1.png',
    'brown': 'brownlogo.png', 'vanderbilt': 'vandylogo.png', 'rice': 'ricelogo.png',
    'washu': 'washulogo.png', 'notre-dame': 'NDlogo.png', 'cornell': 'cornelllogo.png',
    'uchicago': 'uchicagologo.png', 'cmu': 'CMUlogo.png', 'georgetown': 'georgetownlogo.png',
    'emory': 'emorylogo.png', 'wake-forest': 'wakeforestlogo.png', 'tufts': 'tuftslogo.png',
    'ucla': 'uclalogo.png', 'berkeley': 'ucblogo.png', 'ucsb': 'ucsblogo.png',
    'uva': 'UVAlogo.png', 'umich': 'UMichlogo.png', 'unc': 'UNClogo.png',
    'uf': 'uflogo.png', 'usc': 'USClogo.png', 'nyu': 'NYUlogo.png',
};

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

export const ACTIVITY_CATEGORIES = [
    { value: 'club', label: 'Club / Organization' },
    { value: 'sports', label: 'Sports / Athletics' },
    { value: 'job', label: 'Job / Employment' },
    { value: 'research', label: 'Research' },
    { value: 'community_service', label: 'Community Service / Volunteering' },
    { value: 'arts', label: 'Performing / Visual Arts' },
    { value: 'other', label: 'Other' },
];

// Each category gets its own 4-tier role ladder (junior → top leadership),
// weighted on the same 1.0–1.5 scale so no category is systematically
// favored just by having "better-sounding" role names.
export const ROLE_OPTIONS_BY_CATEGORY = {
    club: [
        { value: 'member', label: 'Member', weight: 1.0 },
        { value: 'board_member', label: 'Board Member', weight: 1.2 },
        { value: 'president', label: 'President', weight: 1.4 },
        { value: 'founder', label: 'Founder', weight: 1.5 },
    ],
    sports: [
        { value: 'jv', label: 'JV', weight: 0.9 },
        { value: 'club_team', label: 'Club Team', weight: 1.0 },
        { value: 'varsity', label: 'Varsity', weight: 1.2 },
        { value: 'captain', label: 'Team Captain', weight: 1.5 },
    ],
    job: [
        { value: 'employee', label: 'Employee', weight: 1.0 },
        { value: 'shift_lead', label: 'Shift Lead / Supervisor', weight: 1.2 },
        { value: 'manager', label: 'Manager', weight: 1.4 },
        { value: 'owner', label: 'Owner / Founder', weight: 1.5 },
    ],
    research: [
        { value: 'assistant', label: 'Research Assistant', weight: 1.0 },
        { value: 'lead_student', label: 'Lead Student Researcher', weight: 1.2 },
        { value: 'co_author', label: 'Published Co-Author', weight: 1.4 },
        { value: 'pi', label: 'Principal Investigator / Project Lead', weight: 1.5 },
    ],
    community_service: [
        { value: 'volunteer', label: 'Volunteer', weight: 1.0 },
        { value: 'team_lead', label: 'Team Lead', weight: 1.2 },
        { value: 'coordinator', label: 'Program Coordinator', weight: 1.4 },
        { value: 'founder', label: 'Founder / Organizer', weight: 1.5 },
    ],
    arts: [
        { value: 'ensemble', label: 'Ensemble Member', weight: 1.0 },
        { value: 'section_leader', label: 'Featured / Section Leader', weight: 1.2 },
        { value: 'lead', label: 'Lead Role / Soloist', weight: 1.4 },
        { value: 'director', label: 'Director / Founder', weight: 1.5 },
    ],
    other: [
        { value: 'participant', label: 'Participant', weight: 1.0 },
        { value: 'contributor', label: 'Contributor', weight: 1.2 },
        { value: 'leader', label: 'Leader', weight: 1.4 },
        { value: 'founder', label: 'Founder', weight: 1.5 },
    ],
};

export const MAX_ACTIVITIES = 10;
export const MAX_AWARDS = 6;

// Award level scales the entry's weight directly.
export const AWARD_LEVELS = [
    { value: 'school', label: 'School', score: 30 },
    { value: 'regional', label: 'Regional', score: 45 },
    { value: 'state', label: 'State', score: 60 },
    { value: 'national', label: 'National', score: 80 },
    { value: 'international', label: 'International', score: 95 },
];
const AWARD_LEVEL_SCORE = Object.fromEntries(AWARD_LEVELS.map(l => [l.value, l.score]));
const AWARD_LEVEL_DEFAULT_SCORE = 40;

// Single shared 1-7 scale used for every self-rating on the page.
export const SCALE_7_LABELS = [
    'Extremely Weak', 'Weak', 'Below Average', 'Average', 'Above Average', 'Great', 'Excellent',
];

export const CHANCE_TIERS = [
    { ceiling: 0.01,  key: 'not-possible',      label: 'Not Possible' },
    { ceiling: 0.08,  key: 'highly-unlikely',    label: 'Highly Unlikely' },
    { ceiling: 0.25,  key: 'unlikely',           label: 'Unlikely' },
    { ceiling: 0.55,  key: 'toss-up',            label: 'Toss Up' },
    { ceiling: 0.80,  key: 'likely',             label: 'Likely' },
    { ceiling: 0.95,  key: 'highly-likely',      label: 'Highly Likely' },
    { ceiling: 1.001, key: 'almost-guaranteed',  label: 'Almost Guaranteed' },
];

const ACADEMIC_FACTOR_KEYS = ['rigor', 'class_rank', 'academic_gpa', 'test_scores'];
const HOLISTIC_FACTOR_KEYS = ['essay', 'extracurriculars', 'talent', 'character', 'recommendations'];
const IMPORTANCE_WEIGHT = { very_important: 3, important: 2, considered: 1, not_considered: 0 };

const GPA_BANDS = [
    { min: 0.00, max: 0.999, key: 'below_1_0' },
    { min: 1.00, max: 1.99,  key: '1_00_to_1_99' },
    { min: 2.00, max: 2.49,  key: '2_00_to_2_49' },
    { min: 2.50, max: 2.99,  key: '2_50_to_2_99' },
    { min: 3.00, max: 3.24,  key: '3_00_to_3_24' },
    { min: 3.25, max: 3.49,  key: '3_25_to_3_49' },
    { min: 3.50, max: 3.74,  key: '3_50_to_3_74' },
    { min: 3.75, max: 3.99,  key: '3_75_to_3_99' },
    { min: 4.00, max: 4.00,  key: '4_0' },
];

// Later years carry more weight in how admissions officers actually read a transcript
// (junior year is scrutinized hardest; senior year fall grades matter for RD).
const YEAR_WEIGHTS = { y9: 0.15, y10: 0.25, y11: 0.35, y12: 0.25 };

// Competitive majors (CS, Engineering, Business, etc.) are admitted at a
// meaningfully lower rate than a school's overall pool at most universities.
// We don't have per-major CDS data, so this is a disclosed, generic haircut
// on the base rate rather than a school-specific number.
const COMPETITIVE_MAJOR_MULTIPLIER = 0.7;

// CDS distributions describe the ENROLLED/ADMITTED class, not the full
// applicant pool (which includes a long tail of unrealistic "reach" apps).
// Someone whose profile matches the admitted-class median is already a
// realistic, competitive applicant — meaningfully better odds than the raw
// applicants-to-admits acceptance rate, which is diluted by that long tail.
// This constant shifts the probability curve to reflect that, calibrated so
// a solidly-above-average profile at a ~30% public school reads as "Likely"
// rather than sitting at the bare acceptance rate.
const ADMIT_MEDIAN_ANCHOR_SHIFT = 0.45;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function scale7to100(v) { return v == null ? null : clamp((v - 1) / 6 * 100, 0, 100); }
function avgOf(arr) { const v = arr.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
function maxOf(arr) { const v = arr.filter(x => x != null); return v.length ? Math.max(...v) : null; }

function yearWeightedAverage(byYear) {
    const entries = Object.entries(YEAR_WEIGHTS)
        .map(([k, w]) => ({ v: byYear?.[k], w }))
        .filter(e => e.v != null);
    if (entries.length < 2) return null;
    const totalW = entries.reduce((s, e) => s + e.w, 0);
    return entries.reduce((s, e) => s + e.v * e.w, 0) / totalW;
}

// ── GPA ──────────────────────────────────────────────────────────────────

export function effectiveUnweightedGpa(profile) {
    return yearWeightedAverage(profile.gpaByYear) ?? profile.gpaUnweighted ?? null;
}

export function effectiveWeightedGpa(profile) {
    return yearWeightedAverage(profile.gpaByYearWeighted) ?? profile.gpaWeighted ?? null;
}

export function gpaPercentile(unweightedGpa, gpaDist) {
    if (unweightedGpa == null || !gpaDist) return null;
    let below = 0, own = 0, total = 0;
    for (const b of GPA_BANDS) {
        const v = gpaDist[b.key] ?? 0;
        total += v;
        if (unweightedGpa > b.max) below += v;
        else if (unweightedGpa >= b.min && unweightedGpa <= b.max) own += v;
    }
    if (total <= 0) return null;
    return clamp((below + own / 2) / total * 100, 1, 99);
}

// Used only when a school doesn't report a GPA distribution at all. Anchored
// so 3.7 unweighted ≈ 50th percentile of a selective applicant pool (these
// are all top-33 schools, not the general population) — a rough, disclosed
// estimate, capped short of the 1-99 confidence range a real CDS figure gets.
function genericGpaPercentile(gpa) {
    if (gpa == null) return null;
    return clamp(50 + (gpa - 3.7) * 100, 5, 92);
}

// ── Class rank ───────────────────────────────────────────────────────────
// CDS class-rank buckets are cumulative-from-the-top (top10 ⊆ top25 ⊆ top50)
// and top50/bottom50 are complementary halves. We convert them into five
// mutually exclusive bands and estimate the user's percentile the same way
// gpaPercentile does: count bands strictly worse than the user's, plus half
// of their own band.
export function classRankPercentile(rank, classSize, buckets) {
    if (rank == null || !classSize || classSize <= 0 || !buckets) return null;
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

    const userTopPct = clamp(rank / classSize * 100, 0.01, 100);
    let worse = 0, own = 0;
    for (const b of bands) {
        if (userTopPct <= b.lo) worse += b.frac;
        else if (userTopPct > b.lo && userTopPct <= b.hi) own += b.frac;
    }
    return clamp((worse + own / 2) / total * 100, 1, 99);
}

// ── Test scores (composite only) ────────────────────────────────────────

export function scorePercentile(score, p25, p75) {
    if (score == null || p25 == null || p75 == null) return null;
    if (p75 === p25) return score >= p75 ? 75 : 25;
    const slope = 50 / (p75 - p25);
    return clamp(25 + (score - p25) * slope, 1, 99);
}

function combinedTestPercentile(school, profile) {
    const satPct = scorePercentile(profile.sat, school.sat_composite_25, school.sat_composite_75);
    const actPct = scorePercentile(profile.act, school.act_composite_25, school.act_composite_75);
    return maxOf([satPct, actPct]);
}

// Used only when a school reports no test-score ranges at all (test-blind
// schools, or gaps in our CDS data). Anchored the same way as the generic
// GPA fallback — 1350 SAT / 30 ACT ≈ 50th percentile of a selective pool.
function genericTestPercentile(sat, act) {
    const satP = sat != null ? clamp(50 + (sat - 1350) * 0.15, 3, 92) : null;
    const actP = act != null ? clamp(50 + (act - 30) * 4, 3, 92) : null;
    return maxOf([satP, actP]);
}

// ── Rigor (AP/IB load + weighted-GPA strength relative to the student's own school) ──

export function rigorScore(numCourses, avgScore, gpaWeighted, gpaMaxWeighted) {
    const parts = [];
    if (numCourses) parts.push({ v: Math.min(1, numCourses / 10) * 100, w: 0.45 });
    if (avgScore != null) parts.push({ v: clamp(avgScore / 5, 0, 1) * 100, w: 0.35 });
    if (gpaWeighted != null && gpaMaxWeighted) parts.push({ v: clamp(gpaWeighted / gpaMaxWeighted, 0, 1) * 100, w: 0.20 });
    if (!parts.length) return 50; // no rigor data at all — neutral, not a penalty
    const totalW = parts.reduce((s, p) => s + p.w, 0);
    return clamp(parts.reduce((s, p) => s + p.v * p.w, 0) / totalW, 0, 100);
}

// ── Academic Index ──────────────────────────────────────────────────────

export function academicIndex(school, profile) {
    const effGpa = effectiveUnweightedGpa(profile);
    const gpaSpecific = gpaPercentile(effGpa, school.gpa_distribution);
    const gpaPct = gpaSpecific ?? genericGpaPercentile(effGpa);
    const gpaSourced = gpaSpecific != null;

    const testSpecific = combinedTestPercentile(school, profile);
    const testPct = testSpecific ?? genericTestPercentile(profile.sat, profile.act);
    const testSourced = testSpecific != null;

    const classRankPct = classRankPercentile(profile.classRank, profile.classSize, school.class_rank);
    const rigor = rigorScore(profile.apCount, profile.apAvgScore, effectiveWeightedGpa(profile), profile.gpaMaxWeighted);

    const parts = [];
    if (gpaPct != null) parts.push({ v: gpaPct, w: 0.32 });
    if (testPct != null) parts.push({ v: testPct, w: 0.30 });
    if (classRankPct != null) parts.push({ v: classRankPct, w: 0.20 });
    parts.push({ v: rigor, w: 0.18 });

    const totalW = parts.reduce((s, p) => s + p.w, 0);
    let value = parts.reduce((s, p) => s + p.v * p.w, 0) / totalW;

    const failedPenalty = Math.min((profile.coursesFailed ?? 0) * 6, 24);
    value = clamp(value - failedPenalty, 0, 100);

    return { value, gpaPct, gpaSourced, testPct, testSourced, classRankPct, rigor, failedPenalty };
}

// ── Activities (structured entries, capped at MAX_ACTIVITIES) ──────────

export function activityEntryScore(a) {
    const parts = [];
    if (a.weeklyHours != null) parts.push({ v: clamp(a.weeklyHours, 0, 20) / 20 * 100, w: 0.5 });
    if (a.years != null) parts.push({ v: clamp(a.years, 0, 4) / 4 * 100, w: 0.35 });
    if (a.monthsPerYear != null) parts.push({ v: clamp(a.monthsPerYear, 0, 12) / 12 * 100, w: 0.15 });
    const totalW = parts.reduce((s, p) => s + p.w, 0);
    const base = totalW > 0 ? parts.reduce((s, p) => s + p.v * p.w, 0) / totalW : 40;
    const roleWeight = a.roleWeight ?? 1.0;
    return clamp(base * roleWeight, 0, 100);
}

function structuredActivitiesScore(activities) {
    if (!activities || !activities.length) return null;
    const scores = activities.slice(0, MAX_ACTIVITIES).map(activityEntryScore).sort((a, b) => b - a);
    const RANK_WEIGHTS = [0.50, 0.22, 0.12, 0.08, 0.05, 0.03];
    let total = 0, wsum = 0;
    scores.forEach((s, i) => {
        const w = RANK_WEIGHTS[i] ?? 0.02;
        total += s * w;
        wsum += w;
    });
    return clamp(total / wsum, 0, 100);
}

// Blends the structured, quantifiable entry data with the student's own
// self-rating (equal weight) when a self-rating is given; falls back to
// whichever one is available; neutral default only when neither is given
// (so an empty list, by itself, is never a penalty).
export function activitiesIndex(activities, selfRating) {
    const structured = structuredActivitiesScore(activities);
    const self = scale7to100(selfRating);
    if (structured != null && self != null) return structured * 0.5 + self * 0.5;
    if (structured != null) return structured;
    if (self != null) return self;
    return 50;
}

// Research has no dedicated CDS factor, so this is a disclosed general heuristic
// (widely recognized as a strong signal at research-heavy admissions offices),
// not a school-specific number. Community service / job ARE tied to real
// per-school CDS "volunteer" / "work_experience" importance ratings.
function activityCategoryModifiers(activities, school) {
    const cats = new Set((activities ?? []).slice(0, MAX_ACTIVITIES).map(a => a.category));
    const factors = school.admission_factors ?? {};
    let mod = 0;
    if (cats.has('research')) mod += 2;
    if (cats.has('community_service')) mod += (IMPORTANCE_WEIGHT[factors.volunteer] ?? 0) * 0.6;
    if (cats.has('job')) mod += (IMPORTANCE_WEIGHT[factors.work_experience] ?? 0) * 0.6;
    return mod;
}

// ── Awards (level-scaled entries, capped at MAX_AWARDS) ─────────────────

function awardEntryScore(a) {
    return AWARD_LEVEL_SCORE[a.level] ?? AWARD_LEVEL_DEFAULT_SCORE;
}

function structuredAwardsScore(awards) {
    if (!awards || !awards.length) return null;
    const scores = awards.slice(0, MAX_AWARDS).map(awardEntryScore).sort((a, b) => b - a);
    const RANK_WEIGHTS = [0.45, 0.22, 0.14, 0.10, 0.06, 0.03];
    let total = 0, wsum = 0;
    scores.forEach((s, i) => {
        const w = RANK_WEIGHTS[i] ?? 0;
        total += s * w;
        wsum += w;
    });
    return wsum > 0 ? clamp(total / wsum, 0, 100) : null;
}

// Same blend pattern as activities: structured (level-based) + self-rating,
// equal weight; neutral default only when neither is given.
export function awardsIndex(awards, selfRating) {
    const structured = structuredAwardsScore(awards);
    const self = scale7to100(selfRating);
    if (structured != null && self != null) return structured * 0.5 + self * 0.5;
    if (structured != null) return structured;
    if (self != null) return self;
    return 50;
}

// ── Holistic Index ──────────────────────────────────────────────────────

export function holisticIndex(profile) {
    const ec = activitiesIndex(profile.activities, profile.activitiesRating);
    const essay = scale7to100(profile.essayRating) ?? 50;
    const awards = awardsIndex(profile.awards, profile.awardsRating);
    const lor = scale7to100(profile.lorRating) ?? 50;
    const hardship = scale7to100(profile.hardshipRating) ?? 50;
    const value = ec * 0.35 + essay * 0.25 + awards * 0.15 + lor * 0.15 + hardship * 0.10;
    return { value, ec, essay, awards, lor, hardship };
}

// ── Per-school academic/holistic blend from CDS admission factors ──────

function factorWeightSum(factors, keys) {
    if (!factors) return null;
    return keys.reduce((sum, k) => sum + (IMPORTANCE_WEIGHT[factors[k]] ?? 0), 0);
}

export function academicHolisticSplit(school) {
    const a = factorWeightSum(school.admission_factors, ACADEMIC_FACTOR_KEYS);
    const h = factorWeightSum(school.admission_factors, HOLISTIC_FACTOR_KEYS);
    if (a == null || a + h === 0) {
        return { academicWeight: 0.55, holisticWeight: 0.45, sourced: false };
    }
    return { academicWeight: a / (a + h), holisticWeight: h / (a + h), sourced: true };
}

// ── Context modifiers ───────────────────────────────────────────────────

export function residencyModifier(school, profile) {
    if (school.school_type !== 'Public') return 0;
    if (profile.country !== 'usa' || !profile.homeState || !school.state) return 0;
    const factors = school.admission_factors ?? {};
    const importance = IMPORTANCE_WEIGHT[factors.state_residence] ?? IMPORTANCE_WEIGHT[factors.geo_residence] ?? 0;
    return profile.homeState === school.state ? importance * 2 : -importance * 1.5;
}

export function internationalModifier(profile) {
    if (profile.country !== 'international') return 0;
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

export function schoolPlanOptions(school) {
    const opts = [{ value: 'rd', label: 'Regular Decision' }];
    switch (school.ea_ed_type) {
        case 'REA': opts.unshift({ value: 'ea', label: 'Restrictive Early Action (REA)' }); break;
        case 'EA':  opts.unshift({ value: 'ea', label: 'Early Action (EA)' }); break;
        case 'ED':  opts.unshift({ value: 'ed', label: 'Early Decision (ED)' }); break;
        case 'ED I & II':
            opts.unshift({ value: 'ed2', label: 'Early Decision II (ED II)' });
            opts.unshift({ value: 'ed', label: 'Early Decision I (ED I)' });
            break;
        default: break;
    }
    return opts;
}

// Applied only when a school doesn't report an EA/RD-specific acceptance rate
// in its own CDS submission (most schools). Reflects the well-documented,
// industry-wide early-round admit-rate bump — a disclosed generic heuristic,
// not this school's own reported number.
const GENERIC_PLAN_BOOST = { ed: 1.45, ed2: 1.30, ea: 1.15, rd: 1.0 };

function planBaseRate(school, planValue) {
    const pools = school.applicant_pools;
    const type = school.ea_ed_type;

    // Only trust the school's own early-round rate when its plan type is
    // unambiguous. "ED I & II" schools report a single "ea" bucket in our
    // data that we can't confidently attribute to ED I alone, so both ed/ed2
    // fall through to the generic heuristic rather than overclaiming precision.
    if (planValue === 'ea' && (type === 'EA' || type === 'REA') && pools?.ea?.rate != null) {
        return { rate: pools.ea.rate, sourced: true };
    }
    if (planValue === 'ed' && type === 'ED' && pools?.ea?.rate != null) {
        return { rate: pools.ea.rate, sourced: true };
    }
    if (planValue === 'rd' && pools?.rd?.rate != null) {
        return { rate: pools.rd.rate, sourced: true };
    }

    const base = school.acceptance_rate;
    if (base == null) return { rate: null, sourced: false };
    const boost = GENERIC_PLAN_BOOST[planValue] ?? 1.0;
    return { rate: clamp(base * boost, 0.001, 0.98), sourced: false };
}

// ── Probability + tier ──────────────────────────────────────────────────

export function estimateProbability(school, profile, selection = {}) {
    const { rate: planRate, sourced: planSourced } = planBaseRate(school, selection.plan ?? 'rd');
    if (planRate == null || planRate <= 0 || planRate >= 1) return null;

    const competitiveMajor = !!selection.competitiveMajor;
    const base = competitiveMajor ? clamp(planRate * COMPETITIVE_MAJOR_MULTIPLIER, 0.001, 0.98) : planRate;

    const ai = academicIndex(school, profile);
    const hi = holisticIndex(profile);
    const { academicWeight, holisticWeight, sourced } = academicHolisticSplit(school);
    const combined = ai.value * academicWeight + hi.value * holisticWeight;

    const modifier =
        residencyModifier(school, profile) +
        internationalModifier(profile) +
        legacyModifier(school, selection.legacy) +
        firstGenModifier(school, profile.firstGen) +
        activityCategoryModifiers(profile.activities, school);

    const baseLogit = Math.log(base / (1 - base));
    const k = 1.0;
    const logit = baseLogit + ADMIT_MEDIAN_ANCHOR_SHIFT + k * ((combined - 50) / 10) + modifier / 10;
    const p = clamp(1 / (1 + Math.exp(-logit)), 0.0005, 0.995);

    return {
        p, combined, academicWeight, holisticWeight, sourced, modifier, ai, hi,
        planBaseRate: planRate, planSourced, competitiveMajor, effectiveBaseRate: base,
    };
}

export function tierFor(p) {
    return CHANCE_TIERS.find(t => p <= t.ceiling) ?? CHANCE_TIERS[CHANCE_TIERS.length - 1];
}

// ── DOM wiring (browser only) ───────────────────────────────────────────

if (typeof document !== 'undefined') {
    const DRAFT_KEY = 'cds_chanceme_draft';

    const state = {
        activities: [],
        awards: [],
        targetSchools: [], // { slug, plan, legacy, competitiveMajor }
        ratings: { activities: null, awards: null, essay: null, lor: null, hardship: null },
    };

    let allSchools = [];

    function loadDraft() {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw);
            Object.entries(draft.fields ?? {}).forEach(([id, v]) => {
                const el = document.getElementById(id);
                if (el) el.value = v;
            });
            state.activities = draft.activities ?? [];
            state.awards = draft.awards ?? [];
            state.targetSchools = draft.targetSchools ?? [];
            state.ratings = { ...state.ratings, ...(draft.ratings ?? {}) };
        } catch { /* ignore corrupt draft */ }
    }

    const FIELD_IDS = [
        'cm-hs', 'cm-gpa-unweighted', 'cm-gpa-weighted', 'cm-gpa-max-weighted',
        'cm-gpa-y9', 'cm-gpa-y10', 'cm-gpa-y11', 'cm-gpa-y12',
        'cm-gpa-y9w', 'cm-gpa-y10w', 'cm-gpa-y11w', 'cm-gpa-y12w',
        'cm-class-rank', 'cm-class-size', 'cm-courses-failed',
        'cm-ap-count', 'cm-ap-avg', 'cm-sat', 'cm-act',
        'cm-country', 'cm-state', 'cm-demographic', 'cm-first-gen', 'cm-income', 'cm-hardship-desc',
    ];

    function saveDraft() {
        const fields = {};
        FIELD_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) fields[id] = el.value;
        });
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            fields, activities: state.activities, awards: state.awards,
            targetSchools: state.targetSchools, ratings: state.ratings,
        }));
    }

    function val(id) { return document.getElementById(id)?.value ?? ''; }
    function num(id) { const v = val(id); return v === '' ? null : Number(v); }
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    function toggleStateField() {
        const isUsa = val('cm-country') === 'usa';
        document.getElementById('cm-state-field').style.display = isUsa ? '' : 'none';
    }

    // ── Scale pickers (activities / awards / essay / LOR / hardship) ──
    function renderScale(containerId, captionId, key) {
        const container = document.getElementById(containerId);
        const caption = document.getElementById(captionId);
        container.innerHTML = SCALE_7_LABELS.map((_, i) => {
            const n = i + 1;
            const active = state.ratings[key] === n ? ' active' : '';
            return `<button type="button" class="cm-scale-btn${active}" data-val="${n}">${n}</button>`;
        }).join('');
        caption.textContent = state.ratings[key] ? SCALE_7_LABELS[state.ratings[key] - 1] : '';

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.cm-scale-btn');
            if (!btn) return;
            state.ratings[key] = Number(btn.dataset.val);
            renderScale(containerId, captionId, key);
            saveDraft();
        });
    }

    // ── Activities list ──
    const CATEGORY_LABEL = Object.fromEntries(ACTIVITY_CATEGORIES.map(c => [c.value, c.label]));

    function populateRoleSelect(category) {
        const roleSelect = document.getElementById('cm-activity-role');
        const roles = ROLE_OPTIONS_BY_CATEGORY[category];
        if (!roles) {
            roleSelect.innerHTML = '<option value="">Select category first</option>';
            roleSelect.disabled = true;
            return;
        }
        roleSelect.disabled = false;
        roleSelect.innerHTML = '<option value="">Role</option>' +
            roles.map(r => `<option value="${r.value}">${r.label}</option>`).join('');
    }

    function renderActivityList() {
        const el = document.getElementById('cm-activity-list');
        el.innerHTML = state.activities.length
            ? state.activities.map((a, i) => {
                const bits = [CATEGORY_LABEL[a.category], a.roleLabel].filter(Boolean).join(' · ');
                const time = [
                    a.weeklyHours != null ? `${a.weeklyHours} hrs/wk` : null,
                    a.years != null ? `${a.years} yr${a.years === 1 ? '' : 's'}` : null,
                    a.monthsPerYear != null ? `${a.monthsPerYear} mo/yr` : null,
                ].filter(Boolean).join(' · ');
                return `<div class="cm-list-item">
                    <div class="cm-list-item-body">
                        <div class="cm-list-item-title">${escapeHtml(a.org)}</div>
                        <div class="cm-list-item-sub">${escapeHtml(bits)}${time ? ' — ' + escapeHtml(time) : ''}</div>
                    </div>
                    <button type="button" class="cm-list-remove" data-idx="${i}" aria-label="Remove">&times;</button>
                </div>`;
            }).join('')
            : '<div class="cm-list-empty">No activities added yet.</div>';

        const count = document.getElementById('cm-activity-count');
        count.textContent = `${state.activities.length} / ${MAX_ACTIVITIES} added`;
        document.getElementById('cm-add-activity').disabled = state.activities.length >= MAX_ACTIVITIES;
    }

    function renderAwardList() {
        const el = document.getElementById('cm-award-list');
        el.innerHTML = state.awards.length
            ? state.awards.map((a, i) => `
                <div class="cm-list-item">
                    <div class="cm-list-item-body">
                        <div class="cm-list-item-title">${escapeHtml(a.title)}</div>
                        ${a.level ? `<div class="cm-list-item-sub">${escapeHtml(AWARD_LEVELS.find(l => l.value === a.level)?.label ?? a.level)}</div>` : ''}
                    </div>
                    <button type="button" class="cm-list-remove" data-idx="${i}" aria-label="Remove">&times;</button>
                </div>`).join('')
            : '<div class="cm-list-empty">No awards added yet.</div>';

        const count = document.getElementById('cm-award-count');
        count.textContent = `${state.awards.length} / ${MAX_AWARDS} added`;
        document.getElementById('cm-add-award').disabled = state.awards.length >= MAX_AWARDS;
    }

    // ── Target schools ──
    function renderSchoolDropdown(query) {
        const dropdown = document.getElementById('cm-school-dropdown');
        const results = allSchools
            .filter(s => query === '' || s.name.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));

        dropdown.innerHTML = results.length
            ? results.map(s => {
                const picked = state.targetSchools.some(t => t.slug === s.slug);
                return `<div class="cm-school-option${picked ? ' disabled' : ''}" data-slug="${s.slug}">
                    <img class="cm-school-option-logo" src="images/logos/${LOGOS[s.slug] ?? ''}" alt="">
                    <span class="cm-school-option-name">${s.name}</span>
                </div>`;
            }).join('')
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
                    <img class="cm-school-option-logo" src="images/logos/${LOGOS[t.slug] ?? ''}" alt="">
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
        return {
            gpaUnweighted: num('cm-gpa-unweighted'),
            gpaWeighted: num('cm-gpa-weighted'),
            gpaMaxWeighted: num('cm-gpa-max-weighted'),
            gpaByYear: { y9: num('cm-gpa-y9'), y10: num('cm-gpa-y10'), y11: num('cm-gpa-y11'), y12: num('cm-gpa-y12') },
            gpaByYearWeighted: { y9: num('cm-gpa-y9w'), y10: num('cm-gpa-y10w'), y11: num('cm-gpa-y11w'), y12: num('cm-gpa-y12w') },
            classRank: num('cm-class-rank'),
            classSize: num('cm-class-size'),
            coursesFailed: num('cm-courses-failed') ?? 0,
            apCount: num('cm-ap-count'),
            apAvgScore: num('cm-ap-avg'),
            sat: num('cm-sat'),
            act: num('cm-act'),
            country: val('cm-country') || 'usa',
            homeState: val('cm-state') || null,
            firstGen: val('cm-first-gen') === 'yes',
            incomeBand: val('cm-income') || null,
            activities: state.activities,
            activitiesRating: state.ratings.activities,
            awards: state.awards,
            essayRating: state.ratings.essay,
            awardsRating: state.ratings.awards,
            lorRating: state.ratings.lor,
            hardshipRating: state.ratings.hardship,
        };
    }

    function pctLabel(p) { return (p * 100).toFixed(1) + '%'; }

    function renderResults(profile) {
        const list = document.getElementById('cm-results-list');

        list.innerHTML = state.targetSchools.map(t => {
            const school = allSchools.find(s => s.slug === t.slug);
            if (!school) return '';
            const result = estimateProbability(school, profile, t);
            const planLabel = schoolPlanOptions(school).find(o => o.value === t.plan)?.label ?? 'Regular Decision';

            if (!result) {
                return `<div class="cm-result-card">
                    <img class="cm-result-logo" src="images/logos/${LOGOS[school.slug] ?? ''}" alt="">
                    <div class="cm-result-body">
                        <div class="cm-result-name">${school.name}</div>
                        <div class="cm-result-meta">No acceptance-rate data available for this school.</div>
                    </div>
                </div>`;
            }
            const tier = tierFor(result.p);
            const detailId = `cm-detail-${school.slug}`;
            return `<div class="cm-result-card border-${tier.key}">
                <img class="cm-result-logo" src="images/logos/${LOGOS[school.slug] ?? ''}" alt="">
                <div class="cm-result-body">
                    <div class="cm-result-name">${school.name}</div>
                    <div class="cm-result-meta">${planLabel}${result.planSourced ? '' : ' (school-specific round data unavailable — generic estimate)'} · Base rate used: ${pctLabel(result.effectiveBaseRate)}${result.competitiveMajor ? ' (competitive-major adjustment applied)' : ''}${result.sourced ? '' : ' · limited CDS data — generic academic/holistic weighting used'}</div>
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
                    ${!result.ai.gpaSourced && result.ai.gpaPct != null ? `<div class="cm-detail-row"><span>GPA percentile</span><span>estimated — school doesn't report a GPA distribution</span></div>` : ''}
                    ${!result.ai.testSourced && result.ai.testPct != null ? `<div class="cm-detail-row"><span>Test-score percentile</span><span>estimated — school doesn't report a test-score range</span></div>` : ''}
                    ${result.ai.failedPenalty ? `<div class="cm-detail-row"><span>Failed-course penalty</span><span>-${result.ai.failedPenalty.toFixed(1)}</span></div>` : ''}
                    ${result.modifier !== 0 ? `<div class="cm-detail-row"><span>Residency / legacy / first-gen / activity adjustments</span><span>${result.modifier > 0 ? '+' : ''}${result.modifier.toFixed(1)}</span></div>` : ''}
                    ${result.competitiveMajor ? `<div class="cm-detail-row"><span>Competitive-major haircut (generic heuristic)</span><span>×0.7 on base rate</span></div>` : ''}
                    <div class="cm-detail-note">Academic Index blends GPA percentile, class-rank percentile, test-score percentile, and course rigor against this school's own reported data. Holistic Index blends your activities (structured entries + self-rating), awards (level + self-rating), essay, letters-of-recommendation confidence, and hardships.</div>
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

        document.getElementById('cm-activity-category').innerHTML = '<option value="">Category</option>' +
            ACTIVITY_CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
        populateRoleSelect(null);

        document.getElementById('cm-award-level').innerHTML = '<option value="">Level (optional)</option>' +
            AWARD_LEVELS.map(l => `<option value="${l.value}">${l.label}</option>`).join('');

        const res = await fetch('data/schools-2025-2026.json');
        const { schools } = await res.json();
        allSchools = schools.filter(s => s.name != null); // exclude records with no source data yet (e.g. bad/missing source PDF)

        loadDraft();
        toggleStateField();
        renderActivityList();
        renderAwardList();
        renderTargetSchools();

        renderScale('cm-scale-activities', 'cm-scale-activities-caption', 'activities');
        renderScale('cm-scale-awards', 'cm-scale-awards-caption', 'awards');
        renderScale('cm-scale-essay', 'cm-scale-essay-caption', 'essay');
        renderScale('cm-scale-lor', 'cm-scale-lor-caption', 'lor');
        renderScale('cm-scale-hardship', 'cm-scale-hardship-caption', 'hardship');

        document.getElementById('cm-country').addEventListener('change', () => { toggleStateField(); saveDraft(); });

        document.getElementById('cm-activity-category').addEventListener('change', (e) => {
            populateRoleSelect(e.target.value || null);
        });

        document.getElementById('cm-add-activity').addEventListener('click', () => {
            if (state.activities.length >= MAX_ACTIVITIES) return;
            const org = val('cm-activity-org').trim();
            const category = val('cm-activity-category');
            const roleValue = val('cm-activity-role');
            const roleDef = ROLE_OPTIONS_BY_CATEGORY[category]?.find(r => r.value === roleValue);
            if (!org || !category || !roleDef) return;
            state.activities.push({
                org, category, role: roleDef.value, roleLabel: roleDef.label, roleWeight: roleDef.weight,
                weeklyHours: num('cm-activity-hours'),
                years: num('cm-activity-years'),
                monthsPerYear: num('cm-activity-months'),
            });
            ['cm-activity-org', 'cm-activity-hours', 'cm-activity-years', 'cm-activity-months'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('cm-activity-category').value = '';
            populateRoleSelect(null);
            renderActivityList();
            saveDraft();
        });

        document.getElementById('cm-activity-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.cm-list-remove');
            if (!btn) return;
            state.activities.splice(Number(btn.dataset.idx), 1);
            renderActivityList();
            saveDraft();
        });

        document.getElementById('cm-add-award').addEventListener('click', () => {
            if (state.awards.length >= MAX_AWARDS) return;
            const title = val('cm-award-title').trim();
            if (!title) return;
            const levelSelect = document.getElementById('cm-award-level');
            state.awards.push({ title, level: levelSelect.value });
            document.getElementById('cm-award-title').value = '';
            levelSelect.value = '';
            renderAwardList();
            saveDraft();
        });

        document.getElementById('cm-award-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.cm-list-remove');
            if (!btn) return;
            state.awards.splice(Number(btn.dataset.idx), 1);
            renderAwardList();
            saveDraft();
        });

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
            const hasYearGpa = Object.values(profile.gpaByYear).some(v => v != null);
            if (profile.gpaUnweighted == null && !hasYearGpa && profile.sat == null && profile.act == null) {
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
