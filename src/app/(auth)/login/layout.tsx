import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion | Influpia",
  description: "Connectez-vous à votre espace Influpia pour gérer vos campagnes, vos prestations et vos paiements Escrow.",
  openGraph: {
    title: "Connexion à Influpia",
    description: "Accédez à votre tableau de bord marque ou influenceur.",
    type: "website",
  },
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
