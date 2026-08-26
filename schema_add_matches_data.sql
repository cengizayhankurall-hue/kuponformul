-- Supabase SQL Editor'a yapıştırıp çalıştırabileceğiniz SQL sorgusu:
-- saved_coupons tablosuna matches_data sütununu ekler (Kuponla birlikte 15 maçın takımlarını saklamak için)

ALTER TABLE public.saved_coupons ADD COLUMN IF NOT EXISTS matches_data JSONB;
