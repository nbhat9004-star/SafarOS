'use client';

/**
 * Become a Safar Trip Creator — NEW partner page (separate from Create Trip).
 * Explains the partner model, shows an ILLUSTRATIVE (configurable) earnings
 * example, and lets a user apply. Reuses the existing premium auth gate
 * (AuthGate + AuthModal) and preserves the application draft across sign-in /
 * refresh. Frontend-only workflow state — no fake KYC/verification API and no
 * new backend/database (Aadhaar would use an authorized UIDAI OTP provider when
 * a real KYC integration is connected).
 */
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Loader2, Mountain, Users, Award, Landmark, BadgeCheck, FileText } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import AuthGate from '@/components/safar/AuthGate';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const AuthModal = dynamic(() => import('@/components/safar/AuthModal'), { ssr: false });

// Configurable partner model — single source of truth (NOT hardcoded across UI).
const PARTNER_MODEL = { safarPct: 10, creatorPct: 10, examplePrice: 2000, exampleTravelers: 10 };
// User-scoped storage keys — application status & draft belong to the
// currently authenticated Safar account, never to the browser globally.
const draftKey = (uid) => `safar_creator_draft_${uid}`;
const submittedKey = (uid) => `safar_creator_application_${uid}`;

const STEPS = [
  { icon: FileText,   title: 'Apply',            desc: 'Tell us about your Kashmir knowledge and experience.' },
  { icon: BadgeCheck, title: 'Get verified',     desc: 'Complete identity & payout verification.' },
  { icon: Mountain,   title: 'Create experiences', desc: 'Design authentic Safar trips and experiences.' },
  { icon: Users,      title: 'Travelers join',   desc: 'Travelers discover and join your trips.' },
  { icon: Award,      title: 'Host the experience', desc: 'Guide travelers and share the real Kashmir.' },
  { icon: Landmark,   title: 'Earn',             desc: 'Earn according to Safar partner terms.' },
];

const FIELDS = [
  { key: 'fullName',    label: 'Full name',            type: 'text' },
  { key: 'displayName', label: 'Display name',         type: 'text' },
  { key: 'phone',       label: 'Phone',                type: 'tel' },
  { key: 'email',       label: 'Email',                type: 'email' },
  { key: 'location',    label: 'Location (city/area)', type: 'text' },
  { key: 'areas',       label: 'Areas of Kashmir you know well', type: 'text' },
  { key: 'travelExp',   label: 'Travel experience',    type: 'textarea' },
  { key: 'guidingExp',  label: 'Guiding experience',   type: 'textarea' },
  { key: 'years',       label: 'Years of experience',  type: 'number' },
  { key: 'types',       label: 'Types of experiences you can host', type: 'textarea' },
  { key: 'certs',       label: 'Certifications (if any)', type: 'text' },
  { key: 'references',  label: 'References / social profiles', type: 'text' },
];

const VERIFICATION = [
  'Identity verification',
  'PAN verification (where required)',
  'Bank verification for payouts',
  'Experience verification',
];

