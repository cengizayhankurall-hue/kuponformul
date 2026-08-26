-- Supabase RLS Fix for Iddaa Saved Coupons
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

ALTER TABLE public.iddaa_saved_coupons ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for everyone
DROP POLICY IF EXISTS "Anyone can view saved coupons" ON public.iddaa_saved_coupons;
CREATE POLICY "Anyone can view saved coupons" ON public.iddaa_saved_coupons
    FOR SELECT USING (true);

-- Allow INSERT for everyone / authenticated
DROP POLICY IF EXISTS "Users can insert their own coupons" ON public.iddaa_saved_coupons;
CREATE POLICY "Anyone can insert coupons" ON public.iddaa_saved_coupons
    FOR INSERT WITH CHECK (true);

-- Allow UPDATE for everyone (required for status calculation background & client sync)
DROP POLICY IF EXISTS "Users can update their own coupons" ON public.iddaa_saved_coupons;
DROP POLICY IF EXISTS "Anyone can update iddaa coupons" ON public.iddaa_saved_coupons;
CREATE POLICY "Anyone can update iddaa coupons" ON public.iddaa_saved_coupons
    FOR UPDATE USING (true) WITH CHECK (true);

-- Allow DELETE for everyone
DROP POLICY IF EXISTS "Anyone can delete iddaa coupons" ON public.iddaa_saved_coupons;
CREATE POLICY "Anyone can delete iddaa coupons" ON public.iddaa_saved_coupons
    FOR DELETE USING (true);
