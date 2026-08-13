-- ============================================================
-- Gamification System with Badges, Levels & Leaderboards
-- Comparable to Duolingo/StackOverflow gamification
-- ============================================================

-- 1. User Levels Table
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL UNIQUE,
  level_name TEXT NOT NULL,
  min_xp INTEGER NOT NULL,
  max_xp INTEGER,
  xp_multiplier DECIMAL(3,2) DEFAULT 1.0,
  benefits JSONB DEFAULT '{}', -- { "max_campaigns": 10, "priority_support": true }
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default levels
INSERT INTO public.user_levels (level, level_name, min_xp, max_xp, xp_multiplier, benefits) VALUES
  (1, 'Novice', 0, 999, 1.0, '{"max_campaigns": 3, "priority_support": false}'::jsonb),
  (2, 'Apprenti', 1000, 2999, 1.1, '{"max_campaigns": 5, "priority_support": false}'::jsonb),
  (3, 'Compétent', 3000, 6999, 1.2, '{"max_campaigns": 10, "priority_support": false}'::jsonb),
  (4, 'Expert', 7000, 14999, 1.3, '{"max_campaigns": 20, "priority_support": true}'::jsonb),
  (5, 'Maître', 15000, 29999, 1.4, '{"max_campaigns": 50, "priority_support": true}'::jsonb),
  (6, 'Légende', 30000, NULL, 1.5, '{"max_campaigns": -1, "priority_support": true, "verified_badge": true}'::jsonb)
ON CONFLICT (level) DO NOTHING;

-- 2. User XP Table
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_xp_level_idx ON public.user_xp(current_level DESC);

-- 3. XP Transactions (audit trail for XP)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  xp_type TEXT NOT NULL CHECK (xp_type IN ('earned', 'spent', 'bonus', 'penalty')),
  source TEXT NOT NULL, -- 'campaign_complete', 'profile_complete', 'referral', 'login_streak', etc.
  source_id UUID, -- Reference to related entity
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS xp_transactions_user_idx ON public.xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS xp_transactions_source_idx ON public.xp_transactions(source, source_id);

-- 4. Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  badge_category TEXT NOT NULL CHECK (badge_category IN ('achievement', 'milestone', 'special', 'seasonal', 'collaboration')),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward INTEGER DEFAULT 0,
  requirements JSONB NOT NULL DEFAULT '{}', -- { "type": "collaborations_count", "value": 10 }
  is_active BOOLEAN DEFAULT TRUE,
  is_secret BOOLEAN DEFAULT FALSE, -- Hidden until unlocked
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default badges
INSERT INTO public.badges (name, display_name, description, badge_category, rarity, xp_reward, requirements) VALUES
  ('first_collaboration', 'Première Collaboration', 'Complétez votre première collaboration', 'achievement', 'common', 100, '{"type": "collaborations_count", "value": 1}'::jsonb),
  ('ten_collaborations', 'Dix Collaborations', 'Complétez 10 collaborations', 'achievement', 'rare', 500, '{"type": "collaborations_count", "value": 10}'::jsonb),
  ('hundred_collaborations', 'Cent Collaborations', 'Complétez 100 collaborations', 'achievement', 'epic', 2000, '{"type": "collaborations_count", "value": 100}'::jsonb),
  ('five_star_review', 'Cinq Étoiles', 'Recevez une note de 5 étoiles', 'achievement', 'rare', 300, '{"type": "review_rating", "value": 5}'::jsonb),
  ('perfect_delivery', 'Livraison Parfaite', 'Livrez tous les livrables à temps', 'milestone', 'epic', 1000, '{"type": "on_time_delivery", "value": 1.0}'::jsonb),
  ('early_adopter', 'Pionnier', 'Inscrit durant la phase bêta', 'special', 'legendary', 500, '{"type": "registration_date", "before": "2024-12-31"}'::jsonb),
  ('referral_master', 'Maître du Parrainage', 'Parrainez 10 utilisateurs actifs', 'collaboration', 'rare', 750, '{"type": "referrals_count", "value": 10}'::jsonb),
  ('streak_7', 'Semaine Parfaite', 'Activité 7 jours consécutifs', 'achievement', 'common', 200, '{"type": "streak_days", "value": 7}'::jsonb),
  ('streak_30', 'Mois Parfait', 'Activité 30 jours consécutifs', 'achievement', 'epic', 1000, '{"type": "streak_days", "value": 30}'::jsonb),
  ('top_influencer', 'Top Influenceur', 'Dans le top 10 du classement', 'milestone', 'legendary', 3000, '{"type": "leaderboard_position", "value": 10}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 5. User Badges Table (earned badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT TRUE, -- Show on profile
  display_order INTEGER DEFAULT 0,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx ON public.user_badges(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS user_badges_badge_idx ON public.user_badges(badge_id);

-- 6. Leaderboards Table
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('xp', 'collaborations', 'earnings', 'rating', 'engagement')),
  period_type TEXT NOT NULL DEFAULT 'all_time' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
  category TEXT CHECK (category IN ('global', 'niche', 'region')),
  category_value TEXT, -- Specific niche or region
  is_active BOOLEAN DEFAULT TRUE,
  refresh_interval_minutes INTEGER DEFAULT 60,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default leaderboards
INSERT INTO public.leaderboards (name, display_name, description, leaderboard_type, period_type, category) VALUES
  ('xp_all_time', 'Classement XP - Tous les temps', 'Classement global par XP', 'xp', 'all_time', 'global'),
  ('xp_weekly', 'Classement XP - Hebdomadaire', 'Meilleurs de la semaine', 'xp', 'weekly', 'global'),
  ('collaborations_all_time', 'Collaborations - Tous les temps', 'Nombre total de collaborations', 'collaborations', 'all_time', 'global'),
  ('earnings_monthly', 'Revenus - Mensuel', 'Revenus du mois', 'earnings', 'monthly', 'global'),
  ('rating_all_time', 'Note - Tous les temps', 'Moyenne des notes', 'rating', 'all_time', 'global')
ON CONFLICT (name) DO NOTHING;

-- 7. Leaderboard Entries Table
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID REFERENCES public.leaderboards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  previous_rank INTEGER,
  metadata JSONB DEFAULT '{}',
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS leaderboard_entries_leaderboard_idx ON public.leaderboard_entries(leaderboard_id, rank);
CREATE INDEX IF NOT EXISTS leaderboard_entries_user_idx ON public.leaderboard_entries(user_id, leaderboard_id);

-- 8. Achievements/Missions Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('daily', 'weekly', 'monthly', 'one_time')),
  xp_reward INTEGER NOT NULL,
  currency_reward_cents INTEGER DEFAULT 0,
  requirements JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO public.achievements (name, display_name, description, achievement_type, xp_reward, requirements) VALUES
  ('daily_login', 'Connexion Quotidienne', 'Connectez-vous chaque jour', 'daily', 10, '{"type": "login", "consecutive_days": 1}'::jsonb),
  ('daily_profile_update', 'Profil à Jour', 'Mettez à jour votre profil', 'daily', 20, '{"type": "profile_update"}'::jsonb),
  ('weekly_application', 'Candidature Hebdo', 'Postulez à une campagne', 'weekly', 50, '{"type": "campaign_application", "count": 1}'::jsonb),
  ('monthly_collaboration', 'Collaboration Mensuelle', 'Complétez une collaboration', 'monthly', 200, '{"type": "collaboration_complete", "count": 1}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 9. User Achievements Progress Table
CREATE TABLE IF NOT EXISTS public.user_achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}', -- { "current": 5, "target": 10 }
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS user_achievement_progress_user_idx ON public.user_achievement_progress(user_id, is_completed);

