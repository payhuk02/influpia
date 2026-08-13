-- ============================================================
-- Content Moderation System (Auto + Manual)
-- Comparable to YouTube/TikTok moderation systems
-- ============================================================

-- 1. Moderation Queue Table
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('campaign', 'influencer_profile', 'message', 'deliverable', 'review', 'comment')),
  content_id UUID NOT NULL,
  content_data JSONB NOT NULL DEFAULT '{}',
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'reviewing', 'approved', 'rejected', 'flagged', 'escalated')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  auto_moderation_result JSONB DEFAULT '{}',
  auto_moderation_score DECIMAL(5,4), -- 0.0 to 1.0 confidence
  auto_moderation_reason TEXT,
  manual_reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  manual_review_started_at TIMESTAMPTZ,
  manual_review_completed_at TIMESTAMPTZ,
  manual_moderation_action TEXT CHECK (manual_moderation_action IN ('approve', 'reject', 'request_changes', 'escalate')),
  manual_notes TEXT,
  rejection_reason TEXT,
  is_appealable BOOLEAN DEFAULT TRUE,
  appealed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appealed_at TIMESTAMPTZ,
  appeal_reason TEXT,
  appeal_status TEXT CHECK (appeal_status IN ('pending', 'under_review', 'approved', 'rejected')),
  appeal_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appeal_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS moderation_queue_status_idx ON public.moderation_queue(moderation_status, priority, created_at);
CREATE INDEX IF NOT EXISTS moderation_queue_content_idx ON public.moderation_queue(content_type, content_id);
CREATE INDEX IF NOT EXISTS moderation_queue_reviewer_idx ON public.moderation_queue(manual_reviewer_id, manual_review_started_at);

-- 2. Moderation Rules Table (Auto-moderation rules)
CREATE TABLE IF NOT EXISTS public.moderation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'ai_model', 'image_recognition', 'link_check', 'spam_detection')),
  content_types TEXT[] NOT NULL, -- ['campaign', 'message', 'deliverable']
  conditions JSONB NOT NULL DEFAULT '{}', -- { "keywords": ["spam", "scam"], "min_confidence": 0.8 }
  action TEXT NOT NULL CHECK (action IN ('flag', 'auto_reject', 'auto_approve', 'require_review')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default moderation rules
INSERT INTO public.moderation_rules (rule_name, rule_type, content_types, conditions, action, severity) VALUES
  ('Prohibited Keywords', 'keyword', ARRAY['campaign', 'message', 'deliverable'], 
   '{"keywords": ["scam", "fraud", "illegal", "hack", "pirate"], "match_type": "exact"}'::jsonb, 'flag', 'high'),
  ('Spam Detection', 'spam_detection', ARRAY['message', 'comment'],
   '{"max_repeated_chars": 10, "max_caps_ratio": 0.7, "min_length": 5}'::jsonb, 'flag', 'medium'),
  ('Link Safety Check', 'link_check', ARRAY['campaign', 'message'],
   '{"blocked_domains": ["malware.com", "phishing.net"], "require_https": true}'::jsonb, 'flag', 'high'),
  ('AI Content Safety', 'ai_model', ARRAY['campaign', 'deliverable'],
   '{"model": "content_safety", "min_confidence": 0.7, "categories": ["hate_speech", "violence", "sexual"]}'::jsonb, 'flag', 'critical')
ON CONFLICT (rule_name) DO NOTHING;

-- 3. Moderation Reports Table (for analytics)
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  content_type TEXT NOT NULL,
  total_submitted INTEGER DEFAULT 0,
  auto_approved INTEGER DEFAULT 0,
  auto_rejected INTEGER DEFAULT 0,
  manual_approved INTEGER DEFAULT 0,
  manual_rejected INTEGER DEFAULT 0,
  pending_review INTEGER DEFAULT 0,
  avg_review_time_minutes DECIMAL(10,2),
  top_rejection_reasons JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_date, content_type)
);

CREATE INDEX IF NOT EXISTS moderation_reports_date_idx ON public.moderation_reports(report_date DESC);

-- 4. Blocked Content Table (blacklist)
CREATE TABLE IF NOT EXISTS public.blocked_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('keyword', 'domain', 'phone', 'email', 'image_hash')),
  blocked_value TEXT NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_regex BOOLEAN DEFAULT FALSE,
  case_sensitive BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blocked_content_type_idx ON public.blocked_content(content_type, blocked_value);

-- Insert default blocked content
INSERT INTO public.blocked_content (content_type, blocked_value, reason) VALUES
  ('keyword', 'viagra', 'Spam'),
  ('keyword', 'casino', 'Gambling'),
  ('keyword', 'porn', 'Adult content'),
  ('domain', 'malware.com', 'Malware'),
  ('domain', 'phishing.net', 'Phishing')
ON CONFLICT DO NOTHING;

