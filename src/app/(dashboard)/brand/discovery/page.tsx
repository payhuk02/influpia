"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, MapPin, Star, User, Loader2, ArrowRight, Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { orderPrestation } from "../../actions/services"; // We will create this action

export default function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState<'influencers' | 'services'>('influencers');
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    if (activeTab === 'influencers') {
      const { data } = await supabase
        .from("influencers")
        .select("*, profiles!inner(kyc_status, average_rating, total_reviews)");
      setInfluencers(data || []);
    } else {
      const { data } = await supabase
        .from("influencer_services")
        .select("*, influencer:influencers(display_name, avatar_url, profiles!inner(average_rating))")
        .eq("is_active", true);
      setServices(data || []);
    }
    setLoading(false);
  }

  const handleOrder = async (serviceId: string) => {
    try {
      const res = await orderPrestation(serviceId);
      if (res?.error) throw new Error(res.error);
      toast.success("Commande initiée ! Vous allez être redirigé vers le paiement.");
      // Redirect to mock-checkout or payment page
      window.location.href = `/mock-checkout?collabId=${res.collaborationId}`;
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la commande");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-black to-accent/10 border border-white/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <Badge variant="secondary" className="mb-4 bg-white/10 hover:bg-white/20 text-white border-white/5">
            <Sparkles className="w-3 h-3 mr-2 text-primary" />
            AI Discovery Engine
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Trouvez les créateurs <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">parfaits</span>.
          </h1>
          <p className="text-lg text-white/60 mb-8">
            Dites à notre IA ce que vous recherchez, ou naviguez parmi les talents certifiés de notre marketplace.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('influencers')}
          className={`text-lg font-bold transition-colors ${activeTab === 'influencers' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          Créateurs (Upwork)
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`text-lg font-bold transition-colors ${activeTab === 'services' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          Prestations sur étagère (Fiverr)
        </button>
      </div>

      {/* Grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : activeTab === 'influencers' ? (
          /* Influencers Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {influencers.map((influencer) => (
              <Card key={influencer.id} className="group overflow-hidden border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300">
                <CardContent className="p-0">
                  <div className="h-24 bg-gradient-to-r from-white/5 to-white/10 relative" />
                  <div className="px-6 pb-6 relative">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 border-4 border-black -mt-8 mb-4 flex items-center justify-center overflow-hidden relative">
                      {influencer.avatar_url ? (
                        <img src={influencer.avatar_url} alt={influencer.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-white/50" />
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1 truncate">{influencer.display_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-white/50 mb-4">
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" /> 
                        {influencer.profiles?.average_rating || "N/A"} 
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div>
                        <p className="text-xs text-white/40 mb-0.5">À partir de</p>
                        <p className="font-bold text-emerald-400">{influencer.base_rate} €</p>
                      </div>
                      <Button variant="ghost" className="hover:bg-white/10">
                        Profil <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Services (Prestations) Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const infData = Array.isArray(service.influencer) ? service.influencer[0] : service.influencer;
              
              return (
                <Card key={service.id} className="group flex flex-col border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary/20 text-primary border-primary/20">Prestation (Gig)</Badge>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">{service.price} €</p>
                        <p className="text-xs text-white/50">Livraison: {service.delivery_days} jours</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                    <p className="text-sm text-white/60 mb-6 flex-1 line-clamp-3">{service.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-white/50" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{infData?.display_name}</p>
                          <p className="text-xs text-amber-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" /> {infData?.profiles?.average_rating || "Nouveau"}
                          </p>
                        </div>
                      </div>
                      
                      <Button onClick={() => handleOrder(service.id)} className="bg-white text-black hover:bg-gray-200">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Commander
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
