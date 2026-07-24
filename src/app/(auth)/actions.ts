"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?error=Invalid login credentials");
  }

  // Fetch the user's role to redirect correctly
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile) {
      return redirect(profile.role === "brand" ? "/brand" : "/influencer");
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const name = formData.get("name") as string;

  const { data, error } = await supabase.auth.signUp({
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
    return redirect(`/register?error=${error.message}`);
  }

  revalidatePath("/", "layout");
  // Typically, you redirect to a "check your email" page, but we'll redirect to login for MVP
  redirect("/login?message=Compte créé avec succès. Veuillez vous connecter.");
}
