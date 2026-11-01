# SafarOS Travel Inventory Engine — Implementation Plan

**Status:** Design baseline / implementation preparation  
**Branch:** `feature/travel-inventory-engine`  
**Base:** `main`  
**Scope:** Add reusable, agency-owned travel inventory without breaking existing quotations, packages, itineraries, bookings, suppliers, or finance records.

## 1. Goals

Create one reusable source of truth for travel services so an agency can maintain supplier-backed inventory and use it consistently in quotations, packages, itineraries, and bookings.

Initial inventory types:

- Accommodation: properties, room types, meal plans, occupancy and seasonal/date-based rates.
- Activities and experiences: duration, inclusions, exclusions, meeting point, capacity and rate plans.
- Transport: vehicle/service type, route or zone, capacity, transfer type and rate plans.
- Optional later extension: guides, restaurants, tickets and other bookable services.

The inventory is agency-private by default. Cross-agency/public marketplace exposure must be an explicit future publishing capability, not an accidental consequence of shared collections.

## 2. Existing architecture constraints

- The current application uses MongoDB collections and agency-scoped records.
- Follow the existing `tenantFilter(session, ...)` and `withAgency(session, ...)` conventions for every agency-owned read/write.
- Reuse existing supplier records; validate supplier references against the current agency before saving.
- Keep the current quotation and booking server-side total calculators authoritative. Never trust totals calculated by the browser.
- Existing records without inventory references must continue to load and edit.
- Do not perform destructive migrations, rewrite historical bookings, or change production/demo records as part of rollout.
- The current main API route is a large catch-all. Implement new inventory logic in a dedicated module/helper and keep route wiring small; do not combine this feature with a broad API refactor.

## 3. Proposed data model

Use separate collections by service domain initially, sharing common fields and validation conventions. This keeps domain-specific fields typed and avoids one giant unvalidated polymorphic document.

### Common fields

- `id`: stable UUID
- `agencyId`: tenant owner
- `supplierId`: optional reference to an agency-owned supplier
- `name`, `description`, `status` (`draft`, `active`, `archived`)
- `destination`, `location`, optional coordinates
- `images`: validated media metadata/URLs; no arbitrary executable content
- `tags`, `internalNotes`
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- optional `externalRef` for controlled import/deduplication

### Collections

**`inventoryAccommodations`**
- property type, address, check-in/out times, amenities, policies, star/category label
- room types as child records or embedded bounded array
- meal plans and occupancy limits

**`inventoryActivities`**
- activity type, duration, age/fitness notes, inclusions/exclusions
- meeting point, operating days, capacity and cancellation policy

**`inventoryTransport`**
- vehicle/service type, passenger and luggage capacity
- route/zone coverage, transfer type, pickup/drop rules

**`inventoryRatePlans`**
- `serviceType`, `serviceId`, currency, unit, basis (per person/room/vehicle/trip)
- supplier net cost and optional public/selling guide price
- validity window, weekday/season rules, occupancy or quantity bands
- blackout dates, minimum/maximum stay or booking notice where relevant
- tax treatment reference and cancellation terms
- rate status and audit fields

Rate plans must support multiple seasons and currencies. Date overlap and priority resolution rules must be deterministic and tested. Store monetary values as decimal-safe numeric values using the application's existing rounding conventions; do not use floating-point arithmetic for multi-step financial aggregation without explicit rounding.

## 4. API surface (proposed)

All endpoints require staff authentication, appropriate RBAC permissions and agency scoping.

- `GET /inventory/summary`
- `GET|POST /inventory/accommodations`
- `GET|PATCH /inventory/accommodations/:id`
- `GET|POST /inventory/activities`
- `GET|PATCH /inventory/activities/:id`
- `GET|POST /inventory/transport`
- `GET|PATCH /inventory/transport/:id`
- `GET|POST /inventory/rate-plans`
- `GET|PATCH /inventory/rate-plans/:id`
- `POST /inventory/import/preview` (validate only; no writes)
- `POST /inventory/import/commit` (explicit user-confirmed import)
- `GET /inventory/export` (agency-scoped export)

List endpoints should support bounded pagination, search, status, supplier, destination/type and date-effective filters. Do not return unbounded collection contents.

## 5. RBAC and security

Add explicit permissions such as:

- `inventory:read`
- `inventory:create`
- `inventory:update`
- `inventory:archive`
- `inventory:import`
- `inventory:export`

Map permissions into existing roles deliberately. Default-deny unknown roles/permissions. Validate every supplier/service reference within the active agency. Do not accept client-supplied `agencyId`, ownership, audit fields or computed price totals.

Imports must have preview and validation reports, row limits, file-size limits, duplicate detection and a confirmation step. Never execute spreadsheet formulas or macros. Escape imported text on output.

## 6. Pricing and quotation integration

- Add an optional `inventoryRef` to quotation service items: `serviceType`, `serviceId`, `ratePlanId`, `rateDate`, `rateCurrency`, `unitCostSnapshot`, `sellingPriceSnapshot`, `unit`, and source label.
- On selection, resolve the inventory and effective rate on the server, verify tenant ownership and snapshot the selected values into the quotation.
- Existing manual line items remain supported.
- A later supplier rate change must not silently rewrite a sent/approved quotation or existing booking.
- Recalculate all quotation totals on the server using the existing `computeQuotation` logic, extended only with well-tested conversion/markup/tax rules.
- Do not conflate supplier net cost, suggested selling price and the final customer price.

## 7. UI plan

Add an Inventory area under the existing agency workspace navigation:

1. Inventory overview with counts and recently updated items.
2. Accommodation list and detail/editor, including room types and rate plans.
3. Activities list and detail/editor.
4. Transport list and detail/editor.
5. Rate calendar/table with effective dates, currency and supplier cost.
6. Import wizard: upload → map columns → preview errors/duplicates → confirm import.
7. Reusable inventory picker in quotation/package workflows.

Keep forms progressive and mobile-responsive. Avoid adding all optional fields to the first screen; use sections/tabs for operational details, policies, media and rates.

## 8. Test and acceptance criteria

### Tenant isolation
- Agency A cannot read, update, archive, export or reference Agency B inventory.
- A supplier ID belonging to another agency is rejected.
- Client-supplied agency IDs are ignored.

### CRUD and validation
- Create, read, update, archive and restore/list filtering work for each inventory type.
- Required fields, lengths, dates, currency codes, quantities and capacities are validated.
- Duplicate import rows and overlapping rate windows produce clear validation results.

### Rate resolution
- Correct rate selected for date, weekday, occupancy/quantity and currency.
- Blackout dates and inactive rates are not bookable.
- Deterministic behavior for overlapping effective periods.
- No negative or malformed prices.

### Commercial integrity
- Quotation item stores a price/cost snapshot.
- Changing a rate does not mutate existing quotations/bookings.
- Existing manual quotations still calculate exactly as before.
- All client-submitted totals are ignored and recomputed server-side.

### Regression
- Existing CRM, suppliers, packages, quotations, itineraries, bookings, finance and website builder flows remain unaffected.
- No production or demo data is created/modified by automated tests.
- Build, lint (if configured), unit tests and integration tests pass.

## 9. Delivery sequence

**Phase A — Foundation**
- Add schemas/validators, permission definitions, indexes and tenant-safe service helpers.
- Add tests for isolation and common validation.
- No UI dependency yet.

**Phase B — Inventory CRUD**
- Implement accommodation, activity and transport CRUD plus bounded search.
- Add inventory overview and detail screens.

**Phase C — Rate plans**
- Add seasonal/date-effective rate plans and deterministic rate resolver.
- Add rate management UI and tests.

**Phase D — Quotation integration**
- Add inventory picker and server-side price snapshotting.
- Preserve manual line-item support and existing quotation compatibility.

**Phase E — Import/export**
- Add preview-first spreadsheet import and agency-scoped export.

**Phase F — Hardening**
- Verify mobile UX, performance, indexes, tenant isolation, audit logs and regression suite.
- Prepare a draft PR with test evidence. Do not merge or deploy without explicit approval.

## 10. Explicitly out of scope for this first implementation

- Public marketplace publishing or cross-agency inventory sharing.
- Live supplier APIs/channel managers.
- Real-time hotel/airline inventory feeds.
- Payment collection or supplier settlement automation.
- Automatic tax/legal advice or jurisdiction-specific GST/TCS calculation.
- Destructive changes to existing records or legacy application removal.

These can be designed as later, separately reviewed integrations.
