# Lafqa WhatsApp Hub forwarding boundary

Status: design contract only. No forwarding is enabled by this document.

## Existing behavior to preserve

The existing Meta webhook at `/api/webhooks/whatsapp` verifies Meta's signature and routes connected agency numbers by `metadata.phone_number_id`. Existing agency connections, conversations, messages, statuses, and credentials remain tenant-scoped in SafarOS.

## Proposed additive behavior

After Meta signature verification, the webhook may forward an event only when the Phone Number ID matches an explicit Lafqa platform-number registration. Do not infer ownership from the message body, WABA ID alone, or a client-supplied business identifier.

- Existing connected agency number: process locally exactly as today; never forward to Hub.
- Explicitly registered Lafqa-owned product number: forward to the Hub using a dedicated service-to-service HMAC secret.
- Unknown/unregistered number: retain only existing content-minimized diagnostic behavior.

Forwarding must be isolated so Hub downtime cannot interrupt normal agency webhook processing. Use bounded timeouts and retryable/idempotent delivery; do not acknowledge successful delivery unless the Hub has accepted or durably queued the event.

## Security contract

Hub endpoint: `POST /api/integrations/safaros/whatsapp/webhook`.

HMAC-SHA256 signature input: `<timestamp>.<eventId>.<rawBody>`; headers are `X-Lafqa-Key-Id`, `X-Lafqa-Timestamp`, `X-Lafqa-Event-Id`, and `X-Lafqa-Signature: sha256=<hex>`.

Use a new high-entropy shared secret dedicated to this bridge. Keep it in server-only SafarOS and Hub environment variables. Do not reuse Meta App Secret, WhatsApp access tokens, database credentials, or encryption keys. Never expose it to browser code or logs.

## Rollout constraints

- Additive code on this feature branch only.
- Do not modify or delete agency connection data.
- Do not change Meta webhook settings or Production environment variables.
- Preview tests must prove agency isolation and Hub routing before production promotion.
