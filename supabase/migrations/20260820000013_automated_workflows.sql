-- ============================================================
-- Automated Campaign Workflows
-- Comparable to HubSpot/Stripe automation
-- ============================================================

-- 1. Workflow Templates Table
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('campaign_lifecycle', 'onboarding', 'engagement', 'retention', 'custom')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('campaign_created', 'application_received', 'collaboration_started', 'milestone_completed', 'payment_received', 'manual')),
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default workflow templates
INSERT INTO public.workflow_templates (name, display_name, description, workflow_type, trigger_type, is_system) VALUES
  ('campaign_welcome', 'Campaign Welcome Sequence', 'Welcome sequence for new campaign applications', 'campaign_lifecycle', 'application_received', TRUE),
  ('collaboration_onboarding', 'Collaboration Onboarding', 'Onboarding workflow for new collaborations', 'onboarding', 'collaboration_started', TRUE),
  ('milestone_reminder', 'Milestone Reminder', 'Reminders for upcoming milestones', 'engagement', 'milestone_completed', TRUE),
  ('payment_confirmation', 'Payment Confirmation', 'Confirmation workflow after payment', 'retention', 'payment_received', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. Workflow Definitions Table (JSON-based workflow steps)
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  definition JSONB NOT NULL DEFAULT '{}', -- { "steps": [...], "conditions": {...} }
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, version)
);

CREATE INDEX IF NOT EXISTS workflow_definitions_template_idx ON public.workflow_definitions(template_id, version DESC);

-- 3. Active Workflow Instances Table
CREATE TABLE IF NOT EXISTS public.workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  definition_id UUID REFERENCES public.workflow_definitions(id) ON DELETE SET NULL,
  trigger_entity_type TEXT NOT NULL, -- 'campaign', 'collaboration', 'milestone'
  trigger_entity_id UUID NOT NULL,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'failed', 'cancelled')),
  current_step INTEGER DEFAULT 0,
  context_data JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workflow_instances_template_idx ON public.workflow_instances(template_id, status);
CREATE INDEX IF NOT EXISTS workflow_instances_entity_idx ON public.workflow_instances(trigger_entity_type, trigger_entity_id);
CREATE INDEX IF NOT EXISTS workflow_instances_status_idx ON public.workflow_instances(status, started_at DESC);

-- 4. Workflow Execution Logs Table
CREATE TABLE IF NOT EXISTS public.workflow_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('action', 'condition', 'delay', 'notification', 'webhook', 'email')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workflow_execution_logs_instance_idx ON public.workflow_execution_logs(workflow_instance_id, step_number);

-- 5. Workflow Actions Table (reusable action definitions)
CREATE TABLE IF NOT EXISTS public.workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_name TEXT NOT NULL UNIQUE,
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'send_notification', 'update_status', 'create_task', 'call_webhook', 'add_tag', 'remove_tag', 'delay', 'condition')),
  action_config JSONB NOT NULL DEFAULT '{}', -- { "template_id": "...", "recipient": "...", "subject": "..." }
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default workflow actions
INSERT INTO public.workflow_actions (action_name, action_type, action_config) VALUES
  ('send_welcome_email', 'send_email', '{"template": "welcome_email", "recipient": "influencer"}'::jsonb),
  ('send_application_notification', 'send_notification', '{"type": "application_received", "recipient": "brand"}'::jsonb),
  ('update_campaign_status', 'update_status', '{"table": "campaigns", "status": "active"}'::jsonb),
  ('create_milestone_task', 'create_task', '{"task_type": "milestone_reminder", "assign_to": "influencer"}'::jsonb),
  ('send_payment_confirmation', 'send_email', '{"template": "payment_confirmation", "recipient": "both"}'::jsonb),
  ('delay_24h', 'delay', '{"hours": 24}'::jsonb),
  ('delay_48h', 'delay', '{"hours": 48}'::jsonb),
  ('delay_7d', 'delay', '{"days": 7}'::jsonb)
ON CONFLICT (action_name) DO NOTHING;

-- 6. Workflow Triggers Table (event-based triggers)
CREATE TABLE IF NOT EXISTS public.workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL, -- 'campaign.created', 'collaboration.status_changed'
  trigger_conditions JSONB DEFAULT '{}', -- { "status": "approved", "budget": ">1000" }
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workflow_triggers_template_idx ON public.workflow_triggers(template_id);
CREATE INDEX IF NOT EXISTS workflow_triggers_event_idx ON public.workflow_triggers(trigger_event, is_active);

-- RLS Policies
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;

-- Workflow Templates: Public read active, admin write
CREATE POLICY "Public read active workflow templates" ON public.workflow_templates FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage workflow templates" ON public.workflow_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Workflow Definitions: Public read active, admin write
CREATE POLICY "Public read active workflow definitions" ON public.workflow_definitions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage workflow definitions" ON public.workflow_definitions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Workflow Instances: Users can view instances for their entities
CREATE POLICY "Users view own workflow instances" ON public.workflow_instances FOR SELECT TO authenticated USING (
  triggered_by = auth.uid() OR
  (trigger_entity_type = 'campaign' AND EXISTS (SELECT 1 FROM public.campaigns WHERE id = trigger_entity_id AND brand_id = auth.uid())) OR
  (trigger_entity_type = 'collaboration' AND EXISTS (SELECT 1 FROM public.collaborations WHERE id = trigger_entity_id AND (brand_id = auth.uid() OR influencer_id = auth.uid())))
);
CREATE POLICY "Admins view all workflow instances" ON public.workflow_instances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage instances" ON public.workflow_instances FOR ALL TO service_role WITH CHECK (true);

