// Chance Me — deterministic, formula-based admission-odds estimator.
// Everything here runs client-side against data/schools.json. No AI, no server,
// nothing typed into the form is ever transmitted anywhere.

import { normalizeGpaDistribution } from './charts.js?v=6';

// Logos live at images/logos/<slug>.png. A few schools have none yet; the
// onerror hook hides the broken <img> rather than showing a torn-image icon.
const logoSrc = slug => `images/logos/${slug}.png`;
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

// Shared 1-10 scale used for Activities, Awards, and Essay.
export const SCALE_10_LABELS = [
    'Very Weak', 'Weak', 'Below Average', 'Modest', 'Average',
    'Above Average', 'Good', 'Strong', 'Excellent', 'Elite',
];

// 1-5 scale used for Letters of Recommendation.
export const SCALE_5_LABELS = [
    'Weak', 'Below Average', 'Average', 'Strong', 'Exceptional',
];

// Worked examples at the 3/5/8 marks, calibrated against the kind of profiles
// actually admitted to the selective schools we track (not a generic curve).
export const ACTIVITY_SCALE_EXAMPLES = [
    { score: 3, desc: 'General member of 1–2 clubs or a rec team; casual volunteering (~1 hr/wk); no leadership, minimal time commitment.' },
    { score: 5, desc: 'Club officer, JV/varsity athlete, or part-time job (~5–8 hrs/wk) sustained 2+ years — solid but not stand-out.' },
    { score: 8, desc: 'President/founder/captain of a club, team, or venture; sustained research or a leadership volunteer role; 15+ hrs/wk over multiple years with a measurable result — grew a club, published research, ran a nonprofit.' },
];

export const AWARD_SCALE_EXAMPLES = [
    { score: 3, desc: 'School-level honor — Honor Roll, a departmental award, JV MVP, a school-wide competition win.' },
    { score: 5, desc: 'Regional or state-level recognition — All-State music/athletics, a state science-fair placement, a district honor.' },
    { score: 8, desc: 'National or international recognition — National Merit Semifinalist/Finalist, an Olympiad qualifier, a national championship, published or patented work.' },
];

