"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePlatformSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  // Verify Admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) throw new Error("Accès refusé");

  // NOTE: secret keys (FedaPay secret, MoneyFusion API key) are NEVER stored in the
  // database. They live only in server environment variables.
  const fedapayPublic = formData.get("fedapay_public_key") as string;
  const commission = formData.get("platform_commission_rate") as string;

  const { error } = await supabase
    .from("platform_settings")
    .update({
      fedapay_public_key: fedapayPublic,
      platform_commission_rate: parseFloat(commission) || 10.0,
      updated_at: new Date().toISOString()
    })
    .eq("id", "00000000-0000-0000-0000-000000000000"); // Standard unique row ID

  if (error) throw error;

  revalidatePath("/admin/settings");
}