-- Workflow Execution Logs: Users can view logs for their instances
CREATE POLICY "Users view own workflow logs" ON public.workflow_execution_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.workflow_instances WHERE id = workflow_execution_logs.workflow_instance_id AND triggered_by = auth.uid())
);
CREATE POLICY "Admins view all workflow logs" ON public.workflow_execution_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage logs" ON public.workflow_execution_logs FOR ALL TO service_role WITH CHECK (true);

-- Workflow Actions: Public read active, admin write
CREATE POLICY "Public read active workflow actions" ON public.workflow_actions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage workflow actions" ON public.workflow_actions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Workflow Triggers: Public read active, admin write
CREATE POLICY "Public read active workflow triggers" ON public.workflow_triggers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage workflow triggers" ON public.workflow_triggers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to trigger workflow
CREATE OR REPLACE FUNCTION public.trigger_workflow(p_template_id UUID, p_entity_type TEXT, p_entity_id UUID, p_triggered_by UUID DEFAULT NULL, p_context JSONB DEFAULT '{}')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template RECORD;
  v_definition RECORD;
  v_instance_id UUID;
BEGIN
  -- Get template
  SELECT * INTO v_template FROM public.workflow_templates WHERE id = p_template_id AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Template not found or inactive'; END IF;
  
  -- Get active definition
  SELECT * INTO v_definition FROM public.workflow_definitions 
  WHERE template_id = p_template_id AND is_active = TRUE 
  ORDER BY version DESC LIMIT 1;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'No active definition found'; END IF;
  
  -- Create workflow instance
  INSERT INTO public.workflow_instances (
    template_id, definition_id, trigger_entity_type, trigger_entity_id,
    triggered_by, context_data, status
  ) VALUES (
    p_template_id, v_definition.id, p_entity_type, p_entity_id,
    p_triggered_by, p_context, 'running'
  )
  RETURNING id INTO v_instance_id;
  
  -- Start execution (async in production, sync here for demo)
  PERFORM public.execute_workflow_step(v_instance_id, 0);
  
  RETURN v_instance_id;
END;
$$;

-- Function to execute workflow step
CREATE OR REPLACE FUNCTION public.execute_workflow_step(p_instance_id UUID, p_step_number INTEGER DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_instance RECORD;
  v_definition JSONB;
  v_steps JSONB;
  v_current_step JSONB;
  v_step_index INTEGER;
  v_action_name TEXT;
  v_action RECORD;
  v_log_id UUID;
BEGIN
  -- Get instance
  SELECT * INTO v_instance FROM public.workflow_instances WHERE id = p_instance_id;
  IF NOT FOUND OR v_instance.status != 'running' THEN RETURN; END IF;
  
  -- Get definition
  SELECT definition INTO v_definition FROM public.workflow_definitions WHERE id = v_instance.definition_id;
  v_steps := v_definition->'steps';
  
  -- Determine current step
  IF p_step_number IS NULL THEN
    v_step_index := v_instance.current_step;
  ELSE
    v_step_index := p_step_number;
  END IF;
  
  -- Check if more steps
  IF v_step_index >= jsonb_array_length(v_steps) THEN
    -- Workflow completed
    UPDATE public.workflow_instances
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = p_instance_id;
    RETURN;
  END IF;
  
  -- Get current step
  v_current_step := v_steps->v_step_index;
  v_action_name := v_current_step->>'action';
  
  -- Get action definition
  SELECT * INTO v_action FROM public.workflow_actions WHERE action_name = v_action_name AND is_active = TRUE;
  
  IF NOT FOUND THEN
    -- Skip unknown actions
    UPDATE public.workflow_instances SET current_step = current_step + 1, updated_at = NOW() WHERE id = p_instance_id;
    PERFORM public.execute_workflow_step(p_instance_id);
    RETURN;
  END IF;
  
  -- Create execution log
  INSERT INTO public.workflow_execution_logs (
    workflow_instance_id, step_number, step_name, step_type, status, started_at
  ) VALUES (
    p_instance_id, v_step_index, v_action_name, v_action.action_type, 'running', NOW()
  )
  RETURNING id INTO v_log_id;
  
  -- Execute action based on type
  IF v_action.action_type = 'send_email' THEN
    -- Simulate email send
    UPDATE public.workflow_execution_logs
    SET status = 'completed', completed_at = NOW(), output_data = jsonb_build_object('sent', true)
    WHERE id = v_log_id;
    
  ELSIF v_action.action_type = 'send_notification' THEN
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      v_instance.triggered_by,
      v_action.action_config->>'type',
      'Workflow Notification',
      v_action.action_config->>'message',
      '/dashboard'
    );
    
    UPDATE public.workflow_execution_logs
    SET status = 'completed', completed_at = NOW(), output_data = jsonb_build_object('notification_created', true)
    WHERE id = v_log_id;
    
  ELSIF v_action.action_type = 'delay' THEN
    -- Handle delay (in production, would use job queue)
    UPDATE public.workflow_execution_logs
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_log_id;
    
  ELSIF v_action.action_type = 'update_status' THEN
    -- Update entity status
    IF v_instance.trigger_entity_type = 'campaign' THEN
      UPDATE public.campaigns SET status = (v_action.action_config->>'status') WHERE id = v_instance.trigger_entity_id;
    END IF;
    
    UPDATE public.workflow_execution_logs
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_log_id;
    
  ELSE
    -- Unknown action type, skip
    UPDATE public.workflow_execution_logs
    SET status = 'skipped', completed_at = NOW()
    WHERE id = v_log_id;
  END IF;
  
  -- Move to next step
  UPDATE public.workflow_instances
  SET current_step = current_step + 1, updated_at = NOW()
  WHERE id = p_instance_id;
  
  -- Execute next step
  PERFORM public.execute_workflow_step(p_instance_id);
