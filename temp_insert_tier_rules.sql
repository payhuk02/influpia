INSERT INTO public.affiliate_tier_rules (program_id, tier_level, tier_name, min_referrals, min_revenue_cents, commission_rate, parent_commission_rate) VALUES
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 1, 'Bronze', 0, 0, 0.1000, 0.0200),
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 2, 'Silver', 10, 100000, 0.1250, 0.0250),
  ((SELECT id FROM public.affiliate_programs WHERE name = 'Standard Referral Program' LIMIT 1), 3, 'Gold', 50, 500000, 0.1500, 0.0300);
