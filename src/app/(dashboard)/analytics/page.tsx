import { createClient } from "@/utils/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Basic analytics based on Option 2
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  let totalCampaigns = 0;
  let totalCollabs = 0;
  let totalMoney = 0;

  if (profile?.role === "brand") {
    const { data: campaigns } = await supabase.from("campaigns").select("id").eq("brand_id", user?.id);
    totalCampaigns = campaigns?.length || 0;
    
    const { data: collabs } = await supabase.from("collaborations").select("agreed_amount").eq("brand_id", user?.id);
    totalCollabs = collabs?.length || 0;
    totalMoney = collabs?.reduce((sum, c) => sum + Number(c.agreed_amount), 0) || 0;
  } else if (profile?.role === "influencer") {
    const { data: apps } = await supabase.from("campaign_applications").select("id").eq("influencer_id", user?.id);
    totalCampaigns = apps?.length || 0; // Number of applications

    const { data: collabs } = await supabase.from("collaborations").select("agreed_amount").eq("influencer_id", user?.id);
    totalCollabs = collabs?.length || 0;
    totalMoney = collabs?.reduce((sum, c) => sum + Number(c.agreed_amount), 0) || 0;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Statistiques</h1>
        <p className="text-white/60">Analysez vos performances basées sur vos collaborations.</p>
      </div>

      {/* Main KPI Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: profile?.role === 'brand' ? "Campagnes Créées" : "Candidatures", value: totalCampaigns },
          { label: "Collaborations Conclues", value: totalCollabs },
          { label: profile?.role === 'brand' ? "Budget Total Engagé" : "Revenus Potentiels", value: `${totalMoney.toLocaleString()} €` },
        ].map((kpi, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-white/60 text-sm font-medium mb-2">{kpi.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-10 text-center text-white/40 border border-white/5 rounded-2xl border-dashed">
        <p className="mb-2">📊</p>
        <p>Les métriques avancées (Vues, Engagement, Clics) nécessitent l'intégration d'API réseaux sociaux (ex: Instagram Graph API).</p>
        <p className="text-sm mt-2 text-white/20">Disponible dans une future version.</p>
      </div>
    </div>
  );
}
