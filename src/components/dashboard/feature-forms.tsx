"use client";

import { FormModal, type FormField } from "@/components/dashboard/form-modal";
import {
  createScheduledContentForm,
  createContentTemplateForm,
  createSchedulingRuleForm,
  createContractForm,
  createDisputeForm,
  createWorkflowForm,
  createReportForm,
  createApiKeyForm,
  createWebhookForm,
  createVettingForm,
  joinAffiliateProgramForm,
  subscribeToPlanForm,
  purchaseAddOnForm,
  claimAchievementForm,
} from "@/app/(dashboard)/actions/form-actions";
import { Award, ArrowRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
];

const CONTENT_TYPES = [
  { value: "post", label: "Publication" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "video", label: "Vidéo" },
];

const DISPUTE_TYPES = [
  { value: "quality", label: "Qualité" },
  { value: "delivery", label: "Livraison" },
  { value: "payment", label: "Paiement" },
  { value: "communication", label: "Communication" },
  { value: "other", label: "Autre" },
];

const DAY_OPTIONS = [
  { value: "0", label: "Dimanche" },
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
];

export function CreateScheduledContentButton(props: { className?: string; size?: "default" | "sm"; label?: string }) {
  const fields: FormField[] = [
    { name: "title", label: "Titre", required: true, placeholder: "Titre du contenu" },
    { name: "platform", label: "Plateforme", type: "select", required: true, options: PLATFORM_OPTIONS, defaultValue: "instagram" },
    { name: "content_type", label: "Type", type: "select", required: true, options: CONTENT_TYPES, defaultValue: "post" },
    { name: "scheduled_for", label: "Date et heure", type: "datetime-local", required: true },
    { name: "caption", label: "Légende", type: "textarea", placeholder: "Texte de la publication…" },
  ];
  return (
    <FormModal
      label={props.label ?? "Nouveau Rendez-vous"}
      title="Programmer du contenu"
      description="Planifiez une publication sur vos réseaux sociaux."
      fields={fields}
      action={createScheduledContentForm}
      className={props.className}
      size={props.size}
    />
  );
}

export function CreateContentTemplateButton(props: { className?: string; size?: "default" | "sm"; label?: string }) {
  return (
    <FormModal
      label={props.label ?? "Nouveau Modèle"}
      title="Créer un modèle"
      fields={[
        { name: "template_name", label: "Nom du modèle", required: true },
        { name: "template_type", label: "Type", type: "select", options: CONTENT_TYPES, defaultValue: "post", required: true },
        { name: "platform", label: "Plateforme", type: "select", options: PLATFORM_OPTIONS, defaultValue: "instagram", required: true },
        { name: "caption_template", label: "Modèle de légende", type: "textarea" },
      ]}
      action={createContentTemplateForm}
      className={props.className}
      size={props.size}
    />
  );
}

export function CreateSchedulingRuleButton(props: { className?: string; size?: "default" | "sm"; label?: string }) {
  return (
    <FormModal
      label={props.label ?? "Nouvelle Règle"}
      title="Créer une règle de programmation"
      fields={[
        { name: "platform", label: "Plateforme", type: "select", options: PLATFORM_OPTIONS, defaultValue: "instagram", required: true },
        { name: "day_of_week", label: "Jour", type: "select", options: DAY_OPTIONS, defaultValue: "1", required: true },
        { name: "optimal_time", label: "Heure optimale", type: "text", defaultValue: "09:00", required: true },
      ]}
      action={createSchedulingRuleForm}
      className={props.className}
      size={props.size}
    />
  );
}

export function CreateContractButton({
  templates,
  collaborations,
  className,
  size,
  label,
}: {
  templates: { id: string; name?: string; display_name?: string }[];
  collaborations: { value: string; label: string }[];
  className?: string;
  size?: "default" | "sm";
  label?: string;
}) {
  return (
    <FormModal
      label={label ?? "Nouveau Contrat"}
      title="Créer un contrat"
      description="Générez un contrat à partir d'un modèle et d'une collaboration."
      fields={[
        {
          name: "template_id",
          label: "Modèle",
          type: "select",
          required: true,
          options: templates.map((t) => ({
            value: t.id,
            label: t.display_name ?? t.name ?? (t as { template_name?: string }).template_name ?? t.id.slice(0, 8),
          })),
        },
        { name: "collaboration_id", label: "Collaboration", type: "select", required: true, options: collaborations },
        { name: "campaign_title", label: "Titre campagne", required: true },
        { name: "brand_name", label: "Nom marque", required: true },
        { name: "influencer_name", label: "Nom influenceur", required: true },
        { name: "deliverables_list", label: "Livrables", type: "textarea", required: true },
        { name: "total_amount", label: "Montant total", type: "number", required: true },
      ]}
      action={createContractForm}
      className={className}
      size={size}
    />
  );
}

