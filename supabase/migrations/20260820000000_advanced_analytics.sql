-- ============================================================
-- Advanced Analytics & ROI Tracking System
-- Comparable to HubSpot/Stripe Analytics
-- ============================================================

-- 1. Analytics Events Table (Event Tracking)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT,
  event_properties JSONB DEFAULT '{}',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  device_type TEXT,
  browser TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON public.analytics_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_properties_idx ON public.analytics_events USING GIN(event_properties);

-- 2. Campaign Performance Metrics
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  collaborations INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  total_spend_cents INTEGER DEFAULT 0,
  avg_cost_per_application_cents INTEGER DEFAULT 0,
  avg_cost_per_collaboration_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, metric_date)
);

CREATE INDEX IF NOT EXISTS campaign_metrics_campaign_idx ON public.campaign_metrics(campaign_id, metric_date DESC);

-- 3. Influencer Performance Metrics
CREATE TABLE IF NOT EXISTS public.influencer_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  profile_views INTEGER DEFAULT 0,
  marketplace_views INTEGER DEFAULT 0,
  applications_sent INTEGER DEFAULT 0,
  applications_accepted INTEGER DEFAULT 0,
  collaborations_completed INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0.00,
  acceptance_rate DECIMAL(5,2) DEFAULT 0.00,
  on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(influencer_id, metric_date)
);

CREATE INDEX IF NOT EXISTS influencer_metrics_influencer_idx ON public.influencer_metrics(influencer_id, metric_date DESC);

-- 4. ROI Tracking Table
CREATE TABLE IF NOT EXISTS public.roi_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  collaboration_id UUID REFERENCES public.collaborations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  investment_cents INTEGER NOT NULL,
  return_value_cents INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  conversion_value_cents INTEGER DEFAULT 0,
  attributed_sales_count INTEGER DEFAULT 0,
  attributed_revenue_cents INTEGER DEFAULT 0,
  roi_percentage DECIMAL(10,2) DEFAULT 0.00,
  cac_cents INTEGER DEFAULT 0,
  ltv_cents INTEGER DEFAULT 0,
  measurement_period_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS roi_tracking_campaign_idx ON public.roi_tracking(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS roi_tracking_brand_idx ON public.roi_tracking(brand_id, created_at DESC);

-- 5. Cohort Analysis Table
CREATE TABLE IF NOT EXISTS public.cohort_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_name TEXT NOT NULL,
  cohort_date DATE NOT NULL,
  cohort_size INTEGER NOT NULL,
  metric_type TEXT NOT NULL,
  period_0_value DECIMAL(10,2) DEFAULT 0.00,
  period_7_value DECIMAL(10,2) DEFAULT 0.00,
  period_14_value DECIMAL(10,2) DEFAULT 0.00,
  period_30_value DECIMAL(10,2) DEFAULT 0.00,
  period_60_value DECIMAL(10,2) DEFAULT 0.00,
  period_90_value DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cohort_analysis_date_idx ON public.cohort_analysis(cohort_date DESC);

-- 6. Funnel Tracking
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name TEXT NOT NULL,
  funnel_step TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  step_properties JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS funnel_events_funnel_idx ON public.funnel_events(funnel_name, completed_at DESC);
CREATE INDEX IF NOT EXISTS funnel_events_user_idx ON public.funnel_events(user_id, completed_at DESC);

-- RLS Policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Analytics Events: Users can view their own events, admins can view all
CREATE POLICY "Users view own analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert analytics events" ON public.analytics_events FOR INSERT TO service_role WITH CHECK (true);

-- Campaign Metrics: Brands can view their campaign metrics, admins can view all
CREATE POLICY "Brands view campaign metrics" ON public.campaign_metrics FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_metrics.campaign_id AND campaigns.brand_id = auth.uid())
);
CREATE POLICY "Admins view all campaign metrics" ON public.campaign_metrics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage campaign metrics" ON public.campaign_metrics FOR ALL TO service_role WITH CHECK (true);

