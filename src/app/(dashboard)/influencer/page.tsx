import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function InfluencerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real data
  const { data: influencer } = await supabase.from("influencers").select("display_name").eq("id", user?.id).single();
  
  const { data: collaborations } = await supabase.from("collaborations").select("agreed_amount, status").eq("influencer_id", user?.id);
  const { data: applications } = await supabase
    .from("campaign_applications")
    .select("status, campaigns(title, budget, brands(company_name))")
    .eq("influencer_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // KPIs
  const totalRevenue = collaborations?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.agreed_amount), 0) || 0;
  const pendingRevenue = collaborations?.filter(c => c.status !== 'paid' && c.status !== 'cancelled').reduce((sum, c) => sum + Number(c.agreed_amount), 0) || 0;
  const activeCollabs = collaborations?.filter(c => c.status !== 'cancelled' && c.status !== 'paid').length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Hello, {influencer?.display_name || 'Influenceur'} ✌️</h1>
        <p className="text-white/60">Voici un résumé de votre activité et vos opportunités.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full group-hover:bg-emerald-500/20 transition-colors" />
          <CardHeader className="relative z-10 pb-2">
            <CardDescription className="text-white/60 font-medium">Revenus Générés</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <CardTitle className="text-4xl font-bold">{(totalRevenue / 100).toLocaleString()} €</CardTitle>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-[50px] rounded-full group-hover:bg-gold/20 transition-colors" />
          <CardHeader className="relative z-10 pb-2">
            <CardDescription className="text-white/60 font-medium">En Attente</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <CardTitle className="text-4xl font-bold">{(pendingRevenue / 100).toLocaleString()} €</CardTitle>
            <p className="text-sm text-gold font-medium mt-2 relative z-10">{activeCollabs} contrats actifs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-accent/10 border-primary/20 relative overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/90 font-bold">Marketplace</CardTitle>
            <CardDescription className="text-white/60">Découvrez de nouvelles campagnes adaptées à votre audience.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild className="w-auto mt-2 font-bold text-black">
              <Link href="/influencer/campaigns">Explorer</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Vos Candidatures Récents</h2>
          <Link href="/influencer/campaigns" className="text-primary text-sm font-medium hover:underline">Marketplace</Link>
        </div>
        
        <div className="space-y-4">
          {applications && applications.length > 0 ? (
            applications.map((app: any, i: number) => (
              <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center hover:bg-white/[0.04] transition-colors">
                <div>
                  <h3 className="font-bold text-lg mb-1">{app.campaigns?.title}</h3>
                  <p className="text-sm text-white/50">{app.campaigns?.brands?.company_name} • Budget: {(app.campaigns?.budget || 0) / 100} €</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                    app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-gold/20 text-gold'
                  }`}>
                    {app.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-white/40 border border-white/5 rounded-2xl border-dashed">
              Vous n'avez postulé à aucune campagne pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
