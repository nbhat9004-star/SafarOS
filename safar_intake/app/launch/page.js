'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Instagram, ArrowRight, Mail, Phone, MessageCircle, Check, X, Sparkles, MapPin, Loader2, ShieldCheck } from 'lucide-react';

// ---------------------------------------------------------------------------
// SAFAR CURATED — Premium Launch Landing Page
// Rendered by middleware when Launch Mode is enabled. Bright white background,
// dark-green + gold accents, glassmorphism, soft animations, mobile-first.
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
  enabled: true,
  logoText: 'Safar Curated',
  logoUrl: '',
  heroBackground: 'https://images.pexels.com/photos/27108526/pexels-photo-27108526.jpeg?auto=compress&cs=tinysrgb&w=1920',
  heroTitle: 'Kashmir Deserves Something Extraordinary.',
  heroSubtitle: "Something beautiful is quietly taking shape. We're inviting a limited number of Founding Partners before our official launch.",
  primaryButtonText: 'Become a Founding Partner',
  secondaryButtonText: 'Follow Our Journey',
  instagramUrl: 'https://instagram.com/safarcurated',
  supportEmail: 'support@safarcurated.com',
  partnershipEmail: 'partners@safarcurated.com',
  whatsappNumber: '',
  phoneNumber: '',
  enableHostRegistration: true,
  enableInstagramSection: true,
  enableContactSection: true,
};

const CATEGORIES = [
  'Homestay','Hotel','Guest House','Houseboat','Taxi Service','Car Rental',
  'Bike Rental','Local Guide','Restaurant','Café','Tour Operator',
  'Adventure Activities','Local Experience','Other',
];

const PARTNER_CARDS = [
  { emoji: '🏡', text: 'Do you own a beautiful home near a tourist destination?' },
  { emoji: '🏨', text: 'Do you own a hotel, guest house or houseboat?' },
  { emoji: '🚕', text: 'Do you own a taxi?' },
  { emoji: '🏍️', text: 'Do you rent bikes or scooters?' },
  { emoji: '🚗', text: 'Do you own rental cars?' },
  { emoji: '🥾', text: 'Are you a local guide?' },
  { emoji: '🍽️', text: 'Do you own a restaurant serving authentic Wazwan or traditional Kashmiri cuisine?' },
  { emoji: '☕', text: 'Do you own a café?' },
  { emoji: '🏕️', text: 'Do you organise camping, trekking or adventure experiences?' },
  { emoji: '📸', text: 'Do you create unforgettable local experiences?' },
];

