'use client';

/**
 * HOME PAGE 2 — Safar Curated
 * Pixel-close recreation of the approved reference design.
 * Standalone page — does NOT touch existing homepage.
 *
 * Colors:  Primary #0E5A3A · Dark #0A3F2A · BG #FAFAF8 · Text #111 / #6B7280 · Border #ECECEC
 * Radii:   Hero 28 · Search 30 · Cards 24 · Categories 22 · Nav 28 · Buttons 999
 * Font:    Inter (loaded in root layout via next/font)
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Compass,
  ArrowRight,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Building2,
  Ship,
  Home as HomeIcon,
  Car,
  Flag,
  Star,
  Heart,
  Sparkles,
  Anchor,
  Bell,
  Snowflake,
  Landmark,
  Store,
  Wand2,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* DATA                                                                        */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  { key: 'stays',       title: 'Stays',       count: '1.2K+', icon: Building2, tint: '#E7F3EC', color: '#0E5A3A' },
  { key: 'houseboats',  title: 'Houseboats',  count: '320+',  icon: Ship,      tint: '#E6F1FA', color: '#2563EB' },
  { key: 'cabins',      title: 'Cabins',      count: '480+',  icon: HomeIcon,  tint: '#FDECDF', color: '#E76F1E' },
  { key: 'transport',   title: 'Transport',   count: '650+',  icon: Car,       tint: '#FDECDF', color: '#E76F1E' },
  { key: 'guides',      title: 'Guides',      count: '240+',  icon: Flag,      tint: '#EEE7FA', color: '#7C3AED' },
  { key: 'experiences', title: 'Experiences', count: '240+',  icon: Star,      tint: '#FBEED1', color: '#B7791F' },
];

const FILTER_CHIPS = [
  { key: 'all',        label: 'All',            icon: Sparkles },
  { key: 'houseboats', label: 'Houseboats',     icon: Anchor },
  { key: 'cabins',     label: 'Cabins',         icon: Bell },
  { key: 'ski',        label: 'Ski-in/Ski-out', icon: Snowflake },
  { key: 'heritage',   label: 'Heritage',       icon: Landmark },
];

const PROPERTIES = [
  {
    id: 'p1',
    title: 'Royal Heritage Houseboat',
    location: 'Dal Lake, Srinagar',
    price: 6800,
    rating: 4.96,
    category: 'Heritage',
    superhost: true,
    img: 'https://images.pexels.com/photos/27108526/pexels-photo-27108526.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=2',
  },
  {
    id: 'p2',
    title: 'Pinepeak Cabin',
    location: 'Gulmarg, Baramulla',
    price: 9200,
    rating: 4.92,
    category: 'Ski-in/Ski-out',
    superhost: true,
    img: 'https://images.pexels.com/photos/32620987/pexels-photo-32620987.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=2',
  },
  {
    id: 'p3',
    title: 'Apple Orchard Cottage',
    location: 'Pahalgam Valley',
    price: 5400,
    rating: 4.88,
    category: 'Cabins',
    superhost: false,
    img: 'https://images.pexels.com/photos/14262339/pexels-photo-14262339.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=2',
  },
  {
    id: 'p4',
    title: 'Chinar Heritage Villa',
    location: 'Old City, Srinagar',
    price: 7500,
    rating: 4.94,
    category: 'Heritage',
    superhost: true,
    img: 'https://images.pexels.com/photos/25786776/pexels-photo-25786776.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=2',
  },
];

const NAV_ITEMS = [
  { key: 'trip',        label: 'Build Trip',   icon: Sparkles, href: '/build-trip' },
  { key: 'marketplace', label: 'Marketplace',  icon: Store,    href: '/home-2', active: true },
  { key: 'ai',          label: 'AI Planner',   icon: Wand2,    href: '/ai-planner' },
  { key: 'host',        label: 'Become Host',  icon: HomeIcon, href: '/add-listing' },
  { key: 'explore',     label: 'Explore',      icon: Compass,  href: '/explore' },
];

// Hero: Dal Lake houseboats — matches the reference scene
const HERO_IMG =
  'https://images.pexels.com/photos/27108526/pexels-photo-27108526.jpeg?auto=compress&cs=tinysrgb&w=1600&h=1200&dpr=2';

/* -------------------------------------------------------------------------- */
/* PAGE                                                                        */
/* -------------------------------------------------------------------------- */

