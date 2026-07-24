"use server";

import { createClient } from "@/utils/supabase/server";

export async function sendMessage(content: string, receiverId: string, collaborationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    collaboration_id: collaborationId,
    content: content,
    is_read: false
  });

  if (error) {
    console.error("Error sending message:", error);
    return { error: error.message };
  }

  return { success: true };
}
