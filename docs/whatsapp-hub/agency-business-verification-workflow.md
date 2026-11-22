# Agency Business Verification Workflow

## Purpose

This workflow collects business information and supporting documents for SafarOS platform onboarding. It is not Meta Partner-Led Business Verification and does not submit documents to Meta.

Meta Business Verification remains a separate process completed by the agency in its own Meta Business Portfolio. Meta alone decides that status.

## Agency workflow

1. The agency owner opens **More → Business Verification** in the agency workspace.
2. The owner enters the legal business name, business type, country, registration/tax number (optional), and registered address.
3. The owner uploads 1–3 supporting PDF, JPEG or PNG documents, up to 3 MB each. Files are uploaded individually.
4. The owner submits the application to SafarOS.
5. The application is marked `pending_review` until a Super Admin reviews it.
6. The agency can separately update its Meta verification status. This field is explicitly agency-reported and is not verified by SafarOS.
7. If SafarOS requests more information, the owner can update the application and resubmit.

## Super Admin workflow

Open **Business Verification** in the Super Admin sidebar.

The queue displays agency, legal business name, country, document count, the agency-reported Meta status, and SafarOS review status. Open a row to inspect business details and download submitted documents.

Available review outcomes:

- `approved`: agency approved for SafarOS platform onboarding only.
- `needs_information`: agency can amend details/documents and resubmit.
- `rejected`: SafarOS application rejected; agency cannot edit or resubmit unless a Super Admin changes the outcome to `needs_information`.

Every review action is recorded in the platform audit log. A review note is required for `needs_information` and `rejected`.

## API and data model

- Agency endpoint: `GET/POST /api/business-verification`
- Super Admin list: `GET /api/platform/business-verifications`
- Super Admin detail: `GET /api/platform/business-verifications/:agencyId`
- Super Admin review: `PUT /api/platform/business-verifications/:agencyId`
- Super Admin document download: `GET /api/platform/business-verifications/:agencyId/documents/:documentId/download`
- Metadata collection: `agencyBusinessVerifications`
- Private file collection: `agencyBusinessVerificationDocuments`

Agency endpoints require the agency owner role. Platform endpoints require a separate authenticated platform-admin session and the relevant platform permissions. Document contents are excluded from list/detail responses and are only returned through authenticated download endpoints. File types are checked by both MIME type and file signature. The document endpoint uses private, no-store responses.

## Important limitations

- The agency-reported Meta status is self-declared. This implementation does not call Meta to confirm it.
- SafarOS approval is not Meta business verification, WhatsApp display-name approval, WABA approval, or a guarantee that Meta will allow messaging.
- This workflow does not use the Partner-Led Business Verification API and does not require a Multi-Partner Solution.
- Before production release, verify database backup/retention policy, access logging, privacy notice and legal basis for collecting business documents, and test upload/download limits on the actual hosting plan.
- The first implementation stores encrypted-transport document bytes in the private MongoDB collection using the existing application database. Production deployment should be reviewed for at-rest encryption, retention/deletion policy and file-size limits.
