import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/toaster-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Influpia - La Marketplace des Influenceurs et Marques",
  description: "Connectez-vous avec les meilleurs créateurs de contenu grâce à notre IA de matching. Sécurisez vos partenariats avec notre Escrow FedaPay.",
  openGraph: {
    title: "Influpia - Plateforme d'Influence B2B2C",
    description: "Connectez-vous avec les meilleurs créateurs de contenu.",
    url: "https://influpia.com",
    siteName: "Influpia",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "fr_FR",
    type: "website",
  },
};

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen`}>
        {children}
        <ToasterProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
