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
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-black text-white flex items-center justify-center min-h-screen">
        <div className="p-8 bg-red-900/20 border border-red-500 rounded-xl text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-500 mb-4">CRITICAL ERROR</h1>
          <p className="mb-4">Message: {error.message}</p>
          <button onClick={() => reset()} className="px-4 py-2 bg-red-600 text-white rounded">Retry</button>
        </div>
      </body>
    </html>
  );
}
