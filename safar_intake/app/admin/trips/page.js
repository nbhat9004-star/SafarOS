'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, RefreshCw, Trash2, Eye, Loader2, Users, MapPin, Calendar,
} from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

const VISIBILITY_STYLES = {
  public:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:     'bg-amber-50 text-amber-700 border-amber-200',
  private:   'bg-slate-100 text-slate-700 border-slate-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  archived:  'bg-rose-50 text-rose-700 border-rose-200',
};

function Inner() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('visibility', filter);
      const r = await fetch('/api/admin/circle/journeys?' + params.toString(), { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setRows(j.journeys || []);
      else toast.error(j?.error || 'Load failed');
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) =>
      (r.name || '').toLowerCase().includes(s) ||
      (r.destination?.name || '').toLowerCase().includes(s) ||
      (r.curatorName || '').toLowerCase().includes(s)
    );
  }, [rows, q]);

  const counts = useMemo(() => {
    const c = { total: rows.length };
    for (const v of ['public','draft','private','scheduled','archived']) {
      c[v] = rows.filter((r) => r.visibility === v).length;
    }
    return c;
  }, [rows]);

  const remove = async (row) => {
    if (!confirm(`Delete trip “${row.name}”? This cannot be undone.`)) return;
    try {
      const r = await fetch(`/api/admin/circle/journeys/${row.id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Failed');
      toast.success('Trip removed');
      setRows((cur) => cur.filter((x) => x.id !== row.id));
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Community Trips</span>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        <div className="flex items-start flex-wrap justify-between gap-4 mb-5">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Community Trips</h1>
            <p className="text-sm text-muted-foreground mt-1">All community-planned trips across Safar Curated.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-white border text-sm font-semibold hover:bg-emerald2/5 transition"><RefreshCw className="size-4" /> Refresh</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-5">
          <button onClick={() => setFilter('')} className={`p-3 rounded-xl border text-left transition ${filter === '' ? 'bg-emerald2 text-white border-emerald2' : 'bg-white'}`}>
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">All</div>
            <div className="text-xl font-bold">{counts.total}</div>
          </button>
          {['public','draft','private','scheduled','archived'].map((v) => (
            <button key={v} onClick={() => setFilter(v)} className={`p-3 rounded-xl border text-left transition ${filter === v ? 'bg-emerald2 text-white border-emerald2' : 'bg-white'}`}>
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-70 capitalize">{v}</div>
              <div className="text-xl font-bold">{counts[v] || 0}</div>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by trip name, destination or organiser" className="w-full h-11 pl-10 pr-4 rounded-xl border bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10" />
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-secondary/70 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Trip</th>
                  <th className="text-left px-4 py-3 font-semibold">Destination</th>
                  <th className="text-left px-4 py-3 font-semibold">Organiser</th>
                  <th className="text-left px-4 py-3 font-semibold">Participants</th>
                  <th className="text-left px-4 py-3 font-semibold">Visibility</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin inline" /></td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No trips found.</td></tr>
                )}
                {!loading && filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-emerald-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.cover ? (
                          <div className="relative size-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
                            <Image src={r.cover} alt={r.name} fill sizes="48px" className="object-cover" />
                          </div>
                        ) : <div className="size-12 rounded-lg bg-secondary shrink-0" />}
                        <div className="min-w-0">
                          <div className="font-semibold text-charcoal truncate max-w-[280px]">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.theme}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1 text-charcoal"><MapPin className="size-3.5 text-emerald2" /> {r.destination?.name || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-charcoal">{r.curatorName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1 text-charcoal"><Users className="size-3.5 text-emerald2" /> {r.membersCount || 0}/{r.maxMembers || 6}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${VISIBILITY_STYLES[r.visibility] || 'bg-secondary'}`}>{r.visibility}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/explore/j/${r.slug || r.id}`} target="_blank" className="p-2 rounded-lg hover:bg-emerald2/10 text-emerald2" title="View"><Eye className="size-4" /></Link>
                        <button onClick={() => remove(r)} className="p-2 rounded-lg hover:bg-rose-100 text-rose-600" title="Delete"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <ProtectedRoute roles={['super_admin','admin']}><Inner /></ProtectedRoute>;
}