END;
$$;

-- Function to create workflow trigger
CREATE OR REPLACE FUNCTION public.create_workflow_trigger(p_template_id UUID, p_trigger_event TEXT, p_conditions JSONB DEFAULT '{}')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trigger_id UUID;
BEGIN
  INSERT INTO public.workflow_triggers (template_id, trigger_event, trigger_conditions)
  VALUES (p_template_id, p_trigger_event, p_conditions)
  RETURNING id INTO v_trigger_id;
  
  RETURN v_trigger_id;
END;
$$;

-- Function to handle event and trigger matching workflows
CREATE OR REPLACE FUNCTION public.handle_workflow_event(p_event TEXT, p_entity_type TEXT, p_entity_id UUID, p_context JSONB DEFAULT '{}')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trigger RECORD;
BEGIN
  -- Find matching triggers
  FOR v_trigger IN
    SELECT wt.* FROM public.workflow_triggers wt
    JOIN public.workflow_templates wtemp ON wt.template_id = wtemp.id
    WHERE wt.trigger_event = p_event
      AND wt.is_active = TRUE
      AND wtemp.is_active = TRUE
  LOOP
    -- Check conditions (simplified)
    -- In production, would evaluate complex conditions
    
    -- Trigger workflow
    PERFORM public.trigger_workflow(v_trigger.template_id, p_entity_type, p_entity_id, NULL, p_context);
  END LOOP;
END;
$$;

-- Function to pause workflow instance
CREATE OR REPLACE FUNCTION public.pause_workflow(p_instance_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.workflow_instances
  SET status = 'paused', updated_at = NOW()
  WHERE id = p_instance_id;
END;
$$;

-- Function to resume workflow instance
CREATE OR REPLACE FUNCTION public.resume_workflow(p_instance_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.workflow_instances
  SET status = 'running', updated_at = NOW()
  WHERE id = p_instance_id;
  
  -- Continue execution
  PERFORM public.execute_workflow_step(p_instance_id);
END;
$$;

-- Function to cancel workflow instance
CREATE OR REPLACE FUNCTION public.cancel_workflow(p_instance_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.workflow_instances
  SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_instance_id;
END;
$$;

-- Function to get workflow execution summary
CREATE OR REPLACE FUNCTION public.get_workflow_summary(p_instance_id UUID)
RETURNS TABLE (
  step_number INTEGER,
  step_name TEXT,
  step_type TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    step_number,
    step_name,
    step_type,
    status,
    started_at,
    completed_at,
    EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER as duration_seconds
  FROM public.workflow_execution_logs
  WHERE workflow_instance_id = p_instance_id
  ORDER BY step_number ASC;
$$;

-- Create default workflow definition for campaign welcome
INSERT INTO public.workflow_definitions (template_id, version, definition, is_active)
SELECT 
  id, 1, 
  '{
    "steps": [
      {"action": "send_welcome_email", "config": {"delay_hours": 0}},
      {"action": "delay_24h", "config": {}},
      {"action": "send_application_notification", "config": {}},
      {"action": "delay_48h", "config": {}},
      {"action": "update_campaign_status", "config": {"status": "active"}}
    ]
  }'::jsonb, TRUE
FROM public.workflow_templates
WHERE name = 'campaign_welcome'
ON CONFLICT (template_id, version) DO NOTHING;

-- Create default workflow definition for collaboration onboarding
INSERT INTO public.workflow_definitions (template_id, version, definition, is_active)
SELECT 
  id, 1,
  '{
    "steps": [
      {"action": "send_welcome_email", "config": {"delay_hours": 0}},
      {"action": "create_milestone_task", "config": {}},
      {"action": "delay_7d", "config": {}},
      {"action": "send_notification", "config": {"type": "check_in"}}
    ]
  }'::jsonb, TRUE
FROM public.workflow_templates
WHERE name = 'collaboration_onboarding'
ON CONFLICT (template_id, version) DO NOTHING;

NOTIFY pgrst, 'reload schema';