export default function HomePage2() {
  const [activeChip, setActiveChip] = useState('all');
  const [liked, setLiked] = useState({});
  const toggleLike = (id) => setLiked((s) => ({ ...s, [id]: !s[id] }));

  return (
    <main
      className="min-h-screen font-sans antialiased"
      style={{ backgroundColor: '#FAFAF8', color: '#111111' }}
    >
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-6xl px-5 h-[84px] md:h-[88px] flex items-center justify-between gap-3">
          {/* Logo (left) */}
          <Link href="/home-2" className="flex items-center gap-2.5 shrink-0" aria-label="Safar home">
            <div
              className="size-10 grid place-items-center text-white shadow-[0_6px_16px_-10px_rgba(14,90,58,0.55)]"
              style={{ backgroundColor: '#0A3F2A', borderRadius: '14px' }}
              aria-hidden="true"
            >
              <MapPin className="size-[18px]" style={{ color: '#F5C24B' }} strokeWidth={2.4} />
            </div>
            <span className="text-[19px] font-bold tracking-tight" style={{ color: '#111111' }}>
              Safar
            </span>
          </Link>

          {/* Location selector (center) */}
          <button
            type="button"
            className="inline-flex items-center gap-2 h-11 px-5 bg-white shadow-[0_2px_10px_-6px_rgba(15,20,25,0.08)] ring-1 ring-[#ECECEC] hover:ring-slate-200 transition"
            style={{ borderRadius: '999px' }}
            aria-label="Change location"
          >
            <MapPin className="size-4" style={{ color: '#0E5A3A' }} strokeWidth={2.4} />
            <span className="text-[14px] font-semibold" style={{ color: '#111111' }}>
              Kashmir
            </span>
            <ChevronDown className="size-4" style={{ color: '#111111' }} strokeWidth={2.2} />
          </button>

          {/* Compass (right) */}
          <button
            type="button"
            className="size-11 rounded-full grid place-items-center shadow-[0_2px_10px_-6px_rgba(15,20,25,0.10)] ring-1 hover:brightness-105 transition shrink-0"
            style={{ backgroundColor: '#FBF4E1', borderColor: '#F1E4B8', ringColor: '#F1E4B8' }}
            aria-label="Explore"
          >
            <Compass className="size-5" style={{ color: '#B7791F' }} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {/* ================================================================== */}
      {/* HERO                                                                */}
      {/* ================================================================== */}
      <section className="px-5">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden" style={{ borderRadius: '28px' }}>
            {/* Background image */}
            <div className="relative h-[520px] sm:h-[560px] md:h-[600px] lg:h-[640px] w-full">
              <Image
                src={HERO_IMG}
                alt="Dal Lake houseboats in Kashmir"
                fill
                priority
                sizes="(min-width: 1024px) 1200px, 100vw"
                className="object-cover"
                quality={72}
              />
              {/* Dark left-to-right gradient for text legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(10,20,15,0.72) 0%, rgba(10,20,15,0.50) 40%, rgba(10,20,15,0.15) 75%, rgba(10,20,15,0.05) 100%)',
                }}
              />
              {/* Subtle bottom fade */}
              <div
                className="absolute inset-x-0 bottom-0 h-40"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(10,20,15,0) 0%, rgba(10,20,15,0.35) 100%)',
                }}
              />
            </div>

            {/* Hero content — anchored top-left */}
            <div className="absolute inset-0 flex flex-col justify-start p-6 md:p-10 lg:p-12 pt-8 md:pt-12">
              <div className="max-w-[560px]">
                <h1
                  className="font-bold tracking-tight leading-[1.05] text-[36px] sm:text-[44px] md:text-[52px] lg:text-[58px]"
                  style={{ color: '#FFFFFF' }}
                >
                  Experience Kashmir
                  <br />
                  Like a Local.
                </h1>
                <p
                  className="mt-4 md:mt-5 text-[14.5px] sm:text-[15.5px] md:text-[16px] leading-[1.55] font-normal max-w-[420px]"
                  style={{ color: 'rgba(255,255,255,0.86)' }}
                >
                  Discover authentic stays, local experiences,
                  <br className="hidden sm:block" /> transport, guides, and unforgettable
                  <br className="hidden sm:block" /> journeys across Kashmir.
                </p>

                {/* Hero buttons */}
                <div className="mt-6 md:mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/explore"
                    className="inline-flex items-center justify-center gap-2 h-[52px] md:h-[56px] px-6 text-white text-[15.5px] font-semibold shadow-[0_14px_36px_-12px_rgba(10,63,42,0.75)] hover:shadow-[0_18px_44px_-12px_rgba(10,63,42,0.9)] transition"
                    style={{ borderRadius: '999px', backgroundColor: '#0A3F2A' }}
                  >
                    Explore Stays
                    <ArrowRight className="size-[18px]" strokeWidth={2.4} />
                  </Link>
                  <Link
                    href="/ai-planner"
                    className="inline-flex items-center justify-center gap-2 h-[52px] md:h-[56px] px-6 text-white text-[15.5px] font-semibold backdrop-blur-md ring-1 ring-white/25 hover:bg-white/25 transition"
                    style={{
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255,255,255,0.14)',
                    }}
                  >
                    <Wand2 className="size-[18px]" strokeWidth={2.4} />
                    Plan My Trip with AI
                  </Link>
                </div>

                {/* Trust badge */}
                <div
                  className="mt-5 md:mt-6 inline-flex items-center gap-2 px-4 py-2.5 text-white"
                  style={{
                    borderRadius: '999px',
                    backgroundColor: 'rgba(10,63,42,0.55)',
                    outline: '1px solid rgba(245,194,75,0.35)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <ShieldCheck
                    className="size-4 shrink-0"
                    strokeWidth={2.4}
                    style={{ color: '#F5C24B' }}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                    Curated by Locals · Trusted by Travelers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SEARCH + FILTER (two separate cards side-by-side)                   */}
      {/* ================================================================== */}
      <section className="px-5 mt-6 md:mt-8">
        <div className="mx-auto max-w-6xl flex items-stretch gap-3">
          {/* Search card */}
          <div
            className="flex-1 flex items-center gap-3 bg-white px-5 h-[64px] shadow-[0_10px_30px_-16px_rgba(15,20,25,0.15)] ring-1 ring-[#ECECEC]"
            style={{ borderRadius: '30px' }}
          >
            <Search className="size-5 shrink-0" style={{ color: '#6B7280' }} strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search stays, experiences, transport..."
              className="w-full bg-transparent outline-none text-[14.5px] placeholder:text-[#6B7280]"
              style={{ color: '#111111' }}
              aria-label="Search"
            />
          </div>

          {/* Filter square card */}
          <button
            type="button"
            className="shrink-0 flex flex-col items-center justify-center gap-1 w-[72px] h-[64px] text-white shadow-[0_10px_26px_-12px_rgba(14,90,58,0.55)] hover:brightness-105 transition"
            style={{ borderRadius: '20px', backgroundColor: '#0A3F2A' }}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="size-[18px]" strokeWidth={2.4} />
            <span className="text-[11px] font-semibold">Filter</span>
          </button>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CATEGORY CARDS — 6 in one row (always)                              */}
      {/* ================================================================== */}
      <section className="mt-6 md:mt-8">
        <div className="mx-auto max-w-6xl">
          <div className="px-5 grid grid-cols-6 gap-1.5 sm:gap-2.5 md:gap-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  className="group text-center bg-white pt-2.5 pb-2.5 px-1 md:px-2 flex flex-col items-center justify-start shadow-[0_4px_14px_-10px_rgba(15,20,25,0.10)] ring-1 ring-[#ECECEC] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(15,20,25,0.18)] transition"
                  style={{ borderRadius: '18px' }}
                >
                  <div
                    className="size-[42px] md:size-[52px] grid place-items-center"
                    style={{ backgroundColor: c.tint, borderRadius: '14px' }}
                  >
                    <Icon
                      className="size-[20px] md:size-[24px]"
                      strokeWidth={2.2}
                      style={{ color: c.color }}
                      fill={c.icon === Star ? c.color : 'none'}
                    />
                  </div>
                  <div
                    className="mt-2 text-[11px] md:text-[13px] font-semibold leading-tight"
                    style={{ color: '#111111' }}
                  >
                    {c.title}
                  </div>
                  <div
                    className="mt-0.5 text-[10px] md:text-[11.5px] font-medium"
                    style={{ color: '#6B7280' }}
                  >
                    {c.count}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CURATED SECTION                                                     */}
      {/* ================================================================== */}
      <section className="px-5 mt-10 md:mt-14">
        <div className="mx-auto max-w-6xl">
          <div
            className="text-[10.5px] md:text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: '#0E5A3A' }}
          >
            Curated Selection
          </div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h2
              className="font-bold text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] leading-[1.15] tracking-tight max-w-[620px]"
              style={{ color: '#111111' }}
            >
              Stays travelers can&apos;t stop talking about
            </h2>
            <Link
              href="/explore"
              className="shrink-0 inline-flex items-center gap-1 text-[13.5px] font-semibold hover:gap-1.5 transition-all"
              style={{ color: '#0E5A3A' }}
            >
              View all
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Link>
          </div>

          {/* Filter chips (with icons) */}
          <div className="mt-5 md:mt-6 flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {FILTER_CHIPS.map((chip) => {
              const active = activeChip === chip.key;
              const Icon = chip.icon;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setActiveChip(chip.key)}
                  className="shrink-0 inline-flex items-center gap-2 h-11 px-4 text-[13px] font-semibold whitespace-nowrap transition"
                  style={{
                    borderRadius: '999px',
                    backgroundColor: active ? '#0A3F2A' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#111111',
                    boxShadow: active
                      ? '0 10px 22px -12px rgba(10,63,42,0.55)'
                      : '0 2px 10px -6px rgba(15,20,25,0.10)',
                    outline: active ? 'none' : '1px solid #ECECEC',
                  }}
                >
                  <Icon
                    className="size-[15px]"
                    strokeWidth={2.4}
                    style={{ color: active ? '#FFFFFF' : '#6B7280' }}
                    fill={chip.icon === Sparkles && active ? '#FFFFFF' : 'none'}
                  />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PROPERTY CARDS — horizontal carousel                                 */}
      {/* ================================================================== */}
      <section className="mt-5 md:mt-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar px-5 pb-2">
            {PROPERTIES.map((p) => (
              <article
                key={p.id}
                className="shrink-0 w-[300px] sm:w-[320px] md:w-[340px] bg-white overflow-hidden shadow-[0_8px_24px_-16px_rgba(15,20,25,0.20)] ring-1 ring-[#ECECEC] hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(15,20,25,0.28)] transition"
                style={{ borderRadius: '24px' }}
              >
                {/* Image */}
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                  <Image
                    src={p.img}
                    alt={p.title}
                    fill
                    sizes="340px"
                    className="object-cover"
                    quality={68}
                  />

                  {/* Category badge (top-left) */}
                  <div
                    className="absolute top-3.5 left-3.5 px-3 py-1.5 text-[11px] font-semibold"
                    style={{
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.96)',
                      color: '#111111',
                    }}
                  >
                    {p.category}
                  </div>

                  {/* Wishlist button (top-right) */}
                  <button
                    type="button"
                    onClick={() => toggleLike(p.id)}
                    className="absolute top-3.5 right-3.5 size-9 rounded-full bg-white grid place-items-center shadow-[0_4px_10px_-4px_rgba(15,20,25,0.25)] hover:scale-105 transition"
                    aria-label={liked[p.id] ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      className="size-[18px]"
                      strokeWidth={2.2}
                      style={{
                        color: liked[p.id] ? '#DC2626' : '#111111',
                        fill: liked[p.id] ? '#DC2626' : 'transparent',
                      }}
                    />
                  </button>

                  {/* Rating badge (bottom-left) */}
                  <div
                    className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1"
                    style={{
                      borderRadius: '999px',
                      backgroundColor: '#0A3F2A',
                    }}
                  >
                    <Star
                      className="size-[13px]"
                      strokeWidth={2.4}
                      style={{ color: '#F5C24B', fill: '#F5C24B' }}
                    />
                    <span className="text-[12px] font-semibold text-white">
                      {p.rating.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-5">
                  <h3
                    className="text-[16px] md:text-[17px] font-bold leading-tight"
                    style={{ color: '#111111' }}
                  >
                    {p.title}
                  </h3>
                  <div
                    className="mt-1.5 flex items-center gap-1.5 text-[13px]"
                    style={{ color: '#6B7280' }}
                  >
                    <MapPin className="size-[14px]" strokeWidth={2.2} />
                    {p.location}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[17px] font-bold" style={{ color: '#111111' }}>
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[13px] ml-1" style={{ color: '#6B7280' }}>
                        / night
                      </span>
                    </div>
                    {p.superhost && (
                      <div
                        className="px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                        style={{
                          borderRadius: '999px',
                          backgroundColor: '#E7F3EC',
                          color: '#0E5A3A',
                        }}
                      >
                        Superhost
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer so content is not hidden behind the floating bottom nav */}
      <div className="h-[120px] md:h-[128px]" aria-hidden="true" />

      {/* ================================================================== */}
      {/* BOTTOM NAVIGATION (floating)                                        */}
      {/* ================================================================== */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        aria-label="Primary navigation"
      >
        <div
          className="mx-auto max-w-6xl bg-white px-3 pt-3 pb-4 md:pb-4 shadow-[0_-8px_28px_-14px_rgba(15,20,25,0.14)] ring-1 ring-[#ECECEC]"
          style={{
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
          }}
        >
          <ul className="grid grid-cols-5 gap-1">
            {NAV_ITEMS.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.key}>
                  <Link
                    href={n.href}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition"
                    style={{
                      backgroundColor: n.active ? '#E7F3EC' : 'transparent',
                    }}
                    aria-current={n.active ? 'page' : undefined}
                  >
                    <Icon
                      className="size-[22px]"
                      strokeWidth={2.2}
                      style={{ color: n.active ? '#0E5A3A' : '#6B7280' }}
                    />
                    <span
                      className="text-[11px] font-semibold leading-none"
                      style={{ color: n.active ? '#0E5A3A' : '#6B7280' }}
                    >
                      {n.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Utility: hide scrollbar for horizontal rails */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            '.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}',
        }}
      />
    </main>
  );
}
