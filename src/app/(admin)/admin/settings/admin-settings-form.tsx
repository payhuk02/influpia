"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { updatePlatformSettings } from "./actions";

export function AdminSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      await updatePlatformSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde. Êtes-vous bien administrateur ?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Commission Plateforme */}
      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle>Modèle Économique</CardTitle>
          <CardDescription>Définissez le pourcentage que la plateforme prélève sur chaque transaction validée.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <label className="text-sm font-medium">Commission Plateforme (%)</label>
            <Input 
              name="platform_commission_rate" 
              type="number" 
              step="0.01"
              defaultValue={initialSettings?.platform_commission_rate || 10.00} 
              className="bg-white/5 border-white/10 text-xl font-bold" 
            />
          </div>
        </CardContent>
      </Card>

      {/* FedaPay Configuration */}
      <Card className="bg-emerald-900/10 border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-emerald-400">Configuration FedaPay</CardTitle>
          <CardDescription>Seule la clé publique est stockée ici. Les clés secrètes sont configurées côté serveur (variables d'environnement) et ne sont jamais enregistrées en base.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Clé Publique (Public Key)</label>
            <Input 
              name="fedapay_public_key" 
              defaultValue={initialSettings?.fedapay_public_key || ''} 
              placeholder="pk_live_..." 
              className="bg-white/5 border-white/10" 
            />
          </div>
          <p className="text-xs text-white/50">
            Clés secrètes attendues en variables d'environnement : <code>FEDAPAY_SECRET_KEY</code>, <code>MONEYFUSION_API_KEY</code>.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        {success && <span className="text-emerald-400 text-sm font-medium animate-in fade-in">Paramètres sauvegardés avec succès !</span>}
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white min-w-[150px]">
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Save className="w-4 h-4 mr-2" /> Sauvegarder</>}
        </Button>
      </div>

    </form>
  );
}
