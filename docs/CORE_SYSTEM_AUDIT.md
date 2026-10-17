# SafarOS Core System Audit — Initial Static Review

**Review date:** 2026-10-17  
**Base branch:** `main`  
**Review scope:** repository structure, package scripts, authentication primitives, role permissions, API routing architecture, security headers, and existing development report.  
**Method:** source inspection through GitHub. No browser agent, autonomous testing agent, QA agent, or verification agent was used. No production environment or database was accessed. No application build was run in this review.

## Executive summary

SafarOS already contains substantial functionality: agency/staff authentication, role-based permissions, tenant-scoped business modules, subscription foundations, integrations, import/export, fleet management, itinerary tools, website builder foundations, and analytics. The immediate need is to verify launch-critical behavior against the actual code and deployed environment before adding more features.

This document records findings to guide the first completion pass. It does **not** certify the app as production-ready.

## Findings

### P1 — Review production security headers and session-cookie flags

- `next.config.js` applies `Access-Control-Allow-Origin: *` by default and allows all origins in `Content-Security-Policy: frame-ancestors *;`. It also sets `X-Frame-Options: ALLOWALL`, which is not a standard restrictive X-Frame-Options value.
- `lib/auth.js` defines separate staff, customer-portal, and platform-admin JWT session types and cookies. The cookie-setting helpers in the API route should be checked for the `Secure` flag in production.
- **Do not change these settings blindly.** SafarOS has iframe-based preview/integration behavior, so first identify which origins genuinely need embedding or cross-origin access. Then restrict the policy to those origins and keep local development working.

**Next action:** inspect the deployed domains and all iframe/API consumers; make a minimal, separately reviewable security change only after the required origins are known.

### P1 — Establish repeatable build and smoke-check commands

- The root `package.json` currently exposes `dev`, `dev:no-reload`, `dev:webpack`, `build`, and `start`; there is no root `test` or `lint` script.
- The root `tests/` directory contains only its package initializer, and `test_reports/` has no committed test report beyond placeholders.
- Existing development notes describe manual curl/lint/compile checks, but those results are historical and cannot prove that the current `main` revision or current Vercel deployment is healthy.

**Next action:** use a small, deterministic, manually invoked smoke-check checklist for public page response, login/logout, unauthenticated API rejection, and tenant/role boundaries. Keep the user's restriction against autonomous browser/QA/testing agents.

### P1 — Verify tenant isolation and authorization on the live route set

- The main API is concentrated in `app/api/[[...path]]/route.js`, which imports auth, RBAC, tenancy, integrations, provider-secret handling, import/export, travel rules, documents, and customization helpers.
- `lib/rbac.js` uses an explicit action-to-role matrix and denies unknown actions. `lib/auth.js` separates staff, portal, and platform session token kinds.
- These are useful safeguards, but a static review cannot establish that every read/write handler consistently uses the session-derived agency ID and the correct permission check.

**Next action:** map each sensitive route to its required permission and tenant filter; focus first on create/update/delete operations and cross-tenant ID lookups. Do not rewrite the catch-all API wholesale.

### P2 — Verify environment and production deployment configuration

- `lib/db.js` resolves the database URI from `MONGO_URL`, `MONGODB_URI`, or `DATABASE_URL`, and defaults `DB_NAME` to `safaros`.
- Authentication requires `JWT_SECRET`. Provider integrations may also require a stable `CREDENTIALS_ENCRYPTION_KEY` and provider-specific credentials.
- A historical report notes that development environment values were restored in a preview. That does not establish that the correct Vercel project has the correct production environment variables.

**Next action:** identify the one intended production Vercel project and verify required variable *names and presence* without exposing secret values. Do not change or delete project settings during this pass.

### P2 — Keep demo data separate from real customer data

- Historical development notes emphasize tenant isolation and avoiding fabricated supplier/business records. The current request now includes demo data, so any demo setup must be explicitly opt-in and clearly labeled.
- Demo credentials must be returned to the project owner after creation, but passwords must not be committed to the repository, printed in logs, or stored in a public report.
- Demo data must never be seeded automatically into production or inserted into a real agency tenant.

**Next action:** after core checks, define an isolated demo setup that creates a clearly labeled demo agency and a least-privilege demo user, uses a generated one-time password or secure reset flow, and reports the login email and setup instructions without writing secrets to Git.

## Completion order

1. Confirm the intended production Vercel project and current deployment status without modifying settings.
2. Inspect and document core auth, tenant isolation, RBAC, and CRUD paths.
3. Fix only reproducible, high-confidence defects in a dedicated branch.
4. Add or document a manual smoke-check sequence that does not use autonomous agents.
5. Add opt-in demo data only after the core flow is verified; return demo login details securely and never commit credentials.
6. Defer new Super Admin, auth, and email features until the existing core is stable, as requested.

## Explicit exclusions for this pass

- No merge to `main`, production deployment, or production environment changes.
- No database writes or demo-user creation.
- No modifications to Safar Curated (`safar_intake`).
- No new paid Emergent tasks or credits.
- No autonomous testing, browser, QA, or verification agents.
- No secrets, access tokens, passwords, or private environment values in this report.
