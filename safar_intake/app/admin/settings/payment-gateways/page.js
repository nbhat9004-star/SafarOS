'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Save, TestTube, Trash2, Power, Loader2, Lock,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldCheck, KeyRound,
  ClipboardCopy, History, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const PROVIDERS = [
  { id: 'razorpay', name: 'Razorpay', supported: true, currencies: ['INR'] },
  { id: 'stripe', name: 'Stripe', supported: false, currencies: ['USD', 'EUR', 'GBP', 'INR'] },
  { id: 'paypal', name: 'PayPal', supported: false, currencies: ['USD', 'EUR', 'GBP'] },
  { id: 'phonepe', name: 'PhonePe', supported: false, currencies: ['INR'] },
  { id: 'cashfree', name: 'Cashfree', supported: false, currencies: ['INR'] },
  { id: 'ccavenue', name: 'CCAvenue', supported: false, currencies: ['INR'] },
  { id: 'manual_bank_transfer', name: 'Manual Bank Transfer', supported: false, currencies: ['INR'] },
];

const REFUND_MODES = [
  { id: 'auto', label: 'Automatic' },
  { id: 'manual', label: 'Manual approval' },
  { id: 'disabled', label: 'Disabled' },
];

const emptyForm = {
  provider: 'razorpay',
  providerName: 'Razorpay',
  enabled: false,
  mode: 'test',
  keyId: '',
  keySecret: '',
  webhookSecret: '',
  currency: 'INR',
  country: 'IN',
  paymentTimeout: 300,
  autoCapture: true,
  refundMode: 'manual',
  // Module 10.1 — commercial flags
  bookingFeeEnabled: false,
  bookingFeeAmount: 0,
  onlinePaymentDiscount: 0,
  enableWallet: false,
  enableSafarCredits: false,
};

