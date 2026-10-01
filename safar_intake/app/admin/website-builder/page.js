'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, FileText, Menu, PanelTop, Image as ImageIcon, Palette, Search, Clock, Code2, Sparkles, Layers, ArrowRight, ExternalLink } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

const QUICK_LINKS = [
  { href: '/admin/website-builder/home-pages', title: 'Home Pages', desc: 'Choose a template or design your homepage', icon: Home, color: 'from-emerald-500 to-emerald-700' },
  { href: '/admin/website-builder/pages', title: 'Pages', desc: 'About, Careers, Contact, Landing pages', icon: FileText, color: 'from-blue-500 to-blue-700' },
  { href: '/admin/website-builder/navigation', title: 'Navigation', desc: 'Menus, submenus, mega menus', icon: Menu, color: 'from-purple-500 to-purple-700' },
  { href: '/admin/website-builder/header', title: 'Header', desc: 'Logo, nav links, buttons, announcement', icon: PanelTop, color: 'from-amber-500 to-amber-700' },
  { href: '/admin/website-builder/footer', title: 'Footer', desc: 'Columns, links, social, contact', icon: Layers, color: 'from-teal-500 to-teal-700' },
  { href: '/admin/website-builder/global', title: 'Global Components', desc: 'Reusable banners, CTAs, cards', icon: Sparkles, color: 'from-pink-500 to-pink-700' },
  { href: '/admin/website-builder/media', title: 'Media Library', desc: 'Images, videos, icons, docs', icon: ImageIcon, color: 'from-sky-500 to-sky-700' },
  { href: '/admin/website-builder/theme', title: 'Theme Settings', desc: 'Colors, fonts, radius, dark mode', icon: Palette, color: 'from-rose-500 to-rose-700' },
  { href: '/admin/website-builder/seo', title: 'SEO Center', desc: 'Meta, OG, sitemap, indexing', icon: Search, color: 'from-indigo-500 to-indigo-700' },
  { href: '/admin/website-builder/versions', title: 'Version History', desc: 'Snapshots, restore, rollback', icon: Clock, color: 'from-slate-500 to-slate-700' },
];

export default function WebsiteBuilderDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await cmsApi.getStats();
        setStats(s.stats);
      } catch (e) {
        setError(e.message);
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <WebsiteBuilderShell
      title="Website Builder"
      subtitle="Manage your entire safarcurated.com site without touching code."
      actions={<Link href="/admin/website-builder/home-pages" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold">Start with a template <ArrowRight className="size-4" /></Link>}
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Home Pages', value: stats?.homePages ?? '—', hint: stats?.activeHome ? `Active: ${stats.activeHome.name}` : 'None active' },
          { label: 'Pages', value: stats?.pages ?? '—', hint: `${stats?.pagesPublished ?? 0} published` },
          { label: 'Media assets', value: stats?.media ?? '—', hint: 'in library' },
          { label: 'Version snapshots', value: stats?.versions ?? '—', hint: 'all-time' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{c.label}</div>
            <div className="font-display text-3xl font-bold mt-1 text-charcoal">{loading ? '…' : c.value}</div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{c.hint}</div>
          </div>
        ))}
      </div>

      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}

      {/* Modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map(m => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href} className="group relative bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md hover:border-emerald2 transition">
              <div className={`size-11 rounded-xl bg-gradient-to-br ${m.color} grid place-items-center text-white shadow-md`}>
                <Icon className="size-5" />
              </div>
              <div className="font-display text-lg font-bold mt-4 text-charcoal group-hover:text-emerald2">{m.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{m.desc}</div>
              <ArrowRight className="size-4 text-emerald2 absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition" />
            </Link>
          );
        })}
      </div>

      {/* Live site card */}
      <div className="mt-8 bg-gradient-to-br from-emerald2 to-emerald2-deep text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider opacity-80 font-semibold">Currently live</div>
          <div className="font-display text-2xl font-bold mt-1">{stats?.activeHome?.name || 'Default (static) homepage'}</div>
          <div className="text-sm opacity-85 mt-1">{stats?.activeHome ? 'Serving to travelers via /api/public/site.' : 'Publish a template to override the default homepage.'}</div>
        </div>
        <Link href="/" target="_blank" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-emerald2 hover:bg-white/90 text-sm font-semibold">View live site <ExternalLink className="size-4" /></Link>
      </div>
    </WebsiteBuilderShell>
  );
}
