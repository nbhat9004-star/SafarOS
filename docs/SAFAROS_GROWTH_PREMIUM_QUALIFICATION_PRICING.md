# SafarOS Growth — All-Quality Lead Classification & Pricing

**Pilot market:** Kashmir, India  
**Distribution:** Exclusive only (one agency per lead)  
**Commercial position:** All genuine consented enquiries are retained and classified into high, medium and low quality  
**OTP policy:** No mandatory OTP for every traveller

## 1. Product promise

SafarOS Growth aims to build a broad inventory of genuine traveller enquiries, not only premium enquiries. Every legitimate enquiry is scored and assigned a quality category. High, medium and low quality leads can all be considered for the marketplace at different prices, provided they pass the same essential consent, contact-format, fraud and duplicate safeguards.

A score measures available evidence of enquiry completeness and intent. It is not proof that the traveller will book, answer a call, own the submitted phone number, or have a particular ability to pay.

## 2. Qualification score (0–100)

| Signal group | Maximum | Scoring guidance |
|---|---:|---|
| Profile completeness | 10 | Name (3), syntactically valid phone format (4), valid email format (3) |
| Trip specificity | 15 | Destination (5), travel start date (5), trip type (5) |
| Budget and group | 15 | Stated budget (8), party size (7) |
| Travel timing | 15 | Travel within 90 days (15); 91–180 days (12); 181–365 days (8); beyond 365 days (3); missing/invalid/past date (0) |
| Engagement | 20 | Confirms requirements (10), responds to a follow-up (5), requests a quote/callback (5) |
| Purchase intent | 15 | Requests a quotation (8), states booking timeline (4), selects an itinerary/package (3) |
| Integrity | 10 | Starts at 10; duplicate or suspicious/bot signals reduce score and trigger a hard review block |
| **Total** | **100** | |

Engagement and intent signals must be recorded with timestamp, channel and source. Do not infer them from demographic characteristics, device price, location stereotypes or an AI-generated guess. AI may recommend review but must not invent evidence.

## 3. Three lead categories

- **High quality (80–100):** Stronger trip detail and demonstrated intent. Highest price tier.
- **Medium quality (60–79):** Genuine enquiry with moderate detail or engagement. Mid-price tier.
- **Low quality (0–59):** Early-stage or incomplete enquiry. Lowest price tier and may need agency follow-up/nurturing.

**Important:** Low score does not mean fake. Quality category and marketplace eligibility are separate. A low-quality lead can still be listed if it has valid unwithdrawn consent, a syntactically valid phone number, and no unresolved duplicate, fraud, expiry or other block. Leads that fail a hard safeguard remain in an admin review/suppression queue and are not sold.

## 4. Marketplace eligibility gates

1. Recorded, affirmative and unwithdrawn consent for sharing the enquiry/contact details with a travel operator for the stated purpose.
2. Syntactically valid contact number; this is only a format check, not proof of ownership or reachability.
3. No unresolved duplicate or suspicious/bot flag.
4. Lead has not expired, been withdrawn, sold or otherwise blocked.
5. Destination/market and agency service fit are checked before the exclusive offer is shown.

No minimum quality score is required to retain a lead or classify it. The score sets category and indicative price, not whether the lead exists.

A missing OTP must not lower the score or disqualify a lead. Do not label a phone as verified unless ownership was actually verified. Store separate states such as `format_valid`, `ownership_unverified`, `ownership_verified`, and `unreachable_confirmed`.

## 5. Indicative Kashmir pilot price bands (INR)

These are test prices, not validated market rates. Keep them configurable in Super Admin and review them against agency conversion, contactability, refund rate and acquisition cost.

| Quality category | Score | Suggested exclusive price |
|---|---:|---:|
| High | 95–100 | ₹499 |
| High | 90–94 | ₹399 |
| High | 85–89 | ₹299 |
| High | 80–84 | ₹199 |
| Medium | 75–79 | ₹149 |
| Medium | 68–74 | ₹119 |
| Medium | 60–67 | ₹99 |
| Low | 45–59 | ₹79 |
| Low | 25–44 | ₹59 |
| Low | 0–24 | ₹39 |

Only leads passing the hard eligibility gates receive an offer price. Super Admin may override a price with a reason and audit event. Do not vary price using protected or sensitive personal traits.

## 6. Agency-facing preview and purchase

Before purchase, an eligible agency sees:
- Destination and travel window
- Party size and stated budget band (when supplied)
- Trip type and requested service
- Quality category and score band, with evidence-based reasons
- Contact status disclosed honestly (e.g. format valid; ownership not verified)
- Exclusive price, expiry and refund/dispute terms

The agency does not see name, phone, email or other direct identifiers until its exclusive purchase succeeds. The purchase must be atomic so only one agency can unlock a lead. After purchase, the agency may contact the traveller only for the disclosed enquiry purpose and through permitted channels.

## 7. Low-friction verification (OTP optional)

- Initial enquiry form does not require OTP.
- Use server-side format validation, rate limits, bot protection, duplicate detection and consent evidence.
- Follow up only through a channel and purpose the traveller has agreed to.
- A traveller may confirm requirements through an opted-in WhatsApp exchange, email response or human callback. Record the event and evidence.
- Request OTP only when a risk rule, disputed contact or high-risk change makes it proportionate; explain why and provide a non-OTP alternative where practical.
- A phone number supplied by the traveller is not proof of ownership. Never claim it is verified merely because it passes a format check.
- Withdrawal of consent immediately blocks new distribution and triggers the defined suppression/retention process.

## 8. Disputes and service quality

Define a pilot dispute window and evidence rules before charging agencies. Potential review reasons include duplicate, invalid contact format, consent missing/withdrawn before sale, materially inaccurate trip details, or lead already sold. Do not guarantee conversion or refund solely because the traveller did not book. Track unreachable claims separately from unverified ownership.

## 9. Metrics for pilot tuning

Track by source/campaign and quality category:
- Enquiry-to-high/medium/low distribution
- Cost per captured enquiry and cost per sold lead by category
- Agency purchase rate and time to purchase by category
- First-contact rate and time to first contact
- Quote rate, booking/win rate and agency-reported outcome
- Dispute/refund rate and reason
- Contribution margin per sold lead

Review category thresholds and price bands after a meaningful pilot sample. Do not expand India-wide until Kashmir supply quality, agency repeat purchases and contribution margin are demonstrated.

## 10. Implementation guardrails

- Keep Growth inventory separate from agency CRM leads.
- Retain and classify every legitimate enquiry; do not discard a lead solely for a low score.
- Keep consent evidence and qualification events auditable.
- Keep raw contact PII out of marketplace lists, analytics and logs.
- Use server-side scoring; never trust a client-supplied score or price.
- Treat scoring as explainable rules with a human-review path, not an opaque AI decision.
- No mandatory OTP for all travellers.
- No live selling or payment collection until consent language, privacy notice, contact policy, dispute policy and payment flow have been reviewed.
