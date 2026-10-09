// Average GPAs for schools whose latest Common Data Set leaves GPA blank —
// data/outside-gpa.json, {slug: {gpa, source: 'school' | 'estimate'}}.
// Pages mark these values: an asterisk on lists (home, Compare), and a
// source-specific symbol with an explanation on the school page.

let outsidePromise = null;

// slug -> {gpa, source}. {} if the file is missing (pages then just show
// no GPA for those schools, as before).
export function loadOutsideGpa() {
  outsidePromise ??= fetch('/data/outside-gpa.json')
    .then(res => (res.ok ? res.json() : {}))
    .then(json => json.gpa ?? {})
    .catch(err => { console.error('Failed to load outside GPAs:', err); return {}; });
  return outsidePromise;
}

// Fills avg_gpa_weighted on each school's LATEST record when its CDS left it
// blank, and tags it with _gpaOutside ('school' | 'estimate') so pages can
// mark it. Filters and sorting then treat it like any other GPA.
export function withOutsideGpa(schools, outside) {
  return schools.map(s => {
    const o = s.avg_gpa_weighted == null ? outside[s.slug] : null;
    return o ? { ...s, avg_gpa_weighted: o.gpa, _gpaOutside: o.source } : s;
  });
}
