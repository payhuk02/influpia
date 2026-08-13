import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Ban, Plus } from "lucide-react";
import { getModerationQueue, getModerationRules, getModerationReport } from "../actions/moderation";

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if user is admin or moderator
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  const isAdmin = profile?.is_admin;

  const queue = await getModerationQueue('pending', 20);
  const rules = await getModerationRules();
  const today = new Date().toISOString().split('T')[0];
  const report = await getModerationReport(today);

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    reviewing: { label: 'En revue', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Eye },
    approved: { label: 'Approuvé', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
    rejected: { label: 'Rejeté', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
    flagged: { label: 'Signalé', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: AlertTriangle },
    escalated: { label: 'Escaladé', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: AlertTriangle },
  };

  type ModerationStatus = keyof typeof statusConfig;

  if (!isAdmin) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Accès restreint</h3>
            <p className="text-white/60 text-center max-w-md">
              Cette page est réservée aux administrateurs et modérateurs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Modération de Contenu</h1>
          <p className="text-white/60">
            Gérez la modération automatique et manuelle du contenu.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Règle
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">En attente</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold text-amber-400">
              {queue?.filter(q => q.moderation_status === 'pending').length || 0}
            </CardTitle>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">Approuvés aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold text-emerald-400">
              {report?.auto_approved || 0}
            </CardTitle>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">Rejetés aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold text-red-400">
              {report?.auto_rejected || 0}
            </CardTitle>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">Temps moyen</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold text-primary">
              {report?.avg_review_time_minutes ? `${report.avg_review_time_minutes} min` : 'N/A'}
            </CardTitle>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="queue">File d'attente</TabsTrigger>
          <TabsTrigger value="rules">Règles</TabsTrigger>
          <TabsTrigger value="blocked">Contenu bloqué</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>File de modération</CardTitle>
              <CardDescription>Contenu en attente de modération</CardDescription>
            </CardHeader>
            <CardContent>
              {queue?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  Aucun contenu en attente de modération
                </div>
              ) : (
                <div className="space-y-3">
                  {queue?.map((item) => {
                    const config = statusConfig[item.moderation_status as ModerationStatus] ?? statusConfig.pending;
                    const StatusIcon = config.icon;

                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.priority === 'urgent' ? 'bg-red-500/10' :
                            item.priority === 'high' ? 'bg-orange-500/10' :
                            item.priority === 'normal' ? 'bg-blue-500/10' :
                            'bg-gray-500/10'
                          }`}>
                            <Shield className="w-5 h-5 text-white/60" />
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{item.content_type}</p>
                            <p className="text-xs text-white/50">ID: {item.content_id?.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approuver
                            </Button>
                            <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Règles de modération</CardTitle>
              <CardDescription>Configurez les règles automatiques de modération</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rules?.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="font-semibold">{rule.rule_name}</p>
                      <p className="text-xs text-white/50 capitalize">{rule.rule_type} • {rule.content_types.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={`${
                        rule.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        rule.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        rule.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {rule.severity}
                      </Badge>
                      <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10">
                        {rule.action}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Contenu bloqué</CardTitle>
              <CardDescription>Mots-clés, domaines et contenus bloqués</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                <Ban className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>La gestion du contenu bloqué sera disponible bientôt</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Rapports de modération</CardTitle>
              <CardDescription>Statistiques et rapports quotidiens</CardDescription>
            </CardHeader>
            <CardContent>
              {report ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-white/60">Total soumis</p>
                      <p className="text-2xl font-bold">{report.total_submitted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">Auto approuvés</p>
                      <p className="text-2xl font-bold text-emerald-400">{report.auto_approved}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">Auto rejetés</p>
                      <p className="text-2xl font-bold text-red-400">{report.auto_rejected}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">En attente</p>
                      <p className="text-2xl font-bold text-amber-400">{report.pending_review}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  Aucun rapport disponible pour aujourd'hui
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
