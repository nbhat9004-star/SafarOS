# SafarOS WhatsApp Hub — Architecture & Implementation Plan

**Decision:** Every agency connects and owns its own WhatsApp Business Account (WABA) and business phone number. SafarOS provides shared, multi-tenant infrastructure and a native inbox inside Super Admin and the Agency Workstation.

**Provider:** Official Meta WhatsApp Business Platform / Cloud API only. No WhatsApp Web scraping, browser automation, or shared agency number.

## 1. Goals
- Let an agency admin connect its own WABA and phone number from inside SafarOS.
- Let permitted agency staff receive, search, assign, and reply to WhatsApp conversations without leaving the workstation.
- Keep each agency's tokens, contacts, conversations, messages, templates, usage, and settings isolated.
- Connect WhatsApp to existing CRM clients, leads, quotations, bookings, and support workflows.
- Give Super Admin operational visibility into connection health, webhook failures, and usage without exposing tokens or message contents by default.

## 2. Existing SafarOS foundations and gaps
- lib/tenancy.js derives tenant filters from the verified session agencyId.
- lib/db.js uses MongoDB and already creates agency-scoped indexes for communications and communicationTemplates.
- components/safaros/app-experience.jsx already has Communications with Inbox, Conversations, Templates, Activity, Support Tickets, and Channel Integrations.
- The current WhatsApp channel form only stores an agency phone number and WABA ID. Its UI explicitly says provider authorization and webhook verification are not implemented; saving details does not enable live messaging.
- lib/integrations.js contains a generic WhatsApp provider entry, while lib/secrets.js contains a platform-level WhatsApp Cloud API credential entry. These are not sufficient for the selected per-agency architecture and must not be used as one shared agency token.
- The existing communications collection is a general activity/log model, not a complete inbound/outbound message and conversation store.

**Implementation rule:** Preserve existing CRM communication logs and templates where possible, but build dedicated WhatsApp connection, contact, conversation, message, webhook-event, and template records. Do not mark a channel connected until Meta authorization, phone registration, webhook subscription, and a successful health check are complete.

## 3. Target architecture

    Agency Workstation                         SafarOS Super Admin
      WhatsApp Hub                                WhatsApp Operations
      - Inbox / Conversations                     - Connected agencies
      - Contacts / assignment                     - Connection health
      - Templates / automation                    - Webhook failures
      - Media / message status                    - Usage / limits
                 \                                  /
                  \                                /
                   SafarOS WhatsApp application layer
                   - Tenant authorization + RBAC
                   - Conversation/message services
                   - Template and policy validation
                   - Booking/CRM event adapters
                   - Audit, usage, retry and idempotency
                                  |
                       MongoDB (agency-scoped)
                       - whatsappConnections
                       - whatsappContacts
                       - whatsappConversations
                       - whatsappMessages
                       - whatsappTemplates
                       - whatsappWebhookEvents
                       - whatsappUsage
                                  |
                      Meta Graph API / Cloud API
                      One WABA + phone number per agency
                                  |
                            Meta Webhooks

### Connection model
- Each agency authorizes its own WABA using Meta Embedded Signup once the SafarOS Meta app is approved for the applicable Tech Provider / Solution Provider onboarding capabilities.
- Meta returns the agency WABA ID, phone number ID, and a short-lived authorization code. The SafarOS backend exchanges the code securely and completes the onboarding/registration steps supported by the approved Meta flow.
- Store the connection against the server-derived agencyId, and map incoming webhook events by phone_number_id to exactly one agency connection.
- The agency owns its Meta business assets, phone number, billing relationship, templates, and customer relationship. SafarOS receives only the access granted through Meta.
- Do not allow one agency to select another agency's WABA or phone number.

### Credential security
- Store agency access tokens encrypted at rest using the existing AES-256-GCM secret helper or a dedicated KMS-backed envelope-encryption service.
- For production, require a dedicated CREDENTIALS_ENCRYPTION_KEY; do not rely on a JWT-secret fallback for long-term provider credentials. Include key-version metadata and a rotation plan.
- Never return tokens, app secrets, authorization codes, webhook secrets, or decrypted credentials to the browser or logs.
- Use a least-privilege server-side service to decrypt credentials only for the specific agency connection needed for an API call.
- Keep Meta App ID, App Secret, Embedded Signup Configuration ID, Graph API version, and webhook verify token as platform-level secrets. Keep agency WABA/phone identifiers and encrypted agency token in the agency connection record.
- Redact phone numbers and message bodies from operational logs unless needed for authorized support diagnostics.

