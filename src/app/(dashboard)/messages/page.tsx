"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, User, Briefcase, Loader2, Handshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [activeCollab, setActiveCollab] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (activeCollab) {
      loadMessages(activeCollab.id);
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel('realtime_messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `collaboration_id=eq.${activeCollab.id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeCollab]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  async function initChat() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

    // Fetch collaborations where the user is either brand or influencer
    const { data: colabs } = await supabase
      .from("collaborations")
      .select(`
        *,
        brand:brands(company_name),
        influencer:influencers(display_name),
        campaign:campaigns(title)
      `)
      .or(`brand_id.eq.${user.id},influencer_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (colabs) {
      setCollaborations(colabs);
      if (colabs.length > 0) {
        setActiveCollab(colabs[0]);
      }
    }
    setLoading(false);
  }

  async function loadMessages(collaborationId: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("collaboration_id", collaborationId)
      .order("created_at", { ascending: true });
    
    setMessages(data || []);
    scrollToBottom();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeCollab || !currentUser) return;
    
    setSending(true);
    
    const receiverId = activeCollab.brand_id === currentUser.id 
      ? activeCollab.influencer_id 
      : activeCollab.brand_id;

    const { error } = await supabase.from("messages").insert({
      collaboration_id: activeCollab.id,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    } else {
      console.error("Message send error:", error);
    }
    
    setSending(false);
  }

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Left Pane - Collaborations List */}
      <div className="w-1/3 border-r border-white/10 bg-black/20 flex flex-col">
        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> 
            Vos Espaces de Travail
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {collaborations.length === 0 ? (
            <div className="text-center p-4 text-white/40 text-sm">
              Aucune collaboration active pour l'instant.
            </div>
          ) : (
            collaborations.map((collab) => {
              const isActive = activeCollab?.id === collab.id;
              const isBrand = currentUser?.id === collab.brand_id;
              const otherPartyName = isBrand 
                ? Array.isArray(collab.influencer) ? collab.influencer[0]?.display_name : collab.influencer?.display_name
                : Array.isArray(collab.brand) ? collab.brand[0]?.company_name : collab.brand?.company_name;
              const campaignTitle = Array.isArray(collab.campaign) 
                ? collab.campaign[0]?.title 
                : (collab.campaign as any)?.title;

              return (
                <div 
                  key={collab.id} 
                  onClick={() => setActiveCollab(collab)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isActive 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-white/10 to-white/5 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white/60" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold truncate text-sm">{otherPartyName || "Utilisateur"}</h3>
                      <p className="text-xs text-white/50 truncate flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {campaignTitle || "Campagne"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane - Active Chat */}
      <div className="flex-1 flex flex-col bg-black/40">
        {activeCollab ? (
          <>
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-accent" />
                  Espace de Collaboration
                </h3>
                <p className="text-sm text-white/50">
                  Total convenu : <span className="text-emerald-400 font-bold">{(activeCollab.agreed_amount / 100).toFixed(2)} €</span>
                </p>
              </div>
              <Badge variant="outline" className="bg-white/5 capitalize">
                Statut : {activeCollab.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
                  <MessageSquare className="w-12 h-12 opacity-20" />
                  <p>Envoyez un message pour démarrer la discussion.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-5 py-3 rounded-2xl max-w-[75%] ${
                        isMe 
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-sm' 
                          : 'bg-white/10 text-white rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <span className="text-[10px] opacity-50 block mt-2 text-right">
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white/[0.02] border-t border-white/10 flex gap-3 items-end">
              <Input 
                placeholder="Écrivez votre message..." 
                className="flex-1 h-12 bg-white/5 border-white/10 text-white rounded-xl"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0 p-0">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40">
            <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
            <p>Sélectionnez une collaboration pour commencer à discuter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
