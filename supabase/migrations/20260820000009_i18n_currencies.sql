-- ============================================================
-- Multi-Currency & Multi-Language Support (i18n)
-- Comparable to Shopify/Stripe internationalization
-- ============================================================

-- 1. Supported Currencies Table
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- ISO 4217 code (USD, EUR, XOF, etc.)
  name TEXT NOT NULL,
  symbol TEXT NOT NULL, -- $, €, CFA
  symbol_position TEXT NOT NULL DEFAULT 'before' CHECK (symbol_position IN ('before', 'after')),
  decimal_places INTEGER NOT NULL DEFAULT 2,
  thousands_separator TEXT DEFAULT ',',
  decimal_separator TEXT DEFAULT '.',
  exchange_rate_to_base DECIMAL(15,6) NOT NULL DEFAULT 1.0, -- Rate to base currency (XOF)
  is_active BOOLEAN DEFAULT TRUE,
  is_base BOOLEAN DEFAULT FALSE, -- Only one base currency
  supported_by_payment_providers TEXT[] DEFAULT '{}', -- ['fedapay', 'stripe', 'moneyfusion']
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default currencies (XOF as base for West Africa)
INSERT INTO public.currencies (code, name, symbol, symbol_position, decimal_places, exchange_rate_to_base, is_base, supported_by_payment_providers) VALUES
  ('XOF', 'West African CFA Franc', 'CFA', 'after', 0, 1.0, TRUE, ARRAY['fedapay', 'moneyfusion']),
  ('USD', 'US Dollar', '$', 'before', 2, 0.0016, FALSE, ARRAY['stripe']),
  ('EUR', 'Euro', '€', 'before', 2, 0.0015, FALSE, ARRAY['stripe', 'fedapay']),
  ('GBP', 'British Pound', '£', 'before', 2, 0.0013, FALSE, ARRAY['stripe']),
  ('CAD', 'Canadian Dollar', 'C$', 'before', 2, 0.0022, FALSE, ARRAY['stripe']),
  ('NGN', 'Nigerian Naira', '₦', 'before', 2, 0.0020, FALSE, ARRAY['flutterwave', 'paystack']),
  ('KES', 'Kenyan Shilling', 'KSh', 'before', 2, 0.013, FALSE, ARRAY['mpesa', 'flutterwave'])
ON CONFLICT (code) DO NOTHING;

-- 2. Supported Languages Table
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- ISO 639-1 code (en, fr, es, etc.)
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  rtl BOOLEAN DEFAULT FALSE, -- Right-to-left languages
  flag_emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default languages
INSERT INTO public.languages (code, name, native_name, is_default, flag_emoji) VALUES
  ('fr', 'French', 'Français', TRUE, '🇫🇷'),
  ('en', 'English', 'English', FALSE, '🇬🇧'),
  ('es', 'Spanish', 'Español', FALSE, '🇪🇸'),
  ('pt', 'Portuguese', 'Português', FALSE, '🇵🇹'),
  ('ar', 'Arabic', 'العربية', FALSE, '🇸🇦'),
  ('de', 'German', 'Deutsch', FALSE, '🇩🇪')
ON CONFLICT (code) DO NOTHING;

-- 3. Translations Table
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  key TEXT NOT NULL, -- Translation key (e.g., 'nav.home', 'campaigns.create')
  value TEXT NOT NULL,
  context TEXT, -- Context for disambiguation
  pluralization JSONB DEFAULT '{}', -- { "one": "...", "other": "..." }
  is_verified BOOLEAN DEFAULT FALSE,
  translated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(language_code, key, context)
);

CREATE INDEX IF NOT EXISTS translations_language_idx ON public.translations(language_code);
CREATE INDEX IF NOT EXISTS translations_key_idx ON public.translations(key);

-- Insert default French translations
INSERT INTO public.translations (language_code, key, value) VALUES
  ('fr', 'nav.home', 'Accueil'),
  ('fr', 'nav.campaigns', 'Campagnes'),
  ('fr', 'nav.influencers', 'Influenceurs'),
  ('fr', 'nav.analytics', 'Analytiques'),
  ('fr', 'nav.settings', 'Paramètres'),
  ('fr', 'campaigns.create', 'Créer une campagne'),
  ('fr', 'campaigns.title', 'Titre de la campagne'),
  ('fr', 'campaigns.budget', 'Budget'),
  ('fr', 'campaigns.status.draft', 'Brouillon'),
  ('fr', 'campaigns.status.active', 'Active'),
  ('fr', 'campaigns.status.closed', 'Fermée'),
  ('fr', 'collaborations.status.in_progress', 'En cours'),
  ('fr', 'collaborations.status.submitted', 'Soumis'),
  ('fr', 'collaborations.status.approved', 'Approuvé'),
  ('fr', 'collaborations.status.paid', 'Payé'),
  ('fr', 'common.save', 'Enregistrer'),
  ('fr', 'common.cancel', 'Annuler'),
  ('fr', 'common.delete', 'Supprimer'),
  ('fr', 'common.edit', 'Modifier'),
  ('fr', 'common.submit', 'Soumettre')
