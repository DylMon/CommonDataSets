// Shared helpers for data/admission-plans.json — each school's verified,
// current-cycle application rounds as [{type, date}] in cycle order
// (see the note in that file). Used by the Data Sets page and Chance Me;
// js/school.js reads the same file for its Admissions box timeline.

let plansPromise = null;

// slug -> rounds. Fetched once per page; {} if the file is missing so
// callers can fall back to the CDS ea_ed_type / ea_ed_deadline / rd_deadline.
export function loadAdmissionPlans() {
  plansPromise ??= fetch('/data/admission-plans.json')
    .then(res => (res.ok ? res.json() : {}))
    .then(json => json.plans ?? {})
    .catch(err => { console.error('Failed to load admission plans:', err); return {}; });
  return plansPromise;
}

// Rounds from a school's CDS fields, for a school the plans file doesn't cover.
export function cdsRounds(s) {
  const rounds = [];
  if (s.ea_ed_type && s.ea_ed_type !== 'None') rounds.push({ type: s.ea_ed_type, date: s.ea_ed_deadline || null });
  if (s.rd_deadline) rounds.push({ type: 'RD', date: s.rd_deadline });
  return rounds;
}

export const roundFamily = type =>
  /^REA\b/.test(type) ? 'REA' : /^ED\b/.test(type) ? 'ED' : /^EA\b/.test(type) ? 'EA' : 'RD';

export const offersEarlyAction = rounds => rounds.some(r => ['EA', 'REA'].includes(roundFamily(r.type)));
export const offersEarlyDecision = rounds => rounds.some(r => roundFamily(r.type) === 'ED');

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const FAMILY_LABEL = { ED: 'Early Decision', EA: 'Early Action', REA: 'Restrictive Early Action', RD: 'Regular Decision' };

// Two items join with "&", three or more with commas only:
// "11/1 & 1/15", "9/15, 10/15, 11/15, 12/1", "I & II", "I, II, III, IV".
// Dates already contain "/", so rounds are never separated with one.
function joinList(items) {
  return items.join(items.length <= 2 ? ' & ' : ', ');
}

// At most three label/value rows (one per family present: ED, EA or REA,
// RD), e.g. ["Early Decision I & II", "11/1 & 1/15"], ["Early Action I, II,
// III, IV", "9/15, 10/15, 11/15, 12/1"], ["Regular Decision", "12/1 (final 3/1)"].
export function deadlineRows(rounds) {
  const rows = [];
  for (const fam of ['ED', 'REA', 'EA']) {
    const rs = rounds.filter(r => roundFamily(r.type) === fam);
    if (!rs.length) continue;
    // Numbered rounds ("EA", "EA II") → I & II; tagged ones ("EA (GA)") keep
    // their tag beside the date instead.
    const tags = rs.map(r => r.type.slice(fam.length).trim());
    const numbered = rs.length > 1 && tags.every(t => t === '' || ROMAN.includes(t));
    let label = FAMILY_LABEL[fam];
    let dates = rs.map(r => r.date || 'N/A');
    if (numbered) {
      label += ' ' + joinList(tags.map(t => t || 'I'));
    } else if (rs.length > 1) {
      dates = rs.map((r, i) => `${r.date} ${tags[i]}`.trim());
    }
    rows.push([label, joinList(dates)]);
  }
  const rd = rounds.find(r => r.type === 'RD');
  const final = rounds.find(r => r.type === 'RD Final');
  if (rd || final) {
    let value = rd?.date ?? 'N/A';
    if (final) value += final.date === 'Rolling' ? ' (then rolling)' : ` (final ${final.date})`;
    rows.push([FAMILY_LABEL.RD, value]);
  }
  return rows;
}
