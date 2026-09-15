import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const redirectPath = getSafeRedirectPath(next);
  let finalRedirectPath = redirectPath;

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("terms_accepted")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profileError || !profile?.terms_accepted) {
        finalRedirectPath = "/auth/accept-terms";
      }
    }
  }

  return NextResponse.redirect(new URL(finalRedirectPath, requestUrl.origin));
}
