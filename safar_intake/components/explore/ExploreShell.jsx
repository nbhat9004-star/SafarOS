'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { LogIn, MapPin, Bell, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import ExploreSubNav from './ExploreSubNav';
import ThemeToggle from './ThemeToggle';

function NotificationBell({ floating }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/notifications');
      const j = await r.json();
      if (j.ok) setData({ notifications: j.notifications || [], unreadCount: j.unreadCount || 0 });
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  const markAll = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setData(d => ({ ...d, unreadCount: 0, notifications: d.notifications.map(n => ({ ...n, read: true })) }));
  };
  const btnStyle = floating
    ? { background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)', color: '#fff', backdropFilter: 'blur(10px)' }
    : { background: 'var(--e-surface)', borderColor: 'var(--e-line-strong)' };
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative size-8 rounded-full border grid place-items-center transition hover:opacity-90" style={btnStyle} aria-label="Notifications">
        <Bell className="size-4" style={{ color: floating ? '#fff' : 'var(--e-text)' }} />
        {data.unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center">{data.unreadCount > 9 ? '9+' : data.unreadCount}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto e-glass rounded-2xl border border-white/15 shadow-xl z-40 p-2" style={{ background: 'rgba(15,20,32,0.95)' }}>
            <div className="flex items-center justify-between px-2 py-1">
              <div className="text-xs font-semibold" style={{ color: 'var(--e-text)' }}>Notifications</div>
              {data.unreadCount > 0 && <button onClick={markAll} className="text-[10px] e-grad-text font-semibold">Mark all read</button>}
            </div>
            {loading && <div className="p-4 text-center"><Loader2 className="size-4 animate-spin mx-auto text-white/50" /></div>}
            {!loading && data.notifications.length === 0 && <div className="p-4 text-center text-xs" style={{ color: 'var(--e-text-muted)' }}>No notifications yet.</div>}
            <div className="space-y-1">
              {data.notifications.slice(0, 20).map(n => (
                <Link key={n.id} href={n.link || '/explore/home'} onClick={() => setOpen(false)} className={`block p-2 rounded-lg transition hover:bg-white/[0.05] ${!n.read ? 'bg-emerald-400/[0.06]' : ''}`}>
                  <div className="text-xs font-semibold" style={{ color: 'var(--e-text)' }}>{n.title}</div>
                  {n.body && <div className="text-[11px] line-clamp-2" style={{ color: 'var(--e-text-muted)' }}>{n.body}</div>}
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--e-text-dim)' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ExploreShell({ children }) {
  const { user } = useAuth();
  const pathname = usePathname() || '';
  const isHome = pathname === '/explore/home' || pathname === '/explore/home/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  // Floating (transparent-over-hero) when: on home page AND at top of scroll
  const floating = isHome && !scrolled;

  const headerStyle = floating
    ? {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        boxShadow: 'none',
      }
    : {
        backgroundColor: 'color-mix(in srgb, var(--e-ink) 62%, transparent)',
        borderColor: 'var(--e-line)',
        boxShadow: '0 6px 24px -18px rgba(0,0,0,0.35)',
      };
  const textColor = floating ? '#ffffff' : 'var(--e-text)';
  const dimColor  = floating ? 'rgba(255,255,255,0.75)' : 'var(--e-text-dim)';
  const chipStyle = floating
    ? { background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)', color: '#fff', backdropFilter: 'blur(10px)' }
    : { background: 'var(--e-surface)', borderColor: 'var(--e-line-strong)' };

  return (
    <div className="explore-root" data-explore-home={isHome ? 'true' : 'false'}>
      {/* Pre-hydration theme init */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('safar-explore-theme')||'premium';document.documentElement.setAttribute('data-explore-theme',t);}catch(e){document.documentElement.setAttribute('data-explore-theme','premium');}})();`,
        }}
      />
      <header
        className={`${isHome ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-40 border-b transition-all duration-300 ${floating ? '' : 'backdrop-blur-md'}`}
        style={headerStyle}
      >
        <div className="e-container h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/explore/home" className="inline-flex items-center gap-2 shrink-0">
              <div className="size-7 rounded-lg bg-gradient-to-br from-emerald-300 via-violet-400 to-fuchsia-400 grid place-items-center shadow-lg shadow-violet-500/30">
                <MapPin className="size-3.5 text-[#06080f]" strokeWidth={2.6} />
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-sm transition-colors" style={{ color: textColor, textShadow: floating ? '0 1px 8px rgba(0,0,0,0.35)' : 'none' }}>Explore</div>
                <div className="text-[9px] uppercase tracking-[0.22em] -mt-0.5 transition-colors" style={{ color: dimColor, textShadow: floating ? '0 1px 6px rgba(0,0,0,0.35)' : 'none' }}>Living Travel World</div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <ThemeToggle compact floating={floating} />
            {user && <NotificationBell floating={floating} />}
            {user ? (
              <Link
                href={`/explore/u/${user.username || user.id}`}
                className="inline-flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full border transition hover:opacity-90 min-w-0 max-w-[52px] sm:max-w-[160px] md:max-w-[200px] overflow-hidden"
                style={chipStyle}
                title={user.name || 'Traveler'}
                aria-label={`View profile for ${user.name || 'Traveler'}`}
              >
                <div className="size-6 rounded-full bg-gradient-to-br from-emerald-300 to-violet-400 grid place-items-center text-[10px] font-bold text-[#06080f] shrink-0">
                  {(user.name || user.email || 'S').charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs truncate" style={{ color: floating ? '#fff' : 'var(--e-text-muted)' }}>{user.name || 'Traveler'}</span>
              </Link>
            ) : (
              <Link href="/?auth=1" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold e-btn-primary">
                <LogIn className="size-3.5" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      {/* Sub-nav — pushed further down on home so it sits inside/below the hero visually */}
      <div className={`e-container flex justify-center ${isHome ? 'relative z-30' : ''}`} style={isHome ? { marginTop: 0 } : undefined}>
        <ExploreSubNav floating={floating} isHome={isHome} />
      </div>
      <main className="relative">{children}</main>
    </div>
  );
}
