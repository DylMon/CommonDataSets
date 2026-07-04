-- CDS 2024-25 table — run in the Supabase SQL editor.
-- All column names match the JSON keys in data/cds/*.json.
--
-- To set up fresh:
--   DROP TABLE IF EXISTS schools_cds;
--   Then run this file.

CREATE TABLE IF NOT EXISTS cds_2024_2025 (
  id                     SERIAL PRIMARY KEY,
  slug                   TEXT NOT NULL,
  name                   TEXT NOT NULL,
  data_year              TEXT NOT NULL DEFAULT '2024-25',

  -- Identity
  city                   TEXT,
  state                  TEXT,
  location               TEXT,
  school_type            TEXT,       -- "Private" | "Public"
  website                TEXT,

  -- Admissions (C1)
  applicants_total       INTEGER,
  applicants_men         INTEGER,
  applicants_women       INTEGER,
  admitted_total         INTEGER,
  admitted_men           INTEGER,
  admitted_women         INTEGER,
  enrolled_total         INTEGER,
  enrolled_men           INTEGER,
  enrolled_women         INTEGER,
  acceptance_rate        NUMERIC,    -- decimal e.g. 0.046

  -- Application details
  application_fee        INTEGER,
  avg_gpa_weighted       NUMERIC,
  rd_deadline            TEXT,

  -- Waitlist (C2)
  waitlist_offered       INTEGER,
  waitlist_accepted      INTEGER,
  waitlist_admitted      INTEGER,

  -- Early Decision / Early Action (C21-C22)
  ea_ed_type             TEXT,       -- "ED" | "EA" | "REA" | "ED I & II" | null
  ea_ed_deadline         TEXT,
  ea_ed_notification     TEXT,
  ea_apps_received       INTEGER,
  ea_apps_admitted       INTEGER,

  -- Test score submission (C9)
  sat_submitted_pct      NUMERIC,
  sat_submitted_count    INTEGER,
  act_submitted_pct      NUMERIC,
  act_submitted_count    INTEGER,

  -- SAT percentiles (C9)
  sat_composite_25       INTEGER,
  sat_composite_75       INTEGER,
  sat_reading_25         INTEGER,
  sat_reading_75         INTEGER,
  sat_math_25            INTEGER,
  sat_math_75            INTEGER,

  -- ACT percentiles (C9)
  act_composite_25       INTEGER,
  act_composite_75       INTEGER,
  act_math_25            INTEGER,
  act_math_75            INTEGER,
  act_english_25         INTEGER,
  act_english_75         INTEGER,

  -- Enrollment (B1, B22)
  total_undergrads       INTEGER,
  undergrads_male        INTEGER,
  undergrads_female      INTEGER,
  retention_rate         NUMERIC,

  -- Costs (G1, G5)
  tuition                INTEGER,    -- private; null if public
  tuition_in_state       INTEGER,    -- public; null if private
  tuition_out_of_state   INTEGER,    -- public; null if private
  required_fees          INTEGER,
  room_and_board         INTEGER,
  books_supplies         INTEGER,
  other_expenses         INTEGER,

  -- Student life (F1)
  pct_out_of_state       NUMERIC,
  pct_on_campus_housing  NUMERIC,

  -- Complex / nested data as JSONB
  applicant_pools        JSONB,
  gender_breakdown       JSONB,
  demographics_detail    JSONB,
  geographic_breakdown   JSONB,
  sat_act_breakdown      JSONB,
  class_rank             JSONB,
  gpa_distribution       JSONB,
  admission_factors      JSONB,
  transfer_stats         JSONB,

  updated_at             TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (slug, data_year)
);

-- Public read-only
ALTER TABLE cds_2024_2025 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON cds_2024_2025 FOR SELECT
  USING (true);
