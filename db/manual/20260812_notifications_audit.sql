-- ============================================================
-- À exécuter dans le SQL editor Supabase
-- Centre de notifications + journal d'audit + idempotence webhooks
-- ============================================================

-- 1. Notifications ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications (user_id) WHERE is_read = FALSE;

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own notifications" ON public.notifications;
CREATE POLICY "Users read their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own notifications" ON public.notifications;
CREATE POLICY "Users update their own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their own notifications" ON public.notifications;
CREATE POLICY "Users delete their own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);
-- Aucune policy INSERT : seuls les triggers SECURITY DEFINER et service_role
-- peuvent créer une notification (anti-spam / anti-usurpation).

-- Helper d'émission
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id UUID, _type TEXT, _title TEXT, _body TEXT DEFAULT NULL, _link TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nid UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user_id, _type, _title, _body, _link)
  RETURNING id INTO nid;
  RETURN nid;
END;
$$;

-- 2. Triggers métier ----------------------------------------------
CREATE OR REPLACE FUNCTION public.on_new_message_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_user(
    NEW.receiver_id, 'message', 'Nouveau message',
    LEFT(COALESCE(NEW.content, ''), 140), '/messages'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_message_notify ON public.messages;
CREATE TRIGGER trg_new_message_notify
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.on_new_message_notify();

CREATE OR REPLACE FUNCTION public.on_collaboration_status_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_user(NEW.brand_id, 'collaboration',
    'Collaboration mise à jour', 'Nouveau statut : ' || NEW.status, '/brand');
  PERFORM public.notify_user(NEW.influencer_id, 'collaboration',
    'Collaboration mise à jour', 'Nouveau statut : ' || NEW.status, '/influencer');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_collaboration_status_notify ON public.collaborations;
CREATE TRIGGER trg_collaboration_status_notify
AFTER INSERT OR UPDATE OF status ON public.collaborations
FOR EACH ROW EXECUTE FUNCTION public.on_collaboration_status_notify();

-- 3. Journal d'audit ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs (actor_id, created_at DESC);

GRANT ALL ON public.audit_logs TO service_role;
GRANT SELECT ON public.audit_logs TO authenticated;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
-- Écriture réservée au service_role (serveur uniquement).

-- 4. Idempotence des webhooks de paiement -------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_id)
);

GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy : table strictement serveur.

NOTIFY pgrst, 'reload schema';
