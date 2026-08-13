-- ============================================================
-- Content Scheduling System
-- Comparable to Hootsuite/Buffer scheduling
-- ============================================================

-- 1. Scheduled Content Table
CREATE TABLE IF NOT EXISTS public.scheduled_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE,
  collaboration_id UUID REFERENCES public.collaborations(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'reel', 'video', 'image', 'carousel')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook')),
  title TEXT NOT NULL,
  caption TEXT,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Africa/Abidjan',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'cancelled', 'rescheduled')),
  post_id TEXT, -- ID of the actual post after publishing
  post_url TEXT,
  engagement_metrics JSONB DEFAULT '{}', -- { "likes": 0, "comments": 0, "shares": 0, "views": 0 }
  auto_post BOOLEAN DEFAULT FALSE, -- Whether to auto-post via API
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scheduled_content_influencer_idx ON public.scheduled_content(influencer_id, scheduled_for);
CREATE INDEX IF NOT EXISTS scheduled_content_collaboration_idx ON public.scheduled_content(collaboration_id);
CREATE INDEX IF NOT EXISTS scheduled_content_status_idx ON public.scheduled_content(status, scheduled_for);
CREATE INDEX IF NOT EXISTS scheduled_content_platform_idx ON public.scheduled_content(platform, scheduled_for);

-- 2. Content Calendar Table (visual calendar view)
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_date DATE NOT NULL,
  content_count INTEGER DEFAULT 0,
  platforms TEXT[] DEFAULT '{}',
  status_summary JSONB DEFAULT '{}', -- { "scheduled": 5, "posted": 3, "failed": 0 }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, calendar_date)
);

CREATE INDEX IF NOT EXISTS content_calendar_user_date_idx ON public.content_calendar(user_id, calendar_date DESC);

-- 3. Content Templates Table (reusable content templates)
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('post', 'story', 'reel', 'video')),
  platform TEXT NOT NULL,
  caption_template TEXT,
  hashtag_suggestions TEXT[] DEFAULT '{}',
  media_requirements JSONB DEFAULT '{}', -- { "aspect_ratio": "9:16", "min_duration": 15 }
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_templates_user_idx ON public.content_templates(user_id);
CREATE INDEX IF NOT EXISTS content_templates_public_idx ON public.content_templates(is_public) WHERE is_public = TRUE;

-- 4. Scheduling Rules Table (auto-scheduling based on best times)
CREATE TABLE IF NOT EXISTS public.scheduling_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  optimal_times TIME[] NOT NULL DEFAULT '{}', -- Array of optimal posting times
  min_interval_hours INTEGER DEFAULT 2, -- Minimum hours between posts
  max_posts_per_day INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scheduling_rules_user_idx ON public.scheduling_rules(user_id, is_active);

-- 5. Content Approval Workflow (for brands to approve scheduled content)
CREATE TABLE IF NOT EXISTS public.content_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_content_id UUID REFERENCES public.scheduled_content(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_for_approval_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  changes_requested TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_approvals_content_idx ON public.content_approvals(scheduled_content_id);
CREATE INDEX IF NOT EXISTS content_approvals_status_idx ON public.content_approvals(approval_status, created_at DESC);

-- 6. Content Analytics (per scheduled content)
CREATE TABLE IF NOT EXISTS public.content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_content_id UUID REFERENCES public.scheduled_content(id) ON DELETE CASCADE,
  snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0.0000,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_analytics_content_idx ON public.content_analytics(scheduled_content_id, snapshot_time DESC);

-- RLS Policies
ALTER TABLE public.scheduled_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- Scheduled Content: Influencers can manage their own scheduled content
CREATE POLICY "Influencers manage own scheduled content" ON public.scheduled_content FOR ALL TO authenticated USING (auth.uid() = influencer_id);
CREATE POLICY "Brands view scheduled content for their campaigns" ON public.scheduled_content FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = scheduled_content.campaign_id AND c.brand_id = auth.uid())
);
CREATE POLICY "Admins view all scheduled content" ON public.scheduled_content FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage scheduled content" ON public.scheduled_content FOR ALL TO service_role WITH CHECK (true);

-- Content Calendar: Users can view their own calendar
CREATE POLICY "Users view own content calendar" ON public.content_calendar FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage calendar" ON public.content_calendar FOR ALL TO service_role WITH CHECK (true);

