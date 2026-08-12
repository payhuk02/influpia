import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/30 selection:text-white overflow-hidden">
      {/* Navbar */}
      <header className="px-6 lg:px-14 py-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          {/* Logo Influpia */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Influpia</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-white/70">
          <Link href="#features" className="hover:text-white transition-colors">Fonctionnalités</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">Comment ça marche</Link>
          <Link href="#testimonials" className="hover:text-white transition-colors">Avis</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Tarifs</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-white text-white/70 transition-colors hidden sm:block">Connexion</Link>
          <Link href="/register" className="text-sm font-medium bg-white text-black px-5 py-2.5 rounded-full hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Commencer
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 lg:px-14 py-24 md:py-32 lg:py-40 flex flex-col items-center text-center">
          {/* Background effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm mb-8 backdrop-blur-sm transform transition-transform hover:scale-105 cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-white/90 font-medium">Lancement Officiel de Influpia 2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight max-w-5xl leading-[1.1] mb-6">
            La plateforme d'influence <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-gold">nouvelle génération</span>.
          </h1>
          
          <p className="text-lg md:text-2xl text-white/60 max-w-3xl mb-12 leading-relaxed">
            Connectez votre marque aux créateurs les plus performants. Gérez vos contrats, sécurisez vos paiements et analysez votre ROI en un seul endroit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto relative z-10">
            <Button size="lg" asChild className="rounded-full px-8 py-6 text-lg shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] hover:-translate-y-1 transition-all">
              <Link href="/register?role=brand">Je suis une Marque</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8 py-6 text-lg border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:-translate-y-1 transition-all text-white hover:text-white">
              <Link href="/register?role=influencer">Je suis un Créateur</Link>
            </Button>
          </div>
        </section>

        {/* Trusted By Banner */}
        <section className="py-10 border-y border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm font-medium text-white/40 mb-8 uppercase tracking-widest">Ils nous font déjà confiance</p>
            <div className="flex justify-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 flex-wrap">
              {['L\'Oréal', 'Nike', 'Spotify', 'Sephora', 'Samsung'].map((brand, i) => (
                <div key={i} className="text-2xl font-bold tracking-tighter text-white">{brand}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition (Split View) */}
        <section id="features" className="py-24 md:py-32 px-6 lg:px-14">
          <div className="max-w-7xl mx-auto">
            {/* Brands Side */}
            <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                  Pour les Marques
                </div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Prenez le contrôle de vos campagnes marketing.
                </h2>
                <p className="text-xl text-white/60">
                  Fini les tableurs Excel et les emails perdus. Influpia centralise la recherche, la négociation et l'analyse de vos campagnes d'influence.
                </p>
                <ul className="space-y-4">
                  {[
                    "Matching IA avec les meilleurs profils",
                    "Paiement sécurisé en escrow",
                    "Tableau de bord ROI en temps réel"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">✓</div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                <div className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-2 shadow-2xl backdrop-blur-xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-background rounded-2xl p-6 border border-white/5">
                    {/* Mockup UI */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-32 h-4 bg-white/10 rounded-full" />
                      <div className="w-10 h-10 bg-white/5 rounded-full" />
                    </div>
                    <div className="space-y-4">
                      <div className="h-24 bg-white/[0.02] border border-white/5 rounded-xl p-4 flex gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-lg" />
                        <div className="flex-1 space-y-2 py-2">
                          <div className="w-1/2 h-3 bg-white/20 rounded-full" />
                          <div className="w-1/3 h-2 bg-white/10 rounded-full" />
                        </div>
                      </div>
                      <div className="h-24 bg-white/[0.02] border border-white/5 rounded-xl p-4 flex gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-lg" />
                        <div className="flex-1 space-y-2 py-2">
                          <div className="w-1/2 h-3 bg-white/20 rounded-full" />
                          <div className="w-1/3 h-2 bg-white/10 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Influencers Side */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20">
                  Pour les Créateurs
                </div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Monétisez votre audience, à votre juste valeur.
                </h2>
                <p className="text-xl text-white/60">
                  Accédez à des centaines de marques premium. Nous garantissons vos paiements pour que vous puissiez vous concentrer sur la création.
                </p>
                <ul className="space-y-4">
                  {[
                    "Marketplace de campagnes exclusives",
                    "Garantie de paiement via Stripe/Mobile Money",
                    "Messagerie directe avec les marques"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">✓</div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
                <div className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-2 shadow-2xl backdrop-blur-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-background rounded-2xl p-6 border border-white/5">
                    {/* Mockup UI */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-full mb-2" />
                        <div className="w-20 h-3 bg-emerald-400/50 rounded-full" />
                      </div>
                      <div className="flex-1 h-20 bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="w-8 h-8 bg-white/10 rounded-full mb-2" />
                        <div className="w-20 h-3 bg-white/20 rounded-full" />
                      </div>
                    </div>
                    <div className="w-full h-32 bg-white/[0.02] border border-white/5 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 md:py-32 bg-black/50 border-y border-white/5 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Comment ça marche ?</h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">Une expérience fluide et sécurisée, de la découverte au paiement.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              
              {[
                { step: "01", title: "Découverte", desc: "Les marques publient des campagnes, notre IA matche les meilleurs créateurs." },
                { step: "02", title: "Collaboration", desc: "Discutez via la messagerie, validez les livrables et signez le contrat digital." },
                { step: "03", title: "Paiement Sécurisé", desc: "Les fonds sont sécurisés au début, puis libérés dès la publication du contenu." }
              ].map((item, i) => (
                <div key={i} className="relative bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-2xl font-bold text-primary mb-6 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Prêt à révolutionner votre influence ?</h2>
            <p className="text-xl text-white/60 mb-10">Rejoignez des milliers de marques et créateurs qui font déjà confiance à Influpia.</p>
            <Link href="/register" className="inline-flex items-center justify-center px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Créer mon compte gratuitement
            </Link>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="bg-black/80 border-t border-white/5 pt-20 pb-10 px-6 lg:px-14">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-2xl font-bold tracking-tight text-white">Influpia</span>
              </div>
              <p className="text-white/50 text-sm max-w-sm mb-6 leading-relaxed">
                La première plateforme SaaS de mise en relation Marques & Influenceurs avec garantie de paiement et matching IA.
              </p>
              <div className="flex gap-4">
                {/* Social Icons Placeholders */}
                {['Twitter', 'LinkedIn', 'Instagram'].map((social, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-colors cursor-pointer border border-white/5">
                    <span className="text-xs text-white/50">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Produit</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="#" className="hover:text-white transition-colors">Pour les Marques</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pour les Créateurs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cas Clients</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Ressources</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Guides d'influence</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Centre d'aide</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API & Docs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Légal</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="/terms" className="hover:text-white transition-colors">CGV / CGU</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-sm text-white/40">
            <p>© 2026 Influpia Inc. Tous droits réservés.</p>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Système Opérationnel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
