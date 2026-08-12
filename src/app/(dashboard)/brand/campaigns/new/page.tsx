"use client";

import { createCampaign } from "@/app/(dashboard)/actions/campaigns";
import { generateCampaignBrief } from "@/app/(dashboard)/actions/ai";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function NewCampaignPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleSubmit(formData: FormData) {
    const promise = createCampaign(formData).then((res) => {
      if (res.error) throw new Error(res.error);
      return res;
    });

    toast.promise(promise, {
      loading: 'Création de la campagne en cours...',
      success: () => {
        router.push("/brand");
        return 'Campagne publiée avec succès !';
      },
      error: (err) => err.message
    });
  }

  async function handleAIGenerate() {
    setGenerating(true);
    try {
      const brief = await generateCampaignBrief(keywords);
      setDescription(brief);
      toast.success("Brief généré par l'IA !");
    } catch (err) {
      toast.error("Erreur de génération IA");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Créer une Campagne</h1>
        <p className="text-white/60">Définissez vos objectifs et trouvez les meilleurs influenceurs.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-10">
        <form action={handleSubmit} className="space-y-8">
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b border-white/5 pb-2">Informations Générales</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Titre de la campagne</label>
              <input 
                name="title"
                type="text" 
                placeholder="Ex: Lancement Collection Été 2024" 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white"
                required
              />
            </div>

            <div className="space-y-4 p-4 border border-primary/20 bg-primary/5 rounded-xl">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">✨ Assistant IA</h3>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Mots clés (ex: Tech, App, Baskets...)"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <Button type="button" onClick={handleAIGenerate} disabled={generating || !keywords}>
                  {generating ? "Génération..." : "Rédiger le brief"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Description et Objectifs</label>
              <textarea 
                name="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez ce que vous attendez des influenceurs..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white resize-none"
                required
              />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b border-white/5 pb-2">Budget & Ciblage</h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Budget Total (€)</label>
                <input 
                  name="budget"
                  type="number" 
                  min="0"
                  placeholder="Ex: 5000" 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Nombre d'influenceurs visés</label>
                <input 
                  name="target_influencers_count"
                  type="number" 
                  min="1"
                  placeholder="Ex: 10" 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white/80">Plateformes ciblées</label>
              <div className="flex flex-wrap gap-3">
                {['Instagram', 'TikTok', 'YouTube', 'LinkedIn'].map((platform) => (
                  <label key={platform} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <input type="checkbox" name="target_platforms" value={platform.toLowerCase()} className="rounded border-white/20 bg-black/50 text-primary focus:ring-primary focus:ring-offset-0" />
                    <span className="text-sm">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end gap-4">
            <button type="button" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">
              Enregistrer comme brouillon
            </button>
            <button type="submit" className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              Publier la campagne
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
