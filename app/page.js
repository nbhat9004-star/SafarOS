'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  Layers, ArrowRight, Sparkles, Users, FileText, Map as MapIcon, Calendar,
  Truck, Wallet, Bot, Search, Globe, Smartphone, ShieldCheck, Check,
  Menu, X, ChevronRight, MapPin, Plane, MessageSquare, TrendingUp, CreditCard, FileCheck,
} from 'lucide-react';

/* ---------------------------------------------------- imagery */
const IMG = {
  hero: 'https://images.unsplash.com/photo-1596003903067-bf5762ad5c19?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxtb3VudGFpbiUyMGxha2V8ZW58MHx8fGJsdWV8MTc5MDg0MDQyOHww&ixlib=rb-4.1.0&q=85',
  website: 'https://images.unsplash.com/photo-1565527891306-59584ec1d524?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjB0cmF2ZWwlMjBsYW5kc2NhcGV8ZW58MHx8fGJsdWV8MTc5MDg0MDQyM3ww&ixlib=rb-4.1.0&q=85',
  cta: 'https://images.unsplash.com/photo-1448518340475-e3c680e9b4be?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxha2V8ZW58MHx8fGJsdWV8MTc5MDg0MDQyOHww&ixlib=rb-4.1.0&q=85',
};

/* ---------------------------------------------------- motion primitives */
const EASE = [0.22, 1, 0.36, 1];
const fadeUp = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } };

function Reveal({ children, delay = 0, y = 22, className = '' }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = '', prefix = '', decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf; const start = performance.now(); const dur = 1400;
    const tick = (now) => { const p = Math.min(1, (now - start) / dur); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{v.toLocaleString(undefined, { maximumFractionDigits: decimals })}{suffix}</span>;
}

function CTA({ href = '#', children, variant = 'primary', className = '' }) {
  const styles = {
    primary: 'bg-indigo-500 text-white shadow-[0_8px_30px_rgba(99,102,241,0.4)] hover:bg-indigo-400',
    glass: 'so-glass text-white hover:bg-white/10',
    light: 'bg-white text-slate-900 hover:bg-white/90',
    dark: 'bg-slate-900 text-white hover:bg-slate-800',
  };
  return (
    <motion.a href={href} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2, ease: EASE }}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ${styles[variant]} ${className}`}>
      {children}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </motion.a>
  );
}

/* ---------------------------------------------------- compact header + clean drawer */
const MENU = [
  { group: 'Product', links: [['CRM', '#platform'], ['Quotations', '#platform'], ['Itineraries', '#platform'], ['Bookings', '#platform'], ['Operations', '#platform'], ['AI', '#intelligence']] },
  { group: 'Solutions', links: [['Website', '#connected'], ['Customer Portal', '#connected']] },
  { group: 'Company', links: [['About', '#'], ['Contact', '#']] },
];
const DESKTOP_NAV = [['Platform', '#platform'], ['Journey', '#journey'], ['Intelligence', '#intelligence'], ['Connected', '#connected']];

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: EASE }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled ? 'border-b border-white/10 bg-slate-950/70 backdrop-blur-xl' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600"><Layers className="h-4 w-4" /></span>
            <span className="text-base font-bold tracking-tight">SafarOS</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {DESKTOP_NAV.map((l) => (
              <a key={l[0]} href={l[1]} className="rounded-full px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white">{l[0]}</a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a href="/login" className="px-3 py-1.5 text-sm font-semibold text-white/85 hover:text-white">Sign In</a>
            <a href="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 hover:bg-white/90">Start Free</a>
          </div>

          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm font-medium text-white md:hidden" aria-label="Open menu">
            Menu <Menu className="h-4 w-4" />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex flex-col bg-slate-950 md:hidden">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <span className="flex items-center gap-2 text-white"><Layers className="h-5 w-5" /><span className="font-bold">SafarOS</span></span>
              <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <motion.div className="flex-1 overflow-y-auto px-5 py-6" initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
              {MENU.map((m) => (
                <motion.div key={m.group} variants={fadeUp} transition={{ duration: 0.35, ease: EASE }} className="mb-6">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">{m.group}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {m.links.map((l) => (
                      <a key={l[0]} href={l[1]} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-[15px] font-medium text-white/85 hover:bg-white/5">{l[0]}</a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <div className="border-t border-white/10 p-5">
              <a href="/signup" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-full bg-indigo-500 py-3 text-sm font-semibold text-white">Start Free <ArrowRight className="h-4 w-4" /></a>
              <a href="/login" onClick={() => setOpen(false)} className="mt-2 block py-2 text-center text-sm font-medium text-white/60">Sign In</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------------------------------------------- 1. HERO */
function HeroDashboard() {
  const stats = [['Revenue', '$248K'], ['Leads', '1,284'], ['Bookings', '362'], ['Conversion', '32%']];
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="so-glass overflow-hidden rounded-2xl p-3 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.75)] sm:p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-[11px] text-white/45">app.safaros.com / dashboard</span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">Illustrative</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s[0]} className="rounded-xl bg-white/[0.05] p-3">
              <div className="text-[10px] uppercase tracking-wide text-white/45">{s[0]}</div>
              <div className="mt-1 text-base font-bold text-white sm:text-lg">{s[1]}</div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 rounded-xl bg-white/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-white/80">Pipeline</span><span className="text-white/40">this month · illustrative</span></div>
          <div className="flex items-end gap-1.5">
            {[42, 64, 52, 78, 60, 88, 70, 100, 82, 74, 92].map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.9 + i * 0.05, duration: 0.5, ease: EASE }}
                className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-violet-400" style={{ minHeight: 6, height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yImg = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '14%']);
  return (
    <section ref={ref} className="relative overflow-hidden bg-slate-950">
      <motion.img style={{ y: yImg }} src={IMG.hero} alt="" fetchPriority="high" className="absolute inset-0 h-[115%] w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/85 to-slate-950" />
      <div className="so-aurora absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-600/25 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-28 text-center sm:pt-32">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: EASE }}>
          <span className="inline-flex items-center gap-2 rounded-full so-glass px-3 py-1.5 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Built for modern travel businesses
          </span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
          className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
          The Operating System for <span className="so-gradient-text">Travel Businesses.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          Run your leads, customers, quotations, itineraries, bookings, operations and growth from one intelligent platform.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <CTA href="/signup" variant="primary">Start Free</CTA>
          <CTA href="#platform" variant="glass">Explore SafarOS</CTA>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 36, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, duration: 0.9, ease: EASE }} className="mt-12">
          <HeroDashboard />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- 2. PRODUCT SHOWCASE (consolidated) */
const MODULES = [
  { id: 'crm', label: 'CRM', icon: Users }, { id: 'quotations', label: 'Quotations', icon: FileText },
  { id: 'itineraries', label: 'Itineraries', icon: MapIcon }, { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'operations', label: 'Operations', icon: TrendingUp }, { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'fleet', label: 'Fleet', icon: Truck }, { id: 'ai', label: 'AI', icon: Bot },
];

function Preview({ id }) {
  const box = 'rounded-xl border border-slate-200 bg-slate-50/70 p-4';
  if (id === 'crm') return (
    <div className="grid gap-3 sm:grid-cols-3">
      {['New leads', 'Qualified', 'Won'].map((c, ci) => (
        <div key={c} className={box}>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">{c}<span className="text-slate-300">{[8, 5, 3][ci]}</span></div>
          <div className="space-y-2">{Array.from({ length: [3, 2, 2][ci] }).map((_, i) => (
            <div key={i} className="rounded-lg bg-white p-2.5 shadow-sm"><div className="h-2 w-2/3 rounded bg-slate-200" /><div className="mt-2 flex items-center gap-1.5"><div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500" /><div className="h-1.5 w-12 rounded bg-slate-100" /></div></div>
          ))}</div>
        </div>
      ))}
    </div>
  );
  if (id === 'quotations') return (
    <div className="mx-auto max-w-md">
      {[['Supplier cost', '$3,200', 'text-slate-900'], ['Markup (28%)', '+ $896', 'text-emerald-600'], ['Discount', '- $150', 'text-rose-500'], ['Tax (5%)', '+ $197', 'text-slate-900']].map((r) => (
        <div key={r[0]} className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm text-slate-600"><span>{r[0]}</span><span className={`font-semibold ${r[2]}`}>{r[1]}</span></div>
      ))}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white"><div><div className="text-xs text-white/70">Customer price</div><div className="text-2xl font-bold">$4,143</div></div><div className="text-right"><div className="text-xs text-white/70">Profit</div><div className="font-bold text-emerald-300">$746</div></div></div>
    </div>
  );
  if (id === 'itineraries') return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {['Srinagar · Dal Lake', 'Gulmarg · Gondola', 'Pahalgam · Valley', 'Sonmarg · Glacier'].map((d, i) => (
        <div key={d} className={`flex items-center gap-3 ${box}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">D{i + 1}</div><div><div className="text-sm font-medium text-slate-900">{d}</div><div className="text-[11px] text-slate-500">Stay · Transfers · Activities</div></div></div>
      ))}
    </div>
  );
  if (id === 'bookings') return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[['Hotel', 'Confirmed', Plane], ['Cab', 'Confirmed', Truck], ['Activity', 'Pending', MapPin], ['Flight', 'Confirmed', Plane]].map((r, i) => { const Ic = r[2]; return (
        <div key={i} className={`flex items-center justify-between ${box}`}><div className="flex items-center gap-2.5 text-slate-700"><Ic className="h-4 w-4 text-indigo-500" /><span className="text-sm">{r[0]}</span></div><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r[1] === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r[1]}</span></div>
      ); })}
    </div>
  );
  if (id === 'operations') return (
    <div className={box}><div className="mb-3 text-sm font-semibold text-slate-700">Trip execution</div><div className="flex flex-wrap items-center gap-2">
      {['Suppliers', 'Drivers', 'Vehicles', 'Docs', 'Activities'].map((n, i) => (<div key={n} className="flex items-center gap-2"><span className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm">{n}</span>{i < 4 && <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />}</div>))}
    </div><div className="mt-4 grid grid-cols-3 gap-2">{['On schedule', 'Vouchers sent', 'Driver assigned'].map((t) => (<div key={t} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2 text-[11px] text-emerald-700"><Check className="h-3.5 w-3.5" /> {t}</div>))}</div></div>
  );
  if (id === 'finance') return (
    <div className={box}><div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">Profit & cashflow<span className="text-[11px] text-slate-400">illustrative</span></div>
      <div className="flex items-end gap-2">{[50, 68, 60, 82, 74, 96].map((h, i) => (<div key={i} className="flex-1"><div className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: h }} /></div>))}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white p-2.5 shadow-sm"><div className="text-slate-500">Collected</div><div className="font-bold text-slate-900">$182,400</div></div><div className="rounded-lg bg-white p-2.5 shadow-sm"><div className="text-slate-500">Outstanding</div><div className="font-bold text-slate-900">$24,100</div></div></div>
    </div>
  );
  if (id === 'fleet') return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 p-4">
      <svg viewBox="0 0 400 150" className="h-40 w-full"><defs><linearGradient id="r2" x1="0" x2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#c084fc" /></linearGradient></defs>
        <motion.path d="M30,120 C110,100 140,30 230,50 S350,100 370,30" fill="none" stroke="url(#r2)" strokeWidth="3" strokeLinecap="round" strokeDasharray="560" initial={{ strokeDashoffset: 560 }} whileInView={{ strokeDashoffset: 0 }} viewport={{ once: true }} transition={{ duration: 1.8, ease: EASE }} />
        <circle cx="30" cy="120" r="5" fill="#34d399" /><circle cx="370" cy="30" r="5" fill="#f472b6" />
      </svg>
      <div className="absolute right-4 top-4 rounded-lg so-glass px-3 py-1.5 text-[11px] text-white/80">ETA 42 min · conceptual</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-white/60"><Truck className="h-4 w-4 text-indigo-300" /> Vehicle → Route → Destination</div>
    </div>
  );
  if (id === 'ai') return (
    <div className={box}><div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Bot className="h-4 w-4 text-indigo-500" /> SafarOS Copilot</div>
      <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-slate-700">Summarise this lead and suggest the next follow-up.</div>
      <div className="mt-2 space-y-1.5 rounded-lg bg-white p-3 text-[13px] text-slate-600 shadow-sm"><p>Family of 4 · Kashmir · 5 nights · budget ~$4k.</p><p className="font-medium text-indigo-600">Next: send Gulmarg + Pahalgam quote, follow up in 2 days.</p></div>
    </div>
  );
  return null;
}

function ProductShowcase() {
  const [active, setActive] = useState('crm');
  return (
    <section id="platform" className="so-section bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">One platform</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">Everything your travel business needs.</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">One operating system for the entire journey — from enquiry to repeat customer.</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
            {MODULES.map((m) => { const Icon = m.icon; const on = active === m.id; return (
              <button key={m.id} onClick={() => setActive(m.id)} className={`relative flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${on ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                {on && <motion.span layoutId="pill" className="absolute inset-0 rounded-full bg-indigo-600 shadow-[0_6px_20px_rgba(79,70,229,0.4)]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span className="relative flex items-center gap-2"><Icon className="h-4 w-4" /> {m.label}</span>
              </button>
            ); })}
          </div>
          <div className="relative mx-auto mt-7 min-h-[280px] max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 12, filter: 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }} transition={{ duration: 0.4, ease: EASE }}>
                <Preview id={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- 3. WORKFLOW (compact dark) */
function Workflow() {
  const steps = ['Enquiry', 'Customer', 'Quote', 'Booking', 'Operations', 'Repeat'];
  return (
    <section id="journey" className="so-section relative overflow-hidden bg-slate-950 py-16 sm:py-24">
      <div className="so-grid absolute inset-0 opacity-25" />
      <div className="relative mx-auto max-w-5xl px-6">
        <Reveal className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">The SafarOS journey</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">One journey. <span className="so-gradient-text">One system.</span></h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 sm:flex-col sm:gap-3">
                <div className="flex w-full items-center gap-3 rounded-xl so-glass px-4 py-3 sm:w-28 sm:flex-col sm:gap-2 sm:px-3 sm:text-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-semibold text-white">{s}</span>
                </div>
                {i < steps.length - 1 && <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-indigo-400/60 sm:rotate-0" />}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- 4. AI + SEARCH INTELLIGENCE */
function Intelligence() {
  return (
    <section id="intelligence" className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Intelligence</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">Intelligence built into your business.</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">Turn customer conversations, travel demand and business data into faster decisions and better opportunities.</p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm so-lift">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><Bot className="h-4 w-4" /></span> AI Copilot</div>
              <div className="mt-4 rounded-xl rounded-tl-sm bg-indigo-50 p-3 text-sm text-slate-700">Create a 5-day Kashmir itinerary for a family of four.</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {['Itinerary assistance', 'Lead summaries', 'Follow-ups', 'Business insights'].map((t) => (
                  <div key={t} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs font-medium text-slate-600"><Sparkles className="h-3.5 w-3.5 text-indigo-500" /> {t}</div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm so-lift">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><Search className="h-4 w-4" /></span> Search Intelligence</div>
              <div className="mt-4 space-y-2">
                {[['Search demand', Search], ['Keyword opportunities', TrendingUp], ['Content opportunities', FileText], ['SEO recommendations', ChevronRight]].map((r, i) => { const Ic = r[1]; return (
                  <motion.div key={r[0]} initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }}
                    className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700" style={{ marginLeft: `${i * 14}px` }}><Ic className="h-4 w-4 text-violet-500" /> {r[0]}</motion.div>
                ); })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- 5. WEBSITE + PORTAL (connected) */
function Connected() {
  const chain = [['Agency Website', Globe], ['SafarOS', Layers], ['CRM', Users], ['Bookings', Calendar], ['Customer Portal', Smartphone]];
  return (
    <section id="connected" className="relative overflow-hidden bg-slate-950 py-16 sm:py-24">
      <div className="so-aurora absolute left-10 top-10 h-72 w-72 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Connected</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">Your website. Your customers. One connected system.</h2>
          <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">Every enquiry becomes a lead. Every booking flows into operations. Every traveller gets a premium branded experience.</p>
        </Reveal>

        <div className="mt-12 grid items-center gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2.5"><span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-white/20" /><span className="ml-3 rounded bg-white/10 px-2 py-0.5 text-[11px] text-white/50">www.youragency.com</span></div>
              <div className="relative h-56">
                <img src={IMG.website} alt="Agency website preview" loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white"><div className="text-xl font-bold">Discover Kashmir</div><div className="mt-2 inline-flex rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-semibold">Enquire now</div></div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-2.5">
              {chain.map((c, i) => { const Ic = c[1]; return (
                <motion.div key={c[0]} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }}>
                  <div className="flex items-center gap-3 rounded-xl so-glass px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300"><Ic className="h-4 w-4" /></span><span className="font-medium text-white">{c[0]}</span></div>
                  {i < chain.length - 1 && <div className="ml-[34px] h-3 w-px bg-white/15" />}
                </motion.div>
              ); })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- 6. FINAL CTA */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-24">
      <img src={IMG.cta} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60" />
      <div className="so-aurora absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-[120px]" />
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Run your travel business from <span className="so-gradient-text">one place.</span></h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg">Bring sales, operations, customers and growth together with SafarOS.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <CTA href="/signup" variant="primary">Start Free</CTA>
            <a href="#platform" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white">Explore SafarOS <ArrowRight className="h-4 w-4" /></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- 7. COMPACT FOOTER */
function Footer() {
  const cols = [['Product', ['CRM', 'Quotations', 'Itineraries', 'Bookings', 'AI']], ['Company', ['About', 'Contact']], ['Legal', ['Privacy', 'Terms']]];
  return (
    <footer className="bg-slate-950 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600"><Layers className="h-4 w-4" /></span><span className="font-bold">SafarOS</span></div>
            <p className="mt-3 max-w-xs text-sm text-white/45">The operating system for travel businesses.</p>
          </div>
          {cols.map((c) => (
            <div key={c[0]}>
              <div className="text-xs font-semibold uppercase tracking-widest text-white/50">{c[0]}</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">{c[1].map((l) => <li key={l}><a href="#" className="hover:text-white">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-white/40">© 2026 SafarOS</div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------- page */
function App() {
  return (
    <main className="so-font overflow-x-hidden bg-slate-950">
      <Header />
      <Hero />
      <ProductShowcase />
      <Workflow />
      <Intelligence />
      <Connected />
      <FinalCTA />
      <Footer />
    </main>
  );
}

export default App;
