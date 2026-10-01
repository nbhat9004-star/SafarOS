'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Download, Filter, TrendingUp, Calendar, Users, Home, Sparkles, PieChart as PieIcon, BarChart3, LineChart as LineIcon, Wallet, DollarSign, Gift, Bot, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const num = (n) => Number(n || 0).toLocaleString('en-IN');
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;
const COLORS = ['#10b981', '#059669', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#84cc16'];

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];

const TABS = [
  { id: 'executive', label: 'Executive', Ico: TrendingUp },
  { id: 'revenue', label: 'Revenue', Ico: DollarSign },
  { id: 'bookings', label: 'Bookings', Ico: Calendar },
  { id: 'travelers', label: 'Travelers', Ico: Users },
  { id: 'hosts', label: 'Hosts', Ico: Home },
  { id: 'listings', label: 'Listings', Ico: PieIcon },
  { id: 'marketing', label: 'Marketing', Ico: Gift },
  { id: 'ai', label: 'AI Planner', Ico: Bot },
  { id: 'reports', label: 'Reports', Ico: FileSpreadsheet },
];

const REPORTS = [
  { id: 'revenue', label: 'Revenue Report' },
  { id: 'booking', label: 'Booking Report' },
  { id: 'host', label: 'Host Earnings Report' },
  { id: 'traveler', label: 'Traveler Report' },
  { id: 'listing', label: 'Listing Report' },
  { id: 'refund', label: 'Refund Report' },
  { id: 'wallet', label: 'Wallet Report' },
  { id: 'referral', label: 'Referral Report' },
  { id: 'promotion', label: 'Promotion / Coupon Report' },
];