-- 5. User Moderation History (for repeat offenders)
CREATE TABLE IF NOT EXISTS public.user_moderation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  violation_count INTEGER DEFAULT 1,
  last_violation_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_status TEXT NOT NULL DEFAULT 'warning' CHECK (current_status IN ('clean', 'warning', 'probation', 'suspended', 'banned')),
  suspension_until TIMESTAMPTZ,
  ban_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_moderation_history_user_idx ON public.user_moderation_history(user_id, current_status);
CREATE INDEX IF NOT EXISTS user_moderation_history_status_idx ON public.user_moderation_history(current_status);

-- 6. Moderation Actions Log (audit trail)
CREATE TABLE IF NOT EXISTS public.moderation_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_queue_id UUID REFERENCES public.moderation_queue(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('auto_flagged', 'manual_review_started', 'approved', 'rejected', 'escalated', 'appealed', 'appeal_approved', 'appeal_rejected')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'moderator', 'admin', 'auto_moderation')),
  previous_status TEXT,
  new_status TEXT,
  action_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS moderation_actions_log_queue_idx ON public.moderation_actions_log(moderation_queue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_actions_log_actor_idx ON public.moderation_actions_log(actor_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_moderation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions_log ENABLE ROW LEVEL SECURITY;

-- Moderation Queue: Moderators and admins can view
CREATE POLICY "Moderators view moderation queue" ON public.moderation_queue FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'moderator')
);
CREATE POLICY "Users view own moderation status" ON public.moderation_queue FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c WHERE c.id = moderation_queue.content_id AND c.brand_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.influencers i WHERE i.id = moderation_queue.content_id AND i.id = auth.uid()
  )
);
CREATE POLICY "Moderators can update queue" ON public.moderation_queue FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'moderator')
);
CREATE POLICY "Service role can manage queue" ON public.moderation_queue FOR ALL TO service_role WITH CHECK (true);

-- Moderation Rules: Admins only
CREATE POLICY "Admins manage moderation rules" ON public.moderation_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Moderation Reports: Admins only
CREATE POLICY "Admins view moderation reports" ON public.moderation_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert reports" ON public.moderation_reports FOR INSERT TO service_role WITH CHECK (true);

-- Blocked Content: Admins only
CREATE POLICY "Admins manage blocked content" ON public.blocked_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Moderation History: Users can view their own history, admins can view all
CREATE POLICY "Users view own moderation history" ON public.user_moderation_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all moderation history" ON public.user_moderation_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage history" ON public.user_moderation_history FOR ALL TO service_role WITH CHECK (true);

-- Moderation Actions Log: Admins only
CREATE POLICY "Admins view moderation actions log" ON public.moderation_actions_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert actions log" ON public.moderation_actions_log FOR INSERT TO service_role WITH CHECK (true);

-- Function to submit content for moderation
CREATE OR REPLACE FUNCTION public.submit_for_moderation(p_content_type TEXT, p_content_id UUID, p_content_data JSONB, p_priority TEXT DEFAULT 'normal')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO public.moderation_queue (content_type, content_id, content_data, priority)
  VALUES (p_content_type, p_content_id, p_content_data, p_priority)
  RETURNING id INTO v_queue_id;
  
  -- Trigger auto-moderation
  PERFORM public.run_auto_moderation(v_queue_id);
  
  RETURN v_queue_id;
END;
$$;

