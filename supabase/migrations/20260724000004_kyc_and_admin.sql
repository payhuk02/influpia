-- 1. Ajout des champs KYC à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_details JSONB,
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- 2. Sécurité RLS supplémentaire pour les Admins
-- (On peut utiliser le champ is_admin de profile pour des checks spécifiques)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ajout de policies pour que les admins puissent voir et modifier n'importe quelle collaboration (pour gestion des litiges)
CREATE POLICY "Admins can view all collaborations" 
ON public.collaborations FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update all collaborations" 
ON public.collaborations FOR UPDATE 
USING (public.is_admin());
