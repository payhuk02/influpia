'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

// Get report templates
export async function getReportTemplates() {
  const { data, error } = await getAdminClient()
    .from('report_templates')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Generate report
export async function createReport(reportData: {
  user_id: string;
  template_id?: string;
  report_name: string;
  report_type: string;
  parameters: Record<string, any>;
  file_format?: 'pdf' | 'xlsx' | 'csv';
}) {
  const { data, error } = await getAdminClient().rpc('create_report', {
    p_user_id: reportData.user_id,
    p_template_id: reportData.template_id,
    p_report_name: reportData.report_name,
    p_report_type: reportData.report_type,
    p_parameters: reportData.parameters,
    p_file_format: reportData.file_format || 'pdf',
  });

  if (error) throw error;
  revalidatePath('/dashboard/reports');
  return data;
}

// Get generated reports for user
export async function getGeneratedReports(userId: string) {
  const { data, error } = await getAdminClient()
    .from('generated_reports')
    .select(`
      *,
      template:report_templates(name, display_name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Generate campaign performance report
export async function generateCampaignPerformanceReport(
  userId: string,
  campaignId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await getAdminClient().rpc('generate_campaign_performance_report', {
    p_user_id: userId,
    p_campaign_id: campaignId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  revalidatePath('/dashboard/reports');
  return data;
}

// Generate financial summary report
export async function generateFinancialSummaryReport(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await getAdminClient().rpc('generate_financial_summary_report', {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  revalidatePath('/dashboard/reports');
  return data;
}

// Schedule report
export async function scheduleReport(scheduleData: {
  user_id: string;
  template_id?: string;
  report_name: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  schedule_config: Record<string, any>;
  parameters: Record<string, any>;
  output_format: 'pdf' | 'xlsx' | 'csv';
  delivery_method: 'email' | 'webhook' | 'both';
  recipients: string[];
}) {
  const { data, error } = await getAdminClient()
    .from('scheduled_reports')
    .insert({
      ...scheduleData,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/reports');
  return data;
}

// Get scheduled reports for user
export async function getScheduledReports(userId: string) {
  const { data, error } = await getAdminClient()
    .from('scheduled_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Process scheduled reports
export async function processScheduledReports() {
  const { error } = await getAdminClient().rpc('process_scheduled_reports');
  if (error) throw error;
}

// Share report
export async function shareReport(reportId: string, shareData: {
  shared_with?: string;
  share_type: 'user' | 'public_link' | 'email';
  permissions: Record<string, boolean>;
  expires_at?: string;
}) {
  const { data, error } = await getAdminClient().rpc('generate_report_share_token', {
    p_report_id: reportId,
    p_share_with: shareData.shared_with,
    p_share_type: shareData.share_type,
    p_permissions: shareData.permissions,
    p_expires_at: shareData.expires_at,
  });

  if (error) throw error;
  revalidatePath('/dashboard/reports');
  return data;
}

// Get report shares
export async function getReportShares(reportId: string) {
  const { data, error } = await getAdminClient()
    .from('report_shares')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Add report to favorites
export async function addReportFavorite(userId: string, reportId: string) {
  const { data, error } = await getAdminClient()
    .from('report_favorites')
    .insert({
      user_id: userId,
      report_id: reportId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/reports');
  return data;
}

// Remove report from favorites
export async function removeReportFavorite(userId: string, reportId: string) {
  const { error } = await getAdminClient()
    .from('report_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('report_id', reportId);

  if (error) throw error;
  revalidatePath('/dashboard/reports');
}

// Get favorite reports
export async function getFavoriteReports(userId: string) {
  const { data, error } = await getAdminClient()
    .from('report_favorites')
    .select(`
      *,
      report:generated_reports(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
