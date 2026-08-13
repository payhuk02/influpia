'use server';

import { getAdminClient } from '@/utils/supabase/admin';
import { readList, readOne } from '@/utils/supabase/safe-read';
import { revalidatePath } from 'next/cache';

// Get user XP
export async function getUserXP(userId: string): Promise<any | null> {
  return readOne(
    'getUserXP',
    (supabase) =>
      supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', userId)
        .single(),
    { notFoundOk: true }
  );
}

// Add XP to user
export async function addUserXP(userId: string, xpAmount: number, source: string, sourceId?: string) {
  const { data, error } = await getAdminClient().rpc('add_user_xp', {
    p_user_id: userId,
    p_xp_amount: xpAmount,
    p_source: source,
    p_source_id: sourceId,
  });

  if (error) throw error;
  revalidatePath('/dashboard/gamification');
  return data;
}

// Get user badges
export async function getUserBadges(userId: string) {
  return readList('getUserBadges', (supabase) =>
    supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .eq('is_displayed', true)
      .order('earned_at', { ascending: false })
  );
}

// Get all available badges
export async function getAllBadges() {
  const { data, error } = await getAdminClient()
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('rarity', { ascending: false });

  if (error) throw error;
  return data;
}

// Check badge eligibility
export async function checkBadgeEligibility(userId: string) {
  const { error } = await getAdminClient().rpc('check_badge_eligibility', {
    p_user_id: userId,
  });

  if (error) throw error;
  revalidatePath('/dashboard/gamification');
}

// Update daily streak
export async function updateDailyStreak(userId: string) {
  const { error } = await getAdminClient().rpc('update_daily_streak', {
    p_user_id: userId,
  });

  if (error) throw error;
  revalidatePath('/dashboard/gamification');
}

// Get leaderboard
export async function getLeaderboard(leaderboardName: string, limit: number = 50) {
  return readList('getLeaderboard', async (supabase) => {
    const { data: leaderboard } = await supabase
      .from('leaderboards')
      .select('id')
      .eq('name', leaderboardName)
      .maybeSingle();

    if (!leaderboard) return { data: [], error: null };

    return supabase
      .from('leaderboard_entries')
      .select(`
        *,
        leaderboard:leaderboards(name, display_name)
      `)
      .eq('leaderboard_id', leaderboard.id)
      .order('rank', { ascending: true })
      .limit(limit);
  });
}

// Refresh leaderboard
export async function refreshLeaderboard(leaderboardId: string) {
  const { error } = await getAdminClient().rpc('refresh_leaderboard', {
    p_leaderboard_id: leaderboardId,
  });

  if (error) throw error;
}

// Get user achievements progress
export async function getUserAchievements(userId: string) {
  return readList('getUserAchievements', (supabase) =>
    supabase
      .from('user_achievement_progress')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );
}

// Get available achievements
export async function getAvailableAchievements() {
  const { data, error } = await getAdminClient()
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('achievement_type', { ascending: true });

  if (error) throw error;
  return data;
}

// Get user levels
export async function getUserLevels() {
  return readList('getUserLevels', (supabase) =>
    supabase
      .from('user_levels')
      .select('*')
      .order('level', { ascending: true })
  );
}

// Claim achievement reward
export async function claimAchievementReward(progressId: string) {
  const { error } = await getAdminClient()
    .from('user_achievement_progress')
    .update({
      reward_claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', progressId);

  if (error) throw error;
  revalidatePath('/dashboard/gamification');
}
