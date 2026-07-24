import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function AdminDashboard() {
  const supabase = await createClient(); // Because of RLS policies for admins, we can use the regular client if is_admin is true

  // Fetch all collaborations that might need arbitration (e.g., stuck in submitted or disputed state)
  // For this MVP, we fetch all collaborations
  const { data: collaborations } = await supabase
    .from("collaborations")
    .select(`
      *,
      campaign:campaigns(title),
      influencer:influencers(display_name),
      brand:brands(company_name)
    `)
    .order("created_at", { ascending: false });

  async function resolveDispute(collaborationId: string, action: 'refund_brand' | 'pay_influencer') {
    "use server";
    const supabaseServer = await createClient();
    
    // In a real scenario, this would trigger FedaPay refund API or Payout API
    const newStatus = action === 'refund_brand' ? 'refunded' : 'paid';
    const deliverableStatus = action === 'refund_brand' ? 'rejected' : 'approved';

    await supabaseServer
      .from('collaborations')
      .update({ 
        status: newStatus,
        deliverable_status: deliverableStatus 
      })
      .eq('id', collaborationId);

    revalidatePath("/admin");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestion des Litiges & Escrow</h1>
        <p className="text-white/60">Supervisez les fonds bloqués et intervenez en cas de conflit entre la marque et le créateur.</p>
      </div>

      <div className="grid gap-6">
        {collaborations?.map((collab) => (
          <Card key={collab.id} className="border-white/10 bg-white/5">
            <CardHeader className="flex flex-row justify-between items-start pb-2">
              <div>
                <CardTitle className="text-xl mb-1">{collab.campaign?.title}</CardTitle>
                <p className="text-sm text-white/50">{collab.brand?.company_name} 🤝 {collab.influencer?.display_name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">{(collab.amount_cents / 100).toFixed(2)} €</p>
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
                      <Button variant="destructive" size="sm">Rembourser la marque (Annuler)</Button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await resolveDispute(collab.id, 'pay_influencer');
                    }}>
                      <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                        Forcer Paiement Créateur
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!collaborations?.length && (
          <p className="text-center text-white/50 py-10">Aucune collaboration trouvée.</p>
        )}
      </div>
    </div>
  );
}
