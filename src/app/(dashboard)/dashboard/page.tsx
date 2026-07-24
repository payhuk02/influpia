import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardRouterPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

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
