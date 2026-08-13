import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Share2, Star, Download, Clock, BarChart3 } from "lucide-react";
import { getReportTemplates, getGeneratedReports, getScheduledReports, getFavoriteReports } from "../actions/reporting";
import { CreateReportButton, UseReportTemplateButton } from "@/components/dashboard/feature-forms";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const templates = await getReportTemplates();
  const reports = await getGeneratedReports(user.id);
  const scheduledReports = await getScheduledReports(user.id);
  const favoriteReports = await getFavoriteReports(user.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Rapports</h1>
          <p className="text-white/60">
            Générez et gérez vos rapports personnalisés.
          </p>
        </div>
        <CreateReportButton templates={templates ?? []} />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="favorites">Favoris</TabsTrigger>
          <TabsTrigger value="scheduled">Planifiés</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Rapports générés</CardTitle>
              <CardDescription>Vos rapports récents</CardDescription>
            </CardHeader>
            <CardContent>
              {reports?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport généré</p>
                  <CreateReportButton templates={templates ?? []} label="Créer un rapport" className="mt-4" />
                </div>
              ) : (
                <div className="space-y-3">
                  {reports?.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{report.report_name}</p>
                          <p className="text-xs text-white/50">
                            {report.template?.display_name || report.report_type} • {new Date(report.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10">
                          {report.file_format?.toUpperCase()}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Star className="w-4 h-4" />
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

        <TabsContent value="favorites" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Rapports favoris</CardTitle>
              <CardDescription>Vos rapports enregistrés</CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteReports?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport favori</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteReports?.map((fav) => (
                    <div key={fav.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/10">
                          <Star className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold">{fav.report?.report_name}</p>
                          <p className="text-xs text-white/50">
                            {new Date(fav.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rapports planifiés</CardTitle>
                  <CardDescription>Rapports générés automatiquement</CardDescription>
                </div>
                <CreateReportButton templates={templates ?? []} label="Planifier un rapport" />
              </div>
            </CardHeader>
            <CardContent>
              {scheduledReports?.length === 0 ? (
                <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport planifié</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledReports?.map((scheduled) => (
                    <div key={scheduled.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
                          <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold">{scheduled.report_name}</p>
                          <p className="text-xs text-white/50 capitalize">{scheduled.schedule} • {scheduled.output_format?.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={scheduled.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                          {scheduled.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                          <FileText className="w-4 h-4" />
                        </Button>
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
              <CardTitle>Modèles de rapport</CardTitle>
              <CardDescription>Modèles prédéfinis pour générer rapidement des rapports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((template) => (
                  <Card key={template.id} className="bg-white/[0.02] border-white/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">{template.display_name}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10 text-xs">
                          {template.category}
                        </Badge>
                        <UseReportTemplateButton
                          templateId={template.id}
                          templateName={template.display_name}
                          reportType={template.report_type}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
