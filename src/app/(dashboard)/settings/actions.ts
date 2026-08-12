"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBrandProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const companyName = formData.get("company_name") as string;
  const description = formData.get("description") as string;
  const vatNumber = formData.get("vat_number") as string;
  const address = formData.get("address") as string;
  const brandGuidelines = formData.get("brand_guidelines_url") as string;

  const { error } = await supabase
    .from("brands")
    .update({
      company_name: companyName,
      description: description,
      vat_number: vatNumber,
      brand_guidelines_url: brandGuidelines,
      billing_address: address ? { full_address: address } : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/settings");
}

export async function updateInfluencerProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const displayName = formData.get("display_name") as string;
  const bio = formData.get("bio") as string;
  const portfolioUrl = formData.get("portfolio_url") as string;
  const fedapayId = formData.get("fedapay_account_id") as string;
  const moneyfusionId = formData.get("moneyfusion_account_id") as string;

  const { error } = await supabase
    .from("influencers")
    .update({
      display_name: displayName,
      bio: bio,
      portfolio_url: portfolioUrl,
      fedapay_account_id: fedapayId,
      moneyfusion_account_id: moneyfusionId,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/settings");
}
