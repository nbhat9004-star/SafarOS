'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, DollarSign, Percent, Users, ShieldCheck, ShieldX, Clock, Pause, CheckCircle2, XCircle, Download, FileText, Search, Filter, Wallet, CreditCard, BadgeIndianRupee, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const Field = ({ label, children, hint }) => (
  <label className="block">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{label}</div>
    {children}
    {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
  </label>
);
const Input = (props) => (
  <input {...props} className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm ${props.className || ''}`} />
);
const Toggle = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-emerald-600" />
    <span className="text-sm text-muted-foreground">{label}</span>
  </label>
);

const StatusPill = ({ s }) => {
  const map = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    hold: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${map[s] || 'bg-secondary'}`}>{s}</span>;
};

const TABS = [
  { id: 'settings', label: 'Finance Settings', Ico: Percent },
  { id: 'payouts', label: 'Host Payouts', Ico: Users },
  { id: 'reports', label: 'Reports', Ico: TrendingUp },
  { id: 'audit', label: 'Audit Log', Ico: FileText },
];

function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/finance-settings', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setS(d.settings);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/finance-settings', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s),
      });
      const d = await r.json();
      if (d.ok) { toast.success('Finance settings saved'); setS(d.settings); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };

  if (loading || !s) return <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;

  const cats = [
    { key: 'hotels', label: 'Hotels' },
    { key: 'houseboats', label: 'Houseboats' },
    { key: 'homestays', label: 'Homestays' },
    { key: 'tours', label: 'Tours' },
    { key: 'activities', label: 'Activities' },
    { key: 'car_rentals', label: 'Car Rentals' },
    { key: 'bike_rentals', label: 'Bike Rentals' },
  ];

  return (
    <div className="space-y-6">
      {/* Commission */}
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Percent className="size-5 text-emerald2" /> Commission Rules</div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Commission Mode">
            <select value={s.commissionMode} onChange={(e) => setS({ ...s, commissionMode: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm">
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </Field>
          <Field label="Default Commission (%)">
            <Input type="number" min="0" max="100" value={s.defaultCommissionPct} onChange={(e) => setS({ ...s, defaultCommissionPct: Number(e.target.value) })} disabled={s.commissionMode !== 'percent'} />
          </Field>
          <Field label="Fixed Commission (₹)">
            <Input type="number" min="0" value={s.fixedCommission} onChange={(e) => setS({ ...s, fixedCommission: Number(e.target.value) })} disabled={s.commissionMode !== 'fixed'} />
          </Field>
        </div>
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Commission by Category (%)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cats.map((c) => (
              <Field key={c.key} label={c.label}>
                <Input type="number" min="0" max="100" value={s.categoryCommissions?.[c.key] ?? 0} onChange={(e) => setS({ ...s, categoryCommissions: { ...s.categoryCommissions, [c.key]: Number(e.target.value) } })} disabled={s.commissionMode !== 'percent'} />
              </Field>
            ))}
          </div>
        </div>
      </div>

      {/* Payouts config */}
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Wallet className="size-5 text-emerald2" /> Payout Configuration</div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Minimum Payout (₹)">
            <Input type="number" min="0" value={s.minPayoutAmount} onChange={(e) => setS({ ...s, minPayoutAmount: Number(e.target.value) })} />
          </Field>
          <Field label="Payout Schedule">
            <select value={s.payoutSchedule} onChange={(e) => setS({ ...s, payoutSchedule: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm">
              <option value="instant">Instant</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <Field label="Hold Period (days)" hint="Days after checkout before earnings become available">
            <Input type="number" min="0" value={s.holdPeriodDays} onChange={(e) => setS({ ...s, holdPeriodDays: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <Toggle checked={s.autoPayouts} onChange={(v) => setS({ ...s, autoPayouts: v })} label="Enable Automatic Payouts" />
          </div>
          <div className="rounded-xl border p-3">
            <Toggle checked={s.manualApproval} onChange={(v) => setS({ ...s, manualApproval: v })} label="Require Manual Approval" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Enabled Payout Methods</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border p-3"><Toggle checked={s.enabledMethods?.wallet} onChange={(v) => setS({ ...s, enabledMethods: { ...s.enabledMethods, wallet: v } })} label="Wallet" /></div>
            <div className="rounded-xl border p-3"><Toggle checked={s.enabledMethods?.bank} onChange={(v) => setS({ ...s, enabledMethods: { ...s.enabledMethods, bank: v } })} label="Bank Transfer" /></div>
            <div className="rounded-xl border p-3"><Toggle checked={s.enabledMethods?.upi} onChange={(v) => setS({ ...s, enabledMethods: { ...s.enabledMethods, upi: v } })} label="UPI" /></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save Finance Settings
        </Button>
      </div>
    </div>
  );
}

function PayoutsPanel() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [availableHosts, setAvailableHosts] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const [pl, av] = await Promise.all([
        fetch(`/api/admin/host-payouts?${params.toString()}`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/admin/host-payouts/available', { credentials: 'include' }).then((r) => r.json()).catch(() => ({})),
      ]);
      if (pl.ok) setPayouts(pl.payouts || []);
      if (av.ok) setAvailableHosts(av.hosts || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const createPayout = async (hostId) => {
    setBusy(`create-${hostId}`);
    try {
      const r = await fetch('/api/admin/host-payouts/create', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hostId, method: 'bank' }),
      });
      const d = await r.json();
      if (d.ok) { toast.success('Payout created'); load(); }
      else toast.error(d.error || 'Failed');
    } finally { setBusy(null); }
  };

  const act = async (id, action, extras = {}) => {
    setBusy(`${id}-${action}`);
    try {
      const r = await fetch(`/api/admin/host-payouts/${id}/${action}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(extras),
      });
      const d = await r.json();
      if (d.ok) { toast.success(`Payout ${action}`); load(); }
      else toast.error(d.error || 'Failed');
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      {/* Available for payout */}
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="font-display text-lg font-bold mb-4 flex items-center gap-2"><BadgeIndianRupee className="size-5 text-emerald2" /> Hosts Available for Payout</div>
        {availableHosts.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hosts have available earnings right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="text-left px-4 py-2">Host</th>
                  <th className="text-right px-4 py-2">Available</th>
                  <th className="text-right px-4 py-2">Bookings</th>
                  <th className="text-right px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {availableHosts.map((h) => (
                  <tr key={h.hostId} className="border-t">
                    <td className="px-4 py-2">
                      <div className="font-semibold">{h.hostName}</div>
                      <div className="text-xs text-muted-foreground">{h.hostEmail}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-emerald-700">{inr(h.amount)}</td>
                    <td className="px-4 py-2 text-right">{h.bookingCount}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" onClick={() => createPayout(h.hostId)} disabled={!h.meetsMinimum || busy === `create-${h.hostId}`} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                        {busy === `create-${h.hostId}` ? <Loader2 className="size-3 mr-1 animate-spin" /> : null}
                        {h.meetsMinimum ? 'Create Payout' : 'Below Min'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Search Host / Booking / Property</div>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, id..." className="pl-9" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Status</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full md:w-48 px-4 py-2.5 rounded-xl border bg-white text-sm">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="hold">On Hold</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={load} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
              <Filter className="size-4 mr-2" /> Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Payout list */}
      <div className="rounded-2xl border bg-white">
        <div className="p-4 md:p-5 border-b">
          <div className="font-display text-lg font-bold">Host Payouts</div>
          <div className="text-xs text-muted-foreground">{payouts.length} record{payouts.length === 1 ? '' : 's'}</div>
        </div>
        {loading ? (
          <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No payouts found.</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="text-left px-4 py-3">Host</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-right px-4 py-3">Bookings</th>
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-left px-4 py-3">Requested</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{p.hostName}</div>
                        <div className="text-xs text-muted-foreground">{p.hostEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{inr(p.amount)}</td>
                      <td className="px-4 py-3 text-right">{p.bookingCount}</td>
                      <td className="px-4 py-3 uppercase text-xs">{p.method}</td>
                      <td className="px-4 py-3 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><StatusPill s={p.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end flex-wrap">
                          {p.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => act(p.id, 'approve')} disabled={busy === `${p.id}-approve`} className="rounded-full bg-emerald2 hover:bg-emerald2-deep h-8">Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => act(p.id, 'hold')} disabled={busy === `${p.id}-hold`} className="rounded-full h-8">Hold</Button>
                              <Button size="sm" variant="ghost" onClick={() => act(p.id, 'reject', { reason: prompt('Reason for rejection?') || '' })} disabled={busy === `${p.id}-reject`} className="rounded-full text-rose-600 hover:bg-rose-50 h-8">Reject</Button>
                            </>
                          )}
                          {(p.status === 'hold') && (
                            <>
                              <Button size="sm" onClick={() => act(p.id, 'approve')} className="rounded-full bg-emerald2 hover:bg-emerald2-deep h-8">Release & Pay</Button>
                              <Button size="sm" variant="ghost" onClick={() => act(p.id, 'reject', { reason: prompt('Reason?') || '' })} className="rounded-full text-rose-600 hover:bg-rose-50 h-8">Reject</Button>
                            </>
                          )}
                          {p.status === 'paid' && (
                            <span className="text-xs text-emerald-700 font-semibold">✓ Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {payouts.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{p.hostName}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.hostEmail}</div>
                    </div>
                    <StatusPill s={p.status} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span>Amount</span>
                    <span className="font-semibold text-emerald-700">{inr(p.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Bookings</span>
                    <span>{p.bookingCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Method</span>
                    <span className="uppercase">{p.method}</span>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {p.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => act(p.id, 'approve')} className="rounded-full bg-emerald2 hover:bg-emerald2-deep h-8">Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => act(p.id, 'hold')} className="rounded-full h-8">Hold</Button>
                        <Button size="sm" variant="ghost" onClick={() => act(p.id, 'reject', { reason: prompt('Reason?') || '' })} className="rounded-full text-rose-600 h-8">Reject</Button>
                      </>
                    )}
                    {p.status === 'hold' && (
                      <Button size="sm" onClick={() => act(p.id, 'approve')} className="rounded-full bg-emerald2 hover:bg-emerald2-deep h-8">Release & Pay</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReportsPanel() {
  const [loading, setLoading] = useState(true);
  const [r, setR] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/finance/reports', { credentials: 'include' });
      const d = await res.json();
      if (d.ok) setR(d.reports);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const download = (type) => {
    window.open(`/api/admin/finance/reports/export?type=${type}`, '_blank');
  };

  if (loading || !r) return <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;

  const cards = [
    { l: 'Platform Revenue', v: inr(r.platformRevenue), Ico: TrendingUp, tint: 'text-blue-600' },
    { l: 'Host Earnings (Total)', v: inr(r.hostEarningsTotal), Ico: Users, tint: 'text-emerald-600' },
    { l: 'Commission Earned', v: inr(r.commissionEarned), Ico: Percent, tint: 'text-emerald2' },
    { l: 'Pending Payouts', v: inr(r.pendingPayouts), Ico: Clock, tint: 'text-amber-600' },
    { l: 'Paid Payouts', v: inr(r.paidPayouts), Ico: CheckCircle2, tint: 'text-emerald-700' },
    { l: 'Refunded (Count)', v: r.refundStats.count, Ico: XCircle, tint: 'text-rose-500' },
    { l: 'Refunded (Amount)', v: inr(r.refundStats.amount), Ico: XCircle, tint: 'text-rose-500' },
    { l: 'Total Earnings Records', v: r.earningsCount, Ico: FileText, tint: 'text-slate-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c, i) => {
          const Ico = c.Ico;
          return (
            <div key={i} className="rounded-2xl border bg-white p-4">
              <Ico className={`size-4 ${c.tint}`} />
              <div className="font-display text-lg md:text-xl font-bold mt-2">{c.v}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{c.l}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Download className="size-5 text-emerald2" /> Export Reports</div>
        <div className="grid md:grid-cols-2 gap-3">
          <Button onClick={() => download('earnings')} variant="outline" className="rounded-full justify-start">
            <FileText className="size-4 mr-2" /> Download Earnings CSV
          </Button>
          <Button onClick={() => download('payouts')} variant="outline" className="rounded-full justify-start">
            <FileText className="size-4 mr-2" /> Download Payouts CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuditPanel() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/finance/audit-log', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setLogs(d.logs || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-2xl border bg-white">
      <div className="p-4 md:p-5 border-b">
        <div className="font-display text-lg font-bold">Finance Audit Log</div>
        <div className="text-xs text-muted-foreground">{logs.length} event{logs.length === 1 ? '' : 's'}</div>
      </div>
      {loading ? (
        <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No audit events yet.</div>
      ) : (
        <div className="divide-y">
          {logs.map((l) => (
            <div key={l.id} className="p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">{l.action}</div>
                  <div className="text-xs text-muted-foreground">
                    by {l.actorName} ({l.actorRole || 'system'})
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</div>
              </div>
              {l.details && Object.keys(l.details).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-emerald2 cursor-pointer font-semibold">View details</summary>
                  <pre className="mt-2 text-[11px] bg-secondary/40 p-3 rounded-xl overflow-x-auto max-h-64">{JSON.stringify(l.details, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FinanceInner() {
  const [tab, setTab] = useState('settings');

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <Link href="/admin" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
              <ArrowLeft className="size-3" /> Back to Admin
            </Link>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Finance Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage commission, host payouts, reports, and audit trail.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map((t) => {
            const Ico = t.Ico;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition inline-flex items-center gap-2 ${active ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}
              >
                <Ico className="size-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'settings' && <SettingsPanel />}
        {tab === 'payouts' && <PayoutsPanel />}
        {tab === 'reports' && <ReportsPanel />}
        {tab === 'audit' && <AuditPanel />}
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin', 'super_admin']}><FinanceInner /></ProtectedRoute>;
}
