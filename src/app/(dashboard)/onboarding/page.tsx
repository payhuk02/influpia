"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function OnboardingKYC() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("iban");
  const [paymentDetails, setPaymentDetails] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'verified', // Auto-verify for MVP, normally 'pending'
          payment_method: paymentMethod,
          payment_details: { account: paymentDetails }
        })
        .eq('id', user.id);

      if (error) throw error;
      
      alert("Profil vérifié avec succès ! Vous pouvez maintenant postuler aux campagnes.");
      router.push("/influencer");
      router.refresh();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 mt-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vérification de Profil (KYC)</h1>
        <p className="text-white/60">Étape obligatoire pour recevoir vos paiements Escrow en toute légalité.</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`}></div>
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{step === 1 ? 'Identité & Entreprise' : 'Informations Bancaires'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">
            
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm">Nom complet légal</label>
                  <Input required placeholder="Ex: Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Numéro de SIRET ou Carte d'identité</label>
                  <Input required placeholder="123 456 789 00012" />
                </div>
                <Button type="submit" className="w-full">Suivant</Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm">Méthode de réception</label>
                  <select 
                    className="w-full p-2 rounded bg-black border border-white/20 text-white"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="iban">Virement Bancaire (IBAN)</option>
                    <option value="mobile_money">Mobile Money (Afrique)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">{paymentMethod === 'iban' ? 'Numéro IBAN' : 'Numéro de téléphone'}</label>
                  <Input 
                    required 
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder={paymentMethod === 'iban' ? 'FR76 3000...' : '+229 97000000'} 
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Retour</Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Vérification..." : "Terminer"}
                  </Button>
                </div>
              </>
            )}
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
