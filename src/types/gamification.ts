// ============================================================
// Gamification System Types
// ============================================================

export interface UserLevel {
  id: string;
  level: number;
  level_name: string;
  min_xp: number;
  max_xp?: number;
  xp_multiplier: number;
  benefits: Record<string, any>;
  icon_url?: string;
  created_at: string;
}

export interface UserXP {
  user_id: string;
  current_xp: number;
  current_level: number;
  total_xp_earned: number;
  streak_days: number;
  last_activity_date?: string;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  xp_amount: number;
  xp_type: 'earned' | 'spent' | 'bonus' | 'penalty';
  source: string;
  source_id?: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon_url?: string;
  badge_category: 'achievement' | 'milestone' | 'special' | 'seasonal' | 'collaboration';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  requirements: Record<string, any>;
  is_active: boolean;
  is_secret: boolean;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_displayed: boolean;
  display_order: number;
}

export interface Leaderboard {
  id: string;
  name: string;
  display_name: string;
  description: string;
  leaderboard_type: 'xp' | 'collaborations' | 'earnings' | 'rating' | 'engagement';
  period_type: 'daily' | 'weekly' | 'monthly' | 'all_time';
  category?: 'global' | 'niche' | 'region';
  category_value?: string;
  is_active: boolean;
  refresh_interval_minutes: number;
  last_refreshed_at?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  rank: number;
  score: number;
  previous_rank?: number;
  metadata: Record<string, any>;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  display_name: string;
  description: string;
  achievement_type: 'daily' | 'weekly' | 'monthly' | 'one_time';
  xp_reward: number;
  currency_reward_cents: number;
  requirements: Record<string, any>;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface UserAchievementProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: Record<string, any>;
  is_completed: boolean;
  completed_at?: string;
  reward_claimed: boolean;
  claimed_at?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
}
