# SafarOS — Phase 3: Foundation Setup (DONE, verified)

Built in the SafarOS workspace (`/app`), Next.js + MongoDB, env-placeholders only. No push performed (requires your approval).

## What was wired
- **KEEP:** shadcn/ui library, Tailwind design system, env-driven Mongo helper (`lib/db.js` → `safaros` DB).
- **ADAPT:** auth (JWT + bcrypt, httpOnly cookie session) made org-aware → `lib/auth.js`.
- **REBUILD:** tenancy (`lib/tenancy.js`), RBAC (`lib/rbac.js`), agency onboarding + tenant-aware API skeleton.

## Tenancy model (as approved)
- Shared DB; every tenant document carries `agencyId`.
- `agencyId` is derived **server-side** from the verified session JWT — **never** trusted from client input (`withAgency()` strips any client-sent `agencyId`; `tenantFilter()` forces the session's `agencyId` on every query).
- Isolation enforced in the data-access layer.

## Roles (RBAC)
`owner` (full) · `manager` (invite members, manage clients) · `agent` (create/read clients) · `finance` (read-only).

## API skeleton (`app/api/[[...path]]/route.js`)
`/health` · `/auth/register-agency` · `/auth/login` · `/auth/logout` · `/auth/me` · `/agency` · `/members` (GET/POST) · `/clients` (GET/POST) · `/clients/:id` (DELETE). Clients = demo tenant-scoped resource.

## Verified (local smoke, no QA agents)
- Agency signup → session → add client/member works.
- Health → DB connected.
- **Isolation proven:** a 2nd agency sees none of the 1st's data; a spoofed `agencyId` in the body was ignored and overwritten with the caller's own.
- Demo data deleted afterward (DB pristine).

## Files
`lib/db.js`, `lib/auth.js`, `lib/rbac.js`, `lib/tenancy.js`, `app/api/[[...path]]/route.js`, `app/page.js`, `app/layout.js`, `.env.example` (placeholders).

## NOT done (awaiting your go / guardrails)
- No push to `nbhat9004-star/SafarOS` (destructive/irreversible → needs approval + credentials).
- No feature build beyond foundation.
- Python test suite excluded (as instructed).
