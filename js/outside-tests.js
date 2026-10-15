// SAT/ACT ranges for schools whose latest Common Data Set leaves test scores
// blank — data/outside-tests.json, {slug: {values, source?, year?, note?}},
// from the school's own figures (with a source URL) or outside sources
// (without one). Pages mark them the same
// way as outside GPAs: an asterisk on lists (Home, Compare), and a "≈" with
// an explanation on the school page.

let outsidePromise = null;

// slug -> {values, source, year, note}. {} if the file is missing (pages
// then just show those scores as N/A, as before).
export function loadOutsideTests() {
  outsidePromise ??= fetch('/data/outside-tests.json')
    .then(res => (res.ok ? res.json() : {}))
    .then(json => json.tests ?? {})
    .catch(err => { console.error('Failed to load outside test scores:', err); return {}; });
  return outsidePromise;
}

// Fills the score fields a school's record leaves null and tags it with
// _testsOutside = {fields: [...filled], source, year, note} so pages can mark
// them. Pass only a school's LATEST record. Records with nothing to fill come
// back unchanged.
export function withOutsideTest(s, outside) {
  const o = outside[s.slug];
  if (!o) return s;
  const fields = Object.keys(o.values).filter(f => s[f] == null);
  if (!fields.length) return s;
  const filled = { ...s };
  for (const f of fields) filled[f] = o.values[f];
  filled._testsOutside = { fields, source: o.source, official: !!o.official, year: o.year, note: o.note ?? null };
  return filled;
}

export const withOutsideTests = (schools, outside) => schools.map(s => withOutsideTest(s, outside));

// True when every field in `fs` on record `s` came from outside-tests.json
// (a range is marked only when both of its ends did).
export const isOutsideTest = (s, ...fs) => !!s._testsOutside && fs.every(f => s._testsOutside.fields.includes(f));
