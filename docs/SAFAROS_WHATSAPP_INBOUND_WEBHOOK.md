# SafarOS Meta WhatsApp inbound webhook

**Route:** `/api/webhooks/whatsapp`  
**Status:** Inbound webhook foundation only; no production secrets configured and no Growth lead is created from an ordinary WhatsApp message.

## Required server-only environment variables

- `META_APP_SECRET`: Meta App Secret used to validate `X-Hub-Signature-256`.
- `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`: private verification token chosen in Meta App Dashboard.

Do not expose either value to browser code or commit them to Git. The route uses the raw request body for HMAC-SHA256 validation and rejects invalid signatures.

## Meta webhook setup

In the Meta App Dashboard, configure the callback URL as `https://YOUR_SAFAROS_DOMAIN/api/webhooks/whatsapp`, enter the same verify token stored in `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`, and subscribe the WhatsApp Business Account to the `messages` webhook field. Use the actual SafarOS deployment domain.

## What this increment processes

- GET subscription challenge verification.
- POST signature validation.
- Incoming messages stored in `whatsappMessages`, contact and conversation upserts in `whatsappContacts` and `whatsappConversations`.
- Delivery/read/failure statuses update the matching outbound message.
- Events are idempotent and mapped by Meta `phone_number_id` to a connected `whatsappConnections` record. Agency ID is never trusted from the webhook body.
- Message content is retained for the agency inbox; operational logs never include raw payloads, phone numbers or message text.

## Important current boundary

The existing SafarOS code branch does not yet implement the agency connection onboarding flow or the inbox UI's complete backing APIs. This webhook requires a matching `whatsappConnections` document with `status: connected`, `agencyId`, `id`, and `phoneNumberId`. Events for unmapped numbers are marked `unmapped`; they are not assigned to an agency.

**No Growth lead is created from a WhatsApp message in this increment.** An inbound message, a travel enquiry, or a conversation with an agency is not by itself permission to pass contact details into Lafqa's separate lead marketplace. Before Growth ingestion, implement a consent prompt and capture a clear affirmative reply with the exact notice version, disclosure and timestamp, then collect the trip fields and invoke the protected Growth intake endpoint. Opt-outs and consent withdrawal must block further Growth use.

## Not included

- Embedded Signup, token exchange, phone registration or WABA subscription automation.
- Outbound send API, template sends, media downloads, retries queue or inbox UI.
- Automated consent prompt or Growth lead creation.
- Environment-variable changes, production deployment or live enablement.
