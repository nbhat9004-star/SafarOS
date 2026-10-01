'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Users, MoreHorizontal, MessageCircle, Bookmark, Share2, Bell, Loader2 } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import { MORE_TRIPS } from '@/lib/explore-v2-data';
import { fetchMyTrips } from '@/lib/explore-api';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'hosting', label: 'Hosting' },
  { id: 'joined', label: 'Joined' },
  { id: 'completed', label: 'Completed' },
  { id: 'saved', label: 'Saved' },
];

// Enrich the mock trips with status for a native app feel
const MY_TRIPS = MORE_TRIPS.map((t, i) => ({
  ...t,
  status: ['upcoming', 'hosting', 'joined', 'completed', 'saved'][i % 5],
  countdown: ['in 3 days', 'in 12 days', 'in 5 weeks', 'ended', 'saved'][i % 5],
}));

const STATUS_STYLE = {
  upcoming: 'bg-violet-100 text-violet-700',
  hosting: 'bg-emerald-100 text-emerald-700',
  joined: 'bg-sky-100 text-sky-700',
  completed: 'bg-slate-100 text-slate-600',
  saved: 'bg-amber-100 text-amber-700',
};

export default function MyTrips() {
  const [tab, setTab] = useState('upcoming');
  const [hosted, setHosted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchMyTrips()
      .then(list => {
        if (!alive) return;
        // Tag remote trips with a status derived from dates/visibility
        const now = Date.now();
        setHosted(list.map(t => {
          const start = t.raw?.startDate ? new Date(t.raw.startDate).getTime() : null;
          const end = t.raw?.endDate ? new Date(t.raw.endDate).getTime() : null;
          const status = t.raw?.visibility === 'draft' ? 'saved'
            : end && end < now ? 'completed'
            : start && start > now ? 'upcoming'
            : 'hosting';
          return { ...t, status, countdown: status === 'upcoming' && start ? `in ${Math.max(1, Math.round((start - now) / 86400000))} days` : status };
        }));
      })
      .catch(() => setHosted([]))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const merged = [...hosted, ...MY_TRIPS.filter(t => !hosted.find(h => h.id === t.id))];
  const list = merged.filter(t => tab === 'upcoming' ? ['upcoming','hosting','joined'].includes(t.status) : t.status === tab);

  return (
    <Shell>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-[22px] md:text-[26px] tracking-tight">My Trips</h1>
              <p className="text-[12.5px] text-slate-500">Trips you host, join, or save</p>
            </div>
            <Link href="/explore/notifications" className="size-10 grid place-items-center rounded-full hover:bg-slate-100 relative" aria-label="Notifications">
              <Bell className="size-5 text-slate-700" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </Link>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${tab === t.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-5">
        {list.length > 0 ? (
          <div className="space-y-3">
            {list.map(t => (
              <article key={t.id} className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm active:scale-[0.99] transition">
                <div className="flex gap-3 p-3">
                  <Link href={`/explore/trip/${t.id}`} className="relative size-24 md:size-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <Image src={t.cover} alt={t.title} fill className="object-cover" sizes="120px" unoptimized />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                      <button className="size-7 grid place-items-center rounded-full hover:bg-slate-100"><MoreHorizontal className="size-4 text-slate-500" /></button>
                    </div>
                    <Link href={`/explore/trip/${t.id}`} className="block">
                      <h3 className="mt-1 font-display font-bold text-[14.5px] tracking-tight text-slate-900 line-clamp-1">{t.title}</h3>
                      <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-500"><MapPin className="size-3" /> <span className="truncate">{t.location}</span></div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {t.dates}</span>
                        <span className="inline-flex items-center gap-1"><Users className="size-3" /> {t.joined}/{t.max}</span>
                      </div>
                    </Link>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-violet-700">{t.countdown}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
                  <Link href="/explore/chat/demo" className="flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition"><MessageCircle className="size-3.5" /> Chat</Link>
                  <button className="flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition"><Bookmark className="size-3.5" /> Save</button>
                  <button className="flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition"><Share2 className="size-3.5" /> Share</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center rounded-3xl bg-white border border-slate-100">
            <div className="mx-auto size-12 rounded-2xl bg-violet-100 grid place-items-center text-violet-600 mb-3 text-[20px]">{'\u{1F9F3}'}</div>
            <div className="font-display font-bold text-slate-900">Nothing here yet</div>
            <p className="text-[13px] text-slate-500 mt-1">Your {TABS.find(t => t.id === tab)?.label.toLowerCase()} trips will appear here.</p>
          </div>
        )}
      </main>
    </Shell>
  );
}
