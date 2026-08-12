import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function AdminCampaignsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      *,
      brand:brands(company_name)
    `)
    .order("created_at", { ascending: false });

  async function forceCloseCampaign(campaignId: string) {
    "use server";
    const supabaseServer = await createClient();
    
    await supabaseServer
      .from('campaigns')
      .update({ status: 'closed' })
      .eq('id', campaignId);

    revalidatePath("/admin/campaigns");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Modération des Campagnes</h1>
        <p className="text-white/60">Consultez les campagnes en cours et intervenez si nécessaire.</p>
      </div>

      <div className="grid gap-4">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id} className="border-white/10 bg-white/5">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">{campaign.title}</h3>
                  <Badge 
                    variant={campaign.status === 'active' ? 'default' : 'secondary'}
                    className={campaign.status === 'active' ? 'bg-emerald-500 text-white' : ''}
                  >
                    {campaign.status}
                  </Badge>
                  {campaign.is_boosted && <Badge className="bg-purple-600 text-white">Boostée</Badge>}
                </div>
                <p className="text-sm text-white/60 line-clamp-1">{campaign.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                  <span>Par: {Array.isArray(campaign.brand) ? campaign.brand[0]?.company_name : (campaign.brand as any)?.company_name}</span>
                  <span>Budget: {campaign.budget} €</span>
                  <span>Créé le: {new Date(campaign.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <a href={`/brand/campaigns/${campaign.id}`} target="_blank" rel="noreferrer">
                   <Button variant="outline" size="sm">Voir Détails</Button>
                </a>
                {campaign.status === 'active' && (
                  <form action={async () => {
                    "use server";
                    await forceCloseCampaign(campaign.id);
                  }}>
                    <Button variant="destructive" size="sm">Forcer Clôture</Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {!campaigns?.length && (
          <p className="text-center text-white/50 py-10">Aucune campagne trouvée.</p>
        )}
      </div>
    </div>
  );
}