function KpiCard({ label, value, Ico, tint = 'text-emerald2', sub }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      {Ico && <Ico className={`size-4 ${tint}`} />}
      <div className="font-display text-lg md:text-xl font-bold mt-2 tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-base font-bold">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function AnalyticsInner() {
  const [tab, setTab] = useState('executive');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [rangeKey, setRangeKey] = useState('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filters, setFilters] = useState({ category: '', district: '', status: '', paymentType: '', hostId: '' });
  const [filterOpts, setFilterOpts] = useState({ categories: [], districts: [], hosts: [], statuses: [], paymentTypes: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range: rangeKey });
      if (rangeKey === 'custom' && from) params.set('from', from);
      if (rangeKey === 'custom' && to) params.set('to', to);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const r = await fetch(`/api/admin/analytics/overview?${params.toString()}`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setData(d);
    } finally { setLoading(false); }
  };
  const loadFilterOpts = async () => {
    try {
      const r = await fetch('/api/admin/analytics/filters', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setFilterOpts(d);
    } catch {}
  };
  useEffect(() => { loadFilterOpts(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [rangeKey]);

  const applyFilters = () => load();
  const clearFilters = () => { setFilters({ category: '', district: '', status: '', paymentType: '', hostId: '' }); setTimeout(load, 0); };

  const exportReport = (report) => {
    const params = new URLSearchParams({ report, range: rangeKey });
    if (rangeKey === 'custom' && from) params.set('from', from);
    if (rangeKey === 'custom' && to) params.set('to', to);
    setExporting(report);
    window.open(`/api/admin/analytics/export?${params.toString()}`, '_blank');
    setTimeout(() => setExporting(''), 1200);
  };

  const k = data?.kpi;
  const rev = data?.revenueAnalytics;
  const ba = data?.bookingAnalytics;
  const ta = data?.travelerAnalytics;
  const ha = data?.hostAnalytics;
  const la = data?.listingAnalytics;
  const ma = data?.marketingAnalytics;
  const ai = data?.aiAnalytics;

  const paymentPie = useMemo(() => {
    if (!ba) return [];
    return Object.entries(ba.paymentDistribution || {}).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [ba]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Admin
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mt-2">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-2">
              <BarChart3 className="size-7 text-emerald2" /> Analytics Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Business intelligence across bookings, revenue, hosts, travelers & marketing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRangeKey(r.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${rangeKey === r.id ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}
              >{r.label}</button>
            ))}
            <button onClick={() => setShowFilters((v) => !v)} className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white hover:bg-secondary inline-flex items-center gap-1">
              <Filter className="size-3" /> Filters <ChevronDown className={`size-3 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {rangeKey === 'custom' && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">From</div>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" />
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">To</div>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" />
            </div>
            <Button onClick={load} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">Apply</Button>
          </div>
        )}

        {showFilters && (
          <div className="mt-4 rounded-2xl border bg-white p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Category</div>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                <option value="">All</option>
                {filterOpts.categories?.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">District</div>
              <select value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                <option value="">All</option>
                {filterOpts.districts?.slice(0, 100).map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Status</div>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                <option value="">All</option>
                {filterOpts.statuses?.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Payment</div>
              <select value={filters.paymentType} onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                <option value="">All</option>
                {filterOpts.paymentTypes?.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Host</div>
              <select value={filters.hostId} onChange={(e) => setFilters({ ...filters, hostId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                <option value="">All hosts</option>
                {filterOpts.hosts?.map((h) => <option key={h.id} value={h.id}>{h.name || h.email}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep flex-1">Apply</Button>
              <Button onClick={clearFilters} size="sm" variant="outline" className="rounded-full flex-1">Clear</Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-6 -mx-4 px-4 md:mx-0 md:px-0">
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

        {loading || !data ? (
          <div className="py-24 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : (
          <div className="mt-4 space-y-6">
            {tab === 'executive' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="Total Revenue (Lifetime)" value={inr(k.totalRevenueLifetime)} Ico={DollarSign} />
                  <KpiCard label="Revenue (Range)" value={inr(k.totalRevenueRange)} Ico={TrendingUp} />
                  <KpiCard label="Monthly Revenue" value={inr(k.monthlyRevenue)} Ico={Calendar} />
                  <KpiCard label="Daily Revenue" value={inr(k.dailyRevenue)} Ico={Calendar} />
                  <KpiCard label="Total Bookings" value={num(k.totalBookingsLifetime)} Ico={Calendar} />
                  <KpiCard label="Active Bookings" value={num(k.activeBookings)} tint="text-blue-600" />
                  <KpiCard label="Completed" value={num(k.completedBookings)} tint="text-emerald-600" />
                  <KpiCard label="Cancelled" value={num(k.cancelledBookings)} tint="text-rose-500" />
                  <KpiCard label="Refund Amount" value={inr(k.refundAmount)} tint="text-rose-500" />
                  <KpiCard label="Wallet Balance" value={inr(k.walletBalance)} Ico={Wallet} />
                  <KpiCard label="Safar Credits Issued" value={num(k.creditsIssued)} Ico={Sparkles} />
                  <KpiCard label="Referral Rewards" value={inr(k.referralRewardsIssued)} Ico={Gift} />
                  <KpiCard label="Total Travelers" value={num(k.totalTravelers)} Ico={Users} />
                  <KpiCard label="Total Hosts" value={num(k.totalHosts)} Ico={Home} />
                  <KpiCard label="Active Listings" value={num(k.activeListings)} />
                  <KpiCard label="Pending Listings" value={num(k.pendingListings)} tint="text-amber-600" />
                  <KpiCard label="Avg Booking Value" value={inr(k.averageBookingValue)} />
                  <KpiCard label="Platform Commission" value={inr(k.platformCommission)} Ico={DollarSign} tint="text-emerald-700" />
                </div>
                <Card title="Revenue Trend (Daily)">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rev.byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="bucket" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </>
            )}

            {tab === 'revenue' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="Gross Revenue" value={inr(rev.grossRevenue)} Ico={TrendingUp} />
                  <KpiCard label="Net Revenue" value={inr(rev.netRevenue)} tint="text-emerald-700" />
                  <KpiCard label="Commission" value={inr(rev.commission)} tint="text-blue-600" />
                  <KpiCard label="Refunds" value={inr(rev.refunds)} tint="text-rose-500" />
                  <KpiCard label="Discounts" value={inr(rev.discounts)} tint="text-amber-600" />
                  <KpiCard label="Wallet Usage" value={inr(rev.walletUsage)} tint="text-purple-600" Ico={Wallet} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card title="Revenue by Day">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rev.byDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="bucket" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card title="Revenue by Month">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rev.byMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="bucket" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card title="Revenue by Week">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rev.byWeek}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="bucket" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#059669" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card title="Category Breakdown">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          <tr><th className="text-left py-2">Category</th><th className="text-right py-2">Bookings</th><th className="text-right py-2">Gross</th><th className="text-right py-2">Commission</th><th className="text-right py-2">Net</th></tr>
                        </thead>
                        <tbody>
                          {rev.categoryBreakdown.map((c) => (
                            <tr key={c.category} className="border-t">
                              <td className="py-2 capitalize">{c.category.replace('_', ' ')}</td>
                              <td className="py-2 text-right">{c.bookings}</td>
                              <td className="py-2 text-right">{inr(c.gross)}</td>
                              <td className="py-2 text-right text-blue-600">{inr(c.commission)}</td>
                              <td className="py-2 text-right font-semibold text-emerald-700">{inr(c.net)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {tab === 'bookings' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="Total Bookings" value={num(k.totalBookingsRange)} />
                  <KpiCard label="Confirmation Rate" value={pct(ba.confirmationRate)} tint="text-emerald-600" />
                  <KpiCard label="Cancellation Rate" value={pct(ba.cancellationRate)} tint="text-rose-500" />
                  <KpiCard label="Avg Booking Value" value={inr(ba.averageBookingValue)} />
                  <KpiCard label="Avg Stay (Days)" value={ba.averageStayDays} />
                  <KpiCard label="Online Payment %" value={pct(ba.onlinePaymentPct)} tint="text-blue-600" />
                  <KpiCard label="Booking Fee %" value={pct(ba.bookingFeePct)} tint="text-amber-600" />
                  <KpiCard label="Full Payment %" value={pct(ba.fullPaymentPct)} tint="text-emerald-600" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card title="Booking Trend">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ba.trendDaily}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="bucket" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Revenue" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card title="Payment Distribution">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={paymentPie} dataKey="value" nameKey="name" outerRadius={90} label>
                            {paymentPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend fontSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {tab === 'travelers' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="New Users" value={num(ta.newUsers)} Ico={Users} />
                  <KpiCard label="Returning" value={num(ta.returningUsers)} tint="text-emerald-600" />
                  <KpiCard label="Repeat Booking Rate" value={pct(ta.repeatBookingRate)} tint="text-emerald-700" />
                  <KpiCard label="Wallet Usage" value={inr(ta.walletUsage)} Ico={Wallet} />
                  <KpiCard label="Credits Redeemed" value={num(ta.creditsRedeemed)} Ico={Sparkles} />
                  <KpiCard label="Referral Participation" value={num(ta.referralParticipation)} Ico={Gift} />
                  <KpiCard label="Avg Spending / Traveler" value={inr(ta.averageSpending)} />
                  <KpiCard label="Active Travelers" value={num(ta.activeTravelersInRange)} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card title="Favorite Destinations">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ta.favoriteDestinations} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" fontSize={10} />
                          <YAxis type="category" dataKey="name" fontSize={10} width={90} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card title="Top Travelers">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase text-muted-foreground font-semibold"><tr><th className="text-left py-2">Traveler</th><th className="text-right py-2">Bookings</th><th className="text-right py-2">Spend</th></tr></thead>
                        <tbody>
                          {ta.topTravelers.map((t) => (
                            <tr key={t.id} className="border-t">
                              <td className="py-2"><div className="font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.email}</div></td>
                              <td className="py-2 text-right">{t.bookings}</td>
                              <td className="py-2 text-right font-semibold text-emerald-700">{inr(t.spend)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {tab === 'hosts' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="Pending Payouts" value={inr(ha.pendingPayouts)} tint="text-amber-600" />
                  <KpiCard label="Paid Payouts" value={inr(ha.paidPayouts)} tint="text-emerald-700" />
                  <KpiCard label="Avg Host Earnings" value={inr(ha.averageHostEarnings)} />
                  <KpiCard label="Response Rate" value={pct(ha.averageResponseRate)} tint="text-emerald-600" />
                  <KpiCard label="Rejection Rate" value={pct(ha.hostRejectionRate)} tint="text-rose-500" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card title="Top Earning Hosts">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase text-muted-foreground font-semibold"><tr><th className="text-left py-2">Host</th><th className="text-right py-2">Bookings</th><th className="text-right py-2">Net</th></tr></thead>
                        <tbody>
                          {ha.topEarningHosts.map((h) => (
                            <tr key={h.id} className="border-t">
                              <td className="py-2"><div className="font-semibold">{h.name}</div><div className="text-xs text-muted-foreground">{h.email}</div></td>
                              <td className="py-2 text-right">{h.bookings}</td>
                              <td className="py-2 text-right font-semibold text-emerald-700">{inr(h.net)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  <Card title="Highest Rated Hosts">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase text-muted-foreground font-semibold"><tr><th className="text-left py-2">Host</th><th className="text-right py-2">Reviews</th><th className="text-right py-2">Rating</th></tr></thead>
                        <tbody>
                          {ha.highestRatedHosts.map((h) => (
                            <tr key={h.id} className="border-t">
                              <td className="py-2">{h.name}</td>
                              <td className="py-2 text-right">{h.reviews}</td>
                              <td className="py-2 text-right font-semibold">⭐ {h.avgRating.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {tab === 'listings' && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card title="Most Booked Listings">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase text-muted-foreground font-semibold"><tr><th className="text-left py-2">Listing</th><th className="text-right py-2">Bookings</th><th className="text-right py-2">Views</th></tr></thead>
                        <tbody>
                          {la.mostBooked.map((l) => (
                            <tr key={l.id} className="border-t">
                              <td className="py-2"><div className="font-semibold truncate">{l.title}</div><div className="text-[10px] text-muted-foreground">{l.district}</div></td>
                              <td className="py-2 text-right">{l.bookings}</td>
                              <td className="py-2 text-right">{l.views}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  <Card title="Most Viewed (approx via wishlist)">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase text-muted-foreground font-semibold"><tr><th className="text-left py-2">Listing</th><th className="text-right py-2">Views</th></tr></thead>
                        <tbody>
                          {la.mostViewed.map((l) => (
                            <tr key={l.id} className="border-t"><td className="py-2 truncate">{l.title}</td><td className="py-2 text-right">{l.views}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  <Card title="Highest Conversion (≥3 views)">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase text-muted-foreground font-semibold"><tr><th className="text-left py-2">Listing</th><th className="text-right py-2">Conv %</th></tr></thead>
                        <tbody>
                          {la.highestConversion.map((l) => (
                            <tr key={l.id} className="border-t"><td className="py-2 truncate">{l.title}</td><td className="py-2 text-right font-semibold text-emerald-700">{l.conversion.toFixed(1)}%</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  <Card title="Listings with No Bookings">
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase text-muted-foreground font-semibold sticky top-0 bg-white"><tr><th className="text-left py-2">Listing</th><th className="text-right py-2">Views</th></tr></thead>
                        <tbody>
                          {la.noBookings.map((l) => (
                            <tr key={l.id} className="border-t"><td className="py-2 truncate">{l.title}</td><td className="py-2 text-right">{l.views}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  <Card title="Category Performance">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={la.categoryPerformance}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="category" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card title="District Performance">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={la.districtPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" fontSize={10} />
                          <YAxis type="category" dataKey="district" fontSize={10} width={100} />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#059669" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {tab === 'marketing' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="Coupon Uses" value={num(ma.couponUsageCount)} Ico={Gift} />
                  <KpiCard label="Coupon Discount" value={inr(ma.couponDiscount)} tint="text-rose-500" />
                  <KpiCard label="Active Promotions" value={`${ma.promotionsActive} / ${ma.promotionsTotal}`} />
                  <KpiCard label="Referrals (Range)" value={num(ma.referralsInRange)} Ico={Gift} />
                  <KpiCard label="Referral Rewards" value={inr(ma.referralRewardAmount)} tint="text-emerald-700" />
                  <KpiCard label="Credits Redeemed" value={num(ma.creditsRedeemed)} Ico={Sparkles} />
                  <KpiCard label="Wallet Payments" value={num(ma.walletPaymentsCount)} Ico={Wallet} />
                  <KpiCard label="Coupon ROI" value={`${ma.couponROI}x`} tint="text-emerald-700" />
                </div>
              </>
            )}

            {tab === 'ai' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="Total AI Trip Plans" value={num(ai.totalPlans)} Ico={Bot} />
                  <KpiCard label="Plans (Range)" value={num(ai.plansInRange)} tint="text-emerald-600" />
                  <KpiCard label="AI → Booking Conversion" value={pct(ai.conversionToBooking)} tint="text-emerald-700" />
                  <KpiCard label="Bookings from AI Plans" value={num(ai.bookingsFromPlan)} tint="text-blue-600" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card title="Most Searched Destinations">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ai.topDestinations} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" fontSize={10} />
                          <YAxis type="category" dataKey="name" fontSize={10} width={100} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card title="Popular Itinerary Types">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={ai.popularTypes} dataKey="count" nameKey="name" outerRadius={90} label>
                            {ai.popularTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend fontSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card title="Popular Travel Months">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ai.popularMonths}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="bucket" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {tab === 'reports' && (
              <Card title="Export Reports (CSV)">
                <p className="text-sm text-muted-foreground mb-4">Exports use the currently selected date range and filters.</p>
                <div className="grid md:grid-cols-3 gap-3">
                  {REPORTS.map((r) => (
                    <Button key={r.id} onClick={() => exportReport(r.id)} disabled={exporting === r.id} variant="outline" className="rounded-full justify-start">
                      {exporting === r.id ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
                      {r.label}
                    </Button>
                  ))}
                </div>
                <div className="mt-6 text-xs text-muted-foreground">
                  Excel-compatible: CSV files open natively in Excel, Google Sheets, and Numbers.
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin', 'super_admin']}><AnalyticsInner /></ProtectedRoute>;
}
