import { z } from "zod";

export const campaignSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères").max(100, "Titre trop long"),
  description: z.string().min(20, "Veuillez fournir une description plus détaillée (min 20 caractères)"),
  budget: z.coerce.number().min(1, "Le budget doit être supérieur à 0"),
  target_influencers_count: z.coerce.number().min(1, "Il faut au moins 1 influenceur"),
  target_platforms: z.array(z.string()).min(1, "Sélectionnez au moins une plateforme")
});

export const profileSchema = z.object({
  displayName: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  bio: z.string().max(500, "La bio ne peut excéder 500 caractères").optional(),
  instagram: z.string().url("Veuillez fournir une URL valide").optional().or(z.literal('')),
  tiktok: z.string().url("Veuillez fournir une URL valide").optional().or(z.literal(''))
});
