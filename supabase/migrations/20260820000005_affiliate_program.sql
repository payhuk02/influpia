-- ============================================================
-- Affiliate/Referral Program with Multi-Tier Commissions
-- Comparable to Stripe/Shopify affiliate systems
-- ============================================================

-- 1. Affiliate Programs Table
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed', 'hybrid')),
  commission_rate DECIMAL(5,4) DEFAULT 0.1000, -- 10%
  fixed_amount_cents INTEGER DEFAULT 0,
  cookie_duration_days INTEGER DEFAULT 30,
  payout_threshold_cents INTEGER DEFAULT 5000, -- Minimum payout amount
  payout_frequency TEXT DEFAULT 'monthly' CHECK (payout_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  is_tiered BOOLEAN DEFAULT FALSE,
  max_tiers INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default affiliate program
INSERT INTO public.affiliate_programs (name, description, commission_type, commission_rate, cookie_duration_days, payout_threshold_cents) VALUES
  ('Standard Referral Program', 'Programme de parrainage standard pour Influpia', 'percentage', 0.1000, 30, 5000)
ON CONFLICT DO NOTHING;

-- 2. Affiliate Users Table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.affiliate_programs(id) ON DELETE RESTRICT,
  affiliate_code TEXT UNIQUE NOT NULL, -- Unique referral code
  tier INTEGER DEFAULT 1,
  parent_affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL, -- For multi-tier
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspended_reason TEXT,
  total_earnings_cents INTEGER DEFAULT 0,
  total_payouts_cents INTEGER DEFAULT 0,
  current_balance_cents INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  active_referral_count INTEGER DEFAULT 0,
  payout_method TEXT,
  payout_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliates_user_idx ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS affiliates_code_idx ON public.affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS affiliates_tier_idx ON public.affiliates(tier, status);
CREATE INDEX IF NOT EXISTS affiliates_parent_idx ON public.affiliates(parent_affiliate_id);

-- 3. Referral Clicks/Tracking Table
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  conversion_value_cents INTEGER DEFAULT 0,
  is_converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_clicks_affiliate_idx ON public.referral_clicks(affiliate_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS referral_clicks_code_idx ON public.referral_clicks(referral_code, clicked_at DESC);
CREATE INDEX IF NOT EXISTS referral_clicks_converted_idx ON public.referral_clicks(converted_user_id);

-- 4. Commissions Table
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_click_id UUID REFERENCES public.referral_clicks(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('signup', 'subscription', 'collaboration', 'campaign', 'custom')),
  commission_tier INTEGER DEFAULT 1,
  base_amount_cents INTEGER NOT NULL, -- Amount before commission
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'expired')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  payout_transaction_id TEXT,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS commissions_affiliate_idx ON public.commissions(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS commissions_status_idx ON public.commissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS commissions_referred_idx ON public.commissions(referred_user_id);

-- 5. Payouts Table
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_commissions_cents INTEGER NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER DEFAULT 0, -- Platform fee on payouts
  net_amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  payout_method TEXT,
  payout_details JSONB,
  payment_provider TEXT, -- 'fedapay', 'stripe', 'bank_transfer'
  provider_transaction_id TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_payouts_affiliate_idx ON public.affiliate_payouts(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_payouts_status_idx ON public.affiliate_payouts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_payouts_period_idx ON public.affiliate_payouts(payout_period_start, payout_period_end);

-- 6. Tier Rules (for multi-tier commissions)
CREATE TABLE IF NOT EXISTS public.affiliate_tier_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  tier_level INTEGER NOT NULL,
  tier_name TEXT NOT NULL,
  min_referrals INTEGER DEFAULT 0,
  min_revenue_cents INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,4) NOT NULL,
  parent_commission_rate DECIMAL(5,4) DEFAULT 0, -- Commission for parent affiliate
  benefits JSONB DEFAULT '{}', -- Additional benefits per tier
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_tier_rules_program_idx ON public.affiliate_tier_rules(program_id, tier_level);

-- Insert default tier rules
INSERT INTO public.affiliate_tier_rules (program_id, tier_level, tier_name, min_referrals, min_revenue_cents, commission_rate, parent_commission_rate) VALUES
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 1, 'Bronze', 0, 0, 0.1000, 0.0200),
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 2, 'Silver', 10, 100000, 0.1250, 0.0250),
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 3, 'Gold', 50, 500000, 0.1500, 0.0300)
ON CONFLICT DO NOTHING;

