"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { profileSchema } from "@/utils/validations";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  const rawData = {
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    instagram: formData.get("instagram") || undefined,
    tiktok: formData.get("tiktok") || undefined
  };

  const validation = profileSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  
  if (profile?.role === "brand") {
    await supabase.from("brands").update({
      company_name: validation.data.displayName,
      description: validation.data.bio
    }).eq("id", user.id);
  } else if (profile?.role === "influencer") {
    await supabase.from("influencers").update({
      display_name: validation.data.displayName,
      bio: validation.data.bio
    }).eq("id", user.id);
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}
