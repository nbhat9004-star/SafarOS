'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function Inner() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/circle/journeys', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setTrips(j.journeys || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin/explore" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Explore Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Live Map</span>
        </div>
      </div>

      <div className="container py-6 md:py-10">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Live Map — Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">All published community trips at a glance. Open the public live map for the animated view.</p>

        <div className="mt-4 flex items-center gap-2">
          <Link href="/explore/map" target="_blank" className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><MapPin className="size-4" /> Open live map</Link>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="size-8 animate-spin text-emerald2" /></div>
        ) : (
          <div className="mt-6 bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/70 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Trip</th>
                  <th className="text-left px-4 py-3 font-semibold">Destination</th>
                  <th className="text-left px-4 py-3 font-semibold">District</th>
                  <th className="text-left px-4 py-3 font-semibold">Coordinates</th>
                  <th className="text-left px-4 py-3 font-semibold">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-emerald-50/40">
                    <td className="px-4 py-3 font-semibold text-charcoal truncate max-w-[280px]">{t.name}</td>
                    <td className="px-4 py-3">{t.destination?.name || '—'}</td>
                    <td className="px-4 py-3">{t.destination?.district || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.destination?.lat && t.destination?.lng ? `${t.destination.lat.toFixed(3)}, ${t.destination.lng.toFixed(3)}` : '—'}</td>
                    <td className="px-4 py-3">{t.visibility}</td>
                  </tr>
                ))}
                {trips.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No trips.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default function Page() { return <ProtectedRoute roles={['super_admin', 'admin']}><Inner /></ProtectedRoute>; }
