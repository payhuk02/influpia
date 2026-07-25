import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/toaster-provider";

// Remove Google Fonts for local testing to avoid network issues
const interClassName = "font-sans";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${interClassName} bg-background text-foreground antialiased min-h-screen`}>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