-- Content Templates: Users can manage their own templates
CREATE POLICY "Users manage own content templates" ON public.content_templates FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public can view public templates" ON public.content_templates FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Admins view all templates" ON public.content_templates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Scheduling Rules: Users can manage their own rules
CREATE POLICY "Users manage own scheduling rules" ON public.scheduling_rules FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all scheduling rules" ON public.scheduling_rules FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Content Approvals: Users can view approvals they're involved in
CREATE POLICY "Users view content approvals" ON public.content_approvals FOR SELECT TO authenticated USING (
  requested_by = auth.uid() OR requested_for_approval_by = auth.uid() OR reviewed_by = auth.uid()
);
CREATE POLICY "Users create content approvals" ON public.content_approvals FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Users can approve content" ON public.content_approvals FOR UPDATE TO authenticated USING (requested_for_approval_by = auth.uid() OR reviewed_by = auth.uid());
CREATE POLICY "Service role can manage approvals" ON public.content_approvals FOR ALL TO service_role WITH CHECK (true);

-- Content Analytics: Users can view analytics for their content
CREATE POLICY "Users view own content analytics" ON public.content_analytics FOR SELECT TO authenticated USING (
  auth.uid() = (SELECT influencer_id FROM public.scheduled_content WHERE id = content_analytics.scheduled_content_id)
);
CREATE POLICY "Admins view all content analytics" ON public.content_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage analytics" ON public.content_analytics FOR ALL TO service_role WITH CHECK (true);

