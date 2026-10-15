// Each school's most recent record across every CDS year we have — the same
// set the home page and school pages show — so Compare and Chance Me include
// schools whose newest Common Data Set is older than the latest year.

export const ALL_YEAR_FILES = [
  '/data/schools-2021-2022.json',
  '/data/schools-2022-2023.json',
  '/data/schools-2023-2024.json',
  '/data/schools-2024-2025.json',
  '/data/schools-2025-2026.json',
];

async function loadAll(urls) {
  return Promise.all(urls.map(async url => {
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      return (await res.json()).schools ?? [];
    } catch (err) {
      console.error(`Failed to load ${url}:`, err);
      return [];
    }
  }));
}

// Newest record per slug (files are oldest-first, so later ones win).
// Records with no name have no source data yet and are skipped.
export async function loadLatestSchools() {
  const bySlug = new Map();
  for (const schools of await loadAll(ALL_YEAR_FILES)) {
    for (const s of schools) if (s.slug && s.name != null) bySlug.set(s.slug, s);
  }
  return [...bySlug.values()];
}

// Newest College Scorecard record per slug across every year file — what the
// school page merges in.
export async function loadLatestScorecard() {
  const bySlug = new Map();
  for (const schools of await loadAll(ALL_YEAR_FILES.map(u => u.replace('/schools-', '/scorecard-')))) {
    for (const s of schools) if (s.slug) bySlug.set(s.slug, s);
  }
  return bySlug;
}

// data/class-rank-bands.json holds separate rank bands for schools whose CDS
// reported them that way; this turns one back into the cumulative shape the
// CDS normally uses ({top10, top25, top50, bottom50, bottom25}).
export function rankBandsToCumulative(b) {
  const top10 = b.top10 ?? null;
  const top25 = top10 != null && b.top10_25 != null ? top10 + b.top10_25 : null;
  const top50 = top25 != null && b.top25_50 != null ? top25 + b.top25_50 : null;
  const bottom25 = b.bottom25 ?? null;
  const bottom50 = b.bottom50 ?? (b.middle50_75 != null && bottom25 != null ? b.middle50_75 + bottom25 : null);
  const r = v => (v == null ? null : Math.round(v * 10000) / 10000);
  return { top10: r(top10), top25: r(top25), top50: r(top50), bottom50: r(bottom50), bottom25: r(bottom25) };
}

// Applies data/class-rank-bands.json to the records whose CDS year it names.
export async function withRankBandFixes(schools) {
  let bands = {};
  try {
    const res = await fetch('/data/class-rank-bands.json');
    if (res.ok) bands = (await res.json()).slugs ?? {};
  } catch (err) { console.error('Failed to load class rank bands:', err); }
  return schools.map(s => {
    const b = bands[s.slug];
    return b && s.data_year === b.year ? { ...s, class_rank: rankBandsToCumulative(b.bands) } : s;
  });
}
