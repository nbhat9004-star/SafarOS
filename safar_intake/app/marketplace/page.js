'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  Search, ChevronRight, ChevronLeft, Heart, Star, MapPin,
  Hotel, Home, Ship, Car, Bike, UserRound, PlaneLanding,
  CableCar, Mountain, UtensilsCrossed,
} from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace-categories';

// ---------------------------------------------------------------------------
// Marketplace hub — pixel-close recreation of the approved reference image.
// UI-only redesign. Backend / APIs / routes untouched.
// Preserved: /marketplace/<slug> links, MARKETPLACE_CATEGORIES source, Navbar,
// Footer, bottom nav.
// ---------------------------------------------------------------------------

// Ten curated Browse Categories tiles matching the reference exactly.
// Each row maps to an existing category slug so links stay stable.
const BROWSE_TILES = [
  { slug: 'hotels',           title: 'Hotels',          icon: Hotel,            count: '128 stays',       tint: 'bg-emerald-50',  color: 'text-emerald-700' },
  { slug: 'homestays',        title: 'Homestays',       icon: Home,             count: '342 stays',       tint: 'bg-emerald-50',  color: 'text-emerald-700' },
  { slug: 'houseboats',       title: 'Houseboats',      icon: Ship,             count: '56 stays',        tint: 'bg-sky-50',      color: 'text-sky-600' },
  { slug: 'cars',             title: 'Cars',            icon: Car,              count: '120 vehicles',    tint: 'bg-amber-50',    color: 'text-amber-600' },
  { slug: 'bikes',            title: 'Bikes',           icon: Bike,             count: '85 bikes',        tint: 'bg-violet-50',   color: 'text-violet-600' },
  { slug: 'tour-guides',      title: 'Guides',          icon: UserRound,        count: '64 guides',       tint: 'bg-amber-50',    color: 'text-amber-600' },
  { slug: 'airport-pickup',   title: 'Airport Pickup',  icon: PlaneLanding,     count: '48 services',     tint: 'bg-rose-50',     color: 'text-rose-500' },
  { slug: 'gondola-tickets',  title: 'Gondola Tickets', icon: CableCar,         count: '22 options',      tint: 'bg-sky-50',      color: 'text-sky-600' },
  { slug: 'experiences',      title: 'Experiences',     icon: Mountain,         count: '96 experiences',  tint: 'bg-emerald-50',  color: 'text-emerald-700' },
  { slug: 'food-experiences', title: 'Food & Dining',   icon: UtensilsCrossed,  count: '75 places',       tint: 'bg-rose-50',     color: 'text-rose-500' },
];

// Featured stays sample — used until the /api/listings feed is populated with
// featured items. Pure UI content, no backend contract.
const FEATURED_STAYS = [
  {
    id: 'the-kabo-luxe',
    title: 'The Kabo Luxe',
    location: 'Dal Lake, Srinagar',
    rating: 4.7,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
  },
  {
    id: 'grand-kashmir-resort',
    title: 'Grand Kashmir Resort',
    location: 'Gulmarg, Kashmir',
    rating: 4.6,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80',
  },
  {
    id: 'lake-view-heights',
    title: 'Lake View Heights',
    location: 'Nigeen Lake, Srinagar',
    rating: 4.5,
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
  },
  {
    id: 'vintage-inn',
    title: 'Vintage Inn',
    location: 'Nigeen Lake, Srinagar',
    rating: 4.5,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80',
  },
  {
    id: 'mount-view-retreat',
    title: 'Mount View Retreat',
    location: 'Pahalgam, Kashmir',
    rating: 4.8,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200&q=80',
  },
];

// Which slug should a browse tile deep-link into? Guard against missing slugs
// in MARKETPLACE_CATEGORIES by falling back to /marketplace.
function tileHref(slug) {
  const exists = MARKETPLACE_CATEGORIES.some((c) => c.slug === slug);
  return exists ? `/marketplace/${slug}` : '/marketplace';
}

export default function MarketplacePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8F8F8] pt-16 lg:pt-20 pb-28 md:pb-16">
        <HeroBlock />
        <BrowseCategoriesBlock />
        <FeaturedStaysBlock />
      </main>

      <Footer />
    </>
  );
}