## 4. Proposed MongoDB collections

Every agency-owned record must include agencyId, and every staff read/write must use a tenant filter created from the verified staff session. Webhook handlers are unauthenticated by staff cookie, so they must resolve the agency only through the verified Meta webhook signature and registered phone_number_id mapping.

### whatsappConnections
One active connection per agency initially; schema can later support multiple numbers.
- id, agencyId, provider=meta_cloud
- wabaId, phoneNumberId, displayPhoneNumber, verifiedName
- status: not_connected | onboarding | pending_review | connected | restricted | disconnected | error
- encryptedAccessToken, tokenKeyVersion, tokenExpiresAt (when provided), scopes
- qualityRating, messagingLimit, lastHealthCheckAt, lastErrorCode
- connectedAt, connectedBy, createdAt, updatedAt
- Unique indexes: agencyId and phoneNumberId, to prevent cross-tenant mapping collisions.

### whatsappContacts
- id, agencyId, waId, normalized phone, display name, CRM clientId/leadId links, consent/opt-out state, lastInboundAt, timestamps.
- Unique index: agencyId + waId.

### whatsappConversations
- id, agencyId, connectionId, contactId, waId
- status: open | pending | closed, assignedUserId, assignedUserName
- lastMessageAt, lastMessagePreview, unreadCount
- serviceWindowExpiresAt, lastInboundAt, CRM clientId/leadId/bookingId, timestamps.
- Index by agencyId + lastMessageAt and agencyId + assignedUserId + status.

### whatsappMessages
- id, agencyId, connectionId, conversationId, contactId
- direction: inbound | outbound; type: text | template | image | document | audio | video | location | interactive
- text, safe media metadata, metaMessageId, templateName, templateLanguage
- status: received | queued | sent | delivered | read | failed, failureCode, failureReason
- sentBy, source: agent | automation | booking_event, timestamps.
- Unique agencyId + metaMessageId for webhook idempotency; index agencyId + conversationId + createdAt.

### whatsappTemplates
- id, agencyId, Meta template ID/name, language, category, components/variables, approval status, sync timestamps.
- Unique agencyId + metaTemplateId.

### whatsappWebhookEvents
- eventId or stable dedupe key, phoneNumberId, resolved agencyId, event type, received/processed timestamps, processing status, safe error summary.
- Unique dedupe index; retain only the minimum payload needed for retries/audit, with sensitive content redacted or encrypted.

### whatsappUsage
- agencyId, connectionId, period, inbound/outbound counts, template counts, failed counts, Meta usage/cost metadata where available.
- Unique agencyId + period + connectionId.

## 5. Backend API and event flows

Use dedicated route handlers for public Meta webhooks; do not put webhook verification behind the staff-session catch-all API.

### Agency-authenticated endpoints
- GET /api/whatsapp/connection — masked connection status and health only.
- POST /api/whatsapp/embedded-signup/exchange — server-side code exchange and onboarding completion; validate signed-in agency admin and one-time state/nonce.
- POST /api/whatsapp/connection/disconnect — disable local connection safely and record audit.
- GET /api/whatsapp/conversations — tenant-scoped inbox with filters, unread counts, assignments.
- GET /api/whatsapp/conversations/:id/messages — tenant-scoped paginated history.
- POST /api/whatsapp/messages — send text/media/template after policy and service-window checks.
- PUT /api/whatsapp/conversations/:id — assign, close/reopen, mark read.
- GET /api/whatsapp/templates and POST /api/whatsapp/templates/sync — list and sync approved Meta templates.
- GET /api/whatsapp/usage — agency-only usage and connection diagnostics.

### Public Meta webhook
- GET /api/webhooks/whatsapp — verify Meta subscription challenge using configured verify token.
- POST /api/webhooks/whatsapp — validate X-Hub-Signature-256 using Meta App Secret; reject invalid signatures; resolve phone_number_id to agency connection; persist/dedupe event; process inbound messages and delivery/read/failure statuses.
- Webhook responses must be fast. Persist first, acknowledge, then process safely/retryably. Never trust an agency ID supplied by a webhook payload or query string.

