'use client';

/**
 * Become a Safar Host / Service Provider — SEPARATE application flow from the
 * Trip Creator program. Persists the application to MongoDB via /api/provider/*
 * (securely scoped to the authenticated user.id) and reuses the existing
 * `host` role + admin approval queue + AuthGate/AuthModal. Approved providers
 * get access to the existing /dashboard/host — no new dashboard is created.
 */
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Loader2, Home, Users, Award, BadgeCheck, FileText, Clock, LayoutDashboard } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import AuthGate from '@/components/safar/AuthGate';
import { useAuth } from '@/lib/auth-context';
import { PROVIDER_CATEGORIES } from '@/lib/provider-categories';
import { toast } from 'sonner';

const AuthModal = dynamic(() => import('@/components/safar/AuthModal'), { ssr: false });

const DRAFT_KEY = (uid) => `safar_provider_draft_${uid || 'anon'}`;

const STEPS = [
  { icon: FileText,   title: 'Apply',            desc: 'Tell us about your service and experience.' },
  { icon: ShieldCheck, title: 'Verification',    desc: 'Identity, ownership & payout verification.' },
  { icon: BadgeCheck, title: 'Safar review',     desc: 'Our team reviews your application.' },
  { icon: Award,      title: 'Approved',         desc: 'Become a Safar Verified Service Provider.' },
  { icon: Home,       title: 'List services',    desc: 'Manage your listings in the host dashboard.' },
  { icon: Users,      title: 'Serve travelers',  desc: 'Receive requests, bookings and earnings.' },
];

const VERIFICATION = [
  'Identity verification',
  'PAN verification (where applicable)',
  'Ownership / service verification',
  'Bank verification for payouts',
];

// Status → friendly message shown to the applicant.
const STATUS_COPY = {
  submitted:    { title: 'Application submitted',            body: 'Your application has been submitted. Safar will review it shortly.' },
  under_review: { title: 'Safar is reviewing your application', body: 'Our team is reviewing the details you provided.' },
  verification: { title: "We're verifying your service details", body: 'Verification is in progress. We may reach out for more information.' },
  approved:     { title: "You're a Safar Verified Service Provider", body: 'You have been approved. Open your host dashboard to list your services.' },
  live:         { title: 'Your Safar service is live',        body: 'Your listings are live and can receive traveler requests.' },
  rejected:     { title: 'Application not approved',          body: 'Your application was not approved this time. You can update your details and re-apply.' },
};

