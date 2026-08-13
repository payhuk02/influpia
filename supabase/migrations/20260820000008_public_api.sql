-- ============================================================
-- Public API with Authentication & Rate Limiting
-- Comparable to Stripe/Shopify API
-- ============================================================

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 characters for identification
  key_hash TEXT NOT NULL, -- SHA-256 hash of the full key
  key_type TEXT NOT NULL DEFAULT 'test' CHECK (key_type IN ('test', 'live', 'read_only')),
  scopes TEXT[] NOT NULL DEFAULT '{}', -- ['campaigns:read', 'collaborations:write']
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  last_used_ip TEXT,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_keys_user_idx ON public.api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS api_keys_prefix_idx ON public.api_keys(key_prefix);

-- 2. API Usage Logs Table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  rate_limited BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_usage_logs_key_idx ON public.api_usage_logs(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_logs_user_idx ON public.api_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_logs_endpoint_idx ON public.api_usage_logs(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_logs_created_idx ON public.api_usage_logs(created_at DESC);

-- 3. API Rate Limit Tracking (per key)
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'hour', 'day')),
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(api_key_id, window_type, window_start)
);

CREATE INDEX IF NOT EXISTS api_rate_limits_key_window_idx ON public.api_rate_limits(api_key_id, window_type, window_start);

-- 4. API Webhooks (for API users to receive notifications)
CREATE TABLE IF NOT EXISTS public.api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  webhook_name TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}', -- ['campaign.created', 'collaboration.updated']
  secret_key TEXT, -- For signature verification
  is_active BOOLEAN DEFAULT TRUE,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 10,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_webhooks_user_idx ON public.api_webhooks(user_id, is_active);

