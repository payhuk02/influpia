-- 1. Create the platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fedapay_public_key TEXT,
    fedapay_secret_key TEXT,
    moneyfusion_api_key TEXT,
    platform_commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert the single default row
INSERT INTO public.platform_settings (id, platform_commission_rate)
VALUES ('00000000-0000-0000-0000-000000000000', 10.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 4. Admins can view settings
DROP POLICY IF EXISTS "Admins can view platform settings" ON public.platform_settings;
CREATE POLICY "Admins can view platform settings" 
ON public.platform_settings FOR SELECT 
USING (public.is_admin());

-- 5. Admins can update settings
DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings" 
ON public.platform_settings FOR UPDATE 
USING (public.is_admin());

-- (Optionnel) Notification au backend des changements de structure
NOTIFY pgrst, 'reload schema';
