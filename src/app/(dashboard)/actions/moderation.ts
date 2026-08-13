'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Submit content for moderation
export async function submitForModeration(contentData: {
  content_type: 'campaign' | 'influencer_profile' | 'message' | 'deliverable' | 'review' | 'comment';
  content_id: string;
  content_data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}) {
  const { data, error } = await supabase
    .from('moderation_queue')
    .insert({
      ...contentData,
      moderation_status: 'pending',
      priority: contentData.priority || 'normal',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  
  // Run auto-moderation
  await runAutoModeration(data.id);
  
  revalidatePath('/dashboard/moderation');
  return data;
}

// Get moderation queue
export async function getModerationQueue(status?: string, limit: number = 50) {
  let query = supabase
    .from('moderation_queue')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('moderation_status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Run auto-moderation
export async function runAutoModeration(queueId: string) {
  const { error } = await supabase.rpc('run_auto_moderation', {
    p_queue_id: queueId,
  });

  if (error) throw error;
  revalidatePath('/dashboard/moderation');
}

// Manual moderation action
export async function manualModerationAction(
  queueId: string,
  action: 'approve' | 'reject' | 'request_changes' | 'escalate',
  reviewerId: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('moderation_queue')
    .update({
      moderation_status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'escalate' ? 'escalated' : 'flagged',
      manual_reviewer_id: reviewerId,
      manual_moderation_action: action,
      manual_notes: notes,
      manual_review_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', queueId)
    .select()
    .single();

  if (error) throw error;

  // Log action
  await supabase.from('moderation_actions_log').insert({
    moderation_queue_id: queueId,
    action_type: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action,
    actor_id: reviewerId,
    actor_type: 'moderator',
    new_status: data.moderation_status,
    action_details: { notes },
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/moderation');
  return data;
}

// Get moderation rules
export async function getModerationRules() {
  const { data, error } = await supabase
    .from('moderation_rules')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Create moderation rule
export async function createModerationRule(ruleData: {
  rule_name: string;
  rule_type: 'keyword' | 'ai_model' | 'image_recognition' | 'link_check' | 'spam_detection';
  content_types: string[];
  conditions: Record<string, any>;
  action: 'flag' | 'auto_reject' | 'auto_approve' | 'require_review';
  severity: 'low' | 'medium' | 'high' | 'critical';
}) {
  const { data, error } = await supabase
    .from('moderation_rules')
    .insert({
      ...ruleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/moderation');
  return data;
}

// Get blocked content
export async function getBlockedContent() {
  const { data, error } = await supabase
    .from('blocked_content')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Add blocked content
export async function addBlockedContent(blockedData: {
  content_type: 'keyword' | 'domain' | 'phone' | 'email' | 'image_hash';
  blocked_value: string;
  reason?: string;
  is_regex?: boolean;
  case_sensitive?: boolean;
}) {
  const { data, error } = await supabase
    .from('blocked_content')
    .insert({
      ...blockedData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/moderation');
  return data;
}

// Get user moderation history
export async function getUserModerationHistory(userId: string) {
  const { data, error } = await supabase
    .from('user_moderation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

// Record user violation
export async function recordUserViolation(
  userId: string,
  violationType: string,
  notes?: string
) {
  const { error } = await supabase.rpc('record_user_violation', {
    p_user_id: userId,
    p_violation_type: violationType,
    p_notes: notes,
  });

  if (error) throw error;
  revalidatePath('/dashboard/moderation');
}

// Get moderation report
export async function getModerationReport(date: string) {
  const { data, error } = await supabase
    .from('moderation_reports')
    .select('*')
    .eq('report_date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Generate moderation report
export async function generateModerationReport(date: string) {
  const { error } = await supabase.rpc('generate_moderation_report', {
    p_report_date: date,
  });

  if (error) throw error;
  revalidatePath('/dashboard/moderation');
}

// Get moderation actions log
export async function getModerationActionsLog(queueId?: string, limit: number = 100) {
  let query = supabase
    .from('moderation_actions_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (queueId) {
    query = query.eq('moderation_queue_id', queueId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Appeal moderation decision
export async function appealModeration(queueId: string, userId: string, appealReason: string) {
  const { data, error } = await supabase
    .from('moderation_queue')
    .update({
      appealed_by: userId,
      appealed_at: new Date().toISOString(),
      appeal_reason: appealReason,
      appeal_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', queueId)
    .select()
    .single();

  if (error) throw error;

  // Log action
  await supabase.from('moderation_actions_log').insert({
    moderation_queue_id: queueId,
    action_type: 'appealed',
    actor_id: userId,
    actor_type: 'user',
    action_details: { appeal_reason },
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/moderation');
  return data;
}

// Review appeal
export async function reviewAppeal(
  queueId: string,
  reviewedBy: string,
  approved: boolean,
  notes?: string
) {
  const { data, error } = await supabase
    .from('moderation_queue')
    .update({
      appeal_status: approved ? 'approved' : 'rejected',
      appeal_reviewed_by: reviewedBy,
      appeal_reviewed_at: new Date().toISOString(),
      moderation_status: approved ? 'approved' : 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', queueId)
    .select()
    .single();

  if (error) throw error;

  // Log action
  await supabase.from('moderation_actions_log').insert({
    moderation_queue_id: queueId,
    action_type: approved ? 'appeal_approved' : 'appeal_rejected',
    actor_id: reviewedBy,
    actor_type: 'moderator',
    action_details: { notes },
    created_at: new Date().toISOString(),
  });

  revalidatePath('/dashboard/moderation');
  return data;
}
