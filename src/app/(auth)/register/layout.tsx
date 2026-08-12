import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte | Influpia",
  description: "Inscrivez-vous en tant que marque ou influenceur et lancez vos premières collaborations sécurisées par Escrow.",
  openGraph: {
    title: "Créer un compte sur Influpia",
    description: "Marques et créateurs : rejoignez la marketplace d'influence sécurisée.",
    type: "website",
  },
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
