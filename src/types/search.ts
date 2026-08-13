// ============================================================
// Advanced Search Types
// ============================================================

export interface SavedSearch {
  id: string;
  user_id: string;
  search_name: string;
  search_type: 'campaign' | 'influencer' | 'collaboration';
  filters: Record<string, any>;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  is_alert_enabled: boolean;
  alert_frequency: 'instant' | 'daily' | 'weekly';
  last_alert_sent_at?: string;
  result_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  search_query: string;
  search_type: 'campaign' | 'influencer' | 'collaboration';
  filters: Record<string, any>;
  results_count: number;
  clicked_result_id?: string;
  search_duration_ms: number;
  zero_results: boolean;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  recommendation_type: 'influencer' | 'campaign' | 'collaboration';
  target_entity_id: string;
  recommended_entity_id: string;
  confidence_score: number;
  match_reason: string[];
  metadata: Record<string, any>;
  is_dismissed: boolean;
  is_accepted: boolean;
  viewed_at?: string;
  created_at: string;
}

export interface SearchFacet {
  id: string;
  facet_name: string;
  facet_type: 'range' | 'select' | 'multi_select' | 'boolean';
  facet_config: Record<string, any>;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchAnalytics {
  id: string;
  search_date: string;
  search_type: 'campaign' | 'influencer' | 'collaboration';
  total_searches: number;
  unique_searches: number;
  zero_result_searches: number;
  avg_search_duration_ms: number;
  top_filters: Record<string, number>;
  top_sort_options: Record<string, number>;
  created_at: string;
}

export interface SearchFilters {
  niches?: string[];
  platforms?: string[];
  follower_range?: { min: number; max: number };
  engagement_rate_range?: { min: number; max: number };
  price_range?: { min: number; max: number };
  location?: string[];
  language?: string[];
  verified_only?: boolean;
  has_kyc?: boolean;
  rating_min?: number;
  delivery_time_max?: number;
}
