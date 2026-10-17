# SafarOS Core System Audit — Initial Static Review

**Review date:** 2026-10-17  
**Base branch:** `main`  
**Review scope:** repository structure, package scripts, authentication primitives, role permissions, API routing architecture, security headers, and existing development report.  
**Method:** source inspection through GitHub. No browser agent, autonomous testing agent, QA agent, or verification agent was used. No production environment or database was accessed. No application build was run in this review.

## Executive summary

SafarOS already contains substantial functionality: agency/staff authentication, role-based permissions, tenant-scoped business modules, subscription foundations, integrations, import/export, fleet management, itinerary tools, website builder foundations, and analytics. The immediate need is to verify launch-critical behavior against the actual code and deployed environment before adding more features.

This document records findings to guide the first completion pass. It does **not** certify the app as production-ready.

## Findings

### P1 — Session cookies are missing the Secure attribute

- Static inspection of `app/api/[[...path]]/route.js` found that the staff and platform cookie setters, and the customer portal login/logout cookie setters, specify `httpOnly`, `sameSite`, `path`, and expiry but do not set `secure`.
- On HTTPS deployments, setting `Secure` in production is a standard defense against sending session cookies over unencrypted HTTP. Local development should continue to work over localhost.
- This is a concrete code-level hardening candidate. It has **not** been changed in this audit because the API route is very large and the change should be made as a small, isolated patch with a clear diff, then reviewed on the preview deployment. Do not alter cookie names, lifetimes, or auth flows as part of this fix.

**Next action:** add `secure: process.env.NODE_ENV === 'production'` consistently to all staff, platform, and portal cookie set/clear operations, then review the exact diff and manually check login/logout on the preview.

### P1 — Review production security headers and cross-origin behavior

- `next.config.js` applies `Access-Control-Allow-Origin: *` by default and allows all origins in `Content-Security-Policy: frame-ancestors *;`. It also sets `X-Frame-Options: ALLOWALL`, which is not a standard restrictive X-Frame-Options value.
- These settings may be intentional for embedding or integrations, so they should not be tightened blindly before identifying the actual iframe and cross-origin consumers.
- No production header change has been made.

**Next action:** identify the origins that genuinely need embedding or cross-origin access, then propose a minimal allowlist that keeps the required integrations working.

### P1 — Establish repeatable build and smoke-check commands

- The root `package.json` exposes `dev`, `dev:no-reload`, `dev:webpack`, `build`, and `start`; there is no root `test` or `lint` script.
- The root `tests/` directory contains only its package initializer, and `test_reports/` has no committed test report beyond placeholders.
- Existing development notes describe manual checks, but those historical results cannot prove that the current revision or current Vercel deployment is healthy.

**Next action:** use a small, deterministic, manually invoked checklist for public page response, login/logout, unauthenticated API rejection, and tenant/role boundaries. Keep the user's restriction against autonomous browser/QA/testing agents.

### P1 — Verify tenant isolation and authorization on the live route set

- The main API is concentrated in `app/api/[[...path]]/route.js`, which imports auth, RBAC, tenancy, integrations, provider-secret handling, import/export, travel rules, documents, and customization helpers.
- `lib/rbac.js` uses an explicit action-to-role matrix and denies unknown actions. `lib/auth.js` separates staff, portal, and platform session token kinds.
- Several inspected helpers scope record lookups through `tenantFilter(session, ...)`, and portal reads use both the portal session's agency and client identifiers. This is positive evidence for the inspected paths only; it is not proof that every route is correctly scoped.
- A full route-by-route review and runtime cross-tenant check have not been completed.

**Next action:** map sensitive routes to their required permission and tenant filter; focus first on create/update/delete operations and cross-tenant ID lookups. Do not rewrite the catch-all API wholesale.

### P2 — Verify environment and deployment configuration

- `lib/db.js` resolves the database URI from `MONGO_URL`, `MONGODB_URI`, or `DATABASE_URL`, and defaults `DB_NAME` to `safaros`.
- Authentication requires `JWT_SECRET`. Provider integrations may also require a stable `CREDENTIALS_ENCRYPTION_KEY` and provider-specific credentials.
- The Vercel GitHub status for the audit commit reported the `safaros-agency-os` deployment as Ready and supplied a branch-specific preview URL: https://safaros-agency-os-git-work-core-system-audit-c-4b03c3-safar-os1.vercel.app. This confirms deployment status only, not application workflows or database isolation.
- Production environment values have not been inspected or changed.

**Next action:** verify required variable names and presence without exposing secret values. Do not change or delete project settings during this pass.

### P2 — Keep demo data separate from real customer data

- Demo setup must be explicitly opt-in and clearly labeled. Do not invent real supplier/business records or insert demo records into a real agency tenant.
- Demo credentials must be returned to the project owner after creation, but passwords must not be committed to the repository, printed in logs, or stored in a public report.
- Demo data must never be seeded automatically into production.

**Next action:** after core checks, define an isolated demo setup that creates a clearly labeled demo agency and least-privilege demo user, uses a generated one-time password or secure reset flow, and reports login instructions without writing secrets to Git.

## Completion order

1. Confirm the intended Vercel project and deployment status without modifying settings.
2. Inspect and document core auth, tenant isolation, RBAC, and CRUD paths.
3. Make only reproducible, high-confidence fixes in a dedicated branch.
4. Add or document a manual smoke-check sequence that does not use autonomous agents.
5. Add opt-in demo data only after core flows are reviewed; return demo login details securely and never commit credentials.
6. Defer new Super Admin, auth, and email features until the existing core is stable, as requested.

## Explicit exclusions for this pass

- No merge to `main`, production deployment, or production environment changes.
- No database writes or demo-user creation.
- No modifications to Safar Curated (`safar_intake`).
- No new paid Emergent tasks or credits.
- No autonomous testing, browser, QA, or verification agents.
- No secrets, access tokens, passwords, or private environment values in this report.
