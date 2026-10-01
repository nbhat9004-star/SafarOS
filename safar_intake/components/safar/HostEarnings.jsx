'use client';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Wallet, TrendingUp, Calendar, DollarSign, ArrowUpRight, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const StatusBadge = ({ s }) => {
  const map = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paid: 'bg-blue-50 text-blue-700 border-blue-200',
    refunded: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${map[s] || 'bg-secondary'}`}>{s}</span>;
};

export default function HostEarnings({ myListings = [] }) {
  const [summary, setSummary] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '', property: '', status: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.property) params.set('property', filters.property);
      if (filters.status) params.set('status', filters.status);
      const [s, e, p] = await Promise.all([
        fetch('/api/host/earnings/summary', { credentials: 'include' }).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/host/earnings/history?${params.toString()}`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/host/payouts/history', { credentials: 'include' }).then((r) => r.json()).catch(() => ({})),
      ]);
      if (s.ok) setSummary(s.summary);
      if (e.ok) setEarnings(e.earnings || []);
      if (p.ok) setPayouts(p.payouts || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const applyFilters = () => load();
  const clearFilters = () => { setFilters({ from: '', to: '', property: '', status: '' }); setTimeout(load, 0); };

  const kpis = useMemo(() => ([
    { l: 'Available Balance', v: inr(summary?.availableBalance), i: Wallet, tint: 'text-emerald-600' },
    { l: 'Pending Balance', v: inr(summary?.pendingBalance), i: Calendar, tint: 'text-amber-600' },
    { l: 'Lifetime Earnings', v: inr(summary?.lifetimeEarnings), i: TrendingUp, tint: 'text-blue-600' },
    { l: 'This Month', v: inr(summary?.thisMonthEarnings), i: DollarSign, tint: 'text-emerald-600' },
    { l: 'Completed Bookings', v: summary?.totalCompletedBookings || 0, i: Calendar, tint: 'text-slate-600' },
    { l: 'Commission Paid', v: inr(summary?.platformCommissionPaid), i: ArrowUpRight, tint: 'text-rose-500' },
    { l: 'Refund Deductions', v: inr(summary?.totalRefundDeductions), i: ArrowUpRight, tint: 'text-rose-500' },
    { l: 'Next Payout', v: summary?.upcomingPayoutDate ? new Date(summary.upcomingPayoutDate).toLocaleDateString() : '—', i: Calendar, tint: 'text-slate-600' },
  ]), [summary]);

  if (loading && !summary) {
    return <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k, i) => {
          const Ico = k.i;
          return (
            <div key={i} className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <Ico className={`size-4 ${k.tint}`} />
              </div>
              <div className="font-display text-lg md:text-xl font-bold mt-2">{k.v}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.l}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="size-4 text-emerald2" />
          <div className="font-semibold text-sm">Filter Earnings</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">From</div>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">To</div>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Property</div>
            <select value={filters.property} onChange={(e) => setFilters({ ...filters, property: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
              <option value="">All properties</option>
              {myListings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Status</div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="available">Available</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep flex-1">Apply</Button>
            <Button onClick={clearFilters} size="sm" variant="outline" className="rounded-full flex-1">Clear</Button>
          </div>
        </div>
      </div>

      {/* Booking earnings breakdown */}
      <div className="rounded-2xl border bg-white">
        <div className="p-4 md:p-5 border-b">
          <div className="font-display text-lg font-bold">Booking Earnings Breakdown</div>
          <div className="text-xs text-muted-foreground mt-0.5">{earnings.length} record{earnings.length === 1 ? '' : 's'}</div>
        </div>
        {earnings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No earnings yet. Approved bookings will appear here.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40">
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <th className="text-left px-4 py-3">Booking</th>
                    <th className="text-left px-4 py-3">Guest / Property</th>
                    <th className="text-left px-4 py-3">Dates</th>
                    <th className="text-right px-4 py-3">Booking Amt</th>
                    <th className="text-right px-4 py-3">Commission</th>
                    <th className="text-right px-4 py-3">Net</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((e) => (
                    <tr key={e.id} className="border-t hover:bg-secondary/20">
                      <td className="px-4 py-3 font-mono text-xs">{e.bookingId?.slice(0, 8) || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{e.travelerName || '—'}</div>
                        <div className="text-xs text-muted-foreground">{e.listingTitle}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {e.checkInDate ? new Date(e.checkInDate).toLocaleDateString() : '—'}<br />
                        <span className="text-muted-foreground">→ {e.checkOutDate ? new Date(e.checkOutDate).toLocaleDateString() : '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">{inr(e.bookingAmount)}</td>
                      <td className="px-4 py-3 text-right text-rose-600">-{inr(e.commissionAmount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{inr(e.netEarnings)}</td>
                      <td className="px-4 py-3"><StatusBadge s={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {earnings.map((e) => (
                <div key={e.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{e.listingTitle}</div>
                      <div className="text-xs text-muted-foreground truncate">{e.travelerName}</div>
                    </div>
                    <StatusBadge s={e.status} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {e.checkInDate ? new Date(e.checkInDate).toLocaleDateString() : '—'} → {e.checkOutDate ? new Date(e.checkOutDate).toLocaleDateString() : '—'}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Booking</div>
                      <div className="font-semibold">{inr(e.bookingAmount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Commission</div>
                      <div className="font-semibold text-rose-600">-{inr(e.commissionAmount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Net</div>
                      <div className="font-semibold text-emerald-700">{inr(e.netEarnings)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payout History */}
      <div className="rounded-2xl border bg-white">
        <div className="p-4 md:p-5 border-b">
          <div className="font-display text-lg font-bold">Payout History</div>
          <div className="text-xs text-muted-foreground mt-0.5">{payouts.length} payout{payouts.length === 1 ? '' : 's'}</div>
        </div>
        {payouts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No payouts yet. Once admin processes payouts, they will appear here.</div>
        ) : (
          <div className="divide-y">
            {payouts.map((p) => (
              <div key={p.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">Payout · {p.method?.toUpperCase() || 'BANK'}</div>
                  <div className="text-xs text-muted-foreground">{p.bookingCount} booking{p.bookingCount === 1 ? '' : 's'} · Requested {new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-emerald-700">{inr(p.amount)}</div>
                  <StatusBadge s={p.status === 'paid' ? 'paid' : (p.status === 'pending' ? 'pending' : p.status === 'hold' ? 'pending' : 'refunded')} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
