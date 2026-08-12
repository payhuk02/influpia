import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardRouterPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // 🛠️ Réparation côté serveur : la fonction SECURITY DEFINER ensure_profile()
    // valide le rôle et crée profil + rôle applicatif. Aucune écriture de rôle
    // depuis le client (user_metadata est modifiable par l'utilisateur).
    const { data: repairedRole } = await supabase.rpc("ensure_profile");
    if (repairedRole) {
      profile = { role: repairedRole as string };
    }
  }

  if (profile?.role === "brand") {
    redirect("/brand");
  } else if (profile?.role === "influencer") {
    redirect("/influencer");
  }

  // Fallback if role is not found or error
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <h1 className="text-2xl font-bold text-red-500">Erreur de profil</h1>
      <p className="text-white/60">Nous n'avons pas pu déterminer votre rôle (Marque ou Influenceur).</p>
      <p className="text-sm text-white/40">Veuillez contacter le support ou vous reconnecter.</p>
    </div>
  );
}
