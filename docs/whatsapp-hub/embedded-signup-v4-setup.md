# SafarOS WhatsApp Embedded Signup v4 — setup

This setup enables an agency owner/manager to connect that agency's own WhatsApp Business Account from Communications → Channel Integrations. It does not make SafarOS a Meta Tech Provider by itself and does not bypass App Review or Advanced Access.

## Meta configuration created

- Facebook Login for Business configuration ID: `1456495626552723`
- Login variation: WhatsApp Embedded Signup
- Product selected: WhatsApp Cloud API
- Asset: WhatsApp Business Accounts
- Permissions: `whatsapp_business_management`, `whatsapp_business_messaging`
- Access-token setting: System-user access token, 60-day expiry (as selected in Meta)

The configuration intentionally includes WhatsApp Cloud API only. Marketing Messages API onboarding terms are not included in this configuration. This does not prevent the standard Cloud API message/template workflows that have already been tested with the SafarOS demo connection.

## Vercel environment variables

Add these to the SafarOS Vercel project for the intended preview environment first. Do not put the App Secret in a `NEXT_PUBLIC_*` variable.

| Variable | Value |
| --- | --- |
| `META_APP_ID` | The numeric App ID from the existing SafarOS Meta Developer app |
| `META_APP_SECRET` | The App Secret from that same Meta app; server-only |
| `META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID` | `1456495626552723` |
| `WHATSAPP_GRAPH_API_VERSION` | `v23.0` (or the currently supported version already approved for the SafarOS app) |

The browser receives only the App ID and configuration ID from an authenticated, permission-checked endpoint. The App Secret remains server-side and is used only to exchange the one-time authorization code.

## Facebook Login for Business settings

In the existing Meta app, open Facebook Login for Business → Settings. Verify that the JavaScript SDK login is enabled and add the HTTPS SafarOS origin to Allowed Domains for the JavaScript SDK. Add the required HTTPS redirect URI if Meta's settings page requires one. For the production host, the origin is `https://os.safarcurated.com`; for preview testing, add only the exact Vercel preview hostname being used. Do not use wildcard domains.

The Meta JavaScript SDK is loaded only when an agency manager starts the signup flow. The flow uses the v4 configuration ID, requests an authorization code, receives the WABA/phone-number IDs from Meta's signup completion event, and sends those values to the SafarOS server.

## Server-side completion

1. A signed-in agency manager requests a one-time, 10-minute signup state tied to that agency.
2. The browser launches Facebook Login for Business using the configuration ID.
3. SafarOS receives the one-time authorization code and the WABA/phone-number IDs.
4. The server consumes the one-time state, exchanges the code using the Meta App ID and App Secret, verifies the phone number belongs to the WABA, and subscribes the SafarOS app to that WABA.
5. The resulting agency token is encrypted with the existing agency-scoped AES-256-GCM helper and stored against the authenticated agency ID.
6. The existing manual connection form remains available for internal/test setups.

## Before enabling customer self-onboarding

- Confirm the Meta app is in Live mode and the exact production domain is allowed.
- Complete the current Meta Tech Provider / partner onboarding steps applicable to Lafqa Ventures.
- Obtain App Review and Advanced Access for the permissions Meta requires for release. Meta's current Embedded Signup release guidance may also require `business_management`; verify the current dashboard requirements rather than assuming the two WhatsApp permissions alone are sufficient.
- Test with a separate agency workspace on the SafarOS preview deployment. Do not use production customer credentials for initial validation.
- Confirm inbound webhook routing, outbound messages, approved templates, delivery/read statuses, and tenant isolation before launch.

## Current status

The user reports that Meta business verification and domain verification are complete and has created the v4 configuration above. Tech Provider / App Review / Advanced Access status has not yet been independently confirmed. The implementation is on a development branch and must not be merged or deployed to production without explicit approval.
