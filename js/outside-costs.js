// Cost-of-attendance values for schools whose latest Common Data Set leaves
// cost fields blank — data/outside-costs.json, {slug: {year, source, values,
// included?, note?}}, taken from each school's own cost page. Pages mark these
// values with the same asterisk as outside GPAs (data not from the CDS).

let outsidePromise = null;

// slug -> {year, source, values, included, note}. {} if the file is missing
// (pages then just show those fields as N/A, as before).
export function loadOutsideCosts() {
  outsidePromise ??= fetch('/data/outside-costs.json')
    .then(res => (res.ok ? res.json() : {}))
    .then(json => json.costs ?? {})
    .catch(err => { console.error('Failed to load outside costs:', err); return {}; });
  return outsidePromise;
}

// Fills the cost fields a school's record leaves null and tags it with
// _costOutside = {fields: [...filled], source, year, note} so pages can mark
// them. A "quiet" entry (e.g. a $0 fee that's already part of tuition) fills
// without the tag, so it shows as a plain value. Pass only a school's LATEST
// record (the values are current-year prices). Records with nothing to fill
// come back unchanged.
//
// An "override" entry replaces the CDS values too (used when a school's older
// CDS numbers mixed with current prices gave a total that matched nothing).
// values may include other_expenses_out_of_state, for budgets whose
// out-of-state Other (e.g. transportation) differs from in-state.
export function withOutsideCost(s, outside) {
  const o = outside[s.slug];
  if (!o) return s;
  const fields = Object.keys(o.values).filter(f => o.override || s[f] == null);
  if (!fields.length) return s;
  const filled = { ...s };
  for (const f of fields) filled[f] = o.values[f];
  if (!o.quiet) filled._costOutside = { fields, source: o.source, year: o.year, note: o.note ?? null };
  return filled;
}

export const withOutsideCosts = (schools, outside) => schools.map(s => withOutsideCost(s, outside));

// True when field `f` on record `s` came from outside-costs.json.
export const isOutsideCost = (s, f) => !!s._costOutside?.fields.includes(f);
