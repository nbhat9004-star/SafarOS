'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Layers, ArrowRight, Users, FileText, Map as MapIcon, CalendarCheck, Truck, Wallet, Bot,
  Globe, Smartphone, Check, Menu, X, Play, Pause, Search, Sparkles, MapPin, Hotel, Car,
  Mountain, Send, Loader2, CheckCircle2, LayoutDashboard, Clock, Phone, MessageCircle,
} from 'lucide-react';
import { PLAN_CATALOG } from '@/lib/plans';
import { useLocalization } from '@/components/safaros/localization-provider';

/* ---------------------------------------------------- imagery */
const IMG = {
  hero: 'https://images.pexels.com/photos/29147674/pexels-photo-29147674.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  form: 'https://images.unsplash.com/photo-1716647710470-64f6e6c375f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwxfHxyb2FkJTIwdHJpcCUyMHN1bnNldHxlbnwwfHx8b3JhbmdlfDE3OTIyNTI4OTV8MA&ixlib=rb-4.1.0&q=85',
  feature: 'https://images.pexels.com/photos/19248218/pexels-photo-19248218.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
};

const EASE = [0.22, 1, 0.36, 1];
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const moneyFor = (amount, currency, locale) => { const value = Number(amount || 0); if (!value) return locale === 'ar' ? 'مجاناً' : 'Free'; const regionalPrices = { AED: { 2900: 129, 7900: 349, 19900: 899, 29000: 1290, 79000: 3490, 199000: 8990 } }; const configured = currency === 'INR' ? value : regionalPrices[currency]?.[value]; if (configured === undefined) return locale === 'ar' ? 'تواصل معنا لمعرفة السعر' : 'Contact for regional pricing'; try { return new Intl.NumberFormat(locale === 'ar' ? (currency === 'AED' ? 'ar-AE' : 'ar') : 'en', { style:'currency', currency, maximumFractionDigits:0 }).format(configured); } catch { return `${configured.toLocaleString(locale === 'ar' ? 'ar' : 'en')} ${currency}`; } };
const WARM = 'bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent';

