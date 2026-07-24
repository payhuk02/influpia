import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mocking messages for demonstration
  const messages = [
    { id: 1, sender: 'brand', text: 'Bonjour, êtes-vous disponible pour cette campagne ?', time: '10:00' },
    { id: 2, sender: 'influencer', text: 'Oui, tout à fait ! Quel est le délai ?', time: '10:05' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold mb-2">Messagerie (Temps Réel)</h1>
        <p className="text-white/60">Discutez en direct avec vos collaborateurs.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-white/[0.01]">
          <CardTitle>Conversation active</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'influencer' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                msg.sender === 'influencer' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white/10 text-white rounded-bl-none'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <span className="text-xs opacity-50 block mt-1">{msg.time}</span>
              </div>
            </div>
          ))}
        </CardContent>
        <div className="p-4 bg-white/[0.02] border-t border-white/10 flex gap-2">
          <Input placeholder="Écrivez votre message..." className="flex-1" />
          <Button>Envoyer</Button>
        </div>
      </Card>
    </div>
  );
}
