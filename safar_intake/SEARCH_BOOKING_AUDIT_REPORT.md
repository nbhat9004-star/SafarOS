# Search & Booking System Audit + Fix Report
**Date:** June 2, 2026
**Scope:** Homepage search · Property page · Booking flow · Booking dashboards · MongoDB persistence · Overlap prevention
**Status:** ✅ All confirmed issues fixed and tested

---

## 1. What was broken

### 🔴 SEARCH SYSTEM
| # | Surface | Bug |
|---|---|---|
| S1 | Homepage hero "search card" | "Where", "When", "Guests" were **non-interactive `<div>`s** with hardcoded placeholder text. No state. |
| S2 | Homepage Search button | A plain `<Link href="/explore">` — passed zero parameters to /explore |
| S3 | `/api/listings` | No support for `checkIn`, `checkOut`, or `guests` query params — couldn't do availability-aware search |
| S4 | `/api/listings/:id/availability` | Endpoint did not exist — UI couldn't fetch booked date ranges |
| S5 | `/explore` page | Did not read URL params on mount, so search submission from anywhere wouldn't pre-fill filters |

### 🔴 BOOKING SYSTEM
| # | Surface | Bug |
|---|---|---|
| B1 | Booking page "calendar" | A **fake 28-day grid** that visually highlighted days 11–14 — completely non-interactive. Users could not pick or change dates. |
| B2 | Booking page Review/Summary/Confirmation | All showed hardcoded **"12 – 16 Jul"** and **"× 4 nights"** instead of using the `checkIn`/`checkOut`/`nights` state |
| B3 | Property page sidebar | Hardcoded "Check-in: 12 Jul 2025 / Check-out: 16 Jul 2025"; nights hardcoded to 4; Reserve link did **not** pass dates to `/booking` |
| B4 | Booking page | No awareness of already-booked dates — users could submit overlapping requests and only learn at API time |
| B5 | API `POST /api/bookings` | `Number(guests) \|\| 1` silently coerced `guests=0` to `1` instead of returning a 400 validation error |

---

## 2. What was fixed

### 🟢 Files changed (7)

| File | Change |
|---|---|
| `app/page.js` | Hero search card converted to real inputs: text `<input>` for location, two `<input type="date">` for check-in/out (with min-date constraints), guest stepper. Submit handler builds query string and calls `router.push('/explore?location=...&checkIn=...&checkOut=...&guests=...')` |
| `app/explore/page.js` | Reads URL params on mount (location, checkIn, checkOut, guests). Adds an "Active search" chip row showing the date range + guest count, each with an X to clear. Passes all four to `/api/listings`. Keeps URL in sync via `router.replace`. Wrapped in `<Suspense>` for `useSearchParams` |
| `app/property/[id]/page.js` | Replaced hardcoded date display with real `<input type="date">` pickers. Computes `nights` from state. Reserve button URL now includes `&checkIn=...&checkOut=...`. Fetches `/availability` and shows an amber warning + disables Reserve when picked dates conflict with an existing booking |
| `app/booking/page.js` | Fully rewritten. Real `<input type="date">` pickers (mobile-friendly OS-native picker). Reads `checkIn`/`checkOut`/`guests` from URL. Fetches availability. Live green "Available · N nights" badge or amber "These dates are not available" warning with the conflicting booking range. Continue button disabled when invalid/conflict. Review/Summary/Confirmation now use real state values + `Intl.toLocaleDateString` formatting. Guest stepper respects listing capacity. Wrapped in `<Suspense>` |
| `app/api/[[...path]]/route.js` | `GET /api/listings` accepts new query params: `checkIn`, `checkOut`, `guests`. When date range supplied, performs a single MongoDB roundtrip to find listings with overlapping `pending`/`approved` bookings, then `$nin`s them from the listing filter. `guests` filter uses `$or` to keep listings without an explicit capacity (experiences/tours). Also added `GET /api/listings/:id/availability` returning `bookedRanges`. Fixed `guests=0` validation bug (now returns 400). |
| `lib/listings-api.js` | New `bookingsApi.availability(listingId)` helper + new `useAvailability(listingId)` hook (auto-refresh on listingId change) |
| `memory/test_credentials.md` | Stored fresh traveler + host test credentials for future automated tests |

---

## 3. What is fully working (verified)

### ✅ Backend — 15/15 tests passed
Verified by the testing agent with `python requests`:

