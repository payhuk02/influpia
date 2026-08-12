"use client";

import { createService } from "@/app/(dashboard)/actions/services";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const res = await createService(formData);
      if (res.error) throw new Error(res.error);
      toast.success("Prestation publiée avec succès !");
      router.push("/influencer/services");
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Nouvelle Prestation</h1>
        <p className="text-white/60">Définissez une offre claire pour que les marques puissent vous commander directement.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-10">
        <form action={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Titre de la prestation</label>
            <input 
              name="title"
              type="text" 
              placeholder="Ex: Je crée une vidéo UGC TikTok de 30s" 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Description complète</label>
            <textarea 
              name="description"
              rows={5}
              placeholder="Détaillez ce que comprend votre prestation (formats, retouches, droits d'utilisation...)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white resize-none"
              required
              maxLength={1000}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Prix (Fixe en €)</label>
              <div className="relative">
                <input 
                  name="price"
                  type="number" 
                  min="5"
                  step="0.01"
                  placeholder="Ex: 150" 
                  className="w-full pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">€</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Délai de livraison (Jours)</label>
              <div className="relative">
                <input 
                  name="delivery_days"
                  type="number" 
                  min="1"
                  max="90"
                  placeholder="Ex: 5" 
                  className="w-full pl-4 pr-16 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">Jours</span>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-white/5">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
              className="bg-transparent border-white/10 hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="px-8 bg-primary hover:bg-primary/90 text-white font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              {loading ? "Création..." : "Publier ma prestation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
