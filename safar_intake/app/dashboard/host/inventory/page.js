'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Calendar, DollarSign, Ban, Users, Sparkles, Plus, Trash2, Save, ChevronLeft, ChevronRight, Package, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_COLOR = {
  available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  limited: 'bg-amber-100 text-amber-800 border-amber-200',
  soldout: 'bg-rose-100 text-rose-700 border-rose-200',
  blocked: 'bg-slate-200 text-slate-700 border-slate-300',
  maintenance: 'bg-slate-900 text-white border-slate-900',
};

const RULE_PRESETS = [
  { name: 'Weekend +10%', type: 'weekend', adjustment: { mode: 'percent', value: 10 }, conditions: { weekendOnly: true }, priority: 10 },
  { name: 'Holiday +25%', type: 'holiday', adjustment: { mode: 'percent', value: 25 }, conditions: {}, priority: 5 },
  { name: 'Winter +15%', type: 'season', adjustment: { mode: 'percent', value: 15 }, conditions: { dateFrom: '', dateTo: '' }, priority: 20 },
  { name: 'Summer -5%', type: 'season', adjustment: { mode: 'percent', value: -5 }, conditions: {}, priority: 30 },
  { name: 'Last Minute -20%', type: 'last_minute', adjustment: { mode: 'percent', value: -20 }, conditions: { maxAdvanceDays: 3 }, priority: 15 },
  { name: 'Advance Booking -10%', type: 'advance', adjustment: { mode: 'percent', value: -10 }, conditions: { minAdvanceDays: 30 }, priority: 25 },
  { name: 'Long Stay -15%', type: 'long_stay', adjustment: { mode: 'percent', value: -15 }, conditions: { minNights: 7 }, priority: 40 },
];

