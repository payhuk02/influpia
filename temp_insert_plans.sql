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
ON CONFLICT (name) DO NOTHING;
