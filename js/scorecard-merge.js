// js/scorecard-merge.js
//
// Merges the separately-fetched CDS and Scorecard JSON files by slug.
// Scorecard data is kept in its own file (data/scorecard-{year}.json)
// rather than pre-baked into the CDS file, so this runs client-side
// wherever a page needs both.
//
// CDS fields win on any name collision (matches the old export-data.js
// merge order: `{...scorecard, ...cds}`).

function mergeScorecard(cdsSchools, scorecardSchools) {
    const scBySlug = new Map(scorecardSchools.map(s => [s.slug, s]));
    return cdsSchools.map(cds => ({
        ...(scBySlug.get(cds.slug) ?? {}),
        ...cds,
    }));
}
