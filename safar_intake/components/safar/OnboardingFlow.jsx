'use client';

/**
 * OnboardingFlow — premium FIRST-LAUNCH experience for the INSTALLED PWA only.
 *
 * Shown ONLY when:
 *   - the app runs in standalone display-mode (installed PWA), AND
 *   - the user has not completed onboarding before (localStorage flag).
 *
 * It never appears in the normal browser website, so it cannot affect the
 * regular web experience or desktop. Frontend-only: no backend/DB changes.
 *
 * Flow: Welcome  ->  Permissions (location + notifications)  ->  enter Safar.
 * Permissions are requested ONLY on the user's button tap (never on load) and
 * every state (granted / denied / dismissed / unsupported) is handled without
 * ever blocking the user.
 */
import { useEffect, useState } from 'react';
import { MapPin, Bell, Check, ArrowRight, Loader2 } from 'lucide-react';

const DONE_KEY = 'safar_onboarding_v1';
// Existing whitelisted Unsplash asset (see next.config.js remotePatterns) — kept
// lightweight (w=1000&q=70). Reused, not a new dependency/large file.
const WELCOME_IMG = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1000&q=70';

export default function OnboardingFlow() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false); // drives subtle fade-in
  const [step, setStep] = useState('welcome'); // 'welcome' | 'permissions'
  const [loc, setLoc] = useState('idle'); // idle | pending | granted | denied | unavailable
  const [notif, setNotif] = useState('idle'); // idle | granted | denied | unsupported

  useEffect(() => {
    let standalone = false;
    try {
      standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
    } catch (e) { /* noop */ }
    let done = false;
    try { done = window.localStorage.getItem(DONE_KEY) === '1'; } catch (e) { /* noop */ }
    if (standalone && !done) {
      setVisible(true);
      // Reflect existing notification permission if already granted.
      try { if ('Notification' in window && Notification.permission === 'granted') setNotif('granted'); } catch (e) { /* noop */ }
      // Reveal AFTER the branded splash (~2.6s) for a smooth hand-off.
      const t = setTimeout(() => setReady(true), 2650);
      return () => clearTimeout(t);
    }
  }, []);

  const finish = () => {
    try { window.localStorage.setItem(DONE_KEY, '1'); } catch (e) { /* noop */ }
    setReady(false);
    setTimeout(() => setVisible(false), 260);
  };

  const enableLocation = () => {
    if (!('geolocation' in navigator)) { setLoc('unavailable'); return; }
    setLoc('pending');
    navigator.geolocation.getCurrentPosition(
      () => setLoc('granted'),
      (err) => setLoc(err && err.code === 1 ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) { setNotif('unsupported'); return; }
    if (Notification.permission === 'granted') { setNotif('granted'); return; }
    if (Notification.permission === 'denied') { setNotif('denied'); return; }
    try {
      const res = await Notification.requestPermission();
      setNotif(res === 'granted' ? 'granted' : 'denied');
      // Push foundation: when granted + SW active, the app is ready for a future
      // push subscription. We intentionally do NOT subscribe here (no backend/
      // VAPID in this task) — this only readies the frontend permission layer.
      if (res === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.catch(() => {});
      }
    } catch (e) { setNotif('denied'); }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] text-white transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
      style={{ height: '100dvh' }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Safar"
    >
      {step === 'welcome' ? (
        <div className="relative h-full w-full overflow-hidden bg-[#0F3D2E]">
          {/* Kashmir backdrop */}
          <img src={WELCOME_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A2C21]/70 via-[#0A2C21]/40 to-[#07231A]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07231A] via-transparent to-transparent" />

          <div
            className="relative flex h-full flex-col px-6"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.75rem)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.75rem)',
            }}
          >
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="size-11 rounded-2xl bg-white/10 border border-amber-300/40 grid place-items-center backdrop-blur-md">
                <img src="/icon.svg" alt="" width={30} height={30} />
              </div>
              <div className="leading-tight">
                <div className="font-display font-bold text-[19px] tracking-tight">Safar</div>
                <div className="text-[10px] tracking-[0.34em] text-amber-300 font-semibold pl-0.5">CURATED</div>
              </div>
            </div>

            {/* Copy */}
            <div className="mt-auto">
              <span className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold backdrop-blur-md">Kashmir, India</span>
              <h1 className="mt-4 font-display font-bold text-[40px] leading-[1.05] tracking-tight">Welcome to<br />Safar</h1>
              <p className="mt-3 text-[16px] text-white/90 font-medium">Experience Kashmir like a local.</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70 max-w-sm">
                Discover authentic stays, local experiences, shared journeys and unforgettable places across Kashmir.
              </p>

              <button
                onClick={() => setStep('permissions')}
                className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 py-4 text-[15px] font-extrabold shadow-lg shadow-amber-500/25 active:scale-[0.98] transition"
              >
                Get Started <ArrowRight className="size-4" strokeWidth={2.6} />
              </button>
              <button
                onClick={finish}
                className="mt-3 w-full text-center text-[13.5px] font-semibold text-white/70 active:text-white/90 py-2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative h-full w-full overflow-y-auto bg-gradient-to-b from-[#0F3D2E] via-[#0C3325] to-[#07231A] px-6"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.75rem)',
          }}
        >
          <h2 className="font-display font-bold text-[30px] leading-tight tracking-tight">Make Safar yours.</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-white/70">
            Turn on a few permissions to get the best experience across Kashmir.
          </p>

          {/* Location card */}
          <div className="mt-6 rounded-3xl bg-white/[0.06] border border-white/12 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3.5">
              <div className="size-12 rounded-2xl bg-emerald-400/15 border border-emerald-300/25 grid place-items-center shrink-0">
                <MapPin className="size-6 text-emerald-300" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-[16px]">Your location</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-white/65">Find nearby stays, experiences, transport and places around you.</p>
              </div>
            </div>
            <PermButton
              status={loc}
              onClick={enableLocation}
              label="Enable Location"
              successText="Location enabled"
              deniedText="Location can be enabled later from settings."
              unavailableText="Location isn't available on this device."
            />
          </div>

          {/* Notifications card */}
          <div className="mt-4 rounded-3xl bg-white/[0.06] border border-white/12 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3.5">
              <div className="size-12 rounded-2xl bg-amber-400/15 border border-amber-300/25 grid place-items-center shrink-0">
                <Bell className="size-6 text-amber-300" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-[16px]">Stay in the loop</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-white/65">Get important updates about your trips, join requests, bookings and messages.</p>
              </div>
            </div>
            <PermButton
              status={notif}
              onClick={enableNotifications}
              label="Enable Notifications"
              successText="Notifications enabled"
              deniedText="Notifications can be enabled later."
              unavailableText="Notifications aren't supported on this browser."
              unavailableStatus="unsupported"
            />
          </div>

          <button
            onClick={finish}
            className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 py-4 text-[15px] font-extrabold shadow-lg shadow-amber-500/25 active:scale-[0.98] transition"
          >
            Continue to Safar <ArrowRight className="size-4" strokeWidth={2.6} />
          </button>
          <p className="mt-3 text-center text-[11.5px] text-white/45">You can change these anytime from your Profile.</p>
        </div>
      )}
    </div>
  );
}

function PermButton({ status, onClick, label, successText, deniedText, unavailableText, unavailableStatus = 'unavailable' }) {
  if (status === 'granted') {
    return (
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 px-4 py-2.5 text-[13px] font-bold">
        <Check className="size-4" strokeWidth={3} /> {successText} ✓
      </div>
    );
  }
  if (status === 'denied') {
    return <p className="mt-4 text-[12px] text-white/55">{deniedText}</p>;
  }
  if (status === unavailableStatus) {
    return <p className="mt-4 text-[12px] text-white/55">{unavailableText}</p>;
  }
  return (
    <button
      onClick={onClick}
      disabled={status === 'pending'}
      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 py-3 text-[13.5px] font-bold active:scale-[0.98] transition disabled:opacity-60"
    >
      {status === 'pending' ? <><Loader2 className="size-4 animate-spin" /> Requesting…</> : label}
    </button>
  );
}
