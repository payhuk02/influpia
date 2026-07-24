import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch role and display name
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  let displayName = '';
  
  if (profile?.role === 'brand') {
    const { data: brand } = await supabase.from('brands').select('company_name').eq('id', user?.id).single();
    displayName = brand?.company_name || '';
  } else if (profile?.role === 'influencer') {
    const { data: influencer } = await supabase.from('influencers').select('display_name').eq('id', user?.id).single();
    displayName = influencer?.display_name || '';
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramètres du Profil</h1>
        <p className="text-white/60">Gérez vos informations publiques et privées.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
          <CardDescription>Mettez à jour votre nom d'affichage et vos coordonnées.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom d'affichage</label>
            <Input defaultValue={displayName} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email de contact</label>
            <Input type="email" defaultValue={user?.email} disabled />
            <p className="text-xs text-white/40">L'email est géré par le fournisseur d'authentification.</p>
          </div>
        </CardContent>
        <CardFooter className="border-t border-white/5 pt-6">
          <Button>Sauvegarder les modifications</Button>
        </CardFooter>
      </Card>
      
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Zone Dangereuse</CardTitle>
          <CardDescription>Actions irréversibles pour votre compte.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Désactiver le compte</Button>
        </CardContent>
      </Card>
    </div>
  );
}
