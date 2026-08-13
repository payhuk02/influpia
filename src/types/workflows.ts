// ============================================================
// Automated Workflows Types
// ============================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  workflow_type: 'campaign_lifecycle' | 'onboarding' | 'engagement' | 'retention' | 'custom';
  trigger_type: 'campaign_created' | 'application_received' | 'collaboration_started' | 'milestone_completed' | 'payment_received' | 'manual';
  is_system: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDefinition {
  id: string;
  template_id: string;
  version: number;
  definition: {
    steps: WorkflowStep[];
    conditions?: Record<string, any>;
  };
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface WorkflowStep {
  action: string;
  config?: Record<string, any>;
  conditions?: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  template_id: string;
  definition_id?: string;
  trigger_entity_type: string;
  trigger_entity_id: string;
  triggered_by?: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  current_step: number;
  context_data: Record<string, any>;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecutionLog {
  id: string;
  workflow_instance_id: string;
  step_number: number;
  step_name: string;
  step_type: 'action' | 'condition' | 'delay' | 'notification' | 'webhook' | 'email';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface WorkflowAction {
  id: string;
  action_name: string;
  action_type: 'send_email' | 'send_notification' | 'update_status' | 'create_task' | 'call_webhook' | 'add_tag' | 'remove_tag' | 'delay' | 'condition';
  action_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface WorkflowTrigger {
  id: string;
  template_id: string;
  trigger_event: string;
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface WorkflowSummary {
  step_number: number;
  step_name: string;
  step_type: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
}
