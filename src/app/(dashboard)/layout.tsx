import Link from "next/link";
import React from "react";
import { createClient } from "@/utils/supabase/server";
import { RealtimeProvider } from "@/components/realtime-provider";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = "brand"; // Default fallback
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile) role = profile.role;
  } else {
    // If no user is found, redirect to login (failsafe for middleware)
    const { redirect } = await import("next/navigation");
    return redirect("/login");
  }

  const navLinks = role === "brand" 
    ? [
        { name: "Tableau de bord", path: "/brand", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" },
        { name: "Créer une campagne", path: "/brand/campaigns/new", icon: "M12 4v16m8-8H4" },
        { name: "Messagerie", path: "/messages", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
        { name: "Statistiques", path: "/analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }
      ]
    : [
        { name: "Tableau de bord", path: "/influencer", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" },
        { name: "Marketplace", path: "/influencer/campaigns", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
        { name: "Messagerie", path: "/messages", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
        { name: "Statistiques", path: "/analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }
      ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/50 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Influpia</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navLinks.map((link, i) => (
            <Link key={i} href={link.path} className="px-4 py-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white font-medium transition-colors flex items-center gap-3">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
              </svg>
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/settings" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white font-medium transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="Avatar" />
            </div>
            <div className="flex flex-col items-start truncate">
              <span className="text-sm font-bold truncate max-w-[140px] text-white">Mon Profil</span>
              <span className="text-xs text-white/50">{role === 'brand' ? 'Marque' : 'Influenceur'}</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Topbar */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/50 sticky top-0 z-50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <button className="p-2 text-white/70">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <div className="p-6 md:p-10 flex-1 overflow-auto relative">
          {/* Background effect */}
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-6xl mx-auto">
            <RealtimeProvider />
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
