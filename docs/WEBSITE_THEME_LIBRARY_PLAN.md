# Website Theme Library — Implementation Plan

## Purpose
Add a centrally managed, Super Admin-controlled library of travel-agency website themes and reusable page templates. Published agency websites must be mobile-first and usable in a browser without requiring a native app.

## Current code findings
- The active app has a platform Super Admin UI in `components/safaros/platform-admin.jsx`, served at `/admin`, with a dedicated platform session and `/api/platform/*` API.
- The active API already has tenant-scoped website settings and pages in `websiteSettings` and `websitePages`, accessed through `/api/website/*`.
- Public agency website rendering exists at `app/site/[slug]/page.js`, which fetches `/api/public/site/:slug`.
- The existing public renderer currently uses mostly inline styles and a desktop-oriented horizontal navigation. It does not currently implement a full visual theme system or responsive navigation.
- The repository also contains older Website Builder routes under `safar_intake/`; those are legacy and must not be treated as the active app without verification.

## Guardrails
- Extend the active app only; do not duplicate the legacy builder.
- Do not overwrite existing agency website settings or pages when adding demo themes.
- Keep global theme definitions separate from agency-owned website data.
- Every Super Admin mutation must require platform authorization and create a platform audit log.
- Agency editing must remain scoped to the authenticated agency; never accept agencyId from the browser as the source of tenant authorization.
- Do not claim custom-domain verification, HTTPS, bookings, or enquiries work until the end-to-end paths are implemented and verified.
- No testing agents. Keep work in small, reviewable changes and avoid unrelated refactors.

## Theme Library requirements
### Super Admin
- Add a `Website Themes` section to the platform admin navigation.
- List themes and page templates with name, category, thumbnail/preview, version, status, and last updated date.
- Preview a theme, create a theme, edit metadata/design tokens/sections, duplicate a theme, activate/deactivate it, and mark a default theme.
- Provide a page-template library so reusable hero, destination grid, package cards, testimonials, FAQ, contact, and footer sections can be managed independently.
- Record create/update/duplicate/status changes in platform audit logs.
- Do not expose internal secrets or allow untrusted raw scripts to be injected into published websites.

### Starter theme catalogue
Seed catalogue definitions idempotently, without creating or overwriting any agency website:
1. Luxe Voyage — luxury journeys
2. WildTrail — adventure and outdoors
3. Atlas Journeys — modern curated holidays
4. Coastline — beach and island holidays
5. Roots & Routes — culture and regional travel
6. Happy Trails — family and group travel
7. Meridian — corporate travel

Each theme needs its own visual identity, typography, colour tokens, section layouts, responsive rules, and safe demo content. A theme definition must be versioned and independently editable.

### Agency Website Builder
- Show only active themes available for agency selection.
- Allow selecting a theme and creating an agency-owned editable copy; later edits to the global theme must not silently overwrite agency customizations.
- Allow editing page text, images, colours, typography, navigation, sections, page order, and visibility.
- Provide desktop/tablet/mobile preview modes and draft/publish/rollback states.
- Keep demo content clearly marked and isolated from real agency packages, clients, leads, bookings, and enquiries.
- When connecting real packages, query only the current agency's own data.
- Provide a clear custom-domain setup flow with DNS instructions and truthful status reporting.

## Mobile-first acceptance criteria
- No horizontal page overflow at 320px, 360px, 390px, 768px, and desktop widths.
- Responsive navigation works by touch and keyboard.
- Images maintain aspect ratio and lazy-load where appropriate.
- Text, buttons, forms, cards, menus, and dialogs remain readable and usable on small screens.
- Package details and enquiry forms work without a native app.
- Avoid app-install blockers; optionally support browser Add to Home Screen where the platform supports it.
- Respect reduced-motion preferences and accessible focus states.
- Mobile layouts are part of the shared theme contract, not a one-off theme patch.

## Delivery order
1. Confirm active API dispatch and platform RBAC/audit conventions.
2. Add a versioned global theme catalogue and platform-admin API routes.
3. Add the Super Admin Theme Library UI and audit logging.
4. Add the agency theme-selection/copy/customization workflow without changing existing agency sites.
5. Refactor the public site renderer to a responsive, safe, theme-driven renderer.
6. Add reusable page templates and the seven starter themes.
7. Add domain workflow only after the current hosting/domain routing constraints are confirmed.
8. Manually verify critical flows in a real browser; do not use testing agents.

## Not yet implemented
This document is a scope and implementation plan only. It does not itself add the Super Admin screen, API routes, theme catalogue, editor, or responsive renderer.
