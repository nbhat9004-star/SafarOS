# SafarOS ↔ SafarCurated — Round 1 Acceptance Report

**Status: implemented and statically verified. NOT yet runtime-tested end-to-end** (by agreement: code + checks only; this preview has no database settings). Not pushed, not deployed, no production data or env vars touched, no test records created.

## What was built
1. **Secure server-to-server channel.** HMAC-SHA256 signatures over `timestamp.eventId.body`, a 5-minute replay window, and timing-safe comparison. Retries (3 attempts, backoff; network/5xx/429 only) reuse the same `eventId`. SafarCurated de-duplicates by `eventId` (unique index, 7-day TTL) and replays the stored response for duplicates. There is also per-instance rate limiting.
2. **Super Admin control (SafarOS).**
   - A new **SafarCurated** section with status, Connect / Disconnect (with confirmation dialog) / Reconnect, last successful sync, sync errors, linked-agency count, and published packages with their sync status.
   - Credentials are set in the existing **API & Integrations** manager: Base URL plus a Shared Secret, stored AES-GCM encrypted, with a Test button.
   - Disconnect stops publishing, outgoing sync and SSO, and tells SafarCurated to reject new events. Nothing is deleted and credentials are kept.
   - Reconnect re-verifies mappings (local vs remote counts) before resuming.
   - Every action is written to `platformAuditLogs`. Only `super_admin` (`integrations:manage`) can use these controls.
3. **Agency linking.** Each SafarOS `agencyId` has one permanent mapping (`safarosAgencyLinks`, unique index).
   - **New operator:** a password-less SafarCurated host account is created, accessible only via SafarOS SSO. No password hashes are shared.
   - **Existing SafarCurated account with the same email:** the link stays `pending_confirmation` and grants no access. The owner must sign in to SafarCurated with that account and confirm. A traveller account is upgraded to host only on that explicit confirmation.
   - Staff/admin accounts and already-linked accounts are refused.
4. **Marketplace packages (SafarOS).**
   - A separate `kind:'marketplace'` package type with no client, lead or quotation attached. Its fields are price, currency, seats, images, inclusions, exclusions, cancellation policy and a day-by-day itinerary, stored under `package.marketplace`.
   - Client packages are unchanged and excluded from all marketplace flows. `GET /packages` still returns client packages only, and a package's kind can never be changed.
   - Permissions: `marketplace:read` (owner, manager, agent), `marketplace:publish` (owner, manager), `marketplace:link` (owner only).
5. **Publishing and updates.**
   - Publish requires an explicit operator click and server-side validation. Draft or incomplete packages are never auto-published.
   - Publishing upserts by `(source.system='safaros', source.externalId=packageId)` under a unique index, so duplicate listings are impossible. It goes into SafarCurated's **existing moderation queue as `pending`**.
   - Other controls: Unpublish, Republish, Retry sync, Preview, View on SafarCurated.
   - Editing an already-submitted package auto-syncs it. Changes to title, description, location or images on an approved listing send it back to `pending`; price, dates, seats, itinerary and policy update in place.
   - "Refresh statuses" pulls approved/rejected status and rejection feedback back into SafarOS.
   - Deleting a package is blocked while its listing is live.
6. **Agency-only SafarCurated dashboard** (`/dashboard/safaros`, opened via "List on SafarCurated").
   - Access uses a signed, single-use, 2-minute SSO ticket, which becomes an 8-hour httpOnly, SameSite=strict cookie scoped to one agency.
   - Every query is filtered server-side by `source.agencyId` plus the linked `hostId`.
   - Agencies can see their own listings and statuses, rejection feedback, and public links, unpublish their own listings, and return to SafarOS to edit. They cannot see other agencies' data.
   - SafarCurated admins keep their existing global moderation rights.
7. **Website option replaced.** The operator navigation now shows **SafarCurated Marketplace**. The Website Builder code, routes and records were not deleted.

## Files changed
**SafarOS (this workspace; review, then use "Save to GitHub" on a branch):**
- `lib/safarcurated.js` (new): signing, retry client, state gate, mapping and validation.
- `components/safaros/marketplace-workspace.jsx` (new).
- `app/api/[[...path]]/route.js`: marketplace package type, `/marketplace/*` routes, `/platform/safarcurated*` routes, provider test.
- `lib/secrets.js`: `safarcurated` provider entry.
- `lib/rbac.js`: `marketplace:*` permissions.
- `components/safaros/app-experience.jsx`: navigation entry.
- `components/safaros/platform-admin.jsx`: Super Admin section.