-- Function to run auto-moderation
CREATE OR REPLACE FUNCTION public.run_auto_moderation(p_queue_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_queue RECORD;
  v_rule RECORD;
  v_flagged BOOLEAN := FALSE;
  v_rejection_reason TEXT := '';
  v_score DECIMAL(5,4) := 0.0;
BEGIN
  -- Get queue item
  SELECT * INTO v_queue FROM public.moderation_queue WHERE id = p_queue_id;
  
  -- Check against active rules
  FOR v_rule IN
    SELECT * FROM public.moderation_rules
    WHERE is_active = TRUE
    AND v_queue.content_type = ANY(content_types)
  LOOP
    -- Keyword check
    IF v_rule.rule_type = 'keyword' THEN
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(v_rule.conditions->'keywords') kw
        WHERE LOWER(v_queue.content_data->>'text') LIKE '%' || LOWER(kw) || '%'
      ) THEN
        v_flagged := TRUE;
        v_rejection_reason := 'Prohibited keyword detected';
        v_score := GREATEST(v_score, 0.9);
      END IF;
    END IF;
    
    -- Link check
    IF v_rule.rule_type = 'link_check' THEN
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(v_rule.conditions->'blocked_domains') bd
        WHERE (v_queue.content_data->>'url') LIKE '%' || bd || '%'
      ) THEN
        v_flagged := TRUE;
        v_rejection_reason := 'Blocked domain detected';
        v_score := GREATEST(v_score, 0.95);
      END IF;
    END IF;
    
    -- AI model check (placeholder - would call actual AI service)
    IF v_rule.rule_type = 'ai_model' THEN
      -- Simulated AI check
      IF (v_queue.content_data->>'text') ILIKE '%violence%' OR (v_queue.content_data->>'text') ILIKE '%hate%' THEN
        v_flagged := TRUE;
        v_rejection_reason := 'AI content safety flag';
        v_score := GREATEST(v_score, 0.85);
      END IF;
    END IF;
  END LOOP;
  
  -- Update queue with auto-moderation results
  IF v_flagged THEN
    UPDATE public.moderation_queue
    SET auto_moderation_result = jsonb_build_object('flagged', true, 'reason', v_rejection_reason),
        auto_moderation_score = v_score,
        auto_moderation_reason = v_rejection_reason,
        moderation_status = CASE WHEN v_score >= 0.9 THEN 'flagged' ELSE 'pending' END,
        priority = CASE WHEN v_score >= 0.9 THEN 'high' ELSE priority END,
        updated_at = NOW()
    WHERE id = p_queue_id;
    
    -- Log action
    INSERT INTO public.moderation_actions_log (moderation_queue_id, action_type, actor_type, new_status, action_details)
    VALUES (p_queue_id, 'auto_flagged', 'auto_moderation', 'flagged', jsonb_build_object('score', v_score, 'reason', v_rejection_reason));
  ELSE
    UPDATE public.moderation_queue
    SET auto_moderation_result = jsonb_build_object('flagged', false),
        auto_moderation_score = 0.0,
        moderation_status = 'approved',
        updated_at = NOW()
    WHERE id = p_queue_id;
    
    INSERT INTO public.moderation_actions_log (moderation_queue_id, action_type, actor_type, new_status, action_details)
    VALUES (p_queue_id, 'auto_flagged', 'auto_moderation', 'approved', jsonb_build_object('score', 0.0));
  END IF;
END;
$$;

-- Function to record user violation
CREATE OR REPLACE FUNCTION public.record_user_violation(p_user_id UUID, p_violation_type TEXT, p_severity TEXT DEFAULT 'medium')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_history RECORD;
  v_new_status TEXT;
BEGIN
  -- Get or create user moderation history
  INSERT INTO public.user_moderation_history (user_id, violation_type, current_status)
  VALUES (p_user_id, p_violation_type, 'warning')
  ON CONFLICT (user_id) DO UPDATE SET
    violation_count = user_moderation_history.violation_count + 1,
    last_violation_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO v_history;
  
  -- Determine new status based on violation count
  IF v_history.violation_count >= 5 THEN
    v_new_status := 'banned';
  ELSIF v_history.violation_count >= 3 THEN
    v_new_status := 'suspended';
    UPDATE public.user_moderation_history
    SET suspension_until = NOW() + INTEGER '7' * INTERVAL '1 day'
    WHERE id = v_history.id;
  ELSIF v_history.violation_count >= 2 THEN
    v_new_status := 'probation';
  ELSE
    v_new_status := 'warning';
  END IF;
  
  -- Update status
  UPDATE public.user_moderation_history
  SET current_status = v_new_status,
      updated_at = NOW()
  WHERE id = v_history.id;
  
  -- If banned, deactivate user
  IF v_new_status = 'banned' THEN
    UPDATE public.profiles
    SET kyc_status = 'rejected'
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- Function to generate daily moderation report
CREATE OR REPLACE FUNCTION public.generate_moderation_report(p_report_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.moderation_reports (
    report_date, content_type, total_submitted, auto_approved, auto_rejected,
    manual_approved, manual_rejected, pending_review, avg_review_time_minutes
  )
  SELECT 
    p_report_date,
    content_type,
    COUNT(*),
    COUNT(*) FILTER (WHERE moderation_status = 'approved' AND manual_reviewer_id IS NULL),
    COUNT(*) FILTER (WHERE moderation_status = 'rejected' AND manual_reviewer_id IS NULL),
    COUNT(*) FILTER (WHERE moderation_status = 'approved' AND manual_reviewer_id IS NOT NULL),
    COUNT(*) FILTER (WHERE moderation_status = 'rejected' AND manual_reviewer_id IS NOT NULL),
    COUNT(*) FILTER (WHERE moderation_status = 'pending'),
    AVG(EXTRACT(EPOCH FROM (manual_review_completed_at - manual_review_started_at)) / 60) FILTER (WHERE manual_review_completed_at IS NOT NULL)
  FROM public.moderation_queue
  WHERE DATE(created_at) = p_report_date
  GROUP BY content_type
  ON CONFLICT (report_date, content_type) DO UPDATE SET
    total_submitted = EXCLUDED.total_submitted,
    auto_approved = EXCLUDED.auto_approved,
    auto_rejected = EXCLUDED.auto_rejected,
    manual_approved = EXCLUDED.manual_approved,
    manual_rejected = EXCLUDED.manual_rejected,
    pending_review = EXCLUDED.pending_review,
    avg_review_time_minutes = EXCLUDED.avg_review_time_minutes;
END;
$$;

NOTIFY pgrst, 'reload schema';
