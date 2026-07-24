"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function ReviewForm({ collaborationId, revieweeId }: { collaborationId: string, revieweeId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const submitReview = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from('reviews').insert({
        collaboration_id: collaborationId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment
      });

      if (error) throw error;
      alert("Merci pour votre avis !");
    } catch (error: any) {
      alert("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border border-white/10 rounded-xl bg-black/40">
      <h3 className="text-lg font-bold">Évaluer la collaboration</h3>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star} 
            onClick={() => setRating(star)}
            className={`text-2xl transition-colors ${rating >= star ? 'text-gold' : 'text-white/20'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea 
        className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white min-h-[100px]"
        placeholder="Laissez un commentaire sur votre expérience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button onClick={submitReview} disabled={loading} className="w-full">
        {loading ? "Envoi..." : "Publier l'avis"}
      </Button>
    </div>
  );
}
