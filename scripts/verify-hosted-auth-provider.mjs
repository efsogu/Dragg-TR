import { createHash } from "node:crypto";

const SUPABASE_AUTH_ORIGIN = "https://pgmfanwotjgwqnjspapt.supabase.co";
const EXPECTED_CALLBACK = "https://dragg-tr.vercel.app/auth/callback";
const EXPECTED_GOOGLE_HOST = "accounts.google.com";
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;

const verifier = "dragg-tr-release-hosted-auth-preflight-2026";
const codeChallenge = createHash("sha256")
  .update(verifier)
  .digest("base64url");

const authorizeUrl = new URL("/auth/v1/authorize", SUPABASE_AUTH_ORIGIN);
authorizeUrl.searchParams.set("provider", "google");
authorizeUrl.searchParams.set("redirect_to", EXPECTED_CALLBACK);
authorizeUrl.searchParams.set("code_challenge", codeChallenge);
authorizeUrl.searchParams.set("code_challenge_method", "s256");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestAuthorizeEndpoint() {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(authorizeUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          "user-agent": "Dragg-TR-release-preflight/1.0",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status < 500 || attempt === MAX_ATTEMPTS) {
        return response;
      }

      lastError = new Error(
        `Supabase Auth returned transient HTTP ${response.status} on attempt ${attempt}.`,
      );
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) throw error;
    }

    await sleep(1_000 * attempt);
  }

  throw lastError ?? new Error("Hosted auth preflight failed without a response.");
}

const response = await requestAuthorizeEndpoint();
const responseBody = await response.text();

if (
  response.status === 400 &&
  /unsupported provider:\s*provider is not enabled/i.test(responseBody)
) {
  throw new Error(
    "Hosted auth invariant failed: Google provider is disabled in the Dragg-TR Supabase project.",
  );
}

if (![301, 302, 303, 307, 308].includes(response.status)) {
  throw new Error(
    `Hosted auth invariant failed: expected Supabase Google authorize to redirect, got HTTP ${response.status}. Body: ${responseBody.slice(0, 300)}`,
  );
}

const location = response.headers.get("location");
if (!location) {
  throw new Error(
    "Hosted auth invariant failed: Supabase Google authorize response has no Location header.",
  );
}

const redirectUrl = new URL(location, SUPABASE_AUTH_ORIGIN);
if (redirectUrl.hostname !== EXPECTED_GOOGLE_HOST) {
  throw new Error(
    `Hosted auth invariant failed: expected redirect host ${EXPECTED_GOOGLE_HOST}, got ${redirectUrl.hostname}.`,
  );
}

console.log("HOSTED_GOOGLE_PROVIDER_ENABLED");
console.log(`HOSTED_GOOGLE_REDIRECT_HOST=${redirectUrl.hostname}`);
console.log(`HOSTED_AUTH_CALLBACK_EXPECTED=${EXPECTED_CALLBACK}`);
