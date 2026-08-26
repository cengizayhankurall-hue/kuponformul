-- Supabase SQL Editor'a yapıştırılacak RPC fonksiyonu (BOŞLUKLU SKORLAR İÇİN DÜZELTİLMİŞTİR)

CREATE OR REPLACE FUNCTION analyze_match_odds(
  p_ms1 NUMERIC,
  p_ms0 NUMERIC,
  p_ms2 NUMERIC,
  p_tolerance NUMERIC DEFAULT 0.05
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exact_count INTEGER;
  v_result JSONB;
BEGIN
  -- 1. Tam Eşleşme (Exact Match) Sayısını Bul
  SELECT COUNT(*) INTO v_exact_count
  FROM public.past_matches
  WHERE ms_1_odd = p_ms1 AND ms_0_odd = p_ms0 AND ms_2_odd = p_ms2;

  -- 2. Geçici Tablo Oluştur (Eşleşen Maçları Tutmak İçin)
  CREATE TEMP TABLE temp_similar_matches ON COMMIT DROP AS
  SELECT * FROM public.past_matches
  WHERE ms_1_odd = p_ms1 AND ms_0_odd = p_ms0 AND ms_2_odd = p_ms2;

  -- 3. Eğer tam eşleşme az ise (<5) ve MS1 oranı varsa esnek arama (Fuzzy Match) yap
  IF v_exact_count < 5 AND p_ms1 > 0 THEN
    TRUNCATE temp_similar_matches;
    
    INSERT INTO temp_similar_matches
    SELECT * FROM public.past_matches
    WHERE (
        (ms_1_odd > 0 AND abs(ms_1_odd - p_ms1) <= p_tolerance)
        OR
        (ms_0_odd > 0 AND abs(ms_0_odd - p_ms0) <= p_tolerance)
        OR
        (ms_2_odd > 0 AND abs(ms_2_odd - p_ms2) <= p_tolerance)
    );
  END IF;

  -- 4. Eğer hiç maç bulunamazsa boş sonuç dön
  IF (SELECT COUNT(*) FROM temp_similar_matches) = 0 THEN
    RETURN jsonb_build_object(
      'total', 0,
      'message', 'Bu oranlara benzer geçmişte maç bulunamadı.'
    );
  END IF;

  -- 5. İstatistikleri Hesapla
  SELECT jsonb_build_object(
      'total', COUNT(*),
      
      -- Maç Sonucu
      'ms1_wins', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 1)::integer > split_part(replace(ms_score, ' ', ''), '-', 2)::integer THEN 1 ELSE 0 END), 0),
      'ms0_draws', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 1)::integer = split_part(replace(ms_score, ' ', ''), '-', 2)::integer THEN 1 ELSE 0 END), 0),
      'ms2_wins', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 1)::integer < split_part(replace(ms_score, ' ', ''), '-', 2)::integer THEN 1 ELSE 0 END), 0),
      
      -- İlk Yarı
      'iy1_wins', COALESCE(SUM(CASE WHEN iy_score IS NOT NULL AND split_part(replace(iy_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(iy_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND split_part(replace(iy_score, ' ', ''), '-', 1)::integer > split_part(replace(iy_score, ' ', ''), '-', 2)::integer THEN 1 ELSE 0 END), 0),
      'iy0_draws', COALESCE(SUM(CASE WHEN iy_score IS NOT NULL AND split_part(replace(iy_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(iy_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND split_part(replace(iy_score, ' ', ''), '-', 1)::integer = split_part(replace(iy_score, ' ', ''), '-', 2)::integer THEN 1 ELSE 0 END), 0),
      'iy2_wins', COALESCE(SUM(CASE WHEN iy_score IS NOT NULL AND split_part(replace(iy_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(iy_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND split_part(replace(iy_score, ' ', ''), '-', 1)::integer < split_part(replace(iy_score, ' ', ''), '-', 2)::integer THEN 1 ELSE 0 END), 0),
      
      -- 2.5 Gol Alt/Üst
      'ust25', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(ms_score, ' ', ''), '-', 1)::integer + split_part(replace(ms_score, ' ', ''), '-', 2)::integer) > 2 THEN 1 ELSE 0 END), 0),
      'alt25', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(ms_score, ' ', ''), '-', 1)::integer + split_part(replace(ms_score, ' ', ''), '-', 2)::integer) <= 2 THEN 1 ELSE 0 END), 0),
      
      -- 1.5 Gol Alt/Üst
      'ust15', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(ms_score, ' ', ''), '-', 1)::integer + split_part(replace(ms_score, ' ', ''), '-', 2)::integer) > 1 THEN 1 ELSE 0 END), 0),
      'alt15', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(ms_score, ' ', ''), '-', 1)::integer + split_part(replace(ms_score, ' ', ''), '-', 2)::integer) <= 1 THEN 1 ELSE 0 END), 0),
      
      -- 3.5 Gol Alt/Üst
      'ust35', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(ms_score, ' ', ''), '-', 1)::integer + split_part(replace(ms_score, ' ', ''), '-', 2)::integer) > 3 THEN 1 ELSE 0 END), 0),
      'alt35', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(ms_score, ' ', ''), '-', 1)::integer + split_part(replace(ms_score, ' ', ''), '-', 2)::integer) <= 3 THEN 1 ELSE 0 END), 0),
      
      -- İY 1.5 Gol Alt/Üst
      'iy_ust15', COALESCE(SUM(CASE WHEN iy_score IS NOT NULL AND split_part(replace(iy_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(iy_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(iy_score, ' ', ''), '-', 1)::integer + split_part(replace(iy_score, ' ', ''), '-', 2)::integer) > 1 THEN 1 ELSE 0 END), 0),
      'iy_alt15', COALESCE(SUM(CASE WHEN iy_score IS NOT NULL AND split_part(replace(iy_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(iy_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(iy_score, ' ', ''), '-', 1)::integer + split_part(replace(iy_score, ' ', ''), '-', 2)::integer) <= 1 THEN 1 ELSE 0 END), 0),
      
      -- Karşılıklı Gol
      'kgVar', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 1)::integer > 0 AND split_part(replace(ms_score, ' ', ''), '-', 2)::integer > 0 THEN 1 ELSE 0 END), 0),
      'kgYok', COALESCE(SUM(CASE WHEN split_part(replace(ms_score, ' ', ''), '-', 1) ~ '^[0-9]+$' AND split_part(replace(ms_score, ' ', ''), '-', 2) ~ '^[0-9]+$' AND (split_part(replace(ms_score, ' ', ''), '-', 1)::integer = 0 OR split_part(replace(ms_score, ' ', ''), '-', 2)::integer = 0) THEN 1 ELSE 0 END), 0),
      
      -- Benzer maç verilerinin en güncel 5 tanesi
      'similarMatchesData', (
        SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
        FROM (
          SELECT * FROM temp_similar_matches
          ORDER BY match_date DESC
          LIMIT 5
        ) sub
      )
  ) INTO v_result
  FROM temp_similar_matches
  WHERE ms_score IS NOT NULL AND replace(ms_score, ' ', '') LIKE '%-%';

  RETURN v_result;
END;
$$;
