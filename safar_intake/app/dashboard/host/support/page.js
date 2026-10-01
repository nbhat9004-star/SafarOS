'use client';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy, BookOpen, DollarSign, TrendingUp, ShieldCheck, FileText } from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import SupportPanel from '@/components/safar/SupportPanel';

const RESOURCES = [
  { title: 'Host Academy', href: '/help?category=host_guide', desc: 'Comprehensive guides for hosts', Ico: BookOpen },
  { title: 'Pricing Tips', href: '/help?category=guide', desc: 'Optimize your rates', Ico: DollarSign },
  { title: 'Revenue Growth', href: '/help?category=guide', desc: 'Grow your listing revenue', Ico: TrendingUp },
  { title: 'Policy Center', href: '/help?category=policy', desc: 'Platform rules and policies', Ico: ShieldCheck },
  { title: 'Documentation', href: '/help', desc: 'Full documentation', Ico: FileText },
];

function Inner() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/dashboard/host" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Host Studio
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-2"><LifeBuoy className="size-7 text-emerald2" /> Host Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Get help, contact support, and access the Host Academy.</p>

        <div className="mt-6 grid md:grid-cols-3 lg:grid-cols-5 gap-3">
          {RESOURCES.map((r) => {
            const Ico = r.Ico;
            return (
              <Link key={r.title} href={r.href} className="rounded-2xl border bg-white p-4 hover:shadow-md transition">
                <Ico className="size-5 text-emerald2" />
                <div className="font-semibold mt-2">{r.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8"><SupportPanel role="host" /></div>
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['host', 'admin']}><Inner /></ProtectedRoute>;
}
