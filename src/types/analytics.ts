// ============================================================
// Analytics & ROI Tracking Types
// ============================================================

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: 'page_view' | 'campaign_view' | 'influencer_view' | 'application_submit' | 'collaboration_start' | 'payment_complete' | 'search' | 'filter_apply';
  event_data: Record<string, any>;
  session_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  ip_address?: string;
  created_at: string;
}

export interface CampaignMetrics {
  id: string;
  campaign_id: string;
  metric_date: string;
  views: number;
  unique_views: number;
  applications: number;
  collaborations: number;
  clicks: number;
  engagement_rate: number;
  conversion_rate: number;
  avg_application_value_cents: number;
  total_spend_cents: number;
  created_at: string;
  updated_at: string;
}

export interface InfluencerMetrics {
  id: string;
  influencer_id: string;
  metric_date: string;
  profile_views: number;
  marketplace_views: number;
  applications_sent: number;
  applications_accepted: number;
  collaborations_completed: number;
  response_rate: number;
  avg_response_time_hours: number;
  on_time_delivery_rate: number;
  average_rating: number;
  total_earnings_cents: number;
  created_at: string;
  updated_at: string;
}

export interface ROITracking {
  id: string;
  campaign_id: string;
  collaboration_id?: string;
  investment_cents: number;
  return_value_cents: number;
  engagement_score: number;
  attributed_sales_count: number;
  attributed_sales_value_cents: number;
  roi_percentage: number;
  cac_cents: number;
  ltv_cents: number;
  tracking_period_start: string;
  tracking_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface CohortAnalysis {
  id: string;
  cohort_type: 'user' | 'influencer' | 'brand';
  cohort_id: string;
  cohort_date: string;
  period_number: number;
  period_type: 'day' | 'week' | 'month';
  cohort_size: number;
  active_users: number;
  retention_rate: number;
  revenue_cents: number;
  avg_revenue_per_user_cents: number;
  created_at: string;
}

export interface FunnelEvent {
  id: string;
  funnel_name: string;
  step_name: string;
  step_number: number;
  user_id: string;
  campaign_id?: string;
  timestamp: string;
  metadata: Record<string, any>;
  completed: boolean;
  time_to_complete_seconds?: number;
}

export interface FunnelMetrics {
  funnel_name: string;
  step_number: number;
  step_name: string;
  total_users: number;
  completed_users: number;
  completion_rate: number;
  drop_off_rate: number;
  avg_time_to_complete_seconds: number;
}
