# Influpia

Marketplace B2B2C mettant en relation les **marques** et les **influenceurs**, avec matching IA et paiements sécurisés par **Escrow** (FedaPay / MoneyFusion / Stripe).

## Stack

- Next.js 16 (App Router, React 19)
- Supabase (Auth, Postgres, RLS, pgvector)
- Tailwind CSS v4
- Vitest pour les tests

## Démarrage

```bash
npm install
npm run dev
```

## Variables d'environnement

| Variable | Portée | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur | Clé service role (webhooks, admin) |
| `FEDAPAY_SECRET_KEY` | serveur | Clé secrète FedaPay (payouts) |
| `FEDAPAY_WEBHOOK_SECRET` | serveur | Secret de signature du webhook FedaPay |
| `MONEYFUSION_API_KEY` | serveur | Clé API MoneyFusion |
| `STRIPE_SECRET_KEY` | serveur | Clé Stripe (boost de campagne) |
| `OPENAI_API_KEY` | serveur | Embeddings du matching IA (`text-embedding-3-small`) |
| `NEXT_PUBLIC_SITE_URL` | client | URL publique (sitemap / robots) |

> Les clés secrètes ne sont **jamais** stockées en base de données. Seule la clé publique FedaPay est configurable depuis l'admin.

## Structure

- `src/app/(auth)` — connexion / inscription
- `src/app/(dashboard)` — espaces marque et influenceur, messagerie, statistiques
- `src/app/(admin)` — back-office (KYC, litiges, paramètres plateforme)
- `src/app/api` — routes de paiement et webhooks (auth vérifiée dans chaque handler)
- `supabase/migrations` — schéma, RLS et index
- `db/manual` — SQL à exécuter à la main dans le SQL editor Supabase

## Sécurité

- Middleware fail-closed sur les routes protégées.
- Les routes `/api/*` sont exclues du middleware : chaque handler vérifie l'authentification.
- Webhooks : vérification de signature HMAC (FedaPay) / vérification serveur-à-serveur (MoneyFusion) + contrôle anti sous-paiement.
- **Rôles** : stockés dans `public.user_roles` (jamais sur `profiles`), lus via `has_role()` / `is_admin()` en `SECURITY DEFINER`. Aucune policy d'écriture côté client.
- Réparation de profil via la fonction serveur `ensure_profile()` : le rôle n'est jamais écrit depuis le navigateur.
- Le matching IA utilise de vrais embeddings ; sans `OPENAI_API_KEY` la route renvoie 503 au lieu de résultats aléatoires.

> Exécuter `db/manual/20260812_user_roles.sql` sur la base avant de déployer ces changements.

## Tests & build

```bash
npx vitest run
npm run build
```

## Fonctionnalités premium (août 2026)

- **Centre de notifications temps réel** : table `public.notifications` alimentée par des triggers `SECURITY DEFINER` (nouveau message, changement de statut de collaboration), cloche avec compteur non-lus, marquage lu / tout lu, souscription Realtime filtrée par utilisateur.
- **Palette de commandes (⌘K / Ctrl+K)** : navigation et actions rapides contextualisées par rôle (marque / créateur).
- **Journal d'audit** : table `public.audit_logs` (écriture service role uniquement, lecture réservée aux admins via `has_role`), page `/admin/audit`. Événements tracés : sécurisation d'escrow (FedaPay, MoneyFusion) et exécutions du matching IA.
- **Rate limiting** : `src/lib/rate-limit.ts` protège `/api/ai-matching` (10 req/min/utilisateur, en-têtes `X-RateLimit-*`) et les webhooks de paiement (60 req/min/IP). Les routes `/api/*` étant hors middleware, la limite est appliquée dans chaque handler.
- **Idempotence webhooks** : table `public.webhook_events` (unicité `provider + external_id`) prête pour la déduplication des notifications de paiement.

SQL à exécuter dans Supabase : `db/manual/20260812_notifications_audit.sql` (après `db/manual/20260812_user_roles.sql`).
