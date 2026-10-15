// SAT/ACT policy per school for the current application cycle —
// data/test-policy.json, {slug: {sat, act, note?, source}} with sat/act
// "required" | "optional" | "blind". Shown under Academic Profile on the
// school page; note (if any) becomes an info dot.

let policyPromise = null;

// slug -> {sat, act, note, source}. {} if the file is missing (the school
// page then just leaves the Testing Policy line out).
export function loadTestPolicies() {
  policyPromise ??= fetch('/data/test-policy.json')
    .then(res => (res.ok ? res.json() : {}))
    .then(json => json.slugs ?? {})
    .catch(err => { console.error('Failed to load test policies:', err); return {}; });
  return policyPromise;
}

// Display order and labels for the school page's three pills.
export const TEST_POLICY_LABEL = { required: 'Required', optional: 'Optional', blind: 'Blind' };
