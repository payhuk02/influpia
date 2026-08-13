-- ============================================================
-- Advanced Reporting with PDF/Excel Exports
-- Comparable to HubSpot/Stripe reporting
-- ============================================================

-- 1. Report Templates Table
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('campaign_performance', 'influencer_analytics', 'financial_summary', 'collaboration_report', 'custom')),
  category TEXT CHECK (category IN ('marketing', 'sales', 'finance', 'operations', 'custom')),
  template_config JSONB NOT NULL DEFAULT '{}', -- { "columns": [...], "filters": [...], "group_by": [...] }
  is_system BOOLEAN DEFAULT FALSE, -- System templates cannot be deleted
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default report templates
INSERT INTO public.report_templates (name, display_name, description, report_type, category, template_config, is_system) VALUES
  ('campaign_performance_basic', 'Performance Campagne Basique', 'Rapport de performance des campagnes', 'campaign_performance', 'marketing',
   '{"columns": ["title", "status", "budget", "applications_count", "collaborations_count", "created_at"], "default_period": "30d"}'::jsonb, TRUE),
  ('influencer_analytics_detailed', 'Analytics Influenceur Détaillé', 'Rapport analytique complet des influenceurs', 'influencer_analytics', 'marketing',
   '{"columns": ["display_name", "followers_count", "engagement_rate", "collaborations_count", "average_rating", "total_earnings"], "default_period": "90d"}'::jsonb, TRUE),
  ('financial_summary_monthly', 'Résumé Financier Mensuel', 'Aperçu financier mensuel', 'financial_summary', 'finance',
   '{"columns": ["period", "total_revenue", "total_expenses", "net_profit", "roi_percentage"], "default_period": "1m"}'::jsonb, TRUE),
  ('collaboration_timeline', 'Timeline Collaborations', 'Historique des collaborations', 'collaboration_report', 'operations',
   '{"columns": ["campaign_title", "influencer_name", "status", "agreed_amount", "created_at", "completed_at"], "default_period": "90d"}'::jsonb, TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. Generated Reports Table
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}', -- { "period_start": "...", "period_end": "...", "filters": {...} }
  data JSONB NOT NULL DEFAULT '{}', -- Actual report data
  row_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  file_url TEXT, -- S3/Cloud Storage URL for PDF/Excel
  file_format TEXT CHECK (file_format IN ('pdf', 'xlsx', 'csv')),
  file_size_bytes INTEGER,
  generated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generated_reports_user_idx ON public.generated_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generated_reports_template_idx ON public.generated_reports(template_id);
CREATE INDEX IF NOT EXISTS generated_reports_status_idx ON public.generated_reports(status, created_at DESC);

-- 3. Scheduled Reports Table
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  report_name TEXT NOT NULL,
  schedule TEXT NOT NULL CHECK (schedule IN ('daily', 'weekly', 'monthly', 'quarterly')),
  schedule_config JSONB DEFAULT '{}', -- { "day_of_week": 1, "day_of_month": 1, "hour": 9 }
  parameters JSONB NOT NULL DEFAULT '{}',
  output_format TEXT NOT NULL DEFAULT 'pdf' CHECK (output_format IN ('pdf', 'xlsx', 'csv')),
  delivery_method TEXT NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'webhook', 'both')),
  recipients TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scheduled_reports_user_idx ON public.scheduled_reports(user_id, is_active);
CREATE INDEX IF NOT EXISTS scheduled_reports_next_run_idx ON public.scheduled_reports(next_run_at) WHERE is_active = TRUE;

-- 4. Report Sharing Table
CREATE TABLE IF NOT EXISTS public.report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_with UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  share_token TEXT UNIQUE, -- For public links
  share_type TEXT NOT NULL CHECK (share_type IN ('user', 'public_link', 'email')),
  permissions JSONB NOT NULL DEFAULT '{"view": true, "download": false}', -- { "view": true, "download": false }
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_shares_report_idx ON public.report_shares(report_id);
CREATE INDEX IF NOT EXISTS report_shares_token_idx ON public.report_shares(share_token) WHERE share_token IS NOT NULL;

-- 5. Report Favorites Table
CREATE TABLE IF NOT EXISTS public.report_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, report_id)
);

CREATE INDEX IF NOT EXISTS report_favorites_user_idx ON public.report_favorites(user_id);

-- RLS Policies
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_favorites ENABLE ROW LEVEL SECURITY;

