'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, BedDouble, Car, Compass, Database, Plus, Search, Sparkles, Store, Truck, Upload, Users, CalendarClock, RefreshCw, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

async function api(path) {
  const response = await fetch('/api' + path, { credentials: 'same-origin' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to load supply data');
  return payload;
}

const sections = [
  { id: 'discover', title: 'Discover suppliers', description: 'Find hotels, houseboats, transport providers, guides and experiences online.', icon: Compass, tone: 'from-sky-500 to-blue-600', action: 'Discover' },
  { id: 'suppliers', title: 'My Suppliers', description: 'Manage agency contacts, supplier details, private notes and negotiated terms.', icon: Store, tone: 'from-violet-500 to-indigo-600', action: 'Manage suppliers' },
  { id: 'inventory', title: 'Accommodation & Experiences', description: 'Maintain hotels, stays, sightseeing, activities and transport services.', icon: BedDouble, tone: 'from-emerald-500 to-teal-600', action: 'Manage inventory' },
  { id: 'inventory', title: 'Transport & Rate Manager', description: 'Manage transport services, seasonal rates, supplier costs and selling prices.', icon: Car, tone: 'from-amber-500 to-orange-600', action: 'Manage rates' },
  { id: 'fleet', title: 'Agency Fleet', description: 'Manage owned vehicles, drivers, assignments and document expiry.', icon: Truck, tone: 'from-rose-500 to-pink-600', action: 'Open fleet' },
  { id: 'data_import', title: 'Import supply data', description: 'Bring supplier and inventory spreadsheets into your agency catalogue.', icon: Upload, tone: 'from-indigo-500 to-violet-600', action: 'Import data' },
];

function Stat({ label, value, detail, icon: Icon, onClick }) {
  return <button type="button" onClick={onClick} className="text-left">
    <Card className="h-full transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm"><CardContent className="flex items-start justify-between gap-3 p-4">
      <div><div className="text-xs font-medium text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold tracking-tight">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></div>
      <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><Icon className="h-5 w-5" /></div>
    </CardContent></Card>
  </button>;
}

export default function SupplyHubWorkspace({ onNavigate = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryCounts, setInventoryCounts] = useState({});
  const [fleetStats, setFleetStats] = useState(null);
  const [fleetAlerts, setFleetAlerts] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [errors, setErrors] = useState([]);
  const [supplierQuery, setSupplierQuery] = useState('');

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    const jobs = await Promise.allSettled([
      api('/suppliers'),
      api('/inventory/summary'),
      api('/inventory/rate-plans?limit=200'),
      api('/fleet/stats'),
      api('/fleet/alerts'),
    ]);
    const nextErrors = [];
    const read = (index, label) => {
      const result = jobs[index];
      if (result.status === 'fulfilled') return result.value;
      nextErrors.push(label + ': ' + result.reason.message);
      return null;
    };
    const supplierData = read(0, 'Suppliers');
    const inventoryData = read(1, 'Inventory');
    const rateData = read(2, 'Rate plans');
    const fleetData = read(3, 'Fleet');
    const alertData = read(4, 'Fleet alerts');
    if (supplierData) setSuppliers(supplierData.suppliers || []);
    if (inventoryData) setInventoryCounts(inventoryData.counts || inventoryData.summary || {});
    if (rateData) setRatePlans(rateData.ratePlans || []);
    if (fleetData) setFleetStats(fleetData.stats || null);
    if (alertData) setFleetAlerts(alertData.alerts || []);
    setErrors(nextErrors);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const activeSuppliers = suppliers.filter(s => s.status !== 'inactive');
  const activeRates = ratePlans.filter(r => r.status !== 'archived');
  const filteredSuppliers = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase();
    const rows = q ? suppliers.filter(s => [s.name, s.type, s.city, s.state, s.phone, s.email].some(v => String(v || '').toLowerCase().includes(q))) : suppliers;
    return rows.slice(0, 6);
  }, [suppliers, supplierQuery]);
  const expiringRates = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return activeRates.filter(r => r.validTo && r.validTo < today).length;
  }, [activeRates]);

  const count = (key) => inventoryCounts[key] ?? 0;

  return <div className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white sm:p-8">
      <div className="relative z-10 max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100"><Database className="h-3.5 w-3.5" /> Your agency supply control centre</div>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Supply Hub</h2><p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/80">Discover suppliers, manage your private supplier relationships, maintain inventory and rates, and keep your agency fleet organised from one workspace.</p></div>
          <Button onClick={() => load(true)} disabled={refreshing} variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">{refreshing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh data</Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => onNavigate('discover')} className="bg-white text-slate-900 hover:bg-indigo-50"><Search className="mr-2 h-4 w-4" /> Discover suppliers</Button>
          <Button onClick={() => onNavigate('inventory')} variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15"><Plus className="mr-2 h-4 w-4" /> Add inventory</Button>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-130px] right-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
    </div>

    <div className="flex items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Supply overview</h3><p className="text-sm text-muted-foreground">Live totals from your agency's saved records.</p></div><span className="hidden text-xs text-muted-foreground sm:block">Private to your agency</span></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Active suppliers" value={loading ? '—' : activeSuppliers.length} detail={suppliers.length + ' saved supplier records'} icon={Store} onClick={() => onNavigate('suppliers')} />
      <Stat label="Accommodation" value={loading ? '—' : count('accommodations')} detail="Hotels, stays and houseboats" icon={BedDouble} onClick={() => onNavigate('inventory')} />
      <Stat label="Activities" value={loading ? '—' : count('activities')} detail="Tours and experiences" icon={Compass} onClick={() => onNavigate('inventory')} />
      <Stat label="Transport services" value={loading ? '—' : count('transport')} detail="Transfers and transport catalogue" icon={Car} onClick={() => onNavigate('inventory')} />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Stat label="Active rate plans" value={loading ? '—' : activeRates.length} detail={expiringRates + ' expired by end date'} icon={CalendarClock} onClick={() => onNavigate('inventory')} />
      <Stat label="Agency vehicles" value={loading ? '—' : (fleetStats ? fleetStats.vehicles.total : '—')} detail={fleetStats ? fleetStats.vehicles.available + ' currently available' : 'Fleet data'} icon={Truck} onClick={() => onNavigate('fleet')} />
      <Stat label="Drivers" value={loading ? '—' : (fleetStats ? fleetStats.drivers.total : '—')} detail={fleetStats ? fleetStats.drivers.available + ' currently available' : 'Fleet data'} icon={Users} onClick={() => onNavigate('fleet')} />
    </div>

    {errors.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />Some supply data could not be loaded</div><ul className="mt-1 list-disc pl-5 text-xs">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul><p className="mt-1 text-xs">This can happen when your role does not have access to a particular area. Other sections remain available.</p></div>}

    <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
      <Card><CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Recently saved suppliers</h3><p className="text-xs text-muted-foreground">Your agency's private supplier directory</p></div><Button variant="outline" size="sm" onClick={() => onNavigate('suppliers')}>View all <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></div>
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} placeholder="Search supplier name, category or city…" className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:border-violet-400" /></div>
        {loading ? <div className="space-y-3"><div className="h-12 animate-pulse rounded-xl bg-muted" /><div className="h-12 animate-pulse rounded-xl bg-muted" /></div>
          : filteredSuppliers.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-center"><Store className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No suppliers found</p><p className="mt-1 text-xs text-muted-foreground">Discover a provider or add your first supplier.</p><Button className="mt-3" size="sm" onClick={() => onNavigate('discover')}>Discover suppliers</Button></div>
          : <div className="divide-y">{filteredSuppliers.map(s => <div key={s.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="truncate text-sm font-semibold">{s.name}</div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"><span className="capitalize">{s.type || 'Supplier'}</span>{s.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.city}</span>}{s.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}</div></div><Badge variant="outline" className={s.status === 'inactive' ? '' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}>{s.status || 'active'}</Badge></div>)}</div>}
      </CardContent></Card>
      <Card><CardContent className="space-y-4 p-5">
        <div><h3 className="font-semibold">Fleet & rate alerts</h3><p className="text-xs text-muted-foreground">Items that may need attention</p></div>
        {fleetAlerts.length ? <div className="space-y-2">{fleetAlerts.slice(0, 5).map((a, i) => <div key={i} className="flex items-start justify-between gap-3 rounded-xl border p-3"><div><div className="text-sm font-medium">{a.name}</div><div className="text-xs text-muted-foreground">{a.document} · expires {a.expiry}</div></div><Badge variant="outline" className={a.severity === 'expired' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{a.severity}</Badge></div>)}</div>
          : <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground"><ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />No fleet document expiry alerts were returned.</div>}
        <div className="rounded-xl border p-3"><div className="flex items-center justify-between gap-2"><div><div className="text-sm font-semibold">Rate plan review</div><p className="mt-1 text-xs text-muted-foreground">{expiringRates} rate plan(s) have an end date in the past.</p></div><CalendarClock className="h-5 w-5 text-amber-600" /></div><Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => onNavigate('inventory')}>Review seasonal rates</Button></div>
      </CardContent></Card>
    </div>

    <div className="flex items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Manage your supply</h3><p className="text-sm text-muted-foreground">Open the existing agency modules from one place. Your saved records and role permissions stay in effect.</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map((item, index) => { const Icon = item.icon; return <button key={item.title} type="button" onClick={() => onNavigate(item.id)} className="text-left">
        <Card className="h-full transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"><CardContent className="flex h-full flex-col gap-3 p-5">
          <div className={'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ' + item.tone + ' text-white shadow-sm'}><Icon className="h-5 w-5" /></div>
          <div><div className="font-semibold">{item.title}</div><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p></div>
          <div className="mt-auto flex items-center gap-1 pt-2 text-xs font-semibold text-violet-600">{item.action} <ArrowRight className="h-3.5 w-3.5" /></div>
        </CardContent></Card>
      </button>; })}
    </div>
    <Card className="border-violet-200 bg-violet-50/50"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-violet-100 p-2 text-violet-700"><Sparkles className="h-5 w-5" /></div><div><div className="font-semibold">Need to save a sale?</div><p className="mt-1 text-sm text-muted-foreground">Build a priced alternative from your agency's saved supply and create a separate draft quotation.</p></div></div>
      <Button onClick={() => onNavigate('sales-rescue')} className="shrink-0">Open Sales Rescue <ArrowRight className="ml-2 h-4 w-4" /></Button>
    </CardContent></Card>
  </div>;
}
