// Per-school names from data/school-names.json — {slug: {name, short,
// aliases}}: the display name, the short name Compare uses inside its tables
// and charts, and extra search terms (abbreviations and nicknames that don't
// already appear in the name). The header search dropdown (js/header-search.js)
// reads the same file on its own, since it isn't a module.

let namesPromise = null;

// slug -> {name, short, aliases}. {} if the file is missing (search then just
// matches names, and Compare falls back to full names).
export function loadSchoolNames() {
  namesPromise ??= fetch('/data/school-names.json')
    .then(res => (res.ok ? res.json() : {}))
    .then(json => json.schools ?? {})
    .catch(err => { console.error('Failed to load school names:', err); return {}; });
  return namesPromise;
}

// True when the query (already lowercased) appears in the school's name or
// any of its aliases.
export function nameMatches(s, q, names) {
  if (s.name?.toLowerCase().includes(q)) return true;
  return (names[s.slug]?.aliases ?? []).some(a => a.toLowerCase().includes(q));
}
