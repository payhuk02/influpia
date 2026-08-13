-- ============================================================
-- Subscription Tiers System (Freemium/Pro/Enterprise)
-- Comparable to Stripe/Shopify pricing tiers
-- ============================================================

-- 1. Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  price_yearly_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  features JSONB NOT NULL DEFAULT '{}', -- { "max_campaigns": 5, "max_influencers": 50, "ai_matching": true, "analytics": "basic" }
  limits JSONB NOT NULL DEFAULT '{}', -- { "campaigns_per_month": 5, "collaborations_per_month": 10, "api_calls_per_day": 1000 }
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO.public.subscription_plans (name, display_name, tier, price_monthly_cents, price_yearly_cents, features, limits, sort_order) VALUES
  ('free', 'Starter', 'free', 0, 0, 
   '{"max_campaigns": 3, "max_influencers": 20, "ai_matching": false, "analytics": "basic", "support": "email", "brand_safety": false}'::jsonb,
   '{"campaigns_per_month": 3, "collaborations_per_month": 5, "api_calls_per_day": 100}'::jsonb,
   1),
  ('pro', 'Professional', 'pro', 25000, 250000, -- 25,000 XOF/month, 250,000 XOF/year
   '{"max_campaigns": 50, "max_influencers": 500, "ai_matching": true, "analytics": "advanced", "support": "priority", "brand_safety": true, "custom_reports": true}'::jsonb,
   '{"campaigns_per_month": 50, "collaborations_per_month": 100, "api_calls_per_day": 10000}'::jsonb,
   2),
  ('enterprise', 'Enterprise', 'enterprise', 100000, 1000000, -- 100,000 XOF/month, 1,000,000 XOF/year
   '{"max_campaigns": -1, "max_influencers": -1, "ai_matching": true, "analytics": "enterprise", "support": "24/7", "brand_safety": true, "custom_reports": true, "dedicated_account_manager": true, "api_access": true, "white_label": false}'::jsonb,
   '{"campaigns_per_month": -1, "collaborations_per_month": -1, "api_calls_per_day": -1}'::jsonb,
   3)
ON CONFLICT (name) DO NOTHING;

-- 2. User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired', 'incomplete')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  usage_metrics JSONB DEFAULT '{}', -- Track usage against limits
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, status) WHERE status IN ('active', 'trialing')
);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_idx ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_idx ON public.user_subscriptions(stripe_subscription_id);

-- 3. Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  metric_name TEXT NOT NULL, -- 'campaigns_created', 'collaborations_started', 'api_calls'
  metric_value INTEGER NOT NULL DEFAULT 1,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usage_tracking_user_period_idx ON public.usage_tracking(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS usage_tracking_metric_idx ON public.usage_tracking(metric_name, period_start);

-- 4. Subscription History (for audit and analytics)
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  new_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  previous_status TEXT,
  new_status TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'cancel', 'renew', 'trial_start', 'trial_end')),
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_history_user_idx ON public.subscription_history(user_id, created_at DESC);

-- 5. Feature Flags per Subscription (for granular control)
CREATE TABLE IF NOT EXISTS public.subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  custom_limit INTEGER, -- Override default plan limit
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, feature_key)
);

CREATE INDEX IF NOT EXISTS subscription_features_subscription_idx ON public.subscription_features(subscription_id);

-- 6. Add-on Purchases (additional features outside plan)
CREATE TABLE IF NOT EXISTS public.add_on_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  add_on_type TEXT NOT NULL, -- 'extra_campaigns', 'extra_collaborations', 'brand_safety_report', 'custom_analytics'
  add_on_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS add_on_purchases_user_idx ON public.add_on_purchases(user_id, valid_until DESC);

-- RLS Policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_on_purchases ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Public read, admin write
CREATE POLICY "Public can read subscription plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Subscriptions: Users can view their own, admins can view all
CREATE POLICY "Users view own subscriptions" ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all subscriptions" ON public.user_subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions FOR ALL TO service_role WITH CHECK (true);

-- Usage Tracking: Users can view their own usage, admins can view all
CREATE POLICY "Users view own usage" ON public.usage_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all usage" ON public.usage_tracking FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert usage" ON public.usage_tracking FOR INSERT TO service_role WITH CHECK (true);

-- Subscription History: Users can view their own history, admins can view all
CREATE POLICY "Users view own subscription history" ON public.subscription_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all subscription history" ON public.subscription_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert history" ON public.subscription_history FOR INSERT TO service_role WITH CHECK (true);

-- Subscription Features: Users can view their features, admins can view all
CREATE POLICY "Users view own subscription features" ON public.subscription_features FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_subscriptions WHERE id = subscription_features.subscription_id AND user_id = auth.uid())
);
CREATE POLICY "Admins view all subscription features" ON public.subscription_features FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage features" ON public.subscription_features FOR ALL TO service_role WITH CHECK (true);