const scrollToId = (id) => {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function SectionHead({ eyebrow, title, sub, dark = false }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${dark ? 'text-amber-300' : 'text-orange-600'}`}>{eyebrow}</span>
      <h2 className={`mt-3 text-balance text-3xl font-bold tracking-tight sm:text-5xl ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      {sub && <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? 'text-white/65' : 'text-slate-600'}`}>{sub}</p>}
    </Reveal>
  );
}

/* ---------------------------------------------------- header */
const NAV = [['Demo', 'demo'], ['Features', 'features'], ['Pricing', 'pricing'], ['Early access', 'early-access']];
const NAV_AR = [['العرض التوضيحي','demo'],['المميزات','features'],['الأسعار','pricing'],['التسجيل المبكر','early-access']];

function Header() {
  const { locale } = useLocalization();
  const isArabic = locale === 'ar';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const go = (id) => { setOpen(false); scrollToId(id); };

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled ? 'border-b border-white/10 bg-slate-950/90 backdrop-blur-xl' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 text-white" data-testid="nav-logo">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600 shadow-lg shadow-indigo-900/40"><Layers className="h-4 w-4" /></span>
            <span className="text-base font-bold tracking-tight">SafarOS</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {(isArabic ? NAV_AR : NAV).map(([label, id]) => (
              <button key={id} onClick={() => go(id)} data-testid={`nav-${id}`} className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white">{label}</button>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <a href="/login" data-testid="nav-signin" className="px-3 py-1.5 text-sm font-semibold text-white/85 hover:text-white">{isArabic?'تسجيل الدخول':'Sign in'}</a>
            <button onClick={() => go('early-access')} data-testid="nav-cta" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-900/30 transition hover:brightness-110">
              {isArabic ? 'احصل على وصول مبكر' : 'Get early access'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setOpen(true)} data-testid="nav-menu" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm font-medium text-white md:hidden" aria-label="Open menu">
            {isArabic?'القائمة':'Menu'} <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col bg-slate-950 md:hidden">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <span className="flex items-center gap-2 text-white"><Layers className="h-5 w-5" /><span className="font-bold">SafarOS</span></span>
              <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-1 px-5 py-6">
              {(isArabic ? NAV_AR : NAV).map(([label, id]) => (
                <button key={id} onClick={() => go(id)} className="block w-full rounded-xl px-3 py-3 text-left text-lg font-medium text-white/90 hover:bg-white/5">{label}</button>
              ))}
            </div>
            <div className="border-t border-white/10 p-5">
              <button onClick={() => go('early-access')} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-semibold text-slate-950">{isArabic?'احصل على وصول مبكر':'Get early access'} <ArrowRight className="h-4 w-4" /></button>
              <a href="/login" className="mt-2 block py-2 text-center text-sm font-medium text-white/60">{isArabic?'تسجيل الدخول':'Sign in'}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------------------------------------------- hero */
function Hero() {
  const { locale, currency } = useLocalization();
  const isArabic = locale === 'ar';
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <img src={IMG.hero} alt="Desert dunes at golden hour" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/35 to-slate-950" />
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/50 via-transparent to-orange-900/20" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-36 text-center sm:pb-32 sm:pt-44">
        <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
          className="so-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/85">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {isArabic ? 'برنامج لوكالات السفر ومنظمي الرحلات' : 'Software for travel agencies & tour operators'}
        </motion.span>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.8, ease: EASE }}
          className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-6xl" data-testid="hero-title">
          {isArabic ? <>أدر وكالة السفر بالكامل <span className={WARM}>من مكان واحد.</span></> : <>Run your whole travel agency <span className={WARM}>from one place.</span></>}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {isArabic ? 'الاستفسارات والعروض وخطط الرحلات والحجوزات والسائقون والمدفوعات — يساعدك SafarOS على إدارة كل رحلة من أول اتصال حتى الوصول.' : 'Enquiries, quotes, itineraries, bookings, drivers and payments — SafarOS keeps every trip moving, from the first call to the last drop-off.'}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.7, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => scrollToId('demo')} data-testid="hero-demo-btn" className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white/90">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"><Play className="h-3 w-3 fill-current" /></span> {isArabic ? 'شاهد العرض التوضيحي' : 'Watch the demo'}
          </button>
          <button onClick={() => scrollToId('early-access')} data-testid="hero-cta-btn" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_10px_40px_rgba(251,146,60,0.35)] transition hover:brightness-110">
            {isArabic ? 'احصل على وصول مبكر' : 'Get early access'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
          className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
          {(isArabic ? ['تجربة مجانية لمدة 14 يوماً', `الأسعار بعملة ${currency}`, 'يعمل على الهاتف والكمبيوتر'] : ['14-day free trial', `Prices in ${currency}`, 'Works on phone & laptop']).map((t) => (
            <span key={t} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-amber-400" />{t}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- interactive demo */
const TOUR = [
  { id: 'lead', module: 'Leads', icon: Users, title: 'Capture every enquiry', caption: 'Website, WhatsApp and phone enquiries land in one pipeline — nothing slips through.' },
  { id: 'quote', module: 'Quotations', icon: FileText, title: 'Build a quote in minutes', caption: 'Costs, markup and tax add up for you, so you see your profit before you hit send.' },
  { id: 'itinerary', module: 'Itineraries', icon: MapIcon, title: 'Plan the trip day by day', caption: 'Hotels, transfers and activities for each day, ready to share with your traveller.' },
  { id: 'booking', module: 'Bookings', icon: CalendarCheck, title: 'Confirm every booking', caption: 'Track hotel, cab and activity confirmations in one list instead of ten chats.' },
  { id: 'fleet', module: 'Fleet', icon: Truck, title: 'Dispatch cars and drivers', caption: 'Assign the right vehicle and driver — SafarOS warns you about clashes and expired papers.' },
  { id: 'ai', module: 'AI Copilot', icon: Bot, title: 'Ask your AI assistant', caption: 'Get a lead summary and the next best step in seconds.' },
];
const STEP_MS = 6000;

function CountUp({ to, run }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return undefined;
    let raf; const start = performance.now(); const dur = 900;
    const tick = (now) => { const p = Math.min(1, (now - start) / dur); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return <>{inr(v)}</>;
}

function LeadScreen() {
  const cols = [
    { name: 'New', items: [['Rohan Kapoor', 'Ladakh · 2 pax', 'Phone']] },
    { name: 'Contacted', items: [['Sana Qureshi', 'Goa · 3 pax', 'WhatsApp'], ['Vikram Rao', 'Kerala · 4 pax', 'Website']] },
    { name: 'Quoted', items: [['Meera Iyer', 'Rajasthan · 2 pax', 'Referral']] },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cols.map((c, ci) => (
        <div key={c.name} className="rounded-xl bg-slate-100/80 p-2.5">
          <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-slate-600">{c.name}<span className="rounded-full bg-white px-1.5 text-[10px] text-slate-400">{c.items.length + (ci === 0 ? 1 : 0)}</span></div>
          <div className="space-y-2">
            {ci === 0 && (
              <motion.div initial={{ opacity: 0, y: -18, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
                className="rounded-lg border-2 border-amber-400 bg-white p-2.5 shadow-md">
                <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-slate-900">Aarav Mehta</span><span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">Just now</span></div>
                <div className="mt-0.5 text-[11px] text-slate-500">Kashmir · 4 pax · 5 nights</div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-600"><Globe className="h-3 w-3" /> Website enquiry</div>
              </motion.div>
            )}
            {c.items.map((it) => (
              <div key={it[0]} className="rounded-lg bg-white p-2.5 shadow-sm">
                <div className="text-[13px] font-medium text-slate-800">{it[0]}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{it[1]}</div>
                <div className="mt-1.5 text-[10px] text-slate-400">{it[2]}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuoteScreen() {
  const rows = [['Hotels · 5 nights', 62000], ['Transfers & sightseeing cab', 18500], ['Activities (Gondola, Shikara)', 9500], ['Your markup (20%)', 18000], ['GST (5%)', 5400]];
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-500"><span className="font-semibold text-slate-800">Quote #Q-1042 · Aarav Mehta</span><span>Kashmir · 4 pax</span></div>
      {rows.map((r, i) => (
        <motion.div key={r[0]} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.18, duration: 0.4, ease: EASE }}
          className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm text-slate-600">
          <span>{r[0]}</span><span className={`font-semibold ${i === 3 ? 'text-emerald-600' : 'text-slate-900'}`}>{i >= 3 ? '+ ' : ''}{inr(r[1])}</span>
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.5, ease: EASE }}
        className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white">
        <div><div className="text-xs text-white/70">Customer price</div><div className="text-2xl font-bold"><CountUp to={113400} run /></div></div>
        <div className="text-right"><div className="text-xs text-white/70">Your profit</div><div className="text-lg font-bold text-amber-300"><CountUp to={18000} run /></div></div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="mt-3 flex items-center justify-end gap-2 text-xs font-medium text-emerald-600">
        <Send className="h-3.5 w-3.5" /> Sent to client on WhatsApp & email
      </motion.div>
    </div>
  );
}

function ItineraryScreen() {
  const days = [['Srinagar', 'Arrival · Houseboat stay on Dal Lake', Hotel], ['Gulmarg', 'Gondola ride · Snow point', Mountain], ['Pahalgam', 'Betaab & Aru Valley', MapPin], ['Sonmarg', 'Thajiwas Glacier day trip', Mountain], ['Srinagar', 'Shikara ride · Departure', Car]];
  return (
    <div className="space-y-2">
      {days.map((d, i) => { const Ic = d[2]; return (
        <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.2, duration: 0.45, ease: EASE }}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white"><span className="text-[9px] font-medium leading-none">DAY</span><span className="text-sm font-bold leading-none">{i + 1}</span></div>
          <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-slate-900">{d[0]}</div><div className="truncate text-xs text-slate-500">{d[1]}</div></div>
          <Ic className="h-4 w-4 shrink-0 text-indigo-500" />
        </motion.div>
      ); })}
    </div>
  );
}

function BookingScreen() {
  const items = [['Houseboat · Dal Lake', 'Hotel', Hotel], ['Hotel · Gulmarg', 'Hotel', Hotel], ['Innova Crysta · 5 days', 'Cab', Car], ['Gulmarg Gondola tickets', 'Activity', Mountain]];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = items.map((_, i) => setTimeout(() => setDone(i + 1), 700 + i * 850));
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs"><span className="font-semibold text-slate-800">Booking #B-2207 · Aarav Mehta</span><span className="text-slate-500">{done}/{items.length} confirmed</span></div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full rounded-full bg-emerald-500" animate={{ width: `${(done / items.length) * 100}%` }} transition={{ duration: 0.4 }} /></div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {items.map((it, i) => { const Ic = it[2]; const ok = done > i; return (
          <div key={it[0]} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Ic className="h-4 w-4" /></span><div className="min-w-0"><div className="truncate text-sm font-medium text-slate-800">{it[0]}</div><div className="text-[11px] text-slate-400">{it[1]}</div></div></div>
            <motion.span key={ok ? 'ok' : 'pending'} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ok ? 'Confirmed' : 'Pending'}</motion.span>
          </div>
        ); })}
      </div>
    </div>
  );
}

function FleetScreen() {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 p-3 md:col-span-3">
        <svg viewBox="0 0 400 170" className="h-44 w-full">
          <defs><linearGradient id="route" x1="0" x2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#fb7185" /></linearGradient></defs>
          {[30, 70, 110, 150].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />)}
          <motion.path d="M30,140 C100,120 120,40 210,60 S340,120 370,30" fill="none" stroke="url(#route)" strokeWidth="3.5" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: EASE }} />
          <circle cx="30" cy="140" r="6" fill="#34d399" /><circle cx="370" cy="30" r="6" fill="#fb7185" />
          <text x="40" y="160" fill="rgba(255,255,255,0.6)" fontSize="11">Srinagar Airport</text>
          <text x="300" y="22" fill="rgba(255,255,255,0.6)" fontSize="11">Gulmarg</text>
        </svg>
        <div className="absolute right-3 top-3 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur">ETA 1h 50m</div>
      </div>
      <div className="space-y-2.5 md:col-span-2">
        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.45, ease: EASE }} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Car className="h-4 w-4 text-indigo-500" /> Innova Crysta</span><span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Assigned</span></div>
          <div className="mt-1 text-xs text-slate-500">JK01 AB 1234 · 7 seats</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.45, ease: EASE }} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Users className="h-4 w-4 text-indigo-500" /> Bashir Ahmad</span><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">On trip</span></div>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3 w-3" /> Driver · licence valid</div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700"><Check className="h-4 w-4" /> No clashes with other trips</motion.div>
      </div>
    </div>
  );
}

function AiScreen() {
  const answer = 'Family of 4 from Mumbai, 5 nights in Kashmir, budget about ₹1.1 lakh. Quote sent yesterday and opened twice. Next step: call this evening and offer a Gulmarg snow-activity add-on.';
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0; let iv;
    const start = setTimeout(() => { iv = setInterval(() => { i += 3; setN(i); if (i >= answer.length) clearInterval(iv); }, 22); }, 900);
    return () => { clearTimeout(start); clearInterval(iv); };
  }, [answer.length]);
  return (
    <div className="mx-auto max-w-lg space-y-3">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
        Summarise Aarav Mehta&apos;s enquiry and tell me what to do next.
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }} className="flex gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Sparkles className="h-4 w-4" /></span>
        <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
          {n === 0 ? <span className="inline-flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" /></span> : answer.slice(0, n)}
          {n > 0 && n < answer.length && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-indigo-500" />}
        </div>
      </motion.div>
    </div>
  );
}

const SCREENS = { lead: LeadScreen, quote: QuoteScreen, itinerary: ItineraryScreen, booking: BookingScreen, fleet: FleetScreen, ai: AiScreen };

function Demo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '-120px' });
  useEffect(() => { setVisible(inView); }, [inView]);
  const running = playing && visible;
  useEffect(() => {
    if (!running) return undefined;
    const t = setTimeout(() => setStep((s) => (s + 1) % TOUR.length), STEP_MS);
    return () => clearTimeout(t);
  }, [step, running]);
  const { locale } = useLocalization();
  const isArabic = locale === 'ar';
  const tourAr = [ ['العملاء','استقبل كل استفسار','تصل استفسارات الموقع وواتساب والهاتف إلى مسار واحد دون أن يفوتك شيء.'], ['عروض الأسعار','أنشئ عرض سعر خلال دقائق','تُحسب التكاليف وهامش الربح والضرائب تلقائياً قبل إرسال العرض.'], ['خطط الرحلات','خطط الرحلة يوماً بيوم','فنادق وتنقلات وأنشطة يومية جاهزة للمشاركة مع المسافر.'], ['الحجوزات','أكد كل حجز','تابع تأكيدات الفنادق والسيارات والأنشطة في قائمة واحدة.'], ['الأسطول','نظّم السيارات والسائقين','عيّن السيارة والسائق المناسبين وتابع التعارضات وانتهاء المستندات.'], ['مساعد ذكي','اسأل مساعدك الذكي','احصل على ملخص للاستفسار والخطوة التالية خلال ثوانٍ.'] ];
  const cur = TOUR[step];
  const currentText = isArabic ? { ...cur, module: tourAr[step][0], title: tourAr[step][1], caption: tourAr[step][2] } : cur;
  const Screen = SCREENS[cur.id];
  const pick = (i) => { setStep(i); };

  return (
    <section id="demo" ref={ref} className="so-section relative overflow-hidden bg-slate-950 py-20 sm:py-28">
      <div className="so-aurora absolute -left-20 top-20 h-80 w-80 rounded-full bg-indigo-600/25 blur-[120px]" />
      <div className="so-aurora absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-orange-500/15 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead dark eyebrow="Live product tour" title={<>See SafarOS <span className={WARM}>in action.</span></>} sub="Follow one Kashmir trip from enquiry to drop-off. Tap any step to jump in." />

        {/* step chips */}
        <Reveal delay={0.05} className="mt-10">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center" data-testid="demo-steps">
            {TOUR.map((t, i) => { const Ic = t.icon; const on = i === step; return (
              <button key={t.id} onClick={() => pick(i)} data-testid={`demo-step-${t.id}`}
                className={`relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${on ? 'border-amber-400/60 bg-white/10 text-white' : 'border-white/10 text-white/55 hover:text-white'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${on ? 'bg-amber-400 text-slate-950' : 'bg-white/10'}`}>{i + 1}</span>
                <Ic className="h-4 w-4" /> {t.module}
                {on && <motion.span key={`${step}-${running}`} className="absolute bottom-0 left-0 h-0.5 bg-amber-400" initial={{ width: '0%' }} animate={{ width: running ? '100%' : '0%' }} transition={{ duration: running ? STEP_MS / 1000 : 0, ease: 'linear' }} />}
              </button>
            ); })}
          </div>
        </Reveal>

        {/* app window */}
        <Reveal delay={0.1} className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]" data-testid="demo-window">
            <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-3 hidden rounded-md bg-white/5 px-3 py-0.5 text-[11px] text-white/45 sm:inline">app.safaros.com/{cur.id}</span>
              <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">Sample data</span>
              <button onClick={() => setPlaying((p) => !p)} data-testid="demo-play-toggle" aria-label={playing ? 'Pause tour' : 'Play tour'}
                className="flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-[11px] font-medium text-white/80 hover:bg-white/15">
                {playing ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Play</>}
              </button>
            </div>
            <div className="flex min-h-[460px] bg-slate-50">
              {/* sidebar */}
              <aside className="hidden w-48 shrink-0 flex-col border-r border-slate-200 bg-white p-3 md:flex">
                <div className="mb-4 flex items-center gap-2 px-1"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><Layers className="h-3.5 w-3.5" /></span><div className="leading-tight"><div className="text-xs font-bold text-slate-900">Kashmir Trails</div><div className="text-[10px] text-slate-400">Sample agency</div></div></div>
                <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-slate-400"><LayoutDashboard className="h-4 w-4" /> Dashboard</div>
                {TOUR.map((t, i) => { const Ic = t.icon; const on = i === step; return (
                  <button key={t.id} onClick={() => pick(i)} className={`relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${on ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}>
                    {on && <motion.span layoutId="demo-side" className="absolute inset-0 rounded-lg bg-indigo-50" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                    <span className="relative flex items-center gap-2"><Ic className="h-4 w-4" /> {isArabic ? tourAr[i][0] : t.module}</span>
                  </button>
                ); })}
                <div className="mt-auto rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-2.5 text-[11px] text-orange-800"><Clock className="mb-1 h-3.5 w-3.5" />Trial: 14 days left</div>
              </aside>
              {/* main */}
              <div className="min-w-0 flex-1 p-4 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <AnimatePresence mode="wait">
                    <motion.div key={cur.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">{isArabic ? `الخطوة ${step + 1} من ${TOUR.length}` : `Step ${step + 1} of ${TOUR.length}`}</div>
                      <h3 className="text-lg font-bold text-slate-900 sm:text-xl" data-testid="demo-step-title">{currentText.title}</h3>
                    </motion.div>
                  </AnimatePresence>
                  <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 sm:flex"><Search className="h-3.5 w-3.5" /> {isArabic ? 'ابحث عن العملاء والحجوزات…' : 'Search clients, bookings…'}</div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={cur.id} initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }} transition={{ duration: 0.35, ease: EASE }}>
                    <Screen />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.p key={cur.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-white/70 sm:text-base" data-testid="demo-caption">{currentText.caption}</motion.p>
        </AnimatePresence>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="/signup" data-testid="demo-try-btn" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/90">{isArabic ? 'جرّبه مجاناً لمدة 14 يوماً' : 'Try it free for 14 days'} <ArrowRight className="h-4 w-4" /></a>
          <button onClick={() => scrollToId('early-access')} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5">{isArabic ? 'احجز عرضاً توضيحياً' : 'Book a guided demo'}</button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- features */
const FEATURES = [
  { icon: Users, title: 'Leads & CRM', text: 'Every enquiry in one pipeline with follow-up reminders.' },
  { icon: FileText, title: 'Smart quotations', text: 'Auto-calculated markup, tax and profit on every quote.' },
  { icon: MapIcon, title: 'Itinerary builder', text: 'Day-by-day plans with hotels, transfers and activities.' },
  { icon: CalendarCheck, title: 'Bookings', text: 'Track every confirmation, voucher and supplier.' },
  { icon: Truck, title: 'Fleet & drivers', text: 'Assign cars and drivers, with document expiry alerts.' },
  { icon: Wallet, title: 'Finance & payments', text: 'Invoices, collections and dues at a glance.' },
  { icon: Globe, title: 'Agency website', text: 'Your own website — enquiries flow straight into SafarOS.' },
  { icon: Bot, title: 'AI Copilot', text: 'Lead summaries, follow-ups and itinerary help on demand.' },
];

function Features() {
  const { locale } = useLocalization(); const isArabic = locale === 'ar';
  const features = isArabic ? [
    {icon:Users,title:'العملاء وإدارة العلاقات',text:'اجمع كل الاستفسارات في مسار واحد مع تذكيرات للمتابعة.'},{icon:FileText,title:'عروض أسعار ذكية',text:'احسب هامش الربح والضرائب تلقائياً في كل عرض.'},{icon:MapIcon,title:'منشئ خطط الرحلات',text:'خطط يومية تشمل الفنادق والتنقلات والأنشطة.'},{icon:CalendarCheck,title:'الحجوزات',text:'تابع التأكيدات والقسائم والموردين من مكان واحد.'},{icon:Truck,title:'الأسطول والسائقون',text:'عيّن السيارات والسائقين وتابع انتهاء المستندات.'},{icon:Wallet,title:'المالية والمدفوعات',text:'الفواتير والتحصيلات والمبالغ المستحقة في لمحة.'},{icon:Globe,title:'موقع الوكالة',text:'موقع خاص بوكالتك يرسل الاستفسارات مباشرة إلى SafarOS.'},{icon:Bot,title:'مساعد الذكاء الاصطناعي',text:'ملخصات العملاء والمتابعات ومساعدة في إعداد الرحلات.'}
  ] : FEATURES;
  return (
    <section id="features" className="so-section bg-[#FBF7F1] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow={isArabic?'المميزات':'Features'} title={isArabic?'كل ما تحتاجه وكالة السفر.':'Everything a travel agency needs.'} sub={isArabic?'أدوات بسيطة يستطيع فريقك تعلّمها في يوم واحد.':'Simple tools your whole team can learn in a day.'} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => { const Ic = f.icon; return (
            <Reveal key={f.title} delay={(i % 4) * 0.06}>
              <div className="so-lift group h-full rounded-2xl border border-orange-100 bg-white p-5 shadow-sm hover:shadow-xl hover:shadow-orange-900/5" data-testid={`feature-card-${i}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-900/20 transition group-hover:from-amber-400 group-hover:to-orange-500"><Ic className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            </Reveal>
          ); })}
        </div>
        <Reveal delay={0.1} className="mt-6">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={IMG.feature} alt="Mountains at golden hour" loading="lazy" className="h-56 w-full object-cover sm:h-64" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-300"><Smartphone className="h-4 w-4" /> {isArabic ? 'بوابة العملاء' : 'Customer portal'}</div>
              <h3 className="mt-2 max-w-md text-2xl font-bold text-white sm:text-3xl">{isArabic ? 'يحصل مسافروك على تفاصيل الرحلة والقسائم والمدفوعات عبر رابط واحد.' : 'Your travellers get their trip, vouchers and payments in one link.'}</h3>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- pricing */
const FEATURE_LABELS = {
  crm: 'Leads & CRM', quotations: 'Quotations', packages: 'Tour packages', finance: 'Finance', websiteBuilder: 'Agency website',
  communications: 'Messaging', fleet: 'Fleet & drivers', payments: 'Online payments', aiCopilot: 'AI Copilot', customerPortal: 'Customer portal', analytics: 'Analytics',
};
const limitText = (v) => (v === -1 ? 'Unlimited' : Number(v || 0).toLocaleString('en-IN'));

function Pricing({ onChoose }) {
  const { locale, currency } = useLocalization(); const isArabic = locale === 'ar';
  const [yearly, setYearly] = useState(false);
  const plans = (PLAN_CATALOG || []).filter((p) => p.status === 'active');
  return (
    <section id="pricing" className="so-section bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow={isArabic?'الأسعار':'Pricing'} title={isArabic?'خطط بسيطة تنمو مع أعمالك.':'Simple plans that grow with you.'} sub={isArabic?'ابدأ بتجربة مجانية وانتقل إلى خطة مدفوعة عندما تكون مستعداً.':"Start with a free trial. Upgrade only when you're ready."} />
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 text-sm" data-testid="billing-toggle">
            {(isArabic ? [['شهري',false],['سنوي',true]] : [['Monthly',false],['Yearly',true]]).map(([l, v]) => (
              <button key={l} onClick={() => setYearly(v)} data-testid={`billing-${l.toLowerCase()}`} className={`relative rounded-full px-4 py-1.5 font-medium ${yearly === v ? 'text-white' : 'text-slate-600'}`}>
                {yearly === v && <motion.span layoutId="bill" className="absolute inset-0 rounded-full bg-slate-900" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{l}{v && <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">{isArabic?'شهران مجاناً':'2 months free'}</span>}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => {
            const popular = p.id === 'professional';
            const price = yearly ? p.priceYearly : p.price;
            const feats = Object.entries(p.features || {}).filter(([, on]) => on).map(([k]) => FEATURE_LABELS[k]).filter(Boolean).map((f) => isArabic ? ({'Leads & CRM':'العملاء وإدارة العلاقات','Quotations':'عروض الأسعار','Tour packages':'الباقات السياحية','Finance':'المالية','Agency website':'موقع الوكالة','Messaging':'المراسلات','Fleet & drivers':'الأسطول والسائقون','Online payments':'المدفوعات الإلكترونية','AI Copilot':'مساعد الذكاء الاصطناعي','Customer portal':'بوابة العملاء','Analytics':'التحليلات'}[f] || f) : f);
            return (
              <Reveal key={p.id} delay={i * 0.06}>
                <div className={`relative flex h-full flex-col rounded-2xl border p-6 ${popular ? 'border-transparent bg-slate-950 text-white shadow-2xl shadow-indigo-900/30 ring-2 ring-amber-400' : 'border-slate-200 bg-white text-slate-900'}`} data-testid={`plan-card-${p.id}`}>
                  {popular && <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[11px] font-bold text-slate-950">{isArabic?'الأكثر شيوعاً':'Most popular'}</span>}
                  <h3 className="text-lg font-bold">{isArabic ? ({Trial:'التجربة المجانية',Starter:'المبتدئة',Professional:'الاحترافية',Enterprise:'المؤسسات'}[p.name] || p.name) : p.name}</h3>
                  <p className={`mt-1 min-h-[40px] text-sm ${popular ? 'text-white/60' : 'text-slate-500'}`}>{isArabic ? ({'Full access to evaluate SafarOS for a limited time':'وصول كامل لتجربة SafarOS لفترة محدودة.','Essentials for a small travel agency getting started.':'الأساسيات لوكالة سفر صغيرة في بداية عملها.','Scaling agencies that need automation, finance and analytics.':'للوكالات النامية التي تحتاج إلى الأتمتة والمالية والتحليلات.','Unlimited scale with every SafarOS capability unlocked.':'توسّع بلا حدود مع جميع إمكانات SafarOS.'}[p.description] || p.description) : p.description}</p>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight" data-testid={`plan-price-${p.id}`}>{moneyFor(price, currency, locale)}</span>
                    <span className={`mb-1 text-sm ${popular ? 'text-white/50' : 'text-slate-400'}`}>{price ? (yearly ? (isArabic?'/سنة':'/year') : (isArabic?'/شهر':'/month')) : (isArabic?`لمدة ${p.trialDays||14} يوماً`:`for ${p.trialDays || 14} days`)}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    <li className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-amber-400' : 'text-orange-500'}`} /><span><b>{limitText(p.limits?.teamMembers)}</b> {isArabic?'أعضاء الفريق':'team members'}</span></li>
                    <li className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-amber-400' : 'text-orange-500'}`} /><span><b>{limitText(p.limits?.bookings)}</b> {isArabic?'حجوزات':'bookings'}</span></li>
                    {feats.slice(0, 7).map((f) => (
                      <li key={f} className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-amber-400' : 'text-orange-500'}`} /><span className={popular ? 'text-white/85' : 'text-slate-700'}>{f}</span></li>
                    ))}
                    {feats.length > 7 && <li className={`pl-6 text-xs ${popular ? 'text-white/50' : 'text-slate-400'}`}>+ {feats.length - 7} more</li>}
                  </ul>
                  {p.id === 'trial' ? (
                    <a href="/signup" data-testid={`plan-cta-${p.id}`} className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">{isArabic?'ابدأ التجربة المجانية':'Start free trial'}</a>
                  ) : (
                    <button onClick={() => onChoose(p.id)} data-testid={`plan-cta-${p.id}`} className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${popular ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{isArabic?`اختر ${{trial:'التجريبية',starter:'المبتدئة',professional:'الاحترافية',enterprise:'المؤسسات'}[p.id]||p.name}`:`Choose ${p.name}`} <ArrowRight className="h-4 w-4" /></button>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">{isArabic ? `الأسعار معروضة بعملة ${currency}. قد تُضاف الضرائب حسب الاقتضاء.` : `Prices in ${currency}. Taxes extra where applicable.`}</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- early access form */
const TEAM_SIZES = ['1', '2-5', '6-20', '21-50', '50+'];
const PLAN_OPTIONS = [['not_sure', 'Not sure yet'], ...PLAN_CATALOG.map((p) => [p.id, p.name])];
const EMPTY = { name: '', email: '', phone: '', agencyName: '', city: '', teamSize: '', interestedPlan: 'not_sure', message: '', website: '' };

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}{required && <span className="text-orange-600"> *</span>}</span>
      {children}
    </label>
  );
}
const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100';

function EarlyAccess({ plan }) {
  const { locale } = useLocalization(); const isArabic = locale === 'ar';
  const [f, setF] = useState(EMPTY);
  const [state, setState] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');
  useEffect(() => { if (plan) setF((p) => ({ ...p, interestedPlan: plan })); }, [plan]);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.name.trim()) return setError(isArabic?'يرجى إدخال اسمك.':'Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) return setError(isArabic?'يرجى إدخال بريد إلكتروني صحيح.':'Please enter a valid email address.');
    setState('sending');
    try {
      const res = await fetch('/api/early-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || (isArabic?'حدث خطأ. يرجى المحاولة مرة أخرى.':'Something went wrong. Please try again.'));
      setState('done');
    } catch (ex) {
      setError(ex?.message || (isArabic?'حدث خطأ. يرجى المحاولة مرة أخرى.':'Something went wrong. Please try again.'));
      setState('idle');
    }
  };

  return (
    <section id="early-access" className="so-section relative overflow-hidden bg-slate-950 py-20 sm:py-28">
      <img src={IMG.form} alt="Road trip at sunset" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{isArabic?'التسجيل المبكر':'Early access'}</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">{isArabic ? <>كن من أوائل الوكالات على <span className={WARM}>SafarOS.</span></> : <>Be one of the first agencies on <span className={WARM}>SafarOS.</span></>}</h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">{isArabic?'أخبرنا قليلاً عن وكالتك. سنتواصل معك لإعداد مساحة العمل وتقديم شرح مخصص لك.':<>Tell us a little about your agency. We&apos;ll reach out to set up your workspace and give you a personal walkthrough.</>}</p>
          <ul className="mt-7 space-y-3 text-sm text-white/80">
            {(isArabic?['مساعدة مجانية في نقل بيانات العملاء والموردين','عرض توضيحي مخصص لفريقك','تثبيت سعر التسجيل المبكر لوكالتك']:['Free help moving your clients and suppliers in','A guided demo for your team','Early-bird pricing locked in for your agency']).map((t) => (
              <li key={t} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/15 text-amber-300"><Check className="h-3.5 w-3.5" /></span>{t}</li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-3xl bg-white p-6 text-start shadow-2xl sm:p-8" data-testid="early-access-card">
            <AnimatePresence mode="wait">
              {state === 'done' ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: EASE }} className="py-10 text-center" data-testid="early-access-success">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
                  <h3 className="mt-5 text-2xl font-bold text-slate-900">{isArabic?'تم تسجيل طلبك بنجاح!':"You're on the list!"}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">{isArabic?`شكراً ${f.name.split(' ')[0] || ''}. سيتواصل فريقنا معك قريباً عبر `:`Thanks, ${f.name.split(' ')[0] || 'there'}. Our team will contact you at `}<b dir="ltr">{f.email}</b>{isArabic?'.':' shortly.'}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">{isArabic?'ابدأ التجربة المجانية الآن':'Start free trial now'} <ArrowRight className="h-4 w-4" /></a>
                    <button onClick={() => { setF(EMPTY); setState('idle'); }} className="rounded-full px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900">{isArabic?'إرسال طلب آخر':'Send another'}</button>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-start" noValidate data-testid="early-access-form">
                  <div className="flex items-center gap-2 text-slate-900"><MessageCircle className="h-5 w-5 text-orange-500" /><h3 className="text-lg font-bold">{isArabic?'طلب التسجيل المبكر':'Request early access'}</h3></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={isArabic?'الاسم الكامل':'Your name'} required><input dir={isArabic?'rtl':'ltr'} className={inputCls} value={f.name} onChange={set('name')} placeholder={isArabic?'اكتب اسمك الكامل':'Full name'} data-testid="ea-name" /></Field>
                    <Field label={isArabic?'البريد الإلكتروني للعمل':'Work email'} required><input dir="ltr" type="email" className={inputCls} value={f.email} onChange={set('email')} placeholder="you@agency.com" data-testid="ea-email" /></Field>
                    <Field label={isArabic?'الهاتف / واتساب':'Phone / WhatsApp'}><input dir="ltr" className={inputCls} value={f.phone} onChange={set('phone')} placeholder={isArabic?'+971':'+91'} data-testid="ea-phone" /></Field>
                    <Field label={isArabic?'اسم الوكالة':'Agency name'}><input dir={isArabic?'rtl':'ltr'} className={inputCls} value={f.agencyName} onChange={set('agencyName')} placeholder={isArabic?'اسم وكالتك':'Your agency'} data-testid="ea-agency" /></Field>
                    <Field label={isArabic?'المدينة':'City'}><input dir={isArabic?'rtl':'ltr'} className={inputCls} value={f.city} onChange={set('city')} placeholder={isArabic?'مثال: سريناغار':'e.g. Srinagar'} data-testid="ea-city" /></Field>
                    <Field label={isArabic?'حجم الفريق':'Team size'}>
                      <select className={inputCls} value={f.teamSize} onChange={set('teamSize')} data-testid="ea-team">
                        <option value="">{isArabic?'اختر':'Select'}</option>
                        {TEAM_SIZES.map((t) => <option key={t} value={t}>{t} {isArabic?'أشخاص':t === '1' ? 'person' : 'people'}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label={isArabic?'الخطة التي تهمك':"Plan you're interested in"}>
                    <select className={inputCls} value={f.interestedPlan} onChange={set('interestedPlan')} data-testid="ea-plan">
                      {PLAN_OPTIONS.map(([v, l]) => <option key={v} value={v}>{isArabic?({'Not sure yet':'لست متأكداً بعد','Trial':'تجريبية','Starter':'مبتدئة','Professional':'احترافية','Enterprise':'مؤسسات'}[l]||l):l}</option>)}
                    </select>
                  </Field>
                  <Field label={isArabic?'هل ترغب في إضافة أي معلومات؟':"Anything you'd like us to know?"}><textarea dir={isArabic?'rtl':'ltr'} rows={3} className={`${inputCls} resize-none`} value={f.message} onChange={set('message')} placeholder={isArabic?'أخبرنا عن طريقة عملك الحالية…':'Tell us how you work today…'} data-testid="ea-message" /></Field>
                  <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} className="hidden" aria-hidden="true" />
                  {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600" data-testid="ea-error">{error}</p>}
                  <button type="submit" disabled={state === 'sending'} data-testid="ea-submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:brightness-110 disabled:opacity-70">
                    {state === 'sending' ? <><Loader2 className="h-4 w-4 animate-spin" /> {isArabic?'جارٍ الإرسال…':'Sending…'}</> : <>{isArabic?'طلب التسجيل المبكر':'Request early access'} <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-[11px] text-slate-400">{isArabic?'سنستخدم بياناتك للتواصل معك بشأن SafarOS فقط.':'We only use your details to contact you about SafarOS.'}</p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- footer */
function Footer() {
  const { locale } = useLocalization();
  const isArabic = locale === 'ar';
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <div className="flex items-center justify-center gap-2 text-white sm:justify-start">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600"><Layers className="h-3.5 w-3.5" /></span>
            <span className="font-bold">SafarOS</span>
          </div>
          <p className="mt-1.5 text-xs text-white/45">{isArabic?'نظام تشغيل متكامل لشركات السفر.':'The operating system for travel businesses.'}</p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/60">
          {(isArabic?NAV_AR:NAV).map(([l,id])=><button key={id} onClick={()=>scrollToId(id)} className="hover:text-white">{l}</button>)}
          <a href="/login" className="hover:text-white">{isArabic?'تسجيل الدخول':'Sign in'}</a>
        </nav>
      </div>
      <div className="mx-auto mt-6 max-w-6xl px-6 text-center text-xs text-white/35 sm:text-left">© {new Date().getFullYear()} SafarOS. All rights reserved.</div>
    </footer>
  );
}

/* ---------------------------------------------------- page */
function App() {
  const { locale } = useLocalization();
  const [plan, setPlan] = useState('');
  const choose = (id) => { setPlan(id); scrollToId('early-access'); };
  return (
    <main className="so-font overflow-x-hidden bg-slate-950" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header />
      <Hero />
      <Demo />
      <Features />
      <Pricing onChoose={choose} />
      <EarlyAccess plan={plan} />
      <Footer />
    </main>
  );
}

export default App;