export default function BecomeProvider() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ providerType: 'individual', category: '' });
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(null); // server record for THIS user
  const [gateOpen, setGateOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [pending, setPending] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Load the CURRENT user's application from the server (user-scoped). Runs on
  // login / logout / user-switch so one account never sees another's status.
  const loadMine = useCallback(async () => {
    if (!user?.id) { setApplication(null); return; }
    try {
      const r = await fetch('/api/provider/me', { credentials: 'include' });
      const d = await r.json();
      if (r.ok && d.ok) setApplication(d.application || null);
    } catch (e) { /* ignore */ }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      // Restore a per-user draft (non-sensitive) so entry survives refresh.
      try {
        const raw = window.localStorage.getItem(DRAFT_KEY(user?.id));
        if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }));
      } catch (e) { /* ignore */ }
      await loadMine();
      setLoaded(true);
    })();
  }, [authLoading, user?.id, loadMine]);

  // Persist draft per-user (scoped key — never shared across accounts).
  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(DRAFT_KEY(user?.id), JSON.stringify(form)); } catch (e) { /* noop */ }
  }, [form, loaded, user?.id]);

  const submit = async () => {
    if (!form.category) { toast.error('Please choose a service category'); return; }
    if (!form.fullName?.trim() || !form.email?.trim() || !form.phone?.trim()) {
      toast.error('Please add your name, email and phone');
      return;
    }
    if (!authLoading && !user) { setPending(true); setGateOpen(true); return; }
    setSubmitting(true);
    try {
      const r = await fetch('/api/provider/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, submit: true }),
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        setApplication({ ...d.application, effectiveStatus: d.application?.status });
        try { window.localStorage.removeItem(DRAFT_KEY(user?.id)); } catch (e) { /* noop */ }
        toast.success('Application submitted — pending verification');
      } else {
        toast.error(d.error || 'Could not submit. Please try again.');
      }
    } catch (e) {
      toast.error('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-resume submit after a successful sign-in / sign-up.
  useEffect(() => {
    if (user && pending && !gateOpen && !authMode) { setPending(false); submit(); }
  }, [user, pending, gateOpen, authMode]);

  const status = application?.effectiveStatus || application?.status || null;
  const showForm = !status || status === 'draft' || status === 'rejected';
  const copy = status ? STATUS_COPY[status] : null;

  return (
    <Shell>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pb-3 flex items-center gap-3">
          <Link href="/explore" className="size-10 grid place-items-center rounded-full hover:bg-slate-100 active:scale-95 transition"><ArrowLeft className="size-5" /></Link>
          <h1 className="flex-1 text-center font-display font-bold text-[17px] tracking-tight">Service Provider</h1>
          <span className="size-10" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-5">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#0A2C21] text-white p-6 md:p-8">
          <div className="absolute -top-16 -right-10 size-56 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold">🏡 Have a service travelers need?</span>
            <h2 className="mt-4 font-display font-bold text-[26px] md:text-[32px] leading-tight tracking-tight">Become a Safar<br />Host / Service Provider</h2>
            <p className="mt-2 text-[14px] text-white/80 leading-relaxed max-w-lg">List your homestay, houseboat, Shikara, car, bike, restaurant, guide service or other travel service and reach travelers on Safar.</p>
          </div>
        </div>

        {/* How it works */}
        <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">How it works</h3>
        <ol className="mt-3 space-y-2.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                <span className="relative shrink-0 size-10 grid place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5" /><span className="absolute -top-1.5 -left-1.5 size-5 grid place-items-center rounded-full bg-emerald-700 text-white text-[10px] font-bold">{i + 1}</span></span>
                <div className="min-w-0">
                  <h4 className="font-semibold text-[14px] text-slate-900">{s.title}</h4>
                  <p className="text-[12.5px] text-slate-500 leading-snug">{s.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {(!loaded || authLoading) ? (
          <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-10 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-emerald-600" />
          </div>
        ) : !showForm ? (
          /* Status card (approved / live / submitted / review / verification) */
          <div className={`mt-8 rounded-3xl border p-6 text-center ${status === 'approved' || status === 'live' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`mx-auto size-12 grid place-items-center rounded-full text-white ${status === 'approved' || status === 'live' ? 'bg-emerald-600' : 'bg-slate-500'}`}>
              {status === 'approved' || status === 'live' ? <CheckCircle2 className="size-7" /> : <Clock className="size-7" />}
            </div>
            <h3 className="mt-3 font-display font-bold text-[19px] text-slate-900">{copy?.title || 'Application received'}</h3>
            <p className="mt-1.5 text-[13.5px] text-slate-600 max-w-md mx-auto">{copy?.body}</p>
            {application?.categoryLabel ? (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-[12px] font-semibold text-slate-700">{application.categoryLabel}</span>
            ) : null}

            {(status === 'approved' || status === 'live') ? (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-bold text-emerald-800"><ShieldCheck className="size-4" /> Safar Verified Service Provider</div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {(status === 'approved' || status === 'live') ? (
                <button onClick={() => router.push('/dashboard/host')} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 text-white px-6 py-3 text-[14px] font-bold active:scale-95"><LayoutDashboard className="size-4" /> Open Host Dashboard</button>
              ) : (
                <button onClick={() => router.push('/explore')} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 text-white px-6 py-3 text-[14px] font-bold active:scale-95">Back to Explore <ArrowRight className="size-4" /></button>
              )}
            </div>
          </div>
        ) : (
          <>
            {status === 'rejected' && copy ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[13px] font-semibold text-amber-900">{copy.title}</p>
                <p className="text-[12.5px] text-amber-800/80 mt-0.5">{application?.rejectionReason || copy.body}</p>
              </div>
            ) : null}

            {/* Service category */}
            <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">What service do you provide?</h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">Choose the primary category (you can add more later).</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PROVIDER_CATEGORIES.map((c) => {
                const active = form.category === c.slug;
                return (
                  <button key={c.slug} type="button" onClick={() => set('category', c.slug)} className={`flex items-center gap-2 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${active ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                    <span className="text-[18px]">{c.icon}</span>
                    <span className={`text-[12.5px] font-semibold leading-tight ${active ? 'text-emerald-800' : 'text-slate-700'}`}>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Provider type */}
            <div className="mt-6">
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">You are applying as</label>
              <div className="flex gap-2.5">
                {[{ v: 'individual', l: 'Individual' }, { v: 'business', l: 'Business' }].map((o) => (
                  <button key={o.v} type="button" onClick={() => set('providerType', o.v)} className={`flex-1 rounded-xl border px-4 h-11 text-[13.5px] font-semibold transition active:scale-[0.98] ${form.providerType === o.v ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white text-slate-700'}`}>{o.l}</button>
                ))}
              </div>
            </div>

            {/* Person / business fields */}
            <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Your details</h3>
            <div className="mt-4 space-y-3.5">
              <Field label="Full name" v={form.fullName} onChange={(x) => set('fullName', x)} />
              <Field label={form.providerType === 'business' ? 'Business name' : 'Display / service name'} v={form.businessName} onChange={(x) => set('businessName', x)} />
              <Field label="Phone" type="tel" v={form.phone} onChange={(x) => set('phone', x)} />
              <Field label="Email" type="email" v={form.email} onChange={(x) => set('email', x)} />
              <Field label="Short description about you / your business" area v={form.description} onChange={(x) => set('description', x)} />
              <Field label="Experience / history" area v={form.experience} onChange={(x) => set('experience', x)} />
            </div>

            {/* Service fields */}
            <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Your service</h3>
            <div className="mt-4 space-y-3.5">
              <Field label="Service name" v={form.serviceName} onChange={(x) => set('serviceName', x)} />
              <Field label="Service description" area v={form.serviceDescription} onChange={(x) => set('serviceDescription', x)} />
              <Field label="Location / area" v={form.location} onChange={(x) => set('location', x)} />
              <Field label="Address or service area" v={form.address} onChange={(x) => set('address', x)} />
              <Field label="Pricing information" v={form.pricing} onChange={(x) => set('pricing', x)} placeholder="e.g. ₹2,000 / day" />
              <Field label="Availability (days / hours)" v={form.availability} onChange={(x) => set('availability', x)} placeholder="e.g. All week, 9 AM – 7 PM" />
            </div>

            {/* Verification info (workflow only) */}
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800"><ShieldCheck className="size-4 text-emerald-600" /> Verification after you apply</div>
              <ul className="mt-2.5 space-y-1.5">
                {VERIFICATION.map((v) => (
                  <li key={v} className="flex items-center gap-2 text-[12.5px] text-slate-600"><CheckCircle2 className="size-3.5 text-slate-400" /> {v}</li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] text-slate-500 leading-relaxed">You become publicly listed as <b>Safar Verified</b> only after Safar approves your application. Sensitive verification details (Aadhaar, PAN, bank) are never shown publicly. Aadhaar (where required) uses OTP verification via an authorized UIDAI provider — documents and OTPs are never stored.</p>
            </div>

            <button onClick={submit} disabled={submitting} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 text-[15px] font-extrabold shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition disabled:opacity-70">
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : <><Sparkles className="size-4" /> {status === 'rejected' ? 'Update & re-apply' : 'Submit Application'}</>}
            </button>
          </>
        )}
      </main>

      <AuthGate
        open={gateOpen}
        onClose={() => { setGateOpen(false); setPending(false); }}
        onSignIn={() => { setGateOpen(false); setAuthMode('login'); }}
        onCreate={() => { setGateOpen(false); setAuthMode('register'); }}
        title="Join the Safar Service Provider program"
        subtitle="Sign in or create your free Safar account to submit your application."
      />
      <AuthModal open={!!authMode} defaultMode={authMode || 'login'} onClose={() => setAuthMode(null)} />
    </Shell>
  );
}

function Field({ label, v, onChange, type = 'text', area, placeholder }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">{label}</label>
      {area ? (
        <textarea value={v || ''} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-emerald-400" />
      ) : (
        <input type={type} value={v || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px] outline-none focus:border-emerald-400" />
      )}
    </div>
  );
}