-- Add-on Purchases: Users can view their purchases, admins can view all
CREATE POLICY "Users view own add-ons" ON public.add_on_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all add-ons" ON public.add_on_purchases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage add-ons" ON public.add_on_purchases FOR ALL TO service_role WITH CHECK (true);

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id UUID, p_feature_key TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    LEFT JOIN public.subscription_features sf ON sf.subscription_id = us.id AND sf.feature_key = p_feature_key
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND (
      (sp.features->p_feature_key)::BOOLEAN = TRUE
      OR (sf.is_enabled = TRUE AND (sf.expires_at IS NULL OR sf.expires_at > NOW()))
    )
  );
$$;

-- Function to check usage against limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(p_user_id UUID, p_metric_name TEXT, p_increment INTEGER DEFAULT 1)
RETURNS TABLE (allowed BOOLEAN, current_usage INTEGER, limit INTEGER, remaining INTEGER) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_limit INTEGER;
  v_current INTEGER;
  v_allowed BOOLEAN;
BEGIN
  -- Get user's plan limit
  SELECT COALESCE(
    (sp.limits->p_metric_name)::INTEGER,
    (sf.custom_limit)
  ) INTO v_limit
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  LEFT JOIN public.subscription_features sf ON sf.subscription_id = us.id AND sf.feature_key = p_metric_name
  WHERE us.user_id = p_user_id
  AND us.status IN ('active', 'trialing')
  LIMIT 1;

  -- If limit is -1, unlimited
  IF v_limit = -1 OR v_limit IS NULL THEN
    RETURN QUERY SELECT true, 0, -1, -1;
    RETURN;
  END IF;

  -- Get current usage for this period
  SELECT COALESCE(SUM(metric_value), 0) INTO v_current
  FROM public.usage_tracking
  WHERE user_id = p_user_id
  AND metric_name = p_metric_name
  AND period_start <= CURRENT_DATE
  AND period_end >= CURRENT_DATE;

  -- Check if adding increment would exceed limit
  v_allowed := (v_current + p_increment) <= v_limit;

  RETURN QUERY SELECT v_allowed, v_current, v_limit, v_limit - v_current;
END;
$$;

-- Function to record usage
CREATE OR REPLACE FUNCTION public.record_usage(p_user_id UUID, p_metric_name TEXT, p_value INTEGER DEFAULT 1, p_metadata JSONB DEFAULT '{}')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_subscription_id UUID;
  v_period_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  v_period_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
  -- Get active subscription
  SELECT id INTO v_subscription_id
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
  AND status IN ('active', 'trialing')
  LIMIT 1;

  INSERT INTO public.usage_tracking (user_id, subscription_id, metric_name, metric_value, period_start, period_end, metadata)
  VALUES (p_user_id, v_subscription_id, p_metric_name, p_value, v_period_start, v_period_end, p_metadata);
END;
$$;

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.subscription_history (user_id, new_plan_id, new_status, change_type, metadata)
    VALUES (NEW.user_id, NEW.plan_id, NEW.status, 'trial_start', jsonb_build_object('stripe_subscription_id', NEW.stripe_subscription_id));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.plan_id != NEW.plan_id THEN
      INSERT INTO public.subscription_history (user_id, previous_plan_id, new_plan_id, change_type, metadata)
      VALUES (NEW.user_id, OLD.plan_id, NEW.plan_id, 
        CASE WHEN (SELECT tier FROM public.subscription_plans WHERE id = NEW.plan_id) > (SELECT tier FROM public.subscription_plans WHERE id = OLD.plan_id) THEN 'upgrade' ELSE 'downgrade' END,
        jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
    
    IF OLD.status != NEW.status THEN
      INSERT INTO public.subscription_history (user_id, previous_status, new_status, change_type, metadata)
      VALUES (NEW.user_id, OLD.status, NEW.status, 
        CASE NEW.status WHEN 'cancelled' THEN 'cancel' WHEN 'active' THEN 'renew' ELSE 'update' END,
        jsonb_build_object('plan_id', NEW.plan_id)
      );
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscription_change_log
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_subscription_change();

-- Function to automatically expire subscriptions
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET status = 'expired'
  WHERE status = 'active'
  AND current_period_end < NOW()
  AND cancel_at_period_end = FALSE;
  
  UPDATE public.user_subscriptions
  SET status = 'cancelled'
  WHERE status = 'active'
  AND current_period_end < NOW()
  AND cancel_at_period_end = TRUE;
END;
$$;

NOTIFY pgrst, 'reload schema';
