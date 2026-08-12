-- 1. Create the influencer_services table
CREATE TABLE IF NOT EXISTS public.influencer_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    influencer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Set up RLS
ALTER TABLE public.influencer_services ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Tout le monde peut voir les prestations actives" ON public.influencer_services;
CREATE POLICY "Tout le monde peut voir les prestations actives" 
ON public.influencer_services FOR SELECT 
USING (is_active = true OR auth.uid() = influencer_id);

DROP POLICY IF EXISTS "Les influenceurs peuvent créer leurs prestations" ON public.influencer_services;
CREATE POLICY "Les influenceurs peuvent créer leurs prestations" 
ON public.influencer_services FOR INSERT 
WITH CHECK (auth.uid() = influencer_id);

DROP POLICY IF EXISTS "Les influenceurs peuvent modifier leurs prestations" ON public.influencer_services;
CREATE POLICY "Les influenceurs peuvent modifier leurs prestations" 
ON public.influencer_services FOR UPDATE 
USING (auth.uid() = influencer_id);

DROP POLICY IF EXISTS "Les influenceurs peuvent supprimer leurs prestations" ON public.influencer_services;
CREATE POLICY "Les influenceurs peuvent supprimer leurs prestations" 
ON public.influencer_services FOR DELETE 
USING (auth.uid() = influencer_id);

-- (Optionnel) Notification au backend des changements de structure
NOTIFY pgrst, 'reload schema';
