-- 1. PACKAGES (Abonelik Paketleri)
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_try DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL, -- Kaç günlük abonelik (örn: 7, 30, 365)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Varsayılan paketleri ekleyelim
INSERT INTO public.packages (name, description, price_try, duration_days)
VALUES 
('Haftalık Gold', '1 haftalık sınırsız formül hesaplama ve gelişmiş filtreler', 150.00, 7),
('Aylık Platinum', '1 aylık sınırsız formül hesaplama, Nesine oran analizleri ve gelişmiş filtreler', 450.00, 30),
('Sezonluk Vip', 'Tüm sezon boyunca sınırsız erişim ve özel kupon paylaşım grubu erişimi', 1900.00, 300)
ON CONFLICT DO NOTHING;

-- 2. PROFILES (Kullanıcı Profilleri)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SUBSCRIPTIONS (Abonelikler)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE RESTRICT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL, -- 'active', 'expired', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TRANSACTIONS (Ödeme İşlemleri)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_provider VARCHAR(50) DEFAULT 'paytr' NOT NULL, -- 'paytr', 'iyzico', 'mock'
    provider_tx_id VARCHAR(255), -- Ödeme kuruluşu işlem ID'si
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'success', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Row-Level Security (RLS) Ayarları
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Politikalar (Policies)
-- Herkes paketleri okuyabilir
CREATE POLICY "Packages are viewable by everyone" ON public.packages
    FOR SELECT USING (true);

-- Kullanıcılar sadece kendi profillerini görebilir ve güncelleyebilir
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Kullanıcılar sadece kendi aboneliklerini görebilir
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi ödemelerini görebilir
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Yeni Kullanıcı Kaydolduğunda Otomatik Profil Oluşturma Tetikleyicisi (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        new.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. SAVED COUPONS (Kaydedilen Kuponlar)
CREATE TABLE IF NOT EXISTS public.saved_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    round_id VARCHAR(100) NOT NULL,
    predictions JSONB NOT NULL, -- 15 maçlık tahmin dizisi: [["1"], ["X", "2"], ...]
    columns_count INTEGER NOT NULL,
    guarantee_level INTEGER NOT NULL,
    payout_tier_won INTEGER, -- 15, 14, 13, 12 veya NULL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saved_coupons ENABLE ROW LEVEL SECURITY;

-- Herkes kuponları listeleyebilir (Top 10 Liderlik tablosu için)
CREATE POLICY "Anyone can view saved coupons" ON public.saved_coupons
    FOR SELECT USING (true);

-- Giriş yapmış kullanıcılar kendi kuponlarını kaydedebilir
CREATE POLICY "Users can insert own saved coupons" ON public.saved_coupons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. NEWS & ANNOUNCEMENTS (Haberler ve Duyurular)
CREATE TABLE IF NOT EXISTS public.news_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    badge_text VARCHAR(100) DEFAULT 'DUYURU',
    button_text VARCHAR(100) DEFAULT 'İncele',
    button_action VARCHAR(255) DEFAULT 'modal:video', -- 'modal:video', 'tab:create', 'link:https...'
    bg_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.news_announcements ENABLE ROW LEVEL SECURITY;

-- Herkes aktif haberleri okuyabilir
CREATE POLICY "Anyone can view active news" ON public.news_announcements
    FOR SELECT USING (is_active = true OR auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- Sadece adminler haber ekleyip silebilir/güncelleyebilir
CREATE POLICY "Admins can manage news" ON public.news_announcements
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- Varsayılan ilk haberimizi (Eğitim Videosu) ekleyelim
INSERT INTO public.news_announcements (title, description, badge_text, button_text, button_action, bg_image_url, sort_order)
VALUES 
('ST FORMÜL SİHİRBAZI KILAVUZU', 'Spor Toto kupon maliyetlerinizi düşürmek için formül ve filtrelerin nasıl kullanılacağını adım adım öğrenin. 15, 14 ve 13 garanti sistemlerinin çalışma prensiplerini detaylı video eğitimimizi izleyerek hemen keşfedin.', 'Kılavuz & İpuçları', 'Eğitim Videosunu İzle', 'modal:video', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60', 1)
ON CONFLICT DO NOTHING;
