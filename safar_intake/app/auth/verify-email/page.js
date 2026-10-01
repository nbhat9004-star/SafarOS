'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState({ loading: true, ok: false, alreadyVerified: false, error: '' });

  useEffect(() => {
    if (!token) {
      setState({ loading: false, ok: false, alreadyVerified: false, error: 'Missing verification token.' });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setState({
            loading: false,
            ok: !!data.verified,
            alreadyVerified: !!data.alreadyVerified,
            error: '',
          });
        } else {
          setState({ loading: false, ok: false, alreadyVerified: false, error: data.error || 'Verification failed.' });
        }
      } catch (e) {
        setState({ loading: false, ok: false, alreadyVerified: false, error: 'Network error. Please try again.' });
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 text-center">
        {state.loading && (
          <>
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900">Verifying your email…</h1>
            <p className="text-gray-600 mt-2 text-sm">Hold on a moment.</p>
          </>
        )}

        {!state.loading && state.ok && (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900">Email verified</h1>
            <p className="text-gray-600 mt-2">
              Your Safar account is all set. Welcome aboard — we&apos;ve also sent you a welcome email.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Continue to Safar
            </Link>
          </>
        )}

        {!state.loading && state.alreadyVerified && (
          <>
            <MailCheck className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900">Already verified</h1>
            <p className="text-gray-600 mt-2">Your email address has already been verified. You&apos;re good to go.</p>
            <Link
              href="/"
              className="mt-6 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Continue to Safar
            </Link>
          </>
        )}

        {!state.loading && !state.ok && !state.alreadyVerified && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900">Verification failed</h1>
            <p className="text-gray-600 mt-2">{state.error || 'This link is invalid or has expired.'}</p>
            <p className="text-gray-500 text-sm mt-3">
              You can request a new verification email from your account or by signing in again.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-3 rounded-lg transition"
            >
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
