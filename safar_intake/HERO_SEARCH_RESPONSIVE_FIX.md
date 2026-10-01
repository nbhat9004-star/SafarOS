# Hero Search Card — Responsive Layout Fix
**Date:** June 2, 2026
**Scope:** Homepage `app/page.js` hero search card only

---

## 1. Issue reproduced (BEFORE)

Measured the Search button position vs. the form container at 4 viewports:

| Viewport | Form width | Button x | Button width | Button extends to | Form right edge | **Overflow** |
|---|---|---|---|---|---|---|
| 320 mobile | 272 | 37 | 246 | 283 | 296 | -13 ✅ (inside) |
| 768 tablet | 720 | 810 | 140 | 950 | 744 | **+206 🔴** |
| 1024 laptop | 896 | 810 | 140 | 950 | 920 | **+30 🔴** |
| 1440 desktop | 896 | 830 | 140 | 970 | 940 | **+30 🔴** |

**Root cause:** The previous `md:flex-row` kicked in at 768 px, but four fields (Where, Check-in, Check-out, Guests) plus three dividers plus the Search button need ≥ 960 px to fit on a single row. From 768 → 1023 px the inner content overflowed the white `max-w-4xl` (896 px) container. At ≥ 1024 px the form was constrained to 896 px but the children's intrinsic widths summed to ~926 px → button pushed 30 px past the right edge.

---

## 2. Fix applied

Rewrote the hero-search container in `/app/app/page.js` with a three-tier responsive layout:

```jsx
<motion.form className="
  ... w-full max-w-4xl
  flex flex-col gap-2          /* base: column stack */
  lg:flex-row lg:items-stretch /* lg+: horizontal row */
  p-3 lg:p-2
">
  {/* Field group: stacks on mobile, 2x2 grid on tablet, inline on lg+ */}
  <div className="
    grid grid-cols-1 sm:grid-cols-2  /* tablet → 2-column grid */
    lg:flex lg:flex-1 lg:items-stretch
    gap-2 lg:gap-0 min-w-0
  ">
    {/* Where, Check-in, Check-out, Guests — each: min-w-0 lg:flex-1 */}
    {/* Dividers: hidden lg:block self-center shrink-0 */}
  </div>
  <Button type="submit"
    className="rounded-2xl ...
      h-12 lg:h-auto lg:min-h-14
      px-5 lg:px-7
      shrink-0
      w-full lg:w-auto"
  >
    <Search className="size-5 mr-2" /> <span>Search</span>
  </Button>
</motion.form>
```

### Key changes
| Concern | Before | After |
|---|---|---|
| Breakpoint for horizontal layout | `md:flex-row` (768 px) | `lg:flex-row` (1024 px) — gives content room to breathe |
| Tablet 640–1023 px | Single overflowing row | Clean **2 × 2 grid** of fields + full-width Search button below |
| Mobile < 640 px | Column stack but Search icon-only | Column stack + **full-width Search button with label** |
| Field min-width | none → caused intrinsic-width overflow | `min-w-0` on every field, `truncate` on the "Where" input |
| Dividers | `hidden md:block` (visible at 768 px even when content overflows) | `hidden lg:block self-center shrink-0` (only when really horizontal) |
| Button | `flex-1` greedy, no `shrink-0` → could grow & push out | `shrink-0 w-full lg:w-auto` — full-width when stacked, auto when inline |
| Where input placeholder | "Srinagar, Gulmarg, Pahalgam..." (caused truncation at 320 px) | "Srinagar, Gulmarg..." + `truncate` class |
| Guest counter | `w-10 text-center` (caused wrap on narrow rows) | `whitespace-nowrap` |

No other elements (colors, shadows, font sizes, gradients, glass effect, animations) were touched.

---

## 3. Verification (AFTER)

Re-measured the same 4 breakpoints — every one passes:

| Viewport | Form size | Button size | Layout | h-scroll | Status |
|---|---|---|---|---|---|
| 320 mobile | 272 × 350 | 246 × 48 | Column stack (5 elements) | False | ✅ CONTAINED |
| 768 tablet | 720 × 213 | 694 × 48 | 2 × 2 grid + full-width button | False | ✅ CONTAINED |
| 1024 laptop | 896 × 84 | 140 × 66 | Single row, 4 fields + button | False | ✅ CONTAINED |
| 1440 desktop | 896 × 84 | 140 × 66 | Single row, 4 fields + button | False | ✅ CONTAINED |

Zero horizontal page scroll at any breakpoint. The Search button stays **fully inside the rounded white card** at every size.

### Functional end-to-end test
Filled `Gulmarg` + `2099-12-01` → `2099-12-05`, pressed Enter → navigated to:
```
/explore?location=Gulmarg&checkIn=2099-12-01&checkOut=2099-12-05
```
→ Explore page rendered with **2 Gulmarg-matching listings** (Pinepeak Snow Cabin, Gulmarg Gondola) and the active-search date chip visible. **Submission still works perfectly.**

---

## 4. Screenshots

| Breakpoint | File |
|---|---|
| 320 px mobile | `/tmp/after_mobile_320.jpg` |
| 768 px tablet | `/tmp/after_tablet_768.jpg` |
| 1024 px laptop | `/tmp/after_laptop_1024.jpg` |
| 1440 px desktop | `/tmp/after_desktop_1440.jpg` |
| Functional flow (Gulmarg submit → Explore) | `/tmp/explore_gulmarg_result.jpg` |

(Saved with `quality=30` thumbnails — see Playwright test output above.)

---

## 5. Files changed
```
M  app/page.js   (single search-card JSX block in the HERO section — ~70 lines diff)
```

Nothing else touched. Design, branding, shadows, glass effect, hover states, animations, and form submission logic are identical to before.
