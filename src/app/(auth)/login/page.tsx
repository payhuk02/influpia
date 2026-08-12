import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage(props: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const message = searchParams.message;

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold mb-2">Bienvenue</h1>
        <p className="text-white/60">Connectez-vous à votre compte Influpia.</p>
      </div>

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

      <form action={login} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/80" htmlFor="password">
              Mot de passe
            </label>
            <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80">
              Mot de passe oublié ?
            </Link>
          </div>
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
          Se connecter
        </button>
      </form>

      <div className="text-center text-sm text-white/60 pt-4 border-t border-white/10 mt-6">
        Vous n'avez pas de compte ?{" "}
        <Link href="/register" className="text-white font-medium hover:text-primary transition-colors">
          S'inscrire
        </Link>
      </div>
    </>
  );
}
