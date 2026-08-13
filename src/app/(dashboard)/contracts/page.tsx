import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractCard } from "@/components/contracts/contract-card";
import { FileText, Plus, Filter } from "lucide-react";
import { getUserContracts, getContractTemplates } from "../actions/contracts";

export default async function ContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get User Profile to determine role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isBrand = profile?.role === "brand";

  // Fetch contracts
  const contracts = await getUserContracts(user.id, isBrand ? 'brand' : 'influencer');
  const templates = await getContractTemplates();

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contrats</h1>
          <p className="text-white/60">
            Gérez vos contrats de collaboration et suivez les jalons.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Contrat
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="signed">Signés</TabsTrigger>
          <TabsTrigger value="active">Actifs</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {contracts?.length === 0 ? (
            <Card className="bg-black/40 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-16 h-16 text-white/20 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun contrat</h3>
                <p className="text-white/60 text-center max-w-md mb-6">
                  Vous n'avez pas encore de contrat. Créez un nouveau contrat pour commencer une collaboration.
                </p>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un Contrat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts?.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onView={(id) => console.log('View contract:', id)}
                  canSign={
                    (contract.status === 'pending_brand_signature' && isBrand) ||
                    (contract.status === 'pending_influencer_signature' && !isBrand)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts
              ?.filter(c => 
                c.status === 'pending_brand_signature' || c.status === 'pending_influencer_signature'
              )
              .map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onView={(id) => console.log('View contract:', id)}
                  canSign={
                    (contract.status === 'pending_brand_signature' && isBrand) ||
                    (contract.status === 'pending_influencer_signature' && !isBrand)
                  }
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="signed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts
              ?.filter(c => c.status === 'signed' || c.status === 'amended')
              .map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onView={(id) => console.log('View contract:', id)}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts
              ?.filter(c => c.status === 'signed' && (!c.expiry_date || new Date(c.expiry_date) > new Date()))
              .map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onView={(id) => console.log('View contract:', id)}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Contract Templates Section */}
      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle>Modèles de Contrat</CardTitle>
          <CardDescription>Modèles réutilisables pour créer rapidement des contrats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates?.map((template) => (
              <Card key={template.id} className="bg-black/40 border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{template.display_name}</CardTitle>
                  <CardDescription className="text-xs">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full border-white/10">
                    Utiliser ce modèle
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
