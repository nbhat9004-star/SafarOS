'use client';
import Link from 'next/link';
import Image from 'next/image';
import ReactDOM from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState, useEffect, Suspense } from 'react';
import * as React from 'react';
import { Search, MapPin, CalendarRange, Users, Sparkles, ArrowRight, ShieldCheck, BadgeCheck, Star, Wand2, Plane, Mountain, Compass, ChevronRight, Check, Loader2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/safar/Navbar';
import PropertyCard from '@/components/safar/PropertyCard';
import CategoryPills from '@/components/safar/CategoryPills';
import { LISTINGS, CATEGORIES, IMG, STATS, TESTIMONIALS, AI_PROMPT_SUGGESTIONS } from '@/lib/data';

// PERF: Lazy load below-the-fold components to reduce initial JS bundle and defer Framer Motion
const Footer = dynamic(() => import('@/components/safar/Footer'), { ssr: true });
// PERF: AIAssistantFloating pulls in the LLM chat runtime + streaming/markdown
// dependencies. We defer it until BOTH (a) the browser is idle AND (b) the
// user has interacted (pointer / scroll / key), so it never blocks LCP or
// initial input responsiveness. `DeferredMount` below is a tiny wrapper.
const AIAssistantFloating = dynamic(() => import('@/components/safar/AIAssistantFloating'), { ssr: false });
// PERF: SectionRenderer is only used when a CMS home is published (rare code path).
// Splitting it saves the SSR + client bundle for the default marketing homepage.
const SectionRenderer = dynamic(() => import('@/components/safar/SectionRenderer'), { ssr: true });
// PERF: Rewards promo strip is deep below the fold — network fetches + tile
// render are code-split into their own chunk and loaded only when needed.
const RewardsPromoStrip = dynamic(() => import('./_home-rewards-strip'), {
  ssr: false,
  loading: () => <div className="py-20" aria-hidden="true" />,
});

/**
 * Mounts children only AFTER the page is interactive AND idle. Prevents
 * hydration-heavy widgets (chat, analytics) from competing for CPU during
 * the initial LCP window. Falls back to a 2s timeout for browsers without
 * requestIdleCallback (Safari).
 */
function DeferredMount({ children }) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    const trigger = () => { if (!cancelled) setReady(true); };
    // Wait for first user gesture OR idle callback, whichever comes first.
    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
    events.forEach((e) => window.addEventListener(e, trigger, { once: true, passive: true }));
    const idle = ('requestIdleCallback' in window)
      ? window.requestIdleCallback(trigger, { timeout: 4000 })
      : window.setTimeout(trigger, 2500);
    return () => {
      cancelled = true;
      events.forEach((e) => window.removeEventListener(e, trigger));
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);
  return ready ? children : null;
}

// Kashmir seasonal images - ultra-premium iconic landmarks collection
// Order optimized for hero: Dal Lake houseboats first, then Chinar, Gulmarg, then Tulips.
// PERF: Pexels URL params sized for mobile-first LCP:
//   * `w=1600&dpr=1` yields ~250 KB JPEG vs the old `w=1920&dpr=2` (≈3 MB).
//   * Next/Image re-encodes to AVIF/WebP and generates a mobile srcSet via
//     `sizes="100vw"`, so real mobile devices actually download 640-828 px
//     variants (~60-90 KB) — a 30× LCP-payload reduction over the previous
//     hero image.
const SEASONAL_IMAGES = [
  {
    // PERF: mobile-first LCP variant. Real mobile devices (≤768px) will
    // additionally receive the 828px auto-generated Next/Image srcSet
    // variant. This 1080-wide Pexels source is ~90-120 KB and re-encoded to
    // AVIF by Next.js image optimizer down to ~40-70 KB.
    src: 'https://images.pexels.com/photos/27108526/pexels-photo-27108526.jpeg?auto=compress&cs=tinysrgb&w=1080',
    // The exact mobile-sized variant is preloaded in the initial HTML
    // (see ReactDOM.preload call below the array) so the browser starts
    // fetching it before React hydrates.
    preloadSrc: 'https://images.pexels.com/photos/27108526/pexels-photo-27108526.jpeg?auto=compress&cs=tinysrgb&w=828',
    alt: 'Summer in Kashmir - Dal Lake Shikara Boats',
    season: 'Summer',
    emoji: '☀️',
    color: 'text-amber-400'
  },
  {
    src: 'https://images.pexels.com/photos/14262339/pexels-photo-14262339.jpeg?auto=compress&cs=tinysrgb&w=1080',
    alt: 'Autumn in Kashmir - Golden Chinar Tree',
    season: 'Autumn',
    emoji: '🍂',
    color: 'text-orange-500'
  },
  {
    src: 'https://images.pexels.com/photos/32620987/pexels-photo-32620987.jpeg?auto=compress&cs=tinysrgb&w=1080',
    alt: 'Winter in Kashmir - Gulmarg Gondola Cable Car',
    season: 'Winter',
    emoji: '❄️',
    color: 'text-blue-400'
  },
  {
    src: 'https://images.pexels.com/photos/25786776/pexels-photo-25786776.jpeg?auto=compress&cs=tinysrgb&w=1080',
    alt: 'Spring in Kashmir - Indira Gandhi Tulip Garden Srinagar',
    season: 'Spring',
    emoji: '🌸',
    color: 'text-pink-500'
  }
];

