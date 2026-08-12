"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function RealtimeProvider() {
  const supabase = createClient();

  useEffect(() => {
    // Écouter les nouveaux messages
    const channelId = `realtime_messages-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          toast.success("Vous avez reçu un nouveau message !", {
            icon: '💬',
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'collaborations' },
        (payload) => {
          toast.success("Mise à jour d'une collaboration !", {
            icon: '🔔',
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return null;
}
