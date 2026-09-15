<h1 align="center">
	<img width="180" src="public/dragg-logo-wordmark.svg" alt="Dragg-TR" />
</h1>

<h3 align="center">Dragg-TR</h3>

<p align="center">
	Turkey-focused personal finance app built with Next.js and Supabase.
</p>

<p align="center">
	<a href="https://github.com/efsogu/Dragg-TR/actions/workflows/ci.yml">
		<img src="https://github.com/efsogu/Dragg-TR/actions/workflows/ci.yml/badge.svg" alt="CI" />
	</a>
	<a href="https://github.com/efsogu/Dragg-TR/actions/workflows/codeql-analysis.yml">
		<img src="https://github.com/efsogu/Dragg-TR/actions/workflows/codeql-analysis.yml/badge.svg" alt="CodeQL" />
	</a>
	<a href="https://github.com/efsogu/Dragg-TR/blob/main/LICENSE">
		<img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
	</a>
	<img src="https://img.shields.io/badge/next-16.3.5-black" alt="Next.js 16.3.5" />
	<img src="https://img.shields.io/badge/react-19-149eca" alt="React 19" />
</p>

Dragg-TR is a Turkey-adapted fork of Dragg for tracking income, expenses, budgets, categories, payment methods, subscriptions, goals, reports, installments, and monthly progress.

### 🔥 Features

- Google-only production authentication through Supabase Auth
- Turkish (`tr-TR`) UI support with English fallback
- TRY / ₺ currency support
- Turkey defaults for new users: 14 categories and 4 payment methods
- User-owned finance data isolated with Supabase Row Level Security
- Dashboard with monthly financial summary and budget views
- Transaction create, list, update, delete, installments and subscriptions
- Credit-card closing/due-day and invoice flows
- Goals, reports, categories and payment-method management
- Application-layer encryption for selected sensitive profile and transaction fields
- Hardened Terms acceptance through an authenticated one-way RPC
- Responsive desktop and mobile UI
- Release Gate with dependency audit, tests, clean Supabase migrations and Playwright E2E

### 👉 Getting Started

Requirements:

- Node.js 24.x
- pnpm 11.22.0 through Corepack
- Supabase project
- Google OAuth provider configured in Supabase for hosted sign-in

Clone and run locally:

```bash
git clone https://github.com/efsogu/Dragg-TR.git
cd Dragg-TR
corepack enable
pnpm install
cp .env.example .env.local
```

Set environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
FIELD_ENCRYPTION_KEY=base64_encoded_32_byte_key
```

`FIELD_ENCRYPTION_KEY` is server-only. Keep it stable, backed up securely, and never commit it.

Apply migrations and start:

```bash
supabase db push
pnpm run dev
```

Open `http://localhost:3000`.

If you are not using Supabase CLI, apply SQL files from `supabase/migrations` in filename order through the Supabase SQL Editor.

### 🔐 Authentication

Production UI is Google-only. Configure a Google Web OAuth client and enable Google under Supabase Authentication providers. The Google provider callback is your Supabase project callback (`https://<project-ref>.supabase.co/auth/v1/callback`), while the app callback is `/auth/callback` and must be present in the Supabase redirect allow-list.

After the first Google login, users with no recorded Terms acceptance are routed to `/auth/accept-terms`. Acceptance is persisted through the authenticated `accept_terms()` RPC; the browser role cannot directly update `profiles.terms_accepted`.

Local Playwright finance tests do not depend on an external Google account. They use a localhost-only test-auth endpoint gated by `E2E_TEST_AUTH=1`; it returns 404 outside localhost/127.0.0.1.

### 🇹🇷 Turkey defaults

New users receive these default structures from the database trigger:

- Categories: Konut, Market & Gıda, Ulaşım, Sağlık, Eğitim, Faturalar, Borçlar, Eğlence, Abonelikler, Alışveriş, Diğer, Yatırım, Rezerv, Gelir
- Payment methods: Nakit, Kredi Kartı, Banka Kartı, Banka Transferi

Legacy `pix`/`boleto` database types remain supported for compatibility with existing/imported data, but they are not offered as Turkey defaults.

### 📖 Documentation

- [Architecture](./docs/architecture.md)
- [Authentication](./docs/auth.md)
- [Database](./docs/database.md)
- [Security Notes](./docs/security.md)
- [End-to-End Tests](./docs/e2e.md)
- [Terms of Use](./docs/terms-of-use.md)
- [Privacy Policy](./docs/privacy-policy.md)
- [Security Policy](./SECURITY.md)

### 🧪 Scripts

```bash
pnpm run dev
pnpm run build
pnpm run lint
pnpm run test
pnpm run test:coverage
pnpm run e2e
pnpm run security:audit
```

### 🚀 Deployment

For Vercel:

1. Import `efsogu/Dragg-TR`.
2. Configure the three environment variables shown above.
3. Set the Supabase Site URL to the public production domain.
4. Allow the production `/auth/callback` URL and required preview callback URLs in Supabase Auth URL Configuration.
5. Configure Google OAuth in Google Cloud and Supabase.
6. Apply all committed migrations.
7. Require the `Dragg-TR Release Gate` before production promotion.

The production deploy workflow is designed to run only after the Release Gate succeeds on `main`.

### 🔓 License

Dragg-TR retains the upstream MIT License. See [LICENSE](./LICENSE).
