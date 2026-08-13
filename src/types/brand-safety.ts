// ============================================================
// Brand Safety & Influencer Vetting Types
// ============================================================

export interface BrandSafetyCategory {
  id: string;
  category_name: string;
  display_name: string;
  description?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  is_active: boolean;
  created_at: string;
}

export interface InfluencerVetting {
  id: string;
  influencer_id: string;
  vetting_type: 'initial' | 'periodic' | 'triggered' | 'manual';
  vetting_status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'requires_review';
  overall_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  vetted_by?: string;
  vetting_started_at?: string;
  vetting_completed_at?: string;
  next_vetting_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VettingCriterion {
  id: string;
  criterion_name: string;
  display_name: string;
  description?: string;
  criterion_type: 'engagement_rate' | 'follower_growth' | 'content_quality' | 'audience_authenticity' | 'brand_safety' | 'professionalism';
  weight: number;
  passing_threshold: number;
  evaluation_method: 'automated' | 'manual' | 'hybrid';
  is_active: boolean;
  created_at: string;
}

export interface VettingResult {
  id: string;
  vetting_id: string;
  criterion_id: string;
  score: number;
  passed: boolean;
  details: Record<string, any>;
  evaluated_by?: string;
  evaluated_at: string;
}

export interface BrandSafetyCheck {
  id: string;
  influencer_id: string;
  check_type: 'content_scan' | 'audience_analysis' | 'manual_review';
  check_date: string;
  categories_flagged: string[];
  overall_risk_level?: 'low' | 'medium' | 'high' | 'critical';
  flagged_content_urls: string[];
  notes?: string;
  reviewed_by?: string;
  created_at: string;
}

export interface VerificationDocument {
  id: string;
  influencer_id: string;
  document_type: 'id_card' | 'passport' | 'tax_id' | 'address_proof' | 'social_media_proof' | 'other';
  document_url: string;
  document_name?: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  verified_by?: string;
  verified_at?: string;
  expires_at?: string;
  rejection_reason?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BrandSafetyPreferences {
  id: string;
  brand_id: string;
  blocked_categories: string[];
  min_engagement_rate?: number;
  min_follower_count?: number;
  max_follower_count?: number;
  required_languages?: string[];
  blocked_keywords?: string[];
  require_verified: boolean;
  require_kyc: boolean;
  created_at: string;
  updated_at: string;
}

export interface VettingHistory {
  id: string;
  influencer_id: string;
  action: 'vetting_started' | 'vetting_completed' | 'status_changed' | 'document_uploaded' | 'document_verified';
  previous_status?: string;
  new_status?: string;
  performed_by?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BrandSafetyMatchResult {
  matches: boolean;
  reasons: string[];
}
