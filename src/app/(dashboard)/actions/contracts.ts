'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

// Get contract templates
export async function getContractTemplates() {
  const { data, error } = await getAdminClient()
    .from('contract_templates')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Generate contract from template
export async function generateContractFromTemplate(templateId: string, variables: Record<string, any>) {
  const { data, error } = await getAdminClient().rpc('generate_contract_from_template', {
    p_template_id: templateId,
    p_variables: variables,
  });

  if (error) throw error;
  revalidatePath('/dashboard/contracts');
  return data;
}

// Get contracts for a user
export async function getUserContracts(userId: string, role: 'brand' | 'influencer') {
  const column = role === 'brand' ? 'brand_id' : 'influencer_id';
  
  const { data, error } = await getAdminClient()
    .from('contracts')
    .select(`
      *,
      template:contract_templates(name, description),
      collaboration:collaborations(id, agreed_amount, status)
    `)
    .eq(column, userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get contract by ID
export async function getContractById(contractId: string) {
  const { data, error } = await getAdminClient()
    .from('contracts')
    .select(`
      *,
      template:contract_templates(name, description),
      collaboration:collaborations(id, agreed_amount, status),
      brand:brands(company_name),
      influencer:influencers(display_name)
    `)
    .eq('id', contractId)
    .single();

  if (error) throw error;
  return data;
}

// Sign contract
export async function signContract(contractId: string, userId: string, role: 'brand' | 'influencer') {
  const column = role === 'brand' ? 'brand_signed_at' : 'influencer_signed_at';
  const signatureColumn = role === 'brand' ? 'brand_signature_id' : 'influencer_signature_id';
  
  const { data, error } = await getAdminClient()
    .from('contracts')
    .update({
      [column]: new Date().toISOString(),
      [signatureColumn]: userId,
      status: 'signed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/contracts');
  return data;
}

// Get milestones for a contract
export async function getContractMilestones(contractId: string) {
  const { data, error } = await getAdminClient()
    .from('milestones')
    .select('*')
    .eq('contract_id', contractId)
    .order('milestone_number', { ascending: true });

  if (error) throw error;
  return data;
}

// Create default milestones for a contract
export async function createDefaultMilestones(contractId: string) {
  const { data, error } = await getAdminClient().rpc('create_default_milestones', {
    p_contract_id: contractId,
  });

  if (error) throw error;
  revalidatePath('/dashboard/contracts');
  return data;
}

// Update milestone status
export async function updateMilestoneStatus(
  milestoneId: string,
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'paid',
  rejectionReason?: string
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'submitted') {
    updateData.submitted_at = new Date().toISOString();
  } else if (status === 'approved') {
    updateData.approved_at = new Date().toISOString();
  } else if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  } else if (status === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  const { data, error } = await getAdminClient()
    .from('milestones')
    .update(updateData)
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/contracts');
  return data;
}

// Get contract amendments
export async function getContractAmendments(contractId: string) {
  const { data, error } = await getAdminClient()
    .from('contract_amendments')
    .select('*')
    .eq('contract_id', contractId)
    .order('amendment_number', { ascending: false });

  if (error) throw error;
  return data;
}

// Request contract amendment
export async function requestAmendment(
  contractId: string,
  amendmentType: 'modification' | 'extension' | 'termination' | 'addition',
  reason: string,
  changes: Record<string, any>,
  requestedBy: string
) {
  const { data, error } = await getAdminClient()
    .from('contract_amendments')
    .insert({
      contract_id: contractId,
      amendment_type: amendmentType,
      reason,
      changes,
      requested_by: requestedBy,
      status: 'pending_approval',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/contracts');
  return data;
}

// Approve amendment
export async function approveAmendment(amendmentId: string, approvedBy: string) {
  const { data, error } = await getAdminClient()
    .from('contract_amendments')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      effective_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', amendmentId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/contracts');
  return data;
}

// Get contract notifications
export async function getContractNotifications(userId: string) {
  const { data, error } = await getAdminClient()
    .from('contract_notifications')
    .select('*')
    .eq('recipient_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await getAdminClient()
    .from('contract_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw error;
  revalidatePath('/dashboard/contracts');
}
