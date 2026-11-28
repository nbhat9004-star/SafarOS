# SafarOS Growth — unified channel intake contract

**Branch:** `feature/safaros-growth-unified-ingestion`  
**Status:** Server-to-server intake adapter added; disabled by default.

## Endpoint

`POST /api/growth/ingest`

This endpoint is for trusted backend adapters only. Do not call it from browser code and do not place its secret in a client bundle.

### Required server configuration

- `GROWTH_CHANNEL_INGEST_ENABLED=true` to enable this intake path.
- `GROWTH_INGEST_SECRET` — server-only shared secret of at least 32 characters, sent as `x-growth-ingest-token`.
- `GROWTH_PII_HASH_SECRET` — existing server-only HMAC secret of at least 32 characters.
- Existing public capture flag `GROWTH_PUBLIC_CAPTURE_ENABLED` remains independent.

The endpoint is disabled and fails closed unless all required secrets and flags are configured.

### Required request headers

- `x-growth-ingest-token: <server-side shared secret>`
- `idempotency-key: <stable source event identifier>`

### JSON body

Required: `sourceChannel` (`website`, `whatsapp`, `agency_referral`, or `partner`), `name`, `phone` (international format), `destination` (currently supported Kashmir destination), `travelStart` (YYYY-MM-DD), `budgetMax`, `partySize`, and `consentEvidence`.

`consentEvidence` requires `accepted: true`, a `version`, ISO `capturedAt`, and the exact affirmative consent `text` shown to the traveller. WhatsApp intake additionally requires a consent `messageId` or `sourceEventId`. Optional fields include `email`, `travelEnd`, `tripType`, `originCity`, and `sourceReference`.

### Safety and behaviour

- HMAC fingerprints are used for phone and idempotency values.
- Repeated source events return the original lead reference instead of creating another record.
- A matching phone fingerprint in the previous 30 days is flagged for human duplicate review; it is not silently discarded.
- Each accepted enquiry creates a consent record and an append-only lifecycle event.
- New leads remain `pending`, phone ownership remains `unverified`, and `marketplaceEligible=false`. This endpoint does not verify a phone, approve a lead, publish an offer, sell a lead, or unlock contact details.
- The existing WhatsApp webhook and agency conversation flows are not changed. A future webhook adapter may call this contract only after it has captured the traveller's explicit consent for the disclosed Growth purpose.
- The existing Growth inbox continues to mask contact PII. Its list projection now includes the actual source channel and intake fields used by the capture contract.

## Not done by this increment

No WhatsApp webhook is wired to this endpoint yet; no new leads are fabricated; no capture flag or production secret is enabled; no deployment is performed. Before live use, add automated tests, review consent/privacy wording and retention/withdrawal handling, and implement a channel-specific adapter with webhook signature validation and idempotent event mapping.
