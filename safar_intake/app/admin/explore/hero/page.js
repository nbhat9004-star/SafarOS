'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Upload, Image as ImageIcon, Eye } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function Inner() {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await fetch('/api/admin/explore/settings', { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setS(j.settings);
    } catch { toast.error('Load failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/explore/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hero: s.hero }) });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      toast.success('Hero updated');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    if (file.size > 3_500_000) return toast.error('Image too large (max 3.5MB)');
    const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsDataURL(file); });
    const r = await fetch('/api/explore/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl }) });
    const j = await r.json();
    if (r.ok && j?.url) setS((cur) => ({ ...cur, hero: { ...cur.hero, image: j.url } }));
    else toast.error(j?.error || 'Upload failed');
  };

  if (loading || !s) return <div className="container py-16 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div>;

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin/explore" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Explore Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Hero Management</span>
        </div>
      </div>

      <div className="container py-6 md:py-10 max-w-3xl">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Hero Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Everything below drives the top 60% of the Explore home page.</p>

        <div className="mt-6 bg-white rounded-2xl border p-5 md:p-6 space-y-4">
          {/* Preview */}
          <div className="relative aspect-[16/7] rounded-2xl overflow-hidden shadow border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.hero.image} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
            {s.hero.overlayEnabled !== false && <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/45 via-emerald-950/25 to-emerald-950/70" />}
            <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow">
              <div className="font-display text-xl md:text-3xl font-bold">{s.hero.title || '—'}</div>
              <div className="text-sm md:text-base opacity-95 max-w-xl">{s.hero.subtitle || '—'}</div>
            </div>
          </div>

          <Field label="Hero Image URL" value={s.hero.image} onChange={(v) => setS({ ...s, hero: { ...s.hero, image: v } })} />
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold cursor-pointer transition">
              <Upload className="size-4" /> Upload image
              <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0])} className="hidden" />
            </label>
            <Link href="/explore/home" target="_blank" className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-white border text-sm font-semibold hover:bg-emerald2/5 transition"><Eye className="size-4" /> Preview live</Link>
          </div>

          <Field label="Heading" value={s.hero.title} onChange={(v) => setS({ ...s, hero: { ...s.hero, title: v } })} />
          <Field label="Subtitle" value={s.hero.subtitle} onChange={(v) => setS({ ...s, hero: { ...s.hero, subtitle: v } })} textarea rows={2} />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={s.hero.overlayEnabled !== false} onChange={(e) => setS({ ...s, hero: { ...s.hero, overlayEnabled: e.target.checked } })} className="size-4 accent-emerald2" />
            <span className="text-sm font-semibold text-charcoal">Enable dark overlay for legible text</span>
          </label>

          <div className="pt-4 border-t flex items-center justify-end">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white font-semibold shadow transition">
              {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : <><Save className="size-4" /> Save changes</>}
            </button>
          </div>
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
