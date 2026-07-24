import { createClient } from "@/utils/supabase/server";
import { AcceptApplicationButton, ApproveDeliverableButton } from "./payment-buttons";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function BrandDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real data for brand
  const { data: brandData } = await supabase.from("brands").select("company_name").eq("id", user?.id).single();
  const { data: campaigns } = await supabase.from("campaigns").select("*").eq("brand_id", user?.id).order("created_at", { ascending: false }).limit(3);
  
  // Fetch pending applications for this brand's campaigns
  const { data: applications } = await supabase
    .from("campaign_applications")
    .select(`
      *,
      campaigns(title, budget, brand_id),
      influencers(display_name)
    `)
    .eq("status", "pending")
    .eq("campaigns.brand_id", user?.id);

  // Filter valid applications (since eq on joined table returns null campaigns if not matching)
  const validApplications = applications?.filter(app => app.campaigns !== null) || [];

  // Fetch active collaborations
  const { data: collaborations } = await supabase
    .from("collaborations")
    .select(`
      *,
      influencers(display_name),
      campaign_applications(campaigns(title))
    `)
    .eq("brand_id", user?.id)
    .neq("status", "paid");

  // Aggregate KPIs
  const totalCampaigns = campaigns?.length || 0;
  const totalBudget = campaigns?.reduce((sum, c) => sum + (c.budget || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Bonjour, {brandData?.company_name || 'Marque'} 👋</h1>
        <p className="text-white/60">Voici un aperçu de vos performances aujourd'hui.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-colors" />
          <CardHeader className="relative z-10 pb-2">
            <CardDescription className="text-white/60 font-medium">Budget Alloué</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <CardTitle className="text-4xl font-bold">{(totalBudget / 100).toLocaleString()} €</CardTitle>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] rounded-full group-hover:bg-accent/20 transition-colors" />
          <CardHeader className="relative z-10 pb-2">
            <CardDescription className="text-white/60 font-medium">Campagnes Créées</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <CardTitle className="text-4xl font-bold">{totalCampaigns}</CardTitle>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-accent/10 border-primary/20 relative overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/90 font-bold">Besoin d'aide ?</CardTitle>
            <CardDescription className="text-white/60">Notre IA peut vous aider à cibler la meilleure audience.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-auto mt-2 font-bold">
              Lancer l'IA
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Applications */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Candidatures en attente</h2>
          <div className="space-y-4">
            {validApplications.length > 0 ? (
              validApplications.map((app) => (
                <div key={app.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{app.influencers?.display_name}</h3>
                    <p className="text-sm text-white/50">Postule pour : {app.campaigns?.title}</p>
                  </div>
                  <div className="flex justify-end border-t border-white/5 pt-4">
                    <AcceptApplicationButton applicationId={app.id} amount={app.campaigns?.budget || 0} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-white/40 border border-white/5 rounded-2xl border-dashed">
                Aucune candidature pour l'instant.
              </div>
            )}
          </div>
        </div>

        {/* Active Collaborations */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Collaborations en cours</h2>
          <div className="space-y-4">
            {collaborations && collaborations.length > 0 ? (
              collaborations.map((collab) => (
                <div key={collab.id} className="p-5 rounded-2xl bg-white/[0.02] border border-primary/20 flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-bl-xl">Escrow Sécurisé</div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Avec {collab.influencers?.display_name}</h3>
                    <p className="text-sm text-white/50">Budget verrouillé : {(collab.agreed_amount || 0) / 100} €</p>
                  </div>
                  <div className="flex justify-end border-t border-white/5 pt-4">
                    <ApproveDeliverableButton collaborationId={collab.id} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-white/40 border border-white/5 rounded-2xl border-dashed">
                Aucune collaboration active.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
