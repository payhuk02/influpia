// ============================================================
// Content Moderation Types
// ============================================================

export interface ModerationQueue {
  id: string;
  content_type: 'campaign' | 'influencer_profile' | 'message' | 'deliverable' | 'review' | 'comment';
  content_id: string;
  content_data: Record<string, any>;
  moderation_status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'flagged' | 'escalated';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  auto_moderation_result: Record<string, any>;
  auto_moderation_score?: number;
  auto_moderation_reason?: string;
  manual_reviewer_id?: string;
  manual_review_started_at?: string;
  manual_review_completed_at?: string;
  manual_moderation_action?: 'approve' | 'reject' | 'request_changes' | 'escalate';
  manual_notes?: string;
  rejection_reason?: string;
  is_appealable: boolean;
  appealed_by?: string;
  appealed_at?: string;
  appeal_reason?: string;
  appeal_status?: 'pending' | 'under_review' | 'approved' | 'rejected';
  appeal_reviewed_by?: string;
  appeal_reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationRule {
  id: string;
  rule_name: string;
  rule_type: 'keyword' | 'ai_model' | 'image_recognition' | 'link_check' | 'spam_detection';
  content_types: string[];
  conditions: Record<string, any>;
  action: 'flag' | 'auto_reject' | 'auto_approve' | 'require_review';
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationReport {
  id: string;
  report_date: string;
  content_type: string;
  total_submitted: number;
  auto_approved: number;
  auto_rejected: number;
  manual_approved: number;
  manual_rejected: number;
  pending_review: number;
  avg_review_time_minutes?: number;
  top_rejection_reasons: any[];
  created_at: string;
}

export interface BlockedContent {
  id: string;
  content_type: 'keyword' | 'domain' | 'phone' | 'email' | 'image_hash';
  blocked_value: string;
  reason?: string;
  blocked_by?: string;
  is_regex: boolean;
  case_sensitive: boolean;
  expires_at?: string;
  created_at: string;
}

export interface UserModerationHistory {
  id: string;
  user_id: string;
  violation_type: string;
  violation_count: number;
  last_violation_at: string;
  current_status: 'clean' | 'warning' | 'probation' | 'suspended' | 'banned';
  suspension_until?: string;
  ban_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationActionsLog {
  id: string;
  moderation_queue_id?: string;
  action_type: 'auto_flagged' | 'manual_review_started' | 'approved' | 'rejected' | 'escalated' | 'appealed' | 'appeal_approved' | 'appeal_rejected';
  actor_id?: string;
  actor_type: 'system' | 'moderator' | 'admin' | 'auto_moderation';
  previous_status?: string;
  new_status?: string;
  action_details: Record<string, any>;
  created_at: string;
}
