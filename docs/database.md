# Database Notes

Database changes live in `supabase/migrations` and must be applied in filename order.

## User-owned tables

- `profiles`
- `categories`
- `payment_methods`
- `transactions`
- `monthly_budgets`
- `goals`
- `privacy_requests`

All exposed user-owned tables use Row Level Security (RLS). `anon` table privileges are revoked; authenticated grants are limited to operations used by the application.

## Dragg-TR migration chain

Important Turkey/security migrations in the current chain:

- `009_require_terms_acceptance.sql` adds `profiles.terms_accepted` and the initial acceptance gate.
- `010_stop_writing_plaintext_profile_pii.sql` stops the auth trigger from writing plaintext profile name/email.
- `011_turkey_defaults.sql` replaces new-user defaults with 14 Turkish categories and 4 Turkish payment methods.
- `012_least_privilege_table_grants.sql` removes broad table privileges and restores the CRUD surface required by the app.
- `013_revoke_anon_rpc_execute.sql` removes anonymous access to finance RPCs and grants authenticated execution only.
- `014_terms_acceptance_hardening.sql` removes direct authenticated UPDATE access to `profiles.terms_accepted`, leaves column-level UPDATE on encrypted `email`/`name`, and exposes the one-way authenticated `accept_terms()` RPC.

## Profile fields

- `id`
- `email` — application-layer encrypted
- `name` — application-layer encrypted
- `terms_accepted` — server-controlled acceptance flag
- `created_at`
- `updated_at`
- `deleted_at`

`private.handle_new_user()` does not write plaintext profile name/email. `lib/auth/encrypted-profile.ts` fills encrypted values during authenticated use.

Authenticated browser code may update profile `email` and `name` columns as required by the encryption flow, but may not directly update `terms_accepted`. Terms acceptance must use `public.accept_terms()`.

## Turkey onboarding defaults

`private.handle_new_user()` creates, for every new Auth user:

### Categories

Konut, Market & Gıda, Ulaşım, Sağlık, Eğitim, Faturalar, Borçlar, Eğlence, Abonelikler, Alışveriş, Diğer, Yatırım, Rezerv, Gelir.

### Payment methods

Nakit, Kredi Kartı, Banka Kartı, Banka Transferi.

Legacy `pix` and `boleto` enum/check values remain accepted for compatibility with old/imported data, but are not created for new Turkey users.

## Transaction model

Transactions are user-owned rows. Installment rows share `installment_group_id`; prepayment uses `advanced_to_month`/`advanced_at`. Subscriptions are represented by recurring transaction rows. Category/payment-method ownership is validated before a transaction can reference those records.

Selected free-text transaction/profile fields are encrypted by application code. Do not put secrets, credentials, card numbers or identity-document values into notes/descriptions.

## RPC security

RPCs exposed through the public schema must follow least privilege:

- `calculate_total_saved(date)` → authenticated only
- `add_goal_funds(uuid, uuid, numeric)` → authenticated only
- `accept_terms()` → authenticated only, updates only `auth.uid()`'s profile

`PUBLIC`/`anon` execute privileges must be revoked when a function is not intended for unauthenticated use.

## Applying migrations

Preferred:

```bash
supabase db push
```

CI starts a clean local Supabase stack and therefore verifies that the full migration chain is reproducible from zero.

## Security requirements

- Keep RLS enabled on exposed user-owned tables.
- Keep authenticated row policies scoped to `auth.uid()`.
- Keep `anon` access revoked for private finance data.
- Prefer column-level grants when a table contains server-controlled fields.
- Do not expose service-role/secret credentials in browser code.
- Do not place production data dumps or secrets in migrations.
