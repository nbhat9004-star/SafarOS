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
const inr = (n) => `AED ${Number(n || 0).toLocaleString('en-US')}`;
const WARM = 'bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent';

const scrollToId = (id) => {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const openSalesChat = (message = '') => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('safaros:open-sales-chat', { detail: { message } }));
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

/* ---------------------------------------------------- single-page header */
function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2 text-white" aria-label="SafarOS home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40"><Layers className="h-5 w-5" /></span>
          <span className="text-xl font-extrabold tracking-tight">Safar<span className="text-amber-400">OS</span></span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm font-semibold text-white/80 transition hover:text-white">Sign in</a>
          <button type="button" onClick={() => openSalesChat('Hello SafarOS, I would like to speak with your team.')} className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:brightness-110">Talk to our team <ArrowRight className="ml-1 inline h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------- Gulf-focused hero */
function Hero() {
  const { locale } = useLocalization();
  const isArabic = locale === 'ar';
  const kpis = [{ label: 'Enquiries', value: '128', tone: 'from-blue-600 to-blue-500' }, { label: 'Bookings', value: '64', tone: 'from-emerald-600 to-teal-500' }, { label: 'Customers', value: '842', tone: 'from-violet-600 to-purple-500' }, { label: 'Revenue', value: 'AED 48.5K', tone: 'from-amber-500 to-orange-500' }];
  const modules = [{ icon: MessageCircle, label: 'Customer conversations' }, { icon: CalendarCheck, label: 'Bookings & reservations' }, { icon: Users, label: 'CRM & lead management' }, { icon: Layers, label: 'Packages & itineraries' }, { icon: Wallet, label: 'Payments & invoicing' }, { icon: LayoutDashboard, label: 'Reports & insights' }, { icon: Truck, label: 'Agency operations' }, { icon: Bot, label: 'AI Copilot' }];
  return (
    <section className="relative isolate overflow-hidden bg-[#0b1228] pt-24 text-white">
      <img src={IMG.hero} alt="Gulf city skyline at sunset" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(249,115,22,.28),transparent_35%),linear-gradient(110deg,#0b1228_8%,rgba(11,18,40,.94)_48%,rgba(11,18,40,.55))]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 pt-14 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-12 lg:pb-16 lg:pt-20">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Built for travel agencies across the Gulf
          </span>
          <h1 className="mt-6 max-w-2xl text-balance text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.65rem]" data-testid="hero-title">
            {isArabic ? <>أدر وكالة السفر بالكامل <span className={WARM}>من مكان واحد.</span></> : <>Run, manage and grow your travel agency <span className={WARM}>from one powerful workspace.</span></>}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Enquiries, bookings, customers, operations and payments — a modern travel agency operating system built for the UAE, Saudi Arabia, Qatar, Oman, Bahrain and Kuwait.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => openSalesChat('Hello SafarOS, I would like to arrange a demo.')} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_12px_36px_rgba(249,115,22,.3)] transition hover:brightness-110"><MessageCircle className="h-4 w-4" /> Talk to our team <ArrowRight className="h-4 w-4" /></button>
            <button type="button" onClick={() => scrollToId('demo')} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"><Play className="h-4 w-4" /> Watch product demo</button>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Speak directly with our sales & support team on WhatsApp</div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-white/65">
            {[['Zap','Quick to get started'],['Globe','Cloud based'],['Smartphone','Works on mobile'],['CheckCircle2','Secure agency workspaces']].map(([name,label]) => { const Ic = {Zap:Sparkles,Globe,Smartphone,CheckCircle2}[name]; return <span key={label} className="inline-flex items-center gap-1.5"><Ic className="h-4 w-4 text-amber-300" />{label}</span>; })}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-indigo-500/25 via-transparent to-orange-400/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/20 bg-[#111d38]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-4">
            <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3">
              <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600"><Layers className="h-4 w-4"/></span><span className="font-bold">Safar<span className="text-amber-400">OS</span></span></div>
              <div className="flex items-center gap-2 text-[10px] text-white/50"><span className="h-2 w-2 rounded-full bg-emerald-400"/> Sample workspace <span className="ml-2 rounded-full bg-white/10 px-2 py-1">Demo</span></div>
            </div>
            <div className="grid min-h-[300px] grid-cols-[92px_1fr] gap-3 pt-3 sm:grid-cols-[118px_1fr]">
              <div className="space-y-2 border-r border-white/10 pr-2 text-[10px] text-white/60">
                {[[LayoutDashboard,'Dashboard'],[Users,'Enquiries'],[CalendarCheck,'Bookings'],[Users,'Customers'],[Layers,'Packages'],[MessageCircle,'WhatsApp'],[LayoutDashboard,'Reports']].map(([Ic,label],i)=><div key={label} className={'flex items-center gap-2 rounded-lg px-2 py-2 '+(i===0?'bg-indigo-600/70 text-white':'')}><Ic className="h-3.5 w-3.5 shrink-0"/><span>{label}</span></div>)}
              </div>
              <div className="min-w-0">
                <div className="mb-3"><div className="text-sm font-bold sm:text-base">Good morning!</div><div className="text-[10px] text-white/55">Your agency at a glance</div></div>
                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                  {kpis.map((k)=> <div key={k.label} className={'rounded-xl bg-gradient-to-br '+k.tone+' p-2.5 shadow-lg'}><div className="text-[9px] text-white/75">{k.label}</div><div className="mt-1 text-base font-extrabold sm:text-lg">{k.value}</div></div>)}
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-[#0b1530] p-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold">Business overview</span><span className="text-[9px] text-white/45">Illustrative data</span></div>
                  <svg viewBox="0 0 520 150" className="mt-3 h-28 w-full" role="img" aria-label="Illustrative upward trend chart"><defs><linearGradient id="safaros-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity=".45"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/></linearGradient></defs><path d="M0 118 C45 110 55 70 105 85 S170 118 220 70 S290 95 340 48 S410 65 460 24 L520 12 L520 150 L0 150Z" fill="url(#safaros-chart-fill)"/><path d="M0 118 C45 110 55 70 105 85 S170 118 220 70 S290 95 340 48 S410 65 460 24 L520 12" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-2 px-5 pb-10 sm:grid-cols-4 sm:px-8 lg:grid-cols-8">
        {modules.map(({icon:Icon,label})=><div key={label} className="flex min-h-[66px] flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.045] px-2 py-3 text-center text-[10px] font-semibold text-white/80 sm:text-[11px]"><Icon className="h-5 w-5 text-violet-300"/>{label}</div>)}
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
  const cur = TOUR[step];
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
                    <span className="relative flex items-center gap-2"><Ic className="h-4 w-4" /> {t.module}</span>
                  </button>
                ); })}
                <div className="mt-auto rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-2.5 text-[11px] text-orange-800"><Clock className="mb-1 h-3.5 w-3.5" />Trial: 14 days left</div>
              </aside>
              {/* main */}
              <div className="min-w-0 flex-1 p-4 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <AnimatePresence mode="wait">
                    <motion.div key={cur.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">Step {step + 1} of {TOUR.length}</div>
                      <h3 className="text-lg font-bold text-slate-900 sm:text-xl" data-testid="demo-step-title">{cur.title}</h3>
                    </motion.div>
                  </AnimatePresence>
                  <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 sm:flex"><Search className="h-3.5 w-3.5" /> Search clients, bookings…</div>
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
            className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-white/70 sm:text-base" data-testid="demo-caption">{cur.caption}</motion.p>
        </AnimatePresence>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="/signup" data-testid="demo-try-btn" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/90">Try it free for 14 days <ArrowRight className="h-4 w-4" /></a>
          <button onClick={() => scrollToId('early-access')} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5">Book a guided demo</button>
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
  return (
    <section id="features" className="so-section bg-[#FBF7F1] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow="Features" title="Everything a travel agency needs." sub="Simple tools your whole team can learn in a day." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => { const Ic = f.icon; return (
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
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-300"><Smartphone className="h-4 w-4" /> Customer portal</div>
              <h3 className="mt-2 max-w-md text-2xl font-bold text-white sm:text-3xl">Your travellers get their trip, vouchers and payments in one link.</h3>
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
  const [yearly, setYearly] = useState(false);
  const plans = (PLAN_CATALOG || []).filter((p) => p.status === 'active');
  return (
    <section id="pricing" className="so-section bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow="Pricing" title="Simple plans that grow with you." sub="Start with a free trial. Upgrade only when you're ready." />
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 text-sm" data-testid="billing-toggle">
            {[['Monthly', false], ['Yearly', true]].map(([l, v]) => (
              <button key={l} onClick={() => setYearly(v)} data-testid={`billing-${l.toLowerCase()}`} className={`relative rounded-full px-4 py-1.5 font-medium ${yearly === v ? 'text-white' : 'text-slate-600'}`}>
                {yearly === v && <motion.span layoutId="bill" className="absolute inset-0 rounded-full bg-slate-900" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{l}{v && <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">2 months free</span>}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => {
            const popular = p.id === 'professional';
            const price = yearly ? p.priceYearly : p.price;
            const feats = Object.entries(p.features || {}).filter(([, on]) => on).map(([k]) => FEATURE_LABELS[k]).filter(Boolean);
            return (
              <Reveal key={p.id} delay={i * 0.06}>
                <div className={`relative flex h-full flex-col rounded-2xl border p-6 ${popular ? 'border-transparent bg-slate-950 text-white shadow-2xl shadow-indigo-900/30 ring-2 ring-amber-400' : 'border-slate-200 bg-white text-slate-900'}`} data-testid={`plan-card-${p.id}`}>
                  {popular && <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[11px] font-bold text-slate-950">Most popular</span>}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className={`mt-1 min-h-[40px] text-sm ${popular ? 'text-white/60' : 'text-slate-500'}`}>{p.description}</p>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight" data-testid={`plan-price-${p.id}`}>{price ? inr(price) : 'Free'}</span>
                    <span className={`mb-1 text-sm ${popular ? 'text-white/50' : 'text-slate-400'}`}>{price ? (yearly ? '/year' : '/month') : `for ${p.trialDays || 14} days`}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    <li className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-amber-400' : 'text-orange-500'}`} /><span><b>{limitText(p.limits?.teamMembers)}</b> team members</span></li>
                    <li className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-amber-400' : 'text-orange-500'}`} /><span><b>{limitText(p.limits?.bookings)}</b> bookings</span></li>
                    {feats.slice(0, 7).map((f) => (
                      <li key={f} className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-amber-400' : 'text-orange-500'}`} /><span className={popular ? 'text-white/85' : 'text-slate-700'}>{f}</span></li>
                    ))}
                    {feats.length > 7 && <li className={`pl-6 text-xs ${popular ? 'text-white/50' : 'text-slate-400'}`}>+ {feats.length - 7} more</li>}
                  </ul>
                  {p.id === 'trial' ? (
                    <a href="/signup" data-testid={`plan-cta-${p.id}`} className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">Start free trial</a>
                  ) : (
                    <button onClick={() => onChoose(p.id)} data-testid={`plan-cta-${p.id}`} className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${popular ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>Choose {p.name} <ArrowRight className="h-4 w-4" /></button>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-16 border-t border-slate-200 pt-14">
          <SectionHead eyebrow="One-time white-label licence" title="Your brand. Your platform. Pay once." sub="For established travel companies that want a dedicated SafarOS setup, lifetime software use and standard product updates — without a recurring SafarOS subscription." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { id: 'legacy-standard', name: 'Legacy Standard', price: 'AED 14,999', desc: 'A branded SafarOS foundation for smaller operators.', items: ['Dedicated branded setup', 'Company logo and colour theme', 'Core CRM, packages and quotations', 'Booking management', 'Lifetime software licence', 'Free standard product updates'] },
              { id: 'legacy-advanced', name: 'Legacy Advanced', price: 'AED 24,999', desc: 'A complete white-label setup for established travel companies.', popular: true, items: ['Everything in Standard', 'Custom domain and branded PWA', 'Broader operational modules', 'WhatsApp and website chat setup', 'Agreed workflow configuration', 'Initial data migration assistance', 'Administrator training and handover', 'Lifetime software licence and standard updates'] },
              { id: 'legacy-enterprise', name: 'Legacy Enterprise', price: 'From AED 39,999', desc: 'For larger operators with complex requirements.', items: ['Everything in Advanced', 'Multi-branch or complex setup', 'Additional integration scoping', 'Advanced workflow configuration', 'Dedicated implementation plan', 'Bespoke development quoted separately'] },
            ].map((p) => (
              <div key={p.id} className={`relative flex h-full flex-col rounded-2xl border p-6 ${p.popular ? 'border-amber-400 bg-slate-950 text-white shadow-xl ring-2 ring-amber-300' : 'border-slate-200 bg-white text-slate-900'}`} data-testid={`plan-card-${p.id}`}>
                {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[11px] font-bold text-slate-950">Recommended</span>}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className={`mt-2 min-h-[48px] text-sm ${p.popular ? 'text-white/65' : 'text-slate-500'}`}>{p.desc}</p>
                <div className="mt-5"><span className="text-3xl font-bold tracking-tight" data-testid={`plan-price-${p.id}`}>{p.price}</span><p className={`mt-1 text-xs ${p.popular ? 'text-white/50' : 'text-slate-400'}`}>One-time licence and setup fee</p></div>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.items.map((item) => <li key={item} className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.popular ? 'text-amber-400' : 'text-orange-500'}`} /><span className={p.popular ? 'text-white/85' : 'text-slate-700'}>{item}</span></li>)}
                </ul>
                <button onClick={() => onChoose(p.id)} data-testid={`plan-cta-${p.id}`} className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${p.popular ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>Enquire about {p.name} <ArrowRight className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-4xl rounded-2xl bg-slate-50 p-5 text-xs leading-relaxed text-slate-600">
            <b className="text-slate-900">What lifetime includes:</b> lifetime use of the licensed SafarOS software and free standard product updates, bug fixes and security updates while SafarOS is commercially maintained. <b className="text-slate-900">Separate costs:</b> hosting, server infrastructure, domain renewals, Meta/WhatsApp charges, AI and other third-party APIs, payment processing, ongoing managed support and new bespoke development. Licence is for one named company and one agreed branded deployment; it does not transfer SafarOS ownership or source-code rights.
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">All prices are in UAE Dirhams (AED). Taxes extra where applicable.</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- simple operating flow */
function HowItWorks() {
  const steps = [{icon:Users,title:'Connect your agency',text:'Set up your account, team and agency workspace.'},{icon:Layers,title:'Run your operations',text:'Manage enquiries, quotations, itineraries, bookings and payments.'},{icon:Sparkles,title:'Grow with clarity',text:'Keep customers organised and understand your business performance.'}];
  return <section className="bg-slate-50 py-14 sm:py-16"><div className="mx-auto max-w-6xl px-5 sm:px-8"><SectionHead eyebrow="Get started" title="How SafarOS works." sub="A simple path from scattered tools to one connected workspace."/><div className="mt-10 grid gap-6 md:grid-cols-3">{steps.map((step,i)=>{const Ic=step.icon;return <Reveal key={step.title} delay={i*.08}><div className="flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><Ic className="h-6 w-6"/></span><div><div className="text-xs font-bold uppercase tracking-widest text-orange-600">Step {i+1}</div><h3 className="mt-1 font-bold text-slate-950">{step.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{step.text}</p></div></div></Reveal>})}</div></div></section>;
}

function TrustStrip() {
  const items=[['Secure workspaces','Agency data stays scoped to its workspace',CheckCircle2],['Cloud based','Access your workspace online',Globe],['Mobile ready','Designed for phone and desktop',Smartphone],['Human support','Speak directly with our team',MessageCircle]];
  return <section className="border-y border-slate-200 bg-white py-7"><div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-5 sm:px-8 md:grid-cols-4">{items.map(([title,sub,Ic])=><div key={title} className="flex items-center gap-3"><Ic className="h-6 w-6 shrink-0 text-indigo-600"/><div><div className="text-sm font-bold text-slate-900">{title}</div><div className="text-[11px] text-slate-500">{sub}</div></div></div>)}</div></section>;
}

/* ---------------------------------------------------- direct sales and support CTA */
function SalesCTA() {
  return <section id="early-access" className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(249,115,22,.2),transparent_45%),radial-gradient(ellipse_at_15%_20%,rgba(99,102,241,.25),transparent_40%)]"/><div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-8"><span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">Personal product walkthrough</span><h2 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Ready to run your agency from <span className={WARM}>one workspace?</span></h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">No long enquiry forms. Tell our team what your agency needs and get a conversation started directly on WhatsApp.</p><button type="button" onClick={()=>openSalesChat('Hello SafarOS, I would like a personal product walkthrough for my travel agency.')} className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-orange-500/20 transition hover:brightness-110"><MessageCircle className="h-4 w-4"/> Chat with our team <ArrowRight className="h-4 w-4"/></button></div></section>;
}

function SalesChat() {
  const [open,setOpen]=useState(false);
  const [draft,setDraft]=useState('');

  useEffect(()=>{
    const onOpen=(event)=>{setOpen(true);if(event?.detail?.message)setDraft(event.detail.message);};
    window.addEventListener('safaros:open-sales-chat',onOpen);
    let timer;
    try { if(!sessionStorage.getItem('safaros-sales-chat-dismissed')) timer=setTimeout(()=>setOpen(true),10000); } catch {}
    return ()=>{window.removeEventListener('safaros:open-sales-chat',onOpen);if(timer)clearTimeout(timer);};
  },[]);
  const whatsapp=(message)=>'https://wa.me/918899046675?text='+encodeURIComponent(message||'Hello SafarOS, I would like to know more about your travel agency platform.');
  const options=[['See a live demo','I would like to see a live SafarOS demo.'],['Pricing and plans','Please share SafarOS pricing and available plans.'],['WhatsApp integration','I would like to know how agency WhatsApp integration works.'],['Talk to sales','I would like to speak with your sales team.'],['Customer support','I need help from SafarOS support.']];
  const close=()=>{setOpen(false);try{sessionStorage.setItem('safaros-sales-chat-dismissed','1');}catch{}};
  return <div className="fixed bottom-4 right-4 z-[90] sm:bottom-6 sm:right-6">
    {open&&<div className="mb-3 flex w-[min(370px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_80px_rgba(2,6,23,.35)]" role="dialog" aria-label="SafarOS sales and support chat">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#14213d] to-[#243b68] p-4 text-white"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"><MessageCircle className="h-5 w-5"/></span><div><div className="text-sm font-bold">SafarOS Sales & Support</div><div className="text-[11px] text-emerald-200">Continue with our team on WhatsApp</div></div></div><button type="button" onClick={close} aria-label="Close chat" className="rounded-full p-1 text-white/80 hover:bg-white/10"><X className="h-5 w-5"/></button></div>
      <div className="space-y-3 bg-slate-50 p-4"><div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm leading-relaxed shadow-sm">Hello! Welcome to SafarOS 👋<br/>How can our team help your travel agency today?</div><div className="space-y-2">{options.map(([label,message])=><a key={label} href={whatsapp(message)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50">{label}<ArrowRight className="h-3.5 w-3.5 text-indigo-600"/></a>)}</div></div>
      <form onSubmit={(e)=>{e.preventDefault();if(draft.trim())window.open(whatsapp(draft.trim()),'_blank','noopener,noreferrer');}} className="flex gap-2 border-t border-slate-200 bg-white p-3"><input value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Write your message..." aria-label="Your message" className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"/><button type="submit" aria-label="Send message on WhatsApp" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700"><Send className="h-4 w-4"/></button></form>
      <div className="bg-white px-4 pb-3 text-center text-[10px] text-slate-400">WhatsApp sales channel · +91 88990 46675</div>
    </div>}
    <button type="button" onClick={()=>{setOpen((v)=>!v);}} className="ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 transition hover:brightness-110"><MessageCircle className="h-4 w-4"/>{open?'Close chat':'Chat with SafarOS'}</button>
  </div>;
}

/* ---------------------------------------------------- footer */
/* ---------------------------------------------------- FAQs, contact and legal */
function TrustAndLegal() {
  const faqs = [
    ['Who is SafarOS for?', 'SafarOS helps travel agencies and tour operators manage enquiries, quotations, itineraries, bookings, teams and customer communication.'],
    ['Can we connect our own WhatsApp Business number?', 'Yes. Each agency connects its own eligible WhatsApp Business account through Meta authorisation. Meta eligibility, permissions and approval requirements apply.'],
    ['Is there a free trial?', 'The Trial plan provides a 14-day evaluation period. Subscription plans are priced in AED and renew monthly or yearly.'],
    ['What is SafarOS Legacy?', 'SafarOS Legacy is a one-time white-label software licence for one named travel company and one agreed branded deployment. It includes lifetime software use and free standard product updates while SafarOS is commercially maintained. Hosting, domains, third-party usage charges, managed support and new bespoke development are separate.'],
    ['How do we cancel?', 'Contact SafarOS support to request cancellation. Unless stated otherwise at purchase, cancellation prevents the next renewal and access generally continues through the paid period.'],
    ['How do we contact support?', 'Use the WhatsApp contact link or the enquiry form on this page.'],
  ];
  return (
    <section id="faq" className="so-section bg-slate-50 py-20">
      <div className="mx-auto max-w-5xl px-6"><SectionHead eyebrow="Help centre" title="Questions, answered." sub="Useful information before getting started." />
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6">
          {faqs.map(([q,a]) => <details key={q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900">{q}<span className="text-xl text-orange-500">+</span></summary><p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p></details>)}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [activePanel, setActivePanel] = useState(null);
  const closePanel = () => setActivePanel(null);
  const panelTitles = {
    contact: 'Contact SafarOS',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    refunds: 'Refund & Cancellation Policy',
  };
  return (
    <>
      <footer className="border-t border-white/10 bg-slate-950 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 text-center">
            <div className="flex items-center justify-center gap-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600"><Layers className="h-3.5 w-3.5" /></span><span className="font-bold">SafarOS</span></div>
            <nav aria-label="Footer navigation" className="mx-auto grid w-full max-w-3xl grid-cols-2 justify-items-center gap-x-4 gap-y-4 text-center text-sm text-white/65 sm:grid-cols-4">
              {Object.entries(panelTitles).map(([key, title]) => (
                <button key={key} type="button" onClick={() => setActivePanel(key)} className="text-center transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">{key === 'refunds' ? 'Refund Policy' : title}</button>
              ))}
            </nav>
          </div>
          <div className="mt-7 flex w-full flex-col items-center justify-center gap-2 border-t border-white/10 pt-5 text-center text-xs text-white/40"><span>© {new Date().getFullYear()} SafarOS. All rights reserved.</span><span>Powered by Lafqa Ventures Pvt Ltd.</span></div>
        </div>
      </footer>

      {activePanel && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closePanel(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="footer-panel-title" className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-white p-6 text-slate-700 shadow-2xl sm:rounded-3xl sm:p-9">
            <div className="sticky top-0 z-10 -mx-1 mb-6 flex items-start justify-between gap-4 bg-white/95 px-1 pb-3 backdrop-blur">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">SafarOS · Lafqa Ventures</p><h2 id="footer-panel-title" className="mt-2 text-2xl font-bold text-slate-950">{panelTitles[activePanel]}</h2></div>
              <button type="button" onClick={closePanel} aria-label="Close" className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>

            {activePanel === 'contact' && (
              <div className="space-y-5">
                <p>Talk to our team about a demo, onboarding, subscriptions or support.</p>
                <a href="https://wa.me/918899046675?text=Hello%20SafarOS%2C%20I%20would%20like%20to%20know%20more." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp: +91 88990 46675</a>
                <p className="text-sm text-slate-500">For a product walkthrough, open the SafarOS sales and support chat on this page.</p>
                <button type="button" onClick={() => { closePanel(); setTimeout(() => openSalesChat('Hello SafarOS, I would like to request a product demo.'), 80); }} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Request a demo <ArrowRight className="ml-1 inline h-4 w-4" /></button>
              </div>
            )}

            {activePanel === 'terms' && (
              <div className="grid gap-5 text-sm leading-relaxed sm:grid-cols-2">
                <p className="text-xs text-slate-500 sm:col-span-2">Last updated: 23 November 2026</p>
                <div><h3 className="font-semibold text-slate-950">Using SafarOS</h3><p className="mt-2">SafarOS is offered through recurring subscriptions and the separate SafarOS Legacy one-time white-label licence. By registering or using the service, you agree to these terms and must provide accurate account information and keep your credentials secure.</p></div>
                <div><h3 className="font-semibold text-slate-950">Agency responsibilities</h3><p className="mt-2">Your agency is responsible for the accuracy and lawful use of customer, supplier, booking, itinerary and payment information entered into its workspace, including obtaining any required permissions to process personal data.</p></div>
                <div><h3 className="font-semibold text-slate-950">Plans and third-party services</h3><p className="mt-2">Subscription prices, billing intervals, trial periods and usage limits are displayed in the pricing section. SafarOS Legacy is a one-time licence for one named company and one agreed branded deployment; it includes lifetime software use and free standard product updates while SafarOS is commercially maintained. Hosting, infrastructure, domain renewals, Meta/WhatsApp charges, AI and other third-party usage, managed support and new bespoke development are not included unless separately agreed in writing. The licence does not transfer SafarOS ownership or source-code rights. Integrations are subject to third-party terms, approvals and availability.</p></div>
                <div><h3 className="font-semibold text-slate-950">Availability and changes</h3><p className="mt-2">We may update the platform to improve functionality or security and may restrict access when reasonably necessary for security, legal compliance, misuse or non-payment. The service is provided on an as-available basis to the extent permitted by law.</p></div>
                <div><h3 className="font-semibold text-slate-950">Applicable law</h3><p className="mt-2">These terms are subject to applicable laws of India, without limiting mandatory protections that may apply in the customer's jurisdiction. Liability that cannot legally be excluded remains unaffected.</p></div>
                <div><h3 className="font-semibold text-slate-950">Questions</h3><p className="mt-2">For questions about these terms, contact Lafqa Ventures Pvt Ltd through the SafarOS contact details provided here.</p></div>
              </div>
            )}

            {activePanel === 'privacy' && (
              <div className="grid gap-5 text-sm leading-relaxed sm:grid-cols-2">
                <p className="text-xs text-slate-500 sm:col-span-2">Last updated: 23 November 2026</p>
                <div><h3 className="font-semibold text-slate-950">Information collected</h3><p className="mt-2">We may process account and workspace details, business contacts, team accounts, customer and supplier records, bookings, messages, usage information and support requests.</p></div>
                <div><h3 className="font-semibold text-slate-950">How information is used</h3><p className="mt-2">Information is used to provide and secure SafarOS, operate agency workspaces, support communications, manage subscriptions, respond to enquiries and meet legal obligations. We do not sell personal information.</p></div>
                <div><h3 className="font-semibold text-slate-950">Service providers</h3><p className="mt-2">Hosting, database, payment and communication providers may process information to help us operate the service. WhatsApp conversations are also subject to Meta's applicable policies.</p></div>
                <div><h3 className="font-semibold text-slate-950">Security and retention</h3><p className="mt-2">We use reasonable technical and organisational safeguards, but no online service can guarantee absolute security. Information is retained as needed for service delivery, legal obligations and dispute resolution.</p></div>
                <div><h3 className="font-semibold text-slate-950">Your choices</h3><p className="mt-2">You may request access, correction or deletion of personal information subject to legal requirements. Agencies are responsible for requests relating to customer information they control.</p></div>
                <div><h3 className="font-semibold text-slate-950">Cookies and updates</h3><p className="mt-2">Essential cookies or local storage may be used for sign-in, preferences and security. Changes to this policy will be published here.</p></div>
              </div>
            )}

            {activePanel === 'refunds' && (
              <div className="space-y-4 text-sm leading-relaxed">
                <p className="text-xs text-slate-500">Last updated: 23 November 2026</p>
                <p><b className="text-slate-950">Free trial:</b> The 14-day Trial plan does not incur a subscription fee.</p>
                <p><b className="text-slate-950">SafarOS Legacy:</b> Legacy is a one-time licence and setup purchase. Any refund eligibility, cancellation of implementation, work already completed, and applicable statutory rights will be governed by the signed order and applicable law. Hosting and third-party services may be billed separately by their providers.</p>
                <p><b className="text-slate-950">Cancellation:</b> Contact SafarOS support to request cancellation. Unless stated otherwise at purchase, cancellation prevents the next renewal; access generally continues through the paid billing period. Unused time is not normally refunded.</p>
                <p><b className="text-slate-950">Duplicate or failed payments:</b> If you are charged more than once for the same period, or payment is collected but the subscription is not activated, contact us with the transaction reference. Verified duplicate or incorrectly collected amounts will be refunded to the original payment method.</p>
                <p><b className="text-slate-950">How to request a refund:</b> Contact us through the WhatsApp link above with your agency details, payment date and transaction reference. We will review the request and advise the outcome. Bank and payment-provider processing times may vary.</p>
                <p>Nothing in this policy limits a consumer right or remedy that cannot be excluded under applicable law.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------- page *//* ---------------------------------------------------- page */
function App() {
  const { locale } = useLocalization();
  const choose = (id) => openSalesChat('Hello SafarOS, I am interested in the ' + id.replaceAll('-', ' ') + ' plan. Please share the details.');
  return (
    <main className="so-font overflow-x-hidden bg-slate-950" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header />
      <Hero />
      <Demo />
      <Features />
      <HowItWorks />
      <Pricing onChoose={choose} />
      <TrustStrip />
      <SalesCTA />
      <TrustAndLegal />
      <Footer />
      <SalesChat />
    </main>
  );
}

export default App;
