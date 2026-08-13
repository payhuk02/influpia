-- ============================================================
-- Dispute Resolution System
-- Comparable to Upwork/Amazon dispute handling
-- ============================================================

-- 1. Disputes Table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID REFERENCES public.collaborations(id) ON DELETE CASCADE,
  raised_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('quality', 'delivery', 'payment', 'communication', 'other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'mediating', 'resolved', 'escalated', 'closed')),
  resolution_type TEXT CHECK (resolution_type IN ('full_refund', 'partial_refund', 'no_refund', 'rework', 'compensation', 'cancelled')),
  evidence_urls TEXT[], -- Array of URLs to screenshots, contracts, etc.
  preferred_outcome TEXT,
  amount_in_dispute_cents INTEGER DEFAULT 0,
  admin_notes TEXT,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mediation_started_at TIMESTAMPTZ,
  mediation_ended_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS disputes_collaboration_idx ON public.disputes(collaboration_id);
CREATE INDEX IF NOT EXISTS disputes_raised_by_idx ON public.disputes(raised_by, created_at DESC);
CREATE INDEX IF NOT EXISTS disputes_status_idx ON public.disputes(status, created_at DESC);

-- 2. Dispute Messages (Communication during dispute)
CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal admin notes
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dispute_messages_dispute_idx ON public.dispute_messages(dispute_id, created_at ASC);

-- 3. Dispute Timeline (Audit trail for dispute lifecycle)
CREATE TABLE IF NOT EXISTS public.dispute_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL, -- 'brand', 'influencer', 'admin', 'system'
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dispute_timeline_dispute_idx ON public.dispute_timeline(dispute_id, created_at ASC);

-- 4. Escalation Rules
CREATE TABLE IF NOT EXISTS public.dispute_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL, -- 'time_based', 'severity_based', 'value_based'
  condition_value JSONB NOT NULL,
  escalation_action TEXT NOT NULL, -- 'assign_senior_admin', 'auto_refund', 'legal_review'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Refund Transactions
CREATE TABLE IF NOT EXISTS public.refund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES public.disputes(id) ON DELETE SET NULL,
  collaboration_id UUID REFERENCES public.collaborations(id) ON DELETE CASCADE,
  original_transaction_id TEXT,
  refund_amount_cents INTEGER NOT NULL,
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial', 'platform_fee_only')),
  refund_reason TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  refund_status TEXT NOT NULL DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_provider TEXT NOT NULL, -- 'fedapay', 'stripe', 'moneyfusion'
  provider_refund_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS refund_transactions_dispute_idx ON public.refund_transactions(dispute_id);
CREATE INDEX IF NOT EXISTS refund_transactions_status_idx ON public.refund_transactions(refund_status, created_at DESC);

-- RLS Policies
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;

-- Disputes: Participants can view their disputes, admins can view all
CREATE POLICY "Users view own disputes" ON public.disputes FOR SELECT TO authenticated USING (
  auth.uid() = raised_by OR
  EXISTS (
    SELECT 1 FROM public.collaborations c
    WHERE c.id = disputes.collaboration_id
    AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid())
  )
);
CREATE POLICY "Admins view all disputes" ON public.disputes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = raised_by AND
  EXISTS (
    SELECT 1 FROM public.collaborations c
    WHERE c.id = disputes.collaboration_id
    AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid())
  )
);
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Dispute Messages: Participants can view messages for their disputes
CREATE POLICY "Users view dispute messages" ON public.dispute_messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_messages.dispute_id
    AND (
      d.raised_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.collaborations c
        WHERE c.id = d.collaboration_id
        AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid())
      )
    )
  )
);
CREATE POLICY "Admins view all dispute messages" ON public.dispute_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants can add messages" ON public.dispute_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_messages.dispute_id
    AND (
      d.raised_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.collaborations c
        WHERE c.id = d.collaboration_id
        AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid())
      )
    )
  )
);
CREATE POLICY "Admins can add internal messages" ON public.dispute_messages FOR INSERT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') AND is_internal = TRUE
);

-- Dispute Timeline: Read-only for participants, admins can view all
CREATE POLICY "Users view dispute timeline" ON public.dispute_timeline FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_timeline.dispute_id
    AND (
      d.raised_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.collaborations c
        WHERE c.id = d.collaboration_id
        AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid())
      )
    )
  )
);
CREATE POLICY "Admins view all dispute timeline" ON public.dispute_timeline FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert timeline" ON public.dispute_timeline FOR INSERT TO service_role WITH CHECK (true);

-- Escalation Rules: Admins only
CREATE POLICY "Admins manage escalation rules" ON public.dispute_escalation_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Refund Transactions: Participants can view refunds for their disputes
CREATE POLICY "Users view refund transactions" ON public.refund_transactions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = refund_transactions.dispute_id
    AND (
      d.raised_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.collaborations c
        WHERE c.id = d.collaboration_id
        AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid())
      )
    )
  )
);
CREATE POLICY "Admins view all refund transactions" ON public.refund_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update refund transactions" ON public.refund_transactions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to automatically escalate disputes based on rules
CREATE OR REPLACE FUNCTION public.check_dispute_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rule RECORD;
BEGIN
  -- Check for time-based escalation (e.g., 7 days without resolution)
  IF NEW.status = 'open' AND AGE(NEW.created_at) > INTERVAL '7 days' THEN
    -- Escalate to under_review
    UPDATE public.disputes SET status = 'under_review' WHERE id = NEW.id;
    
    INSERT INTO public.dispute_timeline (dispute_id, action, actor_id, actor_type, previous_status, new_status, metadata)
    VALUES (NEW.id, 'auto_escalated', NULL, 'system', 'open', 'under_review', '{"reason": "7_days_no_resolution"}'::jsonb);
  END IF;
  
  -- Check for severity-based escalation
  IF NEW.severity = 'critical' AND NEW.status = 'open' THEN
    UPDATE public.disputes SET status = 'escalated' WHERE id = NEW.id;
    
    INSERT INTO public.dispute_timeline (dispute_id, action, actor_id, actor_type, previous_status, new_status, metadata)
    VALUES (NEW.id, 'auto_escalated', NULL, 'system', 'open', 'escalated', '{"reason": "critical_severity"}'::jsonb);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER dispute_escalation_check
  AFTER INSERT OR UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.check_dispute_escalation();

-- Function to log dispute status changes
CREATE OR REPLACE FUNCTION public.log_dispute_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dispute_timeline (dispute_id, action, actor_id, actor_type, new_status, metadata)
    VALUES (NEW.id, 'dispute_created', NEW.raised_by, 'user', NEW.status, 
      jsonb_build_object('dispute_type', NEW.dispute_type, 'severity', NEW.severity));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.dispute_timeline (dispute_id, action, actor_id, actor_type, previous_status, new_status, metadata)
    VALUES (NEW.id, 'status_changed', NEW.admin_id, 'admin', OLD.status, NEW.status, 
      jsonb_build_object('resolution_type', NEW.resolution_type));
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER dispute_status_change_log
  BEFORE INSERT OR UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.log_dispute_status_change();

-- Function to calculate platform fee on refund
CREATE OR REPLACE FUNCTION public.calculate_platform_fee(p_amount_cents INTEGER)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT ROUND(p_amount_cents * 0.10)::INTEGER; -- 10% platform fee
$$;

NOTIFY pgrst, 'reload schema';
