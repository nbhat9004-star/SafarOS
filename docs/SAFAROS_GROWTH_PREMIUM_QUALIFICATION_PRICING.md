# SafarOS Growth — Premium Lead Qualification & Pricing

**Pilot market:** Kashmir, India  
**Distribution:** Exclusive only  
**Commercial position:** Premium, high-intent enquiries  
**OTP policy:** No mandatory OTP for every traveller

## 1. Product promise

SafarOS Growth sells a limited supply of well-qualified traveller enquiries, not bulk contact lists. Agencies pay for one exclusive opportunity to respond to a traveller who has expressed a clear travel requirement.

A premium score is a structured quality assessment. It is not a guarantee that the traveller will book, answer a call, own the submitted phone number, or have a particular ability to pay.

## 2. Qualification score (0–100)

| Signal group | Maximum | Scoring guidance |
|---|---:|---|
| Profile completeness | 10 | Name (3), syntactically valid phone format (4), valid email format (3) |
| Trip specificity | 15 | Destination (5), travel start date (5), trip type (5) |
| Budget and group | 15 | Stated budget (8), party size (7) |
| Travel timing | 15 | Travel within 90 days (15); 91–180 days (12); 181–365 days (8); beyond 365 days (3); missing/invalid/past date (0) |
| Engagement | 20 | Confirms requirements (10), responds to a follow-up (5), requests a quote/callback (5) |
| Purchase intent | 15 | Requests a quotation (8), states booking timeline (4), selects an itinerary/package (3) |
| Integrity | 10 | Starts at 10; possible duplicate or suspicious/bot signal removes eligibility and requires review |
| **Total** | **100** | |

Engagement and intent signals must be recorded with timestamp, channel and source. Do not infer them from demographic characteristics, device price, location stereotypes or an AI-generated guess. AI may recommend review but must not invent evidence.

## 3. Quality bands and marketplace policy

- **Premium (80–100):** Candidate for the premium marketplace, subject to all hard eligibility gates.
- **Qualified (60–79):** Not sold in the initial premium-only pilot. Retain only for permitted follow-up/analytics under the stated purpose and retention policy.
- **Review required (0–59):** Not listed. Investigate missing data, duplicate or suspicious signals.

Premium marketplace hard gates:
1. Recorded, affirmative and unwithdrawn consent for sharing the enquiry/contact details with a travel operator for the stated purpose.
2. Syntactically valid contact number; this is only a format check, not proof of ownership or reachability.
3. No unresolved duplicate or suspicious/bot flag.
4. Score of at least 80.
5. Engagement score of at least 10, based on a recorded traveller action.
6. Lead has not expired, been withdrawn, sold, refunded or otherwise blocked.

A missing OTP must not lower the score or disqualify a lead. Do not label a phone as verified unless ownership was actually verified. Store separate states such as `format_valid`, `ownership_unverified`, `ownership_verified`, and `unreachable_confirmed`.

## 4. Low-friction verification (OTP optional)

- Initial enquiry form does not require OTP.
- Use server-side format validation, rate limits, bot protection, duplicate detection and consent evidence.
- Follow up only through a channel and purpose the traveller has agreed to.
- A traveller may confirm requirements through an opted-in WhatsApp exchange, email response or human callback. Record the event and evidence.
- Request OTP only when a risk rule, disputed contact or high-risk change makes it proportionate; explain why and provide a non-OTP alternative where practical.
- A phone number supplied by the traveller is not proof of ownership. Never claim it is verified merely because it passes a format check.
- Withdrawal of consent immediately blocks new distribution and triggers the defined suppression/retention process.

## 5. Suggested pilot price bands (INR)

These are initial test prices, not validated market rates. Keep them configurable in Super Admin and review them against agency conversion, contactability, refund rate and acquisition cost.

| Premium score | Suggested exclusive price |
|---|---:|
| 80–84 | ₹199 |
| 85–89 | ₹299 |
| 90–94 | ₹399 |
| 95–100 | ₹499 |

Only premium-eligible leads receive a price. No price is shown for a lead that fails a hard gate. Super Admin may override a price with a reason and audit event. Do not vary price using protected or sensitive personal traits.

## 6. Agency-facing preview and purchase

Before purchase, an eligible agency sees:
- Destination and travel window
- Party size and stated budget band
- Trip type and requested service
- Qualification score band and the evidence-based reasons
- Contact status disclosed honestly (e.g. format valid; ownership not verified)
- Exclusive price, expiry and refund/dispute terms

The agency does not see name, phone, email or other direct identifiers until its exclusive purchase succeeds. The purchase must be atomic so only one agency can unlock a lead. After purchase, the agency may contact the traveller only for the disclosed enquiry purpose and through permitted channels.

## 7. Disputes and service quality

Define a pilot dispute window and evidence rules before charging agencies. Potential review reasons include duplicate, invalid contact format, consent missing/withdrawn before sale, materially inaccurate trip details, or lead already sold. Do not guarantee conversion or refund solely because the traveller did not book. Track unreachable claims separately from unverified ownership.

## 8. Metrics for pilot tuning

Track by source/campaign and score band:
- Enquiry-to-premium rate
- Cost per captured enquiry and cost per premium lead
- Agency purchase rate and time to purchase
- First-contact rate and time to first contact
- Quote rate, booking/win rate and agency-reported outcome
- Dispute/refund rate and reason
- Contribution margin per sold lead

Review the proposed price bands after a meaningful pilot sample. Do not expand India-wide until Kashmir supply quality, agency repeat purchases and contribution margin are demonstrated.

## 9. Implementation guardrails

- Keep Growth inventory separate from agency CRM leads.
- Keep consent evidence and qualification events auditable.
- Keep raw contact PII out of marketplace lists, analytics and logs.
- Use server-side scoring; never trust a client-supplied score or price.
- Treat scoring as explainable rules with a human-review path, not an opaque AI decision.
- No mandatory OTP for all travellers.
- No live selling or payment collection until consent language, privacy notice, contact policy, dispute policy and payment flow have been reviewed.
