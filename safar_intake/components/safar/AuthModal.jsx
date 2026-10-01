'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Sparkles, MapPin, Shield, ChevronRight, Loader2, Phone, ArrowLeft, CheckCircle2, Home as HomeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
// PERF: Firebase SDK is loaded lazily via getFirebaseAuth() only when the
// user actually triggers Google Sign-In or Phone OTP. The `firebase/auth`
// helpers (RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider,
// signInWithPopup) are also dynamic-imported inside those handlers so the
// SDK never appears in the initial bundle.
import { getFirebaseAuth } from '@/lib/firebase';
import { IMG } from '@/lib/data';

// Validate a redirect destination to prevent open-redirect attacks.
// Accepts:
//   1. Same-origin relative paths starting with a single slash (e.g. /dashboard).
//   2. Absolute URLs whose host matches NEXT_PUBLIC_CIRCLE_URL (Safar Circle
//      subdomain, e.g. https://circle.safarcurated.com/...) so cross-origin
//      auth flows from the Circle app work seamlessly.
function safeReturnUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  // Absolute URL path — only permit trusted Circle origin.
  if (/^https?:\/\//i.test(s)) {
    try {
      const target = new URL(s);
      const circleEnv = (process.env.NEXT_PUBLIC_CIRCLE_URL || '').replace(/\/$/, '');
      if (circleEnv) {
        const allowed = new URL(circleEnv);
        if (target.origin === allowed.origin) return s;
      }
      return null;
    } catch { return null; }
  }
  // Same-origin relative paths only.
  if (!s.startsWith('/')) return null;
  if (s.startsWith('//') || s.startsWith('/\\')) return null;
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(s)) return null;
  try {
    const url = new URL(s, 'http://x');
    url.searchParams.delete('auth');
    url.searchParams.delete('returnUrl');
    const qs = url.searchParams.toString();
    return url.pathname + (qs ? '?' + qs : '') + (url.hash || '');
  } catch {
    return s;
  }
}

const ROLE_OPTIONS = [
  { id: 'traveler', label: 'Traveler', desc: 'Book stays, experiences & transport', icon: MapPin },
  { id: 'host',     label: 'Host',     desc: 'List your home, transport or tour service', icon: Sparkles },
];

