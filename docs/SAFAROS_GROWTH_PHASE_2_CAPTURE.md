# SafarOS Growth — Phase 2 capture increment

**Branch:** `feature/safaros-growth-kashmir-exclusive-leads`  
**Status:** Implemented as a preview-only, fail-closed increment. Not approved for live capture.

## Included

- Public Kashmir enquiry page at `/plan-trip`, linked from the SafarOS homepage navigation.
- Public submission endpoint: `POST /api/growth/enquiries`.
- Required traveller consent checkbox; versioned consent evidence is recorded in `growthConsentRecords` and referenced from the lead.
- Lead and lifecycle event are recorded in the platform-owned `growthLeads` and `growthLeadEvents` collections.
- Server-side validation for name, phone format, email format, supported Kashmir destination, dates, budget, group size and trip type.
- HMAC-based phone and IP fingerprints; raw IP is not stored.
- Five submissions per IP fingerprint per 15-minute bucket, with TTL cleanup for rate-limit records.
- Thirty-day phone-fingerprint duplicate detection. Possible duplicates are retained but flagged for review.
- Existing Growth scoring module calculates score, quality and indicative price on the server. Client-supplied scores/prices are ignored.
- Newly captured enquiries remain `pending`, phone ownership remains `unverified`, and `marketplaceEligible` is forced false. No agency distribution or PII unlock is implemented in this increment.

## Required environment configuration

- `GROWTH_PUBLIC_CAPTURE_ENABLED=true` is required to accept submissions. If unset or false, the endpoint returns HTTP 503 and stores no enquiry.
- `GROWTH_PII_HASH_SECRET` must be a server-only secret of at least 32 characters. It is required for keyed phone/IP fingerprints. Do not expose it to the browser or commit it to the repository.

Do not enable the capture flag until the consent notice, privacy notice, retention/withdrawal process, abuse monitoring and operational owner have been reviewed and approved. The current consent copy is an implementation draft, not legal advice or a completed compliance review.

## Not included / next gates

- Phone ownership verification or OTP provider integration.
- Consent withdrawal workflow and data-subject request handling.
- Admin review actions for duplicate/suspicious flags and verification state.
- CAPTCHA or a managed bot-challenge provider.
- Agency marketplace, wallet, payments, purchase/unlock, CRM handoff.
- Automated tests and full browser QA. These must be completed before any live enablement.

## Safety boundary

This change is isolated to the Growth feature branch. It does not merge to `main`, enable public capture, alter production environment variables, create test leads, or deploy a production release.
