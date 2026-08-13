'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { readList, readOne } from '@/utils/supabase/safe-read';
import { revalidatePath } from 'next/cache';

// Generate affiliate code
export async function generateAffiliateCode(userId: string) {
  const { data, error } = await getAdminClient().rpc('generate_affiliate_code', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
}

// Get affiliate info for user
export async function getAffiliateInfo(userId: string): Promise<any | null> {
  return readOne(
    'getAffiliateInfo',
    (supabase) =>
      supabase
        .from('affiliates')
        .select(`
          *,
          program:affiliate_programs(*)
        `)
        .eq('user_id', userId)
        .single(),
    { notFoundOk: true }
  );
}

// Create affiliate application
export async function createAffiliateApplication(userId: string, programId: string) {
  const affiliateCode = await generateAffiliateCode(userId);

  const { data, error } = await getAdminClient()
    .from('affiliates')
    .insert({
      user_id: userId,
      program_id: programId,
      affiliate_code: affiliateCode,
      tier: 1,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/affiliate');
  return data;
}

// Get referral clicks
export async function getReferralClicks(affiliateId: string, limit: number = 50) {
  const { data, error } = await getAdminClient()
    .from('referral_clicks')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('clicked_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get commissions
export async function getCommissions(affiliateId: string, status?: string) {
  return readList('getCommissions', async (supabase) => {
    let query = supabase
      .from('commissions')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    return query;
  });
}

// Calculate commission
export async function calculateCommission(affiliateId: string, baseAmountCents: number, commissionType: string) {
  const { data, error } = await getAdminClient().rpc('calculate_commission', {
    p_affiliate_id: affiliateId,
    p_base_amount_cents: baseAmountCents,
    p_commission_type: commissionType,
  });

  if (error) throw error;
  return data;
}

// Create commission
export async function createCommission(
  affiliateId: string,
  referredUserId: string,
  commissionType: string,
  baseAmountCents: number,
  metadata: Record<string, any> = {}
) {
  const { data, error } = await getAdminClient().rpc('create_commission', {
    p_affiliate_id: affiliateId,
    p_referred_user_id: referredUserId,
    p_commission_type: commissionType,
    p_base_amount_cents: baseAmountCents,
    p_metadata: metadata,
  });

  if (error) throw error;
  revalidatePath('/dashboard/affiliate');
  return data;
}

// Check affiliate tier upgrade
export async function checkAffiliateTierUpgrade(affiliateId: string) {
  const { error } = await getAdminClient().rpc('check_affiliate_tier_upgrade', {
    p_affiliate_id: affiliateId,
  });

  if (error) throw error;
  revalidatePath('/dashboard/affiliate');
}

// Get affiliate payouts
export async function getAffiliatePayouts(affiliateId: string) {
  return readList('getAffiliatePayouts', (supabase) =>
    supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
  );
}

// Request payout
export async function requestPayout(affiliateId: string) {
  const affiliate = await getAdminClient()
    .from('affiliates')
    .select('current_balance_cents')
    .eq('id', affiliateId)
    .single();

  if (!affiliate.data) throw new Error('Affiliate not found');

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - 30);

  const { data, error } = await getAdminClient().rpc('process_affiliate_payout', {
    p_affiliate_id: affiliateId,
    p_period_start: periodStart.toISOString().split('T')[0],
    p_period_end: now.toISOString().split('T')[0],
  });

  if (error) throw error;
  revalidatePath('/dashboard/affiliate');
  return data;
}

// Get affiliate metrics
export async function getAffiliateMetrics(affiliateId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return readList('getAffiliateMetrics', (supabase) =>
    supabase
      .from('affiliate_metrics')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })
  );
}

// Get tier rules
export async function getTierRules(programId: string) {
  if (!programId) return [];
  return readList('getTierRules', (supabase) =>
    supabase
      .from('affiliate_tier_rules')
      .select('*')
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('tier_level', { ascending: true })
  );
}

// Get affiliate programs
export async function getAffiliatePrograms() {
  const { data, error } = await getAdminClient()
    .from('affiliate_programs')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data;
}
