import Link from "next/link";
import React from "react";
import { createClient } from "@/utils/supabase/server";
import { RealtimeProvider } from "@/components/realtime-provider";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { CommandPalette } from "@/components/command-palette";

import { getDashboardNav } from "@/config/dashboard-nav";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = "brand"; // Default fallback
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single();
    if (profile) {
      role = profile.role;
      isAdmin = profile.is_admin ?? false;
    }
  } else {
    // If no user is found, redirect to login (failsafe for middleware)
    const { redirect } = await import("next/navigation");
    return redirect("/login");
  }

  const navLinks = getDashboardNav(role, isAdmin);

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
        
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
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
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="font-bold tracking-tight">Influpia</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell userId={user.id} />
            <MobileNav links={navLinks} role={role} />
          </div>
        </header>

        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-end gap-3 px-10 py-4 border-b border-white/5 bg-black/30 sticky top-0 z-50 backdrop-blur-xl">
          <CommandPalette role={role} isAdmin={isAdmin} />
          <NotificationBell userId={user.id} />
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
