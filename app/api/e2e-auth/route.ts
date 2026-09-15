import { NextResponse } from "next/server";

import { buildSignUpUserMetadata } from "@/lib/auth/email-password";
import { createClient } from "@/lib/supabase/server";

type TestAuthPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
};

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "127.0.0.1" || hostname === "localhost";
}

export async function POST(request: Request) {
  if (process.env.E2E_TEST_AUTH !== "1" || !isLocalRequest(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = (await request.json()) as TestAuthPayload;
  const email = payload.email?.trim() ?? "";
  const firstName = payload.firstName?.trim() ?? "";
  const lastName = payload.lastName?.trim() ?? "";
  const password = payload.password ?? "";

  if (!email || !firstName || password.length < 8) {
    return NextResponse.json({ error: "Invalid test user" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: buildSignUpUserMetadata(firstName, lastName),
    },
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Local test session was not created" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
