INSERT INTO public.affiliate_programs (name, description, commission_type, commission_rate, cookie_duration_days, payout_threshold_cents) VALUES
  ('Standard Referral Program', 'Programme de parrainage standard pour Influpia', 'percentage', 0.1000, 30, 5000);
INSERT INTO public.contract_templates (name, description, template_type, content, variables) VALUES
  ('Standard Campaign Contract', 'Contrat standard pour campagnes d''influence', 'standard', 
'# CONTRAT DE COLLABORATION INFLUENCER

## Entre les parties :
**Le Donneur d''ordre** : {{brand_name}}
**L''Influenceur** : {{influencer_name}}

## Objet du contrat
Collaboration pour la campagne : {{campaign_title}}

## Livrables
{{deliverables_list}}

## Modalités de paiement
**Montant total** : {{total_amount}} {{currency}}
Paiement sécurisé via escrow Influpia

---
Fait le {{contract_date}}',
'{"brand_name": {"type": "text"}, "influencer_name": {"type": "text"}, "campaign_title": {"type": "text"}, "deliverables_list": {"type": "text"}, "total_amount": {"type": "number"}, "currency": {"type": "text"}, "contract_date": {"type": "date"}}'::jsonb
  )
;
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
;
INSERT INTO public.subscription_plans (name, display_name, tier, price_monthly_cents, price_yearly_cents, features, limits, sort_order) VALUES 
  ('free', 'Starter', 'free', 0, 0, 
   '{"max_campaigns": 3, "max_influencers": 20, "ai_matching": false, "analytics": "basic", "support": "email", "brand_safety": false}'::jsonb,
   '{"campaigns_per_month": 3, "collaborations_per_month": 5, "api_calls_per_day": 100}'::jsonb,
   1),
  ('pro', 'Professional', 'pro', 25000, 250000,
   '{"max_campaigns": 50, "max_influencers": 500, "ai_matching": true, "analytics": "advanced", "support": "priority", "brand_safety": true, "custom_reports": true}'::jsonb,
   '{"campaigns_per_month": 50, "collaborations_per_month": 100, "api_calls_per_day": 10000}'::jsonb,
   2),
  ('enterprise', 'Enterprise', 'enterprise', 100000, 1000000,
   '{"max_campaigns": -1, "max_influencers": -1, "ai_matching": true, "analytics": "enterprise", "support": "24/7", "brand_safety": true, "custom_reports": true, "dedicated_account_manager": true, "api_access": true, "white_label": false}'::jsonb,
   '{"campaigns_per_month": -1, "collaborations_per_month": -1, "api_calls_per_day": -1}'::jsonb,
   3)
;
INSERT INTO public.affiliate_tier_rules (program_id, tier_level, tier_name, min_referrals, min_revenue_cents, commission_rate, parent_commission_rate) VALUES
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 1, 'Bronze', 0, 0, 0.1000, 0.0200),
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 2, 'Silver', 10, 100000, 0.1250, 0.0250),
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 3, 'Gold', 50, 500000, 0.1500, 0.0300);
