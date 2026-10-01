'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/safar/Navbar';
import SectionRenderer from '@/components/safar/SectionRenderer';
import { Loader2 } from 'lucide-react';

const Footer = dynamic(() => import('@/components/safar/Footer'), { ssr: false });

// Public renderer for CMS-managed pages.
// URL: /p/<slug>. Fetches /api/public/page/:slug (only published pages available).
export default function CMSPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/public/page/${encodeURIComponent(slug)}`);
        if (r.status === 404) { setStatus('not_found'); return; }
        const j = await r.json();
        if (j?.ok) { setPage(j.page); setStatus('ok'); }
        else setStatus('not_found');
      } catch { setStatus('not_found'); }
    })();
  }, [slug]);

  if (status === 'loading') return (
    <main className="min-h-screen grid place-items-center">
      <Loader2 className="size-6 animate-spin text-emerald2" />
    </main>
  );

  if (status === 'not_found' || !page) return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-32 text-center">
        <h1 className="font-display text-4xl font-bold">Page not found</h1>
        <p className="text-muted-foreground mt-2">This page hasn't been published yet.</p>
      </div>
      <Footer />
    </main>
  );

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      {page.sections && page.sections.length > 0 ? (
        <SectionRenderer sections={page.sections} />
      ) : (
        <div className="container py-24 text-center">
          <h1 className="font-display text-4xl font-bold">{page.title}</h1>
          <p className="text-muted-foreground mt-3">No sections have been added to this page yet.</p>
        </div>
      )}
      <Footer />
    </main>
  );
}
