'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { readList, readOne } from '@/utils/supabase/safe-read';
import { revalidatePath } from 'next/cache';

// Create dispute
export async function createDispute(disputeData: {
  collaboration_id: string;
  raised_by: string;
  raised_against: string;
  dispute_type: 'quality' | 'delivery' | 'payment' | 'communication' | 'other';
  title: string;
  description: string;
  evidence_urls?: string[];
}) {
  const { data, error } = await getAdminClient()
    .from('disputes')
    .insert({
      ...disputeData,
      status: 'open',
      priority: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  
  // Log timeline
  await getAdminClient().from('dispute_timeline').insert({
    dispute_id: data.id,
    action: 'created',
    actor_id: disputeData.raised_by,
    actor_type: 'brand',
    new_status: 'open',
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/disputes');
  return data;
}

// Get disputes for user
export async function getUserDisputes(userId: string) {
  return readList('getUserDisputes', (supabase) =>
    supabase
      .from('disputes')
      .select(`
        *,
        collaboration:collaborations(id, agreed_amount, brand_id, influencer_id)
      `)
      .order('created_at', { ascending: false })
  );
}

// Get dispute by ID
export async function getDisputeById(disputeId: string) {
  const { data, error } = await getAdminClient()
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .single();

  if (error) throw error;
  return data;
}

// Get dispute messages
export async function getDisputeMessages(disputeId: string) {
  const { data, error } = await getAdminClient()
    .from('dispute_messages')
    .select('*')
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Add dispute message
export async function addDisputeMessage(
  disputeId: string,
  senderId: string,
  senderType: 'brand' | 'influencer' | 'admin' | 'moderator',
  message: string,
  isInternal: boolean = false,
  attachments: string[] = []
) {
  const { data, error } = await getAdminClient()
    .from('dispute_messages')
    .insert({
      dispute_id: disputeId,
      sender_id: senderId,
      sender_type: senderType,
      message,
      is_internal: isInternal,
      attachments,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  
  // Log timeline
  await getAdminClient().from('dispute_timeline').insert({
    dispute_id: disputeId,
    action: 'message_added',
    actor_id: senderId,
    actor_type: senderType,
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/disputes');
  return data;
}

// Get dispute timeline
export async function getDisputeTimeline(disputeId: string) {
  const { data, error } = await getAdminClient()
    .from('dispute_timeline')
    .select('*')
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Update dispute status
export async function updateDisputeStatus(
  disputeId: string,
  newStatus: 'open' | 'under_review' | 'mediating' | 'resolved' | 'escalated' | 'closed',
  actorId: string,
  actorType: 'admin' | 'moderator'
) {
  const { data, error } = await getAdminClient()
    .from('disputes')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;

  // Log timeline
  await getAdminClient().from('dispute_timeline').insert({
    dispute_id: disputeId,
    action: 'status_changed',
    actor_id: actorId,
    actor_type: actorType,
    new_status: newStatus,
    previous_status: data.status,
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/disputes');
  return data;
}

// Escalate dispute
export async function escalateDispute(disputeId: string, reason: string) {
  const { data, error } = await getAdminClient()
    .from('disputes')
    .update({
      status: 'escalated',
      escalated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;

  // Log timeline
  await getAdminClient().from('dispute_timeline').insert({
    dispute_id: disputeId,
    action: 'escalated',
    actor_type: 'system',
    new_status: 'escalated',
    notes: reason,
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/disputes');
  return data;
}

// Resolve dispute
export async function resolveDispute(
  disputeId: string,
  resolutionType: 'refund' | 'partial_refund' | 'rework' | 'compensation' | 'no_action',
  resolutionDetails: string,
  resolvedBy: string
) {
  const { data, error } = await getAdminClient()
    .from('disputes')
    .update({
      status: 'resolved',
      resolution_type: resolutionType,
      resolution_details: resolutionDetails,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;

  // Log timeline
  await getAdminClient().from('dispute_timeline').insert({
    dispute_id: disputeId,
    action: 'resolved',
    actor_id: resolvedBy,
    actor_type: 'admin',
    new_status: 'resolved',
    notes: resolutionDetails,
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/disputes');
  return data;
}

// Get refund transactions
export async function getRefundTransactions(disputeId?: string) {
  let query = getAdminClient().from('refund_transactions').select('*');
  
  if (disputeId) {
    query = query.eq('dispute_id', disputeId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Process refund
export async function processRefund(
  disputeId: string,
  collaborationId: string,
  refundAmountCents: number,
  refundType: 'full' | 'partial',
  refundReason: string,
  provider: 'fedapay' | 'stripe' | 'moneyfusion'
) {
  const { data, error } = await getAdminClient()
    .from('refund_transactions')
    .insert({
      dispute_id: disputeId,
      collaboration_id: collaborationId,
      refund_amount_cents: refundAmountCents,
      refund_type: refundType,
      refund_reason: refundReason,
      status: 'pending',
      provider,
      platform_fee_cents: Math.round(refundAmountCents * 0.05),
      net_refund_cents: Math.round(refundAmountCents * 0.95),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/disputes');
  return data;
}

// Appeal dispute
export async function appealDispute(disputeId: string, userId: string, appealReason: string) {
  const { data, error } = await getAdminClient()
    .from('disputes')
    .update({
      appealed_by: userId,
      appealed_at: new Date().toISOString(),
      appeal_reason: appealReason,
      appeal_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/disputes');
  return data;
}

// Review appeal
export async function reviewAppeal(
  disputeId: string,
  reviewedBy: string,
  approved: boolean,
  notes?: string
) {
  const { data, error } = await getAdminClient()
    .from('disputes')
    .update({
      appeal_status: approved ? 'approved' : 'rejected',
      appeal_reviewed_by: reviewedBy,
      appeal_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;

  // Log timeline
  await getAdminClient().from('dispute_timeline').insert({
    dispute_id: disputeId,
    action: approved ? 'appeal_approved' : 'appeal_rejected',
    actor_id: reviewedBy,
    actor_type: 'admin',
    notes,
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/disputes');
  return data;
}
