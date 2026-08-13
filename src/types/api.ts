// ============================================================
// Public API Types
// ============================================================

export interface APIKey {
  id: string;
  user_id: string;
  key_name: string;
  key_prefix: string;
  key_hash: string;
  key_type: 'test' | 'live' | 'read_only';
  scopes: string[];
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  is_active: boolean;
  last_used_at?: string;
  last_used_ip?: string;
  usage_count: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface APIUsageLog {
  id: string;
  api_key_id?: string;
  user_id?: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  ip_address?: string;
  user_agent?: string;
  rate_limited: boolean;
  error_message?: string;
  created_at: string;
}

export interface APIRateLimit {
  id: string;
  api_key_id: string;
  window_type: 'minute' | 'hour' | 'day';
  window_start: string;
  request_count: number;
  blocked: boolean;
  created_at: string;
}

export interface APIWebhook {
  id: string;
  user_id: string;
  webhook_url: string;
  webhook_name: string;
  events: string[];
  secret_key?: string;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  last_success_at?: string;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  response_status?: number;
  response_body?: string;
  response_time_ms?: number;
  attempt_number: number;
  delivered_at?: string;
  next_retry_at?: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  error_message?: string;
  created_at: string;
}

export interface APIEndpoint {
  id: string;
  endpoint_path: string;
  method: string;
  description?: string;
  authentication_required: boolean;
  required_scopes: string[];
  rate_limit_override?: number;
  version: string;
  is_deprecated: boolean;
  deprecated_at?: string;
  deprecated_by?: string;
  deprecation_message?: string;
  created_at: string;
  updated_at: string;
}

export interface APIUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  rate_limited_requests: number;
  most_used_endpoint: string;
  unique_endpoints: number;
}
