# Meta WhatsApp webhook setup for SafarOS

SafarOS exposes the public Meta webhook at:

`/api/webhooks/whatsapp`

The route is implemented in `app/api/webhooks/whatsapp/route.js`. It is separate from the staff-session API catch-all so Meta can call it without an agency login cookie.

## Required server-side environment variables

Configure these in the SafarOS Vercel project (Preview and Production separately):

- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: a newly generated, high-entropy random value used only for Meta's GET verification challenge.
- `WHATSAPP_APP_SECRET`: the App Secret from the SafarOS Meta Developer app. Keep it server-side only.

Do not put either value in browser code, GitHub, screenshots, chat, or a client-visible `NEXT_PUBLIC_*` variable. Do not reuse the Meta access token as the webhook verify token.

The route intentionally returns a configuration error until `WHATSAPP_APP_SECRET` is present. GET verification returns the challenge only when the mode and verify token match exactly.

## Meta dashboard

After the SafarOS deployment containing this route is Ready:

1. Open the WhatsApp product's webhook configuration in Meta for Developers.
2. Set Callback URL to `https://YOUR-SAFAROS-HOST/api/webhooks/whatsapp`.
3. Set Verify Token to the exact value stored in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
4. Click Verify and Save.
5. Subscribe the app to the WhatsApp Business Account `messages` webhook field.
6. Send a test message and confirm a signed POST reaches the endpoint.

Replace `YOUR-SAFAROS-HOST` with the verified SafarOS deployment host. Do not use the Meta test phone number as an agency production connection.

## Processing and tenant safety

- POST requests require a valid `X-Hub-Signature-256` HMAC-SHA256 signature using `WHATSAPP_APP_SECRET`.
- The webhook maps `metadata.phone_number_id` to a connected `whatsappConnections` record. It never trusts an agency ID from the webhook payload.
- Events for phone numbers that have not been connected to an agency are stored as content-minimized `unmapped` diagnostics; customer message bodies are not stored for those events.
- For mapped connections, inbound messages create/update agency-scoped contacts, conversations and messages. Delivery/read/failure statuses update the corresponding message.
- Meta message IDs and webhook event keys are uniquely indexed for deduplication. Tokens and full webhook payloads are never logged.
- This first webhook foundation does not yet provide Embedded Signup, outbound replies, template sync, media downloads, or an agency inbox. Those are subsequent implementation phases.

## First test-number limitation

The Meta-generated test number is useful for exercising the Cloud API. It must not be treated as a live agency connection. Before inbound messages are written into an agency inbox, an authorized connection record must exist with the exact phone number ID, agency ID, and encrypted agency-owned token. Keep each agency's WABA, phone number, billing and token separate.
