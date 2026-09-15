import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

function redirectHome(requestUrl: URL) {
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const flowId = requestUrl.searchParams.get("sb_flow_id");

  if (!code) {
    return redirectHome(requestUrl);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );

  if (error || !data.session) {
    return redirectHome(requestUrl);
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("terms_accepted")
    .eq("id", data.session.user.id)
    .maybeSingle();

  const redirectPath = getSafeRedirectPath(next);
  const finalRedirectPath =
    profileError || !profile?.terms_accepted
      ? "/auth/accept-terms"
      : redirectPath;

  return NextResponse.redirect(new URL(finalRedirectPath, requestUrl.origin));
}