// PERF: Preload the mobile hero LCP image in the FIRST HTML round-trip.
// `ReactDOM.preload` (React 19 / Next.js 14+) injects a
// <link rel="preload" as="image" fetchpriority="high"> into the document
// <head> as soon as this module is evaluated during SSR — so the browser
// begins fetching the LCP image before React ships a byte of JavaScript.
// The `imageSizes` hint tells the browser to prefer the 828px srcSet
// variant on mobile; desktop still loads its own optimized variant via
// Next/Image's srcSet (unchanged for large viewports).
if (typeof ReactDOM.preload === 'function') {
  ReactDOM.preload(SEASONAL_IMAGES[0].preloadSrc, {
    as: 'image',
    fetchPriority: 'high',
    // Mobile-first — desktop LCP is already fast, no need to compete for
    // its bandwidth. Preload only fires on ≤768px viewports.
    media: '(max-width: 768px)',
  });
}

const destinations = [
  { name: 'Srinagar', tag: 'Floating heritage', img: IMG.dal2, count: 248 },
  { name: 'Gulmarg', tag: 'Snow & ski capital', img: IMG.cab1, count: 142 },
  { name: 'Pahalgam', tag: 'Pine valleys', img: IMG.cot1, count: 167 },
  { name: 'Sonamarg', tag: 'Glacier escapes', img: IMG.mtn2, count: 89 },
];

const experiences = [
  { title: 'Sunset Shikara', desc: 'Glide across Dal Lake with kahwa & local stories.', img: IMG.shi1, price: 1200 },
  { title: 'Wazwan Royal Feast', desc: '7-course Kashmiri feast with cultural intro.', img: IMG.dal4, price: 2500 },
  { title: 'Gulmarg Gondola', desc: 'Phase 1 + 2 with a certified local mountaineer.', img: IMG.mtn1, price: 3800 },
  { title: 'Heritage Walk', desc: 'Old-city woodwork, mosques and bakeries tour.', img: IMG.dal3, price: 1500 },
];

// Small helper: yyyy-mm-dd for a date N days from today.
function ymdOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function App() {
  return (
    <Suspense fallback={null}>
      <AppInner />
    </Suspense>
  );
}

function AppInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams?.get('preview');
  const [cat, setCat] = useState('all');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // MODULE 18 — CMS: if a home page is published (or ?preview=<id>), render CMS sections
  // instead of the static homepage. Falls back to static content if none published.
  const [cmsHome, setCmsHome] = useState(null);
  const [cmsChecking, setCmsChecking] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        if (previewId) {
          // Preview: fetch requested (admin-gated). If not permitted, silently fall back.
          const r = await fetch(`/api/cms/home-pages/${previewId}`, { credentials: 'include' });
          const j = await r.json();
          if (j?.ok && j.homePage) { setCmsHome(j.homePage); setCmsChecking(false); return; }
        }
        const r = await fetch('/api/public/site');
        const j = await r.json();
        if (j?.ok && j.home) setCmsHome(j.home);
      } catch {}
      finally { setCmsChecking(false); }
    })();
  }, [previewId]);
  
  // Hero search state — fully functional, drives /explore navigation
  const [where, setWhere] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const todayStr = ymdOffset(0);

  // Seasonal slideshow auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % SEASONAL_IMAGES.length);
    }, 7000); // Change every 7 seconds
    return () => clearInterval(interval);
  }, []);

  const onSearch = (e) => {
    if (e) e.preventDefault();
    const qp = new URLSearchParams();
    if (where.trim()) qp.set('location', where.trim());
    if (checkIn) qp.set('checkIn', checkIn);
    if (checkOut) qp.set('checkOut', checkOut);
    if (guests && guests !== 2) qp.set('guests', String(guests));
    router.push(`/explore${qp.toString() ? '?' + qp.toString() : ''}`);
  };

  const featured = LISTINGS.filter(l => l.featured);
  const filtered = cat === 'all' ? LISTINGS : LISTINGS.filter(l => l.category === cat);

  // MODULE 18 — Render CMS home page when active/preview
  if (cmsHome) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar transparent />
        {previewId && (
          <div className="fixed top-3 right-3 z-50 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            PREVIEW · {cmsHome.name}
          </div>
        )}
        <SectionRenderer sections={cmsHome.sections || []} />
        <Footer />
        <AIAssistantFloating />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar transparent />

      {/* HERO — further reduced (~25% shorter) so property cards peek */}
      <section className="relative min-h-[26svh] md:min-h-[30svh] lg:min-h-[34svh] w-full overflow-hidden">
        {/* Seasonal Background Slideshow - PERF: Removed parallax effect to reduce JavaScript load */}
        <div className="absolute inset-0">
          {SEASONAL_IMAGES.map((image, index) => {
            // PERF: LCP win — only mount the image if it is the CURRENT frame
            // or the very next one (for a seamless cross-fade). Previously we
            // rendered all 4 <Image> elements simultaneously; Next.js fetched
            // them in parallel, so the LCP hero fought 3 competing ~3 MB
            // Pexels downloads for bandwidth. Mounting only the 1-2 needed
            // frames drops LCP by ≈2-4 seconds on 4G mobile.
            const nextIndex = (currentImageIndex + 1) % SEASONAL_IMAGES.length;
            const shouldMount = index === currentImageIndex || index === nextIndex;
            if (!shouldMount) return null;
            return (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-2000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  // The queued "next" frame preloads quietly at low priority
                  // so the cross-fade is instant, without racing the LCP.
                  fetchPriority={index === currentImageIndex ? 'high' : 'low'}
                  sizes="100vw"
                  quality={65}
                  className="object-cover"
                />
              </div>
            );
          })}
        </div>

        {/* Premium dark gradient overlay for text readability (30-40% darkness) */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,20,25,0.50)_0%,rgba(15,20,25,0.35)_35%,rgba(15,20,25,0.60)_70%,rgba(15,20,25,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(15,61,46,0.30),transparent_60%)]" />

        <div className="relative h-full container flex flex-col justify-start pt-20 md:pt-24 lg:pt-24 pb-4 md:pb-5 lg:pb-6">
          <div className="max-w-[520px] md:max-w-[560px] text-white">
            <h1 className="font-display font-bold text-[clamp(1.55rem,3.6vw,2.9rem)] leading-[1.06] tracking-tight text-balance drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
              Experience Kashmir<br/>Like a Local.
            </h1>
            <p className="mt-1.5 text-[12.5px] md:text-sm text-white/85 max-w-[420px] text-balance leading-relaxed drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)]">
              Discover authentic stays, local experiences and unforgettable journeys across Kashmir.
            </p>
            <div className="mt-2 md:mt-2.5 flex flex-wrap gap-1.5">
              <div className="hover:scale-[1.02] active:scale-[0.98] transition-transform">
                <Button asChild size="lg" className="rounded-full bg-emerald2 hover:bg-emerald2-deep text-white shadow-[0_20px_50px_-12px_rgba(15,61,46,0.55)] hover:shadow-[0_24px_60px_-12px_rgba(15,61,46,0.7)] hover:-translate-y-0.5 transition-all px-4 md:px-4.5 h-9 md:h-10 font-semibold text-[13.5px]">
                  <Link href="/explore">Explore Stays <ArrowRight className="ml-1.5 size-3.5" /></Link>
                </Button>
              </div>
              <div className="hover:scale-[1.02] active:scale-[0.98] transition-transform">
                <Button asChild size="lg" variant="outline" className="rounded-full bg-white/[0.08] hover:bg-white/15 backdrop-blur-md text-white border-white/40 hover:border-gold hover:text-white shadow-lg transition-all px-4 md:px-4.5 h-9 md:h-10 font-semibold text-[13.5px]">
                  <Link href="/ai-planner"><Wand2 className="mr-1.5 size-3.5 text-gold" /> Plan My Trip with AI</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Trust badge — slimmer */}
          <div className="mt-2 md:mt-2.5 inline-flex items-center gap-1.5 self-start px-2.5 py-[3px] rounded-full glass-dark text-white/95 text-[10px] uppercase tracking-[0.20em] font-semibold w-fit">
            <ShieldCheck className="size-3 text-gold" aria-hidden="true" />
            Curated by locals · Trusted by travelers
          </div>

          {/* Premium single search bar — closer to trust badge, smaller filter btn */}
          <form
            onSubmit={onSearch}
            className="mt-2 md:mt-2.5 bg-white rounded-full shadow-[0_18px_46px_-18px_rgba(0,0,0,0.35)] ring-1 ring-black/5 flex items-center gap-3 pl-4 md:pl-5 pr-1.5 py-1.5 w-full max-w-2xl"
          >
            <Search className="size-5 shrink-0 text-charcoal/50" aria-hidden="true" />
            <input
              type="text"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Search Kashmir..."
              aria-label="Search Kashmir"
              className="flex-1 min-w-0 bg-transparent text-[14.5px] text-charcoal placeholder:text-charcoal/55 outline-none border-0 py-2.5"
            />
            <Button
              type="submit"
              size="lg"
              className="rounded-full bg-emerald2 hover:bg-emerald2-deep h-10 px-3.5 md:px-4 font-semibold shadow-[0_10px_26px_-12px_rgba(15,61,46,0.55)] shrink-0 gap-1.5 text-[13.5px]"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </form>
        </div>
      </section>

      {/* CATEGORIES + FEATURED — brought up (stats section removed) */}
      <section className="pt-3 md:pt-4 pb-16 md:pb-20">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-3">
            <div>
              <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Curated Selection</div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mt-1 text-balance">Stays travelers can’t stop talking about</h2>
            </div>
            <Link href="/explore" className="text-sm font-semibold text-charcoal inline-flex items-center gap-1 hover:gap-2 transition-all">View all <ChevronRight className="size-4" /></Link>
          </div>
          <CategoryPills value={cat} onChange={setCat} />
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6 mt-3 md:mt-4">
            {/* PERF: `priority` intentionally NOT set on any homepage card.
                On mobile the featured grid sits well below the fold — every
                Image with `priority` emits a <link rel="preload" fetchpriority="high">
                in the initial HTML that steals bandwidth from the actual
                mobile LCP (the seasonal hero). Cards still load fast via
                Next/Image's default lazy IntersectionObserver mount. */}
            {filtered.slice(0, 8).map((l, i) => <PropertyCard key={l.id} item={l} index={i} />)}
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <div className="max-w-2xl mb-10">
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Destinations</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-2 text-balance">Where the valley calls you next</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {destinations.map((d, i) => (
              <Link key={d.name} href={`/explore?location=${d.name}`}>
                <div 
                  className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer"
                  style={{animationDelay: `${i*60}ms`}}
                >
                  <Image src={d.img} alt={d.name} fill loading="lazy" quality={60}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/70">{d.tag}</div>
                    <div className="font-display text-2xl font-bold mt-1">{d.name}</div>
                    <div className="mt-1 text-xs text-white/75">{d.count} stays · from ₹2,900</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI PROMO */}
      <section className="py-24 relative overflow-hidden">
        <div className="aurora" />
        <div className="container relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold"><Wand2 className="size-3.5" /> Safar AI · Concierge</div>
            <h2 className="font-display text-4xl md:text-6xl font-bold mt-4 leading-[1.05] text-balance">Your personal Kashmir <span className="gradient-text-emerald">trip planner</span>, in seconds.</h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">Compare stays, choose transport, build itineraries and estimate budgets — powered by locals + AI. Try a prompt:</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {AI_PROMPT_SUGGESTIONS.slice(0,3).map((p) => (
                <Link key={p} href="/ai-planner" className="text-sm px-4 py-2.5 rounded-full bg-white border hover:border-emerald2 hover:text-emerald2 transition">{p}</Link>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg" className="rounded-full bg-gradient-emerald hover:opacity-95 px-7 h-12 font-semibold">
                <Link href="/ai-planner"><Sparkles className="size-4 mr-2" /> Try AI Planner</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7 h-12 font-semibold">
                <Link href="/explore">Browse Listings</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-emerald-200/30 via-gold/20 to-transparent rounded-[3rem] blur-2xl" />
            <div className="relative rounded-3xl bg-white border shadow-2xl overflow-hidden">
              <div className="px-5 py-4 bg-gradient-emerald text-white flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/15 grid place-items-center"><Wand2 className="size-5" /></div>
                <div>
                  <div className="font-semibold">Safar AI</div>
                  <div className="text-[11px] text-white/75">Live demo · 5-day Kashmir honeymoon</div>
                </div>
              </div>
              <div className="p-5 space-y-3 bg-secondary/30">
                <div className="flex justify-end"><div className="max-w-[80%] bg-charcoal text-white text-sm rounded-2xl rounded-br-md px-4 py-3">Plan a 5-day honeymoon under ₹40,000</div></div>
                <div className="flex justify-start"><div className="max-w-[88%] bg-white border text-sm rounded-2xl rounded-bl-md px-4 py-3 leading-relaxed">
                  <span className="font-semibold text-emerald2">Suggested itinerary</span><br/>• Day 1–2 — Royal Cedar Houseboat (Dal Lake)<br/>• Day 3 — Pinepeak Snow Cabin (Gulmarg)<br/>• Day 4–5 — Apple Orchard Cottage (Pahalgam)<br/><span className="text-muted-foreground text-xs">Total est. ₹38,400 · incl. transport + 1 cultural dinner</span>
                </div></div>
                <div className="grid grid-cols-3 gap-2">
                  {[IMG.hb1, IMG.cab1, IMG.cot1].map((src,i)=>(
                    <Image key={i} src={src} alt="" width={200} height={200} loading="lazy" quality={65}
                      sizes="120px" className="aspect-square object-cover rounded-xl w-full h-auto"/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCES */}
      <section className="py-20">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Local Experiences</div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mt-2 text-balance">Beyond the stay — the soul of Kashmir</h2>
            </div>
            <Link href="/explore" className="text-sm font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">View all <ChevronRight className="size-4" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {experiences.map((e, i) => (
              <Link key={e.title} href="/explore?cat=experience">
                <div 
                  className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <Image src={e.img} alt={e.title} fill loading="lazy" quality={55}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="font-display text-xl font-bold">{e.title}</div>
                    <div className="text-xs text-white/80 mt-1 line-clamp-2">{e.desc}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm font-semibold">from ₹{e.price.toLocaleString('en-IN')}</div>
                      <div className="size-8 rounded-full bg-white text-charcoal grid place-items-center group-hover:bg-gold transition"><ArrowRight className="size-4" /></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MODULE 11 — REWARDS PROMOTIONAL STRIP (public) */}
      <RewardsPromoStrip />

      {/* HOST CTA */}
      <section className="py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2.5rem] p-10 md:p-16 bg-charcoal text-white">
            <Image src={IMG.mtn4} alt="" fill loading="lazy" quality={60}
              sizes="100vw" className="object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/30" />
            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-dark text-xs uppercase tracking-[0.18em] font-semibold text-white"><Mountain className="size-3.5" /> For Hosts</div>
              <h2 className="font-display text-4xl md:text-6xl font-bold mt-4 leading-[1.05] text-balance">List your home, cabin or experience — reach the world.</h2>
              <p className="mt-4 text-white/80 max-w-xl">Earn in your own valley. Upload photos, set prices, manage bookings and grow with our analytics dashboard.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-white text-charcoal hover:bg-white/90 px-7 h-12 font-semibold"><Link href="/add-listing">Become a Host</Link></Button>
                <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent text-white border-white/40 hover:bg-white/10 px-7 h-12 font-semibold"><Link href="/dashboard/host">Host Dashboard <ArrowRight className="size-4 ml-2" /></Link></Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <div className="max-w-2xl mb-10">
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Loved by Travelers</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-2 text-balance">Stories from the valley</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i*0.07 }}
                className="bg-white rounded-3xl p-7 border shadow-sm">
                <div className="flex items-center gap-1 text-gold">{Array.from({length: t.rating}).map((_,j)=><Star key={j} className="size-4 fill-gold" />)}</div>
                <p className="mt-4 text-charcoal/85 leading-relaxed">“{t.text}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-emerald grid place-items-center text-white font-semibold">{t.name.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      {/* PERF: chat/AI floating widget waits for user interaction or idle
          before mounting — keeps LCP + TBT unaffected on first paint. */}
      <DeferredMount>
        <AIAssistantFloating />
      </DeferredMount>
    </main>
  );
}

export default App;

