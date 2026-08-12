-- Security Updates, Policies, and Type Migrations

-- 1. Migrate Money Columns from DECIMAL to INTEGER (Cents)
ALTER TABLE public.campaigns ALTER COLUMN budget TYPE INTEGER USING (budget * 100)::INTEGER;
ALTER TABLE public.influencers ALTER COLUMN base_rate TYPE INTEGER USING (base_rate * 100)::INTEGER;
ALTER TABLE public.campaign_applications ALTER COLUMN proposed_rate TYPE INTEGER USING (proposed_rate * 100)::INTEGER;
ALTER TABLE public.collaborations ALTER COLUMN agreed_amount TYPE INTEGER USING (agreed_amount * 100)::INTEGER;

-- 2. Add Missing RLS Policies
-- Collaborations
CREATE POLICY "Brands and Influencers can view their own collaborations" 
ON public.collaborations FOR SELECT 
USING (auth.uid() = brand_id OR auth.uid() = influencer_id);

CREATE POLICY "Brands can insert collaborations"
ON public.collaborations FOR INSERT
WITH CHECK (auth.uid() = brand_id);

-- Messages
CREATE POLICY "Users can view messages where they are sender or receiver"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages as sender"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Campaign Applications
CREATE POLICY "Brands can view applications to their campaigns"
ON public.campaign_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_applications.campaign_id AND campaigns.brand_id = auth.uid()
  )
);

CREATE POLICY "Brands can update applications"
ON public.campaign_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_applications.campaign_id AND campaigns.brand_id = auth.uid()
  )
);

CREATE POLICY "Influencers can view their own applications"
ON public.campaign_applications FOR SELECT
USING (auth.uid() = influencer_id);

CREATE POLICY "Influencers can apply to campaigns"
ON public.campaign_applications FOR INSERT
WITH CHECK (auth.uid() = influencer_id);

-- 3. Trigger for Automatic Profile Creation (Atomic Signups)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'role');
  
  IF new.raw_user_meta_data->>'role' = 'brand' THEN
    INSERT INTO public.brands (id, company_name)
    VALUES (new.id, new.raw_user_meta_data->>'name');
  ELSIF new.raw_user_meta_data->>'role' = 'influencer' THEN
    INSERT INTO public.influencers (id, display_name)
    VALUES (new.id, new.raw_user_meta_data->>'name');
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to prevent errors on multiple runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Indexes for Performance
CREATE INDEX idx_campaigns_brand_id ON public.campaigns(brand_id);
CREATE INDEX idx_campaign_apps_campaign_id ON public.campaign_applications(campaign_id);
CREATE INDEX idx_campaign_apps_influencer_id ON public.campaign_applications(influencer_id);
CREATE INDEX idx_collaborations_brand_id ON public.collaborations(brand_id);
CREATE INDEX idx_collaborations_influencer_id ON public.collaborations(influencer_id);
CREATE INDEX idx_messages_collaboration_id ON public.messages(collaboration_id);
