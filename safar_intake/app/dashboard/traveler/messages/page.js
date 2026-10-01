'use client';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import ConversationsPanel from '@/components/safar/ConversationsPanel';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function TravelerMessagesInner() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 md:pt-24 container pb-4">
        <Link href="/dashboard/traveler" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="size-3" /> Back to Dashboard
        </Link>
        <ConversationsPanel role="traveler" />
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['traveler', 'host', 'admin']}><TravelerMessagesInner /></ProtectedRoute>;
}
