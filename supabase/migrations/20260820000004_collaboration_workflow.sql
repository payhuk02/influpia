-- ============================================================
-- Complete Collaboration Workflow with Auto-Generated Contracts & Milestones
-- Comparable to Upwork/Toptal contract management
-- ============================================================

-- 1. Contract Templates Table
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('standard', 'custom', 'enterprise')),
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}',
  jurisdiction TEXT DEFAULT 'FR',
  language TEXT DEFAULT 'fr',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
ON CONFLICT (name) DO NOTHING;

-- 2. Generated Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID REFERENCES public.collaborations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  contract_number TEXT UNIQUE,
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'signed', 'amended', 'terminated')),
  content TEXT NOT NULL,
  variables_filled JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  signed_by_brand_at TIMESTAMPTZ,
  signed_by_influencer_at TIMESTAMPTZ,
  brand_signature_data JSONB,
  influencer_signature_data JSONB,
  termination_reason TEXT,
  terminated_at TIMESTAMPTZ,
  terminated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contracts_collaboration_idx ON public.contracts(collaboration_id);
CREATE INDEX IF NOT EXISTS contracts_number_idx ON public.contracts(contract_number);

-- 3. Milestones Table
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID REFERENCES public.collaborations(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_order INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_cents INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'paid')),
  deliverables TEXT[],
  submission_url TEXT,
  submission_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS milestones_collaboration_idx ON public.milestones(collaboration_id, milestone_order);
CREATE INDEX IF NOT EXISTS milestones_status_idx ON public.milestones(status, due_date);

-- 4. Contract Amendments Table
CREATE TABLE IF NOT EXISTS public.contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  amendment_number INTEGER NOT NULL,
  reason TEXT NOT NULL,
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active contract templates" ON public.contract_templates FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage contract templates" ON public.contract_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own contracts" ON public.contracts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.collaborations c WHERE c.id = contracts.collaboration_id AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid()))
);
CREATE POLICY "Admins view all contracts" ON public.contracts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage contracts" ON public.contracts FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Users view own milestones" ON public.milestones FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.collaborations c WHERE c.id = milestones.collaboration_id AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid()))
);
CREATE POLICY "Admins view all milestones" ON public.milestones FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage milestones" ON public.milestones FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Users view contract amendments" ON public.contract_amendments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.contracts c JOIN public.collaborations col ON c.collaboration_id = col.id WHERE c.id = contract_amendments.contract_id AND (col.brand_id = auth.uid() OR col.influencer_id = auth.uid()))
);
CREATE POLICY "Admins view all amendments" ON public.contract_amendments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage amendments" ON public.contract_amendments FOR ALL TO service_role WITH CHECK (true);

-- Function to generate contract number
CREATE SEQUENCE IF NOT EXISTS contract_number_seq START WIth 1;

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'CTR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('contract_number_seq')::TEXT, 6, '0');
$$;

-- Function to auto-generate contract from template
CREATE OR REPLACE FUNCTION public.generate_contract_from_template(p_template_id UUID, p_collaboration_id UUID, p_variables JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template RECORD;
  v_contract_id UUID;
  v_content TEXT;
  v_contract_number TEXT;
  v_key TEXT;
BEGIN
  SELECT * INTO v_template FROM public.contract_templates WHERE id = p_template_id AND is_active = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Template not found or inactive'; END IF;
  
  v_contract_number := public.generate_contract_number();
  v_content := v_template.content;
  
  FOR v_key IN SELECT jsonb_object_keys(p_variables) LOOP
    v_content := REGEXP_REPLACE(v_content, '\{\{' || v_key || '\}\}', COALESCE(p_variables->>v_key, ''), 'g');
  END LOOP;
  
  INSERT INTO public.contracts (collaboration_id, template_id, contract_number, content, variables_filled, status)
  VALUES (p_collaboration_id, p_template_id, v_contract_number, v_content, p_variables, 'pending_signature')
  RETURNING id INTO v_contract_id;
  
  RETURN v_contract_id;
END;
$$;

-- Function to create default milestones
CREATE OR REPLACE FUNCTION public.create_default_milestones(p_collaboration_id UUID, p_contract_id UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_collaboration RECORD;
  v_amount_per_milestone INTEGER;
BEGIN
  SELECT c.agreed_amount, c.deadline INTO v_collaboration FROM public.collaborations c WHERE c.id = p_collaboration_id;
  
  v_amount_per_milestone := v_collaboration.agreed_amount / 2;
  
  INSERT INTO public.milestones (collaboration_id, contract_id, title, description, milestone_order, due_date, amount_cents, status) VALUES
    (p_collaboration_id, p_contract_id, 'Premier livrable', 'Soumission du premier livrable pour validation', 1, v_collaboration.deadline - INTERVAL '7 days', v_amount_per_milestone, 'pending'),
    (p_collaboration_id, p_contract_id, 'Livraison finale', 'Livraison finale et publication', 2, v_collaboration.deadline, v_amount_per_milestone, 'pending');
END;
$$;

NOTIFY pgrst, 'reload schema';