function InventoryInner() {
  const [listings, setListings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('calendar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/host/listings', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) { setListings(d.listings || []); if (d.listings?.[0]) setSelected(d.listings[0]); }
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/dashboard/host" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Host Studio
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-2"><Package className="size-7 text-emerald2" /> Inventory & Pricing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage availability, dynamic pricing rules and special offers for each of your listings.</p>

        {loading ? (
          <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : listings.length === 0 ? (
          <div className="mt-8 p-12 border rounded-2xl bg-white text-center">
            <Package className="size-8 mx-auto text-emerald2" />
            <div className="font-display text-lg font-bold mt-3">No listings yet</div>
            <p className="text-sm text-muted-foreground mt-1">Create a listing first to manage inventory.</p>
          </div>
        ) : (
          <div className="mt-6 grid md:grid-cols-[300px_1fr] gap-4">
            {/* Left rail: listings */}
            <aside className="rounded-2xl border bg-white p-2 max-h-[70vh] overflow-y-auto">
              {listings.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition ${selected?.id === l.id ? 'bg-emerald-50 border border-emerald2/30' : 'hover:bg-secondary'}`}
                >
                  {l.images?.[0] ? <img src={l.images[0]} alt="" className="size-10 rounded-lg object-cover" /> : <div className="size-10 rounded-lg bg-secondary" />}
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{l.title}</div>
                    <div className="text-[10px] text-muted-foreground">{l.category} · {inr(l.price)}</div>
                  </div>
                </button>
              ))}
            </aside>

            {/* Right: tabs */}
            {selected && (
              <section>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 md:mx-0 md:px-0">
                  {[
                    { id: 'calendar', label: 'Calendar', Ico: Calendar },
                    { id: 'inventory', label: 'Inventory', Ico: Package },
                    { id: 'pricing', label: 'Pricing Rules', Ico: DollarSign },
                    { id: 'blackouts', label: 'Blackout Dates', Ico: Ban },
                    { id: 'waitlist', label: 'Waitlist', Ico: Users },
                    { id: 'ai', label: 'AI Suggestions', Ico: Sparkles },
                  ].map((t) => {
                    const Ico = t.Ico;
                    const active = tab === t.id;
                    return (
                      <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition inline-flex items-center gap-1 ${active ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}>
                        <Ico className="size-3.5" /> {t.label}
                      </button>
                    );
                  })}
                </div>

                {tab === 'calendar' && <CalendarTab listing={selected} />}
                {tab === 'inventory' && <InventoryTab listing={selected} onChange={(l) => { setSelected(l); setListings((xs) => xs.map((x) => x.id === l.id ? l : x)); }} />}
                {tab === 'pricing' && <PricingTab listing={selected} />}
                {tab === 'blackouts' && <BlackoutsTab listing={selected} />}
                {tab === 'waitlist' && <WaitlistTab listing={selected} />}
                {tab === 'ai' && <AISuggestionsTab listing={selected} />}
              </section>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function CalendarTab({ listing }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/listings/${listing.id}/calendar?month=${month}`, { credentials: 'include' });
        const d = await r.json();
        if (d.ok) setData(d);
      } finally { setLoading(false); }
    })();
  }, [listing.id, month]);
  const shiftMonth = (dir) => {
    const [y, m] = month.split('-').map(Number);
    const nd = new Date(y, m - 1 + dir, 1);
    setMonth(`${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`);
  };
  const firstDayOfWeek = data?.days?.[0] ? new Date(data.days[0].date).getDay() : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display text-lg font-bold">{month}</div>
          <div className="flex gap-1">
            <Button onClick={() => shiftMonth(-1)} size="icon" variant="outline" className="rounded-full h-8 w-8"><ChevronLeft className="size-4" /></Button>
            <Button onClick={() => shiftMonth(1)} size="icon" variant="outline" className="rounded-full h-8 w-8"><ChevronRight className="size-4" /></Button>
          </div>
        </div>
        {loading || !data ? (
          <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="text-[10px] uppercase text-muted-foreground font-bold text-center py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {[...Array(firstDayOfWeek)].map((_, i) => <div key={'pad' + i} />)}
              {data.days.map((d) => (
                <div key={d.date} className={`aspect-square rounded-lg border p-1 md:p-2 flex flex-col ${STATUS_COLOR[d.status] || 'bg-white'}`} title={`${d.status} · ${inr(d.price)}`}>
                  <div className="text-[10px] md:text-xs font-bold">{Number(d.date.slice(-2))}</div>
                  <div className="text-[9px] md:text-[10px] mt-auto tabular-nums">{inr(d.price)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
              {Object.entries(STATUS_COLOR).map(([k, v]) => (
                <span key={k} className={`px-2 py-0.5 rounded-full border capitalize ${v}`}>{k}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InventoryTab({ listing, onChange }) {
  const [saving, setSaving] = useState(null);
  const types = listing.inventoryTypes || [];

  const bulk = async ({ typeId, delta, absolute }) => {
    setSaving(typeId || 'total');
    try {
      const r = await fetch(`/api/host/listings/${listing.id}/inventory-bulk`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ typeId, delta, absolute }),
      });
      const d = await r.json();
      if (d.ok) {
        toast.success('Inventory updated');
        // refresh listing
        const r2 = await fetch('/api/host/listings', { credentials: 'include' });
        const d2 = await r2.json();
        const fresh = d2.listings?.find((x) => x.id === listing.id);
        if (fresh) onChange?.(fresh);
      } else toast.error(d.error || 'Failed');
    } finally { setSaving(null); }
  };

  return (
    <div className="space-y-4">
      {types.length === 0 ? (
        <div className="rounded-2xl border bg-white p-5">
          <div className="font-display font-bold mb-2">Total Inventory</div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold tabular-nums">{listing.totalInventory ?? 1}</div>
            <div className="ml-auto flex gap-1">
              <Button size="sm" variant="outline" onClick={() => bulk({ delta: -1 })} disabled={saving === 'total'} className="rounded-full">−1</Button>
              <Button size="sm" variant="outline" onClick={() => bulk({ delta: 1 })} disabled={saving === 'total'} className="rounded-full">+1</Button>
            </div>
          </div>
        </div>
      ) : (
        types.map((t) => (
          <div key={t.id} className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-[11px] text-muted-foreground">{inr(t.price || listing.price)} · Booked: {t.booked || 0} · Blocked: {t.blocked || 0}</div>
              </div>
              <div className="text-3xl font-bold tabular-nums">{t.available ?? 0}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" onClick={() => bulk({ typeId: t.id, delta: -1 })} disabled={saving === t.id} className="rounded-full">−1</Button>
              <Button size="sm" variant="outline" onClick={() => bulk({ typeId: t.id, delta: 1 })} disabled={saving === t.id} className="rounded-full">+1</Button>
              <Button size="sm" variant="outline" onClick={() => bulk({ typeId: t.id, delta: -5 })} disabled={saving === t.id} className="rounded-full">−5</Button>
              <Button size="sm" variant="outline" onClick={() => bulk({ typeId: t.id, delta: 5 })} disabled={saving === t.id} className="rounded-full">+5</Button>
              <Button size="sm" variant="ghost" onClick={() => { const n = prompt('Set exact available count:', t.available); if (n != null) bulk({ typeId: t.id, absolute: Number(n) }); }} className="rounded-full ml-auto">Set…</Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PricingTab({ listing }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/host/listings/${listing.id}/rules`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setRules(d.rules || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [listing.id]);

  const save = async (rule) => {
    setSaving(true);
    try {
      const isNew = !rule.id;
      const url = isNew ? `/api/host/listings/${listing.id}/rules` : `/api/host/listings/${listing.id}/rules/${rule.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const r = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rule) });
      const d = await r.json();
      if (d.ok) { toast.success('Rule saved'); setEditing(null); load(); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };
  const del = async (id) => {
    if (!confirm('Delete rule?')) return;
    const r = await fetch(`/api/host/listings/${listing.id}/rules/${id}`, { method: 'DELETE', credentials: 'include' });
    const d = await r.json();
    if (d.ok) { toast.success('Rule deleted'); load(); }
  };
  const applyPreset = (p) => setEditing({ ...p, active: true });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">Quick Add — Presets</div>
        <div className="flex flex-wrap gap-2">
          {RULE_PRESETS.map((p) => (
            <Button key={p.name} size="sm" variant="outline" onClick={() => applyPreset(p)} className="rounded-full">
              <Plus className="size-3 mr-1" /> {p.name}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
      ) : (
        <div className="space-y-2">
          {rules.length === 0 ? (
            <div className="p-6 border rounded-2xl bg-white text-center text-sm text-muted-foreground">No pricing rules yet.</div>
          ) : rules.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-white p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{r.name} {!r.active && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-100 border ml-1">disabled</span>}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.adjustment?.mode === 'fixed' ? `${inr(r.adjustment.value)}` : `${r.adjustment?.value > 0 ? '+' : ''}${r.adjustment?.value}%`} · Priority {r.priority} · {r.type}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(r)} className="rounded-full h-8">Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => del(r.id)} className="rounded-full h-8 text-rose-500"><Trash2 className="size-3" /></Button>
              </div>
            </div>
          ))}
          <Button onClick={() => setEditing({ name: '', type: 'custom', active: true, priority: 100, adjustment: { mode: 'percent', value: 0 }, conditions: {} })} variant="outline" className="rounded-full w-full">
            <Plus className="size-4 mr-2" /> Add custom rule
          </Button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full my-8 shadow-2xl p-5 space-y-3">
            <div className="font-display text-lg font-bold">{editing.id ? 'Edit rule' : 'New rule'}</div>
            <label className="block">
              <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Name</div>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Mode</div>
                <select value={editing.adjustment?.mode || 'percent'} onChange={(e) => setEditing({ ...editing, adjustment: { ...editing.adjustment, mode: e.target.value } })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </label>
              <label className="block">
                <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Value (± allowed)</div>
                <input type="number" value={editing.adjustment?.value ?? 0} onChange={(e) => setEditing({ ...editing, adjustment: { ...editing.adjustment, value: Number(e.target.value) } })} className="w-full px-3 py-2 rounded-xl border text-sm" />
              </label>
            </div>
            <label className="block">
              <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Priority (lower = applied first)</div>
              <input type="number" value={editing.priority ?? 100} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border text-sm" />
            </label>
            <div className="rounded-xl border p-3 space-y-2">
              <div className="text-[10px] uppercase text-muted-foreground font-bold">Conditions (all optional)</div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.conditions?.weekendOnly} onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, weekendOnly: e.target.checked } })} className="accent-emerald-600" /> Weekend only (Fri–Sun)</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs"><div className="text-[10px] uppercase text-muted-foreground mb-1">From date</div><input type="date" value={editing.conditions?.dateFrom || ''} onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, dateFrom: e.target.value } })} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></label>
                <label className="block text-xs"><div className="text-[10px] uppercase text-muted-foreground mb-1">To date</div><input type="date" value={editing.conditions?.dateTo || ''} onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, dateTo: e.target.value } })} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></label>
                <label className="block text-xs"><div className="text-[10px] uppercase text-muted-foreground mb-1">Min nights</div><input type="number" value={editing.conditions?.minNights ?? ''} onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, minNights: e.target.value ? Number(e.target.value) : undefined } })} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></label>
                <label className="block text-xs"><div className="text-[10px] uppercase text-muted-foreground mb-1">Max nights</div><input type="number" value={editing.conditions?.maxNights ?? ''} onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, maxNights: e.target.value ? Number(e.target.value) : undefined } })} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></label>
                <label className="block text-xs"><div className="text-[10px] uppercase text-muted-foreground mb-1">Min advance days</div><input type="number" value={editing.conditions?.minAdvanceDays ?? ''} onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, minAdvanceDays: e.target.value ? Number(e.target.value) : undefined } })} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></label>
                <label className="block text-xs"><div className="text-[10px] uppercase text-muted-foreground mb-1">Max advance days</div><input type="number" value={editing.conditions?.maxAdvanceDays ?? ''} onChange={(e) => setEditing({ ...editing, conditions: { ...editing.conditions, maxAdvanceDays: e.target.value ? Number(e.target.value) : undefined } })} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></label>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="accent-emerald-600" /> Active</label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => save(editing)} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />} Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlackoutsTab({ listing }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ from: '', to: '', reason: 'maintenance', note: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/host/listings/${listing.id}/blackouts`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setItems(d.blackouts || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [listing.id]);

  const add = async () => {
    if (!form.from || !form.to) { toast.error('Pick from + to dates'); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/host/listings/${listing.id}/blackouts`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.ok) { toast.success('Blackout added'); setForm({ from: '', to: '', reason: 'maintenance', note: '' }); load(); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };
  const del = async (id) => {
    if (!confirm('Remove blackout?')) return;
    const r = await fetch(`/api/host/listings/${listing.id}/blackouts/${id}`, { method: 'DELETE', credentials: 'include' });
    const d = await r.json();
    if (d.ok) { toast.success('Removed'); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="font-display font-bold mb-3">Block dates</div>
        <div className="grid md:grid-cols-4 gap-2">
          <input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          <input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white">
            <option value="maintenance">Maintenance</option>
            <option value="personal">Personal Use</option>
            <option value="holiday">Holiday</option>
            <option value="emergency">Emergency</option>
            <option value="private_event">Private Event</option>
          </select>
          <Button onClick={add} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />} Add
          </Button>
        </div>
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note" className="mt-2 w-full px-3 py-2 rounded-xl border text-sm" />
      </div>
      {loading ? (
        <div className="py-8 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
      ) : items.length === 0 ? (
        <div className="p-6 border rounded-2xl bg-white text-center text-sm text-muted-foreground">No blackout dates.</div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <div key={b.id} className="rounded-xl border bg-white p-3 flex items-center gap-3">
              <Ban className="size-4 text-rose-500" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{new Date(b.from).toLocaleDateString()} → {new Date(b.to).toLocaleDateString()}</div>
                <div className="text-[11px] text-muted-foreground">{b.reason}{b.note ? ` · ${b.note}` : ''}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(b.id)} className="rounded-full text-rose-500"><Trash2 className="size-3" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WaitlistTab({ listing }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/host/listings/${listing.id}/waitlist`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setItems(d.waitlist || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [listing.id]);
  const act = async (id, action) => {
    const r = await fetch(`/api/host/waitlist/${id}/action`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const d = await r.json();
    if (d.ok) { toast.success(action); load(); }
  };
  if (loading) return <div className="py-8 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;
  if (items.length === 0) return <div className="p-6 border rounded-2xl bg-white text-center text-sm text-muted-foreground">No one on the waitlist.</div>;
  return (
    <div className="space-y-2">
      {items.map((w) => (
        <div key={w.id} className="rounded-2xl border bg-white p-4 flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{w.userName}</div>
            <div className="text-[11px] text-muted-foreground">{w.checkInDate ? new Date(w.checkInDate).toLocaleDateString() : 'Any date'} · {w.guests} guest(s) · {w.status}</div>
          </div>
          {w.status === 'waiting' && (
            <div className="flex gap-1">
              <Button size="sm" onClick={() => act(w.id, 'approve')} className="rounded-full bg-emerald2 hover:bg-emerald2-deep h-8">Approve</Button>
              <Button size="sm" variant="ghost" onClick={() => act(w.id, 'reject')} className="rounded-full h-8 text-rose-500">Reject</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AISuggestionsTab({ listing }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/ai/pricing-suggestions?listingId=${listing.id}`, { credentials: 'include' });
        const d = await r.json();
        if (d.ok) setData(d);
      } finally { setLoading(false); }
    })();
  }, [listing.id]);
  if (loading || !data) return <div className="py-8 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-[10px] uppercase text-muted-foreground font-bold">Trailing 30-day occupancy</div>
        <div className="font-display text-3xl font-bold flex items-center gap-2 mt-1"><TrendingUp className="size-6 text-emerald2" /> {data.occupancyPct}%</div>
      </div>
      {data.suggestions.map((s, i) => (
        <div key={i} className="rounded-2xl border bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center shrink-0"><Sparkles className="size-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{s.body}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-700 mt-1">Suggested: {s.suggestedAdjPct > 0 ? '+' : ''}{s.suggestedAdjPct}%</div>
            </div>
          </div>
        </div>
      ))}
      <div className="text-[11px] text-muted-foreground">These are recommendations only. You decide whether to apply.</div>
    </div>
  );
}

export default function App() {
  return <ProtectedRoute roles={['host', 'admin', 'super_admin']}><InventoryInner /></ProtectedRoute>;
}
