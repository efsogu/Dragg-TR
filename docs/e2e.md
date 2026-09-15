# End-to-End Tests

Dragg-TR uses Playwright for end-to-end coverage of authentication boundaries, transactions, budgets, payments/subscriptions, credit cards/invoices, goals, dashboard navigation, theming and internationalization.

Tests rely on accessible roles, labels and visible text rather than `data-testid` selectors.

## Local finance suite

The authenticated finance suite runs against a real disposable local Supabase stack. It does **not** use external Google OAuth, because CI must be deterministic and independent of a personal Google account.

Prerequisites:

- Supabase CLI
- Docker
- Node.js 24
- pnpm 11.22.0

Typical run:

```bash
supabase start
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key from `supabase status`>
export FIELD_ENCRYPTION_KEY=$(openssl rand -base64 32)
pnpm exec playwright install --with-deps chromium
pnpm run e2e
supabase stop
```

`e2e/setup/auth.setup.ts` calls the localhost-only `/api/e2e-auth` route to create a disposable Supabase Auth user and persist browser storage state in `e2e/.auth/user.json`. The endpoint works only when `E2E_TEST_AUTH=1` and the request hostname is `localhost` or `127.0.0.1`; otherwise it returns 404.

This test route is not a production login path. Production UI is Google-only.

## Unauthenticated tests

`landing.spec.ts` and Google-only auth surface checks run without stored authentication. They verify that production UI does not expose email/password signup, sign-in or password-reset controls.

## Hosted OAuth smoke

Hosted Google OAuth is a separate release validation because it depends on external Google Cloud and Supabase provider configuration. A production-ready hosted smoke must verify:

- Google button starts the provider flow
- Google → Supabase callback succeeds
- a new user is routed to Terms acceptance
- Terms acceptance persists and cannot be bypassed by a direct profile update
- dashboard session persists across refresh/logout/login
- TRY transaction CRUD works
- Firefox and mobile flows work
- a second user cannot read or mutate the first user's data

Do not mark hosted OAuth PASS when the Google provider is disabled or when only local test-auth has passed.

## CI

The `Dragg-TR Release Gate` starts a clean local Supabase environment, applies every committed migration in order, exports local public environment values, runs the Playwright suite and blocks release if any job fails.

Separate workflows run dependency audit, CodeQL, Semgrep, Trivy and ZAP checks. The release gate should be required before production promotion from `main`.
