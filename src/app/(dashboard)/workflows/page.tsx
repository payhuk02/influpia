import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workflow, Play, Pause, Trash2, Plus, FileText, Clock, CheckCircle, AlertTriangle, Settings } from "lucide-react";
import { getWorkflowTemplates, getWorkflowDefinitions } from "../actions/workflows";

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const templates = await getWorkflowTemplates();
  const workflows = await getWorkflowDefinitions(user.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflows Automatisés</h1>
          <p className="text-white/60">
            Créez et gérez des workflows pour automatiser vos campagnes.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Workflow
        </Button>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="workflows">Mes Workflows</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Workflows actifs</CardTitle>
              <CardDescription>Vos workflows personnalisés</CardDescription>
            </CardHeader>
            <CardContent>
              {workflows?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun workflow créé</p>
                  <Button className="mt-4 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un workflow
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows?.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          workflow.is_active ? 'bg-emerald-500/10' : 'bg-gray-500/10'
                        }`}>
                          <Workflow className={`w-5 h-5 ${workflow.is_active ? 'text-emerald-400' : 'text-white/60'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{workflow.workflow_name}</p>
                          <p className="text-xs text-white/50">
                            {workflow.description || 'Sans description'} • {workflow.trigger_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={workflow.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}>
                          {workflow.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            {workflow.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Modèles de workflow</CardTitle>
              <CardDescription>Modèles prédéfinis pour démarrer rapidement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((template) => (
                  <Card key={template.id} className="bg-white/[0.02] border-white/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Workflow className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">{template.template_name}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10 text-xs">
                          {template.category}
                        </Badge>
                        <Button variant="outline" size="sm" className="w-full border-white/10">
                          Utiliser ce modèle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Historique d'exécution</CardTitle>
              <CardDescription>Journal des exécutions de workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune exécution enregistrée</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
