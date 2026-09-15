# Authentication

Dragg-TR uses Supabase Auth. The **production user-facing authentication flow is Google OAuth only**.

## Production provider

Enable Google in Supabase Dashboard → Authentication → Providers → Google. Create a Google Web OAuth client and register the Supabase Auth callback:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

For the current hosted Dragg-TR staging project this callback is:

```text
https://pgmfanwotjgwqnjspapt.supabase.co/auth/v1/callback
```

The application's OAuth request sets `redirectTo` to the active origin plus `/auth/callback`. Every hosted callback URL used by the app must be present in Supabase Authentication → URL Configuration.

Do not expose the Google Client Secret, Supabase secret/service-role keys, provider access tokens, or refresh tokens in client code or repository files.

## Callback behavior

`/auth/callback` implements the PKCE code exchange. It fails closed:

- missing authorization code → `/`
- failed code exchange → `/`
- successful session + unaccepted Terms → `/auth/accept-terms`
- successful session + accepted Terms → safe requested path, defaulting to `/dashboard`

External, protocol-relative, backslash, CR, and LF redirect targets are rejected by `lib/auth/redirect.ts`.

## Onboarding defaults

Every new Supabase Auth user runs the database trigger `on_auth_user_created`. `private.handle_new_user()` creates:

- one profile row
- 14 Turkish default categories
- 4 Turkish default payment methods

Frontend code must not duplicate this seed logic.

`profiles.email` and `profiles.name` are not written in plaintext by the auth trigger. Application-layer encryption owns those profile fields. `auth.users.email` remains managed by Supabase Auth.

## Terms of Use acceptance

Google OAuth does not pre-accept the application's Terms. New Google users therefore start with `profiles.terms_accepted = false` and are routed to `/auth/accept-terms` before dashboard access.

Acceptance is intentionally a one-way server-controlled transition:

1. the form must submit `acceptTerms=true`;
2. the server action verifies the authenticated user;
3. it calls the authenticated `public.accept_terms()` RPC;
4. the RPC updates only the current user's acceptance flag;
5. the `authenticated` browser role has no direct `UPDATE` privilege on `profiles.terms_accepted`.

The browser role retains column-level update access to encrypted profile `email` and `name` fields only.

## Local E2E authentication

The full finance Playwright suite must be deterministic and must not require an external Google account. `app/api/e2e-auth/route.ts` provides a test-only local session bootstrap that is available only when both conditions are true:

- `E2E_TEST_AUTH=1`
- request hostname is `localhost` or `127.0.0.1`

Outside those conditions the endpoint returns 404. This route exists only to exercise the authenticated finance UI against a disposable local Supabase stack; it is not a production authentication method.

## Production checklist

Before a release is considered production-ready:

- Google provider is enabled in Supabase with the correct Client ID/Secret.
- Google Web OAuth origin matches the public app domain.
- Google redirect URI is the Supabase Auth callback.
- Supabase Site URL is the public app domain.
- `/auth/callback` URLs for production and intended previews are allow-listed.
- Real hosted Google login → callback → Terms acceptance → dashboard is tested.
- Logout/login persistence, mobile/Firefox behavior, finance CRUD and second-user RLS isolation are tested.
