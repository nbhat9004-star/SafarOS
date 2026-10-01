'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Eye, Calendar } from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';

export default function HelpArticle() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/kb/articles/${slug}`);
      const d = await r.json();
      if (d.ok) setArticle(d.article);
      setLoading(false);
    })();
  }, [slug]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-3xl">
        <Link href="/help" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Help Center
        </Link>
        {loading ? (
          <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : !article ? (
          <div className="mt-8 p-12 border rounded-2xl bg-white text-center">Article not found.</div>
        ) : (
          <article className="mt-4">
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="uppercase font-bold text-emerald-700">{article.category?.replace('_', ' ')}</span>
              <span>· by {article.author?.name || 'Safar Team'}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {new Date(article.updatedAt).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1"><Eye className="size-3" /> {article.views || 0}</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-3">{article.title}</h1>
            {article.excerpt && <p className="text-lg text-muted-foreground mt-2">{article.excerpt}</p>}
            {article.images?.[0] && <img src={article.images[0]} alt="" className="w-full rounded-2xl mt-5 aspect-video object-cover" />}
            <div className="prose prose-slate max-w-none mt-6 whitespace-pre-wrap">{article.body}</div>
            {article.videos?.length > 0 && (
              <div className="mt-6 space-y-3">
                {article.videos.map((v, i) => <video key={i} src={v} controls className="w-full rounded-2xl" />)}
              </div>
            )}
          </article>
        )}
      </div>
      <Footer />
    </main>
  );
}
