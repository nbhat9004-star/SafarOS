# SafarOS Website Theme Library — Implementation Plan

## Goal

Build a first-class Website Theme Library managed from Platform Super Admin. Super Admins can maintain reusable themes and page templates; agencies can preview, select, customize, and publish isolated copies. Every public website must be mobile-first and usable in a browser without requiring a native app.

## Confirmed repository findings (main at 61a15dc)

- The current Platform Super Admin UI is `components/safaros/platform-admin.jsx`, routed through `app/admin/page.js`. Its navigation currently includes Dashboard, Agencies, Users, Subscriptions, Plans, AI Platforms, API & Integrations, Integrations, Analytics, Audit Logs, and Platform Settings. No Theme Library navigation item is present in the inspected component.
- The current agency workspace is `components/safaros/app-experience.jsx`.
- A catch-all API lives at `app/api/[[...path]]/route.js`. It has agency-scoped website settings and pages handlers backed by `websiteSettings` and `websitePages`, plus website SEO overview. Settings include a basic `theme` string and colour/font values.
- A public site renderer exists at `app/site/[slug]/page.js`. It currently renders simple header/navigation/content/footer and uses flex navigation without an evident responsive mobile menu in the inspected file.
- The inspected API source did not expose an evident theme-catalog API or public-site endpoint matching the renderer's `/api/public/site/:slug` fetch. This must be reconciled by tracing the full dispatch and route wiring before implementation.
- Legacy Website Builder pages may exist under `safar_intake/`; do not assume they power the active SafarOS app. Reuse only after confirming imports, deployment root, and API compatibility.
- Plan catalog has a `websiteBuilder` feature key and `websitePages` limit, but the source comments state feature enforcement is only a foundation. Do not assume plan entitlements are enforced.

## Proposed user experience

### Platform Super Admin → Website Themes

Add a new protected navigation item and view with:
- Theme cards with name, category, thumbnail/preview, status, version, last updated, and action menu.
- Preview desktop/mobile; search and filter by travel niche and status.
- Create/duplicate/edit/retire a theme, manage reusable page templates and reusable sections, and set a theme as featured/default.
- Draft → preview → publish lifecycle, version history, rollback, and audit logging.
- Explicit separation between platform-owned template records and agency-owned website content.

### Agency Website Builder

- Theme gallery that uses the published platform catalog.
- Selecting a theme creates or updates an agency-owned copy/selection without modifying the shared master.
- Editor for site identity, logo, colours, fonts, hero, sections, images, navigation, pages, destination/package cards, contact details, and SEO.
- Demo content is clearly labelled and safely replaceable. Never seed sample content into an existing agency's live data or overwrite actual packages.
- Use the agency's real packages only through a deliberate mapping/selection action.
- Preview changes before publishing and preserve a rollback path.

### Starter theme catalogue

Begin with seven coherent, complete, distinct travel-business designs:
1. Luxe Voyage — premium/luxury
2. WildTrail — adventure and outdoors
3. Atlas Journeys — contemporary curated holidays
4. Coastline — beach and island escapes
5. Roots & Routes — cultural and regional travel
6. Happy Trails — family and group travel
7. Meridian — corporate travel

These must be real reusable theme configurations and layouts, not seven names pointing to the same generic page. Add future themes through Super Admin data/configuration, not hard-coded navigation branches.

## Mobile-first requirements

- Responsive layouts for narrow phones, tablets, and desktop; no horizontal overflow.
- Accessible, touch-sized controls and mobile navigation.
- Responsive images with appropriate sizes, lazy loading below the fold, and stable aspect ratios.
- Forms and booking/enquiry paths usable with a mobile keyboard and screen reader.
- Good contrast, keyboard focus, semantic headings, accessible labels, reduced-motion support, and sensible loading/error/empty states.
- No native app requirement. A PWA / Add to Home Screen enhancement may be optional later; core website functionality must work in the browser.
- Preview at representative phone/tablet/desktop viewports for every theme before publish.

## Data and security design

Before coding, trace the active API dispatch and authentication helpers. Platform theme CRUD must require a valid platform session and a narrowly scoped platform permission. Public published theme/site reads must expose only published public fields. Agency mutations must use server-derived `agencyId`, tenant filters, input validation, and safe HTML/content rendering. Do not trust client-provided tenant IDs. Keep platform master themes separate from agency theme assignments and page content.

