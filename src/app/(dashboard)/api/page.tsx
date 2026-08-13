import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Copy, Eye, EyeOff, BarChart3, Webhook, Book, Trash2 } from "lucide-react";
import { getAPIKeys, getAPIUsageLogs, getWebhooks, getAPIEndpoints } from "../actions/api";
import { CreateApiKeyButton, CreateWebhookButton } from "@/components/dashboard/feature-forms";

export default async function APIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const apiKeys = await getAPIKeys(user.id);
  const usageLogs = await getAPIUsageLogs(user.id, 50);
  const webhooks = await getWebhooks(user.id);
  const endpoints = await getAPIEndpoints();

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">API</h1>
          <p className="text-white/60">
            Gérez vos clés API, webhooks et consultez l'utilisation.
          </p>
        </div>
        <CreateApiKeyButton />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">Clés actives</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold text-primary">
              {apiKeys?.filter(k => k.is_active).length || 0}
            </CardTitle>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">Requêtes aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold text-accent">
              {usageLogs?.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length || 0}
            </CardTitle>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">Webhooks actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold text-emerald-400">
              {webhooks?.filter(w => w.is_active).length || 0}
            </CardTitle>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60">Taux d'erreur</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl font-bold">
              {usageLogs?.length > 0 
                ? ((usageLogs.filter(l => l.status_code >= 400).length / usageLogs.length) * 100).toFixed(1) + '%'
                : '0%'}
            </CardTitle>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="keys">Clés API</TabsTrigger>
          <TabsTrigger value="usage">Utilisation</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Vos Clés API</CardTitle>
              <CardDescription>Gérez vos clés d'authentification pour l'API</CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune clé API créée</p>
                  <CreateApiKeyButton label="Créer une clé" className="mt-4" />
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys?.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          key.key_type === 'live' ? 'bg-emerald-500/10' :
                          key.key_type === 'test' ? 'bg-blue-500/10' :
                          'bg-gray-500/10'
                        }`}>
                          <Key className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="font-semibold">{key.key_name}</p>
                          <p className="text-xs text-white/50 font-mono">
                            {key.key_prefix}••••••••••••••••••••••••
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`${
                          key.key_type === 'live' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          key.key_type === 'test' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {key.key_type}
                        </Badge>
                        <Badge variant="outline" className={key.is_active ? 'bg-white/5 text-white/60 border-white/10' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                          {key.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Eye className="w-4 h-4" />
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

        <TabsContent value="usage" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Historique d'utilisation</CardTitle>
              <CardDescription>Journal des requêtes API</CardDescription>
            </CardHeader>
            <CardContent>
              {usageLogs?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune requête API enregistrée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usageLogs?.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="font-semibold">{log.method} {log.endpoint}</p>
                        <p className="text-xs text-white/50">
                          {new Date(log.created_at).toLocaleString('fr-FR')} • {log.response_time_ms}ms
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`${
                          log.status_code >= 200 && log.status_code < 300 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          log.status_code >= 400 && log.status_code < 500 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          log.status_code >= 500 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {log.status_code}
                        </Badge>
                        {log.rate_limited && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                            Rate limited
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>Configurez les webhooks pour les notifications d'événements</CardDescription>
                </div>
                <CreateWebhookButton />
              </div>
            </CardHeader>
            <CardContent>
              {webhooks?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun webhook configuré</p>
                  <CreateWebhookButton label="Créer un webhook" className="mt-4" />
                </div>
              ) : (
                <div className="space-y-3">
                  {webhooks?.map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10">
                          <Webhook className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{webhook.webhook_name}</p>
                          <p className="text-xs text-white/50 font-mono truncate max-w-xs">
                            {webhook.webhook_url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={webhook.is_active ? 'bg-white/5 text-white/60 border-white/10' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                          {webhook.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Eye className="w-4 h-4" />
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

        <TabsContent value="docs" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Documentation API</CardTitle>
              <CardDescription>Endpoints disponibles et leurs descriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {endpoints?.map((endpoint) => (
                  <div key={endpoint.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {endpoint.method}
                        </Badge>
                        <p className="font-semibold font-mono">{endpoint.endpoint_path}</p>
                      </div>
                      <p className="text-xs text-white/50 mt-1">{endpoint.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {endpoint.authentication_required && (
                        <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10">
                          Auth requise
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
