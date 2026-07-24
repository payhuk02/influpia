"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signup } from "../actions";

function ErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <>
      {error && (
        <div className="p-4 mb-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="p-4 mb-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 text-sm">
          {message}
        </div>
      )}
    </>
  );
}

export default function RegisterPage() {
  const [role, setRole] = useState<"brand" | "influencer">("brand");

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold mb-2">Créer un compte</h1>
        <p className="text-white/60">Rejoignez Influpia et commencez à collaborer.</p>
      </div>

      <Suspense fallback={null}>
        <ErrorMessage />
      </Suspense>

      <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
        <button
          type="button"
          onClick={() => setRole("brand")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            role === "brand" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
          }`}
        >
          Marque
        </button>
        <button
          type="button"
          onClick={() => setRole("influencer")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            role === "influencer" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
          }`}
        >
          Influenceur
        </button>
      </div>

      <form action={signup} className="space-y-4 mt-4">
        <input type="hidden" name="role" value={role} />
        
        {role === "brand" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="name">
              Nom de l'entreprise
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: L'Oréal"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-white/30"
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="name">
              Nom public / Pseudo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: @johndoe"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-white/30"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="email">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="vous@exemple.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-white/30"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-white/30"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] mt-6"
        >
          S'inscrire
        </button>
      </form>

      <div className="text-center text-sm text-white/60 pt-4 border-t border-white/10 mt-6">
        Vous avez déjà un compte ?{" "}
        <Link href="/login" className="text-white font-medium hover:text-primary transition-colors">
          Se connecter
        </Link>
      </div>
    </>
  );
}
