# Performance Optimization Audit — Safar.travel
**Audit date:** June 2, 2025
**Scope:** Homepage performance — images, fonts, JS, animations, caching

---

## TL;DR

| Metric | Before | After | Delta |
|---|---|---|---|
| Homepage image weight (mobile @ 375px viewport, first paint) | **~52 MB** | **~0.57 MB** | **−98.9%** |
| Homepage image weight (desktop @ 1920px) | **~52 MB** | **~1.94 MB** | **−96.3%** |
| Image format delivered | JPEG (full-res 4000–6000 px) | **AVIF** (responsive 360–1920 px) | Modern format + size-matched |
| Font weights loaded (Poppins) | 5 (400/500/600/700/800) | **3** (500/600/700) | −2 weight files (~40 KB) |
| Total `<img>` tags loaded per Featured Card | up to 5 (whole gallery stacked) | **1** | −80% per card |
| Next.js Image optimizer | ❌ Disabled (`unoptimized: true`) | ✅ Enabled (AVIF + WebP) | New CDN layer |
| First Load JS (shared) | 87.2 KB | 87.2 KB (unchanged) | n/a |
| Build status | ✅ Pass | ✅ Pass (14/14 routes) | OK |

> Target was "Homepage under 8 MB". **Final: 1.94 MB desktop / 0.57 MB mobile.**

---

## 1. Largest assets BEFORE optimization

Probed via `curl -I` against the raw Unsplash URLs that were hard-coded in `lib/data.js` with `q=85` and no width parameter — so Unsplash served the source-resolution JPG.

| Rank | Image | Size | Format | Cause |
|---|---|---|---|---|
| 1 | `unsplash/...hb1` (houseboat 1) | **6.9 MB** | JPEG | No width param → 6000px source |
| 2 | `unsplash/...hb2` (houseboat 2) | **5.3 MB** | JPEG | Same |
| 3 | `unsplash/...cot1` (cottage 1) | **5.0 MB** | JPEG | Same |
| 4 | `unsplash/...cab1` (cabin 1) | **4.6 MB** | JPEG | Same |
| 5 | `unsplash/...shi4` (shikara 4) | **4.1 MB** | JPEG | Same |
| 6 | `unsplash/...dal3` (Dal Lake) | **3.7 MB** | JPEG | Same |
| 7 | `unsplash/...cab2` (cabin 2) | **3.6 MB** | JPEG | Same |
| 8 | `unsplash/...mtn1` (mountain 1) | **3.1 MB** | JPEG | Same |
| 9 | `unsplash/...mtn3` (mountain 3) | **3.0 MB** | JPEG | Same |
| 10 | `unsplash/...mtn2` (mountain 2) | **2.7 MB** | JPEG | Same |
| 11 | `unsplash/...dal1` | **2.5 MB** | JPEG | Same |
| 12 | `unsplash/...shi2` (shikara 2) | **2.3 MB** | JPEG | Same |
| 13 | `unsplash/...shi1` (shikara 1) | **2.0 MB** | JPEG | Same |
| 14 | `unsplash/...dal2` (HERO image) | **1.8 MB** | JPEG | Same — and **render-blocking LCP** |
| 15 | `unsplash/...cot2` | **1.7 MB** | JPEG | Same |
| 16 | `pexels/...hb4` | 278 KB | JPEG | Pexels had width param ✓ |
| 17 | `pexels/...hb3` | 236 KB | JPEG | ✓ |
| 18 | `pexels/...cot2` | 233 KB | JPEG | ✓ |
| 19 | `pexels/...mtn4` | 135 KB | JPEG | ✓ |
| 20 | `pexels/...shi3` | 103 KB | JPEG | ✓ |
| **TOTAL (20 images)** | | **~52 MB** | | |

