'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/safar/AuthModal';
import { Button } from '@/components/ui/button';
import {
  User,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Shield,
  Home as HomeIcon,
  Compass,
  Heart,
  Bookmark,
  MessageCircle,
  Bell,
  BookOpen,
  Wand2,
  Settings,
  Languages,
  LifeBuoy,
  Info,
  FileText,
  ScrollText,
  Briefcase,
  Wallet,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// -----------------------------------------------------------------------------
// Universal Account Menu — SHARED between the desktop dropdown (AuthButtons)
// and the mobile drawer's bottom account section (MobileAuthButtons). Both
// surfaces must expose identical functionality per the refactor spec.
//
// The list is role-aware:
//   • Non-hosts see "Become a Host" (moved out of primary navigation).
//   • Hosts see Host Dashboard / My Listings / Bookings / Earnings instead.
// Every other item is identical for both roles.
// -----------------------------------------------------------------------------
function buildAccountMenu(user) {
  if (!user) return [];
  const isHost = user.role === 'host' || user.role === 'admin' || user.role === 'super_admin';
  const dashHref = (user.role === 'admin' || user.role === 'super_admin')
    ? '/admin'
    : (user.role === 'host' ? '/dashboard/host' : '/dashboard/traveler');

  const items = [
    { key: 'profile',       label: 'My Profile',         icon: User,         href: `${dashHref}` },
    { key: 'trips',         label: 'My Trips',           icon: Compass,      href: '/dashboard/traveler/bookings' },
    { key: 'wishlist',      label: 'Wishlist',           icon: Heart,        href: '/wishlist' },
    { key: 'saved',         label: 'Saved',              icon: Bookmark,     href: '/wishlist?tab=saved' },
    { key: 'messages',      label: 'Messages',           icon: MessageCircle, href: '/dashboard/traveler/messages' },
    { key: 'notifications', label: 'Notifications',      icon: Bell,         href: '/notifications' },
    { key: 'bookings',      label: 'Booking History',    icon: BookOpen,     href: '/dashboard/traveler/bookings' },
    { key: 'ai-history',    label: 'AI Planner History', icon: Wand2,        href: '/ai-planner?tab=history' },
  ];

  // Host section — replace "Become a Host" with the host-only quick links.
  if (isHost) {
    items.push(
      { key: 'host-dashboard', label: 'Host Dashboard', icon: LayoutDashboard, href: '/dashboard/host',            divider: true },
      { key: 'host-listings',  label: 'My Listings',    icon: HomeIcon,        href: '/dashboard/host/listings' },
      { key: 'host-bookings',  label: 'Bookings',       icon: CalendarDays,    href: '/dashboard/host/bookings' },
      { key: 'host-earnings',  label: 'Earnings',       icon: Wallet,          href: '/dashboard/host/earnings' },
    );
  } else {
    items.push(
      { key: 'become-host', label: 'Become a Host', icon: Briefcase, href: '/add-listing', divider: true, highlight: true },
    );
  }

  // Preferences / info
  items.push(
    { key: 'settings', label: 'Settings',  icon: Settings,  href: `${dashHref}?tab=settings`, divider: true },
    { key: 'language', label: 'Language',  icon: Languages, href: '#language' },
    { key: 'help',     label: 'Help Center', icon: LifeBuoy, href: '/help' },
    { key: 'about',    label: 'About Safar Curated', icon: Info, href: '/about' },
    { key: 'privacy',  label: 'Privacy Policy', icon: Shield, href: '/privacy' },
    { key: 'terms',    label: 'Terms',    icon: FileText, href: '/terms' },
  );

  return items;
}

// Shared account row — used inside both the desktop dropdown and the mobile
// drawer's account section. Keeps visuals & behaviour identical.
function AccountRow({ item, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
        item.highlight
          ? 'text-emerald2 font-semibold hover:bg-emerald2/5'
          : 'text-charcoal hover:bg-secondary'
      }`}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function AuthButtons({ solid }) {
  const { user, loading, logout } = useAuth();
  const [mode, setMode] = useState(null); // 'login' | 'signup' | null
  const [menu, setMenu] = useState(false);

  if (loading) {
    return <div className="hidden md:block size-10 rounded-full bg-white/10 animate-pulse" />;
  }

  if (!user) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => setMode('login')}
          className={`hidden md:inline-flex rounded-full px-4 h-10 font-medium ${solid ? 'text-charcoal hover:bg-secondary' : 'text-white hover:bg-white/10'}`}>
          Sign in
        </Button>
        <Button size="sm" onClick={() => setMode('signup')}
          className="hidden md:inline-flex rounded-full bg-emerald2 hover:bg-emerald2-deep shadow-lg shadow-emerald2/25 px-5 h-10 font-semibold text-white">
          <UserPlus className="size-4 mr-1.5" /> Sign up
        </Button>
        <AuthModal open={!!mode} defaultMode={mode || 'login'} onClose={() => setMode(null)} />
      </>
    );
  }

  const initials = (user.name || user.email || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = user.role?.charAt(0).toUpperCase() + user.role?.slice(1);
  const accountItems = buildAccountMenu(user);

  return (
    <div className="relative">
      <button
        onClick={() => setMenu(!menu)}
        className={`hidden md:inline-flex items-center gap-2 rounded-full pl-2 pr-3 h-10 border transition ${solid ? 'border-border bg-white hover:bg-secondary' : 'border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur'}`}
      >
        <span className="size-7 rounded-full bg-gradient-emerald text-white grid place-items-center text-xs font-bold">{initials}</span>
        <span className="text-sm font-medium tracking-tight">{user.name?.split(' ')[0]}</span>
      </button>
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
            onMouseLeave={() => setMenu(false)}
          >
            {/* Identity header */}
            <div className="px-4 py-3 border-b">
              <div className="font-display font-semibold text-sm leading-tight">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald2/10 text-emerald2 text-[10px] uppercase tracking-wider font-bold">
                {(user.role === 'admin' || user.role === 'super_admin')
                  ? <Shield className="size-3" />
                  : user.role === 'host' ? <HomeIcon className="size-3" /> : <User className="size-3" />}
                {roleLabel}
              </div>
            </div>

            {/* Universal account menu (identical to mobile drawer) */}
            <div className="py-1">
              {accountItems.map((item) => (
                <div key={item.key}>
                  {item.divider && <div className="my-1 border-t border-border/60" />}
                  <AccountRow item={item} onClick={() => setMenu(false)} />
                </div>
              ))}
            </div>

            <button
              onClick={async () => { await logout(); toast.success('Signed out'); setMenu(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary text-rose-600 border-t"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileAuthButtons({ onClose, onOpenAuth }) {
  const { user, logout } = useAuth();

  if (!user) {
    // Close the Sheet FIRST, then ask Navbar to open the AuthModal at the
    // root level. Rendering the modal inside the Sheet's Radix Dialog subtree
    // caused Radix to apply aria-hidden + pointer-events:none on the modal
    // portal, letting clicks pass through to nav Links underneath.
    const trigger = (m) => (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      onClose?.();
      setTimeout(() => onOpenAuth?.(m), 60);
    };
    return (
      <>
        <Button variant="outline" className="w-full h-11 rounded-full font-semibold" onClick={trigger('login')}>
          <User className="size-4 mr-2" /> Sign in
        </Button>
        <Button className="w-full h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold" onClick={trigger('signup')}>
          <UserPlus className="size-4 mr-2" /> Sign up
        </Button>
      </>
    );
  }

  const dashHref = (user.role === 'admin' || user.role === 'super_admin')
    ? '/admin'
    : (user.role === 'host' ? '/dashboard/host' : '/dashboard/traveler');
  const roleLabel = user.role?.charAt(0).toUpperCase() + user.role?.slice(1);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary">
        <div className="size-10 rounded-full bg-gradient-emerald text-white grid place-items-center font-bold">
          {(user.name || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald2/10 text-emerald2 text-[10px] uppercase tracking-wider font-bold">
            {roleLabel}
          </div>
        </div>
      </div>
      <Link href={dashHref} onClick={onClose} className="w-full">
        <Button variant="outline" className="w-full h-11 rounded-full font-semibold">
          <User className="size-4 mr-2" /> View Profile
        </Button>
      </Link>
      <Button
        variant="outline"
        className="w-full h-11 rounded-full font-semibold text-rose-600 hover:text-rose-600"
        onClick={async () => { await logout(); toast.success('Signed out'); onClose?.(); }}
      >
        <LogOut className="size-4 mr-2" /> Logout
      </Button>
    </div>
  );
}
