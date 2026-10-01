'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Loader2 } from 'lucide-react';
import { TripCard } from '../home/page';

const CATEGORIES = ['', 'weekend_escape', 'adventure', 'road_trip', 'photography', 'food'];
const CAT_LABELS = { '': 'All', weekend_escape: 'Weekend', adventure: 'Adventure', road_trip: 'Road Trip', photography: 'Photography', food: 'Food' };

export default function JoinTripPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (cat) params.set('theme', cat);
        if (budget) params.set('maxBudget', budget);
        params.set('limit', '60');
        const r = await fetch('/api/circle/journeys?' + params.toString(), { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setTrips(j.journeys || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [cat, budget]);

  const filtered = q ? trips.filter((t) =>
    (t.name || '').toLowerCase().includes(q.toLowerCase()) ||
    (t.destination?.name || '').toLowerCase().includes(q.toLowerCase())
  ) : trips;

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal tracking-tight">Join a trip</h1>
        <p className="text-muted-foreground mt-1">Browse published trips, filter by category and budget, then request to join. The organiser reviews every request.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border shadow-sm p-3 md:p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by destination or trip name…" className="w-full h-11 pl-10 pr-4 rounded-xl border bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10" />
          </div>
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Max budget ₹" className="w-full h-11 px-4 rounded-xl border bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c || 'all'} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${cat === c ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-emerald2/5'}`}>{CAT_LABELS[c]}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="size-8 animate-spin text-emerald2" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No trips match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((t) => <TripCard key={t.id} trip={t} />)}
        </div>
      )}
    </div>
  );
}
