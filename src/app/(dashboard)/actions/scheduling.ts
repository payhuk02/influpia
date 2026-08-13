'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create scheduled content
export async function createScheduledContent(contentData: {
  user_id: string;
  campaign_id?: string;
  content_type: 'post' | 'story' | 'reel' | 'video' | 'article';
  platform: string;
  scheduled_for: string;
  content_data: Record<string, any>;
  caption?: string;
  media_urls?: string[];
  tags?: string[];
}) {
  const { data, error } = await supabase
    .from('scheduled_content')
    .insert({
      ...contentData,
      status: 'scheduled',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/calendar');
  return data;
}

// Get scheduled content for user
export async function getScheduledContent(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('scheduled_content')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_for', { ascending: true });

  if (startDate) {
    query = query.gte('scheduled_for', startDate);
  }
  if (endDate) {
    query = query.lte('scheduled_for', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Update scheduled content status
export async function updateScheduledContentStatus(contentId: string, status: 'draft' | 'scheduled' | 'posted' | 'failed' | 'cancelled') {
  const updateData: any = { status, updated_at: new Date().toISOString() };

  if (status === 'posted') {
    updateData.posted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('scheduled_content')
    .update(updateData)
    .eq('id', contentId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/calendar');
  return data;
}

// Get content calendar entries
export async function getContentCalendarEntries(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0).toISOString();

  const { data, error } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('user_id', userId)
    .gte('calendar_date', startDate)
    .lte('calendar_date', endDate)
    .order('calendar_date', { ascending: true });

  if (error) throw error;
  return data;
}

// Create content template
export async function createContentTemplate(templateData: {
  user_id: string;
  template_name: string;
  template_type: 'post' | 'story' | 'reel' | 'video' | 'article';
  platform: string;
  template_data: Record<string, any>;
  default_caption?: string;
  tags?: string[];
}) {
  const { data, error } = await supabase
    .from('content_templates')
    .insert({
      ...templateData,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/calendar');
  return data;
}

// Get content templates
export async function getContentTemplates(userId: string) {
  const { data, error } = await supabase
    .from('content_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get scheduling rules
export async function getSchedulingRules(userId: string) {
  const { data, error } = await supabase
    .from('scheduling_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

// Create scheduling rule
export async function createSchedulingRule(ruleData: {
  user_id: string;
  rule_name: string;
  platform: string;
  days_of_week: number[];
  time_slots: string[];
  content_types: string[];
  min_posts_per_day?: number;
  max_posts_per_day?: number;
}) {
  const { data, error } = await supabase
    .from('scheduling_rules')
    .insert({
      ...ruleData,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/calendar');
  return data;
}

// Get content approvals
export async function getContentApprovals(userId: string) {
  const { data, error } = await supabase
    .from('content_approvals')
    .select('*')
    .eq('requested_by', userId)
    .or(`requested_by.eq.${userId},reviewer_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Request content approval
export async function requestContentApproval(contentId: string, reviewerId: string, requestedBy: string) {
  const { data, error } = await supabase
    .from('content_approvals')
    .insert({
      content_id: contentId,
      reviewer_id: reviewerId,
      requested_by: requestedBy,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/calendar');
  return data;
}

// Approve content
export async function approveContent(approvalId: string, approvedBy: string, notes?: string) {
  const { data, error } = await supabase
    .from('content_approvals')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      approval_notes: notes,
    })
    .eq('id', approvalId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/calendar');
  return data;
}

// Reject content
export async function rejectContent(approvalId: string, rejectedBy: string, reason: string) {
  const { data, error } = await supabase
    .from('content_approvals')
    .update({
      status: 'rejected',
      rejected_by: rejectedBy,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', approvalId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/calendar');
  return data;
}

// Get content analytics
export async function getContentAnalytics(contentId: string) {
  const { data, error } = await supabase
    .from('content_analytics')
    .select('*')
    .eq('content_id', contentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Update content analytics
export async function updateContentAnalytics(contentId: string, analyticsData: {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  impressions?: number;
}) {
  const { data, error } = await supabase
    .from('content_analytics')
    .upsert({
      content_id: contentId,
      ...analyticsData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/calendar');
  return data;
}
