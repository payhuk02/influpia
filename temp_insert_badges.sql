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
