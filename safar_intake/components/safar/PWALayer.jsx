'use client';

/**
 * PWALayer — global, additive PWA enhancements. Rendered once in the root
 * layout. It does two things and nothing else:
 *   1. Registers the service worker (/sw.js) for offline + instant repeat loads.
 *   2. Shows a premium branded launch splash ONLY when the app is opened as an
 *      installed PWA (display-mode: standalone). It is intentionally NOT shown
 *      in the normal browser so it never affects web Lighthouse / LCP.
 * The splash is CSS-only (no heavy images) and auto-dismisses in ~1s.
 */
import { useEffect, useState } from 'react';
import OnboardingFlow from '@/components/safar/OnboardingFlow';

// Optimized, whitelisted Kashmir landscape (Unsplash auto-serves WebP/AVIF).
const KASHMIR_IMG = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=70&auto=format&fit=crop';

export default function PWALayer() {
  const [showSplash, setShowSplash] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // --- Service worker registration (safe: never caches /api) ---
    if ('serviceWorker' in navigator) {
      // Auto-update: when a new SW (from a fresh Vercel deploy) takes control,
      // reload once so the user immediately gets the latest app shell instead
      // of a stale cached page. `hadController` prevents a reload on first install.
      const hadController = !!navigator.serviceWorker.controller;
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing || !hadController) return;
        refreshing = true;
        window.location.reload();
      });
      const register = () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => { reg.update().catch(() => {}); })
          .catch(() => {});
      };
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
    }

    // --- Branded splash only for the installed (standalone) app ---
    let standalone = false;
    try {
      standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
    } catch (e) { /* noop */ }

    if (standalone) {
      setShowSplash(true);
      // ~2.5s premium presentation, then a smooth fade to Home.
      const fadeT = setTimeout(() => setFade(true), 2200);
      const hideT = setTimeout(() => setShowSplash(false), 2600);
      return () => { clearTimeout(fadeT); clearTimeout(hideT); };
    }
  }, []);

  return (
    <>
      {showSplash && (
        <div
          aria-hidden="true"
          className={`pwa-splash ${fade ? 'pwa-splash--hide' : ''}`}
        >
          <img src={KASHMIR_IMG} alt="" className="pwa-splash__bg" />
          <div className="pwa-splash__scrim" />
          <div className="pwa-splash__inner">
            <div className="pwa-splash__logo">
              {/* Uses the existing Safar icon (served by Next at /icon.svg) */}
              <img src="/icon.svg" alt="" width={78} height={78} />
            </div>
            <div className="pwa-splash__wordmark">
              <span className="pwa-splash__title">SAFAR</span>
              <span className="pwa-splash__sub">CURATED</span>
            </div>
            <p className="pwa-splash__tagline">Experience Kashmir Like a Local</p>
          </div>
        </div>
      )}
      {/* First-launch onboarding — installed PWA only, self-gated. */}
      <OnboardingFlow />
    </>
  );
}
