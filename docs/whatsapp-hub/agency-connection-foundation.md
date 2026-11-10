# WhatsApp Hub — Agency connection foundation

This phase adds two backend foundations:

- `GET /api/whatsapp/connection`: returns a safe, agency-scoped connection status. It never returns access tokens or ciphertext.
- `DELETE /api/whatsapp/connection`: lets an authorized agency owner/manager disconnect the current agency's connection and clears its encrypted token.
- `lib/whatsapp-credentials.js`: AES-256-GCM encryption for agency-specific WhatsApp access tokens. The agency ID is authenticated as additional data, so ciphertext cannot be moved between agencies and decrypted successfully.

## Required secret

Configure `CREDENTIALS_ENCRYPTION_KEY` in Vercel as a server-only environment variable with at least 32 characters of high-entropy random data. Use the same key in Preview and Production environments. Never expose it with a `NEXT_PUBLIC_` prefix and never paste it into chat or source control.

**Important:** Do not rotate this key without a migration plan for existing encrypted credentials. A key change makes existing ciphertext unreadable.

## Current scope

This is not yet Meta Embedded Signup or a complete connection flow. It does not exchange authorization codes, register phone numbers, subscribe WABAs, send messages, or display an inbox. Those steps require the approved Meta app/configuration and a separately implemented OAuth/Embedded Signup flow. A connection must not be marked connected until the complete Meta authorization and health checks succeed.

The existing webhook maps incoming events to an agency using the registered `phoneNumberId`; this phase does not create connection records automatically.
