# SafarOS Growth — Kashmir Pilot Implementation Plan

**Status:** Planning baseline committed on an isolated feature branch  
**Branch:** `feature/safaros-growth-kashmir-exclusive-leads`  
**Base:** `main`  
**Pilot:** Kashmir, India  
**Distribution:** Exclusive leads only (one successful purchase per lead)

## 1. Product objective

SafarOS Growth is a Lafqa-operated lead-generation and lead-commerce capability. Lafqa acquires and validates traveller enquiries, controls pricing and eligibility, and sells exclusive access to approved travel operators through their SafarOS agency workspaces.

The platform must not manufacture, scrape, or resell contact records without a valid basis. Only enquiries collected directly or supplied by a partner with documented rights and traveller consent may enter the marketplace. Every lead must retain provenance and consent evidence.

## 2. Findings from the current Super Admin architecture

The current `main` branch already has a distinct Platform Super Admin experience:

- Route: `/admin` → `app/admin/page.js` → `components/safaros/platform-admin.jsx`.
- Platform UI calls `/api/platform/*` through its own API helper.
- The catch-all API route intercepts `/platform/*` before ordinary agency routes and resolves a separate platform session using `getPlatformSession`.
- Platform identities are stored separately in `platformAdmins`; platform sessions use a separate cookie.
- Platform authorization is separate from agency authorization: `lib/platform-rbac.js` defines `canPlatform` and platform permissions.
- Platform API routing is centralised in `app/api/[[...path]]/route.js`, with platform GET/POST handlers and path-to-permission mapping.
- Platform audit events are recorded through `platformAudit` in `platformAuditLogs`.
- The existing Super Admin sidebar is a static `NAV` list in `components/safaros/platform-admin.jsx`; its sections are selected by local state.

The agency workspace is a separate surface in `components/safaros/app-experience.jsx`; agency APIs derive the tenant from the authenticated agency session and use tenant scoping helpers. Growth must preserve this separation.

**Architecture implication:** Do not put Lafqa-owned lead inventory in the agency `leads` collection. Create a separate platform-owned Growth domain, then expose only purchased/authorised lead details to an agency through tenant-scoped purchase records.

## 3. Scope and rollout

### Pilot scope — Kashmir

- Destination focus: Kashmir (including destination and experience taxonomy such as Srinagar, Gulmarg, Pahalgam and Sonamarg).
- Currency: INR.
- Lead distribution: exclusive only.
- Operator eligibility: active agencies that opt into Growth, meet the pilot's verification requirements and match the lead's destination/service.
- Lead statuses: received → verification_pending → verified → available → sold → contacted / quoted / won / lost; invalid, withdrawn, expired and refunded states are also supported.
- No international expansion or shared-lead mode in the pilot.

### Expansion-ready design

Store destination, market, country, currency, source and campaign as structured fields rather than hard-coding Kashmir into the data model. Kashmir is the initial enabled market; India-wide markets can be activated through configuration and reviewed destination coverage.

## 4. Super Admin experience

Add a **Growth** item to the existing Super Admin navigation, with these views:

1. **Overview** — lead volume, verified/available/sold counts, gross sales, refunds, conversion and acquisition-source performance.
2. **Lead Inbox** — search/filter by status, destination, travel date, budget, source, quality and consent state; inspect provenance and masked contact data.
3. **Verification & Quality** — OTP/provider verification state, duplicate candidates, validation outcomes, quality flags and invalidation reasons.
4. **Distribution** — eligible agency matches, destination/service fit, agency eligibility and exclusive availability state. Admin can pause/release a lead with an audit reason; cannot silently re-sell a sold lead.
5. **Pricing & Packages** — configurable INR lead prices and credit bundles; initial prices are admin-configured and explicitly treated as pilot pricing, not assumed market rates.
6. **Agencies** — Growth opt-in, verification/eligibility, destination coverage, purchase history, wallet state and risk controls.
7. **Campaigns & Sources** — SEO page/campaign attribution, referral partners and source quality.
8. **Disputes & Refunds** — review invalid/duplicate/unreachable claims, evidence, decision and credit refund.
9. **Audit & Consent** — consent text version, capture timestamp, source, purpose, disclosure, withdrawal and access history.

Super Admin actions must use platform sessions, platform RBAC permissions and platform audit logs. Add least-privilege permissions for Growth read, lead management, pricing, distribution, agency eligibility, disputes and analytics. Unknown permissions must remain denied by default.

## 5. Agency workspace experience

Add a premium **Growth** area to the existing agency workspace:

- Marketplace list with masked lead previews.
- Filters for destination, dates, party size, budget and trip type.
- Clear exclusive-lead label and final credit price before purchase.
- Wallet balance, credit bundles, ledger and purchase history.
- Purchase/unlock action with server-side balance and exclusivity checks.
- Purchased lead details visible only to the purchasing agency and its authorised roles.
- Purchased leads synchronised into the agency CRM with source and Growth purchase reference.
- Lead outcome tracking: contacted, quote sent, won, lost, with conversion reporting.
- Clear disclosures about the traveller's request and permitted contact purpose.

The agency client must never receive unmasked phone/email fields before a successful purchase. The server must enforce this even if a client manipulates requests.

## 6. Data model (proposed MongoDB collections)

- `growthLeads`: canonical platform-owned enquiry, destination, travel requirements, source, lifecycle state, quality state, contact PII and timestamps.
- `growthConsentRecords`: immutable consent evidence, notice version, purpose, recipients/disclosure, channel, source, timestamp and withdrawal state.
- `growthLeadEvents`: append-only verification, status, access and lifecycle events.
- `growthAgencyProfiles`: agency opt-in, verification, covered destinations/services and eligibility controls.
- `growthLeadPrices`: market/destination/quality price configuration and effective dates.
- `growthWallets`: agency credit balance and currency.
- `growthWalletTransactions`: append-only credit purchase, debit, refund and adjustment ledger with idempotency references.
- `growthPurchases`: agency-to-lead exclusive claim, price, credits debited, state and timestamps.
- `growthDisputes`: agency claims, evidence, resolution and refund reference.
- `growthCampaigns` / `growthAttribution`: campaign/source attribution and performance.