export default function LaunchPage() {
  const [s, setS] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/launch-mode/public', { cache: 'no-store' });
        const j = await r.json();
        if (alive && j?.ok && j.settings) setS({ ...DEFAULT_SETTINGS, ...j.settings });
      } catch { /* fallback to DEFAULT_SETTINGS on any error */ }
      finally { if (alive) setLoaded(true); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <main className="min-h-screen bg-white text-[#0F3D2E]" style={{fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif'}}>
      {/* ================= HERO ================= */}
      <section className="relative min-h-[100svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          {s.heroBackground && (
            <Image
              src={s.heroBackground}
              alt="Kashmir"
              fill
              priority
              sizes="100vw"
              quality={75}
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-emerald-950/25 to-white/95" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/50 via-transparent to-transparent" />
        </div>

        {/* Top nav — logo only, ultra-minimal */}
        <div className="relative z-10 pt-6 md:pt-8 px-5 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {s.logoUrl
              ? <img src={s.logoUrl} alt={s.logoText} className="h-9 w-auto" />
              : <div className="size-9 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 grid place-items-center text-white text-sm font-bold shadow-md">S</div>}
            <span className="font-semibold tracking-tight text-white drop-shadow-md text-[15px] md:text-base">{s.logoText}</span>
          </div>
          <a href="/admin" className="hidden md:inline text-xs text-white/70 hover:text-white transition">Admin</a>
        </div>

        {/* Hero content */}
        <div className="relative z-10 min-h-[calc(100svh-88px)] flex flex-col justify-center px-6 md:px-16 pb-24 pt-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/70 border border-white/60 text-emerald-900 text-[11px] uppercase tracking-[0.22em] font-semibold mb-8 shadow-lg animate-[fadeIn_800ms_ease-out]">
              <Sparkles className="size-3.5 text-amber-500" /> Coming Soon · Founding Access
            </div>
            <h1 className="font-serif text-[clamp(2.4rem,6vw,5.2rem)] leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)] text-balance"
                style={{ fontFamily: 'var(--font-poppins), Georgia, serif', letterSpacing: '-0.02em' }}>
              {s.heroTitle}
            </h1>
            <p className="mt-6 text-base md:text-xl text-white/95 leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              {s.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              {s.enableHostRegistration !== false && (
                <button
                  onClick={() => setOpenModal(true)}
                  className="group inline-flex items-center gap-2 px-7 md:px-8 h-13 py-3.5 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-semibold shadow-xl shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:-translate-y-0.5 transition-all duration-300">
                  {s.primaryButtonText || 'Become a Founding Partner'}
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              {s.instagramUrl && (
                <a
                  href={s.instagramUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 md:px-8 h-13 py-3.5 rounded-full bg-white/90 hover:bg-white text-emerald-900 font-semibold border border-white/60 backdrop-blur-md shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <Instagram className="size-4" /> {s.secondaryButtonText || 'Follow Our Journey'}
                </a>
              )}
            </div>
            <div className="mt-10 inline-flex items-center gap-2 text-white/85 text-xs md:text-sm drop-shadow">
              <ShieldCheck className="size-4 text-amber-400" /> Handpicked · Verified · By locals, for the valley
            </div>
          </div>
        </div>
      </section>

      {/* ================= IS THIS YOU? ================= */}
      <section className="py-24 md:py-32 px-6 md:px-10 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-amber-600 text-[11px] uppercase tracking-[0.24em] font-bold mb-4">Founding Partners</div>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-emerald-950 tracking-tight text-balance"
                style={{ fontFamily: 'var(--font-poppins), Georgia, serif', letterSpacing: '-0.02em' }}>
              Is This You?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
            {PARTNER_CARDS.map((c, i) => (
              <div key={i}
                className="group relative rounded-2xl bg-white border border-emerald-100 hover:border-amber-400/60 p-6 md:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                style={{ animationDelay: `${i*60}ms` }}>
                <div className="text-4xl md:text-5xl mb-4 select-none">{c.emoji}</div>
                <p className="text-sm md:text-[15px] leading-relaxed text-emerald-950/85 font-medium">{c.text}</p>
                <div className="absolute inset-x-6 bottom-4 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div className="mt-20 md:mt-24 text-center max-w-3xl mx-auto">
            <h3 className="font-serif text-3xl md:text-5xl font-bold text-emerald-950 leading-tight text-balance"
                style={{ fontFamily: 'var(--font-poppins), Georgia, serif', letterSpacing: '-0.02em' }}>
              We&apos;d Love To Welcome You.
            </h3>
            <p className="mt-6 text-base md:text-lg text-emerald-950/70 leading-relaxed">
              Become one of the very first Founding Partners helping shape something extraordinary for Kashmir.
            </p>
            {s.enableHostRegistration !== false && (
              <button onClick={() => setOpenModal(true)} className="mt-10 inline-flex items-center gap-2 px-8 h-13 py-3.5 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-semibold shadow-xl shadow-emerald-900/25 hover:shadow-emerald-900/45 hover:-translate-y-0.5 transition-all">
                Apply Now <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================= OUR COMMITMENT ================= */}
      <section className="py-24 md:py-28 px-6 md:px-10 bg-gradient-to-b from-emerald-950 to-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(251,191,36,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.3) 0%, transparent 40%)' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="text-amber-400 text-[11px] uppercase tracking-[0.24em] font-bold mb-4">Our Commitment</div>
          <h2 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-balance"
              style={{ fontFamily: 'var(--font-poppins), Georgia, serif', letterSpacing: '-0.02em' }}>
            When You Grow, We Grow.
          </h2>
          <p className="mt-8 text-base md:text-lg text-white/85 leading-relaxed">
            We&apos;re building something with a long-term vision. Our goal is to support exceptional local businesses with beautiful technology, thoughtful design, trusted partnerships and continuous innovation.
          </p>
          <p className="mt-4 text-base md:text-lg text-white/75 leading-relaxed">
            As a Founding Partner, you&apos;ll grow alongside us while helping shape the future of Safar Curated.
          </p>
        </div>
      </section>

      {/* ================= INSTAGRAM ================= */}
      {s.enableInstagramSection !== false && s.instagramUrl && (
        <section className="py-24 md:py-28 px-6 md:px-10 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center size-16 md:size-20 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-amber-500 mb-6 shadow-lg">
              <Instagram className="size-8 md:size-10 text-white" />
            </div>
            <div className="text-emerald-800 text-[11px] uppercase tracking-[0.24em] font-bold mb-3">Follow Our Journey</div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-emerald-950 tracking-tight text-balance"
                style={{ fontFamily: 'var(--font-poppins), Georgia, serif', letterSpacing: '-0.02em' }}>
              Stay Close To The Story.
            </h2>
            <p className="mt-6 text-base md:text-lg text-emerald-950/70 leading-relaxed">
              Stay connected as we reveal behind-the-scenes stories, launch updates and beautiful moments from Kashmir.
            </p>
            <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 px-7 h-13 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Instagram className="size-4" /> Follow @SafarCurated
            </a>
          </div>
        </section>
      )}

      {/* ================= CONTACT ================= */}
      {s.enableContactSection !== false && (
        <section className="py-20 px-6 md:px-10 bg-emerald-50/60 border-t border-emerald-100">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {s.supportEmail && (
              <a href={`mailto:${s.supportEmail}`} className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-emerald-100 hover:border-amber-400 hover:shadow-md transition">
                <div className="size-11 rounded-xl bg-emerald-900 grid place-items-center text-white"><Mail className="size-5" /></div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider font-bold text-emerald-800">Support</div>
                  <div className="text-sm font-semibold text-emerald-950 truncate">{s.supportEmail}</div>
                </div>
              </a>
            )}
            {s.partnershipEmail && (
              <a href={`mailto:${s.partnershipEmail}`} className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-emerald-100 hover:border-amber-400 hover:shadow-md transition">
                <div className="size-11 rounded-xl bg-amber-500 grid place-items-center text-white"><Sparkles className="size-5" /></div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider font-bold text-emerald-800">Partnerships</div>
                  <div className="text-sm font-semibold text-emerald-950 truncate">{s.partnershipEmail}</div>
                </div>
              </a>
            )}
            {(s.whatsappNumber || s.phoneNumber) && (
              <a href={s.whatsappNumber ? `https://wa.me/${String(s.whatsappNumber).replace(/[^0-9]/g,'')}` : `tel:${s.phoneNumber}`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-emerald-100 hover:border-amber-400 hover:shadow-md transition">
                <div className="size-11 rounded-xl bg-emerald-700 grid place-items-center text-white">{s.whatsappNumber ? <MessageCircle className="size-5" /> : <Phone className="size-5" />}</div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider font-bold text-emerald-800">{s.whatsappNumber ? 'WhatsApp' : 'Phone'}</div>
                  <div className="text-sm font-semibold text-emerald-950 truncate">{s.whatsappNumber || s.phoneNumber}</div>
                </div>
              </a>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 px-6 text-center bg-white border-t border-emerald-100">
        <div className="text-xs text-emerald-950/50">© {new Date().getFullYear()} {s.logoText}. Curated in Kashmir.</div>
        <a href="/admin" className="mt-3 inline-block text-[11px] text-emerald-950/40 hover:text-emerald-950/70 transition">Admin</a>
      </footer>

      {/* ================= REGISTRATION MODAL ================= */}
      {openModal && s.enableHostRegistration !== false && (
        <RegistrationModal onClose={() => setOpenModal(false)} settings={s} />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        html { scroll-behavior: smooth; }
      `}} />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Registration Modal (2 steps + success screen)
// ---------------------------------------------------------------------------
function RegistrationModal({ onClose, settings }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [form, setForm] = useState({
    category: '', fullName: '', businessName: '', email: '', mobile: '',
    whatsapp: '', city: '', district: '', businessAddress: '', description: '',
    consent: false,
  });
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async () => {
    setError('');
    if (!form.fullName.trim()) return setError('Full name required');
    if (!form.email.trim()) return setError('Email required');
    if (!form.mobile.trim()) return setError('Mobile required');
    if (!form.city.trim() || !form.district.trim()) return setError('City & district required');
    if (!form.consent) return setError('Please accept the consent checkbox');
    setBusy(true);
    try {
      const r = await fetch('/api/founding-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!j?.ok) { setError(j?.error || 'Submission failed'); setBusy(false); return; }
      setApplicationId(j.application?.applicationId || '');
      setStep(3);
    } catch (e) {
      setError('Network error — please try again');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-emerald-950/60 backdrop-blur-md p-4 animate-[fadeIn_260ms_ease-out]" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 size-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 grid place-items-center z-10 transition">
          <X className="size-4" />
        </button>

        {step !== 3 && (
          <div className="px-7 md:px-9 pt-8 pb-6 border-b border-emerald-100">
            <div className="text-amber-600 text-[10px] uppercase tracking-[0.24em] font-bold">Founding Partner Application</div>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-emerald-950 mt-1" style={{ fontFamily: 'var(--font-poppins), Georgia, serif' }}>
              {step === 1 ? 'Tell us about your business' : 'A few final details'}
            </h3>
            <div className="mt-4 flex items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-800' : 'bg-emerald-100'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-800' : 'bg-emerald-100'}`} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="p-7 md:p-9 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-emerald-800 mb-1.5">Select Category</label>
              <select value={form.category} onChange={upd('category')} className="w-full h-12 px-4 rounded-xl border border-emerald-100 bg-white text-emerald-950 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 outline-none">
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="pt-2 flex items-center justify-between gap-3">
              <button onClick={onClose} className="px-5 h-11 rounded-full text-emerald-950/70 hover:text-emerald-950 text-sm font-semibold">Cancel</button>
              <button disabled={!form.category} onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald-900 hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition">
                Continue <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-7 md:p-9 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name*" value={form.fullName} onChange={upd('fullName')} />
              <Input label="Business Name" value={form.businessName} onChange={upd('businessName')} />
              <Input label="Email*" type="email" value={form.email} onChange={upd('email')} />
              <Input label="Mobile*" value={form.mobile} onChange={upd('mobile')} />
              <Input label="WhatsApp" value={form.whatsapp} onChange={upd('whatsapp')} />
              <Input label="City*" value={form.city} onChange={upd('city')} />
              <Input label="District*" value={form.district} onChange={upd('district')} />
              <div className="col-span-2">
                <Input label="Business Address" value={form.businessAddress} onChange={upd('businessAddress')} />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-emerald-800 mb-1.5">Short Business Description</label>
                <textarea value={form.description} onChange={upd('description')} rows={3} className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-white text-emerald-950 text-sm focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 outline-none resize-none" />
              </div>
            </div>
            <label className="flex items-start gap-3 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.consent} onChange={upd('consent')} className="mt-1 size-4 accent-emerald-900" />
              <span className="text-sm text-emerald-950/85 leading-relaxed">I agree to be contacted by {settings.logoText} regarding onboarding and verification.</span>
            </label>
            {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</div>}
            <div className="pt-3 flex items-center justify-between gap-3">
              <button onClick={() => setStep(1)} className="px-5 h-11 rounded-full text-emerald-950/70 hover:text-emerald-950 text-sm font-semibold">← Back</button>
              <button disabled={busy} onClick={submit} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald-900 hover:bg-emerald-950 disabled:opacity-50 text-white font-semibold transition">
                {busy ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : <>Submit Application <Check className="size-4" /></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 md:p-12 text-center">
            <div className="mx-auto mb-6 size-20 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 grid place-items-center shadow-xl shadow-emerald-900/30">
              <Check className="size-10 text-white" strokeWidth={3} />
            </div>
            <h3 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950 tracking-tight" style={{ fontFamily: 'var(--font-poppins), Georgia, serif' }}>Thank You!</h3>
            <p className="mt-5 text-emerald-950/80 leading-relaxed max-w-md mx-auto">Thank you for applying to become a Founding Partner of {settings.logoText}. Your application has been received successfully.</p>
            <p className="mt-4 text-emerald-950/70 leading-relaxed max-w-md mx-auto text-sm">Our Partnerships Team will personally contact you and guide you through every onboarding and verification step. For now, you don&apos;t need to take any further action.</p>
            {applicationId && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
                Application ID: {applicationId}
              </div>
            )}
            <p className="mt-6 text-sm text-emerald-950/70">We&apos;re excited to welcome you on this journey.</p>
            <button onClick={onClose} className="mt-8 inline-flex items-center gap-2 px-7 h-12 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-semibold shadow-lg hover:-translate-y-0.5 transition-all">
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-bold text-emerald-800 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} className="w-full h-11 px-3.5 rounded-xl border border-emerald-100 bg-white text-emerald-950 text-sm focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 outline-none" />
    </div>
  );
}
