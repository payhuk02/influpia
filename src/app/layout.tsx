import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/toaster-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Influpia - La plateforme d'influence nouvelle génération",
  description: "Connectez votre marque aux créateurs les plus performants. Gérez vos contrats, sécurisez vos paiements et analysez votre ROI en un seul endroit.",
};

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
      </body>
    </html>
  );
}
