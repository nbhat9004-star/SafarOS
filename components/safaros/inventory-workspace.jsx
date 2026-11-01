'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TYPES = [
  { id: 'accommodations', label: 'Accommodation', singular: 'Accommodation', description: 'Hotels, resorts, guesthouses and rooms' },
  { id: 'activities', label: 'Activities', singular: 'Activity', description: 'Tours, experiences and attractions' },
  { id: 'transport', label: 'Transport', singular: 'Transport service', description: 'Vehicles, transfers and transport services' },
  { id: 'rate-plans', label: 'Seasonal rates', singular: 'Rate plan', description: 'Date-based supplier costs and selling guide prices' },
];

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to complete the request');
  return payload;
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }) {
  return <label className="block space-y-1.5"><span className="text-sm font-medium text-slate-700">{label}</span><input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>;
}

export default function InventoryWorkspace() {
  const [authStatus, setAuthStatus] = useState('checking');
  const [authError, setAuthError] = useState('');
  const [type, setType] = useState('accommodations');
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', supplierId: '', destination: '', description: '', currency: 'INR', unit: 'per_night', netCost: '', sellingGuidePrice: '', validFrom: '', validTo: '' });

  const selected = TYPES.find(x => x.id === type) || TYPES[0];

  // A Preview deployment has its own host-only session cookie. Verify the agency
  // session on this exact origin before requesting tenant-scoped inventory.
  useEffect(() => {
    let active = true;
    request('/auth/me')
      .then(() => { if (active) setAuthStatus('authenticated'); })
      .catch((e) => {
        if (!active) return;
        if (e.message === 'unauthenticated') setAuthStatus('unauthenticated');
        else { setAuthError(e.message); setAuthStatus('error'); }
      });
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    if (authStatus !== 'authenticated') return;
    setLoading(true); setError('');
    try {
      const [list, counts] = await Promise.all([
        request(`/inventory/${type}?limit=100`),
        request('/inventory/summary'),
      ]);
      setItems(list.items || list.ratePlans || list.records || []);
      setSummary(counts.summary || counts.counts || counts);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [type, authStatus]);

  useEffect(() => { if (authStatus === 'authenticated') load(); }, [load, authStatus]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => [item.name, item.destination, item.supplierName, item.serviceId, item.supplierId, item.description].some(v => String(v || '').toLowerCase().includes(q)));
  }, [items, query]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const payload = type === 'rate-plans'
        ? { serviceType: form.serviceType || 'accommodation', serviceId: form.serviceId || '', supplierId: form.supplierId, currency: form.currency, unit: form.unit, netCost: Number(form.netCost), sellingGuidePrice: Number(form.sellingGuidePrice), validFrom: form.validFrom, validTo: form.validTo, status: 'active' }
        : { name: form.name, supplierId: form.supplierId, destination: form.destination, description: form.description, status: 'active' };
      await request(`/inventory/${type}`, { method: 'POST', body: JSON.stringify(payload) });
      setShowForm(false); setForm({ name: '', supplierId: '', destination: '', description: '', currency: 'INR', unit: 'per_night', netCost: '', sellingGuidePrice: '', validFrom: '', validTo: '' });
      setNotice(`${selected.singular} added successfully.`); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const archive = async (item) => {
    if (!item.id) return;
    if (!window.confirm(`Archive this ${selected.singular.toLowerCase()}? It will no longer appear as active inventory.`)) return;
    try { await request(`/inventory/${type}/${item.id}`, { method: 'PUT', body: JSON.stringify({ status: 'archived' }) }); setNotice('Inventory item archived.'); await load(); }
    catch (e) { setError(e.message); }
  };

  const countFor = (key) => {
    if (!summary) return '—';
    const summaryKey = key === 'rate-plans' ? 'ratePlans' : key;
    return summary[summaryKey] ?? summary.counts?.[summaryKey] ?? '—';
  };

  if (authStatus === 'checking') return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" /><p className="font-semibold text-slate-800">Checking your SafarOS session…</p><p className="mt-1 text-sm text-slate-500">Securely connecting to your agency workspace.</p></div></main>;

  if (authStatus === 'unauthenticated') return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl text-violet-700">✦</div><h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Sign in to SafarOS</h1><p className="mt-2 text-sm leading-6 text-slate-600">Travel Inventory is private to your agency. Sign in on this Preview address to create a secure session, then reopen this page.</p><a href="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">Continue to sign in</a><p className="mt-4 text-xs text-slate-400">Preview and production use separate browser sessions.</p></section></main>;

  if (authStatus === 'error') return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5"><section className="max-w-md rounded-2xl border border-rose-200 bg-white p-6"><h1 className="font-semibold text-slate-900">Unable to verify your session</h1><p className="mt-2 text-sm text-rose-700">{authError || 'Please refresh and try again.'}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Retry</button></section></main>;

  return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="text-xs font-semibold uppercase tracking-[.18em] text-violet-600">SafarOS · Operations</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Travel inventory</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Build your agency’s reusable catalogue of stays, experiences and transport, then manage supplier rates by travel date.</p></div>
        <button onClick={() => { setError(''); setShowForm(true); }} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">＋ Add {selected.singular}</button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((t, i) => <button key={t.id} onClick={() => { setType(t.id); setQuery(''); setShowForm(false); setNotice(''); }} className={`rounded-2xl border p-4 text-left transition ${type === t.id ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-200'}`}>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">{t.label}</span><span className="text-xs text-slate-400">{['01','02','03','04'][i]}</span></div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{countFor(t.id)}</div><p className="mt-1 text-xs text-slate-500">{t.description}</p>
        </button>)}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div><h2 className="font-semibold text-slate-900">{selected.label}</h2><p className="text-xs text-slate-500">Agency-private inventory · {visible.length} shown</p></div>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search inventory…" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:max-w-xs" />
        </div>
        {loading ? <div className="space-y-3 p-5"><div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" /><div className="h-16 animate-pulse rounded-xl bg-slate-100" /><div className="h-16 animate-pulse rounded-xl bg-slate-100" /></div>
          : visible.length === 0 ? <div className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl text-violet-600">✦</div><h3 className="mt-4 font-semibold text-slate-900">No {selected.label.toLowerCase()} yet</h3><p className="mt-1 text-sm text-slate-500">Add your first item to start building your agency inventory.</p><button onClick={() => setShowForm(true)} className="mt-4 rounded-xl border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50">Add {selected.singular}</button></div>
          : <div className="divide-y divide-slate-100">{visible.map((item, index) => <div key={item.id || item._id || index} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="min-w-0"><div className="font-medium text-slate-900">{item.name || item.serviceName || item.serviceId || 'Rate plan'}</div><div className="mt-1 text-xs text-slate-500">{[item.destination, item.supplierName || item.supplierId, item.unit, item.validFrom && item.validTo ? `${item.validFrom} – ${item.validTo}` : ''].filter(Boolean).join(' · ') || item.description || 'No additional details'}</div></div>
            <div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{item.status || 'active'}</span><button onClick={() => archive(item)} disabled={item.status === 'archived'} className="text-xs font-medium text-slate-500 hover:text-rose-600 disabled:opacity-40">Archive</button></div>
          </div>)}</div>}
      </section>

      <p className="text-xs leading-relaxed text-slate-400">Rate selection is not live availability confirmation. Inventory and rate records are private to this agency. Supplier feeds, channel managers and real-time availability are not part of this first release.</p>
    </div>

    {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
      <form onSubmit={save} className="max-h-[92vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-900">Add {selected.singular}</h2><p className="mt-1 text-xs text-slate-500">Enter the details below. Supplier ID must belong to your agency.</p></div><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100">✕</button></div>
        {type === 'rate-plans' ? <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5"><span className="text-sm font-medium text-slate-700">Service type</span><select value={form.serviceType || 'accommodation'} onChange={e => setForm({ ...form, serviceType: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="accommodation">Accommodation</option><option value="activity">Activity</option><option value="transport">Transport</option></select></label>
          <Field label="Service ID" value={form.serviceId} onChange={v => setForm({ ...form, serviceId: v })} required />
          <Field label="Supplier ID" value={form.supplierId} onChange={v => setForm({ ...form, supplierId: v })} required />
          <label className="block space-y-1.5"><span className="text-sm font-medium text-slate-700">Unit</span><select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="per_night">Per night</option><option value="per_person">Per person</option><option value="per_vehicle">Per vehicle</option><option value="per_booking">Per booking</option></select></label>
          <Field label="Net cost" type="number" value={form.netCost} onChange={v => setForm({ ...form, netCost: v })} required />
          <Field label="Selling guide price" type="number" value={form.sellingGuidePrice} onChange={v => setForm({ ...form, sellingGuidePrice: v })} required />
          <Field label="Valid from" type="date" value={form.validFrom} onChange={v => setForm({ ...form, validFrom: v })} required />
          <Field label="Valid to" type="date" value={form.validTo} onChange={v => setForm({ ...form, validTo: v })} required />
        </div> : <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. Pine View Resort" required /></div>
          <Field label="Supplier ID" value={form.supplierId} onChange={v => setForm({ ...form, supplierId: v })} required />
          <Field label="Destination" value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="e.g. Srinagar" />
          <div className="sm:col-span-2"><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-700">Description</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Add useful details for your team…" /></label></div>
        </div>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium">Cancel</button><button disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save inventory'}</button></div>
      </form>
    </div>}
  </main>;
}
