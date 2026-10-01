'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Route, Image as ImageIcon, MapPin, MessageCircle, Award, Sparkles, FolderKanban, ArrowLeft, ArrowRight } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

const SECTIONS = [
  { href: '/admin/trips',                label: 'Trip Management', icon: Route,        desc: 'View, moderate and remove community trips' },
  { href: '/admin/explore/hero',         label: 'Hero Management', icon: ImageIcon,    desc: 'Change hero image, title, subtitle and overlay' },
  { href: '/admin/explore/map',          label: 'Live Map',        icon: MapPin,       desc: 'Overview of every published trip on the map' },
  { href: '/admin/explore/messenger',    label: 'Messenger Moderation', icon: MessageCircle, desc: 'Review messages and remove policy-breaking ones' },
  { href: '/admin/explore/rewards',      label: 'Rewards Management', icon: Award,      desc: 'Configure the 3×3 board and hidden reward' },
  { href: '/admin/explore/promotions',   label: 'Promotions',      icon: Sparkles,     desc: 'Floating promotional cards (Travel Deals, Gear Exchange, etc.)' },
  { href: '/admin/explore/media',        label: 'Media Management', icon: FolderKanban, desc: 'Review uploaded trip photos & covers' },
];

function Inner() {
  const [stats, setStats] = useState({ total: 0, public: 0, draft: 0 });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/circle/journeys', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) {
          const rows = j.journeys || [];
          setStats({ total: rows.length, public: rows.filter((r) => r.visibility === 'public').length, draft: rows.filter((r) => r.visibility === 'draft').length });
        }
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Explore</span>
        </div>
      </div>

      <div className="container py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-11 rounded-2xl bg-emerald2 text-white grid place-items-center"><LayoutDashboard className="size-5" /></div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Explore — Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage the Explore module (trips, hero, live map, chat, rewards, promotions, media).</p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Total trips"     value={stats.total} />
          <Stat label="Published"       value={stats.public} tint="emerald" />
          <Stat label="Drafts"          value={stats.draft} tint="amber" />
          <Stat label="Featured Section" value={<Link href="/explore/home" target="_blank" className="text-sm text-emerald2 font-semibold hover:underline">Open Explore →</Link>} />
        </div>

        {/* Section cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href} className="group bg-white rounded-2xl border p-5 hover:shadow-lg hover:-translate-y-0.5 transition">
              <div className="size-11 rounded-xl bg-emerald-50 text-emerald2 grid place-items-center group-hover:bg-emerald2 group-hover:text-white transition">
                <Icon className="size-5" />
              </div>
              <div className="mt-4 font-display font-bold text-charcoal">{label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald2">Open <ArrowRight className="size-3" /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value, tint }) {
  const map = { emerald: 'text-emerald2', amber: 'text-amber-600' };
  return (
    <div className="bg-white rounded-2xl border p-4">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${map[tint] || 'text-charcoal'}`}>{value}</div>
    </div>
  );
}
export default function Page() { return <ProtectedRoute roles={['super_admin', 'admin']}><Inner /></ProtectedRoute>; }
