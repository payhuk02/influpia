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
    // 🛠️ Self-healing: If the database trigger failed, create the profile manually
    const role = user.user_metadata?.role === "influencer" ? "influencer" : "brand";
    const name = user.user_metadata?.name || "Utilisateur";

    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email!,
      role: role,
      is_admin: false
    });

    if (role === "brand") {
      await supabase.from("brands").insert({ id: user.id, company_name: name });
    } else {
      await supabase.from("influencers").insert({ id: user.id, display_name: name });
    }
    
    profile = { role };
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
