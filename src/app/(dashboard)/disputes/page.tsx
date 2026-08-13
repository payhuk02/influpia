import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, MessageSquare, Clock, CheckCircle, Scale, FileText } from "lucide-react";
import { getUserDisputes } from "../actions/disputes";
import { getCollaborationOptions } from "../actions/form-actions";
import { CreateDisputeButton } from "@/components/dashboard/feature-forms";

export default async function DisputesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const disputes = await getUserDisputes(user.id);
  const collaborations = await getCollaborationOptions(user.id);

  const statusConfig = {
    open: { label: 'Ouvert', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle },
    under_review: { label: 'En revue', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
    mediating: { label: 'Médiation', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Scale },
    resolved: { label: 'Résolu', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
    escalated: { label: 'Escaladé', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertTriangle },
    closed: { label: 'Fermé', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: FileText },
  };

  type DisputeStatus = keyof typeof statusConfig;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Litiges</h1>
          <p className="text-white/60">
            Gérez les litiges et demandes de remboursement.
          </p>
        </div>
        <CreateDisputeButton collaborations={collaborations} />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="open">Ouverts</TabsTrigger>
          <TabsTrigger value="in_progress">En cours</TabsTrigger>
          <TabsTrigger value="resolved">Résolus</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {disputes?.length === 0 ? (
            <Card className="bg-black/40 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Scale className="w-16 h-16 text-white/20 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun litige</h3>
                <p className="text-white/60 text-center max-w-md mb-6">
                  Vous n'avez aucun litige en cours. Si vous rencontrez un problème avec une collaboration, vous pouvez ouvrir un litige ici.
                </p>
                <CreateDisputeButton collaborations={collaborations} label="Ouvrir un Litige" />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {disputes?.map((dispute) => {
                const config = statusConfig[dispute.status as DisputeStatus] ?? statusConfig.open;
                const StatusIcon = config.icon;

                return (
                  <Card key={dispute.id} className="bg-white/[0.02] border-white/10 hover:border-white/20 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base">{dispute.title}</CardTitle>
                          </div>
                          <CardDescription className="text-xs">
                            {dispute.dispute_type} • Collaboration #{dispute.collaboration_id?.slice(0, 8)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-white/80">{dispute.description}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-white/40">Priorité</p>
                            <p className="font-semibold capitalize">{dispute.priority}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Créé le</p>
                            <p className="font-semibold">{new Date(dispute.created_at).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Contrepartie</p>
                            <p className="font-semibold">
                              {dispute.raised_against_user?.display_name || 'Utilisateur'}
                            </p>
                          </div>
                        </div>

                        {dispute.resolution_type && (
                          <div className="pt-3 border-t border-white/10">
                            <p className="text-sm text-white/60">
                              Résolution: <span className="text-white capitalize">{dispute.resolution_type}</span>
                            </p>
                            {dispute.resolution_details && (
                              <p className="text-xs text-white/40 mt-1">{dispute.resolution_details}</p>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-3 border-t border-white/10">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-white/10"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Messages
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-white/10"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Timeline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="open" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {disputes
              ?.filter(d => d.status === 'open' || d.status === 'under_review')
              .map((dispute) => {
                const config = statusConfig[dispute.status as DisputeStatus] ?? statusConfig.open;
                const StatusIcon = config.icon;

                return (
                  <Card key={dispute.id} className="bg-white/[0.02] border-white/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{dispute.title}</CardTitle>
                          <CardDescription className="text-xs">{dispute.dispute_type}</CardDescription>
                        </div>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 border-white/10">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Répondre
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {disputes
              ?.filter(d => d.status === 'mediating' || d.status === 'escalated')
              .map((dispute) => {
                const config = statusConfig[dispute.status as DisputeStatus] ?? statusConfig.open;
                const StatusIcon = config.icon;

                return (
                  <Card key={dispute.id} className="bg-white/[0.02] border-white/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{dispute.title}</CardTitle>
                          <CardDescription className="text-xs">{dispute.dispute_type}</CardDescription>
                        </div>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 border-white/10">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Voir détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {disputes
              ?.filter(d => d.status === 'resolved' || d.status === 'closed')
              .map((dispute) => {
                const config = statusConfig[dispute.status as DisputeStatus] ?? statusConfig.open;
                const StatusIcon = config.icon;

                return (
                  <Card key={dispute.id} className="bg-white/[0.02] border-white/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{dispute.title}</CardTitle>
                          <CardDescription className="text-xs">{dispute.dispute_type}</CardDescription>
                        </div>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {dispute.resolution_type && (
                        <div className="mb-3">
                          <p className="text-sm text-white/60">
                            Résolution: <span className="text-white capitalize">{dispute.resolution_type}</span>
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 border-white/10">
                          <FileText className="w-4 h-4 mr-1" />
                          Voir détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