export default function BecomeTripCreator() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [pending, setPending] = useState(false);

  // Load the application status + draft for the CURRENTLY authenticated user.
  // Re-runs whenever the signed-in user changes (login / logout / switch) so
  // one account can never see another account's submitted state or draft.
  useEffect(() => {
    if (authLoading) return; // wait until we know who (if anyone) is signed in
    const uid = user?.id;
    try {
      if (uid) {
        setSubmitted(window.localStorage.getItem(submittedKey(uid)) === '1');
        const raw = window.localStorage.getItem(draftKey(uid));
        if (raw) setForm(JSON.parse(raw));
        // else: keep any in-memory form typed before sign-in (resume flow).
      } else {
        // Logged out: never inherit another user's submitted state or draft.
        setSubmitted(false);
        setForm({});
      }
    } catch (e) { /* ignore */ }
    setLoaded(true);
  }, [authLoading, user?.id]);

  // Persist draft continuously — scoped to the signed-in user only.
  useEffect(() => {
    if (!loaded || authLoading) return;
    const uid = user?.id;
    if (!uid) return; // don't store drafts for logged-out visitors
    try { window.localStorage.setItem(draftKey(uid), JSON.stringify(form)); } catch (e) { /* noop */ }
  }, [form, loaded, authLoading, user?.id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.fullName?.trim() || !form.email?.trim() || !form.phone?.trim()) {
      toast.error('Please add your name, email and phone');
      return;
    }
    // Auth gate — premium prompt instead of a technical error. Draft is saved.
    if (!authLoading && !user) { setPending(true); setGateOpen(true); return; }
    const uid = user?.id;
    if (!uid) { setPending(true); setGateOpen(true); return; }
    setSubmitting(true);
    try {
      // Frontend-only workflow state — scoped to THIS authenticated user.
      window.localStorage.setItem(submittedKey(uid), '1');
      window.localStorage.removeItem(draftKey(uid));
      setSubmitted(true);
      toast.success('Application submitted — pending verification');
    } catch (e) {
      toast.error('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-resume the submit after a successful sign-in/sign-up.
  useEffect(() => {
    if (user && pending && !gateOpen && !authMode) { setPending(false); submit(); }
  }, [user, pending, gateOpen, authMode]);

  const { safarPct, creatorPct, examplePrice, exampleTravelers } = PARTNER_MODEL;
  const gross = examplePrice * exampleTravelers;
  const safarCut = Math.round((gross * safarPct) / 100);
  const creatorCut = Math.round((gross * creatorPct) / 100);
  const operating = gross - safarCut - creatorCut;
  const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <Shell>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pb-3 flex items-center gap-3">
          <Link href="/explore" className="size-10 grid place-items-center rounded-full hover:bg-slate-100 active:scale-95 transition"><ArrowLeft className="size-5" /></Link>
          <h1 className="flex-1 text-center font-display font-bold text-[17px] tracking-tight">Trip Creator</h1>
          <span className="size-10" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-5">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#0A2C21] text-white p-6 md:p-8">
          <div className="absolute -top-16 -right-10 size-56 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold">🏔️ Know Kashmir like a local?</span>
            <h2 className="mt-4 font-display font-bold text-[26px] md:text-[32px] leading-tight tracking-tight">Become a Safar<br />Trip Creator</h2>
            <p className="mt-2 text-[14px] text-white/80 leading-relaxed max-w-lg">Know Kashmir. Share Kashmir. Earn from it. Turn your passion and local knowledge into unforgettable experiences for travelers.</p>
            <p className="mt-1.5 text-[13px] text-white/65">Create trips. Bring travelers together. Earn from eligible Safar experiences.</p>
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

        {/* Partner model (illustrative) */}
        <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">The partner model</h3>
        <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-slate-700">Example: {inr(examplePrice)} × {exampleTravelers} travelers</span>
            <span className="font-display font-bold text-[18px] text-slate-900">{inr(gross)}</span>
          </div>
          <div className="mt-4 space-y-2 text-[13px]">
            <Row label={`Safar (${safarPct}%)`} value={inr(safarCut)} />
            <Row label={`Trip Creator (${creatorPct}%)`} value={inr(creatorCut)} accent />
            <Row label="Trip / experience operating costs" value={inr(operating)} muted />
          </div>
          <p className="mt-4 text-[11.5px] text-slate-500 leading-relaxed">Illustrative example only — earnings are not guaranteed and depend on the trip, costs and Safar&rsquo;s partner terms.</p>
        </div>

        {(!loaded || authLoading) ? (
          <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-10 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-emerald-600" />
          </div>
        ) : submitted ? (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="mx-auto size-12 grid place-items-center rounded-full bg-emerald-600 text-white"><CheckCircle2 className="size-7" /></div>
            <h3 className="mt-3 font-display font-bold text-[19px] text-emerald-900">Application submitted</h3>
            <p className="mt-1.5 text-[13.5px] text-emerald-900/75">Your Trip Creator application is <b>pending verification</b>. Our team will review your details and reach out with the next steps.</p>
            <button onClick={() => router.push('/explore')} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 text-white px-6 py-3 text-[14px] font-bold active:scale-95">Back to Explore <ArrowRight className="size-4" /></button>
          </div>
        ) : (
          <>
            {/* Application form */}
            <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Apply to become a Trip Creator</h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">Keep it short — you can add more during verification.</p>
            <div className="mt-4 space-y-3.5">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-emerald-400" />
                  ) : (
                    <input type={f.type} value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px] outline-none focus:border-emerald-400" />
                  )}
                </div>
              ))}
            </div>

            {/* Verification info (workflow only) */}
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800"><ShieldCheck className="size-4 text-emerald-600" /> Verification after you apply</div>
              <ul className="mt-2.5 space-y-1.5">
                {VERIFICATION.map((v) => (
                  <li key={v} className="flex items-center gap-2 text-[12.5px] text-slate-600"><CheckCircle2 className="size-3.5 text-slate-400" /> {v}</li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] text-slate-500 leading-relaxed">Aadhaar (where required) uses OTP-based verification via an authorized UIDAI provider — document copies and OTPs are never stored, and PAN/bank details are never publicly exposed.</p>
            </div>

            <button onClick={submit} disabled={submitting} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 text-[15px] font-extrabold shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition disabled:opacity-70">
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : <><Sparkles className="size-4" /> Submit Application</>}
            </button>
          </>
        )}
      </main>

      <AuthGate
        open={gateOpen}
        onClose={() => { setGateOpen(false); setPending(false); }}
        onSignIn={() => { setGateOpen(false); setAuthMode('login'); }}
        onCreate={() => { setGateOpen(false); setAuthMode('register'); }}
        title="Join the Safar Trip Creator program"
        subtitle="Sign in or create your free Safar account to submit your application."
      />
      <AuthModal open={!!authMode} defaultMode={authMode || 'login'} onClose={() => setAuthMode(null)} />
    </Shell>
  );
}

function Row({ label, value, accent, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-slate-500' : 'text-slate-700'}>{label}</span>
      <span className={`font-bold ${accent ? 'text-emerald-700' : muted ? 'text-slate-500' : 'text-slate-900'}`}>{value}</span>
    </div>
  );
}