-- Report Templates: Public read active, admin write
CREATE POLICY "Public read active report templates" ON public.report_templates FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage report templates" ON public.report_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Generated Reports: Users can view their own reports
CREATE POLICY "Users view own generated reports" ON public.generated_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all generated reports" ON public.generated_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage generated reports" ON public.generated_reports FOR ALL TO service_role WITH CHECK (true);

-- Scheduled Reports: Users can manage their own scheduled reports
CREATE POLICY "Users manage own scheduled reports" ON public.scheduled_reports FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all scheduled reports" ON public.scheduled_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can update scheduled reports" ON public.scheduled_reports FOR UPDATE TO service_role WITH CHECK (true);

-- Report Shares: Users can view shares they have access to
CREATE POLICY "Users view accessible report shares" ON public.report_shares FOR SELECT TO authenticated USING (
  shared_by = auth.uid() OR shared_with = auth.uid() OR share_token IS NOT NULL
);
CREATE POLICY "Users create report shares" ON public.report_shares FOR INSERT TO authenticated WITH CHECK (shared_by = auth.uid());
CREATE POLICY "Service role can manage shares" ON public.report_shares FOR ALL TO service_role WITH CHECK (true);

-- Report Favorites: Users can manage their own favorites
CREATE POLICY "Users manage own report favorites" ON public.report_favorites FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Function to generate campaign performance report
CREATE OR REPLACE FUNCTION public.generate_campaign_performance_report(p_user_id UUID, p_period_start DATE DEFAULT NULL, p_period_end DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_start_date DATE := COALESCE(p_period_start, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_period_end, CURRENT_DATE);
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'campaign_id', c.id,
      'title', c.title,
      'status', c.status,
      'budget_cents', c.budget,
      'applications_count', COALESCE(app_count, 0),
      'collaborations_count', COALESCE(collab_count, 0),
      'total_spend_cents', COALESCE(total_spend, 0),
      'created_at', c.created_at
    )
  ) INTO v_result
  FROM public.campaigns c
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as app_count
    FROM public.campaign_applications
    WHERE created_at >= v_start_date AND created_at <= v_end_date
    GROUP BY campaign_id
  ) apps ON apps.campaign_id = c.id
  LEFT JOIN (
    SELECT ca.campaign_id, COUNT(*) as collab_count, SUM(co.agreed_amount) as total_spend
    FROM public.collaborations co
    JOIN public.campaign_applications ca ON co.application_id = ca.id
    WHERE co.created_at >= v_start_date AND co.created_at <= v_end_date
    GROUP BY ca.campaign_id
  ) collabs ON collabs.campaign_id = c.id
  WHERE c.brand_id = p_user_id
    AND c.created_at >= v_start_date
    AND c.created_at <= v_end_date;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Function to generate financial summary report
CREATE OR REPLACE FUNCTION public.generate_financial_summary_report(p_user_id UUID, p_period_start DATE DEFAULT NULL, p_period_end DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_start_date DATE := COALESCE(p_period_start, DATE_TRUNC('month', CURRENT_DATE)::DATE);
  v_end_date DATE := COALESCE(p_period_end, CURRENT_DATE);
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'period_start', v_start_date,
    'period_end', v_end_date,
    'total_revenue_cents', COALESCE(SUM(agreed_amount), 0),
    'total_collaborations', COUNT(*),
    'avg_collaboration_value_cents', COALESCE(AVG(agreed_amount), 0),
    'completed_collaborations', COUNT(*) FILTER (WHERE status = 'paid'),
    'pending_collaborations', COUNT(*) FILTER (WHERE status IN ('in_progress', 'submitted', 'approved')),
    'by_status', jsonb_agg(jsonb_build_object('status', status, 'count', cnt))
  ) INTO v_result
  FROM (
    SELECT agreed_amount, status, COUNT(*) as cnt
    FROM public.collaborations
    WHERE (brand_id = p_user_id OR influencer_id = p_user_id)
      AND created_at >= v_start_date
      AND created_at <= v_end_date
    GROUP BY agreed_amount, status
  ) grouped_data;
  
  RETURN v_result;
END;
$$;

