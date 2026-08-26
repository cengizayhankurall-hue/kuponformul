-- SQL Migration to create past_matches table for historical odds analysis

CREATE TABLE IF NOT EXISTS public.past_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_date DATE NOT NULL,
    match_time TEXT NOT NULL,
    league TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    iy_score TEXT,
    ms_score TEXT,
    ms1 NUMERIC(5, 2),
    msX NUMERIC(5, 2),
    ms2 NUMERIC(5, 2),
    iy1 NUMERIC(5, 2),
    iyX NUMERIC(5, 2),
    iy2 NUMERIC(5, 2),
    kg_var NUMERIC(5, 2),
    kg_yok NUMERIC(5, 2),
    cs_1x NUMERIC(5, 2),
    cs_12 NUMERIC(5, 2),
    cs_x2 NUMERIC(5, 2),
    iy_alt_15 NUMERIC(5, 2),
    iy_ust_15 NUMERIC(5, 2),
    alt_15 NUMERIC(5, 2),
    ust_15 NUMERIC(5, 2),
    alt_25 NUMERIC(5, 2),
    ust_25 NUMERIC(5, 2),
    alt_35 NUMERIC(5, 2),
    ust_35 NUMERIC(5, 2),
    tg_0_1 NUMERIC(5, 2),
    tg_2_3 NUMERIC(5, 2),
    tg_4_5 NUMERIC(5, 2),
    tg_6_plus NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique index to prevent duplicate matches and allow upserts (ON CONFLICT DO UPDATE)
CREATE UNIQUE INDEX IF NOT EXISTS unique_match_idx ON public.past_matches (home_team, away_team, match_date, match_time);

-- Enable RLS (Row Level Security)
ALTER TABLE public.past_matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.past_matches;
DROP POLICY IF EXISTS "Allow admin write access" ON public.past_matches;

-- Policy to allow anonymous read access (all users can view historic matches for analysis)
CREATE POLICY "Allow public read access" ON public.past_matches
    FOR SELECT USING (true);

-- Policy to allow authenticated admin users to insert/update/delete records
CREATE POLICY "Allow admin write access" ON public.past_matches
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
