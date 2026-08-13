'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate API key
export async function generateAPIKey(userId: string, keyData: {
  key_name: string;
  key_type: 'test' | 'live' | 'read_only';
  scopes: string[];
  rate_limit_per_minute?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
}) {
  const { data, error } = await supabase.rpc('generate_api_key', {
    p_user_id: userId,
    p_key_name: keyData.key_name,
    p_key_type: keyData.key_type,
    p_scopes: keyData.scopes,
    p_rate_limit_per_minute: keyData.rate_limit_per_minute || 60,
    p_rate_limit_per_hour: keyData.rate_limit_per_hour || 1000,
    p_rate_limit_per_day: keyData.rate_limit_per_day || 10000,
  });

  if (error) throw error;
  revalidatePath('/dashboard/api');
  return data;
}

// Get API keys for user
export async function getAPIKeys(userId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Delete API key
export async function deleteAPIKey(keyId: string) {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId);

  if (error) throw error;
  revalidatePath('/dashboard/api');
}

// Verify API key
export async function verifyAPIKey(keyHash: string) {
  const { data, error } = await supabase.rpc('verify_api_key', {
    p_key_hash: keyHash,
  });

  if (error) throw error;
  return data;
}

// Check API rate limit
export async function checkAPIRateLimit(keyId: string, windowType: 'minute' | 'hour' | 'day') {
  const { data, error } = await supabase.rpc('check_api_rate_limit', {
    p_api_key_id: keyId,
    p_window_type: windowType,
  });

  if (error) throw error;
  return data;
}

// Log API usage
export async function logAPIUsage(usageData: {
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
}) {
  const { error } = await supabase.rpc('log_api_usage', {
    p_api_key_id: usageData.api_key_id,
    p_user_id: usageData.user_id,
    p_endpoint: usageData.endpoint,
    p_method: usageData.method,
    p_status_code: usageData.status_code,
    p_response_time_ms: usageData.response_time_ms,
    p_request_size_bytes: usageData.request_size_bytes,
    p_response_size_bytes: usageData.response_size_bytes,
    p_ip_address: usageData.ip_address,
    p_user_agent: usageData.user_agent,
    p_rate_limited: usageData.rate_limited,
    p_error_message: usageData.error_message,
  });

  if (error) throw error;
}

// Get API usage logs
export async function getAPIUsageLogs(userId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from('api_usage_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get API usage stats
export async function getAPIUsageStats(keyId: string) {
  const { data, error } = await supabase.rpc('get_api_usage_stats', {
    p_api_key_id: keyId,
  });

  if (error) throw error;
  return data;
}

// Create webhook
export async function createWebhook(userId: string, webhookData: {
  webhook_url: string;
  webhook_name: string;
  events: string[];
  secret_key?: string;
  retry_count?: number;
  timeout_seconds?: number;
}) {
  const { data, error } = await supabase
    .from('api_webhooks')
    .insert({
      user_id: userId,
      ...webhookData,
      is_active: true,
      retry_count: webhookData.retry_count || 3,
      timeout_seconds: webhookData.timeout_seconds || 10,
      failure_count: 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/api');
  return data;
}

// Get webhooks for user
export async function getWebhooks(userId: string) {
  const { data, error } = await supabase
    .from('api_webhooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Delete webhook
export async function deleteWebhook(webhookId: string) {
  const { error } = await supabase
    .from('api_webhooks')
    .delete()
    .eq('id', webhookId);

  if (error) throw error;
  revalidatePath('/dashboard/api');
}

// Get webhook delivery logs
export async function getWebhookDeliveryLogs(webhookId: string) {
  const { data, error } = await supabase
    .from('webhook_delivery_logs')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

// Trigger webhook
export async function triggerAPIWebhook(webhookId: string, eventType: string, payload: Record<string, any>) {
  const { error } = await supabase.rpc('trigger_api_webhook', {
    p_webhook_id: webhookId,
    p_event_type: eventType,
    p_payload: payload,
  });

  if (error) throw error;
}

// Get API endpoints
export async function getAPIEndpoints() {
  const { data, error } = await supabase
    .from('api_endpoints')
    .select('*')
    .eq('is_deprecated', false)
    .order('endpoint_path', { ascending: true });

  if (error) throw error;
  return data;
}