// =============================== HERO =======================================
function HeroBlock() {
  return (
    <section className="relative overflow-hidden isolate">
      {/* Background image */}
      <div className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px]">
        <Image
          src="https://images.unsplash.com/photo-1614591276564-7b3e69347a48?w=2400&q=85"
          alt="Kashmir houseboats on Dal Lake"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          unoptimized
        />
        {/* Dark gradient overlay — heavier on the left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/45 to-slate-950/25" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-transparent to-slate-950/25" aria-hidden />

        {/* Copy */}
        <div className="absolute inset-0">
          <div className="container h-full flex flex-col justify-center">
            <div className="max-w-2xl">
              <h1 className="font-display font-extrabold text-white tracking-tight leading-[1.05] text-[32px] sm:text-[40px] md:text-[46px] lg:text-[52px]">
                Explore Kashmir
              </h1>
              <p className="mt-2 md:mt-3 text-white/90 text-[13.5px] sm:text-[15px] md:text-[16px] leading-relaxed max-w-[420px] md:max-w-[520px]">
                Hotels, homestays, houseboats,<br className="hidden sm:inline" /> transport &amp; experiences.
              </p>
            </div>
          </div>
        </div>

        {/* Floating dark green circular Search button */}
        <Link
          href="#browse-categories"
          scroll={false}
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('browse-categories');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          aria-label="Search categories"
          className="absolute bottom-4 right-4 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8 grid place-items-center size-16 md:size-[76px] lg:size-[84px] rounded-full bg-[#0E6B4E] hover:bg-emerald-900 text-white ring-2 ring-white/80 shadow-[0_18px_40px_-12px_rgba(15,25,20,0.5)] hover:scale-[1.04] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 transition-all duration-300"
        >
          <Search className="size-6 md:size-7 lg:size-8" strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
}

// ========================== BROWSE CATEGORIES ================================
function BrowseCategoriesBlock() {
  return (
    <section id="browse-categories" className="container mt-8 md:mt-12 scroll-mt-24">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display font-extrabold text-slate-900 tracking-tight text-[24px] sm:text-[28px] md:text-[32px] leading-tight">
          Browse Categories
        </h2>
        <Link
          href="/marketplace#all-categories"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('all-categories');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="inline-flex items-center gap-1 text-[#0E6B4E] hover:text-emerald-900 text-[13.5px] md:text-[15px] font-semibold transition"
        >
          View all
          <ChevronRight className="size-[16px] md:size-[18px]" strokeWidth={2.4} />
        </Link>
      </div>

      {/* 5 × 2 grid */}
      <div className="mt-5 md:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {BROWSE_TILES.map((t) => (
          <CategoryTile key={t.slug} tile={t} />
        ))}
      </div>

      {/* Hidden anchor so "View all" scrolls to the full category set (kept for
          continuity — reveals when there are more categories than the 10 tiles). */}
      <FullCategoryGrid />
    </section>
  );
}

function CategoryTile({ tile }) {
  const Icon = tile.icon;
  return (
    <Link
      href={tileHref(tile.slug)}
      className="group flex flex-col items-start text-left bg-white rounded-[20px] p-4 md:p-5 shadow-[0_2px_10px_-4px_rgba(15,20,25,0.08)] hover:shadow-[0_18px_40px_-16px_rgba(15,20,25,0.22)] ring-1 ring-slate-100 hover:ring-slate-200/80 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={`Browse ${tile.title}`}
    >
      <span className={`grid place-items-center size-14 md:size-[60px] rounded-2xl ${tile.tint}`}>
        <Icon className={`size-7 md:size-8 ${tile.color}`} strokeWidth={2.1} />
      </span>
      <h3 className="mt-4 md:mt-5 font-display font-extrabold text-slate-900 text-[15px] md:text-[16px] tracking-tight leading-tight">
        {tile.title}
      </h3>
      <p className="mt-1 text-slate-500 text-[12px] md:text-[13px]">
        {tile.count}
      </p>
    </Link>
  );
}

