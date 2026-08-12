import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Megaphone, Scale, Banknote } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch KPI data
  const { count: usersCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true });
  const { count: pendingKycCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true }).eq('kyc_status', 'pending');
  const { count: campaignsCount } = await supabase.from("campaigns").select("*", { count: 'exact', head: true }).eq('status', 'active');
  const { data: collabData } = await supabase.from("collaborations").select("agreed_amount, status");

  const totalEscrow = collabData 
    ? collabData.filter(c => c.status === 'in_progress').reduce((acc, curr) => acc + (curr.agreed_amount || 0), 0)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Vue d'ensemble</h1>
        <p className="text-white/60">Vue globale des performances de la plateforme Influpia.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Utilisateurs Totaux</CardTitle>
            <Users className="w-4 h-4 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Demandes KYC en attente</CardTitle>
            <Scale className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingKycCount || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Campagnes Actives</CardTitle>
            <Megaphone className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignsCount || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Fonds Sécurisés (Escrow)</CardTitle>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{(totalEscrow / 100).toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
