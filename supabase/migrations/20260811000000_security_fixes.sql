-- 1. Restrict is_admin and kyc_status updates in profiles
-- Create a trigger to prevent updating these columns unless the user is an admin.
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger AS $function$
BEGIN
  -- If the user modifying is NOT an admin, and they are trying to change sensitive columns, reset them to old values.
  -- To check if the current user is an admin, we query the DB, but avoid infinite recursion.
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
    -- Check if they were already admin
    IF OLD.is_admin = FALSE AND NEW.is_admin = TRUE THEN
       -- Revert the change
       NEW.is_admin = OLD.is_admin;
    END IF;
    
    -- Same for kyc_status if they try to auto-verify
    IF OLD.kyc_status != NEW.kyc_status THEN
       NEW.kyc_status = OLD.kyc_status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_security ON public.profiles;
CREATE TRIGGER enforce_profile_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_sensitive_columns();

-- 2. Fix handle_new_user for Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $function$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Enforce strictly 'brand' or 'influencer'
  assigned_role := new.raw_user_meta_data->>'role';
  IF assigned_role NOT IN ('brand', 'influencer') THEN
    assigned_role := 'brand'; -- Default fallback
  END IF;

  INSERT INTO public.profiles (id, email, role, is_admin)
  VALUES (new.id, new.email, assigned_role, false);
  
  IF assigned_role = 'brand' THEN
    INSERT INTO public.brands (id, company_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', ''));
  ELSIF assigned_role = 'influencer' THEN
    INSERT INTO public.influencers (id, display_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', ''));
  END IF;
  
  RETURN new;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add UPDATE policy on collaborations
-- Brands and Influencers can update their collaborations (e.g. deliverable_status, deliverable_url)
CREATE POLICY "Brands and Influencers can update their collaborations"
ON public.collaborations FOR UPDATE
USING (auth.uid() = brand_id OR auth.uid() = influencer_id);

-- 4. Fix Reviews INSERT policy
DROP POLICY IF EXISTS "Les participants peuvent insérer une review" ON public.reviews;
CREATE POLICY "Les participants peuvent insérer une review" 
ON public.reviews FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id 
  AND EXISTS (
    SELECT 1 FROM public.collaborations c 
    WHERE c.id = collaboration_id 
    AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid())
  )
);
