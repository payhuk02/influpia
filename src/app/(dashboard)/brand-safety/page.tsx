import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, AlertTriangle, Search, Upload, FileText, Plus, Settings } from "lucide-react";
import { getBrandSafetyCategories, getBrandSafetyPreferences } from "../actions/brand-safety";

export default async function BrandSafetyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const categories = await getBrandSafetyCategories();
  const preferences = await getBrandSafetyPreferences(user.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sécurité de Marque</h1>
          <p className="text-white/60">
            Vérifiez et validez les influenceurs pour assurer la sécurité de votre marque.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Vérification
        </Button>
      </div>

      <Tabs defaultValue="vetting" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="vetting">Vérifications</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="vetting" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Vérifications d'influenceurs</CardTitle>
              <CardDescription>Analysez la sécurité des influenceurs avant collaboration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune vérification en cours</p>
                <p className="text-sm mt-2">Sélectionnez un influenceur pour lancer une vérification</p>
                <Button className="mt-4 bg-primary hover:bg-primary/90">
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher un influenceur
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Préférences de sécurité</CardTitle>
              <CardDescription>Configurez vos critères de sécurité de marque</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Catégories bloquées
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories?.map((category) => (
                    <Badge
                      key={category.id}
                      variant={preferences?.blocked_categories?.includes(category.id) ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        preferences?.blocked_categories?.includes(category.id)
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      {category.category_name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Critères de qualité
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader className="pb-3">
                      <CardDescription>Minimum d'abonnés</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {preferences?.min_followers?.toLocaleString() || '1 000'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader className="pb-3">
                      <CardDescription>Taux d'engagement minimum</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {preferences?.min_engagement_rate || 2}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Vérifications requises
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span>Vérification KYC</span>
                    <Badge variant={preferences?.require_kyc ? 'default' : 'outline'} className={preferences?.require_kyc ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/60 border-white/10'}>
                      {preferences?.require_kyc ? 'Obligatoire' : 'Optionnel'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span>Vérification documents</span>
                    <Badge variant={preferences?.require_verification ? 'default' : 'outline'} className={preferences?.require_verification ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/60 border-white/10'}>
                      {preferences?.require_verification ? 'Obligatoire' : 'Optionnel'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">
                <Settings className="w-4 h-4 mr-2" />
                Mettre à jour les préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents de vérification</CardTitle>
                  <CardDescription>Documents d'identité et professionnels</CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  <Upload className="w-4 h-4 mr-2" />
                  Téléverser un document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun document téléversé</p>
                <p className="text-sm mt-2">Téléversez vos documents pour améliorer votre score de vérification</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Historique des vérifications</CardTitle>
              <CardDescription>Historique complet des vérifications effectuées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun historique disponible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
