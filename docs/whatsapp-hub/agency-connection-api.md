# WhatsApp agency connection API

## Endpoint

`POST /api/whatsapp/connection`

Requires an authenticated SafarOS agency session and the `communications:manage` permission (agency owner or manager).

Request body:

```json
{
  "wabaId": "META_WHATSAPP_BUSINESS_ACCOUNT_ID",
  "phoneNumberId": "META_PHONE_NUMBER_ID",
  "accessToken": "META_ACCESS_TOKEN"
}
```

The access token is sent over HTTPS, used server-side to verify that the phone number belongs to the WABA, and to subscribe the Meta app to that WABA's webhook events. It is then encrypted with the dedicated `CREDENTIALS_ENCRYPTION_KEY` and stored against the session-derived agency ID. The raw token is never returned or logged.

The endpoint rejects a phone number already assigned to a different SafarOS agency. The existing webhook resolves inbound traffic by `phoneNumberId` and only processes messages when the corresponding connection has `status: connected`.

## Graph API version

Set `WHATSAPP_GRAPH_API_VERSION` to a currently supported Meta Graph API version for the app. The implementation defaults to `v23.0` if the variable is absent.

## Important rollout note

This endpoint implements manual connection using a Meta access token and the IDs from Meta's WhatsApp setup. It is not Embedded Signup. Use a durable system-user token with the required WhatsApp permissions for production; a temporary test token can expire. A successful API response confirms Meta accepted the WABA subscription and the agency connection was stored, but a real inbound/outbound end-to-end test is still required before production use.
