'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { readList, readOne } from '@/utils/supabase/safe-read';
import { revalidatePath } from 'next/cache';

// Get brand safety categories
export async function getBrandSafetyCategories() {
  return readList('getBrandSafetyCategories', (supabase) =>
    supabase
      .from('brand_safety_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name', { ascending: true })
  );
}

// Get influencer vetting
export async function getInfluencerVetting(influencerId: string) {
  const { data, error } = await getAdminClient()
    .from('influencer_vetting')
    .select(`
      *,
      category:brand_safety_categories(category_name),
      criteria:vetting_criteria(*)
    `)
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Create influencer vetting
export async function createInfluencerVetting(vettingData: {
  influencer_id: string;
  requested_by: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}) {
  const { data, error } = await getAdminClient()
    .from('influencer_vetting')
    .insert({
      ...vettingData,
      status: 'pending',
      priority: vettingData.priority || 'normal',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/brand-safety');
  return data;
}

// Run brand safety check
export async function runBrandSafetyCheck(influencerId: string, checkType: 'full' | 'quick' = 'full') {
  const { data, error } = await getAdminClient().rpc('run_brand_safety_check', {
    p_influencer_id: influencerId,
    p_check_type: checkType,
  });

  if (error) throw error;
  revalidatePath('/dashboard/brand-safety');
  return data;
}

// Get vetting criteria
export async function getVettingCriteria(categoryId?: string) {
  let query = getAdminClient()
    .from('vetting_criteria')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Get vetting results
export async function getVettingResults(vettingId: string) {
  const { data, error } = await getAdminClient()
    .from('vetting_results')
    .select('*')
    .eq('vetting_id', vettingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get brand safety matches
export async function getBrandSafetyMatches(campaignId: string) {
  const { data, error } = await getAdminClient()
    .from('brand_safety_matches')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('match_score', { ascending: false });

  if (error) throw error;
  return data;
}

// Get verification documents
export async function getVerificationDocuments(influencerId: string) {
  const { data, error } = await getAdminClient()
    .from('verification_documents')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Upload verification document
export async function uploadVerificationDocument(documentData: {
  influencer_id: string;
  document_type: 'id_card' | 'passport' | 'driving_license' | 'tax_id' | 'business_license' | 'other';
  document_url: string;
  expiry_date?: string;
  uploaded_by: string;
}) {
  const { data, error } = await getAdminClient()
    .from('verification_documents')
    .insert({
      ...documentData,
      verification_status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/brand-safety');
  return data;
}

// Verify document
export async function verifyDocument(documentId: string, verifiedBy: string, status: 'approved' | 'rejected', notes?: string) {
  const { data, error } = await getAdminClient()
    .from('verification_documents')
    .update({
      verification_status: status,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      verification_notes: notes,
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/brand-safety');
  return data;
}

// Get brand safety preferences
export async function getBrandSafetyPreferences(userId: string): Promise<any | null> {
  return readOne(
    'getBrandSafetyPreferences',
    (supabase) =>
      supabase
        .from('brand_safety_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
    { notFoundOk: true }
  );
}

// Update brand safety preferences
export async function updateBrandSafetyPreferences(userId: string, preferences: {
  blocked_categories?: string[];
  blocked_keywords?: string[];
  min_followers?: number;
  min_engagement_rate?: number;
  require_verification?: boolean;
  require_kyc?: boolean;
}) {
  const { data, error } = await getAdminClient()
    .from('brand_safety_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/brand-safety');
  return data;
}

// Get vetting history
export async function getVettingHistory(influencerId: string) {
  const { data, error } = await getAdminClient()
    .from('vetting_history')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Calculate brand safety score
export async function calculateBrandSafetyScore(influencerId: string) {
  const { data, error } = await getAdminClient().rpc('calculate_brand_safety_score', {
    p_influencer_id: influencerId,
  });

  if (error) throw error;
  return data;
}
