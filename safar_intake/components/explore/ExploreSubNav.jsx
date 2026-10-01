'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Users, Route, Camera, IdCard, Sparkles } from 'lucide-react';

const ITEMS = [
  { href: '/explore/home', label: 'Home', icon: Compass },
  { href: '/explore/community', label: 'Community', icon: Users },
  { href: '/explore/journey', label: 'Journey', icon: Route },
  { href: '/explore/wander', label: 'Wander', icon: Sparkles },
  { href: '/explore/stories', label: 'Stories', icon: Camera },
  { href: '/explore/passport', label: 'Passport', icon: IdCard },
];

export default function ExploreSubNav({ floating = false, isHome = false }) {
  const pathname = usePathname() || '';
  return (
    <>
      {/* Desktop sticky pill */}
      <nav
        className="e-subnav hidden md:block"
        aria-label="Explore sections"
        style={isHome ? { top: 68, marginTop: 68 } : { marginTop: 24 }}
      >
        <div className={`e-subnav-inner${floating ? ' e-subnav-inner--floating' : ''}`}>
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} data-active={active ? 'true' : 'false'} className="e-subnav-item">
                <Icon className="size-4" strokeWidth={2.2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Mobile bottom nav */}
      <nav className="e-bottomnav md:hidden" aria-label="Explore sections mobile">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} aria-label={label} data-active={active ? 'true' : 'false'}>
              <Icon className="size-5" strokeWidth={2.2} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
