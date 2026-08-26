-- Supabase SQL Editor'a yapıştırılacak YENİ DETAYLI RPC FONKSİYONU

CREATE OR REPLACE FUNCTION analyze_detailed_odds(
  p_ms1 NUMERIC,
  p_ms0 NUMERIC,
  p_ms2 NUMERIC,
  p_alt15 NUMERIC,
  p_ust15 NUMERIC,
  p_alt25 NUMERIC,
  p_ust25 NUMERIC,
  p_alt35 NUMERIC,
  p_ust35 NUMERIC,
  p_kgvar NUMERIC,
  p_kgyok NUMERIC,
  p_tolerance NUMERIC DEFAULT 0.05
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN

  -- Tüm hesaplamaları tek bir sorguda (CTE kullanarak) yapıyoruz.
  -- CTE'ler sayesinde 5 farklı filtrelemeyi veritabanı belleğinde hızlıca yapıp istatistikleri çıkarıyoruz.
  WITH 
  
  -- 1. MS ORANLARINA GÖRE FİLTRELENENLER
  ms_matches AS (
    SELECT 
      split_part(replace(ms_score, ' ', ''), '-', 1)::integer as h_score,
      split_part(replace(ms_score, ' ', ''), '-', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (
        (p_ms1 > 0 AND ms_1_odd > 0 AND abs(ms_1_odd - p_ms1) <= p_tolerance) OR
        (p_ms0 > 0 AND ms_0_odd > 0 AND abs(ms_0_odd - p_ms0) <= p_tolerance) OR
        (p_ms2 > 0 AND ms_2_odd > 0 AND abs(ms_2_odd - p_ms2) <= p_tolerance)
      )
      AND ms_score IS NOT NULL 
      AND replace(ms_score, ' ', '') LIKE '%-%'
      AND split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' 
      AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$'
  ),
  
  -- 2. 1.5 ALT/ÜST ORANLARINA GÖRE FİLTRELENENLER
  au15_matches AS (
    SELECT 
      split_part(replace(ms_score, ' ', ''), '-', 1)::integer as h_score,
      split_part(replace(ms_score, ' ', ''), '-', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (
        (p_alt15 > 0 AND alt_15_odd > 0 AND abs(alt_15_odd - p_alt15) <= p_tolerance) OR
        (p_ust15 > 0 AND ust_15_odd > 0 AND abs(ust_15_odd - p_ust15) <= p_tolerance)
      )
      AND ms_score IS NOT NULL 
      AND replace(ms_score, ' ', '') LIKE '%-%'
      AND split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' 
      AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$'
  ),
  
  -- 3. 2.5 ALT/ÜST ORANLARINA GÖRE FİLTRELENENLER
  au25_matches AS (
    SELECT 
      split_part(replace(ms_score, ' ', ''), '-', 1)::integer as h_score,
      split_part(replace(ms_score, ' ', ''), '-', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (
        (p_alt25 > 0 AND alt_25_odd > 0 AND abs(alt_25_odd - p_alt25) <= p_tolerance) OR
        (p_ust25 > 0 AND ust_25_odd > 0 AND abs(ust_25_odd - p_ust25) <= p_tolerance)
      )
      AND ms_score IS NOT NULL 
      AND replace(ms_score, ' ', '') LIKE '%-%'
      AND split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' 
      AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$'
  ),

  -- 4. 3.5 ALT/ÜST ORANLARINA GÖRE FİLTRELENENLER
  au35_matches AS (
    SELECT 
      split_part(replace(ms_score, ' ', ''), '-', 1)::integer as h_score,
      split_part(replace(ms_score, ' ', ''), '-', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (
        (p_alt35 > 0 AND alt_35_odd > 0 AND abs(alt_35_odd - p_alt35) <= p_tolerance) OR
        (p_ust35 > 0 AND ust_35_odd > 0 AND abs(ust_35_odd - p_ust35) <= p_tolerance)
      )
      AND ms_score IS NOT NULL 
      AND replace(ms_score, ' ', '') LIKE '%-%'
      AND split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' 
      AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$'
  ),

  -- 5. KG VAR/YOK ORANLARINA GÖRE FİLTRELENENLER
  kg_matches AS (
    SELECT 
      split_part(replace(ms_score, ' ', ''), '-', 1)::integer as h_score,
      split_part(replace(ms_score, ' ', ''), '-', 2)::integer as a_score
    FROM public.past_matches 
    WHERE (
        (p_kgvar > 0 AND kg_var_odd > 0 AND abs(kg_var_odd - p_kgvar) <= p_tolerance) OR
        (p_kgyok > 0 AND kg_yok_odd > 0 AND abs(kg_yok_odd - p_kgyok) <= p_tolerance)
      )
      AND ms_score IS NOT NULL 
      AND replace(ms_score, ' ', '') LIKE '%-%'
      AND split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' 
      AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$'
  ),

  -- YARDIMCI İSTATİSTİK HESAPLAMA FONKSİYONU GİBİ ÇALIŞAN ALT SORGULAR
  ms_stats AS (
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM ms_matches
  ),

  au15_stats AS (
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM au15_matches
  ),

  au25_stats AS (
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM au25_matches
  ),

  au35_stats AS (
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM au35_matches
  ),

  kg_stats AS (
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1,
      COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX,
      COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35,
      COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar,
      COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM kg_matches
  )

  -- SONUÇLARI JSON OLARAK BİRLEŞTİR VE DÖNDÜR
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
