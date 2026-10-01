'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function Inner() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await fetch('/api/admin/explore/settings', { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setPromotions(j.settings.promotions || []);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/explore/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promotions }) });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      toast.success('Promotions saved');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const add = () => setPromotions((cur) => [...cur, { id: 'p' + Date.now(), title: '', body: '', cta: 'Learn more', href: '', image: '', enabled: true, position: cur.length }]);
  const update = (idx, patch) => setPromotions((cur) => cur.map((p, i) => i === idx ? { ...p, ...patch } : p));
  const remove = (idx) => setPromotions((cur) => cur.filter((_, i) => i !== idx));

  const uploadImage = async (idx, file) => {
    if (!file || file.size > 2_500_000) return;
    const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsDataURL(file); });
    const r = await fetch('/api/explore/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl }) });
    const j = await r.json();
    if (r.ok && j?.url) update(idx, { image: j.url });
  };

  if (loading) return <div className="container py-16 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div>;

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin/explore" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Explore Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Promotions</span>
        </div>
      </div>

      <div className="container py-6 md:py-10 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Promotions</h1>
            <p className="text-sm text-muted-foreground mt-1">Floating cards displayed on the Explore home (Travel Deals, Gear Exchange, seasonal offers…). Toggle enabled to show/hide instantly.</p>
          </div>
          <button onClick={add} className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-emerald2 text-white text-sm font-semibold"><Plus className="size-4" /> Add</button>
        </div>

        <div className="mt-6 space-y-4">
          {promotions.length === 0 && <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border">No promotions yet.</div>}
          {promotions.map((p, idx) => (
            <div key={p.id} className="bg-white rounded-2xl border p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-3">
                  <Field label="Title" value={p.title} onChange={(v) => update(idx, { title: v })} />
                  <Field label="Body" value={p.body} onChange={(v) => update(idx, { body: v })} textarea rows={2} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="CTA text" value={p.cta} onChange={(v) => update(idx, { cta: v })} />
                    <Field label="Link URL" value={p.href} onChange={(v) => update(idx, { href: v })} />
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!p.enabled} onChange={(e) => update(idx, { enabled: e.target.checked })} className="size-4 accent-emerald2" />
                    <span className="text-sm font-semibold text-charcoal">Enabled (visible on Explore)</span>
                  </label>
                </div>
                <div>
                  {p.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.image} alt={p.title} className="w-full aspect-[2/1] object-cover rounded-xl border" />
                  ) : <div className="w-full aspect-[2/1] rounded-xl bg-secondary/60 grid place-items-center text-xs text-muted-foreground">No image</div>}
                  <label className="mt-2 inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-emerald2 text-white text-xs font-semibold cursor-pointer">
                    <Upload className="size-3" /> Upload
                    <input type="file" accept="image/*" onChange={(e) => uploadImage(idx, e.target.files?.[0])} className="hidden" />
                  </label>
                  <button onClick={() => remove(idx)} className="mt-2 ml-2 inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100"><Trash2 className="size-3" /> Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white font-semibold shadow transition">
            {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : <><Save className="size-4" /> Save all promotions</>}
          </button>
        </div>
      </div>
    </div>
  );
}
function Field({ label, value, onChange, textarea, rows = 1 }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-bold text-emerald-800 mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value || ''} rows={rows} onChange={(e) => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-100 bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10 resize-y" />
      ) : (
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-emerald-100 bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10" />
      )}
    </div>
  );
}
export default function Page() { return <ProtectedRoute roles={['super_admin', 'admin']}><Inner /></ProtectedRoute>; }
