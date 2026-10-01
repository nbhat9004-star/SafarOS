'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function Inner() {
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/explore/settings', { cache: 'no-store' });
        const j = await res.json();
        if (j?.ok) setR(j.settings.rewards);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/explore/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rewards: r }) });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      toast.success('Rewards updated');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading || !r) return <div className="container py-16 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div>;

  const updateCard = (idx, patch) => setR({ ...r, cards: r.cards.map((c, i) => i === idx ? { ...c, ...patch } : c) });

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin/explore" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Explore Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Rewards</span>
        </div>
      </div>

      <div className="container py-6 md:py-10 max-w-3xl">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Rewards Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure the 3×3 board that reveals a travel-related reward after 9 completed trips.</p>

        <div className="mt-6 bg-white rounded-2xl border p-5 space-y-4">
          <Field label="Board title" value={r.boardTitle} onChange={(v) => setR({ ...r, boardTitle: v })} />
          <Field label="Board subtitle" value={r.boardSubtitle} onChange={(v) => setR({ ...r, boardSubtitle: v })} textarea rows={2} />

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-emerald-800 mb-2">The 9 cards</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(r.cards || []).slice(0, 9).map((c, idx) => (
                <div key={c.id || idx} className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-3 space-y-2">
                  <input value={c.emoji || ''} maxLength={4} onChange={(e) => updateCard(idx, { emoji: e.target.value })} placeholder="emoji" className="w-full h-11 text-center text-2xl rounded-xl border bg-white outline-none focus:border-emerald2" />
                  <input value={c.label || ''} onChange={(e) => updateCard(idx, { label: e.target.value })} placeholder="label" className="w-full h-9 px-3 text-sm rounded-lg border bg-white outline-none focus:border-emerald2" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-900 text-white rounded-2xl p-5 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-amber-300">Hidden final reward</div>
            <Field label="Reward title" value={r.finalReward?.title} onChange={(v) => setR({ ...r, finalReward: { ...r.finalReward, title: v } })} dark />
            <Field label="Reward body" value={r.finalReward?.body} onChange={(v) => setR({ ...r, finalReward: { ...r.finalReward, body: v } })} textarea rows={2} dark />
          </div>

          <div className="pt-4 border-t flex items-center justify-end">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white font-semibold shadow transition">
              {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : <><Save className="size-4" /> Save rewards</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Field({ label, value, onChange, textarea, rows = 1, dark }) {
  const base = dark ? 'bg-white/10 text-white placeholder-white/50 border-white/20 focus:border-amber-300' : 'bg-white border-emerald-100 focus:border-emerald2';
  return (
    <div>
      <label className={`block text-[11px] uppercase tracking-wider font-bold mb-1.5 ${dark ? 'text-amber-300' : 'text-emerald-800'}`}>{label}</label>
      {textarea ? (
        <textarea value={value || ''} rows={rows} onChange={(e) => onChange(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-emerald2/10 resize-y ${base}`} />
      ) : (
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-emerald2/10 ${base}`} />
      )}
    </div>
  );
}
export default function Page() { return <ProtectedRoute roles={['super_admin', 'admin']}><Inner /></ProtectedRoute>; }