**SafarCurated (all new files; nothing existing is modified):** `docs/safarcurated-integration/safarcurated.patch`, also available as plain files in `docs/safarcurated-integration/safarcurated-changes/`.
- `lib/safaros-integration.js`
- `app/api/integrations/safaros/[...path]/route.js`
- `app/dashboard/safaros/page.js`

Apply it on a branch of `Safar.travel.9004` with `git apply safarcurated.patch`.

## APIs
- **SafarOS (agency session):**
  - `GET /api/marketplace/overview`
  - `GET /api/marketplace/packages/:id/preview`
  - `POST /api/marketplace/link | sso | sync | packages/:id/publish | packages/:id/unpublish`
  - `POST/PUT /api/packages` with `kind:'marketplace'`
  - `GET /api/packages?kind=marketplace`
- **SafarOS (platform session):** `GET /api/platform/safarcurated`, `POST /api/platform/safarcurated/connect | disconnect`.
- **SafarCurated (signed):** `POST /api/integrations/safaros/ping | connection | agency/link | listings/upsert | listings/unpublish | listings/status`.
- **SafarCurated (agency cookie):** `POST /sso`, `GET /me`, `POST /me/listings/:id/unpublish | me/confirm-link | me/logout`.

## Database changes (all additive; created lazily at runtime)
- **SafarOS:**
  - New `packages` fields: `kind`, `marketplace`, `marketplacePublication`.
  - New `agencies.safarcurated` field.
  - `platformSettings{key:'safarcurated_integration'}`.
  - New collection `marketplaceSyncLogs`.
  - `platformProviderCredentials{provider:'safarcurated'}`.
- **SafarCurated:**
  - New collections `safarosAgencyLinks`, `safarosIntegrationEvents` (TTL) and `safarosIntegrationState`.
  - New `listings.source` field, a new `unpublished` status value, and a partial unique index `safaros_source_unique`.
  - Host users get `authProvider:'safaros'` and `safarosAgencyId`.
  - Existing listings, users and bookings are untouched.

## Verification actually performed
- ESLint: all new and changed files are clean. The 2 remaining errors are in the existing `WebsiteSeo` code, which I didn't touch.
- Next.js compiles; `/` and `/admin` return 200; the new routes return 401 without a session.
- Offline protocol test with no DB or network:
  - Valid signatures are accepted; tampered, wrong-secret and expired requests are rejected.
  - SSO tickets verify, and forged tickets are rejected.
  - Package-to-listing mapping passes SafarCurated validation and contains no customer data.
  - Incomplete packages are blocked (8 issues reported).
- **Not verified:** a live run against both databases. This includes linking, publish → approve → status sync, unpublish, disconnect/reconnect, and cross-agency isolation at runtime.

## Go-live steps (each needs your approval)
1. Generate a secret (`openssl rand -hex 32`).
2. SafarCurated (Vercel): add env `SAFAROS_INTEGRATION_SECRET`, apply the patch on a branch, review, merge and deploy.
3. SafarOS: Super Admin → API & Integrations → SafarCurated Marketplace: Base URL `https://safarcurated.com` plus the same secret → Test. Then go to the SafarCurated section → Connect.
4. Use the demo agency owner: Marketplace → Link agency → create one real package → Preview → Publish → approve it in the SafarCurated admin → Refresh statuses → Unpublish. Note: linking creates one real SafarCurated host account, and publishing creates one real pending listing. Approve both before you start.

## Remaining work (not built)
- **Booking sync (Phase 6), design only.**
  - SafarCurated would emit a signed `booking.created/updated` event when a `source.system==='safaros'` booking is paid or confirmed. It would include only booking id, listing externalId, dates, guests, amount, payment status and the traveller's name/contact; no card or gateway data.
  - SafarOS would add `POST /api/integrations/safarcurated/events`: verify the signature, de-duplicate by eventId, upsert `bookings` by `(source, externalBookingId)` under the mapped agency, and create or match the client.
  - Operator status changes would be pushed back via signed `bookings/status`.
  - Seats: keep SafarCurated's `inventoryTypes.available` as the single counter to prevent overselling, and add a push from SafarCurated when seats change.
- Push-based status webhook (SafarCurated → SafarOS) to replace the manual "Refresh statuses".
- Showing inclusions, exclusions, itinerary and cancellation policy on the SafarCurated property page (`app/property/[id]/PropertyClient.jsx`). The data is stored in `categoryDetails` but not displayed yet.
- SafarCurated admin UI: an `unpublished` filter, and preventing an admin from approving an operator-unpublished listing.
- A public agency profile page on SafarCurated.
- Full single sign-on into the normal SafarCurated host session. Current SSO grants the scoped agency dashboard only.
- Migration and retirement of the Website Builder, after approval.
- Agency-member audit entries currently go to the agency activity log; only platform actions go to `platformAuditLogs`.
