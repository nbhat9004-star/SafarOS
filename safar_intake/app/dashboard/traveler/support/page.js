'use client';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import SupportPanel from '@/components/safar/SupportPanel';

function Inner() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/dashboard/traveler" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-2"><LifeBuoy className="size-7 text-emerald2" /> Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your tickets and chat with our team. Browse the <Link href="/help" className="text-emerald2 hover:underline">Help Center</Link> for quick answers.</p>
        <div className="mt-6"><SupportPanel role="traveler" /></div>
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['traveler', 'host', 'admin']}><Inner /></ProtectedRoute>;
}
