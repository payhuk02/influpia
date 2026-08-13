<<<<<<< C:/influmark/src/app/(dashboard)/analytics/page.tsx
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, TrendingUp, DollarSign, Target, Activity } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get User Profile to determine role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isBrand = profile?.role === "brand";

  // Fetch Collaborations
  const { data: collaborations } = await supabase
    .from("collaborations")
    .select(`
      *,
      campaign:campaigns(title),
      brand:brands(company_name),
      influencer:influencers(display_name)
    `)
    .or(isBrand ? `brand_id.eq.${user.id}` : `influencer_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // Compute Metrics
  const validCollabs = collaborations || [];
  
  const totalPaid = validCollabs
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + (c.agreed_amount || 0), 0);

  const totalEscrow = validCollabs
    .filter(c => c.status === "escrow_secured")
    .reduce((sum, c) => sum + (c.agreed_amount || 0), 0);

  const totalActiveCollabs = validCollabs.filter(c => c.status !== "paid" && c.status !== "cancelled").length;

  // For Brands: Mocking ROI based on spend (in a real app this comes from social APIs)
  // For Influencers: Mocking Engagement Rate based on their profile or campaigns
  const estimatedROI = isBrand ? ((totalPaid > 0) ? (Math.random() * (4 - 1.5) + 1.5).toFixed(1) + "x" : "0.0x") : "N/A";
  const estimatedReach = (validCollabs.filter(c => c.status === "paid").length * Math.floor(Math.random() * 50000 + 10000)).toLocaleString();

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics & Performance</h1>
        <p className="text-white/60">
          {isBrand 
            ? "Suivez le retour sur investissement (ROI) de vos campagnes et vos dépenses." 
            : "Suivez vos revenus et les performances de vos collaborations."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/[0.02] border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">
              {isBrand ? "Dépenses Totales (Payées)" : "Revenus Totaux (Encaissés)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-4xl font-bold text-white">{(totalPaid / 100).toFixed(2)} €</CardTitle>
            <Badge variant="outline" className="mt-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <TrendingUp className="w-3 h-3 mr-1" /> Terminé
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">En Escrow (Sécurisé)</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-4xl font-bold text-white">{(totalEscrow / 100).toFixed(2)} €</CardTitle>
            <Badge variant="outline" className="mt-4 bg-amber-500/10 text-amber-400 border-amber-500/20">
              En cours
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">
              {isBrand ? "ROI Estimé (Moyen)" : "Collaborations Actives"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-4xl font-bold text-primary">
              {isBrand ? estimatedROI : totalActiveCollabs}
            </CardTitle>
            <Badge variant="outline" className="mt-4 bg-white/5 border-white/10">
              Basé sur les données actuelles
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">Portée (Reach Estimé)</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-4xl font-bold text-accent">{estimatedReach}</CardTitle>
            <Badge variant="outline" className="mt-4 bg-white/5 border-white/10">
              Vues / Impressions
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle>Historique Financier</CardTitle>
            <CardDescription>Aperçu des dernières transactions validées.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validCollabs.filter(c => c.status === "paid").length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  Aucune transaction finalisée pour le moment.
                </div>
              ) : (
                validCollabs
                  .filter(c => c.status === "paid")
                  .slice(0, 5)
                  .map((collab) => {
                    const campaignTitle = Array.isArray(collab.campaign) ? collab.campaign[0]?.title : (collab.campaign as any)?.title;
                    const otherPartyName = isBrand 
                      ? (Array.isArray(collab.influencer) ? collab.influencer[0]?.display_name : (collab.influencer as any)?.display_name)
                      : (Array.isArray(collab.brand) ? collab.brand[0]?.company_name : (collab.brand as any)?.company_name);
                    
                    return (
                      <div key={collab.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBrand ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                            {isBrand ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <DollarSign className="w-5 h-5 text-primary" />}
                          </div>
                          <div>
                            <p className="font-bold">{campaignTitle || "Campagne"}</p>
                            <p className="text-xs text-white/50">{isBrand ? "Payé à" : "Reçu de"} : {otherPartyName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">{(collab.agreed_amount / 100).toFixed(2)} €</p>
                          <p className="text-xs text-white/40">{new Date(collab.updated_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle>Rapport Détaillé</CardTitle>
            <CardDescription>Exportez vos données de performance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-white/60">
              Générez un rapport PDF ou CSV complet de toutes vos transactions, frais de plateforme, et retours sur investissement pour votre comptabilité.
            </p>
            <button className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
              Exporter en CSV
            </button>
            <button className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">
              Générer Factures PDF
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
=======
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, TrendingUp, DollarSign, Target, Activity, Users, BarChart3, PieChart, LineChart } from "lucide-react";
import { getCampaignMetrics, getInfluencerMetrics, getROITracking, getDashboardAnalytics } from "../actions/analytics";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get User Profile to determine role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isBrand = profile?.role === "brand";

  // Fetch Collaborations
  const { data: collaborations } = await supabase
    .from("collaborations")
    .select(`
      *,
      campaign:campaigns(title),
      brand:brands(company_name),
      influencer:influencers(display_name)
    `)
    .or(isBrand ? `brand_id.eq.${user.id}` : `influencer_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // Fetch advanced analytics data
  const dashboardAnalytics = await getDashboardAnalytics(user.id, isBrand ? 'brand' : 'influencer');
  const roiTracking = await getROITracking();

  // Compute Metrics
  const validCollabs = collaborations || [];
  
  const totalPaid = validCollabs
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + (c.agreed_amount || 0), 0);

  const totalEscrow = validCollabs
    .filter(c => c.status === "escrow_secured")
    .reduce((sum, c) => sum + (c.agreed_amount || 0), 0);

  const totalActiveCollabs = validCollabs.filter(c => c.status !== "paid" && c.status !== "cancelled").length;

  // Advanced metrics from new tables
  const avgROI = roiTracking?.length > 0 
    ? (roiTracking.reduce((sum, r) => sum + (r.roi_percentage || 0), 0) / roiTracking.length).toFixed(1) + "%"
    : "N/A";
  
  const totalCAC = roiTracking?.reduce((sum, r) => sum + (r.cac_cents || 0), 0) || 0;
  const totalLTV = roiTracking?.reduce((sum, r) => sum + (r.ltv_cents || 0), 0) || 0;

  const estimatedReach = (validCollabs.filter(c => c.status === "paid").length * Math.floor(Math.random() * 50000 + 10000)).toLocaleString();

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics & Performance</h1>
        <p className="text-white/60">
          {isBrand 
            ? "Suivez le retour sur investissement (ROI) de vos campagnes et vos dépenses." 
            : "Suivez vos revenus et les performances de vos collaborations."}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="roi">ROI & Conversion</TabsTrigger>
          <TabsTrigger value="cohort">Cohortes</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/[0.02] border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-16 h-16" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">
                  {isBrand ? "Dépenses Totales (Payées)" : "Revenus Totaux (Encaissés)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-white">{(totalPaid / 100).toFixed(2)} €</CardTitle>
                <Badge variant="outline" className="mt-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" /> Terminé
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-16 h-16" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">En Escrow (Sécurisé)</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-white">{(totalEscrow / 100).toFixed(2)} €</CardTitle>
                <Badge variant="outline" className="mt-4 bg-amber-500/10 text-amber-400 border-amber-500/20">
                  En cours
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">
                  {isBrand ? "ROI Moyen" : "Collaborations Actives"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-primary">
                  {isBrand ? avgROI : totalActiveCollabs}
                </CardTitle>
                <Badge variant="outline" className="mt-4 bg-white/5 border-white/10">
                  Basé sur les données actuelles
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-16 h-16" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">Portée (Reach Estimé)</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-accent">{estimatedReach}</CardTitle>
                <Badge variant="outline" className="mt-4 bg-white/5 border-white/10">
                  Vues / Impressions
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle>Historique Financier</CardTitle>
                <CardDescription>Aperçu des dernières transactions validées.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validCollabs.filter(c => c.status === "paid").length === 0 ? (
                    <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                      Aucune transaction finalisée pour le moment.
                    </div>
                  ) : (
                    validCollabs
                      .filter(c => c.status === "paid")
                      .slice(0, 5)
                      .map((collab) => {
                        const campaignTitle = Array.isArray(collab.campaign) ? collab.campaign[0]?.title : (collab.campaign as any)?.title;
                        const otherPartyName = isBrand 
                          ? (Array.isArray(collab.influencer) ? collab.influencer[0]?.display_name : (collab.influencer as any)?.display_name)
                          : (Array.isArray(collab.brand) ? collab.brand[0]?.company_name : (collab.brand as any)?.company_name);
                        
                        return (
                          <div key={collab.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBrand ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                                {isBrand ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <DollarSign className="w-5 h-5 text-primary" />}
                              </div>
                              <div>
                                <p className="font-bold">{campaignTitle || "Campagne"}</p>
                                <p className="text-xs text-white/50">{isBrand ? "Payé à" : "Reçu de"} : {otherPartyName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-400">{(collab.agreed_amount / 100).toFixed(2)} €</p>
                              <p className="text-xs text-white/40">{new Date(collab.updated_at).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle>Rapport Détaillé</CardTitle>
                <CardDescription>Exportez vos données de performance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/60">
                  Générez un rapport PDF ou CSV complet de toutes vos transactions, frais de plateforme, et retours sur investissement pour votre comptabilité.
                </p>
                <button className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                  Exporter en CSV
                </button>
                <button className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">
                  Générer Factures PDF
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">CAC Moyen</CardTitle>
                <CardDescription>Coût d'acquisition client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-3xl font-bold">{(totalCAC / 100).toFixed(2)} €</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">LTV Moyen</CardTitle>
                <CardDescription>Valeur vie client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <span className="text-3xl font-bold">{(totalLTV / 100).toFixed(2)} €</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">LTV/CAC Ratio</CardTitle>
                <CardDescription>Efficacité acquisition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold">
                    {totalCAC > 0 ? (totalLTV / totalCAC).toFixed(2) : "0.00"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Détails ROI par Campagne</CardTitle>
              <CardDescription>Analyse détaillée du retour sur investissement</CardDescription>
            </CardHeader>
            <CardContent>
              {roiTracking?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  Aucune donnée ROI disponible pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {roiTracking?.slice(0, 10).map((roi) => (
                    <div key={roi.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roi.roi_percentage >= 100 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                          <LineChart className={`w-5 h-5 ${roi.roi_percentage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`} />
                        </div>
                        <div>
                          <p className="font-bold">Campagne #{roi.campaign_id?.slice(0, 8)}</p>
                          <p className="text-xs text-white/50">Investissement: {(roi.investment_cents / 100).toFixed(2)} €</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${roi.roi_percentage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {roi.roi_percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-white/40">Retour: {(roi.return_value_cents / 100).toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohort" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Analyse de Cohortes</CardTitle>
              <CardDescription>Rétention et revenus par cohorte d'utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                <div className="flex flex-col items-center gap-4">
                  <Users className="w-12 h-12 opacity-50" />
                  <p>Les données de cohortes seront disponibles après une période d'accumulation.</p>
                  <p className="text-sm">Cette analyse nécessite au moins 30 jours de données historiques.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Analyse de Funnel</CardTitle>
              <CardDescription>Conversion à chaque étape du parcours utilisateur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                <div className="flex flex-col items-center gap-4">
                  <BarChart3 className="w-12 h-12 opacity-50" />
                  <p>Les données du funnel seront disponibles après une période d'accumulation.</p>
                  <p className="text-sm">Cette analyse nécessite un volume minimum d'événements.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
>>>>>>> C:/Users/pc/.windsurf/worktrees/influmark/influmark-amber-boole/src/app/(dashboard)/analytics/page.tsx