-- 7. Affiliate Performance Metrics
CREATE TABLE IF NOT EXISTS public.affiliate_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  commissions_earned_cents INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
  avg_order_value_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(affiliate_id, metric_date)
);

CREATE INDEX IF NOT EXISTS affiliate_metrics_affiliate_idx ON public.affiliate_metrics(affiliate_id, metric_date DESC);

-- RLS Policies
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_tier_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_metrics ENABLE ROW LEVEL SECURITY;

-- Affiliate Programs: Public read active, admin write
CREATE POLICY "Public read active affiliate programs" ON public.affiliate_programs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage affiliate programs" ON public.affiliate_programs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Affiliates: Users can view their own affiliate data
CREATE POLICY "Users view own affiliate data" ON public.affiliates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all affiliates" ON public.affiliates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create affiliate application" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update affiliates" ON public.affiliates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Referral Clicks: Service role only (tracking endpoint)
CREATE POLICY "Service role can insert referral clicks" ON public.referral_clicks FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Admins view all referral clicks" ON public.referral_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Commissions: Affiliates can view their own commissions
CREATE POLICY "Affiliates view own commissions" ON public.commissions FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM public.affiliates WHERE id = commissions.affiliate_id));
CREATE POLICY "Admins view all commissions" ON public.commissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage commissions" ON public.commissions FOR ALL TO service_role WITH CHECK (true);

-- Payouts: Affiliates can view their own payouts
CREATE POLICY "Affiliates view own payouts" ON public.affiliate_payouts FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM public.affiliates WHERE id = affiliate_payouts.affiliate_id));
CREATE POLICY "Admins view all payouts" ON public.affiliate_payouts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payouts" ON public.affiliate_payouts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tier Rules: Public read, admin write
CREATE POLICY "Public read tier rules" ON public.affiliate_tier_rules FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage tier rules" ON public.affiliate_tier_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Metrics: Affiliates can view their own metrics
CREATE POLICY "Affiliates view own metrics" ON public.affiliate_metrics FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM public.affiliates WHERE id = affiliate_metrics.affiliate_id));
CREATE POLICY "Admins view all metrics" ON public.affiliate_metrics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert metrics" ON public.affiliate_metrics FOR INSERT TO service_role WITH CHECK (true);

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(p_user_id UUID)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'INF' || UPPER(SUBSTRING(encode(gen_random_bytes(4), 'base64'), 1, 6));
$$;

-- Function to calculate commission based on tier
CREATE OR REPLACE FUNCTION public.calculate_commission(p_affiliate_id UUID, p_base_amount_cents INTEGER, p_commission_type TEXT)
RETURNS TABLE (commission_cents INTEGER, tier INTEGER, commission_rate DECIMAL) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_affiliate RECORD;
  v_tier_rule RECORD;
  v_commission_cents INTEGER;
BEGIN
  -- Get affiliate with tier
  SELECT a.*, p.commission_type, p.commission_rate as base_rate
  INTO v_affiliate
  FROM public.affiliates a
  JOIN public.affiliate_programs p ON a.program_id = p.id
  WHERE a.id = p_affiliate_id AND a.status = 'active';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 1, 0.0;
    RETURN;
  END IF;
  
  -- Get tier rule if program is tiered
  IF v_affiliate.is_tiered THEN
    SELECT * INTO v_tier_rule
    FROM public.affiliate_tier_rules
    WHERE program_id = v_affiliate.program_id
    AND tier_level = v_affiliate.tier
    AND is_active = TRUE
    LIMIT 1;
    
    IF FOUND THEN
      v_commission_cents := ROUND(p_base_amount_cents * v_tier_rule.commission_rate)::INTEGER;
      RETURN QUERY SELECT v_commission_cents, v_tier_rule.tier_level, v_tier_rule.commission_rate;
      RETURN;
    END IF;
  END IF;
  
  -- Use base rate
  v_commission_cents := ROUND(p_base_amount_cents * v_affiliate.base_rate)::INTEGER;
  RETURN QUERY SELECT v_commission_cents, v_affiliate.tier, v_affiliate.base_rate;
END;
$$;

-- Function to create commission
CREATE OR REPLACE FUNCTION public.create_commission(p_affiliate_id UUID, p_referred_user_id UUID, p_commission_type TEXT, p_base_amount_cents INTEGER, p_metadata JSONB DEFAULT '{}')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_commission RECORD;
  v_commission_id UUID;
