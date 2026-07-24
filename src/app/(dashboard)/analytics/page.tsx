import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics & ROI (Beta)</h1>
        <p className="text-white/60">Mesurez l'impact de vos campagnes d'influence en temps réel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Impressions Totales</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">2.4M</CardTitle>
            <Badge variant="success" className="mt-2">+12% ce mois</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux d'Engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">4.8%</CardTitle>
            <Badge variant="warning" className="mt-2">Stable</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clics Générés</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">42.1K</CardTitle>
            <Badge variant="success" className="mt-2">+5% ce mois</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ROI (Estimé)</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-emerald-400">3.2x</CardTitle>
            <p className="text-xs text-white/40 mt-2">Basé sur le budget dépensé</p>
          </CardContent>
        </Card>
      </div>

      <Card className="h-96 flex flex-col items-center justify-center border-dashed border-2 bg-transparent">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold">Graphiques Avancés</h3>
          <p className="text-white/60 max-w-md mx-auto">
            Intégration de l'API Graph (Instagram & TikTok) en cours de développement. Les métriques s'afficheront ici automatiquement dès la validation des autorisations sociales.
          </p>
          <Badge variant="outline">En construction</Badge>
        </div>
      </Card>
    </div>
  );
}
