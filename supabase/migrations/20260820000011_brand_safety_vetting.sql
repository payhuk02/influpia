-- ============================================================
-- Brand Safety Tools & Influencer Vetting System
-- Comparable to YouTube BrandConnect/Upwork vetting
-- ============================================================

-- 1. Brand Safety Categories Table
CREATE TABLE IF NOT EXISTS public.brand_safety_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default brand safety categories
INSERT INTO public.brand_safety_categories (category_name, display_name, description, risk_level, keywords) VALUES
  ('adult_content', 'Contenu Adulte', 'Contenu pour adultes ou sexuellement explicite', 'critical', ARRAY['adult', 'nsfw', 'sexual', 'explicit']),
  ('violence', 'Violence', 'Contenu violent ou graphique', 'high', ARRAY['violence', 'gore', 'graphic', 'weapon']),
  ('hate_speech', 'Discours Haineux', 'Contenu haineux ou discriminatoire', 'critical', ARRAY['hate', 'racist', 'discrimination', 'slur']),
  ('illegal_activities', 'Activités Illégales', 'Contenu promouvant des activités illégales', 'critical', ARRAY['illegal', 'drugs', 'piracy', 'fraud']),
  ('political', 'Politique', 'Contenu politique controversé', 'medium', ARRAY['politics', 'political', 'controversial']),
  ('gambling', 'Jeux d''argent', 'Contenu lié aux jeux d''argent', 'medium', ARRAY['gambling', 'casino', 'betting']),
  ('alcohol', 'Alcool', 'Contenu lié à l''alcool', 'low', ARRAY['alcohol', 'drinking', 'bar']),
  ('tobacco', 'Tabac', 'Contenu lié au tabac', 'low', ARRAY['tobacco', 'smoking', 'cigarette'])
ON CONFLICT (category_name) DO NOTHING;

-- 2. Influencer Vetting Records Table
CREATE TABLE IF NOT EXISTS public.influencer_vetting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE,
  vetting_type TEXT NOT NULL CHECK (vetting_type IN ('initial', 'periodic', 'triggered', 'manual')),
  vetting_status TEXT NOT NULL DEFAULT 'pending' CHECK (vetting_status IN ('pending', 'in_progress', 'passed', 'failed', 'requires_review')),
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  vetted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vetting_started_at TIMESTAMPTZ,
  vetting_completed_at TIMESTAMPTZ,
  next_vetting_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS influencer_vetting_influencer_idx ON public.influencer_vetting(influencer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS influencer_vetting_status_idx ON public.influencer_vetting(vetting_status, created_at DESC);

-- 3. Vetting Criteria Table
CREATE TABLE IF NOT EXISTS public.vetting_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  criterion_type TEXT NOT NULL CHECK (criterion_type IN ('engagement_rate', 'follower_growth', 'content_quality', 'audience_authenticity', 'brand_safety', 'professionalism')),
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0, -- Weight in overall score (0.0 to 1.0)
  passing_threshold INTEGER DEFAULT 50, -- Minimum score to pass (0-100)
  evaluation_method TEXT DEFAULT 'automated' CHECK (evaluation_method IN ('automated', 'manual', 'hybrid')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default vetting criteria
INSERT INTO public.vetting_criteria (criterion_name, display_name, description, criterion_type, weight, passing_threshold) VALUES
  ('engagement_quality', 'Qualité d''Engagement', 'Taux d''engagement authentique et cohérent', 'engagement_rate', 0.25, 60),
  ('follower_authenticity', 'Authenticité des Abonnés', 'Proportion d''abonnés réels vs faux', 'audience_authenticity', 0.20, 70),
  ('content_quality', 'Qualité du Contenu', 'Qualité et cohérence du contenu', 'content_quality', 0.20, 60),
  ('brand_safety', 'Sécurité Marque', 'Absence de contenu risqué', 'brand_safety', 0.20, 80),
  ('professionalism', 'Professionnalisme', 'Respect des délais et communication', 'professionalism', 0.15, 70)
ON CONFLICT (criterion_name) DO NOTHING;

-- 4. Vetting Results Table (detailed scores per criterion)
CREATE TABLE IF NOT EXISTS public.vetting_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vetting_id UUID REFERENCES public.influencer_vetting(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES public.vetting_criteria(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL,
  details JSONB DEFAULT '{}', -- { "engagement_rate": 3.5, "benchmark": 2.0, "notes": "..." }
  evaluated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vetting_results_vetting_idx ON public.vetting_results(vetting_id);
CREATE INDEX IF NOT EXISTS vetting_results_criterion_idx ON public.vetting_results(criterion_id);

-- 5. Brand Safety Checks Table (per influencer)
CREATE TABLE IF NOT EXISTS public.brand_safety_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('content_scan', 'audience_analysis', 'manual_review')),
  check_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  categories_flagged TEXT[], -- Array of brand_safety_categories flagged
  overall_risk_level TEXT CHECK (overall_risk_level IN ('low', 'medium', 'high', 'critical')),
  flagged_content_urls TEXT[],
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS brand_safety_checks_influencer_idx ON public.brand_safety_checks(influencer_id, check_date DESC);

-- 6. Influencer Verification Documents Table
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'passport', 'tax_id', 'address_proof', 'social_media_proof', 'other')),
  document_url TEXT NOT NULL,
  document_name TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verification_documents_influencer_idx ON public.verification_documents(influencer_id, verification_status);

-- 7. Brand Safety Preferences (per brand)
CREATE TABLE IF NOT EXISTS public.brand_safety_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  blocked_categories TEXT[] DEFAULT '{}', -- Categories to avoid
  min_engagement_rate DECIMAL(5,2),
  min_follower_count INTEGER,
  max_follower_count INTEGER,
  required_languages TEXT[],
  blocked_keywords TEXT[],
  require_verified BOOLEAN DEFAULT TRUE,
  require_kyc BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id)
);

