-- ULTRA FAST INDEXED ODDS ANALYZER RPC FUNCTION
CREATE OR REPLACE FUNCTION analyze_detailed_odds(
  p_ms1 NUMERIC,
  p_ms0 NUMERIC,
  p_ms2 NUMERIC,
  p_alt15 NUMERIC DEFAULT 0,
  p_ust15 NUMERIC DEFAULT 0,
  p_alt25 NUMERIC DEFAULT 0,
  p_ust25 NUMERIC DEFAULT 0,
  p_alt35 NUMERIC DEFAULT 0,
  p_ust35 NUMERIC DEFAULT 0,
  p_kgvar NUMERIC DEFAULT 0,
  p_kgyok NUMERIC DEFAULT 0,
  p_tolerance NUMERIC DEFAULT 0.05
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN

  WITH 
  -- 1. MS ORANLARINA GÖRE FİLTRELENENLER (B-TREE İNDEKS KULLANIR, 1-2 MS SÜRER)
  ms_matches AS (
    SELECT 
      split_part(ms_score, ' - ', 1)::integer as h_score,
      split_part(ms_score, ' - ', 2)::integer as a_score
    FROM public.past_matches 
    WHERE 
      (p_ms1 <= 0 OR (ms_1_odd >= (p_ms1 - p_tolerance) AND ms_1_odd <= (p_ms1 + p_tolerance)))
      AND (p_ms0 <= 0 OR (ms_0_odd >= (p_ms0 - p_tolerance) AND ms_0_odd <= (p_ms0 + p_tolerance)))
      AND (p_ms2 <= 0 OR (ms_2_odd >= (p_ms2 - p_tolerance) AND ms_2_odd <= (p_ms2 + p_tolerance)))
      AND ms_score IS NOT NULL 
      AND ms_score LIKE '% - %'
    LIMIT 2000
  ),
  
  -- 2. 1.5 ALT/ÜST ORANLARINA GÖRE FİLTRELENENLER
  au15_matches AS (
    SELECT 
      split_part(ms_score, ' - ', 1)::integer as h_score,
      split_part(ms_score, ' - ', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (p_alt15 > 0 OR p_ust15 > 0)
      AND (p_alt15 <= 0 OR (alt_15_odd >= (p_alt15 - p_tolerance) AND alt_15_odd <= (p_alt15 + p_tolerance)))
      AND (p_ust15 <= 0 OR (ust_15_odd >= (p_ust15 - p_tolerance) AND ust_15_odd <= (p_ust15 + p_tolerance)))
      AND ms_score IS NOT NULL 
      AND ms_score LIKE '% - %'
    LIMIT 2000
  ),
  
  -- 3. 2.5 ALT/ÜST ORANLARINA GÖRE FİLTRELENENLER
  au25_matches AS (
    SELECT 
      split_part(ms_score, ' - ', 1)::integer as h_score,
      split_part(ms_score, ' - ', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (p_alt25 > 0 OR p_ust25 > 0)
      AND (p_alt25 <= 0 OR (alt_25_odd >= (p_alt25 - p_tolerance) AND alt_25_odd <= (p_alt25 + p_tolerance)))
      AND (p_ust25 <= 0 OR (ust_25_odd >= (p_ust25 - p_tolerance) AND ust_25_odd <= (p_ust25 + p_tolerance)))
      AND ms_score IS NOT NULL 
      AND ms_score LIKE '% - %'
    LIMIT 2000
  ),

  -- 4. 3.5 ALT/ÜST ORANLARINA GÖRE FİLTRELENENLER
  au35_matches AS (
    SELECT 
      split_part(ms_score, ' - ', 1)::integer as h_score,
      split_part(ms_score, ' - ', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (p_alt35 > 0 OR p_ust35 > 0)
      AND (p_alt35 <= 0 OR (alt_35_odd >= (p_alt35 - p_tolerance) AND alt_35_odd <= (p_alt35 + p_tolerance)))
      AND (p_ust35 <= 0 OR (ust_35_odd >= (p_ust35 - p_tolerance) AND ust_35_odd <= (p_ust35 + p_tolerance)))
      AND ms_score IS NOT NULL 
      AND ms_score LIKE '% - %'
    LIMIT 2000
  ),

  -- 5. KG VAR/YOK ORANLARINA GÖRE FİLTRELENENLER
  kg_matches AS (
    SELECT 
      split_part(ms_score, ' - ', 1)::integer as h_score,
      split_part(ms_score, ' - ', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (p_kgvar > 0 OR p_kgyok > 0)
      AND (p_kgvar <= 0 OR (kg_var_odd >= (p_kgvar - p_tolerance) AND kg_var_odd <= (p_kgvar + p_tolerance)))
      AND (p_kgyok <= 0 OR (kg_yok_odd >= (p_kgyok - p_tolerance) AND kg_yok_odd <= (p_kgyok + p_tolerance)))
      AND ms_score IS NOT NULL 
      AND ms_score LIKE '% - %'
    LIMIT 2000
  ),

  -- İSTATİSTİKLER
  ms_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0)::integer as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0)::integer as msx,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0)::integer as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0)::integer as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0)::integer as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0)::integer as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0)::integer as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0)::integer as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0)::integer as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0)::integer as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0)::integer as kgyok
    FROM ms_matches
  ),

  au15_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0)::integer as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0)::integer as msx,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0)::integer as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0)::integer as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0)::integer as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0)::integer as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0)::integer as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0)::integer as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0)::integer as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0)::integer as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0)::integer as kgyok
    FROM au15_matches
  ),

  au25_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0)::integer as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0)::integer as msx,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0)::integer as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0)::integer as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0)::integer as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0)::integer as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0)::integer as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0)::integer as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0)::integer as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0)::integer as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0)::integer as kgyok
    FROM au25_matches
  ),

  au35_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0)::integer as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0)::integer as msx,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0)::integer as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0)::integer as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0)::integer as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0)::integer as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0)::integer as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0)::integer as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0)::integer as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0)::integer as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0)::integer as kgyok
    FROM au35_matches
  ),

  kg_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0)::integer as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0)::integer as msx,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0)::integer as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0)::integer as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0)::integer as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0)::integer as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0)::integer as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0)::integer as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0)::integer as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0)::integer as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0)::integer as kgyok
    FROM kg_matches
  )

  SELECT jsonb_build_object(
    'ms_stats', (SELECT row_to_json(ms_stats) FROM ms_stats),
    'au15_stats', (SELECT row_to_json(au15_stats) FROM au15_stats),
    'au25_stats', (SELECT row_to_json(au25_stats) FROM au25_stats),
    'au35_stats', (SELECT row_to_json(au35_stats) FROM au35_stats),
    'kg_stats', (SELECT row_to_json(kg_stats) FROM kg_stats)
  ) INTO v_result;

  RETURN v_result;

END;
$$;