-- RLS Policies
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievement_progress ENABLE ROW LEVEL SECURITY;

-- User Levels: Public read
CREATE POLICY "Public read user levels" ON public.user_levels FOR SELECT USING (true);

-- User XP: Users can view their own XP
CREATE POLICY "Users view own XP" ON public.user_xp FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all XP" ON public.user_xp FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage XP" ON public.user_xp FOR ALL TO service_role WITH CHECK (true);

-- XP Transactions: Users can view their own transactions
CREATE POLICY "Users view own XP transactions" ON public.xp_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all XP transactions" ON public.xp_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert XP transactions" ON public.xp_transactions FOR INSERT TO service_role WITH CHECK (true);

-- Badges: Public read active non-secret badges
CREATE POLICY "Public read badges" ON public.badges FOR SELECT USING (is_active = TRUE AND is_secret = FALSE);
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Badges: Users can view their own badges
CREATE POLICY "Users view own badges" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public view displayed badges" ON public.user_badges FOR SELECT USING (is_displayed = TRUE);
CREATE POLICY "Service role can manage user badges" ON public.user_badges FOR ALL TO service_role WITH CHECK (true);

-- Leaderboards: Public read active
CREATE POLICY "Public read leaderboards" ON public.leaderboards FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage leaderboards" ON public.leaderboards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Leaderboard Entries: Public read
CREATE POLICY "Public read leaderboard entries" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Service role can manage entries" ON public.leaderboard_entries FOR ALL TO service_role WITH CHECK (true);

-- Achievements: Public read active
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage achievements" ON public.achievements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Achievement Progress: Users can view their own progress
CREATE POLICY "Users view own achievement progress" ON public.user_achievement_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage progress" ON public.user_achievement_progress FOR ALL TO service_role WITH CHECK (true);

-- Function to add XP to user
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_xp_amount INTEGER, p_source TEXT, p_source_id UUID DEFAULT NULL, p_description TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_xp RECORD;
  v_new_level INTEGER;
  v_old_level INTEGER;
