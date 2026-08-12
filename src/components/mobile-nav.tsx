"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

type NavLink = { name: string; path: string; icon: string };

export function MobileNav({ links, role }: { links: NavLink[]; role: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-white/70 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {open && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bottom-0 z-40 bg-black/95 backdrop-blur-sm border-t border-white/5 overflow-auto">
          <nav className="p-4 flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${
                    active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                  {link.name}
                </Link>
              );
            })}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="mt-2 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white font-medium transition-colors border-t border-white/5"
            >
              Mon Profil · {role === "brand" ? "Marque" : "Influenceur"}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