Add indexes for lead status/market/destination/travel date, deduplication fingerprints, consent lookup, agency eligibility, purchase uniqueness, wallet ledger idempotency and campaign attribution. Avoid indexing raw phone/email in a way that exposes PII through logs or analytics.

## 7. API and security design

Keep platform-owned operations under `/api/platform/growth/*` (the existing API route's `/platform/*` interception), guarded by platform session + dedicated platform permissions.

Keep agency operations under a separate authenticated agency namespace such as `/api/growth/*`, deriving `agencyId` only from the server-side agency session and applying tenant scoping to every purchase, wallet and CRM reference.

Public traveller capture is a deliberately narrow public endpoint with validation, rate limiting, bot controls, consent capture and no public lead-list/read capability.

Critical invariants:

- Exclusive purchase must be atomic. Enforce one successful purchase per lead with a unique constraint/conditional state transition, not a frontend check.
- Wallet debits and purchase creation must be transactional or use a carefully designed idempotent reservation/ledger workflow; never allow negative balances or double charges.
- Payment webhooks must verify provider signatures and be idempotent before crediting wallets.
- Do not reveal contact PII in list endpoints, logs, analytics, error messages or unpurchased API responses.
- Validate every platform action against platform RBAC and every agency action against agency RBAC.
- Maintain platform audit events for sensitive admin actions and an agency-visible purchase ledger.
- Add rate limits, abuse controls, retention/deletion workflows and data access logging.
- Do not enable real lead capture or payments until privacy notice, consent language, vendor contracts and applicable Indian privacy/telecom/WhatsApp rules have been reviewed.

## 8. Delivery phases

### Phase 0 — architecture and safety baseline
- This plan and branch are the baseline.
- Map existing platform GET/POST dispatch, permissions, agency navigation and role matrix.
- Confirm MongoDB transaction support and deployment environment before selecting wallet atomicity strategy.
- Add automated tests for authorization and tenant isolation before real data is introduced.

### Phase 1 — platform lead operations (first build increment)
- Add Growth navigation and overview/inbox screens.
- Add platform-only lead CRUD, filters, status workflow and audit events.
- Add Kashmir market configuration, destination taxonomy and lead pricing controls.
- Use clearly marked synthetic fixtures only in local/preview tests; never represent them as genuine traveller enquiries.

### Phase 2 — compliant lead capture and verification
- Build the public enquiry endpoint and Kashmir landing-page form contract.
- Capture notice/consent evidence and source attribution.
- Add optional, risk-based OTP (never mandatory for every traveller), rate limiting, duplicate detection and explainable premium quality scoring.
- Apply the premium-only marketplace gate: score 80+, documented engagement, valid unwithdrawn consent, valid phone format, and no unresolved duplicate/suspicious flag.
- Use the premium qualification and configurable pilot pricing policy in `docs/SAFAROS_GROWTH_PREMIUM_QUALIFICATION_PRICING.md`.
- Keep the marketplace unavailable until real consented lead supply exists.

### Phase 3 — agency marketplace and exclusive purchasing
- List premium leads only; display evidence-based score band, transparent contact-verification state and configurable exclusive price.
- Do not expose direct contact identifiers until an atomic exclusive purchase succeeds.
- Add agency Growth workspace and opt-in/eligibility.
- Add masked preview, atomic exclusive purchase and PII unlock.
- Add wallet ledger and purchase history.
- Add CRM handoff only after successful purchase.

### Phase 4 — payments, disputes and analytics
- Integrate Razorpay credit bundles with verified, idempotent webhooks.
- Add refunds, disputes, source ROI and agency conversion analytics.
- Add operational monitoring and reconciliation.

### Phase 5 — Kashmir pilot and India expansion
- Pilot with a small, vetted group of Kashmir operators.
- Measure verified-lead rate, contactability, quote rate, conversion, refund rate, acquisition cost and contribution margin.
- Expand destination coverage only after supply quality and unit economics meet agreed thresholds.

## 9. Acceptance criteria

- A platform admin can manage Growth only with the correct platform permission.
- Agency users cannot access platform lead inventory or another agency's purchases.
- An unpurchased lead returns masked contact data only.
- Exactly one agency can successfully purchase an exclusive lead.
- Failed/duplicate payment webhooks cannot create duplicate wallet credits.
- Wallet balance and ledger reconcile for purchase/refund flows.
- CRM record is created only for the purchasing agency after confirmed purchase.
- Consent evidence is retrievable and withdrawal blocks further distribution/contact as applicable.
- Every sensitive admin action and purchase state transition is auditable.
- No production data, credentials, environment variables or production deployments are changed as part of feature development.

## 10. Out of scope for the first increment

- Shared leads or bidding.
- Scraping directories/social media or importing third-party contact lists without verifiable rights and consent.
- Automatically publishing thousands of SEO pages before unique useful content and lead-capture quality are established.
- AI scoring as the authority for consent, eligibility or purchase decisions.
- Production payment activation before legal, operational and reconciliation checks.

## 11. Current implementation status

- [x] Inspected current Super Admin route, component, API boundary and platform RBAC.
- [x] Created isolated feature branch from `main`.
- [x] Added this implementation plan.
- [ ] No application code or database schema has been changed yet.
- [ ] No real lead data, payment integration, production configuration or deployment has been touched.