BEGIN
  -- Get or create user XP record
  INSERT INTO public.user_xp (user_id, current_xp, current_level)
  VALUES (p_user_id, p_xp_amount, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_xp = user_xp.current_xp + p_xp_amount,
    total_xp_earned = user_xp.total_xp_earned + p_xp_amount,
    updated_at = NOW()
  RETURNING * INTO v_user_xp;
  
  -- Record transaction
  INSERT INTO public.xp_transactions (user_id, xp_amount, xp_type, source, source_id, description)
  VALUES (p_user_id, p_xp_amount, 'earned', p_source, p_source_id, p_description);
  
  -- Check for level up
  v_old_level := v_user_xp.current_level;
  
  SELECT level INTO v_new_level
  FROM public.user_levels
  WHERE min_xp <= v_user_xp.current_xp
  ORDER BY level DESC
  LIMIT 1;
  
  IF v_new_level > v_old_level THEN
    UPDATE public.user_xp
    SET current_level = v_new_level,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Award level-up badge if exists
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT p_user_id, id
    FROM public.badges
    WHERE name = 'level_' || v_new_level
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_badge_eligibility(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_badge RECORD;
  v_eligible BOOLEAN;
BEGIN
  FOR v_badge IN
    SELECT * FROM public.badges WHERE is_active = TRUE AND is_secret = FALSE
  LOOP
    v_eligible := FALSE;
    
    -- Check different badge types
    IF v_badge.requirements->>'type' = 'collaborations_count' THEN
      SELECT COUNT(*) >= (v_badge.requirements->>'value')::INTEGER INTO v_eligible
      FROM public.collaborations
      WHERE influencer_id = p_user_id AND status = 'paid';
    END IF;
    
    IF v_badge.requirements->>'type' = 'review_rating' THEN
      SELECT AVG(rating) >= (v_badge.requirements->>'value')::NUMERIC INTO v_eligible
      FROM public.reviews
      WHERE reviewee_id = p_user_id;
    END IF;
    
    IF v_badge.requirements->>'type' = 'streak_days' THEN
      SELECT streak_days >= (v_badge.requirements->>'value')::INTEGER INTO v_eligible
      FROM public.user_xp
      WHERE user_id = p_user_id;
    END IF;
    
    IF v_eligible THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT DO NOTHING;
      
      -- Award badge XP
      PERFORM public.add_user_xp(p_user_id, v_badge.xp_reward, 'badge_awarded', v_badge.id, 'Badge: ' || v_badge.display_name);
    END IF;
  END LOOP;
END;
$$;

-- Function to update daily streak
CREATE OR REPLACE FUNCTION public.update_daily_streak(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_xp RECORD;
  v_streak_bonus INTEGER;
BEGIN
  SELECT * INTO v_user_xp FROM public.user_xp WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_xp (user_id, streak_days, last_activity_date)
    VALUES (p_user_id, 1, CURRENT_DATE);
    RETURN;
  END IF;
  
  IF v_user_xp.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continue streak
    UPDATE public.user_xp
    SET streak_days = streak_days + 1,
        last_activity_date = CURRENT_DATE,
        longest_streak = GREATEST(longest_streak, streak_days + 1),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Award streak XP
    v_streak_bonus := LEAST(v_user_xp.streak_days + 1, 10) * 10;
    PERFORM public.add_user_xp(p_user_id, v_streak_bonus, 'streak_bonus', NULL, 'Streak day: ' || (v_user_xp.streak_days + 1));
    
  ELSIF v_user_xp.last_activity_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Reset streak
    UPDATE public.user_xp
    SET streak_days = 1,
        last_activity_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Check badge eligibility
  PERFORM public.check_badge_eligibility(p_user_id);
END;
$$;

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION public.refresh_leaderboard(p_leaderboard_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_leaderboard RECORD;
  v_period_start DATE;
  v_period_end DATE;
  v_rank INTEGER := 0;
BEGIN
  -- Get leaderboard details
  SELECT * INTO v_leaderboard FROM public.leaderboards WHERE id = p_leaderboard_id;
  
  -- Calculate period
  IF v_leaderboard.period_type = 'daily' THEN
    v_period_start := CURRENT_DATE;
    v_period_end := CURRENT_DATE;
  ELSIF v_leaderboard.period_type = 'weekly' THEN
    v_period_start := CURRENT_DATE - INTERVAL '7 days';
    v_period_end := CURRENT_DATE;
  ELSIF v_leaderboard.period_type = 'monthly' THEN
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := CURRENT_DATE;
  ELSE
    v_period_start := NULL;
    v_period_end := NULL;
  END IF;
  
  -- Clear existing entries for this period
  DELETE FROM public.leaderboard_entries
  WHERE leaderboard_id = p_leaderboard_id
  AND (period_start IS NULL OR period_start = v_period_start);
  
  -- Insert new entries based on leaderboard type
  IF v_leaderboard.leaderboard_type = 'xp' THEN
    INSERT INTO public.leaderboard_entries (leaderboard_id, user_id, rank, score, period_start, period_end)
    SELECT 
      p_leaderboard_id,
      user_id,
      ROW_NUMBER() OVER (ORDER BY current_xp DESC),
      current_xp,
      v_period_start,
      v_period_end
    FROM public.user_xp
    WHERE current_xp > 0;
  END IF;
  
  -- Update last refreshed
  UPDATE public.leaderboards
  SET last_refreshed_at = NOW()
  WHERE id = p_leaderboard_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
