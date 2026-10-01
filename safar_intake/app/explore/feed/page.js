'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import TripCard from '@/components/explore-v2/TripCard';
import { MORE_TRIPS, CATEGORIES } from '@/lib/explore-v2-data';
import { fetchTrips } from '@/lib/explore-api';

function FeedInner() {
  const sp = useSearchParams();
  const initial = sp.get('cat') || 'all';
  const [cat, setCat] = useState(initial);
  const [q, setQ] = useState('');
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTrips({ categorySlug: cat === 'all' ? null : cat, limit: 30 })
      .then(list => { if (alive) setRemote(list); })
      .catch(() => { if (alive) setRemote([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [cat]);

  // Merge: prefer live data, top-up with mock so a fresh DB still shows content.
  const remoteIds = new Set(remote.map(t => t.id));
  const merged = [...remote, ...MORE_TRIPS.filter(t => !remoteIds.has(t.id))];
  const trips = merged.filter(t => (!q || (t.title + ' ' + t.location).toLowerCase().includes(q.toLowerCase())));

  return (
    <Shell>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/explore" className="size-10 grid place-items-center rounded-full hover:bg-slate-100 active:scale-95 transition"><ArrowLeft className="size-5" /></Link>
            <h1 className="flex-1 font-display font-bold text-[17px] md:text-[20px] tracking-tight">Explore Trips</h1>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-2xl bg-slate-100/70 border border-slate-100 px-3.5 h-11">
              <Search className="size-4 text-slate-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search trips, destinations..." className="flex-1 bg-transparent outline-none text-[14px]" />
            </div>
            <button className="size-11 grid place-items-center rounded-2xl bg-slate-100/70 border border-slate-100"><SlidersHorizontal className="size-4 text-slate-600" /></button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
            <button onClick={() => setCat('all')} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${cat === 'all' ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${cat === c.id ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {trips.map(t => <TripCard key={t.id} trip={t} />)}
        </div>
        {trips.length === 0 && (
          <div className="py-14 text-center rounded-3xl bg-white border border-slate-100">
            <div className="font-display font-bold text-slate-900">No trips found</div>
            <p className="text-[13px] text-slate-500 mt-1">Try a different search or category.</p>
          </div>
        )}
      </main>
    </Shell>
  );
}

export default function App() {
  return <Suspense fallback={<div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-violet-600" /></div>}><FeedInner /></Suspense>;
}
