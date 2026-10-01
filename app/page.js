'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  Layers, ArrowRight, Sparkles, Users, FileText, Map as MapIcon, Calendar,
  Truck, Wallet, Bot, Search, Globe, Smartphone, BarChart3, ShieldCheck, Check,
  Menu, X, ChevronRight, Route, MessageSquare, TrendingUp, Clock, MapPin, Phone,
  Plane, CreditCard, FileCheck, Plus, Minus,
} from 'lucide-react';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';

/* ---------------------------------------------------- imagery (cinematic) */
const IMG = {
  hero: 'https://images.unsplash.com/photo-1596003903067-bf5762ad5c19?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxtb3VudGFpbiUyMGxha2V8ZW58MHx8fGJsdWV8MTc5MDg0MDQyOHww&ixlib=rb-4.1.0&q=85',
  itinerary: 'https://images.unsplash.com/photo-1571161535093-e7642c4bd0c8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwzfHxtb3VudGFpbiUyMGxha2V8ZW58MHx8fGJsdWV8MTc5MDg0MDQyOHww&ixlib=rb-4.1.0&q=85',
  cta: 'https://images.unsplash.com/photo-1448518340475-e3c680e9b4be?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxha2V8ZW58MHx8fGJsdWV8MTc5MDg0MDQyOHww&ixlib=rb-4.1.0&q=85',
  website: 'https://images.unsplash.com/photo-1565527891306-59584ec1d524?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjB0cmF2ZWwlMjBsYW5kc2NhcGV8ZW58MHx8fGJsdWV8MTc5MDg0MDQyM3ww&ixlib=rb-4.1.0&q=85',
  portal: 'https://images.unsplash.com/photo-1564703821142-e88574e6cfa8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjB0cmF2ZWwlMjBsYW5kc2NhcGV8ZW58MHx8fGJsdWV8MTc5MDg0MDQyM3ww&ixlib=rb-4.1.0&q=85',
};

/* ---------------------------------------------------- motion primitives */
const EASE = [0.22, 1, 0.36, 1];
const fadeUp = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0 } };

function Reveal({ children, delay = 0, y = 26, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >{children}</motion.div>
  );
}

function Counter({ to, suffix = '', prefix = '', decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf; const start = performance.now(); const dur = 1500;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(to * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
}

function CTA({ href = '#', children, primary = false, className = '' }) {
  return (
    <motion.a
      href={href}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: EASE }}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold ${
        primary
          ? 'bg-indigo-500 text-white shadow-[0_8px_30px_rgba(99,102,241,0.45)] hover:bg-indigo-400'
          : 'text-white so-glass hover:bg-white/10'
      } ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </motion.a>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
      <Sparkles className="h-3.5 w-3.5" /> {children}
    </div>
  );
}

/* ---------------------------------------------------- navbar */
const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Features', href: '#features' },
  { label: 'AI', href: '#ai' },
  { label: 'Resources', href: '#resources' },
  { label: 'Pricing', href: '#pricing' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div className={`mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 sm:px-6 ${
          scrolled ? 'so-glass mx-3 shadow-[0_8px_40px_rgba(0,0,0,0.25)] sm:mx-auto' : 'bg-transparent'
        }`}>
          <a href="/" className="flex items-center gap-2 pl-1 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600 shadow-lg">
              <Layers className="h-4 w-4 text-white" />
            </span>
            <span className="text-[17px] font-bold tracking-tight">SafarOS</span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:text-white">
              Sign In
            </a>
            <motion.a href="/signup" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg hover:bg-white/90">
              Start Free <ArrowRight className="h-4 w-4" />
            </motion.a>
          </div>

          <button onClick={() => setOpen(true)} className="rounded-full p-2 text-white lg:hidden" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <span className="flex items-center gap-2 text-white"><Layers className="h-5 w-5" /> <span className="font-bold">SafarOS</span></span>
              <button onClick={() => setOpen(false)} className="p-2 text-white" aria-label="Close menu"><X className="h-6 w-6" /></button>
            </div>
            <motion.nav
              className="flex flex-1 flex-col gap-1 px-6 pt-6"
              initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
            >
              {NAV_LINKS.map((l) => (
                <motion.a key={l.label} href={l.href} onClick={() => setOpen(false)}
                  variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}
                  className="flex items-center justify-between border-b border-white/10 py-4 text-2xl font-semibold text-white">
                  {l.label} <ChevronRight className="h-5 w-5 text-white/40" />
                </motion.a>
              ))}
            </motion.nav>
            <div className="flex flex-col gap-3 p-6">
              <a href="/login" className="rounded-full border border-white/20 py-3 text-center font-semibold text-white">Sign In</a>
              <a href="/signup" className="rounded-full bg-indigo-500 py-3 text-center font-semibold text-white">Start Free</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------------------------------------------- hero */
