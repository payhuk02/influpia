INSERT INTO public.search_facets (facet_name, facet_type, display_name, options, sort_order) VALUES
  ('niches', 'checkbox', 'Niches', '[
    {"value": "fashion", "label": "Mode", "count": 0},
    {"value": "beauty", "label": "Beauté", "count": 0},
    {"value": "tech", "label": "Tech", "count": 0},
    {"value": "food", "label": "Cuisine", "count": 0},
    {"value": "fitness", "label": "Fitness", "count": 0},
    {"value": "travel", "label": "Voyage", "count": 0},
    {"value": "gaming", "label": "Gaming", "count": 0},
    {"value": "lifestyle", "label": "Lifestyle", "count": 0}
  ]'::jsonb, 1),
  ('platforms', 'checkbox', 'Plateformes', '[
    {"value": "instagram", "label": "Instagram", "count": 0},
    {"value": "tiktok", "label": "TikTok", "count": 0},
    {"value": "youtube", "label": "YouTube", "count": 0},
    {"value": "twitter", "label": "Twitter/X", "count": 0},
    {"value": "linkedin", "label": "LinkedIn", "count": 0}
  ]'::jsonb, 2),
  ('followers', 'range', 'Nombre d''abonnés', '{"min": 0, "max": 10000000, "step": 1000}'::jsonb, 3),
  ('engagement_rate', 'range', 'Taux d''engagement', '{"min": 0, "max": 20, "step": 0.1}'::jsonb, 4),
  ('price', 'range', 'Budget (XOF)', '{"min": 1000, "max": 10000000, "step": 1000}'::jsonb, 5),
  ('location', 'select', 'Localisation', '[]'::jsonb, 6),
  ('languages', 'multi_select', 'Langues', '[
    {"value": "fr", "label": "Français", "count": 0},
    {"value": "en", "label": "Anglais", "count": 0},
    {"value": "es", "label": "Espagnol", "count": 0},
    {"value": "pt", "label": "Portugais", "count": 0}
  ]'::jsonb, 7)
ON CONFLICT (facet_name) DO NOTHING;
