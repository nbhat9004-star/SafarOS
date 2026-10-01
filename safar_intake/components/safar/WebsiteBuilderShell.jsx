'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, LayoutDashboard, Home, FileText, Menu, PanelTop, Image as ImageIcon, Palette, Search, Clock, Code2, Sparkles, Layers, Rocket } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

// Shared shell for /admin/website-builder/*
// Uses ProtectedRoute (existing) to gate access to super_admin/admin only.
// Keeps sidebar collapsed on mobile; expands >= md.

const NAV = [
  { href: '/admin/website-builder', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/website-builder/home-pages', label: 'Home Pages', icon: Home },
  { href: '/admin/website-builder/pages', label: 'Pages', icon: FileText },
  { href: '/admin/website-builder/navigation', label: 'Navigation', icon: Menu },
  { href: '/admin/website-builder/header', label: 'Header', icon: PanelTop },
  { href: '/admin/website-builder/footer', label: 'Footer', icon: Layers },
  { href: '/admin/website-builder/global', label: 'Global Components', icon: Sparkles },
  { href: '/admin/website-builder/media', label: 'Media Library', icon: ImageIcon },
  { href: '/admin/website-builder/theme', label: 'Theme Settings', icon: Palette },
  { href: '/admin/website-builder/seo', label: 'SEO', icon: Search },
  { href: '/admin/website-builder/versions', label: 'Version History', icon: Clock },
  { href: '/admin/website-builder/custom-code', label: 'Custom Code', icon: Code2 },
  { href: '/admin/website-builder/launch-mode', label: 'Launch Mode', icon: Rocket },
];

export default function WebsiteBuilderShell({ children, title, subtitle, actions }) {
  const pathname = usePathname();
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <div className="min-h-screen bg-secondary/40">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b">
          <div className="container flex items-center gap-3 h-14">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal">
              <ArrowLeft className="size-4" /> Admin
            </Link>
            <span className="text-charcoal/40">/</span>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald2" />
              <span className="font-display font-semibold text-charcoal">Website Builder</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/" target="_blank" className="text-xs font-semibold text-emerald2 hover:underline">View live site →</Link>
            </div>
          </div>
        </div>

        <div className="container py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="md:sticky md:top-20 md:self-start">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible bg-white rounded-2xl border p-2 shadow-sm">
              {NAV.map((n) => {
                const active = n.exact ? pathname === n.href : pathname === n.href || pathname?.startsWith(n.href + '/');
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition ${active ? 'bg-emerald2 text-white font-semibold shadow-sm' : 'text-charcoal/80 hover:bg-emerald2/10 hover:text-emerald2'}`}>
                    <Icon className="size-4 shrink-0" />
                    <span>{n.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            {(title || actions) && (
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  {title && <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">{title}</h1>}
                  {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