ON CONFLICT (language_code, key, context) DO NOTHING;

-- Insert default English translations
INSERT INTO public.translations (language_code, key, value) VALUES
  ('en', 'nav.home', 'Home'),
  ('en', 'nav.campaigns', 'Campaigns'),
  ('en', 'nav.influencers', 'Influencers'),
  ('en', 'nav.analytics', 'Analytics'),
  ('en', 'nav.settings', 'Settings'),
  ('en', 'campaigns.create', 'Create Campaign'),
  ('en', 'campaigns.title', 'Campaign Title'),
  ('en', 'campaigns.budget', 'Budget'),
  ('en', 'campaigns.status.draft', 'Draft'),
  ('en', 'campaigns.status.active', 'Active'),
  ('en', 'campaigns.status.closed', 'Closed'),
  ('en', 'collaborations.status.in_progress', 'In Progress'),
  ('en', 'collaborations.status.submitted', 'Submitted'),
  ('en', 'collaborations.status.approved', 'Approved'),
  ('en', 'collaborations.status.paid', 'Paid'),
  ('en', 'common.save', 'Save'),
  ('en', 'common.cancel', 'Cancel'),
  ('en', 'common.delete', 'Delete'),
  ('en', 'common.edit', 'Edit'),
  ('en', 'common.submit', 'Submit')
ON CONFLICT (language_code, key, context) DO NOTHING;

-- 4. User Preferences Table (for language/currency selection)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language_code TEXT REFERENCES public.languages(code) ON DELETE SET NULL,
  preferred_currency_code TEXT REFERENCES public.currencies(code) ON DELETE SET NULL,
  timezone TEXT DEFAULT 'Africa/Abidjan',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  time_format TEXT DEFAULT '24h', -- '12h' or '24h'
  first_day_of_week INTEGER DEFAULT 1, -- 1 = Monday, 0 = Sunday
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_preferences_language_idx ON public.user_preferences(preferred_language_code);
CREATE INDEX IF NOT EXISTS user_preferences_currency_idx ON public.user_preferences(preferred_currency_code);

-- 5. Currency Exchange Rates History (for analytics)
CREATE TABLE IF NOT EXISTS public.exchange_rates_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency_code TEXT NOT NULL REFERENCES public.currencies(code) ON DELETE CASCADE,
  to_currency_code TEXT NOT NULL REFERENCES public.currencies(code) ON DELETE CASCADE,
  rate DECIMAL(15,6) NOT NULL,
  rate_date DATE NOT NULL,
  source TEXT DEFAULT 'manual', -- 'manual', 'api', 'scheduled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_currency_code, to_currency_code, rate_date)
);

CREATE INDEX IF NOT EXISTS exchange_rates_history_date_idx ON public.exchange_rates_history(rate_date DESC);
CREATE INDEX IF NOT EXISTS exchange_rates_history_pair_idx ON public.exchange_rates_history(from_currency_code, to_currency_code, rate_date DESC);

-- 6. Regional Settings Table (country-specific defaults)
CREATE TABLE IF NOT EXISTS public.regional_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL UNIQUE, -- ISO 3166-1 alpha-2
  country_name TEXT NOT NULL,
  default_currency_code TEXT REFERENCES public.currencies(code) ON DELETE SET NULL,
  default_language_code TEXT REFERENCES public.languages(code) ON DELETE SET NULL,
  default_timezone TEXT,
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  vat_enabled BOOLEAN DEFAULT FALSE,
  payment_methods TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default regional settings
INSERT INTO public.regional_settings (country_code, country_name, default_currency_code, default_language_code, default_timezone, tax_rate, vat_enabled) VALUES
  ('FR', 'France', 'EUR', 'fr', 'Europe/Paris', 0.2000, TRUE),
  ('CI', 'Côte d''Ivoire', 'XOF', 'fr', 'Africa/Abidjan', 0.0000, FALSE),
  ('SN', 'Sénégal', 'XOF', 'fr', 'Africa/Dakar', 0.0000, FALSE),
  ('ML', 'Mali', 'XOF', 'fr', 'Africa/Bamako', 0.0000, FALSE),
  ('US', 'United States', 'USD', 'en', 'America/New_York', 0.0000, FALSE),
  ('GB', 'United Kingdom', 'GBP', 'en', 'Europe/London', 0.2000, TRUE),
  ('DE', 'Germany', 'EUR', 'de', 'Europe/Berlin', 0.1900, TRUE)
ON CONFLICT (country_code) DO NOTHING;

-- RLS Policies
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_settings ENABLE ROW LEVEL SECURITY;

