"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

export function DeliverableUpload({ collaborationId }: { collaborationId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // 1. Upload to Supabase Storage (Assumes 'deliverables' bucket exists)
      const fileExt = file.name.split('.').pop();
      const fileName = `${collaborationId}-${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('deliverables')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('deliverables')
        .getPublicUrl(fileName);

      // 2. Update collaboration status
      const { error: dbError } = await supabase
        .from('collaborations')
        .update({ 
          deliverable_url: publicUrlData.publicUrl,
          deliverable_status: 'submitted' 
        })
        .eq('id', collaborationId);

      if (dbError) throw dbError;

      alert("Livrable soumis avec succès ! En attente de validation par la marque.");
    } catch (error: any) {
      alert("Erreur lors de l'upload : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mt-4 p-4 border border-white/10 rounded-xl bg-white/5">
      <Input 
        type="file" 
        onChange={(e) => setFile(e.target.files?.[0] || null)} 
        className="max-w-xs cursor-pointer"
      />
      <Button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Envoi en cours..." : "Soumettre le livrable"}
      </Button>
    </div>
  );
}
