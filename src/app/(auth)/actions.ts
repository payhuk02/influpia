"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  let errorMsg = "";
  let redirectUrl = "";

  try {
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorMsg = "Identifiants invalides";
    } else {
      // Fetch the user's role to redirect correctly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile) {
          redirectUrl = profile.role === "brand" ? "/brand" : "/influencer";
        }
      }
    }
  } catch (e: any) {
    errorMsg = e.message || "Erreur serveur";
  }

  if (errorMsg) {
    return redirect(`/login?error=${encodeURIComponent(errorMsg)}`);
  }

  revalidatePath("/", "layout");
  redirect(redirectUrl || "/dashboard");
}

export async function signup(formData: FormData) {
  let errorMsg = "";

  try {
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const name = formData.get("name") as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          name: name,
        }
      }
    });

    if (error) {
      errorMsg = error.message;
    }
  } catch (e: any) {
    errorMsg = e.message || "Erreur d'initialisation de Supabase (Vérifiez les variables d'environnement Vercel)";
  }

  if (errorMsg) {
    return redirect(`/register?error=${encodeURIComponent(errorMsg)}`);
  }

  revalidatePath("/", "layout");
  redirect("/login?message=" + encodeURIComponent("Compte créé avec succès. Veuillez vous connecter."));
}
