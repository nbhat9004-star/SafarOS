'use client';
import { useEffect, useState } from 'react';
import { Loader2, Save, Building2, CreditCard, Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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

const VerificationBadge = ({ s }) => {
  const map = {
    pending: { label: 'Pending Verification', cls: 'bg-amber-50 text-amber-700 border-amber-200', Ico: AlertCircle },
    verified: { label: 'Verified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Ico: CheckCircle2 },
    rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-600 border-rose-200', Ico: XCircle },
  };
  const cfg = map[s] || map.pending;
  const Ico = cfg.Ico;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <Ico className="size-3" />
      {cfg.label}
    </span>
  );
};

export default function HostPayoutSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    accountHolder: '', bankName: '', accountNumber: '', ifsc: '', upi: '', pan: '', gst: '', isDisabled: false,
  });
  const [verificationStatus, setVerificationStatus] = useState('pending');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/host/payout-settings', { credentials: 'include' });
      const d = await r.json();
      if (d.ok && d.settings) {
        setForm({
          accountHolder: d.settings.accountHolder || '',
          bankName: d.settings.bankName || '',
          accountNumber: d.settings.accountNumber || '',
          ifsc: d.settings.ifsc || '',
          upi: d.settings.upi || '',
          pan: d.settings.pan || '',
          gst: d.settings.gst || '',
          isDisabled: !!d.settings.isDisabled,
        });
        setVerificationStatus(d.settings.verificationStatus || 'pending');
      } else {
        setEditing(true);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.accountHolder.trim()) { toast.error('Account holder name is required'); return; }
    if (!form.upi.trim() && (!form.accountNumber.trim() || !form.ifsc.trim())) {
      toast.error('Provide either a UPI ID or Bank Account + IFSC');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/host/payout-settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.ok) {
        toast.success('Payout settings saved');
        setEditing(false);
        load();
      } else {
        toast.error(d.error || 'Failed to save');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDisable = async () => {
    const next = { ...form, isDisabled: !form.isDisabled };
    setForm(next);
    setSaving(true);
    try {
      const r = await fetch('/api/host/payout-settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const d = await r.json();
      if (d.ok) toast.success(next.isDisabled ? 'Payouts disabled' : 'Payouts enabled');
      else toast.error(d.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <div className="font-display text-xl font-bold flex items-center gap-2">
              <Building2 className="size-5 text-emerald2" /> Payout Settings
            </div>
            <div className="text-sm text-muted-foreground mt-1">Bank account and UPI details for receiving earnings.</div>
          </div>
          <div className="flex items-center gap-2">
            <VerificationBadge s={verificationStatus} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Account Holder Name *">
            <Input value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="As per bank records" disabled={!editing} />
          </Field>
          <Field label="Bank Name">
            <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. HDFC Bank" disabled={!editing} />
          </Field>
          <Field label="Account Number" hint={!editing ? 'Masked for security' : undefined}>
            <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="12345678901234" disabled={!editing} />
          </Field>
          <Field label="IFSC Code">
            <Input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} placeholder="HDFC0001234" disabled={!editing} />
          </Field>
          <Field label="UPI ID">
            <Input value={form.upi} onChange={(e) => setForm({ ...form, upi: e.target.value })} placeholder="yourname@upi" disabled={!editing} />
          </Field>
          <Field label="PAN (optional)">
            <Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" disabled={!editing} />
          </Field>
          <Field label="GST Number (optional)">
            <Input value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value.toUpperCase() })} placeholder="27ABCDE1234F1Z5" disabled={!editing} />
          </Field>
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-4 text-emerald2" />
            <span>Your banking details are encrypted and only visible to authorized finance admins.</span>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <Button onClick={() => setEditing(true)} variant="outline" className="rounded-full">Edit</Button>
                <Button onClick={toggleDisable} disabled={saving} variant={form.isDisabled ? 'default' : 'outline'} className={`rounded-full ${form.isDisabled ? 'bg-emerald2 hover:bg-emerald2-deep' : ''}`}>
                  {form.isDisabled ? 'Enable Payouts' : 'Disable Payouts'}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => { setEditing(false); load(); }} variant="outline" className="rounded-full">Cancel</Button>
                <Button onClick={save} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                  {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                  Save Details
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {form.isDisabled && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900 text-sm">Payouts are currently disabled</div>
            <div className="text-xs text-amber-700 mt-0.5">Your available earnings will accumulate but will not be sent out until you re-enable payouts.</div>
          </div>
        </div>
      )}
    </div>
  );
}
