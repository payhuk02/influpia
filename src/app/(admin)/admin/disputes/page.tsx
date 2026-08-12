import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { DownloadContractButton } from "@/components/download-contract-button";
import { DollarSign } from "lucide-react";

export default async function AdminDisputesPage() {
  const supabase = await createClient();

  const { data: collaborations } = await supabase
    .from("collaborations")
    .select(`
      *,
      campaign:campaigns(title),
      influencer:influencers(display_name, fedapay_account_id, moneyfusion_account_id),
      brand:brands(company_name)
    `)
    .order("created_at", { ascending: false });

  async function resolveDispute(collaborationId: string, action: 'refund_brand' | 'pay_influencer') {
    "use server";
    const supabaseServer = await createClient();
    
    if (action === 'refund_brand') {
      // In a real scenario, call FedaPay/Moneyfusion Refund API here
      await supabaseServer
        .from('collaborations')
        .update({ status: 'refunded', deliverable_status: 'rejected' })
        .eq('id', collaborationId);
    } 
    else if (action === 'pay_influencer') {
      // 1. Fetch Collaboration Details
      const { data: collab } = await supabaseServer
        .from('collaborations')
        .select(`agreed_amount, influencer:influencers(fedapay_account_id, moneyfusion_account_id)`)
        .eq('id', collaborationId)
        .single();
        
      if (!collab) throw new Error("Collaboration not found");

      // 2. Fetch Platform Settings (Commission & Keys)
      const { data: settings } = await supabaseServer
        .from('platform_settings')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      const influencerData = Array.isArray(collab.influencer) ? collab.influencer[0] : collab.influencer;
      const commissionRate = settings?.platform_commission_rate || 10;
      const payoutAmount = Math.floor(collab.agreed_amount * (1 - commissionRate / 100)); // amount in cents
      
      const fedapayAccountId = influencerData?.fedapay_account_id;
      const fedapaySecretKey = settings?.fedapay_secret_key;

      if (!fedapayAccountId) {
        console.warn("L'influenceur n'a pas configuré son compte FedaPay.");
      }

      // 3. Trigger FedaPay Payout API (Mocked for safety in this version)
      if (fedapaySecretKey && fedapayAccountId) {
        try {
          console.log(`[PAYOUT] Envoi de ${payoutAmount} centimes vers le compte FedaPay ${fedapayAccountId}`);
          /* 
          // Example of real FedaPay API call:
          await fetch('https://api.fedapay.com/v1/payouts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${fedapaySecretKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: payoutAmount,
              currency: { iso: "XOF" },
              mode: "mtn",
              customer: { account_id: fedapayAccountId }
            })
          });
          */
        } catch (e) {
          console.error("Payout API Error", e);
        }
      }

      // 4. Update Database Status
      await supabaseServer
        .from('collaborations')
        .update({ status: 'paid', deliverable_status: 'approved' })
        .eq('id', collaborationId);
    }

    revalidatePath("/admin/disputes");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paiements & Escrow</h1>
        <p className="text-white/60">Supervisez les fonds bloqués et déclenchez manuellement les virements aux influenceurs.</p>
      </div>

      <div className="grid gap-6">
        {collaborations?.map((collab) => {
          const campaignTitle = Array.isArray(collab.campaign) ? collab.campaign[0]?.title : (collab.campaign as any)?.title;
          const brandName = Array.isArray(collab.brand) ? collab.brand[0]?.company_name : (collab.brand as any)?.company_name;
          const influencerData = Array.isArray(collab.influencer) ? collab.influencer[0] : (collab.influencer as any);
          const influencerName = influencerData?.display_name;

          return (
            <Card key={collab.id} className="border-white/10 bg-white/5">
              <CardHeader className="flex flex-row justify-between items-start pb-2">
                <div>
                  <CardTitle className="text-xl mb-1">{campaignTitle}</CardTitle>
                  <p className="text-sm text-white/50">{brandName} 🤝 {influencerName}</p>
                  <div className="mt-2 flex gap-2">
                    <DownloadContractButton collab={{
                      collaborationId: collab.id,
                      brandName: brandName || 'Marque',
                      influencerName: influencerName || 'Créateur',
                      campaignTitle: campaignTitle || 'Campagne',
                      amount: (collab.agreed_amount || 0) / 100
                    }} />
                    {influencerData?.fedapay_account_id && (
                      <Badge variant="outline" className="bg-emerald-900/20 text-emerald-400 border-emerald-500/20">
                        FedaPay Configuré
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">{((collab.agreed_amount || 0) / 100).toFixed(2)} €</p>
                  <Badge variant={collab.status === 'escrow_secured' ? 'warning' : 'outline'} className="mt-1">
                    Statut: {collab.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-sm font-medium">Livrable: <span className="text-primary">{collab.deliverable_status}</span></p>
                    {collab.deliverable_url && (
                      <a href={collab.deliverable_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                        Voir le fichier joint
                      </a>
                    )}
                  </div>
                  
                  {collab.status === 'escrow_secured' && (
                    <div className="flex gap-2">
                      <form action={async () => {
                        "use server";
                        await resolveDispute(collab.id, 'refund_brand');
                      }}>
                        <Button variant="destructive" size="sm">Rembourser la marque</Button>
                      </form>
                      <form action={async () => {
                        "use server";
                        await resolveDispute(collab.id, 'pay_influencer');
                      }}>
                        <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                          <DollarSign className="w-4 h-4 mr-1" /> Forcer Payout Créateur
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {!collaborations?.length && (
          <p className="text-center text-white/50 py-10">Aucune collaboration trouvée.</p>
        )}
      </div>
    </div>
  );
}
