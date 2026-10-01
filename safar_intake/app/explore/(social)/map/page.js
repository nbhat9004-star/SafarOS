'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Loader2, Users, Calendar, Sparkles } from 'lucide-react';

// -------------------------------------------------------------------
// EXPLORE V3 — Live Map (lightweight stylized version, zero-dep)
// A stylized "map canvas" with animated pin markers for each destination.
// Clicking a pin reveals the trip card. No external map library used to
// respect the credit + package constraints; the visual conveys location
// intent while a real leaflet map can be added later without changes
// elsewhere.
// -------------------------------------------------------------------
export default function LiveMapPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/circle/journeys?limit=60', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setTrips(j.journeys || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  // Deterministic pseudo-random position on the canvas so each trip has a stable pin.
  const pinPos = (id, idx) => {
    const s = String(id || idx);
    let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
    const x = 8 + (h % 84);
    const y = 12 + ((h >> 8) % 76);
    return { x, y };
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal tracking-tight flex items-center gap-3">
          <span className="inline-grid place-items-center size-10 rounded-2xl bg-emerald2 text-white"><MapPin className="size-5" /></span>
          Live Map
        </h1>
        <p className="text-muted-foreground mt-1">Every published trip pinned across Kashmir. Tap a pin to preview.</p>
      </div>

      <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden shadow-xl border bg-gradient-to-br from-emerald-50 to-blue-50">
        {/* Canvas backdrop — stylized topographic pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="topo" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="0.4" fill="#065f46" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#topo)" />
          {/* Stylized “Kashmir Valley” shapes */}
          <path d="M 15 30 Q 30 20 45 25 T 80 30 Q 85 45 70 55 T 40 70 Q 20 65 15 45 Z" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="0.3" />
          <path d="M 25 40 Q 45 32 65 42 T 78 55" fill="none" stroke="#059669" strokeWidth="0.4" strokeDasharray="1,1" opacity="0.5" />
        </svg>

        {loading ? (
          <div className="absolute inset-0 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div>
        ) : trips.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">No published trips yet.</div>
        ) : (
          trips.map((t, idx) => {
            const p = pinPos(t.id, idx);
            return (
              <button key={t.id} onClick={() => setSelected(t)}
                className="absolute -translate-x-1/2 -translate-y-full group"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                title={t.name}>
                <div className="relative">
                  <div className="size-8 rounded-full bg-emerald2 grid place-items-center text-white shadow-lg ring-4 ring-white group-hover:scale-110 transition">
                    <MapPin className="size-4" strokeWidth={2.5} />
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[10px] font-bold text-emerald-900 bg-white/95 border border-emerald-100 px-2 py-0.5 rounded-full shadow max-w-[180px] truncate opacity-0 group-hover:opacity-100 transition">
                    {t.destination?.name || t.name}
                  </div>
                  {/* Ripple */}
                  <span className="absolute inset-0 rounded-full animate-ping bg-emerald2/40" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selected trip preview */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {selected.cover && (
              <div className="relative aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.cover} alt={selected.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">{selected.destination?.name}</div>
              <h3 className="font-display text-xl font-bold text-charcoal mt-1">{selected.name}</h3>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {selected.maxMembers}</span>
                {selected.startDate && <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {new Date(selected.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>}
                {(selected.services || []).length > 0 && <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><Sparkles className="size-3.5" /> Curated</span>}
              </div>
              <Link href={`/explore/j/${selected.slug || selected.id}`} className="mt-4 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold">View Trip</Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground text-center">Live view of every published trip · tap any pin.</div>
    </div>
  );
}
