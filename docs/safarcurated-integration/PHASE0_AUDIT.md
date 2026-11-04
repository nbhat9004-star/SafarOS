# SafarOS ↔ SafarCurated — Phase 0 Architecture Audit (read-only)

No code, data or environment changes were made during this audit.

## 1. Repositories & stack
| | SafarOS (`/app`) | SafarCurated (`Safar.travel.9004`, local copy `/app/safar_intake`, verified identical `app/`) |
|---|---|---|
| Stack | Next.js 14 App Router + MongoDB (`lib/db.js`, DB `DB_NAME`→`safaros`) | Next.js 14 + MongoDB (`lib/db.js`) + Firebase (phone/Google) |
| API | Catch-all `app/api/[[...path]]/route.js` (5,774 lines) | Catch-all `app/api/[[...path]]/route.js` (14,690 lines) |
| Hosting | Emergent | Vercel (`VERCEL_DEPLOYMENT_GUIDE.md`) — **separate deploy pipeline** |
| Session | JWT cookie `safaros_session` `{userId, agencyId, role}` (`lib/auth.js`) | JWT cookie `{uid, role}` + Firebase ID-token exchange |

## 2. Auth & identity
- SafarOS: `POST /auth/register-agency` (creates `agencies` + owner in `users`), `/auth/login`, password reset (`lib/password-reset.js`). Platform staff in `platformAdmins` (`kind:'platform'` JWT, `lib/platform-rbac.js`). Customer portal in `portalUsers`.
- SafarCurated: single `users` collection, roles `traveler | host | co_curator | admin | super_admin`; `/auth/register|login|verify-google|verify-phone|verify-email`. Operators = `role:'host'` (must have verified email to create listings).
- **No shared identity exists.** Different JWT payloads and (expected) different `JWT_SECRET`s.

## 3. Tenancy & permissions
- SafarOS: shared DB, `agencyId` from session only (`lib/tenancy.js` `tenantFilter/withAgency`), roles owner/manager/agent/finance (`lib/rbac.js`, `packages:*`, `website:*`, `integrations:*`).
- SafarCurated: no tenancy — ownership by `listings.hostId`; admin moderation.

## 4. Agency profile
- SafarOS `agencies` (name, slug, plan, status, contact/branding via `/agency`), website builder in `websiteSettings/websitePages/websiteThemes`, public site `app/site/[slug]`.
- SafarCurated: host profile lives on `users` (name, avatar) + `/host/me`; no agency entity.

## 5–6. Packages, pricing, availability
- SafarOS `packages`: `{id, agencyId, name, customerType, customerId(required), destination, startDate, endDate, adults, children, nights, description, quotationId, status: draft|active|completed|cancelled, itineraryId}`. **Packages are customer-specific trips; there is no price, images, inclusions/exclusions or cancellation policy on the package.** Price lives on quotations; day-by-day plan in `itineraries` (days + services).
- SafarCurated `listings`: `{id, title, description(≥10), category: stay|transport|experience|tour, location, price>0, images[], hostId, hostName, duration, services, amenities, inventoryTypes[{price, quantity, available}], categoryDetails{}, status: pending|approved|rejected, isDemo}`. Plus `listingPricingRules`, `listingBlackouts`.

## 7. Public marketplace
- SafarCurated `GET /listings` (approved only), detail page `app/property/[id]`, admin approve/reject endpoints. New host listings start `pending` (admin approval).

## 8. Booking & payments
- SafarCurated `POST /bookings`: requires approved listing + verified payment (`payments`, unless `ALLOW_BOOKINGS_WITHOUT_PAYMENT`), pending-TTL expiry, inventory availability; gateways in `paymentGateways` (Razorpay HMAC verify etc.), `hostEarnings/hostPayouts`.
- SafarOS `bookings`, `payments`, `invoices`, `customerReceivables` (agency-internal, Razorpay optional).

## 9. Existing integration infrastructure (reusable)
- SafarOS: `lib/secrets.js` (AES-256-GCM, `PLATFORM_PROVIDER_CATALOG`, masked views) + Super Admin "API & Integrations" UI (`components/safaros/platform-admin.jsx`), `platformAudit()` → `platformAuditLogs`, per-agency `apiKeys`, `webhooks`, `integrations`, `lib/integrations.js` (`sha256`, `genToken`).
- SafarCurated: **no inbound server-to-server API or outbound webhooks** today.

## 10. Environment
- SafarCurated env: `MONGO_URL, DB_NAME, JWT_SECRET, FIREBASE_*, RESEND_API_KEY, PAYMENT_ENCRYPTION_KEY, BOOKING_ENGINE_CRON_KEY, ALLOW_BOOKINGS_WITHOUT_PAYMENT, NEXT_PUBLIC_BASE_URL`.
- SafarOS env: `MONGO_URL, DB_NAME, JWT_SECRET, CREDENTIALS_ENCRYPTION_KEY …`.
- **Preview blocker:** this preview has no `/app/.env`; `GET /api/health` → `MONGO_URL is not configured`; local MongoDB is empty. Production data is not reachable from here.

## Data ownership
| Data | Owner |
|---|---|
| Agency, operator users, roles | SafarOS |
| Package content, price, dates, itinerary, availability | SafarOS (source of truth) |
| Public listing, moderation status, reviews, traveller accounts | SafarCurated |
| Marketplace bookings + payments | SafarCurated creates; SafarOS receives a copy and owns operational status |

## Key gaps
1. SafarOS packages need a "marketplace" form (no client attached) + marketplace fields (price, images, inclusions, exclusions, cancellation policy, seats).
2. SafarCurated needs a new signed inbound API (agency link, listing upsert/unpublish keyed by `source:'safaros'` + `externalId`, unique index).
3. Changes to SafarCurated must be deployed by the owner via GitHub → Vercel (outside Emergent).
