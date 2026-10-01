'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Plus, Search, MapPin, MessageCircle, Award, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// -------------------------------------------------------------------
// EXPLORE V3 — Dedicated navigation shell.
// Replaces the global Safar Navbar/Footer within all /explore/* routes.
// 7 items only: Explore, Publish, Join, Live Map, Messenger, Rewards, Profile.
// -------------------------------------------------------------------
const NAV = [
  { href: '/explore/home',      label: 'Explore',       icon: Compass },
  { href: '/explore/journey',   label: 'Publish a Trip', icon: Plus, primary: true },
  { href: '/explore/join',      label: 'Join a Trip',   icon: Search },
  { href: '/explore/map',       label: 'Live Map',      icon: MapPin },
  { href: '/explore/messenger', label: 'Messenger',     icon: MessageCircle },
  { href: '/explore/rewards',   label: 'Rewards',       icon: Award },
  { href: '/explore/profile',   label: 'Profile',       icon: User },
];

export default function ExploreShell2({ children }) {
  const { user } = useAuth();
  const pathname = usePathname() || '';

  return (
    <div className="min-h-screen bg-white text-charcoal flex flex-col">
      {/* Desktop / tablet header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-emerald-100">
        <div className="container h-16 flex items-center gap-3">
          <Link href="/explore/home" className="flex items-center gap-2.5 shrink-0">
            <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 grid place-items-center shadow-md">
              <Compass className="size-4 text-amber-300" strokeWidth={2.6} />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-charcoal text-sm">Explore</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-emerald2 -mt-0.5">Safar Community</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV.map(({ href, label, icon: Icon, primary }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link key={href} href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                    primary && !active ? 'bg-emerald2 text-white hover:bg-emerald2-deep' :
                    active ? 'bg-emerald-50 text-emerald2 border border-emerald-200' :
                    'text-charcoal/70 hover:text-charcoal hover:bg-emerald-50/60'
                  }`}>
                  <Icon className="size-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="hidden md:inline text-xs text-muted-foreground hover:text-charcoal">← Main site</Link>
            {user ? (
              <Link href="/explore/profile" className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border bg-white hover:bg-emerald-50/60 transition">
                <div className="size-7 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-950 grid place-items-center text-white text-xs font-bold">{(user.name || 'S').charAt(0).toUpperCase()}</div>
                <span className="text-xs font-semibold text-charcoal hidden sm:inline max-w-[100px] truncate">{user.name || 'Traveller'}</span>
              </Link>
            ) : (
              <Link href="/?auth=1" className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-emerald2 text-white text-sm font-semibold">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-emerald-100">
        <div className="grid grid-cols-7 h-16">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} className={`flex flex-col items-center justify-center gap-0.5 transition ${active ? 'text-emerald2' : 'text-charcoal/60'}`}>
                <Icon className="size-5" />
                <span className="text-[9px] font-semibold truncate w-full text-center px-0.5">{label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
