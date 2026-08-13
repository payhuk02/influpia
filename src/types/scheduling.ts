// ============================================================
// Content Scheduling Types
// ============================================================

export interface ScheduledContent {
  id: string;
  influencer_id: string;
  collaboration_id?: string;
  campaign_id?: string;
  content_type: 'post' | 'story' | 'reel' | 'video' | 'image' | 'carousel';
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin' | 'facebook';
  title: string;
  caption?: string;
  media_urls: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduled_for: string;
  timezone: string;
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled' | 'rescheduled';
  post_id?: string;
  post_url?: string;
  engagement_metrics: Record<string, number>;
  auto_post: boolean;
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentCalendar {
  id: string;
  user_id: string;
  calendar_date: string;
  content_count: number;
  platforms: string[];
  status_summary: Record<string, number>;
  created_at: string;
}

export interface ContentTemplate {
  id: string;
  user_id: string;
  template_name: string;
  template_type: 'post' | 'story' | 'reel' | 'video';
  platform: string;
  caption_template?: string;
  hashtag_suggestions: string[];
  media_requirements: Record<string, any>;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface SchedulingRule {
  id: string;
  user_id: string;
  platform: string;
  day_of_week: number;
  optimal_times: string[];
  min_interval_hours: number;
  max_posts_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentApproval {
  id: string;
  scheduled_content_id: string;
  requested_by?: string;
  requested_for_approval_by?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  changes_requested?: string[];
  created_at: string;
}

export interface ContentAnalytics {
  id: string;
  scheduled_content_id: string;
  snapshot_time: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
  engagement_rate: number;
  reach: number;
  impressions: number;
  created_at: string;
}

export interface ContentCalendarEntry {
  date: string;
  content_count: number;
  platforms: string[];
  scheduled: number;
  posted: number;
  failed: number;
  items: ScheduledContent[];
}
