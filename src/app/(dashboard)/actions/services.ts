"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createService(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const deliveryDays = parseInt(formData.get("delivery_days") as string, 10);

  if (!title || !description || isNaN(price) || isNaN(deliveryDays)) {
    return { error: "Tous les champs sont requis et doivent être valides." };
  }

  const { error } = await supabase.from("influencer_services").insert({
    influencer_id: user.id,
    title,
    description,
    price,
    delivery_days: deliveryDays,
    is_active: true
  });

  if (error) {
    console.error("Error creating service:", error);
    return { error: "Erreur lors de la création de la prestation." };
  }

  revalidatePath("/influencer/services");
  return { success: true };
}

export async function toggleServiceStatus(serviceId: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("influencer_services")
    .update({ is_active: isActive })
    .eq("id", serviceId)
    .eq("influencer_id", user.id); // Security: ensure it belongs to the user

  if (error) throw error;
  revalidatePath("/influencer/services");
}

export async function orderPrestation(serviceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Fetch the service details
  const { data: service } = await supabase
    .from("influencer_services")
    .select("*")
    .eq("id", serviceId)
    .single();

  if (!service) throw new Error("Prestation introuvable");

  // Create a direct collaboration (skipping application step)
  // For the MVP, we just create the collaboration and mock the checkout.
  // In reality, this would redirect to FedaPay Checkout first.
  const { data: collab, error } = await supabase
    .from("collaborations")
    .insert({
      brand_id: user.id,
      influencer_id: service.influencer_id,
      agreed_amount: service.price * 100, // stored in cents
      status: "in_progress", // Will become escrow_secured after payment
      deadline: new Date(Date.now() + service.delivery_days * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating direct order:", error);
    return { error: "Erreur lors de la commande" };
  }

  return { success: true, collaborationId: collab.id };
}
