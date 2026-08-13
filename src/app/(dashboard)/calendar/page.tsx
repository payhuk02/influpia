import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, FileText, Plus, CheckCircle, AlertTriangle, Copy, Settings } from "lucide-react";
import { getScheduledContent, getContentTemplates, getSchedulingRules } from "../actions/scheduling";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const scheduledContent = await getScheduledContent(user.id);
  const templates = await getContentTemplates(user.id);
  const rules = await getSchedulingRules(user.id);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Calendrier de Contenu</h1>
          <p className="text-white/60">
            Planifiez et gérez votre contenu à l'avance.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Rendez-vous
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="scheduled">Programmé</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="rules">Règles</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Vue Calendrier</CardTitle>
              <CardDescription>Vue mensuelle de votre contenu planifié</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Le calendrier interactif sera disponible bientôt</p>
                <p className="text-sm mt-2">En attendant, utilisez l'onglet "Programmé" pour voir votre contenu</p>
              </div>
            </CardContent>
          </Card>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Contenu programmé</CardTitle>
              <CardDescription>Vos publications à venir</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledContent?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun contenu programmé</p>
                  <Button className="mt-4 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Programmer du contenu
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledContent?.map((content) => (
                    <div key={content.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          content.status === 'posted' ? 'bg-emerald-500/10' :
                          content.status === 'scheduled' ? 'bg-blue-500/10' :
                          content.status === 'failed' ? 'bg-red-500/10' :
                          'bg-gray-500/10'
                        }`}>
                          {content.status === 'posted' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                           content.status === 'scheduled' ? <Clock className="w-5 h-5 text-blue-400" /> :
                           content.status === 'failed' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                           <FileText className="w-5 h-5 text-white/60" />}
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{content.content_type}</p>
                          <p className="text-xs text-white/50">
                            {content.platform} • {new Date(content.scheduled_for).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`${
                          content.status === 'posted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          content.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          content.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {content.status}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modèles de contenu</CardTitle>
                  <CardDescription>Créez et réutilisez des modèles de publication</CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Modèle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun modèle créé</p>
                  <Button className="mt-4 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un modèle
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates?.map((template) => (
                    <Card key={template.id} className="bg-white/[0.02] border-white/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{template.template_name}</CardTitle>
                        <CardDescription className="text-xs capitalize">
                          {template.template_type} • {template.platform}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 border-white/10">
                            Utiliser
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Règles de programmation</CardTitle>
                  <CardDescription>Automatisez la planification de votre contenu</CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Règle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rules?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune règle configurée</p>
                  <Button className="mt-4 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une règle
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules?.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="font-semibold">{rule.rule_name}</p>
                        <p className="text-xs text-white/50">
                          {rule.platform} • {rule.days_of_week.map((d: number) => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d]).join(', ')}
                        </p>
                      </div>
                      <Badge variant="outline" className={rule.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                        {rule.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsList>
      </Tabs>
    </div>
  );
}

