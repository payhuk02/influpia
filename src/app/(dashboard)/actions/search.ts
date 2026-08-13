'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

// Save a search
export async function saveSearch(searchData: {
  user_id: string;
  search_name: string;
  search_type: 'campaign' | 'influencer' | 'collaboration';
  filters: Record<string, any>;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  is_alert_enabled: boolean;
  alert_frequency?: 'instant' | 'daily' | 'weekly';
}) {
  const { data, error } = await getAdminClient()
    .from('saved_searches')
    .insert({
      ...searchData,
      result_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/search');
  return data;
}

// Get saved searches for a user
export async function getSavedSearches(userId: string, searchType?: string) {
  let query = getAdminClient()
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (searchType) {
    query = query.eq('search_type', searchType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Delete a saved search
export async function deleteSavedSearch(searchId: string) {
  const { error } = await getAdminClient()
    .from('saved_searches')
    .delete()
    .eq('id', searchId);

  if (error) throw error;
  revalidatePath('/dashboard/search');
}

// Log search history
export async function logSearch(searchData: {
  user_id: string;
  search_query: string;
  search_type: 'campaign' | 'influencer' | 'collaboration';
  filters: Record<string, any>;
  results_count: number;
  search_duration_ms: number;
  zero_results: boolean;
}) {
  const { data, error } = await getAdminClient()
    .from('search_history')
    .insert({
      ...searchData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get search history for a user
export async function getSearchHistory(userId: string, limit: number = 50) {
  const { data, error } = await getAdminClient()
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get AI recommendations
export async function getAIRecommendations(userId: string, recommendationType: 'influencer' | 'campaign' | 'collaboration') {
  const { data, error } = await getAdminClient()
    .from('ai_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('recommendation_type', recommendationType)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

// Dismiss an AI recommendation
export async function dismissRecommendation(recommendationId: string) {
  const { error } = await getAdminClient()
    .from('ai_recommendations')
    .update({ is_dismissed: true })
    .eq('id', recommendationId);

  if (error) throw error;
}

// Accept an AI recommendation
export async function acceptRecommendation(recommendationId: string) {
  const { error } = await getAdminClient()
    .from('ai_recommendations')
    .update({ is_accepted: true, viewed_at: new Date().toISOString() })
    .eq('id', recommendationId);

  if (error) throw error;
}

// Get search facets
export async function getSearchFacets() {
  const { data, error } = await getAdminClient()
    .from('search_facets')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}

// Get search analytics
export async function getSearchAnalytics(date: string) {
  const { data, error } = await getAdminClient()
    .from('search_analytics')
    .select('*')
    .eq('search_date', date);

  if (error) throw error;
  return data;
}

// Generate campaign recommendations (AI matching)
export async function generateCampaignRecommendations(campaignId: string) {
  const { data, error } = await getAdminClient().rpc('generate_campaign_recommendations', {
    p_campaign_id: campaignId,
  });

  if (error) throw error;
  return data;
}

// Update facet counts
export async function updateFacetCounts(searchType: string, filters: Record<string, any>) {
  const { data, error } = await getAdminClient().rpc('update_facet_counts', {
    p_search_type: searchType,
    p_filters: filters,
  });

  if (error) throw error;
  return data;
}
