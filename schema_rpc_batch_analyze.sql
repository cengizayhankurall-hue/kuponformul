CREATE OR REPLACE FUNCTION analyze_multiple_odds_batch(
  odds_payload JSONB,
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
  -- 1. Gelen 150 maçlık JSON paketini geçici bir tabloya çeviriyoruz (Tüm maçlar için tek işlem)
  target_matches AS (
    SELECT 
      m->>'id' as match_id,
      (m->>'ms1')::numeric as p_ms1,
      (m->>'ms0')::numeric as p_ms0,
      (m->>'ms2')::numeric as p_ms2,
      (m->>'alt15')::numeric as p_alt15,
      (m->>'ust15')::numeric as p_ust15,
      (m->>'alt25')::numeric as p_alt25,
      (m->>'ust25')::numeric as p_ust25,
      (m->>'alt35')::numeric as p_alt35,
      (m->>'ust35')::numeric as p_ust35,
      (m->>'kgVar')::numeric as p_kgvar,
      (m->>'kgYok')::numeric as p_kgyok
    FROM jsonb_array_elements(odds_payload) as m
  ),
  
  -- 2. Geçmiş maçların skorlarını tam sayıya çeviriyoruz (TÜM İŞLEMLER İÇİN SADECE 1 KERE!)
  parsed_past_matches AS (
    SELECT 
      *,
      split_part(replace(ms_score, ' ', ''), '-', 1)::integer as h_score,
      split_part(replace(ms_score, ' ', ''), '-', 2)::integer as a_score
    FROM public.past_matches
    WHERE ms_score IS NOT NULL 
      AND replace(ms_score, ' ', '') LIKE '%-%'
      AND split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' 
      AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$'
  ),

  -- 3. MS KATEGORİSİ EŞLEŞTİRMELERİ VE HESAPLAMASI
  ms_joined AS (
    SELECT tm.match_id, pm.h_score, pm.a_score 
    FROM target_matches tm
    JOIN parsed_past_matches pm ON (
        (tm.p_ms1 > 0 AND pm.ms_1_odd > 0 AND abs(pm.ms_1_odd - tm.p_ms1) <= p_tolerance) OR
        (tm.p_ms0 > 0 AND pm.ms_0_odd > 0 AND abs(pm.ms_0_odd - tm.p_ms0) <= p_tolerance) OR
        (tm.p_ms2 > 0 AND pm.ms_2_odd > 0 AND abs(pm.ms_2_odd - tm.p_ms2) <= p_tolerance)
    )
  ),
  ms_agg AS (
    SELECT match_id,
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
    FROM ms_joined GROUP BY match_id
  ),

  -- 4. 1.5 ALT/ÜST EŞLEŞTİRMELERİ
  au15_joined AS (
    SELECT tm.match_id, pm.h_score, pm.a_score 
    FROM target_matches tm
    JOIN parsed_past_matches pm ON (
        (tm.p_alt15 > 0 AND pm.alt_15_odd > 0 AND abs(pm.alt_15_odd - tm.p_alt15) <= p_tolerance) OR
        (tm.p_ust15 > 0 AND pm.ust_15_odd > 0 AND abs(pm.ust_15_odd - tm.p_ust15) <= p_tolerance)
    )
  ),
  au15_agg AS (
    SELECT match_id,
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1, COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX, COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar, COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM au15_joined GROUP BY match_id
  ),

  -- 5. 2.5 ALT/ÜST EŞLEŞTİRMELERİ
  au25_joined AS (
    SELECT tm.match_id, pm.h_score, pm.a_score 
    FROM target_matches tm
    JOIN parsed_past_matches pm ON (
        (tm.p_alt25 > 0 AND pm.alt_25_odd > 0 AND abs(pm.alt_25_odd - tm.p_alt25) <= p_tolerance) OR
        (tm.p_ust25 > 0 AND pm.ust_25_odd > 0 AND abs(pm.ust_25_odd - tm.p_ust25) <= p_tolerance)
    )
  ),
  au25_agg AS (
    SELECT match_id,
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1, COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX, COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar, COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM au25_joined GROUP BY match_id
  ),

  -- 6. 3.5 ALT/ÜST EŞLEŞTİRMELERİ
  au35_joined AS (
    SELECT tm.match_id, pm.h_score, pm.a_score 
    FROM target_matches tm
    JOIN parsed_past_matches pm ON (
        (tm.p_alt35 > 0 AND pm.alt_35_odd > 0 AND abs(pm.alt_35_odd - tm.p_alt35) <= p_tolerance) OR
        (tm.p_ust35 > 0 AND pm.ust_35_odd > 0 AND abs(pm.ust_35_odd - tm.p_ust35) <= p_tolerance)
    )
  ),
  au35_agg AS (
    SELECT match_id,
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1, COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX, COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar, COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM au35_joined GROUP BY match_id
  ),

  -- 7. KG VAR/YOK EŞLEŞTİRMELERİ
  kg_joined AS (
    SELECT tm.match_id, pm.h_score, pm.a_score 
    FROM target_matches tm
    JOIN parsed_past_matches pm ON (
        (tm.p_kgvar > 0 AND pm.kg_var_odd > 0 AND abs(pm.kg_var_odd - tm.p_kgvar) <= p_tolerance) OR
        (tm.p_kgyok > 0 AND pm.kg_yok_odd > 0 AND abs(pm.kg_yok_odd - tm.p_kgyok) <= p_tolerance)
    )
  ),
  kg_agg AS (
    SELECT match_id,
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN h_score > a_score THEN 1 ELSE 0 END), 0) as ms1, COALESCE(SUM(CASE WHEN h_score = a_score THEN 1 ELSE 0 END), 0) as msX, COALESCE(SUM(CASE WHEN h_score < a_score THEN 1 ELSE 0 END), 0) as ms2,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 1 THEN 1 ELSE 0 END), 0) as u15, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 1 THEN 1 ELSE 0 END), 0) as a15,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 2 THEN 1 ELSE 0 END), 0) as u25, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 2 THEN 1 ELSE 0 END), 0) as a25,
      COALESCE(SUM(CASE WHEN (h_score + a_score) > 3 THEN 1 ELSE 0 END), 0) as u35, COALESCE(SUM(CASE WHEN (h_score + a_score) <= 3 THEN 1 ELSE 0 END), 0) as a35,
      COALESCE(SUM(CASE WHEN h_score > 0 AND a_score > 0 THEN 1 ELSE 0 END), 0) as kgvar, COALESCE(SUM(CASE WHEN h_score = 0 OR a_score = 0 THEN 1 ELSE 0 END), 0) as kgyok
    FROM kg_joined GROUP BY match_id
  ),

  -- 8. TÜM HESAPLAMALARI BİRLEŞTİR
  final_stats AS (
    SELECT 
      tm.match_id,
      jsonb_build_object(
        'ms_stats', COALESCE((SELECT row_to_json(ms_agg) FROM ms_agg WHERE ms_agg.match_id = tm.match_id), '{"total":0,"ms1":0,"msX":0,"ms2":0,"u15":0,"a15":0,"u25":0,"a25":0,"u35":0,"a35":0,"kgvar":0,"kgyok":0}'::json),
        'au15_stats', COALESCE((SELECT row_to_json(au15_agg) FROM au15_agg WHERE au15_agg.match_id = tm.match_id), '{"total":0,"ms1":0,"msX":0,"ms2":0,"u15":0,"a15":0,"u25":0,"a25":0,"u35":0,"a35":0,"kgvar":0,"kgyok":0}'::json),
        'au25_stats', COALESCE((SELECT row_to_json(au25_agg) FROM au25_agg WHERE au25_agg.match_id = tm.match_id), '{"total":0,"ms1":0,"msX":0,"ms2":0,"u15":0,"a15":0,"u25":0,"a25":0,"u35":0,"a35":0,"kgvar":0,"kgyok":0}'::json),
        'au35_stats', COALESCE((SELECT row_to_json(au35_agg) FROM au35_agg WHERE au35_agg.match_id = tm.match_id), '{"total":0,"ms1":0,"msX":0,"ms2":0,"u15":0,"a15":0,"u25":0,"a25":0,"u35":0,"a35":0,"kgvar":0,"kgyok":0}'::json),
        'kg_stats', COALESCE((SELECT row_to_json(kg_agg) FROM kg_agg WHERE kg_agg.match_id = tm.match_id), '{"total":0,"ms1":0,"msX":0,"ms2":0,"u15":0,"a15":0,"u25":0,"a25":0,"u35":0,"a35":0,"kgvar":0,"kgyok":0}'::json)
      ) as stats
    FROM target_matches tm
  )
  
  SELECT jsonb_agg(jsonb_build_object(
    'match_id', match_id,
    'stats', stats
  )) INTO v_result
  FROM final_stats;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;
