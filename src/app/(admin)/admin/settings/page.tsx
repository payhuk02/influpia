import { createClient } from "@/utils/supabase/server";
import { AdminSettingsForm } from "./admin-settings-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  // Fetch current platform settings
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000000")
    .single();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramètres de la Plateforme</h1>
        <p className="text-white/60">Configurez les clés API globales pour les paiements (FedaPay, Moneyfusion) et les frais de plateforme.</p>
      </div>

      <AdminSettingsForm initialSettings={settings} />
    </div>
  );
}
