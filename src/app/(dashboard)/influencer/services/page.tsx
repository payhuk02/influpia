import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { PlusCircle, Package } from "lucide-react";
import { ServiceCard } from "./service-card";

export default async function InfluencerServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: services } = await supabase
    .from("influencer_services")
    .select("*")
    .eq("influencer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mes Prestations</h1>
          <p className="text-white/60">Créez des packages "sur étagère" que les marques peuvent commander directement.</p>
        </div>
        <Link 
          href="/influencer/services/new" 
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]"
        >
          <PlusCircle className="w-5 h-5" />
          Créer une prestation
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}

        {!services?.length && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Aucune prestation</h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Proposez des services clairs et packagés (ex: "1 Vidéo TikTok UGC", "Set de 5 photos Instagram") pour augmenter vos revenus.
            </p>
            <Link 
              href="/influencer/services/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Ajouter ma première prestation
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
