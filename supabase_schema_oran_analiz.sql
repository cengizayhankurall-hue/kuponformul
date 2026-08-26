-- Oran Analiz Motoru İçin Geçmiş Maçlar Tablosu (past_matches)

CREATE TABLE IF NOT EXISTS public.past_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_date DATE NOT NULL,
    match_time TIME,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT,
    
    -- Skorlar
    ms_score TEXT, -- Örn: "2-1"
    iy_score TEXT, -- Örn: "1-0"
    
    -- Maç Sonucu Oranları
    ms_1_odd NUMERIC(5, 2),
    ms_0_odd NUMERIC(5, 2),
    ms_2_odd NUMERIC(5, 2),
    
    -- İlk Yarı Oranları (Eğer excelde varsa)
    iy_1_odd NUMERIC(5, 2),
    iy_0_odd NUMERIC(5, 2),
    iy_2_odd NUMERIC(5, 2),
    
    -- Alt / Üst Oranları
    alt_25_odd NUMERIC(5, 2),
    ust_25_odd NUMERIC(5, 2),
    
    -- Karşılıklı Gol Oranları
    kg_var_odd NUMERIC(5, 2),
    kg_yok_odd NUMERIC(5, 2),
    
    -- Çifte Şans Oranları
    cs_1x_odd NUMERIC(5, 2),
    cs_12_odd NUMERIC(5, 2),
    cs_x2_odd NUMERIC(5, 2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benzersizlik Kısıtlaması (Unique Constraint)
-- Aynı gün aynı ev sahibi ve deplasman takımının birden fazla maçı olamaz.
-- Bu sayede mükerrer kayıt eklenmesi engellenir.
ALTER TABLE public.past_matches 
ADD CONSTRAINT unique_past_match 
UNIQUE (home_team, away_team, match_date);

-- RLS (Row Level Security) Ayarları
-- Herkes okuyabilir
ALTER TABLE public.past_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes geçmiş maçları okuyabilir" 
ON public.past_matches 
FOR SELECT 
USING (true);

-- API anahtarı veya servis rolü ekleme / güncelleme yapabilir. 
-- (Şu anlık insert iznini de sadece yetkili (veya anon key ile test için herkese) bırakabiliriz,
-- ama gerçek sistemde insert sadece yetkili API tarafında service_role ile yapılır.)
-- Test için anon key'e insert izni (bunu daha sonra silebilirsiniz):
CREATE POLICY "Anon insert izni" 
ON public.past_matches 
FOR INSERT 
WITH CHECK (true);
