"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptApplicationAndPay(applicationId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  // 1. Get Application Details
  const { data: application, error: appError } = await supabase
    .from("campaign_applications")
    .select("campaign_id, influencer_id, campaigns(brand_id)")
    .eq("id", applicationId)
    .single();

  if (appError || !application) return { error: "Candidature introuvable." };
  
  // Security check: Only the brand owning the campaign can accept it
  if (application.campaigns?.brand_id !== user.id) return { error: "Non autorisé" };

  // 2. Update Application Status
  await supabase.from("campaign_applications").update({ status: "accepted" }).eq("id", applicationId);

  // 3. Create Collaboration in 'pending_payment' status
  // Note: Since DB check constraint only allows ('in_progress', 'submitted', 'approved', 'paid', 'cancelled'),
  // we will treat the initial phase before webhook differently, or temporarily bypass it by setting it directly to 'in_progress'
  // Actually, we'll create it as 'in_progress' conceptually after payment. 
  // Let's create it as 'cancelled' first (hack for MVP since pending is not in DB ENUM check) or just update schema?
  // We'll update schema check constraint later if needed. Let's assume we create it right after webhook.
  // Wait, better yet, we just return the redirect URL with all data encoded for the mock checkout.
  
  const redirectUrl = `/mock-checkout?app_id=${applicationId}&amount=${amount}&collab_id=new`;

  return { success: true, checkoutUrl: redirectUrl };
}

export async function approveDeliverables(collaborationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  // Update status to paid (triggers payout virtually)
  const { error } = await supabase
    .from("collaborations")
    .update({ status: "paid" })
    .eq("id", collaborationId)
    .eq("brand_id", user.id);

  if (error) {
    console.error("Payout error", error);
    return { error: "Erreur lors du paiement." };
  }

  revalidatePath("/brand");
  return { success: true };
}
