// Firebase client-side initialization — FULLY LAZY.
//
// PERF (PageSpeed): The Firebase Auth SDK (`firebase/app` + `firebase/auth`)
// is ~100 KB gzipped and has non-trivial parse/execute cost. Previously this
// module ran `initializeApp` + `getAuth` at module-load time, which meant
// the entire Firebase Auth SDK shipped in whichever chunk imported this file
// (today: AuthModal — dynamic — but any static importer would poison the
// initial bundle).
//
// After this change, the Firebase SDK modules are imported ONLY when
// `getFirebaseAuth()` is first called (e.g. from the Google Sign-In or Phone
// OTP handler in AuthModal). The app instance is memoised so subsequent
// calls are effectively free.
//
// No API/UI/auth-flow change — callers just `await getFirebaseAuth()`
// instead of reading the `auth` symbol.

let _authPromise = null;

export function getFirebaseAuth() {
  if (_authPromise) return _authPromise;
  _authPromise = (async () => {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey || apiKey.includes('Dummy')) return null;
    try {
      const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);
      const firebaseConfig = {
        apiKey,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      return getAuth(app);
    } catch (error) {
      console.warn('Firebase initialization skipped:', error.message);
      return null;
    }
  })();
  return _authPromise;
}

// Backwards-compat placeholder — the previous `auth` export is now null so
// any accidental early access won't crash but also won't work. All real
// callers must go through `getFirebaseAuth()`.
export const auth = null;
