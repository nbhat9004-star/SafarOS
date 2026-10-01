# SafarOS — Phase 2: KEEP / ADAPT / REBUILD / EXCLUDE Assessment

Source is a **consumer** travel marketplace (Safar Curated): Next.js 14 (App Router) + MongoDB, a **14,690-line monolithic** catch-all API (`app/api/[[...path]]/route.js`), Firebase + JWT auth, Resend email, WhatsApp, 7 payment gateways, plus a full **Flutter mobile app** (`safar_app/`) and a large social/community layer. **No multi-tenancy exists** — `middleware.js` only implements consumer "Launch Mode" gating.

Endpoint surface (by prefix count): `/admin` 74 · `/circle` 23 · `/marketplace` 20 · `/cms` 19 · `/host` 11 · `/auth` 10 · `/safar-together` 8 · `/provider` 6 · `/me` 6 · `/payments` 4 · `/explore` 4 · `/listings` 3 · `/bookings` 3 · `/wishlist` 3 · `/notifications` 3 · plus reviews, founding-partners, launch-mode, kb, feedback, contact, ai-wizard.

---
## KEEP — reusable infra (port largely as-is)
| Module | Path | Notes |
|---|---|---|
| shadcn/ui component library | `components/ui/` | Radix-based, design-system backbone. Direct reuse. |
| Tailwind + design tokens | `tailwind.config.js`, `postcss.config.js`, globals | Design system. Keep; rebrand later. |
| MongoDB connection helper | `lib/db.js` | Env-driven, serverless-tuned pooling. Keep (repoint to `safaros`). |
| Email client pattern | `lib/email.js` (Resend) | Transactional email scaffolding. Keep, new key. |
| WhatsApp client pattern | `lib/whatsapp.js` | Keep as optional notification channel. |
| CMS scaffolding | `lib/cms-api.js` + `/cms` endpoints | Content/knowledge-base infra — useful for agency portals. Keep structure. |
| Utilities / animations / metadata | `lib/utils.js`, `animations.js`, `metadata.js`, `hooks/` | Generic helpers. Keep. |
| AI client patterns | `lib/ai-agents.js`, `@google/generative-ai`, `openai`, `EMERGENT_LLM_KEY` | Keep client wiring; repurpose prompts for B2B (quotes/itineraries). |

## ADAPT — foundations needing B2B / multi-tenant rework
| Module | Path | Required rework |
|---|---|---|
| Auth (JWT + bcrypt + Firebase) | `lib/auth.js`, `auth-context.js`, `firebase*.js`, `/auth/*` | Add **org/workspace scoping**, agency-member identity, invite flow; strip consumer social login scope creep. |
| Listings foundation | `/listings`, `lib/listings-api.js` | Re-cast as agency **inventory/product catalog** scoped to org. |
| Bookings/quotation foundation | `/bookings`, booking-engine config, `migrations/` | Becomes B2B **quotation -> booking** pipeline, org-scoped; TTL/pending logic reusable. |
| Payments abstraction | `/payments`, gateway handlers (razorpay/stripe/paypal/phonepe/cashfree/ccavenue/manual) | Keep gateway-adapter pattern; re-scope to agency billing / client invoicing. |
| CRM foundations | `/provider`, `/host`, `/me/conversations`, support | Thin today; adapt into agency CRM (leads, clients, conversations) with org scoping. |
| Admin surface | `app/admin/*`, `/admin` (74 endpoints) | Split consumer super-admin vs agency-admin; most consumer ops excluded, RBAC shell reused. |

## REBUILD — B2B-critical, not cleanly provided by source
| Capability | Why rebuild |
|---|---|
| **Tenancy model** | None exists. Need org/workspace entity + org-scoped data access on every collection/query. |
| **Roles & permissions (RBAC)** | Consumer roles (traveler/host/provider/admin) don't map to agency roles (owner/manager/agent/finance). Build fresh RBAC. |
| **Agency onboarding** | No org signup, workspace provisioning, member invites, or plan/seat model. Build fresh. |
| **Tenant-aware middleware** | Replace "Launch Mode" rewrite with tenant resolution (subdomain/path/header) + auth guard. |

## EXCLUDE — consumer-only scope (do not port)
| Module | Path |
|---|---|
| Flutter mobile app | `safar_app/` (entire android/ios/macos/linux/windows/web Dart project) |
| Social / community | `app/explore/*`, `components/explore*`, `/circle`, `/safar-together`, `/explore`, leaderboard, rewards, creators, feed, chat |
| Consumer marketplace & discovery | `app/marketplace`, `/marketplace`, `app/near-me`, `app/wishlist`, `/wishlist`, `app/ai-planner`, `app/build-trip`, `app/trip`, `app/property` |
| Consumer CMS pages | `app/guides`, `app/help`, `app/home-2`, `app/launch`, `/launch-mode`, founding-partners, reviews/ratings consumer flows |
| Consumer landing/middleware | `middleware.js` Launch Mode |
| Python test suite + audit docs | `*_test.py` (20+ files), `*.md` audit/diagnostic reports, `seed_templates.py` | (see Open Question 3) |

---
## Proposed SafarOS foundation (skeleton for Phase 3)
```
safaros/
  app/
    (marketing)/            # minimal public landing
    (auth)/                 # org signup, login, invite-accept
    (app)/[workspace]/      # tenant-scoped shell: dashboard, crm, quotes, bookings, inventory, billing, settings
    api/[[...path]]/route.js # slimmed, tenant-aware backend (ported KEEP + ADAPT handlers only)
  components/ui/            # KEEP (shadcn)
  components/safaros/       # new B2B components
  lib/
    db.js                   # KEEP -> safaros DB
    tenancy.js              # REBUILD: org resolution + scoping helpers
    rbac.js                 # REBUILD: roles/permissions
    auth.js / auth-context  # ADAPT: org-aware
    email.js / whatsapp.js  # KEEP
    payments/               # ADAPT: gateway adapters
  middleware.js             # REBUILD: tenant resolver + auth guard
  .env.example              # placeholders only (safaros creds)
```
**Tenancy approach (recommended):** single shared `safaros` DB with a mandatory `orgId` on every tenant document + a central query-scoping helper (`lib/tenancy.js`) enforcing `orgId` filters. Lower ops cost than DB-per-tenant; fits Vercel + Atlas free/shared tiers. (Pending your decision — see Open Questions.)

## Open risks
- **Monolith extraction risk:** 14.7k-line API route mixes consumer + reusable logic; porting must be surgical to avoid pulling in excluded scope.
- **Auth entanglement:** Firebase consumer auth is woven through; org-scoping requires careful refactor, not a lift-and-shift.
- **Scope creep from `/admin` (74 endpoints):** need explicit cut line between consumer super-admin and agency-admin.
- **No existing tenancy** means every ported query needs an `orgId` guard — easy to miss; enforce via a single helper + lint/review.