CREATE INDEX IF NOT EXISTS brand_safety_preferences_brand_idx ON public.brand_safety_preferences(brand_id);

-- 8. Vetting History (audit trail)
CREATE TABLE IF NOT EXISTS public.vetting_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('vetting_started', 'vetting_completed', 'status_changed', 'document_uploaded', 'document_verified')),
  previous_status TEXT,
  new_status TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vetting_history_influencer_idx ON public.vetting_history(influencer_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.brand_safety_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_vetting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetting_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetting_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_safety_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetting_history ENABLE ROW LEVEL SECURITY;

-- Brand Safety Categories: Public read active, admin write
CREATE POLICY "Public read brand safety categories" ON public.brand_safety_categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage brand safety categories" ON public.brand_safety_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Influencer Vetting: Influencers can view their own vetting, admins can view all
CREATE POLICY "Influencers view own vetting" ON public.influencer_vetting FOR SELECT TO authenticated USING (auth.uid() = influencer_id);
CREATE POLICY "Admins view all vetting" ON public.influencer_vetting FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage vetting" ON public.influencer_vetting FOR ALL TO service_role WITH CHECK (true);

-- Vetting Criteria: Public read active, admin write
CREATE POLICY "Public read vetting criteria" ON public.vetting_criteria FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage vetting criteria" ON public.vetting_criteria FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Vetting Results: Influencers can view their own results, admins can view all
CREATE POLICY "Influencers view own vetting results" ON public.vetting_results FOR SELECT TO authenticated USING (
  auth.uid() = (SELECT influencer_id FROM public.influencer_vetting WHERE id = vetting_results.vetting_id)
);
CREATE POLICY "Admins view all vetting results" ON public.vetting_results FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage results" ON public.vetting_results FOR ALL TO service_role WITH CHECK (true);

-- Brand Safety Checks: Influencers can view their own checks, admins can view all
CREATE POLICY "Influencers view own safety checks" ON public.brand_safety_checks FOR SELECT TO authenticated USING (auth.uid() = influencer_id);
CREATE POLICY "Admins view all safety checks" ON public.brand_safety_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage safety checks" ON public.brand_safety_checks FOR ALL TO service_role WITH CHECK (true);

-- Verification Documents: Influencers can manage their own documents
CREATE POLICY "Influencers manage own verification documents" ON public.verification_documents FOR ALL TO authenticated USING (auth.uid() = influencer_id);
CREATE POLICY "Admins view all verification documents" ON public.verification_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can verify documents" ON public.verification_documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Brand Safety Preferences: Brands can manage their own preferences
CREATE POLICY "Brands manage own safety preferences" ON public.brand_safety_preferences FOR ALL TO authenticated USING (auth.uid() = brand_id);
CREATE POLICY "Admins view all safety preferences" ON public.brand_safety_preferences FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Vetting History: Influencers can view their own history, admins can view all
CREATE POLICY "Influencers view own vetting history" ON public.vetting_history FOR SELECT TO authenticated USING (auth.uid() = influencer_id);
CREATE POLICY "Admins view all vetting history" ON public.vetting_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert history" ON public.vetting_history FOR INSERT TO service_role WITH CHECK (true);

-- Function to start influencer vetting
CREATE OR REPLACE FUNCTION public.start_influencer_vetting(p_influencer_id UUID, p_vetting_type TEXT DEFAULT 'initial')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_vetting_id UUID;
BEGIN
  INSERT INTO public.influencer_vetting (influencer_id, vetting_type, vetting_status, vetting_started_at)
  VALUES (p_influencer_id, p_vetting_type, 'in_progress', NOW())
  RETURNING id INTO v_vetting_id;
  
  -- Log action
  INSERT INTO public.vetting_history (influencer_id, action, new_status, metadata)
  VALUES (p_influencer_id, 'vetting_started', 'in_progress', jsonb_build_object('vetting_type', p_vetting_type));
  
  RETURN v_vetting_id;
END;
$$;

-- Function to evaluate vetting criterion
CREATE OR REPLACE FUNCTION public.evaluate_vetting_criterion(p_vetting_id UUID, p_criterion_id UUID, p_score INTEGER, p_details JSONB DEFAULT '{}')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_criterion RECORD;
  v_passed BOOLEAN;
BEGIN
  -- Get criterion
  SELECT * INTO v_criterion FROM public.vetting_criteria WHERE id = p_criterion_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Criterion not found';
  END IF;
  
  -- Determine if passed
  v_passed := p_score >= v_criterion.passing_threshold;
  
  -- Insert result
  INSERT INTO public.vetting_results (vetting_id, criterion_id, score, passed, details, evaluated_at)
  VALUES (p_vetting_id, p_criterion_id, p_score, v_passed, p_details, NOW());
END;
$$;

-- Function to complete vetting and calculate overall score
CREATE OR REPLACE FUNCTION public.complete_influencer_vetting(p_vetting_id UUID, p_vetted_by UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_vetting RECORD;
  v_weighted_score DECIMAL;
  v_overall_score INTEGER;
  v_risk_level TEXT;
  v_vetting_status TEXT;
BEGIN
  -- Get vetting record
  SELECT * INTO v_vetting FROM public.influencer_vetting WHERE id = p_vetting_id;
  
  -- Calculate weighted score
  SELECT SUM(vr.score * vc.weight) INTO v_weighted_score
  FROM public.vetting_results vr
  JOIN public.vetting_criteria vc ON vr.criterion_id = vc.id
  WHERE vr.vetting_id = p_vetting_id;
  
  v_overall_score := ROUND(v_weighted_score)::INTEGER;
  
  -- Determine risk level
  IF v_overall_score >= 80 THEN
    v_risk_level := 'low';
    v_vetting_status := 'passed';
  ELSIF v_overall_score >= 60 THEN
    v_risk_level := 'medium';
    v_vetting_status := 'passed';
  ELSIF v_overall_score >= 40 THEN
    v_risk_level := 'high';
    v_vetting_status := 'requires_review';
  ELSE
    v_risk_level := 'critical';
    v_vetting_status := 'failed';
  END IF;
  
  -- Update vetting
  UPDATE public.influencer_vetting
  SET overall_score = v_overall_score,
      risk_level = v_risk_level,
      vetting_status = v_vetting_status,
      vetted_by = p_vetted_by,
      vetting_completed_at = NOW(),
      next_vetting_date = CURRENT_DATE + INTERVAL '90 days',
      updated_at = NOW()
  WHERE id = p_vetting_id;
  
  -- Log action
  INSERT INTO public.vetting_history (influencer_id, action, new_status, performed_by, metadata)
  VALUES (
    v_vetting.influencer_id, 
    'vetting_completed', 
    v_vetting_status, 
    p_vetted_by, 
    jsonb_build_object('overall_score', v_overall_score, 'risk_level', v_risk_level)
  );
  
  -- Update influencer profile if passed
  IF v_vetting_status = 'passed' THEN
    UPDATE public.influencers
    SET is_premium = TRUE,
        updated_at = NOW()
    WHERE id = v_vetting.influencer_id;
  END IF;
END;
$$;

-- Function to perform brand safety check
CREATE OR REPLACE FUNCTION public.perform_brand_safety_check(p_influencer_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_check_id UUID;
  v_flagged_categories TEXT[] := '{}';
  v_risk_level TEXT := 'low';
BEGIN
  -- Create check record
  INSERT INTO public.brand_safety_checks (influencer_id, check_type, overall_risk_level)
  VALUES (p_influencer_id, 'content_scan', 'low')
  RETURNING id INTO v_check_id;
  
  -- Simulate content scanning (in production, would use AI/ML)
  -- This would analyze recent content for flagged keywords
  
  -- For now, assume no flags
  UPDATE public.brand_safety_checks
  SET categories_flagged = v_flagged_categories,
      overall_risk_level = v_risk_level
  WHERE id = v_check_id;
  
  RETURN v_check_id;
END;
$$;

-- Function to check if influencer matches brand safety preferences
CREATE OR REPLACE FUNCTION public.check_brand_safety_match(p_influencer_id UUID, p_brand_id UUID)
RETURNS TABLE (matches BOOLEAN, reasons TEXT[]) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_preferences RECORD;
  v_influencer RECORD;
  v_vetting RECORD;
  v_reasons TEXT[] := '{}';
  v_matches BOOLEAN := TRUE;
BEGIN
  -- Get brand preferences
  SELECT * INTO v_preferences FROM public.brand_safety_preferences WHERE brand_id = p_brand_id;
  
  IF NOT FOUND THEN
    -- No preferences set, assume matches
    RETURN QUERY SELECT true, ARRAY[]::TEXT[];
    RETURN;
  END IF;
  
  -- Get influencer data
  SELECT i.*, 
    (SELECT overall_score FROM public.influencer_vetting WHERE influencer_id = i.id AND vetting_status = 'passed' ORDER BY vetting_completed_at DESC LIMIT 1) as vetting_score
  INTO v_influencer
  FROM public.influencers i
  WHERE i.id = p_influencer_id;
  
  -- Check KYC requirement
  IF v_preferences.require_kyc AND (SELECT kyc_status FROM public.profiles WHERE id = p_influencer_id) != 'verified' THEN
    v_matches := FALSE;
    v_reasons := array_append(v_reasons, 'KYC not verified');
  END IF;
  
  -- Check verification requirement
  IF v_preferences.require_verified AND NOT v_influencer.is_premium THEN
    v_matches := FALSE;
    v_reasons := array_append(v_reasons, 'Not verified');
  END IF;
  
  -- Check follower count range
  IF v_preferences.min_follower_count IS NOT NULL THEN
    SELECT COUNT(*) INTO v_influencer
    FROM public.social_accounts
    WHERE influencer_id = p_influencer_id
    AND followers_count >= v_preferences.min_follower_count;
    
    IF v_influencer = 0 THEN
      v_matches := FALSE;
      v_reasons := array_append(v_reasons, 'Follower count below minimum');
    END IF;
  END IF;
  
  RETURN QUERY SELECT v_matches, v_reasons;
END;
$$;

-- Function to upload verification document
CREATE OR REPLACE FUNCTION public.upload_verification_document(p_influencer_id UUID, p_document_type TEXT, p_document_url TEXT, p_document_name TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_doc_id UUID;
BEGIN
  INSERT INTO public.verification_documents (influencer_id, document_type, document_url, document_name)
  VALUES (p_influencer_id, p_document_type, p_document_url, p_document_name)
  RETURNING id INTO v_doc_id;
  
  -- Log action
  INSERT INTO public.vetting_history (influencer_id, action, new_status, metadata)
  VALUES (p_influencer_id, 'document_uploaded', 'pending', jsonb_build_object('document_type', p_document_type));
  
  RETURN v_doc_id;
END;
$$;

-- Function to verify document
CREATE OR REPLACE FUNCTION public.verify_document(p_document_id UUID, p_verified_by UUID, p_status TEXT, p_rejection_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.verification_documents
  SET verification_status = p_status,
      verified_by = p_verified_by,
      verified_at = NOW(),
      rejection_reason = p_rejection_reason
  WHERE id = p_document_id;
  
  -- Log action
  INSERT INTO public.vetting_history (influencer_id, action, new_status, performed_by, metadata)
  SELECT influencer_id, 'document_verified', p_status, p_verified_by, jsonb_build_object('document_id', p_document_id)
  FROM public.verification_documents
  WHERE id = p_document_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