Likely data model (adjust to existing conventions after inspecting `lib/db.js`, route dispatch, and tenant helpers):
- `websiteThemes`: platform-owned theme metadata, schema/config, thumbnail, category, version, status, timestamps.
- `websiteTemplates`: reusable page/section templates associated with a theme and version.
- Agency website assignment/settings: existing `websiteSettings` extended with a stable theme ID/version and publish metadata.
- Agency page/section data: reuse `websitePages` only if its schema supports the needed editable sections; otherwise migrate compatibly with explicit versioning.

Add indexes for stable IDs/slugs and tenant lookup only after reviewing existing indexes and data conventions. Avoid destructive migrations.

## Implementation sequence

1. **Audit dispatch and compatibility (no runtime writes):** map all website-related GET/POST/PUT/DELETE handlers, platform auth checks, public site API, DB indexes, existing UI routes, and deployment root. Confirm whether `safar_intake/` is live or legacy.
2. **Foundation:** define validated theme/template schemas and a protected platform theme catalog API. Add tests or focused verification for platform authorization, published-only public access, and tenant isolation.
3. **Super Admin library:** add navigation and functional list/create/edit/duplicate/publish/retire/preview/version UI wired to the API.
4. **One complete theme:** implement one polished theme and agency editor path end-to-end, with isolated demo data and working preview/publish.
5. **Mobile acceptance:** correct the public renderer's responsive layout and verify core mobile flows before expanding the catalogue.
6. **Expand to seven themes:** build distinct designs on shared reusable primitives and page templates.
7. **Domain and SEO hardening:** verify custom-domain routing, HTTPS status, canonical URLs, metadata, sitemap/robots behavior, and published-site availability; do not show success until confirmed.

## Acceptance criteria

- Super Admin can create, edit, preview, publish, duplicate, and retire a theme through the UI.
- Published themes appear in the agency gallery; drafts do not.
- An agency can customize its own website without changing the platform master or another agency's website.
- Demo content can be reset for a demo workspace, but never silently overwrites live customer content.
- All seven themes are visibly distinct and responsive.
- Public site, package/destination content, enquiry forms, and booking-related paths work in a mobile browser without installing an app.
- Unauthorized users cannot change platform themes; agency users cannot access another agency's records.
- Publish and rollback statuses reflect actual backend outcomes.
- No unrelated modules are changed; no testing agents are launched; keep each Emergent task to at most one credit (this plan itself uses no Emergent credits).

## Important caveats

This is an implementation plan, not a claim that the feature is already built or verified. The first coding step must resolve the API dispatch/public-site wiring and active-vs-legacy builder question. Do not merge or deploy until the changed code has been reviewed and the appropriate focused checks pass.


## Follow-up audit: active API and permission wiring

Further source inspection confirms these details on `main`:

- `GET /api/platform/*` is intercepted first and requires a platform session; the API then calls `platformGet`, which checks `canPlatform(session.role, platformReadPerm(path))`. Unknown paths currently fall back to the dashboard-read permission, so the new theme endpoints must be explicitly mapped to a dedicated permission instead of relying on the fallback.
- `POST /api/platform/*` requires a platform session (apart from the explicit auth endpoints) and dispatches to `platformPost`; `PUT /api/platform/*` similarly dispatches to `platformPut`. Each theme mutation should also enforce a specific `themes:manage` permission in its handler, and each read should require `themes:read`.
- Agency website GET routes are protected by an agency session and `website:read`; writes use `website:manage`. Existing handlers use `tenantFilter(session)` and `withAgency(session, ...)` for agency-scoped records.
- The public endpoint is implemented by `publicGet(db, path)` and serves `/api/public/site/:slug`, with sitemap and robots endpoints. It resolves the agency from its slug and only returns website pages when `websiteSettings.status === 'published'`. The route is real; the earlier audit note should be read as “no theme-catalog API exists yet,” not “the public site API is missing.”
- `app/site/[slug]/page.js` fetches that public endpoint and renders a simple single-page presentation. Its header navigation is a horizontal flex list with fixed padding and no visible mobile menu breakpoint in the inspected source, so responsive redesign is required.
- The current Super Admin navigation in `components/safaros/platform-admin.jsx` does not include a theme-library section. Add it to `NAV`, `TITLES`, and the section-rendering switch/condition only after implementing the matching protected API.
- The active API dispatch already separates platform and agency sessions, which is the right base for shared platform-owned themes plus tenant-scoped agency assignments. Keep the two ownership domains separate.

### Next implementation task

Implement the first vertical slice only: explicit theme permissions, platform-owned theme CRUD with validated fields and audit events, and a Super Admin library view wired to those endpoints. Keep the public renderer and agency editor changes for the next slice, so no incomplete theme can accidentally appear on a published agency site. Do not deploy until focused checks are complete.
