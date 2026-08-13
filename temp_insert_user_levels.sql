INSERT INTO public.user_levels (level, level_name, min_xp, max_xp, xp_multiplier, benefits) VALUES
  (1, 'Novice', 0, 999, 1.0, '{"max_campaigns": 3, "priority_support": false}'::jsonb),
  (2, 'Apprenti', 1000, 2999, 1.1, '{"max_campaigns": 5, "priority_support": false}'::jsonb),
  (3, 'Compétent', 3000, 6999, 1.2, '{"max_campaigns": 10, "priority_support": false}'::jsonb),
  (4, 'Expert', 7000, 14999, 1.3, '{"max_campaigns": 20, "priority_support": true}'::jsonb),
  (5, 'Maître', 15000, 29999, 1.4, '{"max_campaigns": 50, "priority_support": true}'::jsonb),
  (6, 'Légende', 30000, NULL, 1.5, '{"max_campaigns": -1, "priority_support": true, "verified_badge": true}'::jsonb)
ON CONFLICT (level) DO NOTHING;
