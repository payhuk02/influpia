"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBrandProfile, updateInfluencerProfile } from "./actions";
import { Loader2, ShieldCheck, Building2, UserCircle, CreditCard, Globe, Clock, Calendar } from "lucide-react";
import { languages, currencies, timezones, dateFormats, timeFormats, firstDaysOfWeek } from "@/lib/i18n";

export function SettingsForm({ user, profile, data }: { user: any, profile: any, data: any }) {
  const [activeTab, setActiveTab] = useState("public");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [regionalSettings, setRegionalSettings] = useState({
    language: 'fr',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 1,
  });

  const isBrand = profile.role === "brand";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      const formData = new FormData(e.currentTarget);
      if (isBrand) {
        await updateBrandProfile(formData);
      } else {
        await updateInfluencerProfile(formData);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <button 
          type="button"
          onClick={() => setActiveTab("public")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'public' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
        >
          <UserCircle className="w-5 h-5" /> Profil Public
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'billing' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
        >
          {isBrand ? <Building2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />} 
          {isBrand ? "Facturation & B2B" : "Paiements & Portfolio"}
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'security' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
        >
          <ShieldCheck className="w-5 h-5" /> Sécurité du Compte
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab("regional")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${activeTab === 'regional' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
        >
          <Globe className="w-5 h-5" /> Langue & Région
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <form onSubmit={handleSubmit}>
          {activeTab === "public" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <Card className="bg-white/[0.02] border-white/10">
                <CardHeader>
                  <CardTitle>Informations Publiques</CardTitle>
                  <CardDescription>Ces informations seront visibles par les autres utilisateurs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom d'affichage / Entreprise</label>
                    <Input name={isBrand ? "company_name" : "display_name"} defaultValue={data?.company_name || data?.display_name || ''} className="bg-white/5 border-white/10" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Biographie / Description</label>
                    <textarea 
                      name={isBrand ? "description" : "bio"} 
                      defaultValue={data?.description || data?.bio || ''} 
                      className="w-full min-h-[100px] p-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <Card className="bg-white/[0.02] border-white/10">
                <CardHeader>
                  <CardTitle>{isBrand ? "Détails B2B & Facturation" : "Finances & Portfolio"}</CardTitle>
                  <CardDescription>
                    {isBrand ? "Informations nécessaires à la génération automatique des factures." : "Renseignez vos identifiants pour recevoir vos paiements directement."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isBrand ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Numéro de TVA Intracommunautaire</label>
                        <Input name="vat_number" defaultValue={data?.vat_number || ''} placeholder="FRXX00000000" className="bg-white/5 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Adresse de Facturation complète</label>
                        <textarea 
                          name="address" 
                          defaultValue={data?.billing_address?.full_address || ''} 
                          placeholder="123 Rue de la Marque, 75001 Paris, France"
                          className="w-full min-h-[80px] p-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">URL de votre Charte Graphique (Brand Guidelines)</label>
                        <Input name="brand_guidelines_url" defaultValue={data?.brand_guidelines_url || ''} type="url" placeholder="https://..." className="bg-white/5 border-white/10" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-emerald-400">Identifiant Compte FedaPay</label>
                        <Input name="fedapay_account_id" defaultValue={data?.fedapay_account_id || ''} placeholder="cus_xxx..." className="bg-white/5 border-white/10" />
                        <p className="text-xs text-white/40">Nécessaire pour recevoir vos paiements Mobile Money/Cartes via FedaPay.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-400">Identifiant Compte Moneyfusion</label>
                        <Input name="moneyfusion_account_id" defaultValue={data?.moneyfusion_account_id || ''} placeholder="mf_acc_xxx..." className="bg-white/5 border-white/10" />
                        <p className="text-xs text-white/40">Alternative pour réception de paiements sécurisés via Moneyfusion.</p>
                      </div>
                      <div className="space-y-2 mt-6 pt-6 border-t border-white/10">
                        <label className="text-sm font-medium">Lien vers votre Media Kit / Portfolio</label>
                        <Input name="portfolio_url" defaultValue={data?.portfolio_url || ''} type="url" placeholder="https://..." className="bg-white/5 border-white/10" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <Card className="bg-white/[0.02] border-white/10">
                <CardHeader>
                  <CardTitle>Sécurité & Authentification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Adresse Email</label>
                    <Input type="email" defaultValue={user?.email} disabled className="bg-white/5 border-white/10 text-white/50" />
                    <p className="text-xs text-white/40">Pour modifier votre email, veuillez contacter le support.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive">Zone Dangereuse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 mb-4">La suppression de votre compte est définitive. Toutes vos données seront effacées.</p>
                  <Button type="button" variant="destructive">Supprimer le compte</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "regional" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <Card className="bg-white/[0.02] border-white/10">
                <CardHeader>
                  <CardTitle>Langue & Région</CardTitle>
                  <CardDescription>Personnalisez vos préférences linguistiques et régionales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Langue
                    </Label>
                    <Select value={regionalSettings.language} onValueChange={(value) => value && setRegionalSettings({...regionalSettings, language: value})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10">
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.flag} {lang.nativeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Fuseau horaire
                    </Label>
                    <Select value={regionalSettings.timezone} onValueChange={(value) => value && setRegionalSettings({...regionalSettings, timezone: value})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10">
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select value={regionalSettings.currency} onValueChange={(value) => value && setRegionalSettings({...regionalSettings, currency: value})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10">
                        {currencies.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Format de date
                      </Label>
                      <Select value={regionalSettings.dateFormat} onValueChange={(value) => value && setRegionalSettings({...regionalSettings, dateFormat: value})}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          {dateFormats.map((df) => (
                            <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Format d'heure</Label>
                      <Select value={regionalSettings.timeFormat} onValueChange={(value) => setRegionalSettings({...regionalSettings, timeFormat: value as '12h' | '24h'})}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          {timeFormats.map((tf) => (
                            <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Premier jour de la semaine</Label>
                    <Select value={regionalSettings.firstDayOfWeek.toString()} onValueChange={(value) => value && setRegionalSettings({...regionalSettings, firstDayOfWeek: parseInt(value)})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10">
                        {firstDaysOfWeek.map((fd) => (
                          <SelectItem key={fd.value} value={fd.value.toString()}>{fd.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {(activeTab === "public" || activeTab === "billing") && (
            <div className="mt-6 flex items-center justify-end gap-4">
              {success && <span className="text-emerald-400 text-sm font-medium animate-in fade-in">Profil mis à jour !</span>}
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white min-w-[150px]">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sauvegarder"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
