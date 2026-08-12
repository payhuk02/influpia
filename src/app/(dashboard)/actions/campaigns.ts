"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { campaignSchema } from "@/utils/validations";

export async function createCampaign(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    budget: formData.get("budget"),
    target_influencers_count: formData.get("target_influencers_count"),
    target_platforms: formData.getAll("target_platforms")
  };

  const validation = campaignSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { error } = await supabase.from("campaigns").insert({
    brand_id: user.id,
    ...validation.data,
    status: "active" // Default to active for MVP
  });

  if (error) {
    console.error("Error creating campaign:", error);
    return { error: "Une erreur est survenue lors de la création de la campagne." };
  }

  revalidatePath("/brand");
  return { success: true };
}

export async function applyToCampaign(campaignId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from('profiles').select('kyc_status').eq('id', user.id).single();
  
  if (profile?.kyc_status !== 'verified') {
    redirect("/onboarding");
  }

  const { error } = await supabase.from("campaign_applications").insert({
    campaign_id: campaignId,
    influencer_id: user.id,
    status: "pending"
  });

  if (error) {
    console.error("Error applying to campaign:", error);
    return { error: error.message };
  }

  revalidatePath("/influencer/campaigns");
  return { success: true };
}