// Reveals every remaining category from MARKETPLACE_CATEGORIES so "View all"
// remains meaningful — matches the count in the reference subtitle style.
function FullCategoryGrid() {
  const remaining = useMemo(() => {
    const shown = new Set(BROWSE_TILES.map((t) => t.slug));
    return MARKETPLACE_CATEGORIES.filter((c) => !shown.has(c.slug));
  }, []);

  const [expanded, setExpanded] = useState(false);

  if (remaining.length === 0) return null;

  return (
    <div id="all-categories" className="mt-10 md:mt-12">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="inline-flex items-center gap-1.5 text-[13px] md:text-[13.5px] font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        {expanded ? 'Hide' : 'Show'} all {MARKETPLACE_CATEGORIES.length} categories
        <ChevronRight
          className={`size-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
          strokeWidth={2.4}
        />
      </button>

      {expanded && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {remaining.map((c) => {
            const t = {
              slug: c.slug,
              title: c.title,
              icon: BROWSE_TILES.find((b) => b.slug === c.slug)?.icon || Mountain,
              count: '',
              tint: 'bg-slate-50',
              color: 'text-slate-600',
            };
            return <CategoryTile key={c.slug} tile={t} />;
          })}
        </div>
      )}
    </div>
  );
}

// =========================== FEATURED STAYS =================================
function FeaturedStaysBlock() {
  return (
    <section className="container mt-10 md:mt-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display font-extrabold text-slate-900 tracking-tight text-[24px] sm:text-[28px] md:text-[32px] leading-tight">
          Featured Stays
        </h2>
        <Link
          href="/marketplace/hotels"
          className="inline-flex items-center gap-1 text-[#0E6B4E] hover:text-emerald-900 text-[13.5px] md:text-[15px] font-semibold transition"
        >
          View all
          <ChevronRight className="size-[16px] md:size-[18px]" strokeWidth={2.4} />
        </Link>
      </div>

      {/* Mobile: 2-col grid. Desktop: horizontal scroll rail. */}
      <div className="mt-5 md:mt-6">
        {/* Mobile grid */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {FEATURED_STAYS.slice(0, 4).map((s) => (
            <FeaturedStayCard key={s.id} stay={s} compact />
          ))}
        </div>

        {/* Tablet+/desktop horizontal rail */}
        <FeaturedRail />
      </div>
    </section>
  );
}

function FeaturedRail() {
  const [scrollBox, setScrollBox] = useState(null);

  const scrollBy = (dir) => {
    if (!scrollBox) return;
    scrollBox.scrollBy({ left: dir * (scrollBox.clientWidth * 0.85), behavior: 'smooth' });
  };

  return (
    <div className="relative hidden sm:block">
      <div
        ref={setScrollBox}
        className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 md:mx-0 md:px-0"
        role="list"
      >
        {FEATURED_STAYS.map((s) => (
          <div
            key={s.id}
            role="listitem"
            className="snap-start shrink-0 w-[300px] md:w-[340px] lg:w-[380px]"
          >
            <FeaturedStayCard stay={s} />
          </div>
        ))}
      </div>

      {/* Nav arrows (desktop only) */}
      <div className="hidden md:flex absolute -top-14 right-0 items-center gap-2">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll featured stays left"
          className="grid place-items-center size-9 rounded-full bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-slate-300 hover:text-slate-900 shadow-sm transition"
        >
          <ChevronLeft className="size-4" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll featured stays right"
          className="grid place-items-center size-9 rounded-full bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-slate-300 hover:text-slate-900 shadow-sm transition"
        >
          <ChevronRight className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `.no-scrollbar::-webkit-scrollbar{display:none} .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`,
        }}
      />
    </div>
  );
}

function FeaturedStayCard({ stay, compact = false }) {
  const [liked, setLiked] = useState(false);
  const badgeStyle =
    stay.badge === 'Best Seller'
      ? 'bg-amber-400 text-amber-950'
      : stay.badge === 'New'
        ? 'bg-emerald-700 text-white'
        : 'bg-emerald-800 text-white';

  return (
    <article className="group h-full flex flex-col bg-white rounded-[22px] overflow-hidden ring-1 ring-slate-100 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_44px_-18px_rgba(15,23,42,0.22)] hover:-translate-y-0.5 transition-all duration-300">
      <Link
        href={`/marketplace/hotels`}
        className={`relative block overflow-hidden ${compact ? 'aspect-[4/3]' : 'aspect-[16/11]'}`}
      >
        <Image
          src={stay.image}
          alt={stay.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 340px, 380px"
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          unoptimized
          loading="lazy"
        />
        {/* Top-left badge */}
        {stay.badge && (
          <div className={`absolute top-3 left-3 rounded-md px-2.5 py-1 text-[11px] font-bold shadow-sm ${badgeStyle}`}>
            {stay.badge}
          </div>
        )}
        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setLiked((v) => !v);
          }}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 grid place-items-center size-9 rounded-full bg-white/95 shadow-md hover:scale-105 active:scale-95 transition"
        >
          <Heart
            className={`size-4 ${liked ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`}
            strokeWidth={2.2}
          />
        </button>
        {/* Rating pill */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-emerald-900/95 backdrop-blur px-2 py-1 text-white text-[12px] font-bold shadow-sm">
          <Star className="size-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
          {stay.rating.toFixed(1)}
        </div>
      </Link>

      <div className="p-4 md:p-5">
        <h3 className="font-display font-extrabold text-slate-900 text-[16px] md:text-[18px] tracking-tight leading-tight line-clamp-1">
          {stay.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-slate-500 text-[12.5px] md:text-[13.5px]">
          <MapPin className="size-[14px] md:size-[15px] text-slate-400 shrink-0" strokeWidth={2.2} />
          <span className="truncate">{stay.location}</span>
        </div>
      </div>
    </article>
  );
}
