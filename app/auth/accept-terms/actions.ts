"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function acceptTermsAction(formData: FormData) {
  if (formData.get("acceptTerms") !== "true") {
    throw new Error("Terms acceptance is required");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/");
  }

  const { error } = await supabase.rpc("accept_terms");

  if (error) {
    throw new Error("Unable to record terms acceptance", { cause: error });
  }

  redirect("/dashboard");
}
