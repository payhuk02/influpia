import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Zap, Star, ArrowRight, AlertTriangle } from "lucide-react";
import { getSubscriptionPlans, getUserSubscription, getUserUsage } from "../actions/subscriptions";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const plans = await getSubscriptionPlans();
  const subscription = await getUserSubscription(user.id);
  const usage = await getUserUsage(user.id);

  const currentPlan = subscription?.plan;
  const currentPlanId = currentPlan?.id;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Abonnement</h1>
        <p className="text-white/60">
          Choisissez le plan qui correspond à vos besoins.
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Plan actuel: {currentPlan.display_name}
                </CardTitle>
                <CardDescription>
                  Renouvelle le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
              <Badge className={subscription.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                {subscription.status === 'active' ? 'Actif' : subscription.status}
              </Badge>
            </div>
          </CardHeader>
          {subscription.cancel_at_period_end && (
            <CardContent>
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  Votre abonnement sera annulé à la fin de la période en cours.
                </span>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Usage Overview */}
      {usage && usage.length > 0 && (
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle>Utilisation</CardTitle>
            <CardDescription>Votre utilisation actuelle du plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {usage.map((item) => {
                const percentage = item.limit > 0 ? (item.current_usage / item.limit) * 100 : 0;
                const isNearLimit = percentage >= 80;
                
                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60 capitalize">{item.metric_type}</span>
                      <span className={isNearLimit ? 'text-amber-400' : 'text-white'}>
                        {item.current_usage} / {item.limit}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isNearLimit ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/40">
                      Réinitialise le {new Date(item.reset_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isPopular = plan.tier === 'pro';
          
          return (
            <Card
              key={plan.id}
              className={`relative ${
                isPopular
                  ? 'bg-gradient-to-b from-primary/10 to-transparent border-primary/30 scale-105'
                  : 'bg-white/[0.02] border-white/10'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white border-primary">
                    Populaire
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {plan.tier === 'free' && <Star className="w-5 h-5 text-gray-400" />}
                  {plan.tier === 'pro' && <Zap className="w-5 h-5 text-primary" />}
                  {plan.tier === 'enterprise' && <Crown className="w-5 h-5 text-amber-400" />}
                  <CardTitle className="text-xl">{plan.display_name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {(plan.price_cents / 100).toFixed(0)}
                  </span>
                  <span className="text-white/60">€/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/80">
                      {plan.features.max_campaigns === -1 ? 'Campagnes illimitées' : `${plan.features.max_campaigns} campagnes`}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/80">
                      {plan.features.max_influencers === -1 ? 'Influenceurs illimités' : `${plan.features.max_influencers} influenceurs`}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.features.ai_matching ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={plan.features.ai_matching ? 'text-white/80' : 'text-white/30'}>
                      Matching IA
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.features.advanced_analytics ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={plan.features.advanced_analytics ? 'text-white/80' : 'text-white/30'}>
                      Analytics avancés
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.features.custom_reports ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={plan.features.custom_reports ? 'text-white/80' : 'text-white/30'}>
                      Rapports personnalisés
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.features.api_access ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={plan.features.api_access ? 'text-white/80' : 'text-white/30'}>
                      Accès API
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.features.priority_support ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={plan.features.priority_support ? 'text-white/80' : 'text-white/30'}>
                      Support prioritaire
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.features.white_label ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={plan.features.white_label ? 'text-white/80' : 'text-white/30'}>
                      White-label
                    </span>
                  </li>
                </ul>

                <Button
                  className={`w-full ${
                    isCurrentPlan
                      ? 'bg-white/10 text-white/60 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
                  {!isCurrentPlan && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add-ons */}
      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle>Options supplémentaires</CardTitle>
          <CardDescription>Augmentez les limites de votre plan actuel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-black/40 border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Campagnes supplémentaires</CardTitle>
                <CardDescription className="text-xs">+10 campagnes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-3">5 000 €</div>
                <Button variant="outline" size="sm" className="w-full border-white/10">
                  Ajouter
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Influenceurs supplémentaires</CardTitle>
                <CardDescription className="text-xs">+100 influenceurs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-3">3 000 €</div>
                <Button variant="outline" size="sm" className="w-full border-white/10">
                  Ajouter
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rapport sécurité marque</CardTitle>
                <CardDescription className="text-xs">Analyse détaillée</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-3">2 000 €</div>
                <Button variant="outline" size="sm" className="w-full border-white/10">
                  Ajouter
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
