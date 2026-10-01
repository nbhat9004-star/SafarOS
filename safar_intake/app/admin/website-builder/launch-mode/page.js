'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Rocket, ExternalLink, Save, Loader2, Users, Eye, PowerOff, Power, Info } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';

const SECTIONS = [
  { key: 'brand', title: 'Brand & Logo' },
  { key: 'hero', title: 'Hero Section' },
  { key: 'ctas', title: 'Buttons & Links' },
  { key: 'contact', title: 'Contact Details' },
  { key: 'sections', title: 'Section Visibility' },
];

export default function LaunchModePage() {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Prime the settings doc via public endpoint (auto-seeds default).
        await fetch('/api/launch-mode/public', { cache: 'no-store' });
        const r = await fetch('/api/admin/launch-mode', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setS(j.settings);
        else toast.error(j?.error || 'Failed to load settings');
      } catch (e) { toast.error('Network error'); }
      finally { setLoading(false); }
    })();
  }, []);

  const update = (patch) => setS((cur) => ({ ...cur, ...patch }));

  const persist = async (patch, silent = false) => {
    const next = { ...s, ...patch };
    setS(next);
    setSaving(true);
    try {
      const r = await fetch('/api/admin/launch-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      if (!silent) toast.success('Saved');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const saveAll = () => persist(s);

  if (loading) {
    return (
      <WebsiteBuilderShell title="Launch Mode">
        <div className="grid place-items-center py-24 text-emerald2"><Loader2 className="size-8 animate-spin" /></div>
      </WebsiteBuilderShell>
    );
  }
  if (!s) return <WebsiteBuilderShell title="Launch Mode"><div>Failed to load</div></WebsiteBuilderShell>;

  return (
    <WebsiteBuilderShell
      title="Launch Mode"
      subtitle="Enable a beautiful pre-launch landing page. Everything below updates instantly — no code changes, no redeployment."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/launch" target="_blank" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border text-sm font-semibold text-emerald2 hover:bg-emerald2/5 transition"><Eye className="size-4" /> Preview</Link>
          <Link href="/admin/founding-partners" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold transition"><Users className="size-4" /> Applications</Link>
        </div>
      }
    >
      {/* MASTER TOGGLE */}
      <div className={`relative overflow-hidden rounded-3xl border-2 p-6 md:p-7 mb-6 transition ${s.enabled ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 border-amber-400 text-white' : 'bg-white border-emerald-100'}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className={`size-12 rounded-2xl grid place-items-center ${s.enabled ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-50 text-emerald2'}`}>
              <Rocket className="size-6" />
            </div>
            <div>
              <div className={`text-[11px] uppercase tracking-[0.22em] font-bold ${s.enabled ? 'text-amber-300' : 'text-emerald-800'}`}>{s.enabled ? 'Active · Public site is hidden' : 'Disabled · Website is live'}</div>
              <h2 className={`font-display text-2xl md:text-3xl font-bold mt-1 ${s.enabled ? 'text-white' : 'text-charcoal'}`}>Premium Launch Mode</h2>
              <p className={`mt-2 text-sm max-w-xl leading-relaxed ${s.enabled ? 'text-white/85' : 'text-muted-foreground'}`}>
                When enabled, every public route shows the premium landing page. Admin, dashboard and authentication remain fully accessible. Changes propagate within 30 seconds.
              </p>
            </div>
          </div>
          <button
            onClick={() => persist({ enabled: !s.enabled })}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-6 h-12 rounded-full text-sm font-bold transition ${s.enabled ? 'bg-white text-emerald-950 hover:bg-white/90' : 'bg-emerald2 text-white hover:bg-emerald2-deep'}`}
          >
            {s.enabled ? <><PowerOff className="size-4" /> Disable Launch Mode</> : <><Power className="size-4" /> Enable Launch Mode</>}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3 text-sm text-blue-900">
        <Info className="size-4 mt-0.5 shrink-0" />
        <span>Settings save individually as you edit — or use the button at the bottom to save all changes at once.</span>
      </div>

      {/* SETTINGS CARDS */}
      <div className="grid grid-cols-1 gap-5">
        {/* Brand */}
        <Card title="Brand & Logo">
          <Grid>
            <Field label="Logo Text" value={s.logoText} onChange={(v) => update({ logoText: v })} />
            <Field label="Logo Image URL (optional)" value={s.logoUrl} onChange={(v) => update({ logoUrl: v })} placeholder="https://…" />
          </Grid>
        </Card>

        {/* Hero */}
        <Card title="Hero Section">
          <Grid>
            <Field label="Hero Background Image URL" value={s.heroBackground} onChange={(v) => update({ heroBackground: v })} placeholder="https://…" full />
            <Field label="Hero Title" value={s.heroTitle} onChange={(v) => update({ heroTitle: v })} full textarea rows={2} />
            <Field label="Hero Subtitle" value={s.heroSubtitle} onChange={(v) => update({ heroSubtitle: v })} full textarea rows={3} />
          </Grid>
        </Card>

        {/* CTAs */}
        <Card title="Buttons & Links">
          <Grid>
            <Field label="Primary Button Text" value={s.primaryButtonText} onChange={(v) => update({ primaryButtonText: v })} />
            <Field label="Secondary Button Text" value={s.secondaryButtonText} onChange={(v) => update({ secondaryButtonText: v })} />
            <Field label="Instagram URL" value={s.instagramUrl} onChange={(v) => update({ instagramUrl: v })} full />
          </Grid>
        </Card>

        {/* Contact */}
        <Card title="Contact Details">
          <Grid>
            <Field label="Support Email" value={s.supportEmail} onChange={(v) => update({ supportEmail: v })} />
            <Field label="Partnership Email" value={s.partnershipEmail} onChange={(v) => update({ partnershipEmail: v })} />
            <Field label="WhatsApp Number" value={s.whatsappNumber} onChange={(v) => update({ whatsappNumber: v })} placeholder="e.g. +91 9876543210" />
            <Field label="Phone Number" value={s.phoneNumber} onChange={(v) => update({ phoneNumber: v })} placeholder="e.g. +91 9876543210" />
          </Grid>
        </Card>

        {/* Toggles */}
        <Card title="Section Visibility">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Toggle label="Host Registration" description="Show the 'Become a Founding Partner' button and modal" value={s.enableHostRegistration} onChange={(v) => update({ enableHostRegistration: v })} />
            <Toggle label="Instagram Section" description="Show the Follow Our Journey section" value={s.enableInstagramSection} onChange={(v) => update({ enableInstagramSection: v })} />
            <Toggle label="Contact Section" description="Show support / partnership / WhatsApp tiles" value={s.enableContactSection} onChange={(v) => update({ enableContactSection: v })} />
          </div>
        </Card>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        <Link href="/launch" target="_blank" className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white border text-sm font-semibold text-emerald2 hover:bg-emerald2/5 transition"><ExternalLink className="size-4" /> Preview Landing Page</Link>
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white text-sm font-semibold shadow-md transition">
          {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : <><Save className="size-4" /> Save all changes</>}
        </button>
      </div>
    </WebsiteBuilderShell>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border p-5 md:p-6 shadow-sm">
      <div className="font-display font-bold text-charcoal text-lg mb-4">{title}</div>
      {children}
    </div>
  );
}
function Grid({ children }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>; }
function Field({ label, value, onChange, placeholder, full, textarea, rows = 2, type = 'text' }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs uppercase tracking-wider font-bold text-emerald-800 mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-100 bg-white text-charcoal text-sm focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10 outline-none resize-y" />
      ) : (
        <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-11 px-3.5 rounded-xl border border-emerald-100 bg-white text-charcoal text-sm focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10 outline-none" />
      )}
    </div>
  );
}
function Toggle({ label, description, value, onChange }) {
  const on = value !== false; // default on
  return (
    <button onClick={() => onChange(!on)} className={`text-left p-4 rounded-2xl border transition ${on ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-emerald-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-charcoal text-sm">{label}</div>
          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</div>
        </div>
        <div className={`shrink-0 w-11 h-6 rounded-full relative transition ${on ? 'bg-emerald2' : 'bg-slate-200'}`}>
          <div className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${on ? 'left-5' : 'left-0.5'}`} />
        </div>
      </div>
    </button>
  );
}
