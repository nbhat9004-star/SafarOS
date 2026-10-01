'use client';

/**
 * AuthGate — premium, reusable Safar authentication prompt (bottom sheet).
 *
 * Shown INSTEAD of a red "Sign in to ..." error whenever an unauthenticated
 * user attempts a protected action. It does NOT perform auth itself — it hands
 * off to the existing premium <AuthModal> (login / register). Mobile-first,
 * safe-area aware, and sits above the bottom navigation.
 *
 * Props:
 *   open      : boolean
 *   onClose   : () => void
 *   onSignIn  : () => void   (open existing AuthModal in "login" mode)
 *   onCreate  : () => void   (open existing AuthModal in "register" mode)
 *   title     : optional headline override
 *   subtitle  : optional supporting copy override
 */
import { useEffect } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export default function AuthGate({
  open,
  onClose,
  onSignIn,
  onCreate,
  title = 'Your Kashmir journey starts here',
  subtitle = 'Sign in or create your free Safar account to continue.',
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Sign in required">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm animate-[fadeIn_.2s_ease]" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-[fadeIn_.28s_ease] overflow-hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
      >
        <button type="button" aria-label="Close" onClick={onClose} className="absolute top-3.5 right-3.5 size-9 grid place-items-center rounded-full text-slate-400 hover:bg-slate-100 active:scale-90 transition"><X className="size-5" /></button>

        <div className="px-6 pt-8">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 grid place-items-center shadow-lg shadow-emerald-600/25">
            <img src="/icon.svg" alt="" width={34} height={34} />
          </div>
          <h2 className="mt-4 text-center font-display font-bold text-[21px] leading-tight tracking-tight text-slate-900">{title}</h2>
          <p className="mt-2 text-center text-[13.5px] leading-relaxed text-slate-500">{subtitle}</p>

          <button
            type="button"
            onClick={onSignIn}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 text-[15px] font-extrabold shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition"
          >
            Sign In <ArrowRight className="size-4" strokeWidth={2.6} />
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 py-3.5 text-[15px] font-extrabold active:scale-[0.98] transition"
          >
            <Sparkles className="size-4" /> Create Free Account
          </button>

          <p className="mt-4 text-center text-[12px] text-slate-400">
            Already have an account?{' '}
            <button type="button" onClick={onSignIn} className="font-semibold text-emerald-700 underline-offset-2 hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}
