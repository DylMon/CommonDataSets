-- college_scorecard table — run in the Supabase SQL editor.
-- Stores supplementary data that complements cds_2024_2025:
--   rankings, graduation/earnings outcomes, financial aid, and academic profile.
-- Data current through 2024–2025.
--
-- Data sources:
--   Rankings / endowment / test policy : data/scorecard/manual.json (manually curated)
--   Everything else                    : College Scorecard API (api.data.gov/ed/collegescorecard)
--
-- To set up:  run this file in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS college_scorecard (
  id                       SERIAL PRIMARY KEY,
  slug                     TEXT NOT NULL,
  name                     TEXT NOT NULL,
  scorecard_id             INTEGER,            -- UNITID from College Scorecard / IPEDS

  -- ── Rankings ──────────────────────────────────────────────────────────
  us_news_rank             INTEGER,            -- numeric rank (ties share same number)
  us_news_rank_year        TEXT,               -- e.g. "2025"

  -- ── Test policy ───────────────────────────────────────────────────────
  test_policy              TEXT,               -- "required" | "optional" | "blind"

  -- ── Graduation rates (College Scorecard — completion) ─────────────────
  graduation_rate_4yr      NUMERIC,            -- 4-year completion rate (decimal)
  graduation_rate_6yr      NUMERIC,            -- 6-year / 150% time (decimal)

  -- ── Earnings outcomes (College Scorecard — 6 & 10 yr median) ──────────
  median_earnings_6yr      INTEGER,            -- median earnings 6 years after enrollment
  median_earnings_10yr     INTEGER,            -- median earnings 10 years after enrollment

  -- ── Student debt (College Scorecard) ──────────────────────────────────
  median_debt_graduates    INTEGER,            -- median debt, completers only
  median_debt_all          INTEGER,            -- median debt, all students (including non-completers)
  pct_borrowing            NUMERIC,            -- fraction of students borrowing federal loans

  -- ── Financial aid (College Scorecard) ─────────────────────────────────
  pell_grant_pct           NUMERIC,            -- fraction receiving Pell grants
  avg_net_price_0_30k      INTEGER,            -- avg net price, family income $0–$30k
  avg_net_price_30_48k     INTEGER,            -- $30k–$48k
  avg_net_price_48_75k     INTEGER,            -- $48k–$75k
  avg_net_price_75_110k    INTEGER,            -- $75k–$110k
  avg_net_price_110k_plus  INTEGER,            -- $110k+

  -- ── Academic profile (College Scorecard / IPEDS) ──────────────────────
  student_faculty_ratio    NUMERIC,            -- e.g. 6.0 means 6:1
  pct_classes_under_20     NUMERIC,            -- fraction of classes with fewer than 20 students
  pct_classes_50_plus      NUMERIC,            -- fraction of classes with 50+ students

  -- ── Endowment (NACUBO — manually curated) ─────────────────────────────
  endowment_total          BIGINT,             -- total endowment in dollars
  endowment_per_student    INTEGER,            -- endowment per FTE student

  updated_at               TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (slug)
);

-- Public read-only
ALTER TABLE college_scorecard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON college_scorecard FOR SELECT
  USING (true);
