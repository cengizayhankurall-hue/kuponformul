-- Add new odds columns to past_matches table for complete coverage
ALTER TABLE past_matches 
ADD COLUMN IF NOT EXISTS alt_45_odd numeric,
ADD COLUMN IF NOT EXISTS ust_45_odd numeric,
ADD COLUMN IF NOT EXISTS iy_05_alt_odd numeric,
ADD COLUMN IF NOT EXISTS iy_05_ust_odd numeric,
ADD COLUMN IF NOT EXISTS tg_0_1_odd numeric,
ADD COLUMN IF NOT EXISTS tg_2_3_odd numeric,
ADD COLUMN IF NOT EXISTS tg_4_5_odd numeric,
ADD COLUMN IF NOT EXISTS tg_6_plus_odd numeric;

-- Indexing for high-speed odds and league queries
CREATE INDEX IF NOT EXISTS idx_past_matches_league ON past_matches(league);
CREATE INDEX IF NOT EXISTS idx_past_matches_ms_odds ON past_matches(ms_1_odd, ms_0_odd, ms_2_odd);
CREATE INDEX IF NOT EXISTS idx_past_matches_date ON past_matches(match_date);
