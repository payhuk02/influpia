INSERT INTO public.achievements (name, display_name, description, achievement_type, xp_reward, requirements) VALUES
  ('daily_login', 'Connexion Quotidienne', 'Connectez-vous chaque jour', 'daily', 10, '{"type": "login", "consecutive_days": 1}'::jsonb),
  ('daily_profile_update', 'Profil à Jour', 'Mettez à jour votre profil', 'daily', 20, '{"type": "profile_update"}'::jsonb),
  ('weekly_application', 'Candidature Hebdo', 'Postulez à une campagne', 'weekly', 50, '{"type": "campaign_application", "count": 1}'::jsonb),
  ('monthly_collaboration', 'Collaboration Mensuelle', 'Complétez une collaboration', 'monthly', 200, '{"type": "collaboration_complete", "count": 1}'::jsonb)
ON CONFLICT (name) DO NOTHING;
