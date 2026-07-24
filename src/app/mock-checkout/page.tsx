"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function MockCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const amount = searchParams.get("amount") || "0";
  const appId = searchParams.get("app_id");

  async function handlePayment() {
    setLoading(true);
    try {
      // Simulate webhook call
      const res = await fetch("/api/webhooks/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId, amount: Number(amount) }),
      });

      if (!res.ok) throw new Error("Paiement échoué");

      toast.success("Paiement réussi ! Fonds sécurisés en Escrow.");
      router.push("/brand");
    } catch (err) {
      toast.error("Erreur de paiement bancaire.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
        
        <h1 className="text-2xl font-bold mb-2">Simulateur de Paiement</h1>
        <p className="text-white/60 text-sm mb-8">Ceci simule la page de redirection Stripe ou FedaPay.</p>
        
        <div className="bg-black/50 p-6 rounded-2xl mb-8 flex justify-between items-center border border-white/5">
          <span className="font-medium text-white/80">Total à régler</span>
          <span className="text-2xl font-bold text-primary">{amount} €</span>
        </div>

        <button 
          onClick={handlePayment} 
          disabled={loading}
          className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all disabled:opacity-50"
        >
          {loading ? "Traitement..." : "Simuler Paiement Réussi"}
        </button>
      </div>
    </div>
  );
}
