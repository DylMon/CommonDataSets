#!/usr/bin/env python3
"""
fetch-scorecard-2025-2026.py — Resolve Scorecard IDs for all 80 schools in
data/schools-2025-2026.json and fetch the same automatable College Scorecard
fields already used for the original 33 (data/scorecard/manual.json), writing
data/scorecard-2025-2026.json as its own file (kept separate from CDS data —
merged at render time by the frontend, not baked into one file).

Manual-only fields (us_news_rank, us_news_rank_year, test_policy,
endowment_total, endowment_per_student) are NOT available from the API at
all — they're hand-curated. They're carried over from manual.json for the
25 schools that overlap with the original 33; the other 55 schools simply
don't have this data available and are left null for those fields only.

Schools whose Scorecard ID can't be confidently resolved (ambiguous or no
name+state match) are skipped entirely rather than guessed — printed at the
end for manual review.

Usage:
    python scripts/fetch-scorecard-2025-2026.py

Requires SCORECARD_API_KEY in .env (already set for this project).
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.environ.get('SCORECARD_API_KEY')
if not API_KEY:
    sys.exit('SCORECARD_API_KEY not set in .env')

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHOOLS_2526 = REPO_ROOT / 'data' / 'schools-2025-2026.json'
MANUAL_JSON = REPO_ROOT / 'data' / 'scorecard' / 'manual.json'
OUT_PATH = REPO_ROOT / 'data' / 'scorecard-2025-2026.json'

BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools'

SC_FIELDS = ','.join([
    'latest.completion.rate_suppressed.overall',
    'latest.completion.consumer_rate',
    'latest.earnings.6_yrs_after_entry.median',
    'latest.earnings.10_yrs_after_entry.median',
    'latest.aid.median_debt.completers.overall',
    'latest.aid.median_debt.noncompleters',
    'latest.aid.pct_federal_loan',
    'latest.aid.pell_grant_rate',
    'latest.cost.avg_net_price.income.0_30000',
    'latest.cost.avg_net_price.income.30001_48000',
    'latest.cost.avg_net_price.income.48001_75000',
    'latest.cost.avg_net_price.income.75001_110000',
    'latest.cost.avg_net_price.income.110001_plus',
    'latest.student.demographics.student_faculty_ratio',
])


def api_get(params, retries=3):
    url = f'{BASE_URL}?{urllib.parse.urlencode(params)}&api_key={API_KEY}'
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code >= 500 and attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise


def norm(s):
    return ''.join(ch for ch in s.lower() if ch.isalnum())


# A few schools' CDS-extracted name differs too much from their official
# IPEDS/Scorecard name for token search to find at all (e.g. a leading
# "The " that no record's name field contains). Hand-verified overrides.
NAME_OVERRIDES = {
    'penn-state': 'Pennsylvania State University',
}

# Administrative divisions that share a physical campus's city but aren't
# it (online/global arms, extension programs) — deprioritized as a tie-break.
NON_CAMPUS_MARKERS = ('global', 'online', 'world campus', 'continuing ed')


def resolve_id(slug, name, city, state):
    """Find the Scorecard UNITID for (name, city, state). Many big public
    universities register their main campus as "X University-Main Campus"
    (or similar), which fails a literal name match but always has the
    correct city — so city is the more reliable disambiguator once state
    narrows the field. Returns (id_or_None, reason_string)."""
    query_name = NAME_OVERRIDES.get(slug, name)
    if query_name.lower().startswith('the '):
        query_name = query_name[4:]
    query_name = query_name.replace(',', '')  # a literal comma 500s this API server-side

    data = api_get({'school.name': query_name, 'fields': 'id,school.name,school.city,school.state', 'per_page': 100})
    results = data.get('results', [])
    same_state = [r for r in results if r['school.state'] == state]

    exact = [r for r in same_state if norm(r['school.name']) == norm(query_name)]
    if len(exact) == 1:
        return exact[0]['id'], 'exact name+state match'

    same_city = [r for r in same_state if city and norm(r['school.city']) == norm(city)]
    if len(same_city) > 1:
        physical = [r for r in same_city if not any(m in r['school.name'].lower() for m in NON_CAMPUS_MARKERS)]
        if len(physical) == 1:
            return physical[0]['id'], 'state+city match (excluding online/global divisions)'
        same_city = physical or same_city
    if len(same_city) == 1:
        return same_city[0]['id'], 'state+city match'
    if len(same_city) > 1:
        narrowed = [r for r in same_city if norm(query_name) in norm(r['school.name']) or norm(r['school.name']) in norm(query_name)]
        if len(narrowed) == 1:
            return narrowed[0]['id'], 'state+city+fuzzy name match'

    fuzzy = [r for r in same_state if norm(query_name) in norm(r['school.name']) or norm(r['school.name']) in norm(query_name)]
    if len(fuzzy) == 1:
        return fuzzy[0]['id'], 'fuzzy name+state match'

    return None, (f'{len(results)} results, {len(same_state)} in-state, '
                   f'{len(same_city)} same-city, {len(fuzzy)} fuzzy — ambiguous')


def main():
    schools = json.loads(SCHOOLS_2526.read_text(encoding='utf-8'))['schools']
    manual = json.loads(MANUAL_JSON.read_text(encoding='utf-8'))
    manual_by_slug = {m['slug']: m for m in manual}

    force = '--force' in sys.argv
    rows = []
    done_slugs = set()
    if OUT_PATH.exists() and not force:
        existing = json.loads(OUT_PATH.read_text(encoding='utf-8'))
        rows = existing.get('schools', [])
        done_slugs = {r['slug'] for r in rows}
        if done_slugs:
            print(f'Resuming: {len(done_slugs)} school(s) already in {OUT_PATH.name}, skipping those.\n')

    unresolved = []

    def save():
        OUT_PATH.write_text(
            json.dumps({'generated': date.today().isoformat(), 'schools': rows}, indent=2),
            encoding='utf-8',
        )

    for s in schools:
        slug, name, city, state = s['slug'], s['name'], s.get('city'), s.get('state')
        if slug in done_slugs:
            continue
        if not name:
            unresolved.append((slug, name, state, 'no name in CDS data — source PDF has no real content, see uc-merced'))
            print(f'  {slug:22s} -> SKIPPED (no name in CDS data)')
            continue
        m = manual_by_slug.get(slug)

        try:
            if m and m.get('scorecard_id'):
                scorecard_id = m['scorecard_id']
                print(f'  {slug:22s} -> id={scorecard_id} (from manual.json)')
            else:
                scorecard_id, why = resolve_id(slug, name, city, state)
                if not scorecard_id:
                    unresolved.append((slug, name, state, why))
                    print(f'  {slug:22s} -> UNRESOLVED ({why})')
                    continue
                print(f'  {slug:22s} -> id={scorecard_id} ({why})')
                time.sleep(0.15)

            sc = api_get({'id': scorecard_id, 'fields': f'id,{SC_FIELDS}'})
            results = sc.get('results', [])
            result = results[0] if results else {}

            rows.append({
                'slug': slug,
                'name': name,
                'scorecard_id': scorecard_id,
                'us_news_rank': (m or {}).get('us_news_rank'),
                'us_news_rank_year': (m or {}).get('us_news_rank_year'),
                'test_policy': (m or {}).get('test_policy'),
                'endowment_total': (m or {}).get('endowment_total'),
                'endowment_per_student': (m or {}).get('endowment_per_student'),
                'graduation_rate_4yr': result.get('latest.completion.rate_suppressed.overall'),
                'graduation_rate_6yr': result.get('latest.completion.consumer_rate'),
                'median_earnings_6yr': result.get('latest.earnings.6_yrs_after_entry.median'),
                'median_earnings_10yr': result.get('latest.earnings.10_yrs_after_entry.median'),
                'median_debt_graduates': result.get('latest.aid.median_debt.completers.overall'),
                'median_debt_all': result.get('latest.aid.median_debt.noncompleters'),
                'pct_borrowing': result.get('latest.aid.pct_federal_loan'),
                'pell_grant_pct': result.get('latest.aid.pell_grant_rate'),
                'avg_net_price_0_30k': result.get('latest.cost.avg_net_price.income.0_30000'),
                'avg_net_price_30_48k': result.get('latest.cost.avg_net_price.income.30001_48000'),
                'avg_net_price_48_75k': result.get('latest.cost.avg_net_price.income.48001_75000'),
                'avg_net_price_75_110k': result.get('latest.cost.avg_net_price.income.75001_110000'),
                'avg_net_price_110k_plus': result.get('latest.cost.avg_net_price.income.110001_plus'),
                'student_faculty_ratio': result.get('latest.student.demographics.student_faculty_ratio'),
            })
            save()  # incremental — a later failure won't lose what's already resolved
            time.sleep(0.15)
        except Exception as e:
            print(f'  {slug:22s} -> ERROR: {e} (skipped, saved progress so far)')
            unresolved.append((slug, name, state, f'error: {e}'))
            save()

    print(f'\nWrote {len(rows)} schools -> {OUT_PATH}')

    if unresolved:
        print(f'\n{len(unresolved)} unresolved/errored — no Scorecard data, left out of output entirely:')
        for slug, name, state, why in unresolved:
            print(f'  {slug}: "{name}" ({state}) — {why}')


if __name__ == '__main__':
    main()
