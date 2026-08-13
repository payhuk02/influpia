"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { claimAchievementReward } from "./gamification";
import { createAffiliateApplication, getAffiliatePrograms } from "./affiliate";
import { purchaseAddOn, createSubscription } from "./subscriptions";

type ActionResult = { error?: string; success?: boolean };

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function getUserCollaborations(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("collaborations")
    .select("id, status, agreed_amount, brand_id, influencer_id")
    .or(`brand_id.eq.${userId},influencer_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function getCollaborationOptions(userId: string) {
  const collaborations = await getUserCollaborations(userId);
  return collaborations.map((c) => ({
    value: c.id,
    label: `Collaboration ${c.id.slice(0, 8)}… (${c.status})`,
  }));
}

export async function createScheduledContentForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const title = String(formData.get("title") ?? "").trim();
  const platform = String(formData.get("platform") ?? "instagram");
  const contentType = String(formData.get("content_type") ?? "post");
  const scheduledFor = String(formData.get("scheduled_for") ?? "");
  const caption = String(formData.get("caption") ?? "").trim();

  if (!title || !scheduledFor) return { error: "Titre et date requis" };

  const supabase = await createClient();
  const { error } = await supabase.from("scheduled_content").insert({
    influencer_id: user.id,
    title,
    platform,
    content_type: contentType,
    scheduled_for: scheduledFor,
    caption: caption || null,
    media_urls: [],
    status: "scheduled",
  });

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { success: true };
}

export async function createContentTemplateForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const templateName = String(formData.get("template_name") ?? "").trim();
  const templateType = String(formData.get("template_type") ?? "post");
  const platform = String(formData.get("platform") ?? "instagram");
  const captionTemplate = String(formData.get("caption_template") ?? "").trim();

  if (!templateName) return { error: "Nom du modèle requis" };

  const supabase = await createClient();
  const { error } = await supabase.from("content_templates").insert({
    user_id: user.id,
    template_name: templateName,
    template_type: templateType,
    platform,
    caption_template: captionTemplate || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { success: true };
}

export async function createSchedulingRuleForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const platform = String(formData.get("platform") ?? "instagram");
  const dayOfWeek = Number(formData.get("day_of_week") ?? 1);
  const optimalTime = String(formData.get("optimal_time") ?? "09:00");

  const supabase = await createClient();
  const { error } = await supabase.from("scheduling_rules").insert({
    user_id: user.id,
    platform,
    day_of_week: dayOfWeek,
    optimal_times: [optimalTime],
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { success: true };
}

export async function createContractForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const templateId = String(formData.get("template_id") ?? "");
  const collaborationId = String(formData.get("collaboration_id") ?? "");

  if (!templateId || !collaborationId) return { error: "Modèle et collaboration requis" };

  const { error } = await getAdminClient().rpc("generate_contract_from_template", {
    p_template_id: templateId,
    p_collaboration_id: collaborationId,
    p_variables: {
      brand_name: String(formData.get("brand_name") ?? "Marque"),
      influencer_name: String(formData.get("influencer_name") ?? "Influenceur"),
      campaign_title: String(formData.get("campaign_title") ?? "Campagne"),
      deliverables_list: String(formData.get("deliverables_list") ?? "Livrables"),
      total_amount: String(formData.get("total_amount") ?? "0"),
      currency: "XOF",
      contract_date: new Date().toLocaleDateString("fr-FR"),
    },
  });

  if (error) return { error: error.message };
  revalidatePath("/contracts");
  return { success: true };
}

export async function createDisputeForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const collaborationId = String(formData.get("collaboration_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const disputeType = String(formData.get("dispute_type") ?? "other");

  if (!collaborationId || !title || !description) {
    return { error: "Collaboration, titre et description requis" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("disputes").insert({
    collaboration_id: collaborationId,
    raised_by: user.id,
    dispute_type: disputeType,
    title,
    description,
    severity: "medium",
    status: "open",
  });

  if (error) return { error: error.message };
  revalidatePath("/disputes");
  return { success: true };
}

export async function createWorkflowForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const templateId = String(formData.get("template_id") ?? "");
  const workflowName = String(formData.get("workflow_name") ?? "").trim();

  if (!templateId || !workflowName) return { error: "Modèle et nom requis" };

  const { error } = await getAdminClient().rpc("create_workflow_from_template", {
    p_template_id: templateId,
    p_user_id: user.id,
    p_workflow_name: workflowName,
  });

  if (error) return { error: error.message };
  revalidatePath("/workflows");
  return { success: true };
}

export async function createReportForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const reportName = String(formData.get("report_name") ?? "").trim();
  const templateId = String(formData.get("template_id") ?? "") || undefined;
  const reportType = String(formData.get("report_type") ?? "custom");

  if (!reportName) return { error: "Nom du rapport requis" };

  const { error } = await getAdminClient().rpc("create_report", {
    p_user_id: user.id,
    p_template_id: templateId ?? null,
    p_report_name: reportName,
    p_report_type: reportType,
    p_parameters: {},
    p_file_format: "pdf",
  });

  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true };
}

export async function createApiKeyForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const keyName = String(formData.get("key_name") ?? "").trim();
  const keyType = String(formData.get("key_type") ?? "test");

  if (!keyName) return { error: "Nom de la clé requis" };

  const { error } = await getAdminClient().rpc("generate_api_key", {
    p_user_id: user.id,
    p_key_name: keyName,
    p_key_type: keyType,
    p_scopes: ["read"],
    p_rate_limit_per_minute: 60,
    p_rate_limit_per_hour: 1000,
    p_rate_limit_per_day: 10000,
  });

  if (error) return { error: error.message };
  revalidatePath("/api");
  return { success: true };
}

export async function createWebhookForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const webhookName = String(formData.get("webhook_name") ?? "").trim();
  const webhookUrl = String(formData.get("webhook_url") ?? "").trim();

  if (!webhookName || !webhookUrl) return { error: "Nom et URL requis" };

  const supabase = await createClient();
  const { error } = await supabase.from("api_webhooks").insert({
    user_id: user.id,
    webhook_name: webhookName,
    webhook_url: webhookUrl,
    events: ["campaign.created"],
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/api");
  return { success: true };
}

export async function subscribeToPlanForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const planId = String(formData.get("plan_id") ?? "");
  if (!planId) return { error: "Plan requis" };

  try {
    await createSubscription(user.id, planId, "manual");
    revalidatePath("/subscription");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur lors de l'abonnement" };
  }
}

export async function purchaseAddOnForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const addOnType = String(formData.get("add_on_type") ?? "");
  const priceCents = Number(formData.get("price_cents") ?? 0);
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!addOnType || !priceCents) return { error: "Option invalide" };

  try {
    await purchaseAddOn(user.id, addOnType, quantity, priceCents);
    revalidatePath("/subscription");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur lors de l'achat" };
  }
}

export async function joinAffiliateProgramForm(): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const programs = await getAffiliatePrograms();
  const programId = programs?.[0]?.id;
  if (!programId) return { error: "Aucun programme d'affiliation disponible" };

  try {
    await createAffiliateApplication(user.id, programId);
    revalidatePath("/affiliate");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur lors de l'inscription" };
  }
}

export async function createVettingForm(formData: FormData): Promise<ActionResult> {
  const { user } = await getAuthUser();
  if (!user) return { error: "Non autorisé" };

  const influencerId = String(formData.get("influencer_id") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal");

  if (!influencerId) return { error: "ID influenceur requis" };

  const supabase = await createClient();
  const { error } = await supabase.from("influencer_vetting").insert({
    influencer_id: influencerId,
    requested_by: user.id,
    priority,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/brand-safety");
  return { success: true };
}

export async function claimAchievementForm(formData: FormData): Promise<ActionResult> {
  const progressId = String(formData.get("progress_id") ?? "");
  if (!progressId) return { error: "Récompense invalide" };

  try {
    await claimAchievementReward(progressId);
    revalidatePath("/gamification");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur lors de la réclamation" };
  }
}
