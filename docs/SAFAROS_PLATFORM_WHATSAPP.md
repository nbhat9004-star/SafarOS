# SafarOS platform WhatsApp number setup

This guide configures the **SafarOS-owned platform number +91 88990 46675**. It does not configure or replace any agency-owned WhatsApp number.

## Meta assets required

Use the Lafqa Ventures business portfolio and the Meta app **Lafqa Connect**.

1. In Meta Business Settings, open Accounts → WhatsApp Accounts and select the Lafqa Ventures WhatsApp Business Account.
2. In WhatsApp Manager → Phone numbers, add **+91 88990 46675** if it is not already listed. Complete Meta's OTP verification and confirm the display name is approved.
3. Copy the WhatsApp Business Account ID (WABA ID) and the Phone Number ID for this exact number.
4. In Business Settings → Users → System Users, create or select the SafarOS system user. Assign the Lafqa Connect app and the WhatsApp Business Account with the permissions needed to manage and message from the number.
5. Generate a System User access token for Lafqa Connect with `whatsapp_business_management` and `whatsapp_business_messaging`. Choose **Never** for expiry where Meta offers that option. Do not use the temporary token shown in the Meta API test panel.
6. In Lafqa Connect → WhatsApp → Configuration, set the webhook callback to `https://os.safarcurated.com/api/webhooks/whatsapp`, use the webhook verify token saved in SafarOS, and subscribe to the `messages` webhook field.

## Save credentials in SafarOS

Sign in as Super Admin and open **API & Integrations → WhatsApp Cloud API**. Save:

- Meta App ID
- Meta App Secret
- Webhook Verify Token
- SafarOS Platform WhatsApp Business Account ID
- SafarOS Platform Phone Number ID
- Platform System User Access Token
- Graph API Version: `v23.0`

The System User Access Token is a secret. Enter it only in the masked credential field in SafarOS. Never paste it into GitHub, chat, screenshots, or source code.

Use **Test Connection**. SafarOS verifies the Meta app credentials, token validity and expiry, required scopes, WABA access, and that the Phone Number ID resolves to **+91 88990 46675**. The test does not send a customer message.

## Register the platform phone number

Only after the number has been verified in Meta and all credentials pass Test Connection:

1. Open Super Admin → WhatsApp Hub.
2. Enter the six-digit WhatsApp two-step verification PIN for the platform number.
3. Select **Register SafarOS Number** once.
4. Confirm that Meta reports successful registration.

Do not use the agency-level registration action for the platform number.

## Verify messaging

- Subscribe the Meta app webhook to `messages`.
- Send an inbound WhatsApp message to +91 88990 46675 and verify that SafarOS receives the webhook.
- Test an outbound reply only to a recipient who has agreed to receive the test.
- Confirm the platform conversation remains separate from every agency's tenant-scoped WhatsApp inbox.

## Retire the Meta test sender

The old Meta test sender (+1 555 184 1949) and its temporary token belong to Meta's developer test setup; they are not the SafarOS live number. After the live number passes verification and messaging tests, stop using the test sender and remove any temporary token previously copied into deployment environment variables or credential stores. Do not delete or overwrite the Lafqa Connect App Secret, webhook verify token, or any agency-owned credentials.
