INSERT INTO public.leaderboards (name, display_name, description, leaderboard_type, period_type, category) VALUES
  ('xp_all_time', 'Classement XP - Tous les temps', 'Classement global par XP', 'xp', 'all_time', 'global'),
  ('xp_weekly', 'Classement XP - Hebdomadaire', 'Meilleurs de la semaine', 'xp', 'weekly', 'global'),
  ('collaborations_all_time', 'Collaborations - Tous les temps', 'Nombre total de collaborations', 'collaborations', 'all_time', 'global'),
  ('earnings_monthly', 'Revenus - Mensuel', 'Revenus du mois', 'earnings', 'monthly', 'global'),
  ('rating_all_time', 'Note - Tous les temps', 'Moyenne des notes', 'rating', 'all_time', 'global')
ON CONFLICT (name) DO NOTHING;