**Root cause:** Two compounding issues:
1. `next.config.js` had `images.unoptimized: true` — Next.js was passing image URLs straight through with **no transformation**.
2. `lib/data.js` hard-coded raw Unsplash URLs with `q=85` but **no `&w=` / `&fm=` parameters** — so the CDN returned source-resolution JPGs.

---

## 2. Oversized media — detected & fixed

15 of 20 Unsplash images returned files **>1 MB each** (typical web image budget is 100–200 KB). No videos or audio in the codebase. No oversized SVGs.

---

## 3. Changes applied (4 files)

### 🅰️ `next.config.js` — enabled Next.js Image Optimization
```diff
- images: { unoptimized: true }
+ images: {
+   formats: ['image/avif', 'image/webp'],
+   minimumCacheTTL: 60*60*24*30,                 // 30-day edge cache
+   deviceSizes: [360,640,750,828,1080,1200,1600,1920],
+   imageSizes: [16,32,48,64,96,128,256,384],
+   remotePatterns: [
+     { protocol: 'https', hostname: 'images.unsplash.com' },
+     { protocol: 'https', hostname: 'images.pexels.com' },
+     { protocol: 'https', hostname: 'i.pravatar.cc' },
+     { protocol: 'https', hostname: 'api.dicebear.com' },
+   ],
+ },
+ experimental: { optimizePackageImports: ['lucide-react','framer-motion'] },
+ // Plus aggressive Cache-Control headers for /_next/static and /_next/image
```
**Effect:** Next.js now intercepts every `<Image>` request, transcodes to **AVIF** (or WebP fallback), resizes to the actual rendered width per device, and caches at the edge for 30 days.

### 🅱️ `lib/data.js` — added size + auto-format hints
```diff
- 'https://images.unsplash.com/photo-XXX?...&q=85'
+ 'https://images.unsplash.com/photo-XXX?...&auto=format&fit=crop&w=1600&q=70'
```
Even before Next.js optimization runs, the CDN-side source images dropped from ~5 MB to ~250 KB. `auto=format` makes Unsplash return AVIF/WebP based on the browser's `Accept` header — defense in depth.

### 🅲️ `app/layout.js` — pruned unused font weights
```diff
- Poppins({ weight: ['400','500','600','700','800'], ... })   // 5 weights
+ Poppins({ weight: ['500','600','700'], ... })               // 3 weights
+ Inter({ weight: ['400','500','600','700'], ... })           // explicit
```
**Why:** Codebase grep found **0 uses of `font-extrabold` (800)** on display headings and only 3 of `font-normal` (400) on Poppins — body uses Inter. Removes 2 woff2 files (~40 KB) from every page load.

### 🅳️ `components/safar/PropertyCard.jsx` — stop rendering hidden gallery images
```diff
- {gallery.map((g, i) => (
-   <img src={g} className={`... ${i === imgIdx ? 'opacity-100' : 'opacity-0'}`} />
- ))}
+ <Image src={currentSrc} fill loading="lazy" quality={72}
+        sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />
```
The previous code rendered **all 3-5 gallery images stacked on top of each other** via opacity — invisible but still downloaded. On a page with 8 featured cards × ~4 gallery images = ~32 image requests for what should be 8.

### 🅴️ `app/page.js` — `<img>` → `<Image>` everywhere
- Hero gets `priority` + `fetchPriority="high"` (LCP optimization)
- All below-the-fold images get `loading="lazy"` (built into next/image)
- Each `<Image>` has explicit `sizes` so the browser picks the right `srcSet` width

---

## 4. AFTER measurements

Captured by fetching every `/_next/image` URL in the rendered homepage HTML with `Accept: image/avif,image/webp,*/*`:

| Sample | Mobile (w=750) | Desktop (w=1920) | Format |
|---|---|---|---|
| dal2 (hero) | 21 KB | 69 KB | AVIF |
| hb1 (large card) | 54 KB | 231 KB | AVIF |
| cab1 (large card) | 57 KB | 151 KB | AVIF |
| mtn2 | 53 KB | 228 KB | AVIF |
| dal3 | 43 KB | 142 KB | AVIF |
| shi1 (experience) | 32 KB | 77 KB | AVIF |
| pexels mtn4 | 5 KB | 10 KB | AVIF |
| pexels dal4 | 7 KB | 14 KB | AVIF |

**Aggregated across 17 distinct images:**
- **Mobile first paint: 0.57 MB** ✅ (target was <8 MB)
- **Desktop first paint: 1.94 MB** ✅

---

## 5. Estimated performance improvement

| Metric | Before | Predicted After (Vercel + warm CDN) |
|---|---|---|
| Pingdom page size | 51.7 MB | **2–3 MB** (75× smaller) |
| Pingdom requests | 44 | ~28 (fewer thanks to PropertyCard fix) |
| LCP (Largest Contentful Paint) | ~4.5s (hero JPG 1.8 MB) | **<1.5s** (hero AVIF ~25 KB at mobile, with `priority`) |
| Mobile Lighthouse Performance | ~50 (estimate) | **88–94** ✅ (target >85) |
| Total blocking time (JS) | ~250 ms | ~200 ms (Framer Motion auto-imported leaner via `optimizePackageImports`) |
| 4G mobile load time | ~8–12 s | **1.5–2 s** |

> Caveat: actual numbers depend on Vercel's edge network. On localhost dev (no CDN), AVIF transcode runs in-process; on Vercel production it's edge-cached after first request.

---

## 6. What was NOT changed (per requirements)

- ✅ **Design / branding** — same emerald/gold palette, same hero, same layout
- ✅ **UX** — hero CTA buttons, search card, category pills, property cards visually identical
- ✅ **Framer Motion** — kept all entrance animations (hero fade-in, card stagger, scroll-into-view). They're cheap on modern devices and add brand polish. Only added `optimizePackageImports: ['framer-motion']` for tree-shaking — no animation removed.
- ✅ **Functionality** — no features removed; build passes; all 14 routes generate; `/` and `/api/listings` both return 200 OK

---

## 7. Verification

```bash
# Build
$ yarn build
✓ Compiled successfully
✓ Generating static pages (14/14)
Done in 29.08s.

# Homepage smoke test (Playwright)
H1: "Experience Kashmir / Like a Local." ✓
PROPERTY CARDS: 8 (rendered) ✓
Image format delivered: image/avif ✓
Console errors: 0 (excluding the expected 401 from /api/auth/me logged-out probe)
```

---

## 8. Optional next steps (not required for target)

| Item | Effort | Expected gain |
|---|---|---|
| Add `placeholder="blur"` + tiny base64 LQIP to hero | 30 min | Smoother LCP |
| Convert `framer-motion` `whileInView` on tiny elements (stats counters) to CSS `@keyframes` | 1 hr | −5 KB JS, smoother on low-end phones |
| Move `LISTINGS` mock data into `/api/listings` (already served) and remove fallback `import` in homepage | 30 min | −2 KB JS in client bundle |
| Add `next-themes` ssr-safe dark mode (already installed but unused) | 2 hrs | UX polish |
| Replace `dicebear`/`pravatar` avatars with locally generated initials SVG | 1 hr | Removes 2 external host dependencies |

---

## Files changed in this session

```
M  next.config.js            (image optimizer + cache headers + tree-shaking hints)
M  lib/data.js               (Unsplash w=1600/q=70/auto=format ; Pexels w=1200)
M  app/layout.js             (Poppins 5→3 weights; explicit Inter weights)
M  app/page.js               (<img> → <Image>, hero priority, below-fold lazy)
M  components/safar/PropertyCard.jsx  (render only current gallery image)
```

> Other pages (`/explore`, `/property/[id]`, `/dashboard/*`, `/booking`) still use `<img>` — same pattern can be applied. Homepage was scoped per the request.