-- Function to create report
CREATE OR REPLACE FUNCTION public.create_report(p_user_id UUID, p_template_id UUID, p_parameters JSONB, p_report_name TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template RECORD;
  v_report_id UUID;
  v_report_data JSONB;
  v_report_name TEXT;
BEGIN
  -- Get template
  SELECT * INTO v_template FROM public.report_templates WHERE id = p_template_id AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Template not found or inactive'; END IF;
  
  -- Generate report name if not provided
  v_report_name := COALESCE(p_report_name, v_template.display_name || ' - ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH:MI'));
  
  -- Generate data based on report type
  IF v_template.report_type = 'campaign_performance' THEN
    v_report_data := public.generate_campaign_performance_report(p_user_id);
  ELSIF v_template.report_type = 'financial_summary' THEN
    v_report_data := public.generate_financial_summary_report(p_user_id);
  ELSE
    v_report_data := '{}'::jsonb;
  END IF;
  
  -- Create report record
  INSERT INTO public.generated_reports (
    user_id, template_id, report_name, report_type, parameters, data, 
    row_count, status, generated_at
  ) VALUES (
    p_user_id, p_template_id, v_report_name, v_template.report_type, p_parameters,
    v_report_data, jsonb_array_length(v_report_data), 'completed', NOW()
  )
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$;

-- Function to schedule report
CREATE OR REPLACE FUNCTION public.schedule_report(
  p_user_id UUID, 
  p_template_id UUID, 
  p_schedule TEXT, 
  p_parameters JSONB,
  p_recipients TEXT[]
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
  v_report_id UUID;
BEGIN
  -- Calculate next run time
  IF p_schedule = 'daily' THEN
    v_next_run := date_trunc('day', NOW() + INTERVAL '1 day') + INTERVAL '9 hours';
  ELSIF p_schedule = 'weekly' THEN
    v_next_run := date_trunc('week', NOW() + INTERVAL '1 week') + INTERVAL '1 day' + INTERVAL '9 hours';
  ELSIF p_schedule = 'monthly' THEN
    v_next_run := date_trunc('month', NOW() + INTERVAL '1 month') + INTERVAL '1 day' + INTERVAL '9 hours';
  ELSIF p_schedule = 'quarterly' THEN
    v_next_run := date_trunc('quarter', NOW() + INTERVAL '3 months') + INTERVAL '1 day' + INTERVAL '9 hours';
  ELSE
    v_next_run := NOW() + INTERVAL '1 day';
  END IF;
  
  INSERT INTO public.scheduled_reports (
    user_id, template_id, report_name, schedule, schedule_config, 
    parameters, recipients, next_run_at
  ) VALUES (
    p_user_id, p_template_id, 
    (SELECT display_name FROM public.report_templates WHERE id = p_template_id),
    p_schedule, '{}'::jsonb, p_parameters, p_recipients, v_next_run
  )
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$;

-- Function to process scheduled reports (called by cron job)
CREATE OR REPLACE FUNCTION public.process_scheduled_reports()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_scheduled_report RECORD;
  v_report_id UUID;
BEGIN
  FOR v_scheduled_report IN
    SELECT * FROM public.scheduled_reports
    WHERE is_active = TRUE
      AND next_run_at <= NOW()
  LOOP
    -- Generate report
    v_report_id := public.create_report(
      v_scheduled_report.user_id,
      v_scheduled_report.template_id,
      v_scheduled_report.parameters,
      v_scheduled_report.report_name
    );
    
    -- Update scheduled report
    UPDATE public.scheduled_reports
    SET last_run_at = NOW(),
        next_run_at = CASE schedule
          WHEN 'daily' THEN date_trunc('day', NOW() + INTERVAL '1 day') + INTERVAL '9 hours'
          WHEN 'weekly' THEN date_trunc('week', NOW() + INTERVAL '1 week') + INTERVAL '1 day' + INTERVAL '9 hours'
          WHEN 'monthly' THEN date_trunc('month', NOW() + INTERVAL '1 month') + INTERVAL '1 day' + INTERVAL '9 hours'
          WHEN 'quarterly' THEN date_trunc('quarter', NOW() + INTERVAL '3 months') + INTERVAL '1 day' + INTERVAL '9 hours'
          ELSE NOW() + INTERVAL '1 day'
        END
    WHERE id = v_scheduled_report.id;
    
    -- Here you would trigger email/webhook delivery
    -- This would call an external service to send the report
  END LOOP;
END;
$$;

-- Function to generate share token
CREATE OR REPLACE FUNCTION public.generate_report_share_token(p_report_id UUID, p_shared_by UUID, p_expires_hours INTEGER DEFAULT 168)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := REGEXP_REPLACE(v_token, '[^a-zA-Z0-9]', '', 'g');
  
  INSERT INTO public.report_shares (report_id, shared_by, share_token, share_type, expires_at)
  VALUES (p_report_id, p_shared_by, v_token, 'public_link', NOW() + (p_expires_hours || ' hours')::INTERVAL);
  
  RETURN v_token;
END;
$$;

NOTIFY pgrst, 'reload schema';
