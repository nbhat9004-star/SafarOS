'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, FolderKanban } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function Inner() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/explore/media', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setRows(j.media || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin/explore" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Explore Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Media</span>
        </div>
      </div>

      <div className="container py-6 md:py-10">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Media Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Trip photos & covers uploaded by community members.</p>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="size-8 animate-spin text-emerald2" /></div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-muted-foreground mt-6"><FolderKanban className="size-8 mx-auto mb-2 text-emerald2" /> No media yet.</div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {rows.flatMap((t) => [...(t.photos || []), t.cover].filter(Boolean).map((img, i) => ({ img, tripId: t.id, tripSlug: t.slug, tripName: t.name, curator: t.curatorName, key: t.id + '-' + i })))
              .map((m) => (
                <Link key={m.key} href={`/explore/j/${m.tripSlug || m.tripId}`} target="_blank" className="group relative aspect-square rounded-xl overflow-hidden bg-secondary border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.img} alt={m.tripName} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                    <div className="text-white text-[10px] font-semibold truncate">{m.tripName}</div>
                  </div>
                </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default function Page() { return <ProtectedRoute roles={['super_admin', 'admin']}><Inner /></ProtectedRoute>; }
