'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Search, RefreshCw, Download, Loader2, Eye, Phone, Mail, X, Check } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

const STATUS_STYLES = {
  'Pending Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Contacted': 'bg-blue-50 text-blue-700 border-blue-200',
  'Documents Requested': 'bg-purple-50 text-purple-700 border-purple-200',
  'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
};
const STATUSES = ['Pending Review','Contacted','Documents Requested','Approved','Rejected'];

function Inner() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [view, setView] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      if (q) params.set('q', q);
      const r = await fetch('/api/admin/founding-partners?' + params.toString(), { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setRows(j.applications || []);
      else toast.error(j?.error || 'Load failed');
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const counts = useMemo(() => {
    const c = { total: rows.length };
    for (const st of STATUSES) c[st] = rows.filter(r => r.status === st).length;
    return c;
  }, [rows]);

  const updateStatus = async (row, status) => {
    try {
      const r = await fetch(`/api/admin/founding-partners/${row.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Failed');
      toast.success(`Marked as ${status}`);
      setRows((cur) => cur.map((x) => x.id === row.id ? { ...x, status } : x));
      if (view?.id === row.id) setView({ ...view, status });
    } catch (e) { toast.error(e.message); }
  };

  const exportCsv = () => {
    window.open('/api/admin/founding-partners/export', '_blank');
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Founding Partner Applications</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/website-builder/launch-mode" className="text-xs font-semibold text-emerald2 hover:underline">← Launch Mode settings</Link>
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        <div className="flex items-start flex-wrap justify-between gap-4 mb-5">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Founding Partner Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">Applications submitted from the premium launch page.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-white border text-sm font-semibold hover:bg-emerald2/5 transition"><RefreshCw className="size-4" /> Refresh</button>
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold transition"><Download className="size-4" /> Export CSV</button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-5">
          <button onClick={() => setFilter('')} className={`p-3 rounded-xl border text-left transition ${filter === '' ? 'bg-emerald2 text-white border-emerald2' : 'bg-white'}`}>
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">All</div>
            <div className="text-xl font-bold">{counts.total}</div>
          </button>
          {STATUSES.map((st) => (
            <button key={st} onClick={() => setFilter(st)} className={`p-3 rounded-xl border text-left transition ${filter === st ? 'bg-emerald2 text-white border-emerald2' : 'bg-white'}`}>
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-70 truncate">{st}</div>
              <div className="text-xl font-bold">{counts[st] || 0}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search name / email / phone / category" className="w-full h-11 pl-10 pr-4 rounded-xl border bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-secondary/70 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">City</th>
                  <th className="text-left px-4 py-3 font-semibold">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin inline" /></td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No applications yet.</td></tr>
                )}
                {!loading && rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-emerald-50/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-charcoal">{r.fullName}</div>
                      {r.businessName && <div className="text-xs text-muted-foreground">{r.businessName}</div>}
                    </td>
                    <td className="px-4 py-3">{r.category}</td>
                    <td className="px-4 py-3"><div>{r.city}</div><div className="text-xs text-muted-foreground">{r.district}</div></td>
                    <td className="px-4 py-3 font-mono text-xs">{r.mobile}</td>
                    <td className="px-4 py-3 text-xs">{r.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${STATUS_STYLES[r.status] || 'bg-secondary'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setView(r)} className="p-2 rounded-lg hover:bg-emerald2/10 text-emerald2" title="View"><Eye className="size-4" /></button>
                        <a href={`tel:${r.mobile}`} className="p-2 rounded-lg hover:bg-emerald2/10 text-emerald2" title="Call"><Phone className="size-4" /></a>
                        <a href={`mailto:${r.email}`} className="p-2 rounded-lg hover:bg-emerald2/10 text-emerald2" title="Email"><Mail className="size-4" /></a>
                        {r.status !== 'Approved' && <button onClick={() => updateStatus(r, 'Approved')} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-700" title="Approve"><Check className="size-4" /></button>}
                        {r.status !== 'Rejected' && <button onClick={() => updateStatus(r, 'Rejected')} className="p-2 rounded-lg hover:bg-rose-100 text-rose-600" title="Reject"><X className="size-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {view && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setView(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">{view.applicationId}</div>
                <h3 className="font-display text-xl font-bold text-charcoal mt-1">{view.fullName}</h3>
                {view.businessName && <div className="text-sm text-muted-foreground">{view.businessName}</div>}
                <span className={`inline-block mt-2 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${STATUS_STYLES[view.status]}`}>{view.status}</span>
              </div>
              <button onClick={() => setView(null)} className="size-9 rounded-full bg-secondary grid place-items-center"><X className="size-4" /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <Row label="Category" value={view.category} />
              <Row label="Email" value={view.email} />
              <Row label="Mobile" value={view.mobile} />
              <Row label="WhatsApp" value={view.whatsapp || view.mobile} />
              <Row label="City / District" value={`${view.city}, ${view.district}`} />
              <Row label="Address" value={view.businessAddress || '—'} />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-1">Description</div>
                <div className="text-charcoal leading-relaxed whitespace-pre-line">{view.description || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-2">Update Status</div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((st) => (
                    <button key={st} onClick={() => updateStatus(view, st)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${view.status === st ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-emerald2/5'}`}>{st}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-emerald-50">
      <div className="text-xs uppercase tracking-wider font-bold text-emerald-800">{label}</div>
      <div className="text-charcoal text-right break-all">{value}</div>
    </div>
  );
}

export default function Page() {
  return <ProtectedRoute roles={['super_admin','admin']}><Inner /></ProtectedRoute>;
}