export function CreateDisputeButton({
  collaborations,
  className,
  size,
  label,
}: {
  collaborations: { value: string; label: string }[];
  className?: string;
  size?: "default" | "sm";
  label?: string;
}) {
  return (
    <FormModal
      label={label ?? "Nouveau Litige"}
      title="Ouvrir un litige"
      fields={[
        { name: "collaboration_id", label: "Collaboration", type: "select", required: true, options: collaborations },
        { name: "title", label: "Titre", required: true },
        { name: "dispute_type", label: "Type", type: "select", options: DISPUTE_TYPES, defaultValue: "other", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
      ]}
      action={createDisputeForm}
      className={className}
      size={size}
    />
  );
}

export function CreateWorkflowButton({
  templates,
  className,
  size,
  label,
}: {
  templates: { id: string; display_name?: string; name?: string }[];
  className?: string;
  size?: "default" | "sm";
  label?: string;
}) {
  return (
    <FormModal
      label={label ?? "Nouveau Workflow"}
      title="Créer un workflow"
      fields={[
        {
          name: "template_id",
          label: "Modèle",
          type: "select",
          required: true,
          options: templates.map((t) => ({
            value: t.id,
            label: t.display_name ?? t.name ?? (t as { template_name?: string }).template_name ?? t.id.slice(0, 8),
          })),
        },
        { name: "workflow_name", label: "Nom du workflow", required: true },
      ]}
      action={createWorkflowForm}
      className={className}
      size={size}
    />
  );
}

export function CreateReportButton({
  templates,
  className,
  size,
  label,
}: {
  templates: { id: string; display_name?: string; name?: string; report_type?: string }[];
  className?: string;
  size?: "default" | "sm";
  label?: string;
}) {
  return (
    <FormModal
      label={label ?? "Nouveau Rapport"}
      title="Générer un rapport"
      fields={[
        { name: "report_name", label: "Nom du rapport", required: true },
        {
          name: "template_id",
          label: "Modèle (optionnel)",
          type: "select",
          options: [{ value: "", label: "Aucun modèle" }, ...templates.map((t) => ({ value: t.id, label: t.display_name ?? t.name ?? t.id.slice(0, 8) }))],
        },
        { name: "report_type", label: "Type", defaultValue: "custom" },
      ]}
      action={createReportForm}
      className={className}
      size={size}
    />
  );
}

export function CreateApiKeyButton(props: { className?: string; size?: "default" | "sm"; label?: string }) {
  return (
    <FormModal
      label={props.label ?? "Nouvelle Clé API"}
      title="Créer une clé API"
      fields={[
        { name: "key_name", label: "Nom de la clé", required: true },
        {
          name: "key_type",
          label: "Type",
          type: "select",
          options: [
            { value: "test", label: "Test" },
            { value: "live", label: "Production" },
            { value: "read_only", label: "Lecture seule" },
          ],
          defaultValue: "test",
          required: true,
        },
      ]}
      action={createApiKeyForm}
      className={props.className}
      size={props.size}
    />
  );
}

export function CreateWebhookButton(props: { className?: string; size?: "default" | "sm"; label?: string }) {
  return (
    <FormModal
      label={props.label ?? "Nouveau Webhook"}
      title="Créer un webhook"
      fields={[
        { name: "webhook_name", label: "Nom", required: true },
        { name: "webhook_url", label: "URL", required: true, placeholder: "https://…" },
      ]}
      action={createWebhookForm}
      className={props.className}
      size={props.size}
    />
  );
}

export function CreateVettingButton(props: { className?: string; size?: "default" | "sm"; label?: string }) {
  return (
    <FormModal
      label={props.label ?? "Nouvelle Vérification"}
      title="Demander une vérification"
      description="Entrez l'UUID de l'influenceur à vérifier."
      fields={[
        { name: "influencer_id", label: "ID influenceur", required: true, placeholder: "UUID de l'influenceur" },
        {
          name: "priority",
          label: "Priorité",
          type: "select",
          options: [
            { value: "low", label: "Basse" },
            { value: "normal", label: "Normale" },
            { value: "high", label: "Haute" },
            { value: "urgent", label: "Urgente" },
          ],
          defaultValue: "normal",
          required: true,
        },
      ]}
      action={createVettingForm}
      className={props.className}
      size={props.size}
    />
  );
}

export function UseContractTemplateButton({
  templateId,
  templateName,
  collaborations,
  className,
}: {
  templateId: string;
  templateName: string;
  templates?: { id: string; name?: string; display_name?: string }[];
  collaborations: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <FormModal
      label="Utiliser ce modèle"
      title={`Contrat — ${templateName}`}
      description="Complétez les informations pour générer le contrat."
      variant="outline"
      size="sm"
      className={className ?? "w-full border-white/10"}
      fields={[
        { name: "template_id", type: "hidden", label: "", defaultValue: templateId },
        {
          name: "collaboration_id",
          label: "Collaboration",
          type: "select",
          required: true,
          options: collaborations,
        },
        { name: "campaign_title", label: "Titre campagne", required: true },
        { name: "brand_name", label: "Nom marque", required: true },
        { name: "influencer_name", label: "Nom influenceur", required: true },
        { name: "deliverables_list", label: "Livrables", type: "textarea", required: true },
        { name: "total_amount", label: "Montant total", type: "number", required: true },
      ]}
      action={createContractForm}
    />
  );
}

export function UseWorkflowTemplateButton({
  templateId,
  templateName,
}: {
  templateId: string;
  templateName: string;
}) {
  return (
    <FormModal
      label="Utiliser ce modèle"
      title={`Workflow — ${templateName}`}
      variant="outline"
      size="sm"
      className="w-full border-white/10"
      fields={[
        { name: "template_id", type: "hidden", label: "", defaultValue: templateId },
        { name: "workflow_name", label: "Nom du workflow", required: true, defaultValue: templateName },
      ]}
      action={createWorkflowForm}
    />
  );
}

export function UseReportTemplateButton({
  templateId,
  templateName,
  reportType,
}: {
  templateId: string;
  templateName: string;
  reportType?: string;
}) {
  return (
    <FormModal
      label="Utiliser ce modèle"
      title={`Rapport — ${templateName}`}
      variant="outline"
      size="sm"
      className="w-full border-white/10"
      fields={[
        { name: "template_id", type: "hidden", label: "", defaultValue: templateId },
        { name: "report_name", label: "Nom du rapport", required: true, defaultValue: templateName },
        { name: "report_type", type: "hidden", label: "", defaultValue: reportType ?? "custom" },
      ]}
      action={createReportForm}
    />
  );
}

export function SubscribePlanButton({
  planId,
  isCurrent,
  className,
}: {
  planId: string;
  isCurrent: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("plan_id", planId);
      const result = await subscribeToPlanForm(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Abonnement mis à jour");
        router.refresh();
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      className={className}
      disabled={isCurrent || loading}
      onClick={handleSubscribe}
    >
      {isCurrent ? "Plan actuel" : loading ? "Traitement…" : "Choisir ce plan"}
      {!isCurrent && !loading && <ArrowRight className="w-4 h-4 ml-2" />}
    </Button>
  );
}

export function PurchaseAddOnButton({
  addOnType,
  priceCents,
  className,
}: {
  addOnType: string;
  priceCents: number;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("add_on_type", addOnType);
      formData.set("price_cents", String(priceCents));
      formData.set("quantity", "1");
      const result = await purchaseAddOnForm(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Option ajoutée");
        router.refresh();
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={className ?? "w-full border-white/10"}
      disabled={loading}
      onClick={handlePurchase}
    >
      {loading ? "Traitement…" : "Ajouter"}
    </Button>
  );
}

export function ClaimRewardButton({ progressId }: { progressId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("progress_id", progressId);
      const result = await claimAchievementForm(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Récompense réclamée");
        router.refresh();
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      className="w-full bg-primary hover:bg-primary/90"
      disabled={loading}
      onClick={handleClaim}
    >
      <Award className="w-4 h-4 mr-1" />
      {loading ? "Traitement…" : "Réclamer récompense"}
    </Button>
  );
}

export function JoinAffiliateButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    try {
      const result = await joinAffiliateProgramForm();
      if (result.error) toast.error(result.error);
      else {
        toast.success("Inscription au programme réussie");
        router.refresh();
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      className={`w-full bg-primary hover:bg-primary/90 ${className ?? ""}`}
      onClick={handleJoin}
      disabled={loading}
    >
      <Share2 className="w-4 h-4 mr-2" />
      {loading ? "Inscription…" : "Rejoindre le programme"}
    </Button>
  );
}