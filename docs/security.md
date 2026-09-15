# Security Notes

This document describes the current Dragg-TR application-level security expectations. `SECURITY.md` covers vulnerability reporting.

## Authentication

- Supabase Auth is the identity provider.
- Production UI is Google OAuth only.
- `/auth/callback` performs the PKCE code exchange server-side.
- Missing/failed code exchange fails closed to the landing page.
- Unsafe `next` redirect targets are rejected.
- New Google users must accept Terms before dashboard access.
- Local Playwright finance tests use a localhost-only test-auth route gated by `E2E_TEST_AUTH=1`; it is not a production authentication mechanism.
- Never expose Google Client Secrets, Supabase secret/service-role credentials, provider tokens or refresh tokens to browser code.

## Terms acceptance hardening

Terms acceptance is a security-sensitive server-controlled field, not an ordinary profile preference.

- The `authenticated` role cannot directly update `profiles.terms_accepted`.
- Authenticated users retain column-level UPDATE on encrypted profile `email` and `name` only.
- The UI submits an explicit acceptance assertion.
- The server action verifies authentication and calls `public.accept_terms()`.
- `accept_terms()` is `SECURITY DEFINER`, updates only the row matching `auth.uid()`, and is executable by `authenticated` only.
- Persistence errors fail closed; the app does not redirect to the dashboard when the acceptance write fails.

## Data access

- User-owned tables use Supabase Row Level Security.
- `anon` table access is revoked for private finance data.
- Server-side reads/writes are additionally scoped by authenticated user ID.
- Mutations validate runtime payloads; client-side TypeScript types are not trusted.
- Category/payment-method references are ownership checked before transaction writes.
- Finance RPC execution is restricted to authenticated users.

## Sensitive data

- `profiles.email` and `profiles.name` use application-layer encryption.
- Selected transaction description/notes fields use application-layer encryption.
- `FIELD_ENCRYPTION_KEY` is server-only, must be stable, backed up securely and never committed.
- Do not enter bank credentials, card numbers, passwords, identity-document values or other unnecessary secrets into free-text fields.

## Protected payment-method compatibility

Turkey defaults do not create PIX/Boleto. Legacy values remain supported in the schema for existing/imported data. The current application protects only the payment methods that must remain immutable by product rules; new Turkish defaults follow the current CRUD logic.

## Headers and CSP

Security headers are configured in `next.config.mjs`.

- `frame-ancestors 'none'` and `X-Frame-Options: DENY` prevent framing.
- `object-src 'none'` blocks legacy plugin content.
- `base-uri 'self'` blocks malicious base URL injection.
- `form-action` is restricted to expected app/Supabase destinations.
- `connect-src` is restricted to expected app, Supabase and telemetry endpoints.
- `img-src` allows required app/Supabase/Google image sources.
- Development-only requirements must not weaken the production policy unnecessarily.

## Release checks

Before release, the repository runs or expects:

```bash
pnpm run lint
pnpm run test:coverage
pnpm run build
pnpm run security:audit
pnpm run e2e
```

GitHub Actions additionally run CodeQL, Semgrep, Trivy and ZAP workflows. The `Dragg-TR Release Gate` combines security pin verification, frozen dependency install, unit/coverage, build, dependency audit, clean local Supabase migrations and Playwright E2E. Production promotion must not bypass that gate.

## Hosted verification boundary

A green local Release Gate does not by itself prove external Google configuration. Production readiness additionally requires a real hosted Google login/callback, Terms acceptance, session persistence, finance CRUD, Firefox/mobile behavior and second-user RLS isolation test.