-- Function to schedule content
CREATE OR REPLACE FUNCTION public.schedule_content(
  p_influencer_id UUID,
  p_content_type TEXT,
  p_platform TEXT,
  p_title TEXT,
  p_caption TEXT,
  p_media_urls TEXT[],
  p_scheduled_for TIMESTAMPTZ,
  p_auto_post BOOLEAN DEFAULT FALSE
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_content_id UUID;
BEGIN
  INSERT INTO public.scheduled_content (
    influencer_id, content_type, platform, title, caption, 
    media_urls, scheduled_for, auto_post, status
  ) VALUES (
    p_influencer_id, p_content_type, p_platform, p_title, p_caption,
    p_media_urls, p_scheduled_for, p_auto_post, 'scheduled'
  )
  RETURNING id INTO v_content_id;
  
  -- Update content calendar
  INSERT INTO public.content_calendar (user_id, calendar_date, content_count, platforms, status_summary)
  VALUES (
    (SELECT id FROM auth.users WHERE id = p_influencer_id),
    DATE(p_scheduled_for),
    1,
    ARRAY[p_platform],
    jsonb_build_object('scheduled', 1)
  )
  ON CONFLICT (user_id, calendar_date) DO UPDATE SET
    content_count = content_calendar.content_count + 1,
    platforms = array_append(content_calendar.platforms, p_platform),
    status_summary = jsonb_set(
      content_calendar.status_summary,
      ARRAY['scheduled'],
      COALESCE((content_calendar.status_summary->>'scheduled')::INTEGER, 0) + 1
    );
  
  RETURN v_content_id;
END;
$$;

-- Function to find optimal posting time
CREATE OR REPLACE FUNCTION public.find_optimal_posting_time(p_user_id UUID, p_platform TEXT, p_preferred_date DATE DEFAULT CURRENT_DATE)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rule RECORD;
  v_optimal_time TIME;
  v_scheduled_for TIMESTAMPTZ;
BEGIN
  -- Get scheduling rules for this platform and day
  SELECT * INTO v_rule
  FROM public.scheduling_rules
  WHERE user_id = p_user_id
    AND platform = p_platform
    AND day_of_week = EXTRACT(DOW FROM p_preferred_date)
    AND is_active = TRUE
  LIMIT 1;
  
  IF FOUND AND array_length(v_rule.optimal_times, 1) > 0 THEN
    -- Return first optimal time
    v_optimal_time := v_rule.optimal_times[1];
    v_scheduled_for := p_preferred_date::TIMESTAMPTZ + v_optimal_time;
  ELSE
    -- Default to 10 AM if no rules
    v_scheduled_for := p_preferred_date::TIMESTAMPTZ + INTERVAL '10 hours';
  END IF;
  
  RETURN v_scheduled_for;
END;
$$;

-- Function to auto-schedule content based on best times
CREATE OR REPLACE FUNCTION public.auto_schedule_content(
  p_influencer_id UUID,
  p_content_type TEXT,
  p_platform TEXT,
  p_title TEXT,
  p_caption TEXT,
  p_media_urls TEXT[],
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_scheduled_for TIMESTAMPTZ;
  v_content_id UUID;
  v_user_id UUID;
BEGIN
  -- Get user_id from influencer
  SELECT id INTO v_user_id FROM auth.users WHERE id = p_influencer_id;
  
  -- Find optimal time
  v_scheduled_for := public.find_optimal_posting_time(v_user_id, p_platform, CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL);
  
  -- Schedule content
  v_content_id := public.schedule_content(
    p_influencer_id, p_content_type, p_platform, p_title, p_caption,
    p_media_urls, v_scheduled_for, TRUE
  );
  
  RETURN v_content_id;
END;
$$;

-- Function to mark content as posted
CREATE OR REPLACE FUNCTION public.mark_content_posted(p_scheduled_content_id UUID, p_post_id TEXT, p_post_url TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_content RECORD;
BEGIN
  -- Get content record
  SELECT * INTO v_content FROM public.scheduled_content WHERE id = p_scheduled_content_id;
  
  -- Update status
  UPDATE public.scheduled_content
  SET status = 'posted',
      post_id = p_post_id,
      post_url = p_post_url,
      updated_at = NOW()
  WHERE id = p_scheduled_content_id;
  
  -- Update content calendar
  UPDATE public.content_calendar
  SET status_summary = jsonb_set(
    status_summary,
    ARRAY['posted'],
    COALESCE((status_summary->>'posted')::INTEGER, 0) + 1
  ),
  status_summary = jsonb_set(
    status_summary,
    ARRAY['scheduled'],
    GREATEST((status_summary->>'scheduled')::INTEGER - 1, 0)
  )
  WHERE user_id = (SELECT id FROM auth.users WHERE id = v_content.influencer_id)
    AND calendar_date = DATE(v_content.scheduled_for);
END;
$$;

-- Function to capture content analytics snapshot
CREATE OR REPLACE FUNCTION public.capture_content_analytics(p_scheduled_content_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_analytics_id UUID;
BEGIN
  INSERT INTO public.content_analytics (scheduled_content_id, snapshot_time)
  VALUES (p_scheduled_content_id, NOW())
  RETURNING id INTO v_analytics_id;
  
  RETURN v_analytics_id;
END;
$$;

-- Function to request content approval
CREATE OR REPLACE FUNCTION public.request_content_approval(p_scheduled_content_id UUID, p_requested_for UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_approval_id UUID;
BEGIN
  INSERT INTO public.content_approvals (scheduled_content_id, requested_by, requested_for_approval_by)
  VALUES (p_scheduled_content_id, auth.uid(), p_requested_for)
  RETURNING id INTO v_approval_id;
  
  -- Update scheduled content status
  UPDATE public.scheduled_content
  SET status = 'rescheduled'
  WHERE id = p_scheduled_content_id;
  
  RETURN v_approval_id;
END;
$$;

-- Function to approve content
CREATE OR REPLACE FUNCTION public.approve_content(p_approval_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.content_approvals
  SET approval_status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = NOW(),
      review_notes = p_notes
  WHERE id = p_approval_id;
  
  -- Update scheduled content status back to scheduled
  UPDATE public.scheduled_content
  SET status = 'scheduled'
  WHERE id = (SELECT scheduled_content_id FROM public.content_approvals WHERE id = p_approval_id);
END;
$$;

-- Function to get content calendar for date range
CREATE OR REPLACE FUNCTION public.get_content_calendar(p_user_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  calendar_date DATE,
  content_count INTEGER,
  platforms TEXT[],
  scheduled INTEGER,
  posted INTEGER,
  failed INTEGER
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    cc.calendar_date,
    cc.content_count,
    cc.platforms,
    COALESCE((cc.status_summary->>'scheduled')::INTEGER, 0) as scheduled,
    COALESCE((cc.status_summary->>'posted')::INTEGER, 0) as posted,
    COALESCE((cc.status_summary->>'failed')::INTEGER, 0) as failed
  FROM public.content_calendar cc
  WHERE cc.user_id = p_user_id
    AND cc.calendar_date BETWEEN p_start_date AND p_end_date
  ORDER BY cc.calendar_date ASC;
$$;

NOTIFY pgrst, 'reload schema';
