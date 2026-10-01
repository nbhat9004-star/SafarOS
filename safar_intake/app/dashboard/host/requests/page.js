'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Check, X, Clock, Loader2, MapPin, Calendar, Users, Wallet, ArrowLeft, Inbox, Bell, RefreshCw, Sparkles
} from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

function fmtSecs(secs) {
  if (!secs || secs <= 0) return 'Expired';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function Countdown({ deadlineAt }) {
  const [rem, setRem] = useState(() => Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => setRem(Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [deadlineAt]);
  const pct = Math.max(0, Math.min(100, (rem / 300) * 100));
  const urgent = rem < 60;
  return (
    <div className="mt-2">
      <div className="h-1 rounded-full bg-amber-100 overflow-hidden">
        <div className={`h-full transition-all ${urgent ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`text-[10px] mt-0.5 inline-flex items-center gap-1 ${urgent ? 'text-red-600' : 'text-amber-700'}`}>
        <Clock className="size-3" /> {rem <= 0 ? 'Deadline passed' : `${fmtSecs(rem)} to respond`}
      </div>
    </div>
  );
}

function RequestsInner() {
  const [tab, setTab] = useState('pending'); // pending | accepted | rejected | all
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [quoteState, setQuoteState] = useState({}); // { [reqId]: { unitPrice, quantity } }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/host/provider-requests?status=${tab}`, { credentials: 'include' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed');
      setData(json);
    } catch (e) { toast.error(e.message || 'Failed to load'); setData({ requests: [] }); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (tab !== 'pending') return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [tab, load]);

  const act = async (id, action, quote) => {
    setBusyId(id + ':' + action);
    try {
      const res = await fetch(`/api/provider-requests/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'accept' && quote ? JSON.stringify(quote) : undefined,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || `Failed to ${action}`);
      toast.success(action === 'accept' ? 'Request accepted — traveler notified' : 'Request declined');
      load();
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setBusyId(null); }
  };

  const tabs = [
    { key: 'pending',  label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all',      label: 'All' },
  ];

  const list = data?.requests || [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/20 via-white to-white">
      <Navbar />
      <div className="pt-24 container pb-16">
        <Link href="/dashboard/host" className="text-sm text-muted-foreground hover:text-charcoal inline-flex items-center gap-1"><ArrowLeft className="size-3.5" /> Host dashboard</Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald2 text-[11px] uppercase tracking-wider font-semibold border border-emerald-200">
              <Sparkles className="size-3.5" /> Live booking requests
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Provider requests</h1>
            <p className="text-sm text-muted-foreground mt-1">Travelers built trips using Safar's orchestrator. Accept within <span className="font-semibold text-charcoal">5 minutes</span> to lock in the booking.</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={load}><RefreshCw className="size-3.5 mr-1" /> Refresh</Button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition ${tab === t.key ? 'bg-emerald2 text-white shadow' : 'bg-white border text-charcoal hover:border-emerald2'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {data === null ? (
          <div className="mt-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-secondary animate-pulse" />)}</div>
        ) : list.length === 0 ? (
          <div className="mt-8 p-10 rounded-3xl border bg-white/70 text-center">
            <Inbox className="size-8 text-muted-foreground mx-auto" />
            <div className="mt-3 font-display text-xl font-bold">No {tab === 'all' ? '' : tab} requests</div>
            <div className="text-sm text-muted-foreground mt-1">You'll be notified instantly when a traveler's trip matches your listing.</div>
          </div>
        ) : (
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {list.map(r => (
                <motion.div key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {r.listingImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.listingImage} alt="" className="size-16 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="size-16 rounded-xl bg-secondary shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald2 text-[10px] font-semibold border border-emerald-200 uppercase tracking-wider">{r.serviceLabel}</span>
                        <StatusPill status={r.status} />
                      </div>
                      <div className="font-display font-bold mt-1.5 truncate">{r.listingTitle}</div>
                      {r.serviceName && r.serviceName !== r.serviceLabel ? (
                        <div className="text-[11px] text-charcoal/80 truncate">Service: <span className="font-semibold">{r.serviceName}</span></div>
                      ) : null}
                      <div className="text-[11px] text-muted-foreground truncate">Requested by <span className="font-semibold text-charcoal">{r.travelerName}</span></div>

                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" /> {r.snapshot?.destination || '—'}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Calendar className="size-3" /> {r.snapshot?.startDate} → {r.snapshot?.endDate}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="size-3" /> {r.snapshot?.guests || 1} guest{(r.snapshot?.guests || 1) !== 1 ? 's' : ''}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Wallet className="size-3" /> ₹{Number(r.price || 0).toLocaleString('en-IN')} · {r.snapshot?.budgetLabel || '—'}</span>
                      </div>

                      {r.snapshot?.preferences && Object.keys(r.snapshot.preferences).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(r.snapshot.preferences).slice(0, 6).map(([k, v]) => (
                            <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/60 text-charcoal/80 text-[10px] border">
                              <span className="text-muted-foreground">{k}:</span> {Array.isArray(v) ? v.slice(0, 2).join(', ') : String(v)}
                            </span>
                          ))}
                        </div>
                      )}

                      {r.status === 'pending' && r.deadlineAt && <Countdown deadlineAt={r.deadlineAt} />}
                    </div>
                  </div>

                  {r.status === 'pending' && r.source === 'circle' && (
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald2">Your quote</div>
                      {(() => {
                        const q = quoteState[r.id] || {};
                        const unitPrice = q.unitPrice ?? (r.unitPrice ?? '');
                        const quantity = q.quantity ?? (r.suggestedQuantity ?? 1);
                        const total = (Number(unitPrice) || 0) * (Number(quantity) || 0);
                        const setQ = (patch) => setQuoteState((s) => ({ ...s, [r.id]: { unitPrice, quantity, ...s[r.id], ...patch } }));
                        return (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[12px] text-muted-foreground">₹</span>
                              <input type="number" min={0} value={unitPrice} onChange={(e) => setQ({ unitPrice: e.target.value })} placeholder="Unit price" className="w-24 rounded-lg border border-slate-200 px-2 h-9 text-[13px] outline-none focus:border-emerald2" />
                            </div>
                            <span className="text-[12px] text-muted-foreground">×</span>
                            <input type="number" min={1} value={quantity} onChange={(e) => setQ({ quantity: e.target.value })} className="w-16 rounded-lg border border-slate-200 px-2 h-9 text-[13px] outline-none focus:border-emerald2" />
                            <span className="text-[11px] text-muted-foreground">{(r.pricingUnit || 'custom').replace('per_', '/ ').replace('_', ' ')}</span>
                            <span className="ml-auto text-[13px] font-bold text-charcoal">₹{total.toLocaleString('en-IN')}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {r.status === 'pending' && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button size="sm" onClick={() => {
                        const q = quoteState[r.id] || {};
                        const unitPrice = Number(q.unitPrice ?? r.unitPrice ?? 0) || 0;
                        const quantity = Number(q.quantity ?? r.suggestedQuantity ?? 1) || 1;
                        act(r.id, 'accept', r.source === 'circle' ? { unitPrice, quantity, pricingUnit: r.pricingUnit } : undefined);
                      }} disabled={!!busyId} className="rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold">
                        {busyId === r.id + ':accept' ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4 mr-1" /> Accept</>}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => act(r.id, 'reject')} disabled={!!busyId} className="rounded-full font-semibold">
                        {busyId === r.id + ':reject' ? <Loader2 className="size-4 animate-spin" /> : <><X className="size-4 mr-1" /> Reject</>}
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function StatusPill({ status }) {
  const map = {
    pending:  { label: 'Pending',  tone: 'bg-amber-50 text-amber-700 border-amber-200' },
    accepted: { label: 'Accepted', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Rejected', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
    expired:  { label: 'Expired',  tone: 'bg-secondary text-muted-foreground border-border' },
  };
  const m = map[status] || { label: status, tone: 'bg-secondary text-muted-foreground border-border' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.tone}`}>{m.label}</span>;
}

export default function App() {
  return <ProtectedRoute roles={['host', 'admin', 'super_admin']}><RequestsInner /></ProtectedRoute>;
}