### Outbound send lifecycle
1. Agent or approved automation requests a send.
2. Server checks RBAC, agency connection, recipient consent/opt-out, message type, template approval and WhatsApp service-window policy.
3. Server writes an outbound message with an idempotency key and queued status.
4. Server calls Meta Cloud API with only that agency's decrypted token and phone number ID.
5. Persist Meta message ID and status; reconcile delivery/read/failure updates from webhooks.
6. On transient errors, retry with bounded exponential backoff; do not retry permanent policy/recipient errors.
7. Audit the actor/source and usage without leaking secrets.

## 6. Policy and safeguards
- Free-form replies are allowed only within the applicable customer service window after the user's last inbound message. Outside that window, require an approved template of the correct category/language.
- Template status is synced from Meta; only approved templates are sendable.
- Respect opt-out and block requests. Provide a visible opt-out/contact suppression state.
- Keep marketing templates and campaign sending behind explicit permissions, consent evidence, rate limits, and safeguards. Do not launch bulk campaigns in the first release.
- Show message states: queued, sent, delivered, read, failed.
- Store timestamps in UTC and display them in agency timezone.
- Restrict message/media access by agency RBAC; log administrative access and exports.

## 7. User interface plan

### Agency Workstation — Communications > WhatsApp Hub
1. Connect — branded Connect WhatsApp button launches Meta Embedded Signup; show prerequisites and explain that the agency's own Meta admin must complete authorization.
2. Inbox — responsive three-column layout: conversation list, active thread, customer/booking context panel.
3. Conversation thread — send text, approved templates, documents/images; show delivery states and service-window timer.
4. Contacts — WhatsApp contacts linked to CRM records, consent and opt-out status.
5. Assignments — assign to permitted team members, unread counts, open/pending/closed filters.
6. Templates — synced Meta templates and approval status; locally created text must never be misrepresented as Meta-approved.
7. Automation — booking-created/updated, payment-received, trip reminder and follow-up triggers; each automation requires template and consent checks.
8. Activity & Usage — message volume, failures, template usage, connection health.

Evolve the current Communications tabs (Inbox, Conversations, Templates, Activity, Channel Integrations) rather than creating a separate application or another left navigation system.

### Super Admin — WhatsApp Operations
- Connected/disconnected agencies and masked phone numbers.
- Meta app/webhook health and last successful event.
- Failed webhook queue and retry controls.
- Per-agency message usage, connection status and support diagnostics.
- Disconnect/suspend controls with audit reason.
- No default access to customer message content; exceptional support access must be permission-gated and audited.

## 8. Booking and CRM integration
- Booking created/confirmed → send approved booking confirmation template.
- Booking updated/cancelled → send corresponding approved template.
- Payment received → send receipt/confirmation if enabled by the agency.
- Upcoming trip → send reminder template at agency-configured lead time.
- New lead/client → create or match a WhatsApp contact only with a valid phone number and lawful basis.
- Inbound WhatsApp message → match by normalized phone within the same agency; attach to existing CRM client/lead when unambiguous, otherwise create an unlinked contact for staff review.
- Label automation-generated messages and retain the booking/event reference that triggered them.

## 9. Permissions
Suggested granular permissions:
- whatsapp:read
- whatsapp:reply
- whatsapp:manage_connection
- whatsapp:manage_templates
- whatsapp:assign
- whatsapp:manage_automation
- whatsapp:view_usage
- whatsapp:manage_campaigns (future, disabled initially)

Owners/admins manage connection and templates. Team members receive only inbox, reply, assignment, or reporting rights granted by their role. Super Admin permissions remain separate from agency roles.

## 10. Meta prerequisites and critical dependency

There are two distinct stages:

### A. Connect SafarOS's own test number
A single business can set up its own Cloud API assets using Meta's supported direct setup, subject to account/number eligibility and applicable restrictions. This is useful for internal development and testing.

### B. Let customer agencies self-connect their own numbers inside SafarOS
This is a platform onboarding capability. SafarOS must configure a Meta app for WhatsApp Embedded Signup and complete applicable Tech Provider / Solution Provider onboarding requirements, App Review and Advanced Access for required permissions. Meta's current Embedded Signup guidance identifies business_management and whatsapp_business_management for release; messaging and webhook functionality also require the relevant WhatsApp permissions such as whatsapp_business_messaging. Exact permissions and partner steps must be confirmed in the current Meta App Dashboard before submission.

