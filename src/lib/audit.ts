import { createClient } from '@supabase/supabase-js';

type AuditEntry = {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

/**
 * Écrit une ligne dans public.audit_logs (service role, serveur uniquement).
 * N'échoue jamais bruyamment : l'audit ne doit pas casser le flux métier.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  try {
    const admin = createClient(url, serviceKey);
    await admin.from('audit_logs').insert({
      actor_id: entry.actorId ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
      ip: entry.ip ?? null,
    });
  } catch (error) {
    console.error('audit_log_failed', entry.action, error);
  }
}
