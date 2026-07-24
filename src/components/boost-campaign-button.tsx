"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

export function BoostCampaignButton({ campaignId, isBoosted }: { campaignId: string, isBoosted?: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleBoost = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      if (data.url.startsWith("http")) {
        // Redirection vers Stripe
        window.location.href = data.url;
      } else {
        // Mock Stripe fallback redirection
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur de paiement Stripe");
      setLoading(false);
    }
  };

  if (isBoosted) {
    return (
      <Button variant="secondary" size="sm" disabled className="bg-primary/20 text-primary font-bold">
        🚀 Campagne Boostée
      </Button>
    );
  }

  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={handleBoost} 
      disabled={loading}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold"
    >
      {loading ? "Redirection..." : "🚀 Booster (20€)"}
    </Button>
  );
}
