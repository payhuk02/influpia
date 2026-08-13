// ============================================================
// Contract & Collaboration Workflow Types
// ============================================================

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  template_type: 'collaboration' | 'nda' | 'service_agreement' | 'custom';
  template_content: string;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  template_id: string;
  collaboration_id?: string;
  brand_id: string;
  influencer_id: string;
  contract_type: 'collaboration' | 'nda' | 'service_agreement' | 'custom';
  status: 'draft' | 'pending_brand_signature' | 'pending_influencer_signature' | 'signed' | 'amended' | 'terminated' | 'expired';
  contract_content: string;
  filled_variables: Record<string, any>;
  brand_signature_id?: string;
  influencer_signature_id?: string;
  brand_signed_at?: string;
  influencer_signed_at?: string;
  effective_date: string;
  expiry_date?: string;
  termination_date?: string;
  termination_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  contract_id: string;
  collaboration_id: string;
  milestone_number: number;
  title: string;
  description: string;
  deliverables: string[];
  due_date: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractAmendment {
  id: string;
  contract_id: string;
  amendment_number: number;
  amendment_type: 'modification' | 'extension' | 'termination' | 'addition';
  reason: string;
  changes: Record<string, any>;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  requested_by: string;
  approved_by?: string;
  approved_at?: string;
  effective_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractNotification {
  id: string;
  contract_id: string;
  notification_type: 'signature_request' | 'signature_received' | 'milestone_due' | 'contract_expiry' | 'amendment_request';
  recipient_id: string;
  recipient_type: 'brand' | 'influencer';
  message: string;
  is_read: boolean;
  read_at?: string;
  due_date?: string;
  created_at: string;
}
