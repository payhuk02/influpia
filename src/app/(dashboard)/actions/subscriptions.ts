'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

// Get subscription plans
export async function getSubscriptionPlans() {
  const { data, error } = await getAdminClient()
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true });

  if (error) throw error;
  return data;
}

// Get user subscription
export async function getUserSubscription(userId: string) {
  const { data, error } = await getAdminClient()
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Check if user has feature access
export async function hasFeatureAccess(userId: string, featureKey: string) {
  const { data, error } = await getAdminClient().rpc('has_feature_access', {
    p_user_id: userId,
    p_feature_key: featureKey,
  });

  if (error) throw error;
  return data;
}

// Check usage limit
export async function checkUsageLimit(userId: string, metricType: string) {
  const { data, error } = await getAdminClient().rpc('check_usage_limit', {
    p_user_id: userId,
    p_metric_type: metricType,
  });

  if (error) throw error;
  return data;
}

// Record usage
export async function recordUsage(userId: string, metricType: string, amount: number = 1) {
  const { error } = await getAdminClient().rpc('record_usage', {
    p_user_id: userId,
    p_metric_type: metricType,
    p_amount: amount,
  });

  if (error) throw error;
  revalidatePath('/dashboard/subscription');
}

// Get usage tracking for user
export async function getUserUsage(userId: string) {
  const { data, error } = await getAdminClient()
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .order('reset_date', { ascending: false });

  if (error) throw error;
  return data;
}

// Create subscription
export async function createSubscription(
  userId: string,
  planId: string,
  provider: 'stripe' | 'fedapay' | 'manual'
) {
  const plan = await getAdminClient()
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (!plan.data) throw new Error('Plan not found');

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data, error } = await getAdminClient()
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      provider,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/subscription');
  return data;
}

// Upgrade/downgrade subscription
export async function changeSubscriptionPlan(userId: string, newPlanId: string) {
  const { data, error } = await getAdminClient()
    .from('user_subscriptions')
    .update({
      plan_id: newPlanId,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  
  // Log history
  await getAdminClient().from('subscription_history').insert({
    user_id: userId,
    subscription_id: data.id,
    action: 'upgraded',
    new_plan_id: newPlanId,
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/subscription');
  return data;
}

// Cancel subscription
export async function cancelSubscription(userId: string) {
  const { data, error } = await getAdminClient()
    .from('user_subscriptions')
    .update({
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  
  // Log history
  await getAdminClient().from('subscription_history').insert({
    user_id: userId,
    subscription_id: data.id,
    action: 'cancelled',
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/subscription');
  return data;
}

// Get subscription history
export async function getSubscriptionHistory(userId: string) {
  const { data, error } = await getAdminClient()
    .from('subscription_history')
    .select(`
      *,
      previous_plan:subscription_plans!subscription_history_previous_plan_id_fkey(name, display_name),
      new_plan:subscription_plans!subscription_history_new_plan_id_fkey(name, display_name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Purchase add-on
export async function purchaseAddOn(
  userId: string,
  addOnType: string,
  quantity: number,
  priceCents: number
) {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setMonth(validUntil.getMonth() + 1);

  const { data, error } = await getAdminClient()
    .from('add_on_purchases')
    .insert({
      user_id: userId,
      add_on_type: addOnType,
      quantity,
      price_cents: priceCents,
      valid_from: now.toISOString(),
      valid_until: validUntil.toISOString(),
      is_active: true,
      created_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/subscription');
  return data;
}

// Check subscription expiry
export async function checkSubscriptionExpiry() {
  const { error } = await getAdminClient().rpc('check_subscription_expiry');
  if (error) throw error;
}
