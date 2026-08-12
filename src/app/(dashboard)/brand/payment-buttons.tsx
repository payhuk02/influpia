"use client";

import { acceptApplicationAndPay, approveDeliverables } from "../actions/collaborations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AcceptApplicationButton({ applicationId, amount }: { applicationId: string; amount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    try {
      const res = await acceptApplicationAndPay(applicationId, amount);
      if (res.error) throw new Error(res.error);
      if (res.checkoutUrl) {
        toast.loading("Redirection vers le paiement sécurisé...");
        router.push(res.checkoutUrl);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleAccept} 
      disabled={loading}
      variant="default"
      className="rounded-xl font-bold"
    >
      {loading ? "Chargement..." : `Accepter & Payer (${(amount / 100).toLocaleString()}€)`}
    </Button>
  );
}

export function ApproveDeliverableButton({ collaborationId }: { collaborationId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const promise = approveDeliverables(collaborationId).then(res => {
         if (res.error) throw new Error(res.error);
         return res;
      });

      toast.promise(promise, {
        loading: 'Libération des fonds en cours...',
        success: 'Fonds libérés. L\'influenceur a été payé !',
        error: (err) => err.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleApprove} 
      disabled={loading}
      variant="outline"
      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl font-bold"
    >
      {loading ? "..." : "Valider le travail & Payer"}
    </Button>
  );
}
