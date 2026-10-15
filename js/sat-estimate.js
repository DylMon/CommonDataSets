// Some schools' Common Data Sets report SAT Evidence-Based Reading and
// Writing and SAT Math percentiles but no composite. For those we estimate
// the composite range by adding the two sections' 25th percentiles (and
// their 75th percentiles). It's an approximation (percentiles don't add
// exactly), so pages mark it: an orange * on Home, an ⓘ on the school page.

export const SAT_ESTIMATE_NOTE =
  "This school doesn't report a composite SAT range, so this estimate adds its Reading & Writing and Math scores at each percentile. The real composite range is likely a little narrower.";

// Fills sat_composite_25/75 from the section scores when the composite is
// missing and both sections are present, tagging the record _satEstimated.
export function withSatEstimate(s) {
  if (s.sat_composite_25 != null || s.sat_composite_75 != null) return s;
  const { sat_reading_25: r25, sat_reading_75: r75, sat_math_25: m25, sat_math_75: m75 } = s;
  if ([r25, r75, m25, m75].some(v => v == null)) return s;
  return { ...s, sat_composite_25: r25 + m25, sat_composite_75: r75 + m75, _satEstimated: true };
}

export const withSatEstimates = schools => schools.map(withSatEstimate);
