'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, CalendarDays, MessageCircle, Users, ChartNoAxesCombined, Sparkles, CheckCircle2 } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

function ProductPreview() {
  const rows = [
    { name: 'Alpine escape · 5 nights', client: 'Alex Morgan', date: '12 Dec 2026', status: 'Confirmed', color: 'bg-emerald-50 text-emerald-700' },
    { name: 'Coastal discovery · 3 nights', client: 'Sara Williams', date: '15 Dec 2026', status: 'Awaiting payment', color: 'bg-amber-50 text-amber-700' },
    { name: 'City & culture · 7 nights', client: 'Daniel Reed', date: '18 Dec 2026', status: 'In progress', color: 'bg-blue-50 text-blue-700' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24, duration: .8, ease: EASE }}
      className="safar-clean-preview mx-auto mt-14 w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_28px_90px_-42px_rgba(15,23,42,.28)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">S</span><div><div className="text-sm font-semibold text-slate-900">SafarOS workspace</div><div className="text-xs text-slate-400">Good morning, Alex</div></div></div>
        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> All systems operational</div>
      </div>
      <div className="grid gap-0 md:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-slate-100 p-4 md:block">
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900">Overview</div>
          {['Enquiries','Bookings','Itineraries','Customers','Messages','Reports'].map((x,i)=><div key={x} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${i===1?'bg-emerald-500':'bg-slate-300'}`}/>{x}</div>)}
        </aside>
        <div className="min-w-0 p-4 sm:p-7">
          <div className="mb-5 flex items-end justify-between gap-3"><div><div className="text-xs text-slate-400">Your business at a glance</div><div className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Workspace overview</div></div><span className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500">This month⌄</span></div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[['Active bookings','128','+12.8%'],['New enquiries','64','+8.4%'],['Revenue tracked','₹8.4L','+14.2%'],['Team members','12','+2']].map(([label,value,delta])=><div key={label} className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4"><div className="text-[11px] text-slate-400 sm:text-xs">{label}</div><div className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{value}</div><div className="mt-1 text-[10px] font-medium text-emerald-600">{delta} this month</div></div>)}
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="text-xs font-semibold text-slate-800">Recent bookings</span><span className="text-[11px] font-medium text-slate-500">View all →</span></div>
            {rows.map(row=><div key={row.name} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-0 sm:grid-cols-[1.3fr_1fr_100px_auto]"><div className="min-w-0"><div className="truncate text-xs font-medium text-slate-800">{row.name}</div><div className="mt-1 text-[10px] text-slate-400 sm:hidden">{row.client} · {row.date}</div></div><div className="hidden text-xs text-slate-500 sm:block">{row.client}</div><div className="hidden text-xs text-slate-500 sm:block">{row.date}</div><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${row.color}`}>{row.status}</span></div>)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CinematicHero() {
  return (
    <section className="safar-clean-hero relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pt-40">
      <div className="safar-clean-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-[11px] font-semibold tracking-wide text-slate-600 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600"/> THE WORKSPACE BUILT FOR TRAVEL BUSINESSES
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08, duration: .7, ease: EASE }}
          className="mx-auto mt-7 max-w-4xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-.055em] text-slate-950 sm:text-6xl lg:text-[72px]">
          Run your travel business.<br/><span className="text-emerald-700">All in one place.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16, duration: .65 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
          Bring enquiries, itineraries, bookings, payments and team workflows together in one clear workspace. Spend less time coordinating and more time creating great journeys.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22, duration: .65 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-800">Get started <ArrowRight className="h-4 w-4"/></a>
          <button onClick={() => document.getElementById('demo')?.scrollIntoView({behavior:'smooth'})} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"><Play className="h-4 w-4"/> See how it works</button>
        </motion.div>
        <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600"/> One connected workspace</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600"/> Built for growing agencies</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600"/> Simple to get started</span>
        </div>
      </div>
      <div className="relative"><ProductPreview/></div>
    </section>
  );
}
