// ============================================================
// Subscription & Billing Types
// ============================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_cents: number;
  currency: string;
  billing_interval: 'monthly' | 'yearly';
  tier: 'free' | 'pro' | 'enterprise';
  features: {
    max_campaigns: number;
    max_influencers: number;
    ai_matching: boolean;
    advanced_analytics: boolean;
    custom_reports: boolean;
    api_access: boolean;
    priority_support: boolean;
    white_label: boolean;
    dedicated_account_manager: boolean;
  };
  trial_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_end?: string;
  provider: 'stripe' | 'fedapay' | 'manual';
  provider_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  subscription_id: string;
  metric_type: 'campaigns' | 'influencers' | 'api_calls' | 'reports' | 'storage';
  current_usage: number;
  limit: number;
  reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  user_id: string;
  subscription_id: string;
  action: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed' | 'trial_started' | 'trial_ended';
  previous_plan_id?: string;
  new_plan_id?: string;
  reason?: string;
  performed_by?: string;
  created_at: string;
}

export interface SubscriptionFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  is_boolean: boolean;
  default_limit?: number;
  created_at: string;
}

export interface AddOnPurchase {
  id: string;
  user_id: string;
  add_on_type: 'extra_campaigns' | 'extra_influencers' | 'brand_safety_report' | 'custom_integration';
  quantity: number;
  price_cents: number;
  currency: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}
