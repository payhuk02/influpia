"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCommandPaletteCommands } from "@/config/dashboard-nav";

type Command = { label: string; hint: string; path: string; group: string };

const EXTRA: Command[] = [
  { label: "Paramètres", hint: "Profil et préférences", path: "/settings", group: "Compte" },
  { label: "Créer une prestation", hint: "Nouvelle offre de service", path: "/influencer/services/new", group: "Actions" },
];

export function CommandPalette({ role, isAdmin = false }: { role: string; isAdmin?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => {
    const navCommands = getCommandPaletteCommands(role, isAdmin);
    const extras = role === "influencer"
      ? EXTRA
      : EXTRA.filter((command) => command.path !== "/influencer/services/new");
    return [...navCommands, ...extras];
  }, [role, isAdmin]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 text-sm transition-colors min-w-56"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="flex-1 text-left">Rechercher une action…</span>
        <kbd className="text-[11px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Palette de commandes"
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0b0f] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => (a + 1) % Math.max(results.length, 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => (a - 1 + results.length) % Math.max(results.length, 1));
                } else if (e.key === "Enter" && results[active]) {
                  go(results[active].path);
                }
              }}
              placeholder="Que voulez-vous faire ?"
              className="w-full bg-transparent px-5 py-4 text-white placeholder:text-white/30 outline-none border-b border-white/10"
            />
            <ul className="max-h-80 overflow-auto py-2">
              {results.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-white/40">Aucun résultat.</li>
              )}
              {results.map((c, i) => (
                <li key={c.path + c.label}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(c.path)}
                    className={`w-full text-left px-5 py-3 flex items-center gap-3 ${i === active ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <span className="text-[11px] uppercase tracking-wide text-primary/80 w-20 shrink-0">{c.group}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-white truncate">{c.label}</span>
                      <span className="block text-xs text-white/45 truncate">{c.hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
