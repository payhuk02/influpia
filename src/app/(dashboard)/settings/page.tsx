import { createClient } from "@/utils/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch role
  const { data: profile } = await supabase.from('profiles').select('role, kyc_status').eq('id', user.id).single();
  let data = null;
  
  if (profile?.role === 'brand') {
    const { data: brand } = await supabase.from('brands').select('*').eq('id', user.id).single();
    data = brand;
  } else if (profile?.role === 'influencer') {
    const { data: influencer } = await supabase.from('influencers').select('*').eq('id', user.id).single();
    data = influencer;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramètres Enterprise</h1>
        <p className="text-white/60">Gérez vos informations publiques, détails B2B et méthodes de paiement.</p>
      </div>

      <SettingsForm user={user} profile={profile} data={data} />
    </div>
  );
}
