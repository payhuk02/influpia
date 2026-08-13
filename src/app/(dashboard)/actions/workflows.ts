'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

// Get workflow templates
export async function getWorkflowTemplates() {
  const { data, error } = await getAdminClient()
    .from('workflow_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Create workflow definition from template
export async function createWorkflowFromTemplate(templateId: string, userId: string, workflowName: string) {
  const { data, error } = await getAdminClient().rpc('create_workflow_from_template', {
    p_template_id: templateId,
    p_user_id: userId,
    p_workflow_name: workflowName,
  });

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
  return data;
}

// Get workflow definitions for user
export async function getWorkflowDefinitions(userId: string) {
  const { data, error } = await getAdminClient()
    .from('workflow_definitions')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get workflow by ID
export async function getWorkflowById(workflowId: string) {
  const { data, error } = await getAdminClient()
    .from('workflow_definitions')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (error) throw error;
  return data;
}

// Get workflow steps
export async function getWorkflowSteps(workflowId: string) {
  const { data, error } = await getAdminClient()
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('step_order', { ascending: true });

  if (error) throw error;
  return data;
}

// Create workflow step
export async function createWorkflowStep(stepData: {
  workflow_id: string;
  step_name: string;
  step_type: 'action' | 'condition' | 'delay' | 'notification' | 'integration' | 'approval';
  step_config: Record<string, any>;
  step_order: number;
}) {
  const { data, error } = await getAdminClient()
    .from('workflow_steps')
    .insert({
      ...stepData,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
  return data;
}

// Update workflow step
export async function updateWorkflowStep(stepId: string, stepData: Record<string, any>) {
  const { data, error } = await getAdminClient()
    .from('workflow_steps')
    .update({
      ...stepData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stepId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
  return data;
}

// Delete workflow step
export async function deleteWorkflowStep(stepId: string) {
  const { error } = await getAdminClient()
    .from('workflow_steps')
    .delete()
    .eq('id', stepId);

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
}

// Trigger workflow
export async function triggerWorkflow(workflowId: string, triggerData: Record<string, any>) {
  const { data, error } = await getAdminClient().rpc('trigger_workflow', {
    p_workflow_id: workflowId,
    p_trigger_data: triggerData,
  });

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
  return data;
}

// Get workflow instances
export async function getWorkflowInstances(workflowId: string, status?: string) {
  let query = getAdminClient()
    .from('workflow_instances')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Get workflow execution logs
export async function getWorkflowExecutionLogs(instanceId: string) {
  const { data, error } = await getAdminClient()
    .from('workflow_execution_logs')
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Get workflow triggers
export async function getWorkflowTriggers(workflowId: string) {
  const { data, error } = await getAdminClient()
    .from('workflow_triggers')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

// Create workflow trigger
export async function createWorkflowTrigger(triggerData: {
  workflow_id: string;
  trigger_type: 'manual' | 'schedule' | 'event' | 'webhook' | 'condition';
  trigger_config: Record<string, any>;
}) {
  const { data, error } = await getAdminClient()
    .from('workflow_triggers')
    .insert({
      ...triggerData,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
  return data;
}

// Get workflow actions
export async function getWorkflowActions(workflowId: string) {
  const { data, error } = await getAdminClient()
    .from('workflow_actions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Execute workflow action
export async function executeWorkflowAction(actionId: string, actionData: Record<string, any>) {
  const { data, error } = await getAdminClient().rpc('execute_workflow_action', {
    p_action_id: actionId,
    p_action_data: actionData,
  });

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
  return data;
}

// Activate workflow
export async function activateWorkflow(workflowId: string) {
  const { data, error } = await getAdminClient()
    .from('workflow_definitions')
    .update({
      is_active: true,
      activated_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
  return data;
}

// Deactivate workflow
export async function deactivateWorkflow(workflowId: string) {
  const { data, error } = await getAdminClient()
    .from('workflow_definitions')
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
  return data;
}

// Delete workflow
export async function deleteWorkflow(workflowId: string) {
  const { error } = await getAdminClient()
    .from('workflow_definitions')
    .delete()
    .eq('id', workflowId);

  if (error) throw error;
  revalidatePath('/dashboard/workflows');
}

// Get workflow summary
export async function getWorkflowSummary(workflowId: string) {
  const { data, error } = await getAdminClient().rpc('get_workflow_summary', {
    p_workflow_id: workflowId,
  });

  if (error) throw error;
  return data;
}