BEGIN
  -- Calculate commission
  SELECT * INTO v_commission
  FROM public.calculate_commission(p_affiliate_id, p_base_amount_cents, p_commission_type);
  
  -- Create commission
  INSERT INTO public.commissions (
    affiliate_id, referred_user_id, commission_type, commission_tier,
    base_amount_cents, commission_rate, commission_amount_cents, metadata
  ) VALUES (
    p_affiliate_id, p_referred_user_id, p_commission_type, v_commission.tier,
    p_base_amount_cents, v_commission.commission_rate, v_commission.commission_cents, p_metadata
  )
  RETURNING id INTO v_commission_id;
  
  -- Update affiliate balance
  UPDATE public.affiliates
  SET current_balance_cents = current_balance_cents + v_commission.commission_cents,
      total_earnings_cents = total_earnings_cents + v_commission.commission_cents,
      updated_at = NOW()
  WHERE id = p_affiliate_id;
  
  RETURN v_commission_id;
END;
$$;

-- Function to check and upgrade affiliate tier
CREATE OR REPLACE FUNCTION public.check_affiliate_tier_upgrade(p_affiliate_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_affiliate RECORD;
  v_current_tier INTEGER;
  v_new_tier INTEGER;
  v_tier_rule RECORD;
BEGIN
  -- Get affiliate stats
  SELECT a.*, COALESCE(SUM(c.base_amount_cents), 0) as total_revenue
  INTO v_affiliate
  FROM public.affiliates a
  LEFT JOIN public.commissions c ON c.affiliate_id = a.id AND c.status IN ('approved', 'paid')
  WHERE a.id = p_affiliate_id
  GROUP BY a.id;
  
  v_current_tier := v_affiliate.tier;
  
  -- Check if eligible for higher tier
  FOR v_tier_rule IN
    SELECT * FROM public.affiliate_tier_rules
    WHERE program_id = v_affiliate.program_id
    AND is_active = TRUE
    AND tier_level > v_current_tier
    AND v_affiliate.referral_count >= min_referrals
    AND v_affiliate.total_revenue >= min_revenue_cents
    ORDER BY tier_level ASC
    LIMIT 1
  LOOP
    -- Upgrade tier
    UPDATE public.affiliates
    SET tier = v_tier_rule.tier_level,
        updated_at = NOW()
    WHERE id = p_affiliate_id;
    
    -- Notify affiliate (would trigger notification)
    EXIT;
  END LOOP;
END;
$$;

-- Function to process affiliate payout
CREATE OR REPLACE FUNCTION public.process_affiliate_payout(p_affiliate_id UUID, p_period_start DATE, p_period_end DATE)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_affiliate RECORD;
  v_total_commissions INTEGER;
  v_platform_fee INTEGER;
  v_net_amount INTEGER;
  v_payout_id UUID;
BEGIN
  -- Get affiliate
  SELECT * INTO v_affiliate
  FROM public.affiliates
  WHERE id = p_affiliate_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Affiliate not found or not active';
  END IF;
  
  -- Sum pending commissions for period
  SELECT COALESCE(SUM(commission_amount_cents), 0) INTO v_total_commissions
  FROM public.commissions
  WHERE affiliate_id = p_affiliate_id
  AND status = 'approved'
  AND created_at >= p_period_start
  AND created_at <= p_period_end;
  
  -- Check minimum threshold
  IF v_total_commissions < v_affiliate.payout_threshold_cents THEN
    RAISE EXCEPTION 'Amount below payout threshold';
  END IF;
  
  -- Calculate platform fee (5%)
  v_platform_fee := ROUND(v_total_commissions * 0.05)::INTEGER;
  v_net_amount := v_total_commissions - v_platform_fee;
  
  -- Create payout record
  INSERT INTO public.affiliate_payouts (
    affiliate_id, payout_period_start, payout_period_end,
    total_commissions_cents, platform_fee_cents, net_amount_cents, status
  ) VALUES (
    p_affiliate_id, p_period_start, p_period_end,
    v_total_commissions, v_platform_fee, v_net_amount, 'processing'
  )
  RETURNING id INTO v_payout_id;
  
  -- Update commissions as paid
  UPDATE public.commissions
  SET status = 'paid', paid_at = NOW(), payout_transaction_id = v_payout_id::TEXT
  WHERE affiliate_id = p_affiliate_id
  AND status = 'approved'
  AND created_at >= p_period_start
  AND created_at <= p_period_end;
  
  -- Update affiliate
  UPDATE public.affiliates
  SET current_balance_cents = current_balance_cents - v_total_commissions,
      total_payouts_cents = total_payouts_cents + v_total_commissions,
      updated_at = NOW()
  WHERE id = p_affiliate_id;
  
  RETURN v_payout_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
