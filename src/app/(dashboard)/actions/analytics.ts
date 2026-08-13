'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

// Get campaign metrics for a date range
export async function getCampaignMetrics(
  campaignId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await getAdminClient()
    .from('campaign_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date', { ascending: true });

  if (error) throw error;
  return data;
}

// Get influencer metrics
export async function getInfluencerMetrics(
  influencerId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await getAdminClient()
    .from('influencer_metrics')
    .select('*')
    .eq('influencer_id', influencerId)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date', { ascending: true });

  if (error) throw error;
  return data;
}

// Get ROI tracking data
export async function getROITracking(campaignId?: string) {
  let query = getAdminClient().from('roi_tracking').select('*');
  
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
  
  if (error) throw error;
  return data;
}

// Get cohort analysis
export async function getCohortAnalysis(
  cohortType: 'user' | 'influencer' | 'brand',
  cohortId: string
) {
  const { data, error } = await getAdminClient()
    .from('cohort_analysis')
    .select('*')
    .eq('cohort_type', cohortType)
    .eq('cohort_id', cohortId)
    .order('period_number', { ascending: true });

  if (error) throw error;
  return data;
}

// Get funnel metrics
export async function getFunnelMetrics(funnelName: string) {
  const { data, error } = await getAdminClient()
    .from('funnel_events')
    .select('*')
    .eq('funnel_name', funnelName)
    .order('step_number', { ascending: true });

  if (error) throw error;
  return data;
}

// Track analytics event
export async function trackAnalyticsEvent(eventData: {
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  session_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}) {
  const { data, error } = await getAdminClient()
    .from('analytics_events')
    .insert({
      ...eventData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get aggregated analytics for dashboard
export async function getDashboardAnalytics(userId: string, role: 'brand' | 'influencer') {
  if (role === 'brand') {
    // Get brand-specific analytics
    const { data: campaigns, error: campaignsError } = await getAdminClient()
      .from('campaigns')
      .select('id, title, budget, created_at')
      .eq('brand_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (campaignsError) throw campaignsError;

    const campaignIds = campaigns?.map(c => c.id) || [];
    
    const { data: metrics, error: metricsError } = await getAdminClient()
      .from('campaign_metrics')
      .select('*')
      .in('campaign_id', campaignIds)
      .order('metric_date', { ascending: false })
      .limit(100);

    if (metricsError) throw metricsError;

    return { campaigns, metrics };
  } else {
    // Get influencer-specific analytics
    const { data: metrics, error: metricsError } = await getAdminClient()
      .from('influencer_metrics')
      .select('*')
      .eq('influencer_id', userId)
      .order('metric_date', { ascending: false })
      .limit(100);

    if (metricsError) throw metricsError;

    return { metrics };
  }
}

// Calculate ROI for a campaign
export async function calculateCampaignROI(campaignId: string) {
  const { data, error } = await getAdminClient().rpc('calculate_roi', {
    p_campaign_id: campaignId,
  });

  if (error) throw error;
  return data;
}

// Aggregate campaign metrics
export async function aggregateCampaignMetrics(campaignId: string) {
  const { data, error } = await getAdminClient().rpc('aggregate_campaign_metrics', {
    p_campaign_id: campaignId,
  });

  if (error) throw error;
  revalidatePath('/dashboard/analytics');
  return data;
}
