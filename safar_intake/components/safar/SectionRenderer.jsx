'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Search, MapPin, CalendarRange, Users, Sparkles, ArrowRight, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/safar/PropertyCard';
import CategoryPills from '@/components/safar/CategoryPills';
import { LISTINGS, IMG, STATS, TESTIMONIALS, AI_PROMPT_SUGGESTIONS } from '@/lib/data';

// Public renderer for CMS-driven pages / home pages.
// Renders an ordered array of `sections` (from cms_home_pages or cms_pages).
// Each section has: id, type, hidden?, props{}
// Unknown or unsupported types render nothing (safe fallback).
// Sections use existing Safar components + data as much as possible.

export default function SectionRenderer({ sections = [] }) {
  return (
    <>
      {sections.filter(s => !s.hidden).map((s) => (
        <SectionBlock key={s.id} section={s} />
      ))}
    </>
  );
}

function SectionBlock({ section }) {
  const { type, props = {} } = section;
  switch (type) {
    case 'hero': return <HeroSection p={props} />;
    case 'search': return <SearchSection p={props} />;
    case 'stats': return <StatsSection p={props} />;
    case 'categories': return <CategoriesSection p={props} />;
    case 'featured-listings': return <ListingsRow p={props} filter={() => true} defaultTitle={props.title || "Featured stays"} />;
    case 'luxury-collection': return <ListingsRow p={props} filter={(l)=>l.badge==='Luxury'||l.price>=6000} defaultTitle={props.title || 'Luxury Collection'} />;
    case 'houseboats': return <ListingsRow p={props} filter={(l)=>l.subcategory==='houseboat'||/houseboat/i.test(l.title||'')} defaultTitle={props.title || 'Houseboats on Dal Lake'} />;
    case 'hotels': return <ListingsRow p={props} filter={(l)=>l.subcategory==='hotel'||/hotel/i.test(l.title||'')} defaultTitle={props.title || 'Hotels'} />;
    case 'homestays': return <ListingsRow p={props} filter={(l)=>l.subcategory==='homestay'||l.subcategory==='cottage'} defaultTitle={props.title || 'Homestays & Cottages'} />;
    case 'experiences': return <ExperiencesSection p={props} />;
    case 'bike-rentals': return <ListingsRow p={props} filter={(l)=>l.category==='transport'&&/bike|scooter|motor/i.test(l.title||l.subcategory||'')} defaultTitle={props.title || 'Bike rentals'} />;
    case 'car-rentals': return <ListingsRow p={props} filter={(l)=>l.category==='transport'&&/cab|car|suv|taxi/i.test(l.title||l.subcategory||'')} defaultTitle={props.title || 'Cab & car rentals'} />;
    case 'shopping-guides': return <SimpleContent p={props} eyebrow="Shopping" title={props.title || 'Curated shopping guides'} desc="Handpicked artisan bazaars and workshops across Kashmir." />;
    case 'tour-guides': return <SimpleContent p={props} eyebrow="Guides" title={props.title || 'Trusted local guides'} desc="Certified guides who know every hidden corner of the valley." />;
    case 'wazwan': return <SimpleContent p={props} eyebrow="Cuisine" title={props.title || 'Wazwan & Kashmiri cuisine'} desc="Royal 7-course feasts, kehwa afternoons, and heritage bakeries." />;
    case 'popular-categories': return <CategoriesSection p={props} />;
    case 'offers': return <OffersSection p={props} />;
    case 'coupons': return <SimpleContent p={props} eyebrow="Coupons" title={props.title || 'Current coupons'} desc="Redeem coupon codes at checkout." />;
    case 'testimonials': return <TestimonialsSection p={props} />;
    case 'partners': return <PartnersSection p={props} />;
    case 'blog': return <SimpleContent p={props} eyebrow="Blog" title={props.title || 'Latest from the Safar journal'} />;
    case 'travel-stories': return <SimpleContent p={props} eyebrow="Stories" title={props.title || 'Travel stories'} desc="Long-reads from travelers across Kashmir." />;
    case 'instagram-feed': return <SimpleContent p={props} eyebrow="Instagram" title={props.title || `@${props.handle || 'safarkashmir'}`} />;
    case 'ai-planner-promo': return <AIPromoSection p={props} />;
    case 'host-cta': return <HostCTASection p={props} />;
    case 'faq': return <FAQSection p={props} />;
    case 'cta': return <CTASection p={props} />;
    case 'destinations': return <DestinationsSection p={props} />;
    case 'newsletter': return <NewsletterSection p={props} />;
    case 'html': return <div className="container py-12"><div dangerouslySetInnerHTML={{ __html: props.html || '' }} /></div>;
    default: return null;
  }
}