-- 5. Webhook Delivery Logs
CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.api_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_delivery_logs_webhook_idx ON public.webhook_delivery_logs(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_delivery_logs_status_idx ON public.webhook_delivery_logs(status, next_retry_at);

-- 6. API Documentation/Endpoints Table
CREATE TABLE IF NOT EXISTS public.api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_path TEXT NOT NULL UNIQUE,
  method TEXT NOT NULL,
  description TEXT,
  authentication_required BOOLEAN DEFAULT TRUE,
  required_scopes TEXT[] DEFAULT '{}',
  rate_limit_override INTEGER,
  version TEXT DEFAULT 'v1',
  is_deprecated BOOLEAN DEFAULT FALSE,
  deprecated_at TIMESTAMPTZ,
  deprecated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deprecation_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default API endpoints
INSERT INTO public.api_endpoints (endpoint_path, method, description, authentication_required, required_scopes) VALUES
  ('/api/v1/campaigns', 'GET', 'List all campaigns for authenticated user', TRUE, ARRAY['campaigns:read']),
  ('/api/v1/campaigns', 'POST', 'Create a new campaign', TRUE, ARRAY['campaigns:write']),
  ('/api/v1/campaigns/{id}', 'GET', 'Get campaign details', TRUE, ARRAY['campaigns:read']),
  ('/api/v1/campaigns/{id}', 'PUT', 'Update campaign', TRUE, ARRAY['campaigns:write']),
  ('/api/v1/collaborations', 'GET', 'List collaborations', TRUE, ARRAY['collaborations:read']),
  ('/api/v1/influencers', 'GET', 'List influencers', TRUE, ARRAY['influencers:read']),
  ('/api/v1/analytics', 'GET', 'Get analytics data', TRUE, ARRAY['analytics:read'])
ON CONFLICT (endpoint_path, method) DO NOTHING;

-- RLS Policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;

-- API Keys: Users can manage their own keys
CREATE POLICY "Users manage own API keys" ON public.api_keys FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all API keys" ON public.api_keys FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage API keys" ON public.api_keys FOR ALL TO service_role WITH CHECK (true);

-- API Usage Logs: Users can view their own logs, admins can view all
CREATE POLICY "Users view own API usage logs" ON public.api_usage_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all API usage logs" ON public.api_usage_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert usage logs" ON public.api_usage_logs FOR INSERT TO service_role WITH CHECK (true);

-- API Rate Limits: Service role only
CREATE POLICY "Service role manage rate limits" ON public.api_rate_limits FOR ALL TO service_role WITH CHECK (true);

-- API Webhooks: Users can manage their own webhooks
CREATE POLICY "Users manage own API webhooks" ON public.api_webhooks FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all API webhooks" ON public.api_webhooks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage webhooks" ON public.api_webhooks FOR ALL TO service_role WITH CHECK (true);

-- Webhook Delivery Logs: Users can view their own webhook logs
CREATE POLICY "Users view own webhook delivery logs" ON public.webhook_delivery_logs FOR SELECT TO authenticated USING (
  auth.uid() = (SELECT user_id FROM public.api_webhooks WHERE id = webhook_delivery_logs.webhook_id)
);
CREATE POLICY "Admins view all webhook delivery logs" ON public.webhook_delivery_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage delivery logs" ON public.webhook_delivery_logs FOR ALL TO service_role WITH CHECK (true);

-- API Endpoints: Public read, admin write
CREATE POLICY "Public read API endpoints" ON public.api_endpoints FOR SELECT USING (true);
CREATE POLICY "Admins manage API endpoints" ON public.api_endpoints FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to generate API key
CREATE OR REPLACE FUNCTION public.generate_api_key(p_user_id UUID, p_key_name TEXT, p_key_type TEXT DEFAULT 'test', p_scopes TEXT[] DEFAULT '{}')
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_full_key TEXT;
  v_key_prefix TEXT;
  v_key_hash TEXT;
  v_api_key_id UUID;
BEGIN
  -- Generate key: inf_live_ or inf_test_ + 32 random characters
  v_full_key := 'inf_' || p_key_type || '_' || encode(gen_random_bytes(24), 'base64');
  v_full_key := REGEXP_REPLACE(v_full_key, '[^a-zA-Z0-9]', '', 'g');
  v_key_prefix := SUBSTRING(v_full_key, 1, 8);
  
  -- Hash the key for storage
  v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
  
  -- Insert into database
  INSERT INTO public.api_keys (user_id, key_name, key_prefix, key_hash, key_type, scopes)
  VALUES (p_user_id, p_key_name, v_key_prefix, v_key_hash, p_key_type, p_scopes)
  RETURNING id INTO v_api_key_id;
  
  -- Return only the full key (this is the only time it's shown)
  RETURN v_full_key;
END;
$$;

-- Function to verify API key
CREATE OR REPLACE FUNCTION public.verify_api_key(p_key TEXT)
RETURNS TABLE (api_key_id UUID, user_id UUID, key_type TEXT, scopes TEXT[], is_active BOOLEAN) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    ak.id,
    ak.user_id,
    ak.key_type,
    ak.scopes,
    ak.is_active
  FROM public.api_keys ak
  WHERE ak.key_hash = encode(digest(p_key, 'sha256'), 'hex')
    AND ak.is_active = TRUE
    AND (ak.expires_at IS NULL OR ak.expires_at > NOW());
$$;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(p_api_key_id UUID, p_window_type TEXT DEFAULT 'minute')
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_api_key RECORD;
  v_window_start TIMESTAMPTZ;
  v_limit INTEGER;
  v_current_count INTEGER;
  v_allowed BOOLEAN;
BEGIN
  -- Get API key and limit
  SELECT ak.*, 
    CASE p_window_type
      WHEN 'minute' THEN ak.rate_limit_per_minute
      WHEN 'hour' THEN ak.rate_limit_per_hour
      WHEN 'day' THEN ak.rate_limit_per_day
    END as limit_value
  INTO v_api_key
  FROM public.api_keys ak
  WHERE ak.id = p_api_key_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, NOW();
    RETURN;
  END IF;
  
  v_limit := v_api_key.limit_value;
  
  -- Calculate window start
  IF p_window_type = 'minute' THEN
    v_window_start := date_trunc('minute', NOW());
  ELSIF p_window_type = 'hour' THEN
    v_window_start := date_trunc('hour', NOW());
  ELSIF p_window_type = 'day' THEN
    v_window_start := date_trunc('day', NOW());
  END IF;
  
  -- Get current count
  SELECT COALESCE(request_count, 0) INTO v_current_count
  FROM public.api_rate_limits
  WHERE api_key_id = p_api_key_id
    AND window_type = p_window_type
    AND window_start = v_window_start;
  
  -- Check if allowed
  v_allowed := v_current_count < v_limit;
  
  -- Increment count
  INSERT INTO public.api_rate_limits (api_key_id, window_type, window_start, request_count, blocked)
  VALUES (p_api_key_id, p_window_type, v_window_start, 1, NOT v_allowed)
  ON CONFLICT (api_key_id, window_type, window_start) DO UPDATE SET
    request_count = api_rate_limits.request_count + 1,
    blocked = NOT v_allowed;
  
  RETURN QUERY SELECT v_allowed, v_limit - v_current_count - 1, v_window_start + INTERVAL '1 ' || p_window_type;
END;
$$;

-- Function to log API usage
CREATE OR REPLACE FUNCTION public.log_api_usage(
  p_api_key_id UUID,
  p_user_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_rate_limited BOOLEAN DEFAULT FALSE
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.api_usage_logs (
    api_key_id, user_id, endpoint, method, status_code, response_time_ms, rate_limited
  ) VALUES (
    p_api_key_id, p_user_id, p_endpoint, p_method, p_status_code, p_response_time_ms, p_rate_limited
  );
  
  -- Update API key last used
  IF p_api_key_id IS NOT NULL THEN
    UPDATE public.api_keys
    SET last_used_at = NOW(),
        usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = p_api_key_id;
  END IF;
END;
$$;

-- Function to trigger webhook
CREATE OR REPLACE FUNCTION public.trigger_api_webhook(p_user_id UUID, p_event_type TEXT, p_payload JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_webhook RECORD;
  v_signature TEXT;
BEGIN
  FOR v_webhook IN
    SELECT * FROM public.api_webhooks
    WHERE user_id = p_user_id
      AND is_active = TRUE
      AND p_event_type = ANY(events)
  LOOP
    -- Generate signature if secret exists
    IF v_webhook.secret_key IS NOT NULL THEN
      v_signature := encode(digest(p_payload::TEXT || v_webhook.secret_key, 'sha256'), 'hex');
    END IF;
    
    -- Insert delivery log
    INSERT INTO public.webhook_delivery_logs (
      webhook_id, event_type, payload, status, next_retry_at
    ) VALUES (
      v_webhook.id, p_event_type, p_payload, 'pending', NOW()
    );
    
    -- Update webhook last triggered
    UPDATE public.api_webhooks
    SET last_triggered_at = NOW()
    WHERE id = v_webhook.id;
  END LOOP;
END;
$$;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '2 days';
END;
$$;

-- Function to get API usage statistics
CREATE OR REPLACE FUNCTION public.get_api_usage_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  avg_response_time_ms DECIMAL,
  rate_limited_requests BIGINT,
  most_used_endpoint TEXT,
  unique_endpoints INTEGER
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status_code BETWEEN 200 AND 299) as successful_requests,
    COUNT(*) FILTER (WHERE status_code >= 400) as failed_requests,
    AVG(response_time_ms) as avg_response_time_ms,
    COUNT(*) FILTER (WHERE rate_limited = TRUE) as rate_limited_requests,
    (SELECT endpoint FROM public.api_usage_logs WHERE user_id = p_user_id AND created_at >= NOW() - (p_days || ' days')::INTERVAL GROUP BY endpoint ORDER BY COUNT(*) DESC LIMIT 1) as most_used_endpoint,
    COUNT(DISTINCT endpoint) as unique_endpoints
  FROM public.api_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
$$;

NOTIFY pgrst, 'reload schema';
