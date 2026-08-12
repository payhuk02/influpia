import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal d'audit | Admin Influpia",
  description: "Traçabilité des actions sensibles : paiements, escrow, matching IA.",
  robots: { index: false, follow: false },
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
};

const ACTION_STYLES: Record<string, string> = {
  "payment.escrow_secured": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "ai_matching.run": "bg-primary/15 text-primary border-primary/30",
};

export default async function AuditPage() {
  const supabase = await createClient();

  // RLS : seuls les admins (has_role) peuvent lire audit_logs.
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, target_type, target_id, metadata, ip, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as AuditRow[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Journal d&apos;audit</h1>
        <p className="text-white/50 mt-1 text-sm">
          200 dernières actions sensibles enregistrées côté serveur (écriture réservée au service role).
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Impossible de charger le journal : {error.message}. Vérifiez que la migration
          <code className="mx-1">db/manual/20260812_notifications_audit.sql</code> a été exécutée.
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="text-left font-medium px-4 py-3">Date</th>
              <th className="text-left font-medium px-4 py-3">Action</th>
              <th className="text-left font-medium px-4 py-3">Cible</th>
              <th className="text-left font-medium px-4 py-3">Acteur</th>
              <th className="text-left font-medium px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-white/40">
                  Aucun événement enregistré pour le moment.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/5 align-top">
                <td className="px-4 py-3 whitespace-nowrap text-white/70">
                  {new Date(row.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded-md border text-xs font-medium ${
                      ACTION_STYLES[row.action] ?? "bg-white/5 text-white/70 border-white/10"
                    }`}
                  >
                    {row.action}
                  </span>
                  {row.metadata && Object.keys(row.metadata).length > 0 && (
                    <pre className="mt-1 text-[11px] text-white/40 whitespace-pre-wrap break-all">
                      {JSON.stringify(row.metadata)}
                    </pre>
                  )}
                </td>
                <td className="px-4 py-3 text-white/60">
                  {row.target_type ? `${row.target_type} · ${row.target_id ?? "—"}` : "—"}
                </td>
                <td className="px-4 py-3 text-white/50 font-mono text-xs break-all">
                  {row.actor_id ?? "système"}
                </td>
                <td className="px-4 py-3 text-white/50 font-mono text-xs">{row.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
