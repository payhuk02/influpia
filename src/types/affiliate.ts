// ============================================================
// Affiliate & Referral Program Types
// ============================================================

export interface AffiliateProgram {
  id: string;
  name: string;
  description: string;
  commission_type: 'percentage' | 'fixed' | 'hybrid';
  commission_rate: number;
  fixed_amount_cents: number;
  cookie_duration_days: number;
  payout_threshold_cents: number;
  payout_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  is_tiered: boolean;
  max_tiers: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  program_id: string;
  affiliate_code: string;
  tier: number;
  parent_affiliate_id?: string;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  approved_at?: string;
  suspended_at?: string;
  suspended_reason?: string;
  total_earnings_cents: number;
  total_payouts_cents: number;
  current_balance_cents: number;
  referral_count: number;
  active_referral_count: number;
  payout_method?: string;
  payout_details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReferralClick {
  id: string;
  affiliate_id: string;
  referral_code: string;
  clicked_at: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  converted_user_id?: string;
  converted_at?: string;
  conversion_value_cents: number;
  is_converted: boolean;
  created_at: string;
}

export interface Commission {
  id: string;
  affiliate_id: string;
  referral_click_id?: string;
  referred_user_id?: string;
  commission_type: 'signup' | 'subscription' | 'collaboration' | 'campaign' | 'custom';
  commission_tier: number;
  base_amount_cents: number;
  commission_rate: number;
  commission_amount_cents: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'expired';
  approved_at?: string;
  approved_by?: string;
  paid_at?: string;
  payout_transaction_id?: string;
  rejection_reason?: string;
  expires_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  payout_period_start: string;
  payout_period_end: string;
  total_commissions_cents: number;
  total_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  payout_method?: string;
  payout_details?: Record<string, any>;
  payment_provider?: 'fedapay' | 'stripe' | 'bank_transfer';
  provider_transaction_id?: string;
  processed_by?: string;
  processed_at?: string;
  paid_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateTierRule {
  id: string;
  program_id: string;
  tier_level: number;
  tier_name: string;
  min_referrals: number;
  min_revenue_cents: number;
  commission_rate: number;
  parent_commission_rate: number;
  benefits: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface AffiliateMetrics {
  id: string;
  affiliate_id: string;
  metric_date: string;
  clicks: number;
  unique_visitors: number;
  signups: number;
  active_users: number;
  commissions_earned_cents: number;
  conversion_rate: number;
  avg_order_value_cents: number;
  created_at: string;
}
