'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, DollarSign, Calendar, Users, Save, Plus, Trash2, TrendingUp, TrendingDown, Settings2, Package } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const TABS = [
  { id: 'settings', label: 'Settings', Ico: Settings2 },
  { id: 'holidays', label: 'Holiday Calendar', Ico: Calendar },
  { id: 'occupancy', label: 'Occupancy', Ico: Package },
  { id: 'waitlists', label: 'Waitlists', Ico: Users },
];

function PricingCenterInner() {
  const [tab, setTab] = useState('settings');
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Admin
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-2"><DollarSign className="size-7 text-emerald2" /> Dynamic Pricing Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure pricing caps, holidays, view occupancy and manage waitlists.</p>

        <div className="flex gap-2 overflow-x-auto pb-2 mt-6 -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map((t) => {
            const Ico = t.Ico; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition inline-flex items-center gap-2 ${active ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}>
                <Ico className="size-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {tab === 'settings' && <SettingsPanel />}
          {tab === 'holidays' && <HolidaysPanel />}
          {tab === 'occupancy' && <OccupancyPanel />}
          {tab === 'waitlists' && <WaitlistsPanel />}
        </div>
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
      const r = await fetch('/api/admin/pricing-settings', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setS(d.settings);
    })();
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/pricing-settings', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      const d = await r.json();
      if (d.ok) { toast.success('Settings saved'); setS(d.settings); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };
  if (!s) return <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;
  const Field = ({ label, children, hint }) => (
    <label className="block"><div className="text-[10px] uppercase text-muted-foreground font-bold mb-1.5">{label}</div>{children}{hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}</label>
  );
  const Input = (p) => <input {...p} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white" />;
  const Toggle = ({ v, onChange, label }) => (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!v} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-emerald-600" />
      <span className="text-sm">{label}</span>
    </label>
  );
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="font-display text-lg font-bold mb-4">Dynamic Pricing Caps</div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Max Discount (%)" hint="Cap on any downward adjustment"><Input type="number" value={s.maxDiscountPct} onChange={(e) => setS({ ...s, maxDiscountPct: Number(e.target.value) })} /></Field>
          <Field label="Max Increase (%)" hint="Cap on any upward adjustment"><Input type="number" value={s.maxIncreasePct} onChange={(e) => setS({ ...s, maxIncreasePct: Number(e.target.value) })} /></Field>
          <Field label="Rule Stacking Mode">
            <select value={s.ruleStackMode} onChange={(e) => setS({ ...s, ruleStackMode: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white">
              <option value="combined">Combined (all matching rules)</option>
              <option value="highest">Highest priority only</option>
            </select>
          </Field>
          <Field label="Min Booking Fee (₹)"><Input type="number" value={s.minBookingFee} onChange={(e) => setS({ ...s, minBookingFee: Number(e.target.value) })} /></Field>
          <Field label="Max Booking Fee (₹)"><Input type="number" value={s.maxBookingFee} onChange={(e) => setS({ ...s, maxBookingFee: Number(e.target.value) })} /></Field>
          <Field label="Demand Multiplier"><Input type="number" step="0.05" value={s.demandMultiplier} onChange={(e) => setS({ ...s, demandMultiplier: Number(e.target.value) })} /></Field>
          <Field label="Festival Multiplier"><Input type="number" step="0.05" value={s.festivalMultiplier} onChange={(e) => setS({ ...s, festivalMultiplier: Number(e.target.value) })} /></Field>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border p-3"><Toggle v={s.dynamicEnabled} onChange={(v) => setS({ ...s, dynamicEnabled: v })} label="Dynamic Pricing Enabled" /></div>
          <div className="rounded-xl border p-3"><Toggle v={s.waitlistEnabled} onChange={(v) => setS({ ...s, waitlistEnabled: v })} label="Waitlist Enabled" /></div>
          <div className="rounded-xl border p-3"><Toggle v={s.aiSuggestionsEnabled} onChange={(v) => setS({ ...s, aiSuggestionsEnabled: v })} label="AI Suggestions Enabled" /></div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />} Save Settings
        </Button>
      </div>
    </div>
  );
}

function HolidaysPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', name: '', region: 'IN', multiplier: 1.25 });
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/holidays', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setItems(d.holidays || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.date || !form.name) { toast.error('date + name required'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/admin/holidays', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.ok) { toast.success('Holiday added'); setForm({ date: '', name: '', region: 'IN', multiplier: 1.25 }); load(); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };
  const del = async (id) => {
    if (!confirm('Remove holiday?')) return;
    const r = await fetch(`/api/admin/holidays/${id}`, { method: 'DELETE', credentials: 'include' });
    const d = await r.json();
    if (d.ok) { toast.success('Removed'); load(); }
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="font-display font-bold mb-3">Add Holiday / Festival</div>
        <div className="grid md:grid-cols-5 gap-2">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (e.g. Onam)" className="px-3 py-2 rounded-xl border text-sm" />
          <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Region" className="px-3 py-2 rounded-xl border text-sm" />
          <input type="number" step="0.05" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: Number(e.target.value) })} placeholder="Multiplier" className="px-3 py-2 rounded-xl border text-sm" />
          <Button onClick={add} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />} Add
          </Button>
        </div>
      </div>
      {loading ? <div className="py-8 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        : items.length === 0 ? <div className="p-6 border rounded-2xl bg-white text-center text-sm text-muted-foreground">No holidays configured.</div>
        : <div className="space-y-2">
            {items.map((h) => (
              <div key={h.id} className="rounded-xl border bg-white p-3 flex items-center gap-3">
                <Calendar className="size-4 text-emerald2" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{h.name}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(h.date).toLocaleDateString()} · {h.region} · {h.multiplier}x</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => del(h.id)} className="rounded-full text-rose-500"><Trash2 className="size-3" /></Button>
              </div>
            ))}
          </div>}
    </div>
  );
}

function OccupancyPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/admin/pricing/occupancy', { credentials: 'include' });
        const d = await r.json();
        if (d.ok) setData(d);
      } finally { setLoading(false); }
    })();
  }, []);
  if (loading || !data) return <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white">
          <div className="p-4 border-b font-display font-bold flex items-center gap-2"><TrendingUp className="size-4 text-emerald-600" /> Most Occupied</div>
          <div className="divide-y">
            {data.mostOccupied.map((l) => (
              <div key={l.listingId} className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{l.title}</div>
                  <div className="text-[11px] text-muted-foreground">ADR {inr(l.adr)} · Cap {l.capacity}</div>
                </div>
                <div className="text-emerald-700 font-bold tabular-nums">{l.occupancyPct}%</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-white">
          <div className="p-4 border-b font-display font-bold flex items-center gap-2"><TrendingDown className="size-4 text-rose-500" /> Lowest Occupied</div>
          <div className="divide-y">
            {data.lowestOccupied.map((l) => (
              <div key={l.listingId} className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{l.title}</div>
                  <div className="text-[11px] text-muted-foreground">ADR {inr(l.adr)} · Cap {l.capacity}</div>
                </div>
                <div className="text-rose-600 font-bold tabular-nums">{l.occupancyPct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="p-4 border-b font-display font-bold">All Listings ({data.listings.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-muted-foreground font-semibold bg-secondary/40">
              <tr><th className="text-left p-3">Listing</th><th className="text-right p-3">Occupancy</th><th className="text-right p-3">Bookings</th><th className="text-right p-3">Room Nights</th><th className="text-right p-3">ADR</th><th className="text-right p-3">Revenue</th><th className="text-right p-3">RevPAR</th></tr>
            </thead>
            <tbody>
              {data.listings.map((l) => (
                <tr key={l.listingId} className="border-t">
                  <td className="p-3"><div className="font-semibold truncate">{l.title}</div><div className="text-[10px] text-muted-foreground">{l.category}</div></td>
                  <td className="p-3 text-right font-semibold tabular-nums">{l.occupancyPct}%</td>
                  <td className="p-3 text-right tabular-nums">{l.bookings}</td>
                  <td className="p-3 text-right tabular-nums">{l.roomNights}</td>
                  <td className="p-3 text-right tabular-nums">{inr(l.adr)}</td>
                  <td className="p-3 text-right tabular-nums text-emerald-700">{inr(l.revenue)}</td>
                  <td className="p-3 text-right tabular-nums">{inr(l.revPar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WaitlistsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/admin/pricing/waitlists', { credentials: 'include' });
        const d = await r.json();
        if (d.ok) setItems(d.waitlist || []);
      } finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;
  if (items.length === 0) return <div className="p-8 border rounded-2xl bg-white text-center text-sm text-muted-foreground">No waitlist entries yet.</div>;
  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase text-muted-foreground font-semibold bg-secondary/40">
            <tr><th className="text-left p-3">User</th><th className="text-left p-3">Listing</th><th className="text-left p-3">Dates</th><th className="text-right p-3">Guests</th><th className="text-left p-3">Status</th><th className="text-left p-3">Requested</th></tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-3 font-semibold">{w.userName}</td>
                <td className="p-3 font-mono text-xs">{w.listingId?.slice(0, 8)}</td>
                <td className="p-3 text-xs">{w.checkInDate ? new Date(w.checkInDate).toLocaleDateString() : '—'} → {w.checkOutDate ? new Date(w.checkOutDate).toLocaleDateString() : '—'}</td>
                <td className="p-3 text-right">{w.guests}</td>
                <td className="p-3"><span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-secondary">{w.status}</span></td>
                <td className="p-3 text-xs">{new Date(w.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin', 'super_admin']}><PricingCenterInner /></ProtectedRoute>;
}
