import { redirect } from "next/navigation";

import { LandingContent } from "@/components/landing/landing-content";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("terms_accepted")
      .eq("id", userId)
      .maybeSingle();

    redirect(profile?.terms_accepted ? "/dashboard" : "/auth/accept-terms");
  }

  return <LandingContent />;
}