-- Influencer Metrics: Influencers can view their own metrics, admins can view all
CREATE POLICY "Influencers view own metrics" ON public.influencer_metrics FOR SELECT TO authenticated USING (auth.uid() = influencer_id);
CREATE POLICY "Admins view all influencer metrics" ON public.influencer_metrics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage influencer metrics" ON public.influencer_metrics FOR ALL TO service_role WITH CHECK (true);

-- ROI Tracking: Brands can view their ROI, admins can view all
CREATE POLICY "Brands view ROI tracking" ON public.roi_tracking FOR SELECT TO authenticated USING (auth.uid() = brand_id);
CREATE POLICY "Admins view all ROI tracking" ON public.roi_tracking FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage ROI tracking" ON public.roi_tracking FOR ALL TO service_role WITH CHECK (true);

-- Cohort Analysis: Admins only
CREATE POLICY "Admins view cohort analysis" ON public.cohort_analysis FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage cohort analysis" ON public.cohort_analysis FOR ALL TO service_role WITH CHECK (true);

-- Funnel Events: Users can view their own funnel events, admins can view all
CREATE POLICY "Users view own funnel events" ON public.funnel_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all funnel events" ON public.funnel_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert funnel events" ON public.funnel_events FOR INSERT TO service_role WITH CHECK (true);

-- Function to calculate ROI
CREATE OR REPLACE FUNCTION public.calculate_roi(
  p_investment_cents INTEGER,
  p_return_value_cents INTEGER
) RETURNS DECIMAL(10,2) LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE 
    WHEN p_investment_cents = 0 THEN 0
    ELSE ROUND(((p_return_value_cents - p_investment_cents)::DECIMAL / p_investment_cents) * 100, 2)
  END;
$$;

-- Function to update ROI tracking
CREATE OR REPLACE FUNCTION public.update_roi_tracking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.roi_percentage := public.calculate_roi(NEW.investment_cents, NEW.return_value_cents);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER roi_tracking_update
  BEFORE INSERT OR UPDATE ON public.roi_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_roi_tracking();

-- Function to aggregate daily campaign metrics
CREATE OR REPLACE FUNCTION public.aggregate_campaign_metrics(p_campaign_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_views INTEGER := 0;
  v_clicks INTEGER := 0;
  v_applications INTEGER := 0;
  v_collaborations INTEGER := 0;
  v_spend INTEGER := 0;
BEGIN
  -- Count views from analytics events
  SELECT COUNT(*) INTO v_views
  FROM public.analytics_events
  WHERE event_type = 'campaign_view'
    AND event_properties->>'campaign_id' = p_campaign_id::TEXT
    AND DATE(created_at) = p_date;

  -- Count applications
  SELECT COUNT(*) INTO v_applications
  FROM public.campaign_applications
  WHERE campaign_id = p_campaign_id
    AND DATE(created_at) = p_date;

  -- Count collaborations
  SELECT COUNT(*) INTO v_collaborations
  FROM public.collaborations c
  JOIN public.campaign_applications ca ON c.application_id = ca.id
  WHERE ca.campaign_id = p_campaign_id
    AND DATE(c.created_at) = p_date;

  -- Sum spend from ROI tracking
  SELECT COALESCE(SUM(investment_cents), 0) INTO v_spend
  FROM public.roi_tracking
  WHERE campaign_id = p_campaign_id
    AND DATE(created_at) = p_date;

  INSERT INTO public.campaign_metrics (
    campaign_id, metric_date, views, applications, collaborations, total_spend_cents
  ) VALUES (
    p_campaign_id, p_date, v_views, v_applications, v_collaborations, v_spend
  )
  ON CONFLICT (campaign_id, metric_date) DO UPDATE SET
    views = EXCLUDED.views,
    applications = EXCLUDED.applications,
    collaborations = EXCLUDED.collaborations,
    total_spend_cents = EXCLUDED.total_spend_cents;
END;
$$;

NOTIFY pgrst, 'reload schema';
