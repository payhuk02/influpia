"use server";

export async function generateCampaignBrief(keywords: string): Promise<string> {
  // Simulate an API call to OpenAI / Gemini
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!keywords || keywords.trim() === "") {
    return "Veuillez fournir quelques mots-clés pour que l'IA puisse générer le brief.";
  }

  // Mocked generative AI response based on keywords
  const promptWords = keywords.toLowerCase();
  
  if (promptWords.includes("baskets") || promptWords.includes("sneakers") || promptWords.includes("mode")) {
    return `**Lancement de notre nouvelle collection de Sneaker Urbaines**\n\nNous recherchons des créateurs passionnés par la mode streetwear pour mettre en avant notre nouveau modèle ultra-confortable et éco-responsable.\n\n**Ce que nous attendons :**\n- 1 Reel Instagram (min. 15s) ou 1 TikTok dynamique.\n- Focus sur le design et le confort lors d'une utilisation quotidienne.\n- Mention obligatoire de notre hashtag officiel #InflupiaStyle.\n\n**Ce que vous gagnez :**\n- Une paire offerte.\n- Le paiement sécurisé via la plateforme.\n- Une visibilité sur nos réseaux sociaux.`;
  }

  if (promptWords.includes("tech") || promptWords.includes("app") || promptWords.includes("logiciel")) {
    return `**Promotion d'une nouvelle application révolutionnaire**\n\nNous cherchons des influenceurs Tech/Productivité pour tester et présenter notre nouvelle application mobile à leur communauté.\n\n**Ce que nous attendons :**\n- Une vidéo démonstrative de l'interface et des fonctionnalités clés.\n- Un ton authentique et honnête sur les bénéfices de l'app.\n- L'ajout de votre lien d'affiliation dans votre bio.\n\nRejoignez l'aventure et aidez-nous à changer la façon de travailler !`;
  }

  // Generic fallback
  return `**Campagne Sponsorisée Exclusive**\n\nNous lançons un nouveau produit et souhaitons collaborer avec des créateurs authentiques.\n\nVos missions :\n- Créer un contenu engageant présentant le produit.\n- Partager votre avis sincère à votre communauté.\n- Respecter notre charte graphique.\n\nNous avons hâte de voir votre créativité en action !`;
}
