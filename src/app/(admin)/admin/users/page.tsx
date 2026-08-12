import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id, email, role, kyc_status, created_at,
      brand:brands(company_name),
      influencer:influencers(display_name)
    `)
    .order("created_at", { ascending: false });

  async function updateKycStatus(userId: string, newStatus: 'verified' | 'rejected' | 'pending') {
    "use server";
    const supabaseServer = await createClient();
    
    await supabaseServer
      .from('profiles')
      .update({ kyc_status: newStatus })
      .eq('id', userId);

    revalidatePath("/admin/users");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Utilisateurs & KYC</h1>
        <p className="text-white/60">Gérez les membres de la plateforme et validez leurs documents (KYC).</p>
      </div>

      <div className="grid gap-4">
        {profiles?.map((profile) => (
          <Card key={profile.id} className="border-white/10 bg-white/5">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">
                    {profile.role === 'brand' 
                      ? (Array.isArray(profile.brand) ? profile.brand[0]?.company_name : (profile.brand as any)?.company_name)
                      : profile.role === 'influencer' 
                        ? (Array.isArray(profile.influencer) ? profile.influencer[0]?.display_name : (profile.influencer as any)?.display_name)
                        : 'Administrateur'}
                  </h3>
                  <Badge variant="outline" className="text-xs capitalize">{profile.role}</Badge>
                  <Badge 
                    variant={profile.kyc_status === 'verified' ? 'default' : profile.kyc_status === 'rejected' ? 'destructive' : 'warning'}
                    className={profile.kyc_status === 'verified' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}
                  >
                    KYC: {profile.kyc_status}
                  </Badge>
                </div>
                <p className="text-sm text-white/60">{profile.email}</p>
                <p className="text-xs text-white/40 mt-1">Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="flex gap-2">
                {profile.kyc_status === 'pending' && (
                  <>
                    <form action={async () => {
                      "use server";
                      await updateKycStatus(profile.id, 'rejected');
                    }}>
                      <Button variant="destructive" size="sm">Rejeter KYC</Button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await updateKycStatus(profile.id, 'verified');
                    }}>
                      <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Approuver KYC</Button>
                    </form>
                  </>
                )}
                {profile.kyc_status !== 'pending' && profile.role !== 'admin' && (
                   <form action={async () => {
                    "use server";
                    await updateKycStatus(profile.id, 'pending');
                  }}>
                    <Button variant="outline" size="sm">Réinitialiser KYC</Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {!profiles?.length && (
          <p className="text-center text-white/50 py-10">Aucun utilisateur trouvé.</p>
        )}
      </div>
    </div>
  );
}