function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="so-glass overflow-hidden rounded-2xl p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-[11px] text-white/50">app.safaros.com / dashboard</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { k: 'Revenue', v: '$248K', c: 'from-indigo-500/30 to-indigo-500/5' },
            { k: 'Leads', v: '1,284', c: 'from-violet-500/30 to-violet-500/5' },
            { k: 'Bookings', v: '362', c: 'from-sky-500/30 to-sky-500/5' },
          ].map((s) => (
            <div key={s.k} className={`rounded-xl bg-gradient-to-br ${s.c} p-3`}>
              <div className="text-[10px] uppercase tracking-wide text-white/50">{s.k}</div>
              <div className="mt-1 text-lg font-bold text-white">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 rounded-xl bg-white/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/80">Pipeline</span>
            <span className="text-[10px] text-white/40">this month</span>
          </div>
          <div className="flex items-end gap-1.5">
            {[40, 65, 52, 78, 60, 90, 72, 100, 84].map((h, i) => (
              <motion.div key={i}
                initial={{ height: 0 }} animate={{ height: `${h}%` }}
                transition={{ delay: 1 + i * 0.07, duration: 0.6, ease: EASE }}
                className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-violet-400" style={{ minHeight: 6, height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* floating surfaces */}
      <motion.div
        initial={{ opacity: 0, y: 20, x: -10 }} animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 1.1, duration: 0.8, ease: EASE }}
        className="so-float absolute -left-6 top-16 hidden w-44 so-glass rounded-xl p-3 shadow-2xl sm:block">
        <div className="flex items-center gap-2 text-white">
          <Bot className="h-4 w-4 text-indigo-300" /><span className="text-xs font-semibold">AI Copilot</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-white/60">Draft a 5-day Kashmir itinerary for a family of four.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, x: 10 }} animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 1.3, duration: 0.8, ease: EASE }}
        className="so-float-slow absolute -right-5 bottom-10 hidden w-48 so-glass rounded-xl p-3 shadow-2xl sm:block">
        <div className="flex items-center justify-between text-white">
          <span className="text-[11px] text-white/60">Quote #2041</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Won</span>
        </div>
        <div className="mt-1.5 text-lg font-bold text-white">$4,850</div>
        <div className="text-[11px] text-emerald-300">+ $920 profit</div>
      </motion.div>
    </div>
  );
}

function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yImg = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '18%']);
  const yContent = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-8%']);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden bg-slate-950">
      <motion.img style={{ y: yImg }} src={IMG.hero} alt="" fetchPriority="high"
        className="absolute inset-0 h-[115%] w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/80 to-slate-950" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/30 to-transparent" />
      <div className="so-grid absolute inset-0 opacity-40" />
      <div className="so-aurora absolute -left-20 top-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-600/30 blur-[120px]" />
      <div className="so-aurora absolute right-0 top-1/3 h-[24rem] w-[24rem] rounded-full bg-violet-600/20 blur-[120px]" />

      <motion.div style={{ y: yContent }}
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pt-28 pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: EASE }}>
              <span className="inline-flex items-center gap-2 rounded-full so-glass px-3 py-1.5 text-xs font-medium text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Built for modern travel businesses
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.9, ease: EASE }}
              className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              The Operating System for <span className="so-gradient-text">Travel Businesses.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8, ease: EASE }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Run your leads, customers, quotations, itineraries, bookings, operations and growth
              from one intelligent platform.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.8, ease: EASE }}
              className="mt-9 flex flex-wrap items-center gap-3">
              <CTA href="/signup" primary>Start Free</CTA>
              <CTA href="#platform">Explore SafarOS</CTA>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}
              className="mt-10 flex items-center gap-6 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Multi-tenant & secure</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> AI-native</span>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: EASE }} className="relative">
            <HeroMock />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------------------------------------------- product showcase */
const MODULES = [
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'quotations', label: 'Quotations', icon: FileText },
  { id: 'itineraries', label: 'Itineraries', icon: MapIcon },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'operations', label: 'Operations', icon: Route },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'fleet', label: 'Fleet', icon: Truck },
  { id: 'ai', label: 'AI', icon: Bot },
];

