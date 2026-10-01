'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MapPin, Inbox, User, Plus, X, Plane, Users } from 'lucide-react';

const NAV = [
  { id: 'explore', label: 'Explore', icon: Compass, href: '/explore' },
  { id: 'my-trips', label: 'My Trips', icon: MapPin, href: '/explore/my-trips' },
  { id: 'requests', label: 'Requests', icon: Inbox, href: '/explore/requests', badge: 3 },
  { id: 'me', label: 'Profile', icon: User, href: '/explore/me' },
];

export default function Shell({ children, hideNav = false, dark = false }) {
  const pathname = usePathname();
  const [fabOpen, setFabOpen] = useState(false);
  const startY = useRef(null);

  const isActive = (href) => {
    if (href === '/explore') return pathname === '/explore';
    return pathname.startsWith(href);
  };

  useEffect(() => { setFabOpen(false); }, [pathname]);

  // Mark <body> so the global mobile bottom-nav padding (globals.css) does NOT
  // stack with this shell's own `pb-28` nav clearance below — this was the
  // source of the large empty gap above the fixed bottom nav on mobile.
  useEffect(() => {
    document.body.classList.add('app-shell');
    return () => document.body.classList.remove('app-shell');
  }, []);

  useEffect(() => {
    if (!fabOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setFabOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [fabOpen]);

  const onTouchStart = (e) => { startY.current = e.touches?.[0]?.clientY ?? null; };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 60) { setFabOpen(false); startY.current = null; }
  };

  return (
    <div className={dark ? 'md:min-h-screen bg-slate-950 text-white' : 'md:min-h-screen bg-slate-50'}>
      <div className="pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] md:pb-28">{children}</div>

      {/* FAB backdrop */}
      {!hideNav && (
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${fabOpen ? 'pointer-events-auto bg-slate-900/50 backdrop-blur-md opacity-100' : 'pointer-events-none opacity-0'}`}
          onClick={() => setFabOpen(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          <div
            className={`absolute left-0 right-0 bottom-0 pb-[max(7rem,calc(env(safe-area-inset-bottom)+7rem))] px-4 transition-all duration-[300ms] ${fabOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto max-w-md">
              <div className="flex justify-center pb-2"><div className="h-1 w-10 rounded-full bg-white/70" /></div>

              <Link href="/explore/create" className={`flex items-center gap-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-900/25 p-4 active:scale-[0.98] transition-all duration-300 ${fabOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: fabOpen ? '80ms' : '0ms', transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)' }}>
                <div className="size-14 rounded-2xl bg-violet-100 grid place-items-center text-violet-600 shrink-0">
                  <Plane className="size-6" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[16px] text-slate-900">Create a Trip</div>
                  <div className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">Plan your own adventure and invite others to join.</div>
                </div>
                <ChevronR />
              </Link>

              <Link href="/explore/feed" className={`mt-3 flex items-center gap-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-900/25 p-4 active:scale-[0.98] transition-all duration-300 ${fabOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: fabOpen ? '150ms' : '0ms', transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)' }}>
                <div className="size-14 rounded-2xl bg-emerald-100 grid place-items-center text-emerald-600 shrink-0">
                  <Users className="size-6" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[16px] text-slate-900">Join a Trip</div>
                  <div className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">Discover community trips and request to join.</div>
                </div>
                <ChevronR />
              </Link>

              <div className={`mt-4 flex justify-center transition-all duration-300 ${fabOpen ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: fabOpen ? '220ms' : '0ms' }}>
                <button onClick={() => setFabOpen(false)} aria-label="Close" className="size-11 grid place-items-center rounded-full bg-white/95 backdrop-blur-xl border border-white/60 shadow-lg active:scale-95 transition">
                  <X className="size-5 text-slate-700" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      {!hideNav && (
        <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_-4px_rgba(15,23,42,0.08)] px-2 pt-2 pb-1.5">
            <div className="grid grid-cols-5 items-center max-w-md mx-auto">
              {NAV.slice(0, 2).map((it) => {
                const active = isActive(it.href);
                const Icon = it.icon;
                return (
                  <Link key={it.id} href={it.href} className="flex flex-col items-center gap-0.5 py-1.5 active:opacity-60 transition">
                    <Icon className={`size-[22px] transition-all duration-300 ${active ? 'text-violet-600 scale-110' : 'text-slate-400'}`} strokeWidth={active ? 2.4 : 2} />
                    <span className={`text-[10.5px] font-semibold tracking-tight ${active ? 'text-violet-600' : 'text-slate-500'}`}>{it.label}</span>
                  </Link>
                );
              })}

              <div className="flex justify-center">
                <button
                  onClick={() => setFabOpen(v => !v)}
                  aria-expanded={fabOpen}
                  aria-label={fabOpen ? 'Close menu' : 'Create or join trip'}
                  className={`size-14 rounded-full grid place-items-center text-white shadow-xl shadow-violet-400/40 active:scale-90 transition-all duration-[280ms] ${fabOpen ? 'bg-slate-900 rotate-[135deg]' : 'bg-gradient-to-br from-violet-500 to-fuchsia-600'}`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)' }}
                >
                  <Plus className="size-7" strokeWidth={2.6} />
                </button>
              </div>

              {NAV.slice(2).map((it) => {
                const active = isActive(it.href);
                const Icon = it.icon;
                return (
                  <Link key={it.id} href={it.href} className="flex flex-col items-center gap-0.5 py-1.5 active:opacity-60 transition">
                    <div className="relative">
                      <Icon className={`size-[22px] transition-all duration-300 ${active ? 'text-violet-600 scale-110' : 'text-slate-400'}`} strokeWidth={active ? 2.4 : 2} />
                      {it.badge && <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 min-w-[16px] h-4 grid place-items-center rounded-full bg-rose-500 text-white ring-2 ring-white">{it.badge}</span>}
                    </div>
                    <span className={`text-[10.5px] font-semibold tracking-tight ${active ? 'text-violet-600' : 'text-slate-500'}`}>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}

function ChevronR() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