-- Currencies: Public read active, admin write
CREATE POLICY "Public read active currencies" ON public.currencies FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage currencies" ON public.currencies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Languages: Public read active, admin write
CREATE POLICY "Public read active languages" ON public.languages FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage languages" ON public.languages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Translations: Public read, admins and translators can write
CREATE POLICY "Public read translations" ON public.translations FOR SELECT USING (true);
CREATE POLICY "Admins manage translations" ON public.translations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Translators can update translations" ON public.translations FOR UPDATE TO authenticated USING (translated_by = auth.uid());

-- User Preferences: Users can manage their own preferences
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage preferences" ON public.user_preferences FOR ALL TO service_role WITH CHECK (true);

-- Exchange Rates History: Public read, admin write
CREATE POLICY "Public read exchange rates" ON public.exchange_rates_history FOR SELECT USING (true);
CREATE POLICY "Admins manage exchange rates" ON public.exchange_rates_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Regional Settings: Public read, admin write
CREATE POLICY "Public read regional settings" ON public.regional_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage regional settings" ON public.regional_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to format currency
CREATE OR REPLACE FUNCTION public.format_currency(p_amount_cents INTEGER, p_currency_code TEXT DEFAULT 'XOF')
RETURNS TEXT LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    CASE 
      WHEN c.symbol_position = 'before' 
      THEN c.symbol || ' ' || TO_CHAR(p_amount_cents::DECIMAL / POWER(10, c.decimal_places), 
        'FM999' || CASE WHEN c.decimal_places > 0 THEN 'D' || REPEAT('9', c.decimal_places) ELSE '' END)
      ELSE TO_CHAR(p_amount_cents::DECIMAL / POWER(10, c.decimal_places), 
        'FM999' || CASE WHEN c.decimal_places > 0 THEN 'D' || REPEAT('9', c.decimal_places) ELSE '' END) || ' ' || c.symbol
    END
  FROM public.currencies c
  WHERE c.code = p_currency_code AND c.is_active = TRUE;
$$;

-- Function to convert currency
CREATE OR REPLACE FUNCTION public.convert_currency(p_amount_cents INTEGER, p_from_currency TEXT, p_to_currency TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ROUND(
    (p_amount_cents::DECIMAL * 
     (SELECT exchange_rate_to_base FROM public.currencies WHERE code = p_from_currency) /
     (SELECT exchange_rate_to_base FROM public.currencies WHERE code = p_to_currency)
    )::NUMERIC, 0
  )::INTEGER;
$$;

-- Function to get translation
CREATE OR REPLACE FUNCTION public.get_translation(p_key TEXT, p_language_code TEXT DEFAULT 'fr', p_context TEXT DEFAULT NULL)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT value FROM public.translations 
     WHERE key = p_key AND language_code = p_language_code 
     AND (context = p_context OR context IS NULL)
     ORDER BY CASE WHEN context = p_context THEN 0 ELSE 1 END LIMIT 1),
    (SELECT value FROM public.translations 
     WHERE key = p_key AND language_code = (SELECT code FROM public.languages WHERE is_default = TRUE)
     LIMIT 1),
    p_key
  );
$$;

-- Function to update exchange rates
CREATE OR REPLACE FUNCTION public.update_exchange_rate(p_from_currency TEXT, p_to_currency TEXT, p_rate DECIMAL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Update current rate in currencies table
  UPDATE public.currencies
  SET exchange_rate_to_base = p_rate,
      updated_at = NOW()
  WHERE code = p_from_currency;
  
  -- Log in history
  INSERT INTO public.exchange_rates_history (from_currency_code, to_currency_code, rate, rate_date)
  VALUES (p_from_currency, p_to_currency, p_rate, CURRENT_DATE)
  ON CONFLICT (from_currency_code, to_currency_code, rate_date) DO UPDATE SET
    rate = EXCLUDED.rate;
END;
$$;

-- Function to get user's regional settings
CREATE OR REPLACE FUNCTION public.get_user_regional_settings(p_user_id UUID)
RETURNS TABLE (currency_code TEXT, language_code TEXT, timezone TEXT, date_format TEXT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    COALESCE(up.preferred_currency_code, rs.default_currency_code, 'XOF') as currency_code,
    COALESCE(up.preferred_language_code, rs.default_language_code, 'fr') as language_code,
    COALESCE(up.timezone, rs.default_timezone, 'Africa/Abidjan') as timezone,
    COALESCE(up.date_format, rs.date_format, 'DD/MM/YYYY') as date_format
  FROM public.user_preferences up
  CROSS JOIN LATERAL (
    SELECT * FROM public.regional_settings 
    WHERE country_code = 'CI' -- Default to Ivory Coast
    LIMIT 1
  ) rs
  WHERE up.user_id = p_user_id
  UNION ALL
  SELECT 
    rs.default_currency_code,
    rs.default_language_code,
    rs.default_timezone,
    rs.date_format
  FROM public.regional_settings rs
  WHERE rs.country_code = 'CI'
  LIMIT 1;
$$;

NOTIFY pgrst, 'reload schema';
