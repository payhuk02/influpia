-- ============================================================
-- À exécuter dans le SQL editor Supabase (base non gérée par Lovable)
-- Rôles dans une table dédiée (anti privilege-escalation)
-- + réparation de profil côté serveur
-- + suppression des clés secrètes stockées en base
-- ============================================================

-- 1. Enum des rôles applicatifs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END
$$;

-- 2. Table user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- 3. Grants Data API (pas d'accès anon : données d'autorisation)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 4. RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
-- Aucune policy INSERT/UPDATE/DELETE : seuls service_role et les fonctions
-- SECURITY DEFINER peuvent attribuer un rôle.

-- 5. has_role (SECURITY DEFINER, évite la récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Backfill depuis profiles.is_admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM public.profiles WHERE is_admin = TRUE
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. is_admin() s'appuie désormais sur user_roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

COMMENT ON COLUMN public.profiles.is_admin IS
  'DEPRECATED : source de vérité = public.user_roles / public.has_role().';

-- 8. Nouveaux utilisateurs : rôle applicatif "user"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  assigned_role TEXT;
BEGIN
  assigned_role := new.raw_user_meta_data->>'role';
  IF assigned_role NOT IN ('brand', 'influencer') THEN
    assigned_role := 'brand';
  END IF;

  INSERT INTO public.profiles (id, email, role, is_admin)
  VALUES (new.id, new.email, assigned_role, false)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF assigned_role = 'brand' THEN
    INSERT INTO public.brands (id, company_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', ''))
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.influencers (id, display_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', ''))
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$function$;

-- 9. Réparation de profil côté serveur (remplace l'auto-réparation client)
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid UUID := auth.uid();
  u RECORD;
  assigned_role TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO assigned_role FROM public.profiles WHERE id = uid;
  IF assigned_role IS NOT NULL THEN
    RETURN assigned_role;
  END IF;

  SELECT email, raw_user_meta_data INTO u FROM auth.users WHERE id = uid;

  assigned_role := u.raw_user_meta_data->>'role';
  IF assigned_role NOT IN ('brand', 'influencer') THEN
    assigned_role := 'brand';
  END IF;

  INSERT INTO public.profiles (id, email, role, is_admin)
  VALUES (uid, u.email, assigned_role, false)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF assigned_role = 'brand' THEN
    INSERT INTO public.brands (id, company_name)
    VALUES (uid, COALESCE(u.raw_user_meta_data->>'name', ''))
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.influencers (id, display_name)
    VALUES (uid, COALESCE(u.raw_user_meta_data->>'name', ''))
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN assigned_role;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- 10. Suppression des clés secrètes stockées en base (désormais en env)
ALTER TABLE public.platform_settings DROP COLUMN IF EXISTS fedapay_secret_key;
ALTER TABLE public.platform_settings DROP COLUMN IF EXISTS moneyfusion_api_key;

NOTIFY pgrst, 'reload schema';
