'use client';
import Link from 'next/link';
import {
  Flame,
  BookOpen,
  MapPin,
  MessageCircle,
  Calendar,
  UserPlus,
  Star,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

/**
 * CommunityHighlights — modular, human-powered replacement for the old AI Concierge panel.
 * Everything shown here is meant to be community-driven (creators, locals, journey members).
 * Data below is a lightweight seed; each tile is backend-ready via its `href` target.
 *
 * Variants:
 *   - "default" (home)  → 8 highlights covering the full community surface.
 *   - "buddy"  (community page) → travel-buddy leaning subset.
 */

const HIGHLIGHTS_DEFAULT = [
  { icon: Flame,         tint: 'from-orange-300 to-rose-400',    label: 'Trending Journeys',        sub: 'Most-joined this week',       href: '/explore/journey' },
  { icon: BookOpen,      tint: 'from-emerald-300 to-teal-400',   label: 'Popular Stories',          sub: "Field notes travelers love",  href: '/explore/stories' },
  { icon: MapPin,        tint: 'from-amber-300 to-orange-400',   label: 'New Hidden Gems',          sub: 'Freshly shared by locals',    href: '/explore/wander' },
  { icon: MessageCircle, tint: 'from-sky-300 to-blue-400',       label: 'Active Discussions',       sub: 'Most replies · last 24h',     href: '/explore/community#discussions' },
  { icon: Calendar,      tint: 'from-fuchsia-300 to-violet-400', label: 'Upcoming Meetups',         sub: 'Real people, real dates',     href: '/explore/community#meetups' },
  { icon: UserPlus,      tint: 'from-lime-300 to-emerald-400',   label: 'Recently Joined',          sub: 'Travelers to say hi to',      href: '/explore/community' },
  { icon: Star,          tint: 'from-yellow-300 to-amber-400',   label: 'Community Picks',          sub: 'Editor + traveler curated',   href: '/explore/wander' },
  { icon: Sparkles,      tint: 'from-pink-300 to-fuchsia-400',   label: 'Weekend Highlights',       sub: 'What people are doing now',   href: '/explore/community' },
];

const HIGHLIGHTS_BUDDY = [
  { icon: UserPlus,      tint: 'from-lime-300 to-emerald-400',   label: 'Recently Joined',          sub: 'Say hi first',                href: '/explore/community' },
  { icon: Flame,         tint: 'from-orange-300 to-rose-400',    label: 'Most-Joined Journeys',     sub: 'Open seats this month',       href: '/explore/journey' },
  { icon: MessageCircle, tint: 'from-sky-300 to-blue-400',       label: 'Active Discussions',       sub: 'Ask, answer, connect',        href: '/explore/community#discussions' },
  { icon: Calendar,      tint: 'from-fuchsia-300 to-violet-400', label: 'Upcoming Meetups',         sub: 'Meet in person',              href: '/explore/community#meetups' },
  { icon: Star,          tint: 'from-yellow-300 to-amber-400',   label: 'Verified Travelers',       sub: 'Reputation-checked profiles', href: '/explore/community' },
  { icon: Sparkles,      tint: 'from-pink-300 to-fuchsia-400',   label: 'Weekend Highlights',       sub: 'What locals are up to',       href: '/explore/community' },
];

export default function CommunityHighlights({
  variant = 'default',
  title = 'Community Highlights',
  eyebrow = 'From real travelers',
  description = 'Everything on Explore is powered by people — journey creators, locals and travelers sharing what they love, right now.',
  cta = { label: 'Open Community', href: '/explore/community' },
}) {
  const items = variant === 'buddy' ? HIGHLIGHTS_BUDDY : HIGHLIGHTS_DEFAULT;

  return (
    <div className="e-glass rounded-3xl p-5 md:p-7">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="e-chip"><Sparkles className="size-3 text-emerald-300" /> {eyebrow}</div>
          <h3 className="display font-bold mt-3 text-xl md:text-2xl">{title}</h3>
          <p className="mt-1 text-sm max-w-2xl leading-relaxed" style={{ color: 'var(--e-text-muted)' }}>
            {description}
          </p>
        </div>
        {cta?.href && (
          <Link
            href={cta.href}
            className="e-btn-ghost rounded-full px-4 py-2 text-xs inline-flex items-center gap-1.5 shrink-0"
          >
            {cta.label} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className="rounded-2xl p-4 border transition group hover:-translate-y-0.5"
            style={{
              background: 'var(--e-surface)',
              borderColor: 'var(--e-line)',
            }}
          >
            <div className={`size-10 rounded-xl bg-gradient-to-br ${it.tint} grid place-items-center text-[#06080f]`}>
              <it.icon className="size-5" strokeWidth={2.4} />
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--e-text-dim)' }}>
              {it.label}
            </div>
            <div className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--e-text-muted)' }}>
              {it.sub}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
