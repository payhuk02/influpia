// ============================================================
// Dispute Resolution Types
// ============================================================

export interface Dispute {
  id: string;
  collaboration_id: string;
  raised_by: string;
  raised_against: string;
  dispute_type: 'quality' | 'delivery' | 'payment' | 'communication' | 'other';
  title: string;
  description: string;
  status: 'open' | 'under_review' | 'mediating' | 'resolved' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidence_urls: string[];
  resolution_type?: 'refund' | 'partial_refund' | 'rework' | 'compensation' | 'no_action';
  resolution_details?: string;
  escalated_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  sender_type: 'brand' | 'influencer' | 'admin' | 'moderator';
  message: string;
  is_internal: boolean;
  attachments: string[];
  created_at: string;
}

export interface DisputeTimeline {
  id: string;
  dispute_id: string;
  action: 'created' | 'status_changed' | 'message_added' | 'evidence_added' | 'escalated' | 'resolved' | 'closed';
  actor_id: string;
  actor_type: 'brand' | 'influencer' | 'admin' | 'system';
  previous_status?: string;
  new_status?: string;
  notes?: string;
  created_at: string;
}

export interface EscalationRule {
  id: string;
  escalation_condition: 'time_elapsed' | 'severity' | 'user_request';
  time_threshold_hours?: number;
  severity_level?: 'high' | 'critical';
  escalate_to: 'admin' | 'senior_moderator' | 'external_mediator';
  auto_escalate: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RefundTransaction {
  id: string;
  dispute_id: string;
  collaboration_id: string;
  refund_amount_cents: number;
  currency: string;
  refund_type: 'full' | 'partial';
  refund_reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: 'fedapay' | 'stripe' | 'moneyfusion';
  provider_transaction_id?: string;
  platform_fee_cents: number;
  net_refund_cents: number;
  processed_by?: string;
  processed_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}