function StatusBadge({ status, enabled }) {
  const map = {
    configured: { c: 'bg-emerald-50 text-emerald2 border-emerald-200', i: CheckCircle2, label: 'Configured' },
    not_configured: { c: 'bg-amber-50 text-amber-700 border-amber-200', i: AlertTriangle, label: 'Not configured' },
    invalid: { c: 'bg-rose-50 text-rose-600 border-rose-200', i: XCircle, label: 'Invalid credentials' },
    error: { c: 'bg-rose-50 text-rose-600 border-rose-200', i: XCircle, label: 'Error' },
    not_supported: { c: 'bg-secondary text-muted-foreground border-border', i: AlertTriangle, label: 'Not supported' },
  };
  const m = map[status] || map.not_configured;
  const Ico = m.i;
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${m.c}`}>
        <Ico className="size-3" /> {m.label}
      </span>
      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${enabled ? 'bg-emerald-50 text-emerald2 border-emerald-200' : 'bg-secondary text-muted-foreground border-border'}`}>
        <Power className="size-3" /> {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

function PaymentGatewaysInner() {
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // gateway object or null (new)
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({}); // { [id]: bool }
  const [auditFor, setAuditFor] = useState(null); // gatewayId
  const [audit, setAudit] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-gateways', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setGateways(data.gateways || []);
      else toast.error(data.error || 'Failed to load gateways');
    } catch (e) { toast.error('Failed to load gateways'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (gw) => {
    setEditing(gw);
    setForm({
      provider: gw.provider,
      providerName: gw.providerName || gw.provider,
      enabled: !!gw.enabled,
      mode: gw.mode || 'test',
      keyId: gw.keyId || '',
      keySecret: '', // leave blank; only update if user types
      webhookSecret: '',
      currency: gw.currency || 'INR',
      country: gw.country || 'IN',
      paymentTimeout: gw.paymentTimeout || 300,
      autoCapture: gw.autoCapture !== false,
      refundMode: gw.refundMode || 'manual',
      bookingFeeEnabled: !!gw.bookingFeeEnabled,
      bookingFeeAmount: Number(gw.bookingFeeAmount) || 0,
      onlinePaymentDiscount: Number(gw.onlinePaymentDiscount) || 0,
      enableWallet: !!gw.enableWallet,
      enableSafarCredits: !!gw.enableSafarCredits,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.provider) return toast.error('Provider is required');
    if (!form.keyId) return toast.error('Key ID is required');
    if (!editing && !form.keySecret) return toast.error('Key Secret is required');
    setSaving(true);
    try {
      const url = editing ? `/api/admin/payment-gateways/${editing.id}` : '/api/admin/payment-gateways';
      const method = editing ? 'PUT' : 'POST';
      // On update, only send secrets if the user actually typed a new value.
      const payload = { ...form };
      if (editing && !form.keySecret) delete payload.keySecret;
      if (editing && !form.webhookSecret) delete payload.webhookSecret;
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) { toast.error(data.error || 'Save failed'); setSaving(false); return; }
      toast.success(editing ? 'Gateway updated' : 'Gateway configured');
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const testConn = async (id) => {
    setTesting((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`/api/admin/payment-gateways/${id}/test-connection`, {
        method: 'POST', credentials: 'include',
      });
      const data = await res.json();
      if (data.ok && data.result?.ok) toast.success(data.result.message || 'Connection verified');
      else toast.error(data.result?.message || data.error || 'Connection test failed');
      load();
    } catch (e) { toast.error('Test failed'); }
    setTesting((s) => ({ ...s, [id]: false }));
  };

  const toggle = async (id, next) => {
    try {
      const res = await fetch(`/api/admin/payment-gateways/${id}/toggle`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!data.ok) return toast.error(data.error || 'Toggle failed');
      toast.success(next ? 'Gateway enabled' : 'Gateway disabled');
      load();
    } catch (e) { toast.error('Toggle failed'); }
  };

  const remove = async (id, providerName) => {
    if (!confirm(`Delete ${providerName || 'this gateway'} configuration? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/payment-gateways/${id}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json();
      if (!data.ok) return toast.error(data.error || 'Delete failed');
      toast.success('Gateway removed');
      load();
    } catch (e) { toast.error('Delete failed'); }
  };

  const loadAudit = async (id) => {
    setAuditFor(id);
    setAudit([]);
    try {
      const res = await fetch(`/api/admin/payment-gateways/${id}/audit`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setAudit(data.events || []);
    } catch (e) {}
  };

  const providerMeta = useMemo(() => PROVIDERS.find(p => p.id === form.provider) || PROVIDERS[0], [form.provider]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-6xl">
        <Button asChild variant="ghost" size="sm" className="rounded-full mb-6 -ml-2">
          <Link href="/admin"><ArrowLeft className="size-4 mr-2" /> Back to Admin</Link>
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2">
              <ShieldCheck className="size-3.5" /> Super Admin · Settings
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-2 flex items-center gap-3">
              <CreditCard className="size-9 text-emerald2" /> Payment Gateways
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Configure payment providers used across the platform. Credentials are encrypted at
              rest, masked in the UI, and never exposed to non-super-admin roles. All changes are
              audited.
            </p>
          </div>
          <Button onClick={openNew} className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold">
            <Plus className="size-4 mr-2" /> Add Provider
          </Button>
        </div>

        {loading && (
          <div className="py-20 grid place-items-center">
            <Loader2 className="size-8 animate-spin text-emerald2" />
          </div>
        )}

        {!loading && gateways.length === 0 && !showForm && (
          <div className="p-10 border rounded-3xl bg-white text-center">
            <Lock className="size-8 mx-auto text-emerald2" />
            <div className="font-display text-xl font-bold mt-3">No payment gateway configured</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Add a provider to start accepting payments. Only Super Admins can view or change these settings.
            </p>
            <Button onClick={openNew} className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep">
              <Plus className="size-4 mr-2" /> Configure Razorpay
            </Button>
          </div>
        )}

        {!loading && gateways.length > 0 && (
          <div className="grid gap-4">
            {gateways.map((gw) => (
              <div key={gw.id} className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="font-display text-2xl font-bold capitalize">{gw.providerName || gw.provider}</div>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${gw.mode === 'live' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {gw.mode === 'live' ? 'LIVE' : 'TEST'}
                      </span>
                      <StatusBadge status={gw.status} enabled={gw.enabled} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Key ID</div>
                        <div className="font-mono text-xs mt-0.5 break-all">{gw.keyId || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Key Secret</div>
                        <div className="font-mono text-xs mt-0.5">{gw.keySecretMasked || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Webhook Secret</div>
                        <div className="font-mono text-xs mt-0.5">{gw.webhookSecretMasked || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Currency / Country</div>
                        <div className="text-xs mt-0.5">{gw.currency} · {gw.country}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Payment Timeout</div>
                        <div className="text-xs mt-0.5">{gw.paymentTimeout}s</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Auto Capture</div>
                        <div className="text-xs mt-0.5">{gw.autoCapture ? 'On' : 'Off'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Refund Mode</div>
                        <div className="text-xs mt-0.5 capitalize">{gw.refundMode || 'manual'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Last Updated</div>
                        <div className="text-xs mt-0.5">
                          {gw.updatedAt ? new Date(gw.updatedAt).toLocaleString('en-IN') : '—'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">by {gw.updatedByName || '—'}</div>
                      </div>
                    </div>
                    {/* Commercial flags summary */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {gw.bookingFeeEnabled && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald2 border-emerald-200">
                          Booking Fee{Number(gw.bookingFeeAmount) > 0 ? ` · ${gw.currency} ${gw.bookingFeeAmount}` : ''}
                        </span>
                      )}
                      {Number(gw.onlinePaymentDiscount) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                          Online Pay Discount · {gw.onlinePaymentDiscount}%
                        </span>
                      )}
                      {gw.enableWallet && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border bg-secondary text-charcoal border-border">
                          Wallet
                        </span>
                      )}
                      {gw.enableSafarCredits && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border bg-secondary text-charcoal border-border">
                          Safar Credits
                        </span>
                      )}
                    </div>
                    {gw.lastTestResult && (
                      <div className={`mt-3 text-xs p-2.5 rounded-lg border ${gw.lastTestResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald2' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                        <span className="font-semibold">Last test:</span> {gw.lastTestResult.message}
                        {' · '}
                        <span className="opacity-70">{new Date(gw.lastTestResult.at).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch md:min-w-[180px]">
                    <Button onClick={() => testConn(gw.id)} disabled={!!testing[gw.id]} size="sm" variant="outline" className="rounded-full">
                      {testing[gw.id] ? <Loader2 className="size-4 mr-2 animate-spin" /> : <TestTube className="size-4 mr-2" />}
                      Test Connection
                    </Button>
                    <Button onClick={() => toggle(gw.id, !gw.enabled)} size="sm" variant="outline" className="rounded-full">
                      <Power className="size-4 mr-2" /> {gw.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button onClick={() => openEdit(gw)} size="sm" variant="outline" className="rounded-full">
                      <KeyRound className="size-4 mr-2" /> Edit
                    </Button>
                    <Button onClick={() => loadAudit(gw.id)} size="sm" variant="ghost" className="rounded-full">
                      <History className="size-4 mr-2" /> Audit
                    </Button>
                    <Button onClick={() => remove(gw.id, gw.providerName)} size="sm" variant="ghost" className="rounded-full text-rose-600 hover:bg-rose-50">
                      <Trash2 className="size-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>

                {auditFor === gw.id && (
                  <div className="mt-5 pt-5 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold flex items-center gap-2"><History className="size-4" /> Audit history</div>
                      <button onClick={() => { setAuditFor(null); setAudit([]); }} className="text-xs text-muted-foreground hover:text-charcoal">Close</button>
                    </div>
                    {audit.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-3">No audit events yet.</div>
                    ) : (
                      <ul className="space-y-2">
                        {audit.map((e) => (
                          <li key={e.id} className="text-xs flex items-start gap-3 p-2 rounded-lg bg-secondary/40">
                            <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(e.timestamp).toLocaleString('en-IN')}
                            </span>
                            <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full bg-white border">{e.action}</span>
                            <span className="text-muted-foreground">by {e.actorName || e.actorEmail || 'super_admin'}</span>
                            {e.note && <span className="text-charcoal/80">— {e.note}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Editor Panel */}
        {showForm && (
          <div className="mt-8 rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <KeyRound className="size-5 text-emerald2" />
                {editing ? `Edit ${editing.providerName || editing.provider}` : 'Add Payment Provider'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} className="text-sm text-muted-foreground hover:text-charcoal">Cancel</button>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Provider">
                <select
                  disabled={!!editing}
                  value={form.provider}
                  onChange={(e) => {
                    const p = e.target.value;
                    const meta = PROVIDERS.find(x => x.id === p);
                    setForm({ ...form, provider: p, providerName: meta?.name || p, currency: meta?.currencies?.[0] || form.currency });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{!p.supported ? ' (test-connection not yet implemented)' : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Provider display name">
                <input
                  value={form.providerName}
                  onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm"
                />
              </Field>

              <Field label="Mode">
                <div className="flex gap-2">
                  {['test','live'].map(m => (
                    <button key={m} type="button" onClick={() => setForm({ ...form, mode: m })}
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold uppercase tracking-wider ${form.mode === m ? 'bg-emerald2 text-white border-emerald2' : 'bg-white text-charcoal hover:border-emerald2'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Enabled">
                <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="size-4 accent-emerald-600" />
                  <span className="text-sm text-muted-foreground">Ready to accept payments</span>
                </label>
              </Field>

              <Field label={`Key ID${form.provider === 'razorpay' ? ' (e.g. rzp_test_xxx / rzp_live_xxx)' : ''}`}>
                <input
                  value={form.keyId}
                  onChange={(e) => setForm({ ...form, keyId: e.target.value })}
                  placeholder={form.provider === 'razorpay' ? 'rzp_test_XXXXXXXXXXXX' : 'Public / API key'}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm font-mono"
                />
              </Field>

              <Field label={`Key Secret ${editing ? '(leave blank to keep current)' : ''}`}>
                <input
                  type="password"
                  value={form.keySecret}
                  onChange={(e) => setForm({ ...form, keySecret: e.target.value })}
                  placeholder={editing ? '••••••••' : 'Secret key'}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm font-mono"
                />
              </Field>

              <Field label={`Webhook Secret ${editing ? '(leave blank to keep current)' : '(optional)'}`}>
                <input
                  type="password"
                  value={form.webhookSecret}
                  onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                  placeholder={editing ? '••••••••' : 'Signing secret'}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm font-mono"
                />
              </Field>

              <Field label="Default Currency">
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm"
                >
                  {(providerMeta.currencies || ['INR','USD','EUR','GBP']).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="Country (ISO)">
                <input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm uppercase"
                />
              </Field>

              <Field label="Payment Timeout (seconds)">
                <input
                  type="number"
                  value={form.paymentTimeout}
                  onChange={(e) => setForm({ ...form, paymentTimeout: Number(e.target.value) })}
                  min={30}
                  max={3600}
                  className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm"
                />
              </Field>

              <Field label="Auto Capture">
                <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={form.autoCapture}
                    onChange={(e) => setForm({ ...form, autoCapture: e.target.checked })}
                    className="size-4 accent-emerald-600" />
                  <span className="text-sm text-muted-foreground">Capture immediately after authorization</span>
                </label>
              </Field>

              <Field label="Refund Mode">
                <div className="flex gap-2 flex-wrap">
                  {REFUND_MODES.map(r => (
                    <button key={r.id} type="button" onClick={() => setForm({ ...form, refundMode: r.id })}
                      className={`px-4 py-2 rounded-full border text-xs font-semibold ${form.refundMode === r.id ? 'bg-emerald2 text-white border-emerald2' : 'bg-white text-charcoal hover:border-emerald2'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Commercial flags — Module 10.1 */}
            <div className="mt-8">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald2 font-semibold mb-3">Commercial Options</div>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Booking Fee">
                  <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={form.bookingFeeEnabled}
                      onChange={(e) => setForm({ ...form, bookingFeeEnabled: e.target.checked })}
                      className="size-4 accent-emerald-600" />
                    <span className="text-sm text-muted-foreground">Charge a booking fee</span>
                  </label>
                </Field>

                <Field label={`Booking Fee Amount (${form.currency})`}>
                  <input
                    type="number"
                    disabled={!form.bookingFeeEnabled}
                    value={form.bookingFeeAmount}
                    onChange={(e) => setForm({ ...form, bookingFeeAmount: Number(e.target.value) })}
                    min={0}
                    step="1"
                    className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm disabled:bg-secondary/50 disabled:text-muted-foreground"
                  />
                </Field>

                <Field label="Online Payment Discount (%)">
                  <input
                    type="number"
                    value={form.onlinePaymentDiscount}
                    onChange={(e) => setForm({ ...form, onlinePaymentDiscount: Number(e.target.value) })}
                    min={0}
                    max={100}
                    step="0.5"
                    className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm"
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">Discount applied when guest pays online. Set to 0 to disable.</div>
                </Field>

                <Field label="Wallet & Credits">
                  <div className="space-y-2 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.enableWallet}
                        onChange={(e) => setForm({ ...form, enableWallet: e.target.checked })}
                        className="size-4 accent-emerald-600" />
                      <span className="text-sm">Enable Wallet payments</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.enableSafarCredits}
                        onChange={(e) => setForm({ ...form, enableSafarCredits: e.target.checked })}
                        className="size-4 accent-emerald-600" />
                      <span className="text-sm">Enable Safar Credits</span>
                    </label>
                  </div>
                </Field>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <Lock className="size-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Secrets are encrypted at rest (AES-256-GCM) and never returned in API responses.</div>
                The client only ever sees a masked preview (first 4 + last 2 chars). All changes are recorded in the audit log.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <Button onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} variant="outline" className="rounded-full">Cancel</Button>
              <Button onClick={save} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold">
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                {editing ? 'Update' : 'Save'} Provider
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{label}</div>
      {children}
    </label>
  );
}

export default function App() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <PaymentGatewaysInner />
    </ProtectedRoute>
  );
}
