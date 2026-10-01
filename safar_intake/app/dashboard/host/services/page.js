'use client';

/**
 * Host / Service Provider — "My Services" manager (Phase 4).
 * Lets an approved provider define WHAT services they offer and WHEN they're
 * available. Reuses the existing host role + providerApplications record via
 * /api/provider/services. No new dashboard, no new auth, no new category list.
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Loader2, Pencil, Trash2, X, Check, MapPin, Wallet, Power } from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { PROVIDER_CATEGORIES } from '@/lib/provider-categories';

const PRICING_UNITS = [
  { v: 'per_night', l: 'per night' },
  { v: 'per_day', l: 'per day' },
  { v: 'per_ride', l: 'per ride' },
  { v: 'per_vehicle', l: 'per vehicle' },
  { v: 'per_person', l: 'per person' },
  { v: 'per_group', l: 'per group' },
  { v: 'custom', l: 'custom' },
];

const unitLabel = (v) => PRICING_UNITS.find((u) => u.v === v)?.l || v;
const catLabel = (slug) => PROVIDER_CATEGORIES.find((c) => c.slug === slug)?.label || slug;
const catIcon = (slug) => PROVIDER_CATEGORIES.find((c) => c.slug === slug)?.icon || '•';

function emptyForm() {
  return { categorySlug: '', serviceName: '', description: '', serviceArea: '', basePrice: '', pricingUnit: 'per_day', active: true, available: true, availableFrom: '', availableUntil: '' };
}

function ServicesInner() {
  const [services, setServices] = useState(null);
  const [approved, setApproved] = useState(false);
  const [hasApp, setHasApp] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // service id or null
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/provider/services', { credentials: 'include' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed');
      setServices(json.services || []);
      setApproved(!!json.approved);
      setHasApp(!!json.hasApplication);
    } catch (e) { toast.error(e.message || 'Failed to load'); setServices([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({
      categorySlug: s.categorySlug || '', serviceName: s.serviceName || '', description: s.description || '',
      serviceArea: s.serviceArea || '', basePrice: s.basePrice ?? '', pricingUnit: s.pricingUnit || 'custom',
      active: s.active !== false, available: s.available !== false,
      availableFrom: s.availableFrom ? String(s.availableFrom).slice(0, 10) : '',
      availableUntil: s.availableUntil ? String(s.availableUntil).slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.categorySlug) { toast.error('Choose a service category'); return; }
    if (!form.serviceName.trim()) { toast.error('Add a service name'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/provider/services/${editing}` : '/api/provider/services';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, basePrice: form.basePrice === '' ? null : Number(form.basePrice) }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to save');
      toast.success(editing ? 'Service updated' : 'Service added');
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (s, field) => {
    setBusyId(s.id + field);
    try {
      const res = await fetch(`/api/provider/services/${s.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !(s[field] !== false) }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed');
      load();
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setBusyId(null); }
  };

  const remove = async (s) => {
    if (!confirm('Remove this service?')) return;
    setBusyId(s.id + 'del');
    try {
      const res = await fetch(`/api/provider/services/${s.id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed');
      toast.success('Service removed');
      load();
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setBusyId(null); }
  };

  const list = services || [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/20 via-white to-white">
      <Navbar />
      <div className="pt-24 container pb-16 max-w-4xl">
        <Link href="/dashboard/host" className="text-sm text-muted-foreground hover:text-charcoal inline-flex items-center gap-1"><ArrowLeft className="size-3.5" /> Host dashboard</Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">My Services</h1>
            <p className="text-sm text-muted-foreground mt-1">Define what you offer and when you are available. Safar matches your active services to traveler trips.</p>
          </div>
          <Button onClick={openAdd} className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold"><Plus className="size-4 mr-1.5" /> Add service</Button>
        </div>

        {!hasApp && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] text-amber-900">
            You have not applied as a Safar Service Provider yet. <Link href="/explore/become-provider" className="font-semibold underline">Apply here</Link> to start offering services.
          </div>
        )}
        {hasApp && !approved && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13.5px] text-slate-700">
            You can set up your services now. They become matchable to trips once your provider application is approved.
          </div>
        )}

        {services === null ? (
          <div className="mt-6 space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-secondary animate-pulse" />)}</div>
        ) : list.length === 0 ? (
          <div className="mt-8 p-10 rounded-3xl border bg-white/70 text-center">
            <div className="text-4xl">🧭</div>
            <div className="mt-3 font-display text-xl font-bold">No services yet</div>
            <div className="text-sm text-muted-foreground mt-1">Add your first service so Safar can match you to traveler trips.</div>
            <Button onClick={openAdd} className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep"><Plus className="size-4 mr-1.5" /> Add service</Button>
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {list.map((s) => (
              <div key={s.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${s.active === false ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 uppercase tracking-wider">{catIcon(s.categorySlug)} {catLabel(s.categorySlug)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(s)} className="size-8 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="size-4" /></button>
                    <button onClick={() => remove(s)} disabled={busyId === s.id + 'del'} className="size-8 grid place-items-center rounded-lg hover:bg-rose-50 text-rose-500">{busyId === s.id + 'del' ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button>
                  </div>
                </div>
                <div className="font-display font-bold mt-2 text-[16px]">{s.serviceName}</div>
                {s.description ? <p className="text-[12.5px] text-slate-500 mt-1 line-clamp-2">{s.description}</p> : null}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-slate-600">
                  {s.serviceArea ? <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {s.serviceArea}</span> : null}
                  {s.basePrice != null ? <span className="inline-flex items-center gap-1"><Wallet className="size-3" /> ₹{Number(s.basePrice).toLocaleString('en-IN')} · {unitLabel(s.pricingUnit)}</span> : <span className="inline-flex items-center gap-1 text-slate-400"><Wallet className="size-3" /> Price on request</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => toggle(s, 'active')} disabled={busyId === s.id + 'active'} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold border transition ${s.active !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {busyId === s.id + 'active' ? <Loader2 className="size-3 animate-spin" /> : <Power className="size-3" />} {s.active !== false ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => toggle(s, 'available')} disabled={busyId === s.id + 'available'} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold border transition ${s.available !== false ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {busyId === s.id + 'available' ? <Loader2 className="size-3 animate-spin" /> : (s.available !== false ? <Check className="size-3" /> : <X className="size-3" />)} {s.available !== false ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-sm p-0 sm:p-4" onClick={() => !saving && setModalOpen(false)}>
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-[17px]">{editing ? 'Edit service' : 'Add service'}</h3>
              <button onClick={() => setModalOpen(false)} className="size-9 grid place-items-center rounded-full hover:bg-slate-100"><X className="size-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Service category</label>
                <div className="flex flex-wrap gap-2">
                  {PROVIDER_CATEGORIES.map((c) => (
                    <button key={c.slug} type="button" onClick={() => setForm((f) => ({ ...f, categorySlug: c.slug }))} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${form.categorySlug === c.slug ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white text-slate-700'}`}>
                      <span>{c.icon}</span> {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Service name" v={form.serviceName} onChange={(x) => setForm((f) => ({ ...f, serviceName: x }))} placeholder="e.g. SUV + Driver" />
              <Field label="Description" area v={form.description} onChange={(x) => setForm((f) => ({ ...f, description: x }))} />
              <Field label="Service area / location" v={form.serviceArea} onChange={(x) => setForm((f) => ({ ...f, serviceArea: x }))} placeholder="e.g. Srinagar & Gulmarg" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starting price (₹)" type="number" v={form.basePrice} onChange={(x) => setForm((f) => ({ ...f, basePrice: x }))} placeholder="Optional" />
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">Pricing unit</label>
                  <select value={form.pricingUnit} onChange={(e) => setForm((f) => ({ ...f, pricingUnit: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px] outline-none focus:border-emerald-400">
                    {PRICING_UNITS.map((u) => <option key={u.v} value={u.v}>{u.l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Available from (optional)" type="date" v={form.availableFrom} onChange={(x) => setForm((f) => ({ ...f, availableFrom: x }))} />
                <Field label="Available until (optional)" type="date" v={form.availableUntil} onChange={(x) => setForm((f) => ({ ...f, availableUntil: x }))} />
              </div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Active</label>
                <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700"><input type="checkbox" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} /> Available</label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
              <Button className="flex-1 rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold" onClick={save} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : (editing ? 'Save changes' : 'Add service')}</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, v, onChange, type = 'text', area, placeholder }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">{label}</label>
      {area ? (
        <textarea value={v} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-emerald-400" />
      ) : (
        <input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px] outline-none focus:border-emerald-400" />
      )}
    </div>
  );
}

export default function App() {
  return <ProtectedRoute roles={['host', 'admin', 'super_admin']}><ServicesInner /></ProtectedRoute>;
}
