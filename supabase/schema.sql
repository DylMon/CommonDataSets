-- Run this in the Supabase SQL editor to create the schools table.
-- Enable RLS so only public reads are allowed (no writes from the browser).

CREATE TABLE IF NOT EXISTS schools (
  id                     SERIAL PRIMARY KEY,
  slug                   TEXT UNIQUE NOT NULL,        -- url slug, e.g. "mit", "harvard"
  name                   TEXT NOT NULL,
  scorecard_id           INTEGER,                      -- College Scorecard unit_id
  data_year              TEXT DEFAULT '2023-24',

  -- Identity
  location               TEXT,
  city                   TEXT,
  state                  TEXT,
  school_type            TEXT,                         -- "Private" | "Public"
  website                TEXT,
  us_news_ranking        TEXT,

  -- Acceptance
  acceptance_rate        NUMERIC,                      -- 0.067 = 6.7%
  applicants_total       INTEGER,
  admitted_total         INTEGER,
  enrolled_total         INTEGER,

  -- Test policy (from CDS / school policy pages)
  ea_ed_type             TEXT,                         -- "Early Action" | "Early Decision" | "Both" | "None"
  ea_ed_deadline         TEXT,
  rd_deadline            TEXT,
  sat_writing_required   BOOLEAN,
  act_writing_required   BOOLEAN,
  sat_superscore         BOOLEAN,
  act_superscore         BOOLEAN,
  sat_score_choice       BOOLEAN,
  act_score_choice       BOOLEAN,

  -- GPA
  avg_gpa_weighted       NUMERIC,

  -- SAT
  sat_avg                INTEGER,
  sat_reading_25         INTEGER,
  sat_reading_75         INTEGER,
  sat_math_25            INTEGER,
  sat_math_75            INTEGER,

  -- ACT
  act_avg                INTEGER,
  act_25                 INTEGER,
  act_75                 INTEGER,
  act_math_25            INTEGER,
  act_math_75            INTEGER,
  act_english_25         INTEGER,
  act_english_75         INTEGER,

  -- Enrollment breakdown
  total_undergrads       INTEGER,
  undergrads_male        INTEGER,
  undergrads_female      INTEGER,

  -- Costs
  tuition_in_state       INTEGER,
  tuition_out_of_state   INTEGER,
  room_and_board         INTEGER,
  required_fees_in       INTEGER,
  required_fees_out      INTEGER,
  books_supplies         INTEGER,
  other_expenses_in      INTEGER,
  other_expenses_out     INTEGER,
  application_fee        INTEGER,

  -- Complex data stored as JSONB (no joins needed for single-school page loads)
  applicant_pools        JSONB,
  -- { ea: {applied, accepted, rate}, rd: {applied, accepted, rate},
  --   waitlist: {offered, accepted_spots, enrolled} }

  gender_breakdown       JSONB,
  -- { applied: {male, female}, accepted: {male, female}, enrolled: {male, female} }

  demographics           JSONB,
  -- { nonresident_aliens, hispanic, black, white, american_indian, asian,
  --   pacific_islander, two_or_more, unknown } — counts for first_year and undergrad

  geographic_breakdown   JSONB,
  -- { in_state_pct, out_of_state_pct, international_pct }

  sat_act_breakdown      JSONB,
  -- { sat_submitted_count, sat_submitted_pct, act_submitted_count, act_submitted_pct }

  class_rank             JSONB,
  -- { top10, top25, top50, bottom50, bottom25 } — percent of admitted students

  gpa_distribution       JSONB,
  -- { gpa_40, gpa_375_399, gpa_350_374, gpa_325_349,
  --   gpa_300_324, gpa_250_299, gpa_200_249, gpa_100_199 }

  admission_factors      JSONB,
  -- { rigor, class_rank, academic_gpa, test_scores, essay, recommendations,
  --   interview, extracurriculars, talent, character, first_gen, alumni_relation,
  --   geo_residence, state_residence, religious, racial_ethnic, volunteer,
  --   work_experience, applicant_interest }
  -- Values: "very_important" | "important" | "considered" | "not_considered"

  demographics_detail    JSONB,
  -- { first_year: {nonresident_aliens, hispanic, black, white, ...}, undergrad: {...} } — raw counts from CDS HTML

  transfer_stats         JSONB,
  -- { male: {applied, admitted, enrolled}, female: {applied, admitted, enrolled},
  --   total: {applied, admitted, rate, enrolled} }

  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Public read-only access
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON schools FOR SELECT
  USING (true);
