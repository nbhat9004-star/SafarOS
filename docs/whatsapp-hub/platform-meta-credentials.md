# SafarOS platform WhatsApp credentials

The Super Admin API & Integrations → WhatsApp Cloud API card stores **SafarOS Meta app credentials only**:

- Meta App ID (non-secret)
- Meta App Secret (secret)
- Webhook Verify Token (secret)
- Optional Graph API version

The platform credential record is stored in `platformProviderCredentials`, encrypted using the existing platform credential manager. Secrets are never returned to the browser; only masked hints are shown.

## Agency credentials remain separate

Each agency continues to connect its own WhatsApp Business Account in Communications → Channel Integrations. Its WABA ID, Phone Number ID and access token remain tenant-scoped in `whatsappConnections` and encrypted with the agency credential encryption helper. Do not copy an agency token into the Super Admin card.

## Webhook

The Meta callback remains `/api/webhooks/whatsapp`. The GET challenge now resolves the platform Webhook Verify Token from the platform credential store (with server environment fallback). The signed POST resolves the Meta App Secret in the same way. Existing environment variables remain supported:

- `WHATSAPP_APP_ID`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_API_VERSION`

## Verification

Use the Super Admin card's Test action to validate the App ID/App Secret pair against Meta's Graph API. This does not send a WhatsApp message and does not verify any agency number. Agency connection health and message tests remain in the agency workspace.

Do not remove old credential documents or rotate `CREDENTIALS_ENCRYPTION_KEY` as part of this change. Legacy fields may remain in the existing document but are no longer used by the platform WhatsApp configuration.
