# Privacy Policy

> **Status: Draft.** This is an implementation-aligned project draft, not legal advice and not a claim of compliance with KVKK, GDPR or any other privacy law. Qualified legal review is required before treating it as a final privacy notice.

**Version 0.2.0-draft — Last updated: 2026-09-15**

This draft describes how the current Dragg-TR implementation handles data.

## 1. Data processed

Dragg-TR may process:

- **Authentication data**: Google account identity information handled through Google OAuth and Supabase Auth, including identifiers, email and profile metadata made available by the provider.
- **Profile data**: selected profile name/email values used by the application. Dragg-TR stores these application profile fields encrypted at the application layer; this is separate from the identity data Supabase Auth maintains in `auth.users`.
- **Financial data you enter**: transactions, descriptions, notes, categories, payment methods, budgets, installments, subscriptions and financial goals.
- **Operational telemetry**: deployment/performance/usage information from the configured hosting and analytics services when enabled.

Dragg-TR does not need bank-login credentials or payment-card numbers to provide its current functionality. Users should not enter such secrets into free-text fields.

## 2. Authentication

The hosted production interface is designed for Google-only sign-in through Supabase Auth. Dragg-TR does not receive or store the user's Google password.

After authentication, Supabase issues the application session. New users must explicitly accept the project's Terms/Privacy draft before dashboard access.

## 3. Storage and isolation

Application data is stored in Supabase Postgres. User-owned tables use Row Level Security (RLS) to isolate rows by authenticated user identity. Additional database grants restrict unauthenticated access and limit authenticated operations.

Selected profile and transaction text fields use application-layer encryption. `FIELD_ENCRYPTION_KEY` is server-only and must be kept stable and confidential by the operator.

## 4. Service providers

Current implementation may rely on:

- **Google** for OAuth identity authentication;
- **Supabase** for authentication, Postgres database and API services;
- **Vercel** for hosting and deployment-related telemetry/analytics when enabled.

Each provider processes data under its own terms and privacy practices.

## 5. Security measures

Current technical measures include:

- Google OAuth through Supabase Auth;
- Row Level Security on user-owned tables;
- least-privilege database grants;
- application-layer encryption for selected sensitive fields;
- server-controlled Terms acceptance;
- Content Security Policy and standard web security headers;
- automated dependency, static-analysis, filesystem and baseline web security checks in CI.

No technical measure can guarantee absolute security.

## 6. User controls and requests

The application allows users to create, update and delete much of their own finance data. The schema also contains a `privacy_requests` table intended to support access, correction, export, deletion, consent and support workflows.

A complete legally reviewed data-subject request process, retention schedule, controller/contact identity, lawful-basis analysis, international-transfer notice and jurisdiction-specific disclosures are **not finalized in this draft** and must be completed before broader production use where required.

## 7. Data minimization

Do not enter unnecessary sensitive information into Dragg-TR. In particular, avoid bank credentials, full card numbers, passwords, government identity/document numbers, health information or other unrelated sensitive personal data in transaction notes/descriptions.

## 8. Open-source deployments

Dragg-TR can be self-hosted. A third party that deploys its own copy controls that deployment's infrastructure and configuration and is responsible for its own privacy/legal obligations. This draft describes the reference Dragg-TR implementation, not every possible fork or deployment.

## 9. Contact

Project-level questions may be raised in the Dragg-TR repository. Do not include sensitive account or financial information in public GitHub issues. A final private privacy-contact channel should be established before broad production use.

Repository: https://github.com/efsogu/Dragg-TR

## Version history

| Version | Date | Change |
|---|---|---|
| 0.2.0-draft | 2026-09-15 | Aligned with Google-only Dragg-TR authentication, Turkey deployment context and current security model; explicitly avoids claiming legal compliance. |
| 0.1.0-draft | 2026-07-18 | Initial upstream draft. |