function Panel({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
      transition={{ duration: 0.5, ease: EASE }}
      className="h-full"
    >{children}</motion.div>
  );
}

function ModulePanel({ id }) {
  const common = 'rounded-xl bg-white/[0.04] border border-white/10 p-4';
  if (id === 'crm') return (
    <div className="grid gap-3 sm:grid-cols-3">
      {['New leads', 'Qualified', 'Won'].map((col, ci) => (
        <div key={col} className={common}>
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-white/70">{col}<span className="text-white/30">{[8, 5, 3][ci]}</span></div>
          <div className="space-y-2">
            {Array.from({ length: [3, 2, 2][ci] }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white/[0.05] p-2.5">
                <div className="h-2 w-2/3 rounded bg-white/20" />
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500" />
                  <div className="h-1.5 w-12 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
  if (id === 'quotations') return (
    <div className={common}>
      <div className="mb-3 text-sm font-semibold text-white/80">Quote builder</div>
      {[['Supplier cost', '$3,200'], ['Markup (28%)', '+ $896'], ['Discount', '- $150'], ['Tax (5%)', '+ $197']].map((r) => (
        <div key={r[0]} className="flex items-center justify-between border-b border-white/5 py-2 text-sm text-white/70"><span>{r[0]}</span><span className="font-medium text-white">{r[1]}</span></div>
      ))}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-indigo-500/15 p-3"><span className="text-sm font-semibold text-white">Customer price</span><span className="text-lg font-bold text-indigo-200">$4,143</span></div>
    </div>
  );
  if (id === 'itineraries') return (
    <div className="space-y-2.5">
      {['Srinagar · Dal Lake', 'Gulmarg · Gondola', 'Pahalgam · Valley', 'Sonmarg · Glacier'].map((d, i) => (
        <div key={d} className={`flex items-center gap-3 ${common} py-3`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">D{i + 1}</div>
          <div className="flex-1"><div className="text-sm font-medium text-white">{d}</div><div className="text-[11px] text-white/50">Stay · Transfers · Activities</div></div>
          <MapPin className="h-4 w-4 text-white/30" />
        </div>
      ))}
    </div>
  );
  if (id === 'bookings') return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[['Hotel', 'Confirmed', Plane], ['Cab', 'Confirmed', Truck], ['Activity', 'Pending', MapPin], ['Flight', 'Confirmed', Plane]].map((r, i) => {
        const Ic = r[2];
        return (
          <div key={i} className={`flex items-center justify-between ${common}`}>
            <div className="flex items-center gap-2.5 text-white/80"><Ic className="h-4 w-4 text-indigo-300" /><span className="text-sm">{r[0]}</span></div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r[1] === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{r[1]}</span>
          </div>
        );
      })}
    </div>
  );
  if (id === 'operations') return (
    <div className={common}><div className="mb-4 text-sm font-semibold text-white/80">Trip execution</div>
      <div className="flex flex-wrap items-center gap-2">
        {['Suppliers', 'Drivers', 'Vehicles', 'Docs', 'Activities'].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-white/75">{n}</span>
            {i < 4 && <ArrowRight className="h-3.5 w-3.5 text-indigo-400/70" />}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {['On schedule', 'Vouchers sent', 'Driver assigned'].map((t) => (
          <div key={t} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 p-2 text-[11px] text-emerald-300"><Check className="h-3.5 w-3.5" /> {t}</div>
        ))}
      </div>
    </div>
  );
  if (id === 'finance') return (
    <div className={common}><div className="mb-3 flex items-center justify-between text-sm font-semibold text-white/80">Profit & cashflow<span className="text-[11px] text-white/40">illustrative</span></div>
      <div className="flex items-end gap-2">{[50, 68, 60, 82, 74, 96].map((h, i) => (
        <div key={i} className="flex-1"><div className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: h }} /></div>
      ))}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/[0.05] p-2.5"><div className="text-white/50">Collected</div><div className="font-bold text-white">$182,400</div></div>
        <div className="rounded-lg bg-white/[0.05] p-2.5"><div className="text-white/50">Outstanding</div><div className="font-bold text-white">$24,100</div></div>
      </div>
    </div>
  );
  if (id === 'fleet') return <MiniMap />;
  if (id === 'ai') return (
    <div className={common}>
      <div className="flex items-center gap-2 text-sm font-semibold text-white/80"><Bot className="h-4 w-4 text-indigo-300" /> SafarOS Copilot</div>
      <div className="mt-3 rounded-lg bg-indigo-500/10 p-3 text-sm text-white/80">Summarise this lead and suggest the next follow-up.</div>
      <div className="mt-2 space-y-1.5 rounded-lg bg-white/[0.05] p-3 text-[13px] text-white/70">
        <p>Family of 4 · Kashmir · 5 nights · budget ~$4k.</p>
        <p className="text-indigo-200">Next: send Gulmarg + Pahalgam quote, follow up in 2 days.</p>
      </div>
    </div>
  );
  return null;
}

function MiniMap() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-indigo-950 p-4">
      <svg viewBox="0 0 400 180" className="h-44 w-full">
        <defs>
          <linearGradient id="route" x1="0" x2="1">
            <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {[...Array(6)].map((_, i) => <line key={i} x1={i * 70} y1="0" x2={i * 70} y2="180" stroke="rgba(255,255,255,0.05)" />)}
        {[...Array(4)].map((_, i) => <line key={i} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="rgba(255,255,255,0.05)" />)}
        <motion.path d="M40,140 C120,120 150,40 240,60 S360,120 370,40"
          fill="none" stroke="url(#route)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray="600" initial={{ strokeDashoffset: 600 }} whileInView={{ strokeDashoffset: 0 }}
          viewport={{ once: true }} transition={{ duration: 2, ease: EASE }} />
        <circle cx="40" cy="140" r="6" fill="#34d399" />
        <circle cx="370" cy="40" r="6" fill="#f472b6" />
        <motion.circle r="5" fill="#fff"
          initial={{ offsetDistance: '0%' }} whileInView={{ offsetDistance: '100%' }} viewport={{ once: true }}
          transition={{ duration: 2, ease: EASE }}
          style={{ offsetPath: "path('M40,140 C120,120 150,40 240,60 S360,120 370,40')" }} />
      </svg>
      <div className="absolute right-4 top-4 rounded-lg so-glass px-3 py-1.5 text-[11px] text-white/80">ETA 42 min · conceptual</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-white/60"><Truck className="h-4 w-4 text-indigo-300" /> Vehicle → Route → Destination</div>
    </div>
  );
}

function ProductShowcase() {
  const [active, setActive] = useState('crm');
  return (
    <section id="platform" className="so-section relative overflow-hidden bg-slate-950 py-24">
      <div className="so-grid absolute inset-0 opacity-30" />
      <div className="so-aurora absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Enter SafarOS</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Everything your travel business needs.<br />
            <span className="so-gradient-text">One operating system.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
            {MODULES.map((m) => {
              const Icon = m.icon; const on = active === m.id;
              return (
                <button key={m.id} onClick={() => setActive(m.id)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${on ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                  {on && <motion.span layoutId="pill" className="absolute inset-0 rounded-full bg-indigo-500 shadow-[0_6px_20px_rgba(99,102,241,0.5)]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative flex items-center gap-2"><Icon className="h-4 w-4" /> {m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative mx-auto mt-8 min-h-[320px] max-w-4xl so-glass rounded-3xl p-5 shadow-2xl">
            <AnimatePresence mode="wait">
              <Panel key={active}><ModulePanel id={active} /></Panel>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- generic light section header */
function SectionHead({ eyebrow, title, sub, center }) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <div className={center ? 'flex justify-center' : ''}><Eyebrow>{eyebrow}</Eyebrow></div>}
      <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-slate-500">{sub}</p>}
    </Reveal>
  );
}

/* ---------------------------------------------------- CRM + quotation (features) */
function CRMSection() {
  const steps = ['Lead', 'Customer', 'Trip', 'Quote', 'Booking', 'Repeat'];
  return (
    <section id="features" className="so-section bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="CRM" title="From first enquiry to loyal customer."
              sub="Capture every lead, see a complete customer 360, and move deals forward with follow-ups, tasks and communication in one place." />
            <div className="mt-8 space-y-3">
              {[['Lead pipeline & stages', Users], ['Customer 360 profile', Contact360()], ['Follow-ups & tasks', Clock], ['Unified communication', MessageSquare]].map((r, i) => {
                const Ic = r[1];
                return (
                  <Reveal key={i} delay={i * 0.08}>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 so-lift hover:border-indigo-200 hover:shadow-md">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><Ic className="h-4 w-4" /></span>
                      <span className="font-medium text-slate-800">{r[0]}</span>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          <Reveal delay={0.15}>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/50 p-6 shadow-xl">
              <div className="flex flex-wrap items-center gap-2">
                {steps.map((s, i) => (
                  <motion.div key={s} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}
                    className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${i === steps.length - 1 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>{s}</span>
                    {i < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />}
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" />
                  <div><div className="font-semibold text-slate-900">Aisha Rahman</div><div className="text-xs text-slate-500">Honeymoon · Kashmir · 6 nights</div></div>
                  <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Hot lead</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[['Value', '$5.4K'], ['Touchpoints', '7'], ['Stage', 'Quote']].map((m) => (
                    <div key={m[0]} className="rounded-xl bg-slate-50 p-3"><div className="text-sm font-bold text-slate-900">{m[1]}</div><div className="text-[11px] text-slate-500">{m[0]}</div></div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
function Contact360() { return Users; }

function QuotationSection() {
  const [markup, setMarkup] = useState(28);
  const cost = 3200, discount = 150, taxRate = 0.05;
  const markupAmt = Math.round(cost * (markup / 100));
  const taxable = cost + markupAmt - discount;
  const tax = Math.round(taxable * taxRate);
  const price = taxable + tax;
  const profit = markupAmt - discount;
  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl so-lift">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Quotation builder</span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">Live</span>
              </div>
              {[['Supplier cost', `$${cost.toLocaleString()}`, 'text-slate-900'],
                [`Markup (${markup}%)`, `+ $${markupAmt.toLocaleString()}`, 'text-emerald-600'],
                ['Discount', `- $${discount}`, 'text-rose-500'],
                ['Tax (5%)', `+ $${tax.toLocaleString()}`, 'text-slate-900']].map((r) => (
                <div key={r[0]} className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm text-slate-600">
                  <span>{r[0]}</span><span className={`font-semibold ${r[2]}`}>{r[1]}</span>
                </div>
              ))}
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">Adjust markup — {markup}%</label>
                <input type="range" min="10" max="45" value={markup} onChange={(e) => setMarkup(+e.target.value)}
                  className="w-full accent-indigo-600" />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white">
                <div><div className="text-xs text-white/70">Customer price</div><div className="text-2xl font-bold">${price.toLocaleString()}</div></div>
                <div className="text-right"><div className="text-xs text-white/70">Est. profit</div><div className="text-lg font-bold text-emerald-300">${profit.toLocaleString()}</div></div>
              </div>
            </div>
          </Reveal>
          <div className="order-first lg:order-last">
            <SectionHead eyebrow="Quotations" title="Create quotations that close."
              sub="Assemble supplier costs, markup, discounts and taxes into a beautiful customer-ready quote — with profit calculated in real time." />
            <div className="mt-6 flex flex-wrap gap-2">
              {['Supplier cost', 'Markup', 'Discount', 'Tax', 'Customer price'].map((t) => (
                <span key={t} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- itinerary (cinematic) */
function ItinerarySection() {
  const days = [
    { d: 'Day 01', t: 'Arrival in Srinagar', s: 'Shikara ride on Dal Lake · houseboat stay' },
    { d: 'Day 02', t: 'Gulmarg', s: 'Gondola to Apharwat · snow activities' },
    { d: 'Day 03', t: 'Pahalgam', s: 'Betaab Valley · Aru & Baisaran' },
    { d: 'Day 04', t: 'Sonmarg', s: 'Thajiwas Glacier · alpine meadows' },
  ];
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      <img src={IMG.itinerary} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Itineraries</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Turn journeys into experiences.</h2>
          <p className="mt-4 text-lg text-white/60">Day-by-day plans with destinations, activities, transport, meals and timings — beautifully presented to your customers.</p>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {days.map((day, i) => (
            <Reveal key={day.d} delay={i * 0.1}>
              <div className="group relative h-full so-glass rounded-2xl p-5 so-lift hover:border-indigo-400/40">
                <div className="text-xs font-semibold uppercase tracking-widest text-indigo-300">{day.d}</div>
                <div className="mt-2 text-lg font-bold text-white">{day.t}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{day.s}</p>
                <div className="mt-4 flex items-center gap-3 text-white/40">
                  <MapPin className="h-4 w-4" /><Clock className="h-4 w-4" /><Plane className="h-4 w-4" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- AI copilot (signature) */
function useTypewriter(text, start) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!start) return;
    let i = 0;
    const id = setInterval(() => {
      i++; setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [text, start]);
  return out;
}

function AISection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const prompt = 'Create a 5-day Kashmir itinerary for a family of four.';
  const typed = useTypewriter(prompt, inView);
  const done = typed.length >= prompt.length;
  const days = ['Srinagar & Dal Lake', 'Gulmarg Gondola', 'Pahalgam valleys', 'Sonmarg glacier', 'Shopping & departure'];
  return (
    <section id="ai" ref={ref} className="so-section relative overflow-hidden bg-slate-950 py-24">
      <div className="so-grid absolute inset-0 opacity-30" />
      <div className="so-aurora absolute right-0 top-10 h-96 w-96 rounded-full bg-violet-600/25 blur-[130px]" />
      <div className="relative mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300"><Bot className="h-3.5 w-3.5" /> AI Copilot</span>
          <h2 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">Your travel business has an AI copilot.</h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto max-w-3xl so-glass rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 text-xs font-bold">You</div>
              <div className="flex-1 rounded-2xl rounded-tl-sm bg-white/[0.06] p-4 text-sm text-white/85">
                {typed}<span className="so-caret">|</span>
              </div>
            </div>

            <AnimatePresence>
              {done && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600"><Bot className="h-4 w-4 text-white" /></div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm bg-indigo-500/10 p-4">
                    <p className="text-sm text-white/80">Here is a 5-day plan for a family of four:</p>
                    <motion.div className="mt-3 space-y-2" initial="hidden" animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.15 } } }}>
                      {days.map((d, i) => (
                        <motion.div key={d} variants={fadeUp} transition={{ duration: 0.45, ease: EASE }}
                          className="flex items-center gap-3 rounded-lg bg-white/[0.05] p-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500 text-[11px] font-bold text-white">{i + 1}</span>
                          <span className="text-sm text-white/80">{d}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['Lead summary', 'Follow-up', 'Quotation', 'Business insight'].map((t) => (
                        <span key={t} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">{t}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- search intelligence + website + portal */
function SearchWebsitePortal() {
  const funnel = [['Search demand', Search], ['Keyword opportunities', TrendingUp], ['Content opportunities', FileText], ['SEO recommendations', ChevronRight], ['More qualified enquiries', Users]];
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl space-y-24 px-6">
        {/* search intelligence */}
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="Search Intelligence" title="Understand demand. Win more enquiries."
              sub="Surface what travellers are searching for and turn keyword and content opportunities into recommendations that drive qualified enquiries." />
          </div>
          <Reveal delay={0.1}>
            <div className="space-y-2.5">
              {funnel.map((r, i) => {
                const Ic = r[1];
                return (
                  <motion.div key={r[0]} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                    style={{ marginLeft: `${i * 18}px` }}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><Ic className="h-4 w-4" /></span>
                    <span className="font-medium text-slate-800">{r[0]}</span>
                  </motion.div>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* own website */}
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-2xl so-lift">
              <div className="flex items-center gap-1.5 bg-slate-100 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="ml-3 rounded bg-white px-2 py-0.5 text-[11px] text-slate-400">www.youragency.com</span>
              </div>
              <div className="relative h-64">
                <img src={IMG.website} alt="Agency website preview" loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <div className="text-xl font-bold">Discover Kashmir</div>
                  <div className="mt-2 inline-flex rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-semibold">Enquire now</div>
                </div>
              </div>
            </div>
          </Reveal>
          <div>
            <SectionHead eyebrow="Your Website" title="Your agency deserves more than a website."
              sub="A beautiful site that plugs straight into SafarOS — every enquiry becomes a lead, every booking flows into operations." />
            <div className="mt-6 flex flex-col gap-2 text-sm font-medium text-slate-600">
              {['Website', 'SafarOS', 'CRM', 'Leads', 'Bookings'].map((n, i) => (
                <Reveal key={n} delay={i * 0.07}><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">{i + 1}</span>{n}{i < 4 && <span className="text-slate-300">↕</span>}</div></Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortalSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      <div className="so-aurora absolute left-10 top-10 h-80 w-80 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Customer Portal</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">A premium experience for your travellers.</h2>
          <p className="mt-4 text-lg text-white/60">Give customers their own portal to see trips, itineraries, documents, payments and travel info — all branded to your agency.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[['Trip & itinerary', MapIcon], ['Documents', FileCheck], ['Payments', CreditCard], ['Travel info', Phone]].map((r) => {
              const Ic = r[1];
              return <div key={r[0]} className="flex items-center gap-2.5 rounded-xl so-glass p-3 text-sm text-white/80"><Ic className="h-4 w-4 text-indigo-300" /> {r[0]}</div>;
            })}
          </div>
        </div>
        <Reveal delay={0.1} className="flex justify-center">
          <div className="relative w-[260px] rounded-[2.2rem] border-[6px] border-slate-800 bg-slate-900 p-3 shadow-2xl">
            <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-slate-700" />
            <div className="overflow-hidden rounded-2xl">
              <img src={IMG.portal} alt="" loading="lazy" className="h-36 w-full object-cover" />
            </div>
            <div className="mt-3 rounded-xl bg-white/[0.05] p-3">
              <div className="text-xs text-white/50">Your trip</div>
              <div className="text-sm font-bold text-white">Kashmir · 5 nights</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" /></div>
              <div className="mt-1 text-[11px] text-white/40">Payment 66% complete</div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px] text-white/60">
              {['Docs', 'Pay', 'Chat'].map((t) => <div key={t} className="rounded-lg bg-white/[0.05] py-2">{t}</div>)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- business intelligence */
function BISection() {
  const stats = [
    { label: 'Leads', to: 1284, prefix: '', suffix: '' },
    { label: 'Conversion', to: 32, suffix: '%' },
    { label: 'Revenue', to: 248, prefix: '$', suffix: 'K' },
    { label: 'Bookings', to: 362, suffix: '' },
  ];
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead center eyebrow="Business Intelligence" title="See the whole business clearly."
          sub="Leads, conversions, revenue, profit and outstanding — with elegant dashboards. All figures shown here are illustrative." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm so-lift">
                <div className="text-sm text-slate-500">{s.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900"><Counter to={s.to} prefix={s.prefix} suffix={s.suffix} /></div>
                <div className="mt-3 flex items-end gap-1">
                  {[40, 60, 50, 75, 65, 90].map((h, j) => (
                    <motion.div key={j} initial={{ height: 0 }} whileInView={{ height: h / 3 }} viewport={{ once: true }}
                      transition={{ delay: 0.2 + j * 0.05, duration: 0.5, ease: EASE }}
                      className="w-full rounded-t bg-indigo-200" style={{ height: h / 3 }} />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- one journey, one system */
function JourneySection() {
  const steps = ['Enquiry', 'Customer', 'Quote', 'Itinerary', 'Booking', 'Operations', 'Trip', 'Loyal customer'];
  return (
    <section id="solutions" className="so-section relative overflow-hidden bg-slate-950 py-28">
      <div className="so-grid absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-4xl px-6">
        <Reveal className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">The SafarOS journey</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">One journey.<br /><span className="so-gradient-text">One system.</span></h2>
        </Reveal>
        <div className="relative mt-16">
          <div className="absolute left-[27px] top-0 h-full w-px bg-white/10 sm:left-1/2" />
          <motion.div className="absolute left-[27px] top-0 w-px bg-gradient-to-b from-indigo-400 to-violet-500 sm:left-1/2"
            initial={{ height: 0 }} whileInView={{ height: '100%' }} viewport={{ once: true }} transition={{ duration: 1.8, ease: EASE }} />
          <div className="space-y-6">
            {steps.map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: 0.05, duration: 0.5, ease: EASE }}
                className={`relative flex items-center gap-5 sm:w-1/2 ${i % 2 ? 'sm:ml-auto sm:flex-row' : 'sm:flex-row-reverse sm:text-right'}`}>
                <span className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-sm font-bold text-indigo-300">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1 so-glass rounded-xl p-4"><span className="text-lg font-semibold text-white">{s}</span></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- how it works */
function HowItWorks() {
  const steps = [['01', 'Connect your business', 'Bring enquiries, suppliers and channels into SafarOS.'],
    ['02', 'Bring your team together', 'Owners, managers, agents and finance — with the right access.'],
    ['03', 'Manage your journeys', 'Quotes, itineraries, bookings and operations in one flow.'],
    ['04', 'Grow your business', 'Insights, follow-ups and AI that compound into revenue.']];
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead center eyebrow="How it works" title="Up and running in four steps." />
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s[0]} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-6 so-lift hover:border-indigo-200 hover:bg-white hover:shadow-lg">
                <div className="text-3xl font-bold so-gradient-text" style={{ WebkitTextFillColor: 'transparent' }}>{s[0]}</div>
                <div className="mt-3 text-lg font-semibold text-slate-900">{s[1]}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s[2]}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- pricing */
function Pricing() {
  const plans = [
    { name: 'Starter', price: 'Free', tagline: 'For getting started', features: ['1 workspace', 'Core CRM', 'Up to 3 team members', 'Basic quotations'], cta: 'Start Free', href: '/signup', highlight: false },
    { name: 'Professional', price: 'Custom', tagline: 'For growing agencies', features: ['Everything in Starter', 'Itineraries & bookings', 'Operations & finance', 'AI copilot', 'Customer portal'], cta: 'Start Free', href: '/signup', highlight: true },
    { name: 'Business', price: "Let's talk", tagline: 'For scale & teams', features: ['Everything in Professional', 'Advanced roles & controls', 'Website + search intelligence', 'Priority support'], cta: 'Book a Demo', href: '/signup', highlight: false },
  ];
  return (
    <section id="pricing" className="so-section bg-gradient-to-b from-white to-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead center eyebrow="Pricing" title="Simple pricing that scales with you."
          sub="Start free and upgrade as your agency grows. Plans are configurable — talk to us for the right fit." />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1}>
              <div className={`relative flex h-full flex-col rounded-3xl p-7 so-lift ${p.highlight ? 'bg-slate-950 text-white shadow-2xl ring-2 ring-indigo-500' : 'border border-slate-200 bg-white text-slate-900 shadow-sm'}`}>
                {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-1 text-[11px] font-semibold text-white">Most popular</span>}
                <div className={`text-sm font-semibold ${p.highlight ? 'text-indigo-300' : 'text-indigo-600'}`}>{p.name}</div>
                <div className="mt-3 text-4xl font-bold">{p.price}</div>
                <div className={`mt-1 text-sm ${p.highlight ? 'text-white/60' : 'text-slate-500'}`}>{p.tagline}</div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.highlight ? 'text-indigo-300' : 'text-indigo-600'}`} />
                      <span className={p.highlight ? 'text-white/85' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <motion.a href={p.href} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${p.highlight ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </motion.a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- FAQ */
function FAQ() {
  const faqs = [
    ['Is SafarOS built specifically for travel businesses?', 'Yes. SafarOS is designed around how travel agencies actually work — leads, quotations, itineraries, bookings, operations and finance — rather than a generic CRM.'],
    ['Can my whole team use it?', 'Absolutely. SafarOS supports roles like owner, manager, agent and finance, each with the right level of access to your workspace.'],
    ['Is my data isolated from other agencies?', 'Every record is scoped to your agency on the server. Your workspace data is never visible to other agencies.'],
    ['Do I need technical skills to start?', 'No. Create your workspace, invite your team and start managing journeys. You can connect a website and advanced features as you grow.'],
    ['How does the AI copilot help?', 'It assists with lead summaries, follow-up suggestions, quotation drafting and itinerary building, so your team moves faster.'],
  ];
  return (
    <section id="resources" className="so-section bg-white py-24">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHead center eyebrow="FAQ" title="Questions, answered." />
        <Reveal delay={0.1} className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-slate-200">
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline">{f[0]}</AccordionTrigger>
                <AccordionContent className="text-slate-500">{f[1]}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- final CTA + footer */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-28">
      <img src={IMG.cta} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
      <div className="so-aurora absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-[130px]" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Your travel business deserves an <span className="so-gradient-text">operating system.</span></h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">Bring sales, operations, finance, customers and growth together with SafarOS.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <CTA href="/signup" primary>Start Free</CTA>
            <CTA href="/signup">Book a Demo</CTA>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ['Platform', ['CRM', 'Quotations', 'Itineraries', 'Operations', 'AI']],
    ['Company', ['About', 'Careers', 'Contact', 'Blog']],
    ['Resources', ['Docs', 'Guides', 'Support', 'Status']],
  ];
  return (
    <footer className="bg-slate-950 pt-16 text-white/70">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 pb-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600"><Layers className="h-4 w-4" /></span>
              <span className="text-lg font-bold">SafarOS</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/50">The Operating System for Travel Businesses.</p>
            <div className="mt-6 flex gap-3">
              <a href="/signup" className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">Start Free</a>
              <a href="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">Sign In</a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c[0]}>
              <div className="text-sm font-semibold text-white">{c[0]}</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c[1].map((l) => <li key={l}><a href="#" className="transition-colors hover:text-white">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} SafarOS. All rights reserved.</span>
          <span className="flex gap-4"><a href="#" className="hover:text-white/70">Privacy</a><a href="#" className="hover:text-white/70">Terms</a></span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------- page */
function App() {
  return (
    <main className="so-font overflow-x-hidden bg-slate-950">
      <Navbar />
      <Hero />
      <ProductShowcase />
      <CRMSection />
      <QuotationSection />
      <ItinerarySection />
      <AISection />
      <SearchWebsitePortal />
      <PortalSection />
      <BISection />
      <JourneySection />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}

export default App;