// ================================================================
// Individual sections
// ================================================================
const IMAGES_ROTATE = [
  'https://images.pexels.com/photos/25786776/pexels-photo-25786776.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/27108526/pexels-photo-27108526.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/14262339/pexels-photo-14262339.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/32620987/pexels-photo-32620987.jpeg?auto=compress&cs=tinysrgb&w=1920',
];

function HeroSection({ p }) {
  const variant = p.variant || 'seasonal-slideshow';
  const bg = IMAGES_ROTATE[0];
  const dark = ['dark-luxe','video-still','seasonal-slideshow','editorial'].includes(variant);
  const isMinimal = variant === 'minimal';
  if (isMinimal) {
    return (
      <section className="py-24 bg-white border-b">
        <div className="container max-w-3xl">
          <div className="text-emerald2 text-xs uppercase tracking-[0.22em] font-semibold">Safar</div>
          <h1 className="font-display font-bold mt-4 text-5xl md:text-6xl leading-[1.05] text-charcoal">{p.title || 'Curated Kashmir.'}</h1>
          {p.subtitle && <p className="mt-4 text-lg text-muted-foreground max-w-xl">{p.subtitle}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {p.ctaPrimary?.label && <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep px-6 h-11"><Link href={p.ctaPrimary?.href || '#'}>{p.ctaPrimary.label}</Link></Button>}
            {p.ctaSecondary?.label && <Button asChild variant="outline" className="rounded-full px-6 h-11"><Link href={p.ctaSecondary?.href || '#'}>{p.ctaSecondary.label}</Link></Button>}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="relative min-h-[80svh] w-full overflow-hidden">
      <Image src={bg} alt="" fill priority sizes="100vw" quality={70} className="object-cover" />
      <div className={`absolute inset-0 ${dark ? 'bg-[linear-gradient(180deg,rgba(15,20,25,0.55)_0%,rgba(15,20,25,0.35)_35%,rgba(15,20,25,0.65)_100%)]' : 'bg-white/40'}`} />
      <div className={`relative container flex flex-col justify-end min-h-[80svh] pb-16 pt-24 ${dark ? 'text-white' : 'text-charcoal'}`}>
        <div className="max-w-3xl">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${dark ? 'glass-dark' : 'bg-white border'} text-[11px] uppercase tracking-[0.22em] font-semibold`}>
            <Sparkles className="size-3.5 text-gold" /> Curated by locals
          </div>
          <h1 className="font-display font-bold mt-6 text-[clamp(2.4rem,6vw,5.2rem)] leading-[1.02] tracking-tight text-balance">{p.title || 'Experience Kashmir'}</h1>
          {p.subtitle && <p className={`mt-5 text-lg md:text-xl ${dark ? 'text-white/85' : 'text-charcoal/80'} max-w-2xl leading-relaxed`}>{p.subtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {p.ctaPrimary?.label && <Button asChild size="lg" className="rounded-full bg-emerald2 hover:bg-emerald2-deep text-white px-7 h-13 font-semibold"><Link href={p.ctaPrimary?.href || '#'}>{p.ctaPrimary.label} <ArrowRight className="ml-2 size-4" /></Link></Button>}
            {p.ctaSecondary?.label && <Button asChild size="lg" variant="outline" className={`rounded-full px-7 h-13 font-semibold ${dark ? 'bg-white/10 backdrop-blur text-white border-white/40 hover:bg-white/20' : ''}`}><Link href={p.ctaSecondary?.href || '#'}>{p.ctaSecondary.label}</Link></Button>}
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchSection({ p }) {
  const [where, setWhere] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const onSubmit = (e) => {
    e.preventDefault();
    const qp = new URLSearchParams();
    if (where.trim()) qp.set('location', where.trim());
    if (checkIn) qp.set('checkIn', checkIn);
    if (checkOut) qp.set('checkOut', checkOut);
    if (guests && guests !== 2) qp.set('guests', String(guests));
    window.location.href = `/explore${qp.toString() ? '?' + qp.toString() : ''}`;
  };
  return (
    <section className="py-8 bg-white border-b">
      <form onSubmit={onSubmit} className="container flex flex-col sm:flex-row gap-2">
        <label className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-2xl">
          <MapPin className="size-4 text-emerald2" />
          <input value={where} onChange={(e)=>setWhere(e.target.value)} placeholder="Where to?" className="flex-1 bg-transparent outline-none text-sm" />
        </label>
        <label className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-2xl">
          <CalendarRange className="size-4 text-emerald2" />
          <input type="date" value={checkIn} onChange={(e)=>setCheckIn(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
        </label>
        <label className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-2xl">
          <CalendarRange className="size-4 text-emerald2" />
          <input type="date" value={checkOut} onChange={(e)=>setCheckOut(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
        </label>
        <label className="flex items-center gap-2 px-3 py-2 border rounded-2xl">
          <Users className="size-4 text-emerald2" />
          <input type="number" min={1} max={20} value={guests} onChange={(e)=>setGuests(Number(e.target.value))} className="w-16 bg-transparent outline-none text-sm" />
        </label>
        <Button type="submit" className="rounded-2xl bg-emerald2 hover:bg-emerald2-deep h-auto px-5"><Search className="size-4 mr-2" />Search</Button>
      </form>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="py-12 border-b">
      <div className="container grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s) => (
          <div key={s.label} className="text-center md:text-left">
            <div className="font-display text-3xl md:text-4xl font-bold gradient-text-emerald">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoriesSection({ p }) {
  return (
    <section className="py-14 container">
      {p.title && <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">{p.title}</h2>}
      <CategoryPills value="all" onChange={() => {}} />
    </section>
  );
}

function ListingsRow({ p, filter, defaultTitle }) {
  const items = LISTINGS.filter(filter).slice(0, Number(p.limit) || 8);
  if (!items.length) return null;
  return (
    <section className="py-16 container">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">{defaultTitle.split(' ')[0]}</div>
          <h2 className="font-display text-2xl md:text-4xl font-bold mt-1">{defaultTitle}</h2>
        </div>
        <Link href="/explore" className="text-sm font-semibold text-emerald2 hover:underline">View all →</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((l, i) => <PropertyCard key={l.id} item={l} index={i} priority={i < 4} />)}
      </div>
    </section>
  );
}

function ExperiencesSection({ p }) {
  const items = LISTINGS.filter(l => l.category === 'experience').slice(0, 4);
  const fallback = [
    { title: 'Sunset Shikara', desc: 'Glide across Dal Lake.', img: IMG.shi1, price: 1200 },
    { title: 'Wazwan Royal Feast', desc: '7-course royal feast.', img: IMG.dal4, price: 2500 },
    { title: 'Gulmarg Gondola', desc: 'Phase 1 + 2 experience.', img: IMG.mtn1, price: 3800 },
    { title: 'Heritage Walk', desc: 'Old-city discovery.', img: IMG.dal3, price: 1500 },
  ];
  const list = items.length ? items.map(l => ({ title: l.title, desc: l.description, img: (l.images||[])[0] || l.image, price: l.price })) : fallback;
  return (
    <section className="py-16 container">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Local experiences</div>
          <h2 className="font-display text-2xl md:text-4xl font-bold mt-1">{p.title || 'Beyond the stay'}</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {list.map((e, i) => (
          <Link key={i} href="/explore?cat=experience" className="group relative aspect-[3/4] rounded-3xl overflow-hidden">
            {e.img && <Image src={e.img} alt={e.title} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover group-hover:scale-110 transition duration-700" />}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="font-display text-xl font-bold">{e.title}</div>
              <div className="text-xs opacity-80 line-clamp-2 mt-1">{e.desc}</div>
              <div className="mt-3 text-sm font-semibold">from ₹{Number(e.price).toLocaleString('en-IN')}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DestinationsSection({ p }) {
  const items = [
    { name: 'Srinagar', tag: 'Floating heritage', img: IMG.dal2, count: 248 },
    { name: 'Gulmarg', tag: 'Snow & ski capital', img: IMG.cab1, count: 142 },
    { name: 'Pahalgam', tag: 'Pine valleys', img: IMG.cot1, count: 167 },
    { name: 'Sonamarg', tag: 'Glacier escapes', img: IMG.mtn2, count: 89 },
  ];
  return (
    <section className="py-16 bg-secondary/40">
      <div className="container">
        <h2 className="font-display text-2xl md:text-4xl font-bold mb-6">{p.title || 'Trending destinations'}</h2>
        <div className={`grid grid-cols-2 lg:grid-cols-${p.columns || 4} gap-5`}>
          {items.map(d => (
            <Link key={d.name} href={`/explore?location=${d.name}`} className="group relative aspect-[4/5] rounded-3xl overflow-hidden">
              <Image src={d.img} alt={d.name} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover group-hover:scale-110 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">{d.tag}</div>
                <div className="font-display text-2xl font-bold mt-1">{d.name}</div>
                <div className="text-xs opacity-80 mt-1">{d.count} stays</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIPromoSection({ p }) {
  return (
    <section className="py-20 container">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold"><Wand2 className="size-3.5" /> Safar AI</div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 leading-[1.05]">{p.title || 'Your personal Kashmir trip planner.'}</h2>
          <p className="mt-4 text-muted-foreground">Compare stays, plan itineraries and estimate budgets — powered by AI and locals.</p>
          <div className="mt-6 flex flex-wrap gap-2">{AI_PROMPT_SUGGESTIONS.slice(0,3).map(x=><Link key={x} href="/ai-planner" className="text-sm px-4 py-2 rounded-full bg-white border hover:border-emerald2 hover:text-emerald2">{x}</Link>)}</div>
          <Button asChild className="mt-6 rounded-full bg-gradient-emerald px-7 h-11"><Link href="/ai-planner">Try AI Planner</Link></Button>
        </div>
        <div className="rounded-3xl bg-white border shadow-lg overflow-hidden">
          <div className="px-5 py-4 bg-gradient-emerald text-white"><div className="font-semibold">Safar AI</div></div>
          <div className="p-5 text-sm bg-secondary/30">Live demo · 5-day Kashmir plan under ₹40,000</div>
        </div>
      </div>
    </section>
  );
}

function HostCTASection({ p }) {
  return (
    <section className="py-16 container">
      <div className="relative overflow-hidden rounded-[2rem] p-10 md:p-14 bg-charcoal text-white">
        <Image src={IMG.mtn4} alt="" fill sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/30" />
        <div className="relative max-w-xl">
          <h2 className="font-display text-3xl md:text-5xl font-bold">{p.title || 'List your home. Reach the world.'}</h2>
          <p className="mt-3 opacity-85">Earn in your own valley with Safar hosting.</p>
          <Button asChild className="mt-6 rounded-full bg-white text-charcoal hover:bg-white/90 px-6 h-11"><Link href="/add-listing">Become a Host</Link></Button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ p }) {
  return (
    <section className="py-16 bg-secondary/40">
      <div className="container">
        <h2 className="font-display text-2xl md:text-4xl font-bold mb-6">{p.title || 'Stories from the valley'}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-white rounded-3xl p-6 border">
              <p className="text-charcoal/85 leading-relaxed">“{t.text}”</p>
              <div className="mt-4 text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.city}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSection({ p }) {
  return (
    <section className="py-14 container">
      <h2 className="font-display text-2xl font-bold mb-6 text-center">{p.title || 'Partners & press'}</h2>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
        {['J&K Tourism','TripAdvisor','MakeMyTrip','Booking','Ministry of Tourism','SKUAST'].map(x => (
          <div key={x} className="h-16 rounded-2xl bg-white border grid place-items-center text-charcoal/60 font-semibold text-xs">{x}</div>
        ))}
      </div>
    </section>
  );
}

function OffersSection({ p }) {
  return (
    <section className="py-16 container">
      <h2 className="font-display text-2xl md:text-4xl font-bold mb-6">{p.title || 'Current offers'}</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {[{ t: 'Winter Ski Package', d: 'Up to 20% off in Gulmarg', c: 'from-blue-500 to-blue-700' }, { t: 'Spring Bloom', d: 'Free Shikara ride with 3+ nights', c: 'from-emerald-500 to-emerald-700' }, { t: 'Wazwan Weekend', d: 'Complimentary heritage dinner', c: 'from-amber-500 to-amber-700' }].map(o => (
          <div key={o.t} className={`rounded-3xl p-6 text-white bg-gradient-to-br ${o.c}`}>
            <div className="font-display font-bold text-xl">{o.t}</div>
            <div className="text-sm opacity-90 mt-1">{o.d}</div>
            <Link href="/explore" className="mt-4 inline-block px-4 py-2 rounded-full bg-white text-charcoal text-sm font-semibold">Claim →</Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQSection({ p }) {
  const items = p.items || [
    { q: 'How does Safar work?', a: 'Search, book, and enjoy verified stays and experiences across Kashmir.' },
    { q: 'Is cancellation free?', a: 'Most listings offer flexible cancellation. Check each listing’s policy.' },
    { q: 'Do you support Wazwan bookings?', a: 'Yes — many hosts and experiences offer authentic Wazwan feasts.' },
  ];
  return (
    <section className="py-16 container">
      <h2 className="font-display text-2xl md:text-4xl font-bold mb-6">{p.title || 'Frequently asked'}</h2>
      <div className="space-y-3 max-w-2xl">
        {items.map((it, i) => (
          <details key={i} className="bg-white border rounded-2xl p-4">
            <summary className="cursor-pointer font-semibold">{it.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTASection({ p }) {
  return (
    <section className="py-16 container">
      <div className="relative overflow-hidden rounded-[2rem] p-10 md:p-14 bg-emerald2 text-white">
        {p.background && <Image src={p.background} alt="" fill sizes="100vw" className="object-cover opacity-30" />}
        <div className="relative max-w-xl">
          <h2 className="font-display text-3xl md:text-5xl font-bold">{p.title || 'Ready when you are.'}</h2>
          {p.subtitle && <p className="mt-3 opacity-85">{p.subtitle}</p>}
          {p.buttonLabel && <Button asChild className="mt-6 rounded-full bg-white text-emerald2 hover:bg-white/90 px-6 h-11"><Link href={p.buttonHref || '#'}>{p.buttonLabel}</Link></Button>}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({ p }) {
  return (
    <section className="py-16 container">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold">{p.title || 'Join our travel journal'}</h2>
        <p className="mt-2 text-muted-foreground">{p.subtitle || 'One curated newsletter a month.'}</p>
        <form className="mt-5 flex gap-2" onSubmit={(e)=>{e.preventDefault();}}>
          <input type="email" placeholder="you@example.com" className="flex-1 px-4 py-3 rounded-full border bg-white outline-none focus:border-emerald2" />
          <Button type="submit" className="rounded-full bg-emerald2 hover:bg-emerald2-deep px-6 h-auto">Subscribe</Button>
        </form>
      </div>
    </section>
  );
}

function SimpleContent({ p, eyebrow, title, desc }) {
  return (
    <section className="py-14 container">
      <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">{eyebrow}</div>
      <h2 className="font-display text-2xl md:text-4xl font-bold mt-1">{title}</h2>
      {desc && <p className="mt-3 text-muted-foreground max-w-2xl">{desc}</p>}
    </section>
  );
}
