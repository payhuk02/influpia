"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Next.js Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Une erreur est survenue !</h2>
        <p className="text-white/80 mb-2">Message: {error.message || "Erreur serveur"}</p>
        {error.digest && <p className="text-white/50 text-sm mb-6">Digest: {error.digest}</p>}
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