**Current known blocker:** Lafqa Ventures' business verification was rejected in Meta Business Settings. This must be investigated and corrected for the customer self-onboarding/partner route. Do not promise that agencies can self-connect until Meta approves the app and required permissions. In the meantime, implement the UI, data model, webhook pipeline, test-number connection and manual internal test harness.

### Meta configuration checklist
- Business portfolio verification and correct legal entity details.
- Meta Developer App with WhatsApp product and Facebook Login for Business / Embedded Signup configuration.
- HTTPS OAuth redirect URLs and allowed JavaScript SDK domains for SafarOS production domains.
- App Review and Advanced Access for the permissions Meta requires.
- Public webhook callback and verify token; subscribe to WhatsApp Business Account webhook fields.
- App Secret held server-side only; test and production credentials separated.
- Privacy policy, data deletion instructions, app review screencast and reviewer test account as required by Meta.
- Approved display name, phone ownership verification and two-step phone registration where required.
- Payment method/credit line and billing ownership confirmed for each customer setup path.

## 11. Implementation phases and acceptance criteria

### Phase 0 — Confirm Meta eligibility and app setup
- Inspect existing Meta app, business portfolio rejection details and existing WhatsApp assets.
- Decide whether to appeal/resubmit business verification or follow Meta's currently supported route.
- Confirm exact Tech Provider status, Embedded Signup eligibility and App Review requirements.
**Exit:** written checklist of missing Meta approvals; no assumptions that rejected verification is approved.

### Phase 1 — Secure foundation and schema
- Add tenant-scoped collections/indexes and encrypted agency token storage.
- Add RBAC permissions and audit events.
- Add connection status endpoints and health-check service.
**Exit:** tests prove agency A cannot read agency B's connection, contacts, conversations, messages or usage; tokens never appear in API responses/logs.

### Phase 2 — Internal test-number Cloud API
- Configure one SafarOS-controlled test WABA/number (not a shared production customer number).
- Implement server-side send, inbound webhook, signature validation, idempotency, delivery/read/failure updates.
- Verify approved-template and 24-hour service-window rules.
**Exit:** end-to-end inbound/outbound tests pass on test number.

### Phase 3 — Native agency inbox
- Replace the current save phone/WABA details placeholder with true Meta connection state.
- Build inbox, thread, CRM context, media, assignment and status UI inside Communications.
- Add setup checklist and connection troubleshooting panel.
**Exit:** an agency staff member can handle an entire test conversation without opening WhatsApp Web or a separate provider dashboard.

### Phase 4 — Embedded Signup and customer onboarding
- Implement Meta Embedded Signup, one-time code exchange, asset discovery/registration and webhook subscription according to the approved partner flow.
- Add agency-admin connect/disconnect and reconnect flows.
- Complete Meta App Review / Advanced Access before enabling general customer self-onboarding.
**Exit:** two separate test agencies can connect different WABAs/numbers and their data/messages remain isolated.

### Phase 5 — Booking automation and operations
- Add booking/payment/trip event triggers, approved template sync, retries, usage and Super Admin diagnostics.
- Add consent, opt-out, permissions, rate limits and audit/reporting.
**Exit:** booking confirmation/reminder tests pass; opt-outs suppress messages; failed sends are visible and safely retryable.

## 12. Testing matrix
- Tenant isolation: two agencies with separate numbers, users, clients and messages.
- Webhook authenticity: valid signature accepted; invalid signature rejected.
- Webhook reliability: duplicate event ignored; out-of-order statuses handled; retry after temporary DB/provider failure.
- Credential security: no token in browser responses, logs, errors or client storage.
- Messaging policy: free-form within service window; approved template outside it; unapproved template blocked.
- Consent: opted-out contact cannot receive marketing automation.
- RBAC: read/reply/connect/template/automation rights tested independently.
- Booking automation: duplicate booking events do not send duplicate confirmations.
- Media: file type/size validation and safe temporary URL handling.
- Disconnect: stop new sends, preserve history, revoke/delete stored token securely, retain audit record.

## 13. Decisions to preserve
- Agency-owned WhatsApp number is the default and only model for the first release.
- Each agency owns its Meta messaging charges and phone-number relationship.
- SafarOS subscription may charge for the Hub feature/seat/usage separately, but Meta charges must be disclosed separately.
- No third-party inbox or WhatsApp Web is required for normal use.
- Do not enable customer self-onboarding until Meta approval is actually complete.
- Build on the existing Communications module and tenancy model; do not create a disconnected second app.
