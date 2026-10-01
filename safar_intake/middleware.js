import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// SAFAR CURATED — Premium Launch Mode middleware
// When Launch Mode is ENABLED (toggled from Super Admin panel), every PUBLIC
// route is rewritten to /launch (the premium landing page). Admin, dashboard,
// auth and API paths remain fully accessible so operations continue normally.
// The launch-mode flag is fetched from /api/launch-mode/public and cached in
// module-level memory for LAUNCH_TTL_MS to keep the request cost near-zero.
// ---------------------------------------------------------------------------

const LAUNCH_TTL_MS = 30_000; // 30s in-memory cache
let CACHE = { ts: 0, enabled: false };

// Paths that must never be intercepted (admins, api, auth flows, static assets)
const BYPASS_PREFIXES = [
  '/api',
  '/admin',
  '/dashboard',
  '/auth',
  '/launch',
  '/_next',
  '/favicon',
  '/robots',
  '/sitemap',
  '/manifest',
  '/og-',
];

function shouldBypass(pathname) {
  if (pathname === '/health') return true;
  // Skip any file with an extension (images, css, js, .well-known, etc)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  for (const p of BYPASS_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p)) return true;
  }
  return false;
}

async function fetchLaunchState(origin) {
  const now = Date.now();
  if (now - CACHE.ts < LAUNCH_TTL_MS) return CACHE.enabled;
  try {
    const r = await fetch(`${origin}/api/launch-mode/public`, {
      cache: 'no-store',
      headers: { 'x-mw-launch': '1' },
    });
    if (r.ok) {
      const j = await r.json();
      CACHE = { ts: now, enabled: !!(j?.settings?.enabled) };
    } else {
      CACHE = { ts: now, enabled: CACHE.enabled };
    }
  } catch {
    CACHE = { ts: now, enabled: CACHE.enabled };
  }
  return CACHE.enabled;
}

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;
  if (shouldBypass(pathname)) return NextResponse.next();

  const enabled = await fetchLaunchState(origin);
  if (!enabled) return NextResponse.next();

  // Rewrite the URL to /launch while preserving the incoming URL so we can
  // show it in the page if needed (analytics / return-to). Using rewrite (not
  // redirect) keeps the address bar intact — visitors see the requested URL.
  const url = request.nextUrl.clone();
  url.pathname = '/launch';
  url.search = '';
  return NextResponse.rewrite(url);
}

export const config = {
  // Run on everything EXCEPT the paths we handle inside shouldBypass. The
  // regex-based exclusion is a hard skip so we don't even invoke the fn for
  // static assets or the whitelisted routes.
  matcher: [
    '/((?!api|admin|dashboard|auth|launch|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)',
  ],
};
