-- 1. Ajout de la fonctionnalité de "Boost" payant pour les campagnes
ALTER TABLE public.campaigns 
ADD COLUMN is_boosted BOOLEAN DEFAULT FALSE;

-- 2. Index pour accélérer la recherche des campagnes boostées dans la Marketplace
CREATE INDEX idx_campaigns_boosted ON public.campaigns(is_boosted) WHERE is_boosted = true;
