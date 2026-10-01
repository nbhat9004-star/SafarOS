'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import { Menu, User, UserPlus, Sparkles, MapPin, Compass, Bell, MessageCircle, Shield, ChevronDown, Store, Wand2, Home, Instagram, Facebook, Twitter, Linkedin, Mail, Globe, LifeBuoy, Briefcase, Newspaper, Heart, Scale, Languages, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AuthButtons, MobileAuthButtons } from '@/components/safar/AuthButtons';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';

// PERF: AuthModal is only mounted when the user opens the sign-in/sign-up
// dialog. Splitting it out means the ~15KB Radix Dialog + form + validation
// bundle no longer ships on the initial paint of every marketplace page.
const AuthModal = dynamic(() => import('@/components/safar/AuthModal'), { ssr: false });

// PERF: LocationModal only mounts when the user taps the location selector.
const LocationModal = dynamic(() => import('@/components/safar/LocationModal'), { ssr: false });

export default function Navbar({ transparent = false }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'login' | 'signup' | null
  const [safarTogetherEnabled, setSafarTogetherEnabled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  // Module 11A — "More" dropdown (desktop)
  const [showMore, setShowMore] = useState(false);
  // Mobile drawer "More" section — collapsed by default; user must tap to expand
  const [showMobileMore, setShowMobileMore] = useState(false);
  // Polarsteps-style main-menu card expansion state (Help Center / News & Press / Legal)
  const [expandedCard, setExpandedCard] = useState(null);
  const [lang, setLang] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);
  // Location selector modal (mobile Kashmir pill) + user's chosen location.
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  // Desktop nav — "Experience" (marketplace) dropdown
  const [showExperience, setShowExperience] = useState(false);

  // Marketplace categories, consolidated behind a single "Experience" entry
  // point in the desktop nav to reduce header clutter without changing routes.
  const EXPERIENCE_CATEGORIES = [
    { href: '/explore?cat=all',        label: 'Stays' },
    { href: '/explore?cat=experience', label: 'Experiences' },
    { href: '/explore?cat=transport',  label: 'Bikes & Cars' },
    { href: '/explore?cat=tour',       label: 'Tour Guides' },
    { href: '/explore?cat=shopping',   label: 'Shopping' },
  ];
  
  // Module 11A — informational links, expanded to include former footer
  // content (Company / Legal / Support / Connect / Contact). Grouped so the
  // "More" menu now covers everything the global footer previously did.
  const MORE_SECTIONS = [
    {
      title: 'Company',
      items: [
        { label: 'About Safar',   href: '/about' },
        { label: 'Contact Us',    href: '/contact' },
        { label: 'Careers',       href: '/careers',        soon: true },
        { label: 'Blog / Stories', href: '/explore/stories' },
        { label: 'Press & Media', href: '/press',          soon: true },
      ],
    },
    {
      title: 'Legal',
      items: [
        { label: 'Privacy Policy',      href: '/privacy' },
        { label: 'Terms & Conditions',  href: '/terms' },
        { label: 'Refund Policy',       href: '/cancellation-policy' },
        { label: 'Cookies Policy',      href: '/cookies',            soon: true },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center',           href: '/help' },
        { label: 'FAQs',                  href: '/help#faqs' },
        { label: 'Support',               href: '/contact' },
        { label: 'Trust & Safety',        href: '/trust-safety' },
        { label: 'Community Guidelines',  href: '/community-guidelines', soon: true },
      ],
    },
    {
      title: 'Connect',
      items: [
        { label: 'Instagram',   href: 'https://instagram.com/safarcurated',        external: true, icon: Instagram },
        { label: 'Facebook',    href: 'https://facebook.com/safarcurated',         external: true, icon: Facebook },
        { label: 'X (Twitter)', href: 'https://twitter.com/safarcurated',          external: true, icon: Twitter },
        { label: 'LinkedIn',    href: 'https://linkedin.com/company/safarcurated', external: true, icon: Linkedin },
      ],
    },
    {
      title: 'Contact',
      items: [
        { label: 'hello@safarcurated.com', href: 'mailto:hello@safarcurated.com', external: true, icon: Mail },
        { label: 'Srinagar, Kashmir',      href: '/contact',                                       icon: MapPin },
      ],
    },
  ];
  
  // Load persisted user location on mount + listen for cross-tab / same-tab
  // updates so the Kashmir pill always reflects the freshest choice.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('safar_location');
      if (raw) setSelectedLocation(JSON.parse(raw));
    } catch { /* ignore */ }
    const onLocChange = (e) => setSelectedLocation(e?.detail || null);
    window.addEventListener('safar:location-changed', onLocChange);
    return () => window.removeEventListener('safar:location-changed', onLocChange);
  }, []);
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Close notifications / more / experience menu on outside click
    const handleClick = (e) => {
      if (showNotifications && !e.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
      if (showMore && !e.target.closest('.more-dropdown')) {
        setShowMore(false);
      }
      if (showExperience && !e.target.closest('.experience-dropdown')) {
        setShowExperience(false);
      }
    };
    document.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', handleClick);
    };
  }, [showNotifications, showMore, showExperience]);
  
  useEffect(() => {
    fetch('/api/settings/safar-together').then(r => r.json()).then(d => setSafarTogetherEnabled(d.enabled));
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  // If we arrive with ?auth=1 (e.g. redirected from Safar Circle), auto-open the
  // AuthModal. The returnUrl (also in the query string) is picked up by AuthModal
  // itself after successful auth, then we push the user back to that Circle page.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === '1' && !user) {
        setAuthMode('login');
        // Strip `auth=1` from the visible URL so a refresh doesn't reopen the modal.
        params.delete('auth');
        const qs = params.toString();
        const cleaned = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
        window.history.replaceState({}, '', cleaned);
      }
    } catch {}
  }, [user]);
  
  const loadNotifications = async () => {
    if (!user) return;
    const res = await fetch('/api/notifications');
    const data = await res.json();
    if (data.ok) {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }
  };
  
  const markAsRead = async (notificationId) => {
    await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
    loadNotifications();
  };
  
  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    loadNotifications();
  };
  
  const solid = !transparent || scrolled;

  // Filter navigation based on user role
  const getVisibleNavItems = () => {
    // Admin/Super Admin users: Show ONLY admin navigation
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return [
        { href: '/admin/marketplace/dashboard', label: 'Dashboard' }
      ];
    }

    // Universal customer navigation — EXACTLY these five primary items on
    // both desktop (top nav) and mobile (bottom nav). "Become a Host" is
    // intentionally NOT part of primary navigation: it has been moved into
    // the Sign in / Sign up screen and the account menu (see AuthModal +
    // AuthButtons for the new location).
    return [
      { href: '/marketplace',         label: 'Marketplace' },
      { href: '/build-trip',          label: 'Build My Trip' },
      { href: '/ai-planner',          label: 'AI Trip Planner' },
      { href: '/explore/home',        label: 'Explore' },
      { href: '/near-me',             label: 'Near Me' },
    ];
  };

  // Polarsteps-inspired large icon-card menu (mobile drawer). Groups every
  // informational/support/legal destination under 6 top-level cards with
  // sub-items collapsed by default. All routes below map to existing pages;
  // pages that don't yet exist are marked `soon` so they never 404.
  const MAIN_MENU_CARDS = [
    {
      key: 'about',
      title: 'About Safar Curated',
      subtitle: 'Discover our mission and vision.',
      icon: Globe,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      href: '/about',
    },
    {
      key: 'help',
      title: 'Help Center',
      subtitle: 'Support, safety, bookings & payments.',
      icon: LifeBuoy,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      children: [
        { label: 'Help Center',            href: '/help' },
        { label: 'FAQs',                   href: '/help#faqs' },
        { label: 'Contact Support',        href: '/contact' },
        { label: 'Report a Problem',       href: '/contact' },
        { label: 'Safety',                 href: '/trust-safety' },
        { label: 'Booking Support',        href: '/help' },
        { label: 'Payments Support',       href: '/help' },
        { label: 'Become a Host Support',  href: '/add-listing' },
      ],
    },
    {
      key: 'careers',
      title: 'Careers',
      subtitle: 'Join our growing team.',
      icon: Briefcase,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      href: '#',
      soon: true,
    },
    {
      key: 'news',
      title: 'News & Press',
      subtitle: 'Latest updates and media coverage.',
      icon: Newspaper,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      children: [
        { label: 'News',           href: '#', soon: true },
        { label: 'Press Releases', href: '#', soon: true },
        { label: 'Media Kit',      href: '#', soon: true },
        { label: 'Announcements',  href: '#', soon: true },
      ],
    },
    {
      key: 'stories',
      title: 'Stories',
      subtitle: 'Travel stories, guides and inspiration.',
      icon: Heart,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      href: '/explore/stories',
    },
    {
      key: 'legal',
      title: 'Legal',
      subtitle: 'Policies and legal terms.',
      icon: Scale,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      children: [
        { label: 'Privacy Policy',      href: '/privacy' },
        { label: 'Terms & Conditions',  href: '/terms' },
        { label: 'Refund Policy',       href: '/cancellation-policy' },
        { label: 'Cookie Policy',       href: '#', soon: true },
        { label: 'Community Guidelines', href: '#', soon: true },
        { label: 'Host Terms',          href: '#', soon: true },
        { label: 'Traveller Terms',     href: '#', soon: true },
      ],
    },
  ];

  const SOCIAL_LINKS = [
    { href: 'https://instagram.com/safarcurated',        icon: Instagram, label: 'Instagram' },
    { href: 'https://facebook.com/safarcurated',         icon: Facebook,  label: 'Facebook' },
    { href: 'https://twitter.com/safarcurated',          icon: Twitter,   label: 'X (Twitter)' },
    { href: 'https://linkedin.com/company/safarcurated', icon: Linkedin,  label: 'LinkedIn' },
  ];

  const visibleNav = getVisibleNavItems();

  // Mobile bottom navigation items — mirror the primary destinations previously
  // surfaced through the hamburger drawer. Hidden for admin/super_admin who
  // only see their admin nav.
  const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin';
  // Universal mobile bottom navigation — MUST mirror the desktop top nav
  // exactly. Same 5 primary items, same order. "Become a Host" is NOT in
  // primary nav; it has been moved into the Sign in / Sign up screen and
  // the account menu.
  // Native-app style bottom navigation. Targets reuse existing routes only.
  const BOTTOM_NAV_ITEMS = [
    { href: '/',                            label: 'Home',    icon: Home,      match: (p) => p === '/' },
    { href: '/explore',                     label: 'Explore', icon: Compass,   match: (p) => p.startsWith('/explore') || p.startsWith('/marketplace') },
    { href: '/dashboard/traveler/bookings', label: 'Trips',   icon: Briefcase, match: (p) => p.startsWith('/dashboard/traveler/bookings') || p.startsWith('/trip') },
    { href: '/wishlist',                    label: 'Saved',   icon: Heart,     match: (p) => p.startsWith('/wishlist') || p.includes('/wishlist') },
    { href: '/dashboard/traveler',          label: 'Profile', icon: User,      match: (p) => p === '/dashboard/traveler' || p.startsWith('/dashboard/traveler/messages') },
  ];

  return (
    <>
    <header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04),0_2px_10px_-2px_rgba(15,20,25,0.06)] ${solid ? 'md:glass-nav md:border-b md:border-border/60 md:shadow-[0_4px_30px_-12px_rgba(15,20,25,0.18)]' : 'md:bg-transparent md:shadow-none'}`}
    >
      <div className="container flex h-16 lg:h-20 items-center justify-between gap-3 md:gap-4">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="size-9 md:size-10 rounded-2xl bg-gradient-emerald grid place-items-center shadow-lg shadow-emerald2/25 ring-1 ring-white/20">
            <MapPin className="size-5 text-gold" strokeWidth={2.4} />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className={`font-display font-bold text-xl tracking-tight ${solid ? 'text-charcoal' : 'text-charcoal md:text-white'}`}>Safar</span>
            <span className={`text-[10px] uppercase tracking-[0.22em] -mt-0.5 ${solid ? 'text-muted-foreground' : 'text-muted-foreground md:text-white/70'}`}>Kashmir · Curated</span>
          </div>
          <span className={`sm:hidden font-display font-bold text-lg tracking-tight ${solid ? 'text-charcoal' : 'text-charcoal md:text-white'}`}>Safar</span>
        </Link>

        {/* Mobile location chip — Polarsteps-inspired pill that opens the
            LocationModal instead of navigating. Shows detected/selected
            location, falling back to "Kashmir". */}
        {!isAdminUser && (
          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            aria-label="Change location"
            aria-haspopup="dialog"
            className="md:hidden flex-1 min-w-0 mx-1 flex items-center justify-center gap-1.5 h-10 px-3 rounded-full bg-secondary/70 border border-border/50 text-charcoal text-[13px] font-semibold hover:bg-secondary transition-colors active:scale-[0.98]"
          >
            <MapPin className="size-3.5 text-emerald2 shrink-0" strokeWidth={2.4} />
            <span className="truncate">{selectedLocation?.name || 'Kashmir'}</span>
            <ChevronDown className="size-3.5 text-muted-foreground/70 shrink-0" />
          </button>
        )}

        <nav className="hidden xl:flex items-center gap-0.5">
          {/* Universal top navigation — exactly 5 primary items shared with
              the mobile bottom nav (see BOTTOM_NAV_ITEMS). No dropdowns,
              no CTAs, no "Become a Host" here. */}
          {visibleNav.map((n) => (
            <Link key={n.href} href={n.href}
              className={`px-3.5 py-2 rounded-full text-[13.5px] font-medium tracking-tight transition-colors ${solid ? 'text-charcoal/80 hover:text-charcoal hover:bg-secondary' : 'text-white/85 hover:text-white hover:bg-white/10'}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Season Card — compact, desktop-only. Auto-switches by month with
              lightweight CSS-only seasonal ambience animation. Rendered
              client-side to avoid SSR/TZ hydration edge cases. */}
          <SeasonCard solid={solid} />

          {/* Notification Bell */}
          {user && (
            <div className="relative">
              <Button
                onClick={() => setShowNotifications(!showNotifications)}
                variant="ghost"
                size="icon"
                className="relative rounded-full"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-rose-600 text-white text-[10px] grid place-items-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border shadow-lg z-50 max-h-[500px] overflow-hidden flex flex-col notification-dropdown">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="font-semibold">Notifications</div>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-emerald2 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        <Bell className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            if (notif.link) router.push(notif.link);
                            setShowNotifications(false);
                          }}
                          className={`p-4 border-b hover:bg-secondary cursor-pointer ${!notif.read ? 'bg-emerald2/5' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className="size-10 rounded-full bg-gradient-emerald grid place-items-center text-white flex-shrink-0">
                              {notif.type === 'chat_message' ? <MessageCircle className="size-5" /> : <Bell className="size-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">{notif.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{notif.description || notif.body}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {new Date(notif.createdAt).toLocaleString()}
                              </div>
                            </div>
                            {!notif.read && (
                              <div className="size-2 rounded-full bg-emerald2 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => { setShowNotifications(false); router.push('/notifications'); }}
                    className="border-t p-3 text-sm font-semibold text-emerald2 hover:bg-secondary text-center"
                  >
                    View all notifications →
                  </button>
                </div>
              )}
            </div>
          )}
          
          <AuthButtons solid={solid} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                whileTap={{ scale: 1.05 }}
                transition={{ duration: 0.15 }}
                className="xl:hidden relative rounded-full p-2.5 bg-white/18 backdrop-blur-md border border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-white/25 transition-colors duration-200"
              >
                <div
                  animate={{ 
                    rotate: open ? 180 : [0, 360, 360],
                  }}
                  transition={
                    open 
                      ? { duration: 0.3, ease: "easeInOut" }
                      : {
                          duration: 12,
                          times: [0, 0.95, 1],
                          repeat: Infinity,
                          ease: "linear",
                        }
                  }
                  className="relative"
                >
                  <Compass className="size-5 text-gold" style={{ strokeWidth: 2.4 }} />
                </div>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] sm:w-[420px] p-0 bg-background flex flex-col" style={{ height: '100dvh', maxHeight: '100dvh' }}>
              {/* Top Section — Safar Curated logo + branding; ShadCN Sheet renders X close top-right.
                  Uses env(safe-area-inset-top) so the logo/tagline never clip on notched devices. */}
              <div
                className="border-b flex-shrink-0"
                style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)', paddingBottom: 20, paddingLeft: 20, paddingRight: 20 }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-11 rounded-2xl bg-gradient-emerald grid place-items-center shadow-md shadow-emerald2/25 ring-1 ring-white/20">
                    <MapPin className="size-5 text-gold" strokeWidth={2.4} />
                  </div>
                  <div className="leading-tight">
                    <div className="font-display font-bold text-[17px]">Safar Curated</div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">Kashmir · Handpicked</div>
                  </div>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 pb-6 space-y-5">
                  {/* Auth buttons (Polarsteps-style pair) — only when logged out */}
                  {!user && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => { setOpen(false); setAuthMode('login'); }}
                        className="h-11 rounded-full bg-white border border-border text-charcoal font-semibold text-[14px] hover:bg-secondary/70 transition"
                      >
                        Sign in
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOpen(false); setAuthMode('signup'); }}
                        className="h-11 rounded-full bg-gradient-emerald text-white font-semibold text-[14px] shadow-md shadow-emerald2/25 hover:shadow-lg hover:shadow-emerald2/40 transition"
                      >
                        Sign up
                      </button>
                    </div>
                  )}

                  {/* Social + Language row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className="size-10 rounded-full bg-secondary hover:bg-secondary/70 grid place-items-center text-charcoal/70 hover:text-charcoal transition"
                        >
                          <Icon className="size-[16px]" strokeWidth={2} />
                        </a>
                      ))}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowLangMenu((v) => !v)}
                        aria-expanded={showLangMenu}
                        className="h-10 px-3 rounded-full bg-secondary hover:bg-secondary/70 flex items-center gap-1.5 text-[13px] font-semibold text-charcoal transition"
                      >
                        <Languages className="size-4" />
                        <span className="truncate max-w-[80px]">{lang}</span>
                        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                      </button>
                      {showLangMenu && (
                        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl border shadow-lg py-1 min-w-[150px] z-10">
                          {['English', 'हिन्दी', 'اردو'].map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => { setLang(l); setShowLangMenu(false); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition ${lang === l ? 'text-emerald2 font-semibold' : 'text-charcoal'}`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account shortcuts — logged-in users only (preserves existing routes) */}
                  {user && (
                    <div className="space-y-1">
                      {(user.role === 'traveler' || user.role === 'admin' || user.role === 'super_admin') && (
                        <Link href="/dashboard/traveler/bookings" onClick={() => setOpen(false)} className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-secondary transition">
                          <div className="size-11 rounded-2xl bg-secondary grid place-items-center"><Compass className="size-5 text-charcoal/70" strokeWidth={2.2} /></div>
                          <div className="flex-1 min-w-0"><div className="text-[15.5px] font-semibold text-charcoal leading-tight">My Bookings</div><div className="text-[12px] text-muted-foreground mt-0.5 truncate">Your trips and reservations.</div></div>
                        </Link>
                      )}
                      {(user.role === 'host' || user.role === 'admin' || user.role === 'super_admin') && (
                        <Link href="/dashboard/host" onClick={() => setOpen(false)} className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-secondary transition">
                          <div className="size-11 rounded-2xl bg-secondary grid place-items-center"><Home className="size-5 text-charcoal/70" strokeWidth={2.2} /></div>
                          <div className="flex-1 min-w-0"><div className="text-[15.5px] font-semibold text-charcoal leading-tight">Host Dashboard</div><div className="text-[12px] text-muted-foreground mt-0.5 truncate">Manage your listings.</div></div>
                        </Link>
                      )}
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-secondary transition">
                          <div className="size-11 rounded-2xl bg-secondary grid place-items-center"><Shield className="size-5 text-charcoal/70" strokeWidth={2.2} /></div>
                          <div className="flex-1 min-w-0"><div className="text-[15.5px] font-semibold text-charcoal leading-tight">Admin Dashboard</div><div className="text-[12px] text-muted-foreground mt-0.5 truncate">Platform administration.</div></div>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Main menu cards — Polarsteps-inspired large icon rows */}
                  <div className="space-y-1">
                    {MAIN_MENU_CARDS.map((card) => {
                      const Icon = card.icon;
                      const expanded = expandedCard === card.key;
                      const hasChildren = Array.isArray(card.children) && card.children.length > 0;
                      const rowInner = (
                        <>
                          <div className={`size-11 rounded-2xl grid place-items-center shrink-0 ${card.iconBg}`}>
                            <Icon className={`size-5 ${card.iconColor}`} strokeWidth={2.2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[15.5px] font-semibold text-charcoal leading-tight flex items-center gap-2">
                              <span className="truncate">{card.title}</span>
                              {card.soon && <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border">Soon</span>}
                            </div>
                            {card.subtitle && <div className="text-[12px] text-muted-foreground mt-0.5 truncate">{card.subtitle}</div>}
                          </div>
                          {hasChildren && (
                            <ChevronDown className={`size-4 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          )}
                        </>
                      );
                      return (
                        <div key={card.key}>
                          {card.soon ? (
                            <span className="w-full flex items-center gap-3.5 p-3 rounded-2xl text-muted-foreground cursor-not-allowed">{rowInner}</span>
                          ) : hasChildren ? (
                            <button
                              type="button"
                              onClick={() => setExpandedCard(expanded ? null : card.key)}
                              aria-expanded={expanded}
                              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-secondary transition text-left"
                            >
                              {rowInner}
                            </button>
                          ) : (
                            <Link
                              href={card.href}
                              onClick={() => setOpen(false)}
                              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-secondary transition"
                            >
                              {rowInner}
                            </Link>
                          )}
                          {hasChildren && (
                            <div className={`overflow-hidden transition-all duration-300 ease-out ${expanded ? 'max-h-[640px] opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
                              <div className="pl-14 pr-2 space-y-0.5 py-1">
                                {card.children.map((ch) => {
                                  const chDisabled = ch.soon;
                                  const chExternal = ch.external;
                                  const chCls = `flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13.5px] transition ${chDisabled ? 'text-muted-foreground cursor-not-allowed' : 'text-charcoal/85 hover:bg-secondary hover:text-charcoal'}`;
                                  const chContent = (
                                    <>
                                      <span className="truncate">{ch.label}</span>
                                      {chDisabled && <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-secondary/70 text-muted-foreground border">Soon</span>}
                                    </>
                                  );
                                  if (chDisabled) return <span key={ch.label} className={chCls}>{chContent}</span>;
                                  if (chExternal) return <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={chCls}>{chContent}</a>;
                                  return <Link key={ch.label} href={ch.href} onClick={() => setOpen(false)} className={chCls}>{chContent}</Link>;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Extra padding at bottom to ensure last item is always visible */}
                  <div className="h-6" />
                </div>
              </div>

              {/* Fixed Account Section at Bottom — ONLY rendered when the
                  user is logged in (shows profile card + View Profile + Logout).
                  For logged-out users the Sign in / Sign up pair at the top of
                  the scrollable body is the single entry point — a second
                  copy here would be a duplicate and leave dead space when
                  removed on short viewports. Uses safe-area inset for iOS. */}
              {user && (
                <div className="border-t flex-shrink-0 bg-background" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                  <div className="p-4">
                    <div className="mb-3">
                      <div className="px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Account</div>
                    </div>
                    <MobileAuthButtons onClose={()=>setOpen(false)} onOpenAuth={(m)=>setAuthMode(m)} />
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Root-level AuthModal so Radix Sheet's pointer-events lock doesn't pass clicks through to nav Links underneath. */}
      <AuthModal open={!!authMode} defaultMode={authMode || 'login'} onClose={()=>setAuthMode(null)} />
      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onLocationSelected={(loc) => setSelectedLocation(loc)}
      />
    </header>

    {/* Mobile bottom navigation — Premium floating design.
        - Floats above content with rounded corners + soft shadow + subtle ring.
        - Fixed at bottom, respects iOS/Android safe-area.
        - ~28% shorter than previous edge-to-edge version.
        - Compact active pill (icon + label) in soft emerald.
        - Hidden for admin/super_admin. Desktop nav unaffected (md:hidden). */}
    {!isAdminUser && (
      <nav
        aria-label="Primary mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="pointer-events-auto mx-3 mb-2 bg-white rounded-3xl border border-black/[0.06] ring-1 ring-black/[0.04] shadow-[0_14px_36px_-14px_rgba(15,20,25,0.28),0_2px_6px_rgba(15,20,25,0.06)]">
          <ul className="grid grid-cols-5 items-stretch px-1 py-1">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname || '');
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 min-h-[44px] rounded-2xl transition-all duration-250 ease-out ${
                      active ? 'bg-emerald-50' : 'hover:bg-black/[0.03] active:bg-black/[0.05]'
                    }`}
                  >
                    <Icon
                      className={`size-[22px] transition-all duration-250 ${
                        active ? 'text-emerald-700 scale-105' : 'text-slate-500'
                      }`}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    <span
                      className={`text-[9.5px] leading-none tracking-tight whitespace-nowrap transition-colors duration-250 ${
                        active ? 'text-emerald-700 font-semibold' : 'text-slate-500 font-medium'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    )}
    </>
  );
}

// -----------------------------------------------------------------------------
// SeasonCard — compact seasonal indicator rendered on the far-right of the
// desktop nav (before Sign In). Auto-selects the current Kashmir season from
// the visitor's local month. Hidden on tablet/mobile to keep spacing tight.
// Ambience animation is 100% CSS (see `.season-card` rules in globals.css).
// -----------------------------------------------------------------------------
const SEASONS_BY_MONTH = {
  0:  { key: 'winter', icon: '❄️', title: 'Winter in Kashmir', subtitle: 'Snowfall Season' },
  1:  { key: 'winter', icon: '❄️', title: 'Winter in Kashmir', subtitle: 'Snowfall Season' },
  2:  { key: 'spring', icon: '🌸', title: 'Spring in Kashmir', subtitle: 'Tulip Season' },
  3:  { key: 'spring', icon: '🌸', title: 'Spring in Kashmir', subtitle: 'Tulip Season' },
  4:  { key: 'spring', icon: '🌸', title: 'Spring in Kashmir', subtitle: 'Tulip Season' },
  5:  { key: 'summer', icon: '☀️', title: 'Summer in Kashmir', subtitle: 'Valley Escape' },
  6:  { key: 'summer', icon: '☀️', title: 'Summer in Kashmir', subtitle: 'Valley Escape' },
  7:  { key: 'summer', icon: '☀️', title: 'Summer in Kashmir', subtitle: 'Valley Escape' },
  8:  { key: 'autumn', icon: '🍁', title: 'Autumn in Kashmir', subtitle: 'Golden Chinars' },
  9:  { key: 'autumn', icon: '🍁', title: 'Autumn in Kashmir', subtitle: 'Golden Chinars' },
  10: { key: 'autumn', icon: '🍁', title: 'Autumn in Kashmir', subtitle: 'Golden Chinars' },
  11: { key: 'winter', icon: '❄️', title: 'Winter in Kashmir', subtitle: 'Snowfall Season' },
};

function SeasonCard({ solid }) {
  // Compute on client to avoid server/client TZ drift causing hydration diffs.
  const [season, setSeason] = useState(null);
  useEffect(() => {
    setSeason(SEASONS_BY_MONTH[new Date().getMonth()]);
  }, []);
  // Reserve exact layout footprint on SSR so no CLS occurs when the card mounts.
  if (!season) {
    return <div className="hidden xl:block h-11 w-[168px]" aria-hidden="true" />;
  }
  return (
    <div
      className={`season-card season-${season.key} hidden xl:flex items-center gap-2 h-11 px-3 rounded-full border ${solid ? 'bg-white/80 border-border/60 text-charcoal' : 'bg-white/10 border-white/25 text-white backdrop-blur'}`}
      aria-label={`${season.title} — ${season.subtitle}`}
      role="img"
    >
      <span className="season-card-icon text-lg leading-none select-none" aria-hidden="true">{season.icon}</span>
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[11.5px] font-semibold tracking-tight whitespace-nowrap">{season.title}</span>
        <span className={`text-[9.5px] uppercase tracking-[0.14em] font-medium whitespace-nowrap ${solid ? 'text-charcoal/60' : 'text-white/70'}`}>{season.subtitle}</span>
      </span>
      <span className="season-card-fx" aria-hidden="true" />
    </div>
  );
}
