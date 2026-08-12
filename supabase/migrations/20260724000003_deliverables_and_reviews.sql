-- 1. Mettre à jour la table collaborations pour gérer les livrables
ALTER TABLE public.collaborations 
ADD COLUMN deliverable_url TEXT,
ADD COLUMN deliverable_status TEXT DEFAULT 'pending' CHECK (deliverable_status IN ('pending', 'submitted', 'approved', 'rejected'));

-- 2. Créer la table reviews pour le système de notation
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collaboration_id UUID REFERENCES public.collaborations(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(collaboration_id, reviewer_id) -- Un seul avis par participant par collaboration
);

-- Activation RLS sur Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut lire les reviews" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Les participants peuvent insérer une review" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

-- 3. Mise à jour de la table profiles pour stocker la note moyenne
ALTER TABLE public.profiles 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN total_reviews INTEGER DEFAULT 0;

-- Trigger pour mettre à jour la note moyenne d'un profil lors d'une nouvelle review
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_reviews = total_reviews + 1,
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM public.reviews 
      WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_profile_rating();