| Area | Test | Result |
|---|---|---|
| Search | Location search (Srinagar) | 7 results, all locations contain Srinagar |
| Search | `guests=4` filter | Only listings with capacity ≥ 4 returned |
| Search | `guests=99` (extreme) | Properly filters to smaller subset |
| Search | Combined location + price + category + subcategory | Cottage-only results |
| Search | `checkIn`/`checkOut` date range filter | Returns listings, future-far dates show all available |
| Booking | Auth required → 401 | ✅ |
| Booking | Missing listingId → 400 | ✅ |
| Booking | Past check-in date → 400 | ✅ |
| Booking | check-out ≤ check-in → 400 | ✅ |
| Booking | `guests=0` → 400 (was a bug, now fixed) | ✅ |
| Booking | Successful creation → 201 with bookingId, status='pending', nights & totalPrice correct | ✅ |
| Booking | Overlapping dates → **409** "These dates overlap" | ✅ |
| Booking | Non-overlapping (back-to-back) booking → 201 | ✅ |
| Availability | `GET /api/listings/:id/availability` | Returns bookedRanges array with status |
| Dashboard | Traveler sees only own bookings | ✅ (proper `travelerId` filter) |
| Dashboard | Host sees only received bookings | ✅ (proper `hostId` filter) |
| Dashboard | Cross-isolation: traveler with `?view=received` still gets own | ✅ |
| Workflow | Traveler tries `PATCH status=approved` → 403 | ✅ |
| Workflow | Traveler cancels own booking → 200 | ✅ |
| Workflow | Availability auto-excludes cancelled bookings | ✅ |

### ✅ Frontend — Verified via Playwright + screenshots

| Surface | Evidence |
|---|---|
| Homepage hero search renders interactive | Screenshot shows "Pahalgam" typed in Where, "08/10/2099" check-in, "08/15/2099" check-out, "3 guests" — all editable |
| Form submission persists in URL | `/explore?location=Pahalgam&checkIn=2099-08-10&checkOut=2099-08-15&guests=3` |
| Explore page reads URL → filters listings | Result count drops from 12 → 2 (only Pahalgam listings); "Active search" chips show dates + guests |
| Property page date pickers work | Screenshot shows two real date inputs, Reserve link rewritten with selected dates |
| Booking page reads URL dates | Screenshot at step 1 shows 09/01/2099 → 09/07/2099 with "Available · 6 nights" green badge |
| Booking page computes nights + total live | Sidebar shows Nights: 6, Total: ₹46,496 (6 × 6800 + 12% tax + 800 cleaning) |
| Booking page shows already-booked chips | Two "10 Sept 2099 → 15 Sept 2099" / "15 Jun 2099 → 20 Jun 2099" chips visible |
| Booking page conflict detection | Picking 09/12/2099 → 09/18/2099 shows amber warning "These dates are not available — Conflicts with a pending booking from 10 Sept 2099 to 15 Sept 2099"; Continue button disabled |
| Production build | `yarn build` passes — all 14 routes compiled cleanly in 26s |
| Mobile date pickers | `<input type="date">` uses native OS pickers on mobile (iOS/Android wheel pickers) — no JS library overhead |

### ✅ MongoDB persistence
Bookings written to `safar.bookings` collection with:
- `bookingId` (UUID, unique)
- `checkInDate` / `checkOutDate` as **real Date objects** (not strings)
- `nights`, `totalPrice` correctly computed server-side
- `travelerId`, `hostId`, `listingId` all stored for dashboard queries
- `status` lifecycle: `pending` → `approved`/`rejected`/`cancelled`
- `createdAt`/`updatedAt` timestamps

---

## 4. What still requires implementation

These are out-of-scope for the booking/search audit but worth noting:

| Item | Why deferred |
|---|---|
| Per-day visual blocking inside the date picker | `<input type="date">` is native — to grey out individual days we'd need a custom calendar component (e.g. `react-day-picker`). Current solution shows booked ranges as chips + warns on conflict — same protection, lighter bundle |
| Email notifications when host approves/rejects | Needs SMTP integration (e.g. SendGrid playbook) — separate task |
| Stripe / Razorpay payment integration | "Pay online" step currently shows demo card fields; no real payment processing — separate task |
| Multi-room / multi-unit availability | Current model treats each listing as 1 unit. To support hotels with N rooms, need a `units` field and counted overlap |
| Listing cache invalidation | New host listings start as `pending`; admin promotion not built (covered earlier) |
| Concurrent-booking race condition | The overlap check + insert is two ops. Under heavy concurrency two travelers could pass the check and both insert. Fix would need a MongoDB transaction or a uniqueness-conditional insert |
| Date-range visual highlighting (e.g. "available green"/"booked red" gradient) | Same reason as #1 — needs custom calendar |

None of these block normal operation.

---

## 5. Screenshots / test evidence

Stored in `/tmp/` during this session:

| File | Caption |
|---|---|
| `/tmp/01_home_search_filled.jpg` | Homepage hero search with Pahalgam + dates + 3 guests filled |
| `/tmp/02_explore_filtered.jpg` | Explore page reading URL params, showing Active Search chips and 2/12 matching listings |
| `/tmp/03_property_dates.jpg` | Property page with two real date pickers and updated Reserve URL |
| `/tmp/04_booking_step0.jpg` | Booking page step 0 showing "Available · 6 nights" badge + already-booked chips |
| `/tmp/05_booking_conflict.jpg` | Booking page showing amber conflict warning + disabled Continue button |

Backend test report (15/15 pass): test agent's report appended into `test_result.md`.

---

## 6. Performance preserved

All performance optimizations from the previous round remain intact:
- Next/Image AVIF transcoding still active
- Lazy loading on below-fold property cards
- Poppins font weights still trimmed to 3
- Build size unchanged: `/booking` route still under 7 kB; `First Load JS shared` still 87.2 kB
