-- İddaa Kaydedilen Kuponlar Tablosu
CREATE TABLE IF NOT EXISTS public.iddaa_saved_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    matches JSONB NOT NULL, -- İçeriği: [{ matchId, homeTeam, awayTeam, date, time, pickLabel, pickOdd, status: 'pending' }, ...]
    total_odds DECIMAL(10, 2) NOT NULL,
    stake DECIMAL(10, 2) NOT NULL DEFAULT 10, -- Oynanan Miktar (TL)
    potential_win DECIMAL(10, 2) NOT NULL, -- Olası Kazanç (TL)
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'won', 'lost'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Satır Seviyesi Güvenlik)
ALTER TABLE public.iddaa_saved_coupons ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Anyone can view saved coupons" ON public.iddaa_saved_coupons
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own coupons" ON public.iddaa_saved_coupons
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coupons" ON public.iddaa_saved_coupons
    FOR UPDATE
    USING (auth.uid() = user_id);
