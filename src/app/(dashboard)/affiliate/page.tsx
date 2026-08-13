import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Share2, TrendingUp, DollarSign, Users, Calendar, Award, Link } from "lucide-react";
import { getAffiliateInfo, getCommissions, getAffiliatePayouts, getAffiliateMetrics, getTierRules } from "../actions/affiliate";

export default async function AffiliatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const affiliate = await getAffiliateInfo(user.id);
  const commissions = await getCommissions(affiliate?.id || '');
  const payouts = await getAffiliatePayouts(affiliate?.id || '');
  const metrics = await getAffiliateMetrics(affiliate?.id || '', 30);
  const tierRules = affiliate?.program_id ? await getTierRules(affiliate.program_id) : [];

  const currentTier = tierRules?.find(t => t.tier_level === affiliate?.tier);
  const nextTier = tierRules?.find(t => t.tier_level === (affiliate?.tier || 0) + 1);

  const totalEarnings = affiliate?.total_earnings_cents || 0;
  const currentBalance = affiliate?.current_balance_cents || 0;
  const referralCount = affiliate?.referral_count || 0;
  const activeReferrals = affiliate?.active_referral_count || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Programme d'Affiliation</h1>
        <p className="text-white/60">
          Gagnez des commissions en parrainant de nouveaux utilisateurs.
        </p>
      </div>

      {!affiliate ? (
        <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
          <CardHeader>
            <CardTitle>Devenir Partenaire</CardTitle>
            <CardDescription>
              Rejoignez notre programme d'affiliation et commencez à gagner des commissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-emerald-400" />
                  <div>
                    <p className="font-bold">10%</p>
                    <p className="text-xs text-white/60">Commission de base</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-bold">Illimité</p>
                    <p className="text-xs text-white/60">Réferrals</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-accent" />
                  <div>
                    <p className="font-bold">30 jours</p>
                    <p className="text-xs text-white/60">Durée cookie</p>
                  </div>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Share2 className="w-4 h-4 mr-2" />
                Rejoindre le programme
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Affiliate Status */}
          <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-primary" />
                    <CardTitle>Statut: {affiliate.status === 'active' ? 'Partenaire Actif' : affiliate.status}</CardTitle>
                  </div>
                  <CardDescription>
                    Code de parrainage: <span className="font-mono font-bold text-primary">{affiliate.affiliate_code}</span>
                  </CardDescription>
                </div>
                <Badge className={affiliate.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                  {currentTier?.tier_name || 'Bronze'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-white/10">
                  <Copy className="w-4 h-4 mr-1" />
                  Copier le lien
                </Button>
                <Button variant="outline" size="sm" className="border-white/10">
                  <Share2 className="w-4 h-4 mr-1" />
                  Partager
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">Solde disponible</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-emerald-400">
                  {(currentBalance / 100).toFixed(2)} €
                </CardTitle>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">Gains totaux</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-primary">
                  {(totalEarnings / 100).toFixed(2)} €
                </CardTitle>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">Réferrals</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-accent">
                  {referralCount}
                </CardTitle>
                <p className="text-xs text-white/40">{activeReferrals} actifs</p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/60">Taux de conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold">
                  {metrics?.length > 0 
                    ? ((metrics[0].conversion_rate || 0) * 100).toFixed(1) + '%'
                    : '0%'}
                </CardTitle>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="commissions" className="space-y-6">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="payouts">Paiements</TabsTrigger>
              <TabsTrigger value="tier">Niveau & Avantages</TabsTrigger>
              <TabsTrigger value="referrals">Réferrals</TabsTrigger>
            </TabsList>

            <TabsContent value="commissions" className="space-y-6">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle>Historique des commissions</CardTitle>
                  <CardDescription>Vos gains par parrainage</CardDescription>
                </CardHeader>
                <CardContent>
                  {commissions?.length === 0 ? (
                    <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                      Aucune commission pour le moment
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commissions?.slice(0, 10).map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div>
                            <p className="font-semibold capitalize">{commission.commission_type}</p>
                            <p className="text-xs text-white/50">
                              {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              commission.status === 'paid' ? 'text-emerald-400' :
                              commission.status === 'pending' ? 'text-amber-400' :
                              commission.status === 'approved' ? 'text-blue-400' :
                              'text-red-400'
                            }`}>
                              {(commission.commission_amount_cents / 100).toFixed(2)} €
                            </p>
                            <Badge variant="outline" className="text-xs border-white/10">
                              {commission.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Historique des paiements</CardTitle>
                      <CardDescription>Vos paiements reçus</CardDescription>
                    </div>
                    {currentBalance >= 5000 && (
                      <Button className="bg-primary hover:bg-primary/90">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Demander un paiement
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {payouts?.length === 0 ? (
                    <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                      Aucun paiement effectué pour le moment
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payouts?.map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div>
                            <p className="font-semibold">
                              {new Date(payout.payout_period_start).toLocaleDateString('fr-FR')} - {new Date(payout.payout_period_end).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-xs text-white/50">
                              {payout.payment_provider || 'En attente'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              payout.status === 'paid' ? 'text-emerald-400' :
                              payout.status === 'processing' ? 'text-blue-400' :
                              'text-amber-400'
                            }`}>
                              {(payout.net_amount_cents / 100).toFixed(2)} €
                            </p>
                            <Badge variant="outline" className="text-xs border-white/10">
                              {payout.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tier" className="space-y-6">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle>Votre niveau actuel</CardTitle>
                  <CardDescription>Progression et avantages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      currentTier?.tier_level === 1 ? 'bg-gray-500/20 text-gray-400' :
                      currentTier?.tier_level === 2 ? 'bg-blue-500/20 text-blue-400' :
                      currentTier?.tier_level === 3 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-white/5 text-white/60'
                    }`}>
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{currentTier?.tier_name || 'Bronze'}</CardTitle>
                      <CardDescription>Niveau {affiliate?.tier || 1}</CardDescription>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/60">Commission actuelle</p>
                      <p className="text-2xl font-bold text-primary">
                        {((currentTier?.commission_rate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">Commission parent</p>
                      <p className="text-2xl font-bold text-accent">
                        {((currentTier?.parent_commission_rate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {nextTier && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm text-white/60 mb-2">Prochain niveau: {nextTier.tier_name}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Referrals requis</span>
                          <span>{referralCount} / {nextTier.min_referrals}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Revenus requis</span>
                          <span>{(totalEarnings / 100).toFixed(0)}€ / {(nextTier.min_revenue_cents / 100).toFixed(0)}€</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/10">
                <CardHeader>
                  <CardTitle>Tous les niveaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tierRules?.map((tier) => {
                      const isCurrent = tier.tier_level === affiliate?.tier;
                      const isUnlocked = referralCount >= tier.min_referrals && totalEarnings >= tier.min_revenue_cents;

                      return (
                        <div
                          key={tier.id}
                          className={`flex items-center justify-between p-4 rounded-xl ${
                            isCurrent ? 'bg-primary/10 border border-primary/20' :
                            isUnlocked ? 'bg-white/[0.02] border border-white/10' :
                            'bg-black/40 border border-white/5 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Award className={`w-5 h-5 ${
                              isCurrent ? 'text-primary' :
                              isUnlocked ? 'text-white' :
                              'text-white/30'
                            }`} />
                            <div>
                              <p className="font-semibold">{tier.tier_name}</p>
                              <p className="text-xs text-white/50">{(tier.commission_rate * 100).toFixed(1)}% commission</p>
                            </div>
                          </div>
                          {isCurrent && (
                            <Badge className="bg-primary text-white">Actuel</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle>Vos referrals</CardTitle>
                  <CardDescription>Utilisateurs parrainés</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10 text-white/40 border border-white/5 rounded-xl border-dashed">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Les détails des referrals seront disponibles bientôt</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
