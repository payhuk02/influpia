"use client";

import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { useState } from "react";

interface ContractProps {
  collaborationId: string;
  brandName: string;
  influencerName: string;
  campaignTitle: string;
  amount: number;
}

export function DownloadContractButton({ collab }: { collab: ContractProps }) {
  const [loading, setLoading] = useState(false);

  const generatePDF = () => {
    setLoading(true);
    
    try {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(22);
      doc.text("Contrat de Prestation - Influpia", 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Identifiant: ${collab.collaborationId}`, 20, 45);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 52);
      
      // Parties
      doc.setFontSize(16);
      doc.text("1. Les Parties", 20, 70);
      doc.setFontSize(12);
      doc.text(`La Marque : ${collab.brandName}`, 20, 80);
      doc.text(`Le Créateur : ${collab.influencerName}`, 20, 87);
      
      // Objet du contrat
      doc.setFontSize(16);
      doc.text("2. Objet de la Campagne", 20, 105);
      doc.setFontSize(12);
      doc.text(`Titre : ${collab.campaignTitle}`, 20, 115);
      doc.text("Le Créateur s'engage à produire le contenu tel que décrit dans le brief.", 20, 125);
      
      // Rémunération
      doc.setFontSize(16);
      doc.text("3. Rémunération & Escrow", 20, 145);
      doc.setFontSize(12);
      doc.text(`Montant TTC : ${collab.amount} €`, 20, 155);
      doc.text("Les fonds sont actuellement sécurisés sur un compte séquestre FedaPay.", 20, 165);
      doc.text("Le paiement final sera libéré à la validation des livrables.", 20, 172);

      // Signatures
      doc.setFontSize(16);
      doc.text("Signatures (Électroniques via Influpia)", 20, 200);
      doc.setFontSize(12);
      doc.text(`Pour ${collab.brandName} : Validé lors de l'Escrow`, 20, 215);
      doc.text(`Pour ${collab.influencerName} : Validé lors de la candidature`, 20, 225);

      // Sauvegarde
      doc.save(`Contrat_${collab.collaborationId.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du contrat PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="border-primary text-primary hover:bg-primary hover:text-white"
      onClick={generatePDF}
      disabled={loading}
    >
      {loading ? "Génération..." : "📄 Télécharger le Contrat (PDF)"}
    </Button>
  );
}
