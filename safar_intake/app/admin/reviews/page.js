'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ShieldCheck, ShieldAlert, Trash2, Eye, EyeOff, Star, Flag, Settings2, Save, RefreshCw, Ban } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const TABS = [
  { id: 'reported', label: 'Reported' },
  { id: 'pending', label: 'Pending' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'approved', label: 'Approved' },
  { id: 'settings', label: 'Settings' },
];

function ReviewCenterInner() {
  const [tab, setTab] = useState('reported');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    if (tab === 'settings') { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/reviews/moderation?status=${tab}`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setData(d);
    } finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [tab]);

  const act = async (id, action) => {
    const reason = action === 'reject' || action === 'delete' ? prompt('Reason?') || '' : '';
    setBusy(`${id}-${action}`);
    try {
      const r = await fetch(`/api/admin/reviews/${id}/moderate`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason }),
      });
      const d = await r.json();
      if (d.ok || d.deleted) { toast.success(`Review ${action}`); load(); }
      else toast.error(d.error || 'Failed');
    } finally { setBusy(null); }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Admin
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-2"><ShieldCheck className="size-7 text-emerald2" /> Review Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Moderation, reported reviews, and platform settings.</p>

        {/* Stat cards */}
        {data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] text-muted-foreground uppercase font-bold">Total</div><div className="font-display text-xl font-bold">{data.stats.total}</div></div>
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] text-amber-600 uppercase font-bold">Pending</div><div className="font-display text-xl font-bold">{data.stats.pending}</div></div>
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] text-rose-600 uppercase font-bold">Reported</div><div className="font-display text-xl font-bold">{data.stats.reported}</div></div>
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] text-slate-600 uppercase font-bold">Hidden</div><div className="font-display text-xl font-bold">{data.stats.hidden}</div></div>
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] text-emerald-700 uppercase font-bold">Approved</div><div className="font-display text-xl font-bold">{data.stats.approved}</div></div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-6 -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition ${tab === t.id ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'settings' ? (
          <SettingsPanel />
        ) : loading ? (
          <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : (
          <div className="mt-4 space-y-3">
            {(data?.reviews || []).length === 0 ? (
              <div className="p-12 border rounded-2xl bg-white text-center text-sm text-muted-foreground">No reviews in this bucket.</div>
            ) : (
              data.reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border bg-white p-4 md:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-sm">{r.userName}</div>
                        <div className="inline-flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-3 ${i <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />)}</div>
                        {r.moderationStatus && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full border bg-secondary">{r.moderationStatus}</span>}
                        {r.hidden && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-100 border">hidden</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">Listing: {r.listingId || r.propertyId} · {new Date(r.createdAt).toLocaleString()}</div>
                      {r.title && <div className="font-semibold text-sm mt-1">{r.title}</div>}
                      {r.reviewText && <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{r.reviewText}</div>}
                      {r.reports?.length > 0 && (
                        <div className="mt-2 rounded-xl bg-rose-50 border border-rose-100 p-2">
                          <div className="text-[10px] uppercase font-bold text-rose-700 mb-1 inline-flex items-center gap-1"><Flag className="size-3" /> {r.reports.length} report(s)</div>
                          {r.reports.map((rep, i) => (
                            <div key={i} className="text-xs text-rose-800">
                              <span className="font-semibold">{rep.reason}</span> — by {rep.userName}{rep.note ? ` · ${rep.note}` : ''}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <Button size="sm" onClick={() => act(r.id, 'approve')} disabled={busy === `${r.id}-approve`} className="rounded-full bg-emerald2 hover:bg-emerald2-deep h-8">Approve</Button>
                      {!r.hidden && <Button size="sm" variant="outline" onClick={() => act(r.id, 'hide')} className="rounded-full h-8"><EyeOff className="size-3 mr-1" />Hide</Button>}
                      {r.hidden && <Button size="sm" variant="outline" onClick={() => act(r.id, 'restore')} className="rounded-full h-8"><Eye className="size-3 mr-1" />Restore</Button>}
                      <Button size="sm" variant="ghost" onClick={() => act(r.id, 'reject')} className="rounded-full h-8 text-amber-700"><Ban className="size-3 mr-1" />Reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => act(r.id, 'delete')} className="rounded-full h-8 text-rose-600"><Trash2 className="size-3 mr-1" />Delete</Button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Most reported + most active */}
            {(data?.mostReportedListings?.length > 0 || data?.mostActiveReviewers?.length > 0) && (
              <div className="grid md:grid-cols-2 gap-3 mt-6">
                {data.mostReportedListings.length > 0 && (
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="font-display font-bold mb-2 flex items-center gap-1"><Flag className="size-4 text-rose-500" /> Most Reported Listings</div>
                    <ul className="text-sm divide-y">
                      {data.mostReportedListings.map((x) => (
                        <li key={x._id} className="py-1.5 flex justify-between"><span className="font-mono truncate">{x._id?.slice(0, 12)}</span><span className="font-semibold text-rose-600">{x.reports}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.mostActiveReviewers.length > 0 && (
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="font-display font-bold mb-2 flex items-center gap-1"><Star className="size-4 text-amber-500" /> Most Active Reviewers</div>
                    <ul className="text-sm divide-y">
                      {data.mostActiveReviewers.map((x) => (
                        <li key={x._id} className="py-1.5 flex justify-between"><span className="font-mono truncate">{x._id?.slice(0, 12)}</span><span className="font-semibold">{x.count}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function SettingsPanel() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/admin/review-settings', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setS(d.settings);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/review-settings', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s),
      });
      const d = await r.json();
      if (d.ok) { toast.success('Settings saved'); setS(d.settings); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };

  if (!s) return <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;

  const Field = ({ label, children, hint }) => (
    <label className="block">
      <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
  const Input = (p) => <input {...p} className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white ${p.className || ''}`} />;
  const Toggle = ({ v, onChange, label }) => (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!v} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-emerald-600" />
      <span className="text-sm">{label}</span>
    </label>
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Settings2 className="size-5 text-emerald2" /> Review Rules</div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Min Length (chars)"><Input type="number" value={s.minReviewLength} onChange={(e) => setS({ ...s, minReviewLength: Number(e.target.value) })} /></Field>
          <Field label="Max Length (chars)"><Input type="number" value={s.maxReviewLength} onChange={(e) => setS({ ...s, maxReviewLength: Number(e.target.value) })} /></Field>
          <Field label="Edit Window (hours)"><Input type="number" value={s.editWindowHours} onChange={(e) => setS({ ...s, editWindowHours: Number(e.target.value) })} /></Field>
          <Field label="Max Photos"><Input type="number" value={s.maxPhotos} onChange={(e) => setS({ ...s, maxPhotos: Number(e.target.value) })} /></Field>
          <Field label="Max Videos"><Input type="number" value={s.maxVideos} onChange={(e) => setS({ ...s, maxVideos: Number(e.target.value) })} /></Field>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border p-3"><Toggle v={s.allowAnonymous} onChange={(v) => setS({ ...s, allowAnonymous: v })} label="Allow Anonymous" /></div>
          <div className="rounded-xl border p-3"><Toggle v={s.allowPhotos} onChange={(v) => setS({ ...s, allowPhotos: v })} label="Allow Photos" /></div>
          <div className="rounded-xl border p-3"><Toggle v={s.allowVideos} onChange={(v) => setS({ ...s, allowVideos: v })} label="Allow Videos" /></div>
          <div className="rounded-xl border p-3"><Toggle v={s.autoPublish} onChange={(v) => setS({ ...s, autoPublish: v })} label="Auto Publish" /></div>
          <div className="rounded-xl border p-3"><Toggle v={s.requireApproval} onChange={(v) => setS({ ...s, requireApproval: v })} label="Require Approval" /></div>
          <div className="rounded-xl border p-3"><Toggle v={s.enableAiSummary} onChange={(v) => setS({ ...s, enableAiSummary: v })} label="Enable AI Summary" /></div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="font-display text-lg font-bold mb-4">Badge Thresholds</div>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(s.badgeThresholds).map(([k, v]) => (
            <Field key={k} label={k}>
              <Input type="number" step="0.1" value={v} onChange={(e) => setS({ ...s, badgeThresholds: { ...s.badgeThresholds, [k]: Number(e.target.value) } })} />
            </Field>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin', 'super_admin']}><ReviewCenterInner /></ProtectedRoute>;
}
