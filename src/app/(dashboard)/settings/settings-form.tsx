"use client";

import { updateProfile } from "../actions/profile";
import { toast } from "sonner";

export function SettingsForm({ 
  initialData 
}: { 
  initialData: { email: string; displayName: string; bio: string; } 
}) {
  
  async function handleSubmit(formData: FormData) {
    const promise = updateProfile(formData).then((res) => {
      if (res.error) throw new Error(res.error);
      return res;
    });

    toast.promise(promise, {
      loading: 'Sauvegarde en cours...',
      success: 'Votre profil a été mis à jour.',
      error: (err) => err.message
    });
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <button type="button" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors mb-2 block">
            Changer la photo
          </button>
          <p className="text-xs text-white/40">JPG, GIF ou PNG. Max 2MB.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Nom d'affichage / Entreprise</label>
          <input
            name="displayName"
            type="text"
            defaultValue={initialData.displayName}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Adresse Email</label>
          <input
            type="email"
            defaultValue={initialData.email}
            disabled
            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/50 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Biographie / Description</label>
        <textarea
          name="bio"
          rows={4}
          defaultValue={initialData.bio}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-white resize-none"
        />
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold border-b border-white/5 pb-2">Réseaux Sociaux</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 text-center text-xl">📸</span>
            <input name="instagram" type="text" placeholder="URL Instagram" className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-sm text-white" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 text-center text-xl">🎵</span>
            <input name="tiktok" type="text" placeholder="URL TikTok" className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-sm text-white" />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/5 flex justify-end">
        <button type="submit" className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          Sauvegarder les modifications
        </button>
      </div>
    </form>
  );
}