export default function AuthModal({ open, onClose, defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [authType, setAuthType] = useState('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [role, setRole] = useState('traveler');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const { login, register, loginWithPhone, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Extract and validate an optional `returnUrl` set by callers (e.g. Safar Circle).
  // Only same-origin relative paths are honoured — see safeReturnUrl().
  const getReturnUrl = () => {
    if (typeof window === 'undefined') return null;
    try {
      const params = new URLSearchParams(window.location.search);
      return safeReturnUrl(params.get('returnUrl'));
    } catch { return null; }
  };

  // Called after any successful auth flow. Closes the modal and navigates back
  // to the origin page if a validated returnUrl exists.
  const handleAuthSuccess = () => {
    const returnUrl = getReturnUrl();
    onClose?.();
    if (returnUrl) {
      // Absolute URLs (cross-origin, e.g. Safar Circle subdomain) require full navigation.
      if (/^https?:\/\//i.test(returnUrl)) {
        window.location.href = returnUrl;
      } else {
        try { router.push(returnUrl); } catch { window.location.href = returnUrl; }
      }
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const setupRecaptcha = async () => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      const auth = await getFirebaseAuth();
      if (!auth) throw new Error('Firebase Auth is not configured');
      const { RecaptchaVerifier } = await import('firebase/auth');
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
  };

  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await setupRecaptcha();
      const auth = await getFirebaseAuth();
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setShowOtp(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      console.error('OTP send error:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      const res = await loginWithPhone(idToken);
      if (!res.success) {
        toast.error(res.error || 'Phone login failed');
        return;
      }
      toast.success(`Welcome, ${res.user.name}!`);
      handleAuthSuccess();
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const auth = await getFirebaseAuth();
      if (!auth) {
        toast.error('Google sign-in is not configured');
        return;
      }
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      // Signal host-signup intent to the backend when this Google sign-in
      // was triggered from the "Become a Host" flow — currently detected by
      // the modal being opened on the /add-listing route. Backend will then
      // create the account with hostApplicationStatus='pending' and email
      // the user an "awaiting admin approval" confirmation.
      const intent =
        typeof window !== 'undefined' && window.location.pathname === '/add-listing'
          ? 'host'
          : undefined;
      const res = await loginWithGoogle(idToken, intent);
      if (!res.success) {
        toast.error(res.error || 'Google sign-in failed');
        return;
      }
      if (res.hostApplicationPending) {
        toast.success(
          `Thanks ${res.user.name}! Your host application is awaiting admin approval — check your email for confirmation.`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Welcome, ${res.user.name}!`);
      }
      handleAuthSuccess();
    } catch (error) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled');
      } else {
        toast.error('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (authType === 'phone') {
      if (!showOtp) {
        await sendOTP();
      } else {
        await verifyOTP();
      }
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name || !email || !password) {
          toast.error('Please fill all fields');
          return;
        }
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        const res = await register(name, email, password, role);
        if (!res.success) {
          toast.error(res.error || 'Registration failed');
          return;
        }
        toast.success('Account created! Please check your email to verify your account.');
        handleAuthSuccess();
      } else {
        if (!email || !password) {
          toast.error('Please enter email and password');
          return;
        }
        const res = await login(email, password);
        if (!res.success) {
          toast.error(res.error || 'Login failed');
          return;
        }
        toast.success(`Welcome back, ${res.user.name}!`);
        handleAuthSuccess();
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Premium full-screen landing page (default view)
  if (!showEmailForm) {
    const modalNode = (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            minHeight: '100dvh',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            WebkitOverflowScrolling: 'touch',
          }}
          className="z-[100] overflow-y-auto overscroll-contain flex items-start md:items-center justify-center">
          
          <div className="fixed inset-0 -z-10">
            <img src={IMG.mtn1} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-teal-800/75 to-emerald-950/90" />
          </div>

          <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md mx-4 md:mx-auto my-6 md:my-8">
            
            {/* NOTE: `overflow-hidden` REMOVED from this card. On short mobile
                viewports the card content is taller than the screen; hiding
                overflow prevented users from scrolling to reach the "Become
                a Host" CTA and the footer. The parent overlay now handles
                vertical scroll via overflow-y-auto + safe-area padding. */}
            <div className="relative backdrop-blur-2xl bg-white/95 rounded-3xl shadow-2xl border border-white/20">
              
              <button onClick={onClose} aria-label="Close"
                className="absolute top-5 right-5 z-10 size-10 grid place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 transition">
                <X className="size-5 text-charcoal" />
              </button>

              <div className="p-8 md:p-10">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="flex items-center justify-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="size-14 rounded-2xl bg-gradient-emerald grid place-items-center shadow-xl">
                      <MapPin className="size-7 text-gold" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="font-display font-bold text-3xl text-charcoal tracking-tight">Safar</div>
                      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Kashmir · Curated</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-center mb-8">
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal leading-tight mb-3">
                    Experience Kashmir<br />Like a Local
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Discover curated stays, experiences, guides, and rentals across Kashmir
                  </p>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <button type="button" onClick={handleGoogleSignIn} disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-emerald2 hover:shadow-xl transition-all flex items-center justify-center gap-3 text-base font-semibold text-charcoal group">
                    {loading ? (
                      <Loader2 className="size-5 animate-spin text-emerald2" />
                    ) : (
                      <>
                        <svg className="size-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="group-hover:text-emerald2 transition">Continue with Google</span>
                      </>
                    )}
                  </button>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-muted-foreground font-medium">OR</span>
                  </div>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                  <button type="button" onClick={()=>setShowEmailForm(true)}
                    className="w-full py-3.5 px-4 rounded-2xl border-2 border-gray-200 hover:border-emerald2 transition flex items-center justify-center gap-2 text-sm font-semibold text-charcoal">
                    <Mail className="size-4" />
                    Continue with Email
                  </button>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                  className="mt-8 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <CheckCircle2 className="size-5 text-emerald2 mx-auto mb-1.5" strokeWidth={2.5} />
                      <div className="text-[10px] font-semibold text-charcoal leading-tight">Verified<br />Hosts</div>
                    </div>
                    <div>
                      <Shield className="size-5 text-emerald2 mx-auto mb-1.5" strokeWidth={2.5} />
                      <div className="text-[10px] font-semibold text-charcoal leading-tight">Secure<br />Bookings</div>
                    </div>
                    <div>
                      <Sparkles className="size-5 text-emerald2 mx-auto mb-1.5" strokeWidth={2.5} />
                      <div className="text-[10px] font-semibold text-charcoal leading-tight">Local<br />Experiences</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  className="mt-4 text-center text-[10px] text-muted-foreground">
                  Protected by Google OAuth · Secure JWT sessions
                </motion.div>

                {/* Become a Host — moved out of primary navigation into the
                    Sign in / Sign up screen. This is the only place a
                    logged-out visitor can begin the host onboarding. */}
                <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
                  className="mt-5 rounded-2xl border border-emerald2/20 bg-emerald2/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-2xl bg-emerald2/15 grid place-items-center shrink-0">
                      <HomeIcon className="size-5 text-emerald2" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-[15px] text-charcoal leading-tight">Become a Host</div>
                      <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                        List your stay, experience or service on Safar Curated.
                      </p>
                      <a
                        href="/add-listing"
                        onClick={onClose}
                        className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-[12.5px] font-semibold shadow-md shadow-emerald2/25 transition"
                      >
                        Get started
                        <ChevronRight className="size-3.5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div id="recaptcha-container" className="hidden"></div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
    if (!mounted || typeof document === 'undefined') return null;
    return createPortal(modalNode, document.body);
  }

  // Email/Password form (secondary view)
  const modalNode = (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          minHeight: '100dvh',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          WebkitOverflowScrolling: 'touch',
        }}
        className="z-[1000] bg-charcoal/55 backdrop-blur-md flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto overscroll-contain" onClick={onClose}>
        <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          /* NOTE: `overflow-hidden` REMOVED here — it conflicted with the
             `overflow-y-auto` on the same element and prevented mobile users
             from scrolling the form content on short screens. The parent
             overlay handles vertical scroll instead. */
          className="w-full md:max-w-md bg-white md:rounded-3xl shadow-2xl border md:max-h-[92dvh] md:overflow-y-auto my-0 md:my-auto">
          
          <div className="px-6 pt-6 pb-5 bg-gradient-emerald text-white relative">
            <button onClick={()=>setShowEmailForm(false)} aria-label="Back" className="absolute top-4 left-4 size-9 grid place-items-center rounded-full hover:bg-white/15"><ArrowLeft className="size-5" /></button>
            <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 size-9 grid place-items-center rounded-full hover:bg-white/15"><X className="size-5" /></button>
            <div className="flex items-center gap-2.5 justify-center">
              <div className="size-10 rounded-2xl bg-white/15 grid place-items-center ring-1 ring-white/20"><MapPin className="size-5 text-gold" /></div>
              <div>
                <div className="font-display font-bold text-lg leading-tight">{mode === 'login' ? 'Welcome back' : 'Join Safar'}</div>
                <div className="text-[11px] text-white/75">{mode === 'login' ? 'Sign in to continue' : 'Create your free account'}</div>
              </div>
            </div>
          </div>

          <div className="px-6 pt-5">
            <div className="grid grid-cols-2 p-1 rounded-full bg-secondary text-sm font-semibold">
              <button onClick={()=>setMode('login')} className={`py-2 rounded-full transition ${mode==='login' ? 'bg-white shadow' : 'text-muted-foreground'}`}>Sign in</button>
              <button onClick={()=>setMode('signup')} className={`py-2 rounded-full transition ${mode==='signup' ? 'bg-white shadow' : 'text-muted-foreground'}`}>Sign up</button>
            </div>
          </div>

          <form onSubmit={submit} className="px-6 pb-6 pt-5 space-y-3.5">
            {mode === 'signup' && (
              <>
                <Field icon={UserIcon} placeholder="Full name" value={name} onChange={setName} autoFocus />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">I want to join as</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_OPTIONS.map((r) => {
                      const Ico = r.icon; const on = role === r.id;
                      return (
                        <button type="button" key={r.id} onClick={()=>setRole(r.id)} className={`text-left p-3 rounded-2xl border-2 transition ${on ? 'border-emerald2 bg-emerald2/5' : 'border-border hover:border-charcoal/30'}`}>
                          <Ico className="size-4 text-emerald2" />
                          <div className="font-semibold text-sm mt-1.5">{r.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{r.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} autoFocus={mode==='login'} />
            <Field icon={Lock} type="password" placeholder={mode==='signup' ? 'Create password (min 6)' : 'Password'} value={password} onChange={setPassword} />
            {mode === 'login' && (
              <div className="text-right">
                <a href="/auth/forgot-password" className="text-xs text-emerald2 hover:underline">Forgot password?</a>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-emerald2 hover:bg-emerald2-deep text-white font-semibold mt-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : (
                mode === 'login' ? <>Sign in <ChevronRight className="size-4 ml-1" /></> : <>Create account <ChevronRight className="size-4 ml-1" /></>
              )}
            </Button>

            <div className="text-[11px] text-muted-foreground text-center pt-2 flex items-center justify-center gap-1.5"><Shield className="size-3 text-emerald2" /> Secure auth · JWT sessions</div>
            <div className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? <>New to Safar? <button type="button" onClick={()=>setMode('signup')} className="text-emerald2 font-semibold hover:underline">Create an account</button></> : <>Already have an account? <button type="button" onClick={()=>setMode('login')} className="text-emerald2 font-semibold hover:underline">Sign in</button></>}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(modalNode, document.body);
}

function Field({ icon: Ico, type = 'text', placeholder, value, onChange, autoFocus, maxLength }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border bg-white focus-within:border-emerald2 focus-within:ring-2 focus-within:ring-emerald2/15 transition">
      <Ico className="size-4 text-muted-foreground" />
      <input type={type} placeholder={placeholder} value={value} onChange={(e)=>onChange(e.target.value)} autoFocus={autoFocus} maxLength={maxLength}
        className="flex-1 outline-none bg-transparent text-sm placeholder:text-muted-foreground" />
    </div>
  );
}
