import { createClient } from "@/utils/supabase/server";
import { applyToCampaign } from "../../actions/campaigns";

export default async function CampaignsMarketplacePage() {
  const supabase = await createClient();
  
  // Fetch active campaigns and their associated brand profiles
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      *,
      brand:brands(company_name)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-white/60">Découvrez les campagnes qui matchent avec votre profil.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-medium">
          ✨ Match IA (95%+)
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 cursor-pointer transition-colors">
          Mode & Beauté
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 cursor-pointer transition-colors">
          Tech
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 cursor-pointer transition-colors">
          Budget &gt; 1000€
        </div>
      </div>

      {/* Campaign List */}
      <div className="grid gap-6">
        {campaigns?.map((campaign) => (
          <div key={campaign.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full group-hover:bg-primary/10 transition-colors pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex-shrink-0 flex items-center justify-center font-bold text-xl">
                  {campaign.brand?.company_name?.[0] || "?"}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{campaign.title}</h3>
                  <p className="text-sm text-white/50 mb-3">{campaign.brand?.company_name}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {campaign.target_platforms?.map((platform: string) => (
                      <span key={platform} className="px-2 py-1 rounded bg-white/5 text-xs font-medium text-white/70">
                        {platform}
                      </span>
                    ))}
                    <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium border border-primary/20">
                      ~ {campaign.budget} €
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-emerald-400 mb-1">98% Match</p>
                  <p className="text-xs text-white/40">Basé sur votre audience</p>
                </div>
                
                <form action={async () => {
                  "use server";
                  await applyToCampaign(campaign.id);
                }}>
                  <button type="submit" className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                    Postuler
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}

        {!campaigns?.length && (
          <div className="p-10 text-center text-white/50">
            Aucune campagne active pour le moment. Revenez plus tard !
          </div>
        )}
      </div>
    </div>
  );
}
