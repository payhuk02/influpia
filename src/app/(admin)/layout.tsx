import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-destructive mb-4">Accès Refusé</h1>
          <p>Vous n'avez pas les droits d'administration.</p>
          <Link href="/" className="mt-6 inline-block text-primary hover:underline">Retourner à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/10 bg-white/5 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center font-bold">A</div>
          <span className="font-bold tracking-tight">Admin Portal (Influpia)</span>
        </div>
        <Link href="/" className="text-sm text-white/50 hover:text-white">Quitter l'Admin</Link>
      </header>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