export const ESSAY_SCALE_EXAMPLES = [
    { score: 3, desc: 'Generic and surface-level — tells rather than shows, with little personal voice or reflection.' },
    { score: 5, desc: 'Clear and well-organized with some specific detail and genuine voice, but limited depth of insight.' },
    { score: 8, desc: 'Distinctive and vivid — concrete specific details, a strong personal voice, and real self-reflection that shows who you are.' },
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
function scaleToScore100(v, max) { return v == null ? null : clamp((v - 1) / (max - 1) * 100, 0, 100); }
function maxOf(arr) { const v = arr.filter(x => x != null); return v.length ? Math.max(...v) : null; }

// ── GPA ──────────────────────────────────────────────────────────────────

export function effectiveUnweightedGpa(profile) {
    return profile.gpaUnweighted ?? null;
}

export function effectiveWeightedGpa(profile) {
    return profile.gpaWeighted ?? null;
}

export function gpaPercentile(unweightedGpa, gpaDist) {
    if (unweightedGpa == null || !gpaDist) return null;
    gpaDist = normalizeGpaDistribution(gpaDist);
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

    const rigor = rigorScore(profile.apCount, profile.apAvgScore, effectiveWeightedGpa(profile), profile.gpaMaxWeighted);

    const parts = [];
    if (gpaPct != null) parts.push({ v: gpaPct, w: 0.40 });
    if (testPct != null) parts.push({ v: testPct, w: 0.38 });
    parts.push({ v: rigor, w: 0.22 });

    const totalW = parts.reduce((s, p) => s + p.w, 0);
    let value = parts.reduce((s, p) => s + p.v * p.w, 0) / totalW;

    const failedPenalty = Math.min((profile.coursesFailed ?? 0) * 6, 24);
    value = clamp(value - failedPenalty, 0, 100);

    return { value, gpaPct, gpaSourced, testPct, testSourced, rigor, failedPenalty };
}

// ── Holistic Index (self-rated: Activities, Awards, Essay, LOR) ────────

export function activitiesIndex(selfRating) {
    return scaleToScore100(selfRating, 10) ?? 50;
}

export function awardsIndex(selfRating) {
    return scaleToScore100(selfRating, 10) ?? 50;
}

export function holisticIndex(profile) {
    const ec = activitiesIndex(profile.activitiesRating);
    const essay = scaleToScore100(profile.essayRating, 10) ?? 50;
    const awards = awardsIndex(profile.awardsRating);
    const lor = scaleToScore100(profile.lorRating, 5) ?? 50;
    const value = ec * 0.39 + essay * 0.28 + awards * 0.17 + lor * 0.16;
    return { value, ec, essay, awards, lor };
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
        firstGenModifier(school, profile.firstGen);

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
        targetSchools: [], // { slug, plan, legacy, competitiveMajor }
        ratings: { activities: null, awards: null, essay: null, lor: null },
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
            state.targetSchools = draft.targetSchools ?? [];
            state.ratings = { ...state.ratings, ...(draft.ratings ?? {}) };
        } catch { /* ignore corrupt draft */ }
    }

    const FIELD_IDS = [
        'cm-gpa-unweighted', 'cm-gpa-weighted', 'cm-gpa-max-weighted',
        'cm-courses-failed', 'cm-ap-count', 'cm-ap-avg', 'cm-sat', 'cm-act',
        'cm-country', 'cm-state', 'cm-demographic', 'cm-first-gen', 'cm-income',
    ];

    function saveDraft() {
        const fields = {};
        FIELD_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) fields[id] = el.value;
        });
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            fields, targetSchools: state.targetSchools, ratings: state.ratings,
        }));
    }

    function val(id) { return document.getElementById(id)?.value ?? ''; }
    function num(id) { const v = val(id); return v === '' ? null : Number(v); }

    function toggleStateField() {
        const isUsa = val('cm-country') === 'usa';
        document.getElementById('cm-state-field').style.display = isUsa ? '' : 'none';
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

    function renderScaleExamples(containerId, examples) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = examples.map(ex => `
            <div class="cm-scale-example">
                <span class="cm-scale-example-badge">${ex.score}</span>
                <span class="cm-scale-example-desc">${ex.desc}</span>
            </div>`).join('');
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
                    <img class="cm-school-option-logo" src="${logoSrc(s.slug)}" alt="" onerror="${LOGO_ONERR}">
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
        return {
            gpaUnweighted: num('cm-gpa-unweighted'),
            gpaWeighted: num('cm-gpa-weighted'),
            gpaMaxWeighted: num('cm-gpa-max-weighted'),
            coursesFailed: num('cm-courses-failed') ?? 0,
            apCount: num('cm-ap-count'),
            apAvgScore: num('cm-ap-avg'),
            sat: num('cm-sat'),
            act: num('cm-act'),
            country: val('cm-country') || 'usa',
            homeState: val('cm-state') || null,
            firstGen: val('cm-first-gen') === 'yes',
            incomeBand: val('cm-income') || null,
            activitiesRating: state.ratings.activities,
            awardsRating: state.ratings.awards,
            essayRating: state.ratings.essay,
            lorRating: state.ratings.lor,
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
                    <img class="cm-result-logo" src="${logoSrc(school.slug)}" alt="" onerror="${LOGO_ONERR}">
                    <div class="cm-result-body">
                        <div class="cm-result-name">${school.name}</div>
                        <div class="cm-result-meta">No acceptance-rate data available for this school.</div>
                    </div>
                </div>`;
            }
            const tier = tierFor(result.p);
            const detailId = `cm-detail-${school.slug}`;
            return `<div class="cm-result-card border-${tier.key}">
                <img class="cm-result-logo" src="${logoSrc(school.slug)}" alt="" onerror="${LOGO_ONERR}">
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
                    ${result.modifier !== 0 ? `<div class="cm-detail-row"><span>Residency / legacy / first-gen adjustments</span><span>${result.modifier > 0 ? '+' : ''}${result.modifier.toFixed(1)}</span></div>` : ''}
                    ${result.competitiveMajor ? `<div class="cm-detail-row"><span>Competitive-major haircut (generic heuristic)</span><span>×0.7 on base rate</span></div>` : ''}
                    <div class="cm-detail-note">Academic Index blends GPA percentile, test-score percentile, and course rigor against this school's own reported data. Holistic Index blends your Activities, Awards, Essay, and Letters-of-Recommendation ratings.</div>
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

        const res = await fetch('data/schools-2025-2026.json');
        const { schools } = await res.json();
        allSchools = schools.filter(s => s.name != null); // exclude records with no source data yet (e.g. bad/missing source PDF)

        loadDraft();
        toggleStateField();
        renderTargetSchools();

        renderScale('cm-scale-activities', 'cm-scale-activities-caption', 'activities');
        renderScale('cm-scale-awards', 'cm-scale-awards-caption', 'awards');
        renderScale('cm-scale-essay', 'cm-scale-essay-caption', 'essay');
        renderScale('cm-scale-lor', 'cm-scale-lor-caption', 'lor');

        renderScaleExamples('cm-scale-activities-examples', ACTIVITY_SCALE_EXAMPLES);
        renderScaleExamples('cm-scale-awards-examples', AWARD_SCALE_EXAMPLES);
        renderScaleExamples('cm-scale-essay-examples', ESSAY_SCALE_EXAMPLES);

        document.getElementById('cm-country').addEventListener('change', () => { toggleStateField(); saveDraft(); });

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
