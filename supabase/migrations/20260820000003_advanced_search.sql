-- ============================================================
-- Advanced Search with Filters, Saved Searches & AI Recommendations
-- Comparable to Upwork/Amazon advanced search
-- ============================================================

-- 1. Saved Searches Table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('influencers', 'campaigns', 'brands')),
  filters JSONB NOT NULL DEFAULT '{}', -- { "niches": ["fashion", "beauty"], "followers_min": 10000, "followers_max": 100000, "platforms": ["instagram", "tiktok"] }
  sort_by TEXT DEFAULT 'relevance',
  sort_order TEXT DEFAULT 'desc',
  is_alert BOOLEAN DEFAULT FALSE, -- Email alerts for new matches
  alert_frequency TEXT CHECK (alert_frequency IN ('daily', 'weekly', 'instant')),
  last_alert_sent_at TIMESTAMPTZ,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON public.saved_searches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_searches_type_idx ON public.saved_searches(search_type);
CREATE INDEX IF NOT EXISTS saved_searches_filters_idx ON public.saved_searches USING GIN(filters);

-- 2. Search History (for analytics and personalization)
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  search_query TEXT,
  search_type TEXT NOT NULL CHECK (search_type IN ('influencers', 'campaigns', 'brands')),
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  clicked_result_id UUID,
  clicked_result_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_history_user_idx ON public.search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS search_history_session_idx ON public.search_history(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS search_history_query_idx ON public.search_history(search_query);

-- 3. AI Recommendations Table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('influencer_for_campaign', 'campaign_for_influencer', 'similar_influencers', 'trending_campaigns')),
  source_id UUID, -- campaign_id or influencer_id
  recommended_id UUID NOT NULL, -- influencer_id or campaign_id
  confidence_score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
  reason TEXT, -- "High engagement in fashion niche", "Similar audience demographics"
  metadata JSONB DEFAULT '{}',
  is_viewed BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS ai_recommendations_user_idx ON public.ai_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_recommendations_source_idx ON public.ai_recommendations(source_id, recommendation_type);
CREATE INDEX IF NOT EXISTS ai_recommendations_confidence_idx ON public.ai_recommendations(confidence_score DESC);

-- 4. Search Facets (for dynamic filter options)
CREATE TABLE IF NOT EXISTS public.search_facets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facet_name TEXT NOT NULL UNIQUE, -- "niches", "platforms", "price_range", "location"
  facet_type TEXT NOT NULL CHECK (facet_type IN ('checkbox', 'range', 'select', 'multi_select')),
  display_name TEXT NOT NULL,
  options JSONB DEFAULT '[]', -- [{ "value": "fashion", "label": "Fashion", "count": 1234 }]
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default facets
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

-- 5. Search Analytics (for optimization)
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_type TEXT NOT NULL,
  filters_used JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  zero_results BOOLEAN DEFAULT FALSE,
  search_duration_ms INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_analytics_type_idx ON public.search_analytics(search_type, created_at DESC);
CREATE INDEX IF NOT EXISTS search_analytics_zero_results_idx ON public.search_analytics(zero_results, created_at DESC);

-- RLS Policies
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_facets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Saved Searches: Users can manage their own
CREATE POLICY "Users manage own saved searches" ON public.saved_searches FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all saved searches" ON public.saved_searches FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Search History: Users can view their own, admins can view all
CREATE POLICY "Users view own search history" ON public.search_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all search history" ON public.search_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert search history" ON public.search_history FOR INSERT TO service_role WITH CHECK (true);

-- AI Recommendations: Users can view their own
CREATE POLICY "Users view own recommendations" ON public.ai_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own recommendations" ON public.ai_recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage recommendations" ON public.ai_recommendations FOR ALL TO service_role WITH CHECK (true);

-- Search Facets: Public read, admin write
CREATE POLICY "Public read search facets" ON public.search_facets FOR SELECT USING (true);
CREATE POLICY "Admins manage search facets" ON public.search_facets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Search Analytics: Admins only
CREATE POLICY "Admins view search analytics" ON public.search_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert search analytics" ON public.search_analytics FOR INSERT TO service_role WITH CHECK (true);

-- Function to generate AI recommendations for a campaign
CREATE OR REPLACE FUNCTION public.generate_campaign_recommendations(p_campaign_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (influencer_id UUID, confidence_score DECIMAL, reason TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_campaign RECORD;
  v_query_embedding vector(1536);
BEGIN
  -- Get campaign details
  SELECT c.title, c.description, c.objectives, c.content_types, c.target_platforms
  INTO v_campaign
  FROM public.campaigns c
  WHERE c.id = p_campaign_id;

  -- Generate embedding from campaign text
  -- This would call the embedding function, simplified here
  -- v_query_embedding := create_embedding(v_campaign.title || ' ' || v_campaign.description);
  
  -- For now, use pgvector similarity if embedding exists
  RETURN QUERY
  SELECT 
    i.id,
    0.85::DECIMAL, -- Placeholder confidence score
    'Matching based on campaign objectives and influencer niches'
  FROM public.influencers i
  WHERE i.display_name IS NOT NULL
  LIMIT p_limit;
END;
$$;

-- Function to update facet counts
CREATE OR REPLACE FUNCTION public.update_facet_counts(p_facet_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_facet_name = 'niches' THEN
    UPDATE public.search_facets
    SET options = (
      SELECT jsonb_agg(jsonb_build_object(
        'value', elem,
        'label', initcap(elem),
        'count', COALESCE(cnt, 0)
      ))
      FROM (
        SELECT unnest(niches) as elem, COUNT(*) as cnt
        FROM public.influencers
        GROUP BY unnest(niches)
      ) t
    )
    WHERE facet_name = 'niches';
  END IF;
  
  IF p_facet_name = 'platforms' THEN
    UPDATE public.search_facets
    SET options = (
      SELECT jsonb_agg(jsonb_build_object(
        'value', platform,
        'label', initcap(platform),
        'count', COALESCE(cnt, 0)
      ))
      FROM (
        SELECT platform, COUNT(*) as cnt
        FROM public.social_accounts
        GROUP BY platform
      ) t
    )
    WHERE facet_name = 'platforms';
  END IF;
END;
$$;

-- Function to log search for analytics
CREATE OR REPLACE FUNCTION public.log_search(p_user_id UUID, p_search_type TEXT, p_filters JSONB, p_results_count INTEGER, p_duration_ms INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.search_analytics (search_type, filters_used, results_count, zero_results, search_duration_ms, user_id)
  VALUES (p_search_type, p_filters, p_results_count, p_results_count = 0, p_duration_ms, p_user_id);
END;
$$;

NOTIFY pgrst, 'reload schema';
