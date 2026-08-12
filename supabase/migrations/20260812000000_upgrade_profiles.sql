-- Mise à jour Enterprise : Ajout de champs B2B, FedaPay/Moneyfusion et Analytics pour les profils.

-- 1. Ajout de champs pour les Marques (Brands)
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS brand_guidelines_url TEXT;

-- 2. Ajout de champs pour les Influenceurs (Influencers)
ALTER TABLE public.influencers
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS fedapay_account_id TEXT,
ADD COLUMN IF NOT EXISTS moneyfusion_account_id TEXT,
ADD COLUMN IF NOT EXISTS audience_demographics JSONB;

-- 3. Ajout de la vérification sociale
ALTER TABLE public.social_accounts
ADD COLUMN IF NOT EXISTS is_social_verified BOOLEAN DEFAULT false;

-- (Optionnel) Notification au backend des changements de structure
NOTIFY pgrst, 'reload schema';
