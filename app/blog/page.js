import Link from 'next/link';
import { getDb } from '@/lib/db';
import { publicPost, readingMinutes } from '@/lib/blog';
import BlogHeader from '@/components/site/blog-header';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Blog | SafarOS',
  description: 'Guides, ideas and product updates for travel agencies and tour operators from the SafarOS team.',
  openGraph: { title: 'SafarOS Blog', description: 'Guides and ideas for travel agencies and tour operators.', type: 'website' },
};

const fdate = (iso) => { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };

async function loadPosts(category) {
  try {
    const db = await getDb();
    const q = { status: 'published', publishedAt: { $lte: new Date().toISOString() } };
    if (category) q.category = category;
    const rows = await db.collection('blogPosts').find(q, { projection: { _id: 0 } }).sort({ publishedAt: -1 }).limit(60).toArray();
    const cats = await db.collection('blogPosts').distinct('category', { status: 'published' });
    return { posts: rows.map(publicPost), categories: cats.filter(Boolean).sort(), error: false };
  } catch (e) {
    console.error('[blog] list failed:', e.message);
    return { posts: [], categories: [], error: true };
  }
}

export default async function BlogIndex({ searchParams }) {
  const sp = (await searchParams) || {};
  const category = typeof sp.category === 'string' ? sp.category.slice(0, 80) : '';
  const { posts, categories, error } = await loadPosts(category);
  const [lead, ...rest] = posts;
  return (<div className="min-h-screen bg-slate-50 text-slate-900">
    <BlogHeader ctaHref="/signup" />
    <section className="border-b bg-gradient-to-b from-violet-50 to-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-600">The SafarOS Blog</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Ideas for running a better travel business</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Practical guides on enquiries, quotations, operations and growth for travel agencies and tour operators.</p>
        {categories.length > 0 && <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/blog" className={`rounded-full border px-3 py-1 text-sm ${!category ? 'border-violet-600 bg-violet-600 text-white' : 'bg-white text-slate-700 hover:border-slate-400'}`}>All</Link>
          {categories.map((c) => <Link key={c} href={`/blog?category=${encodeURIComponent(c)}`} className={`rounded-full border px-3 py-1 text-sm ${category === c ? 'border-violet-600 bg-violet-600 text-white' : 'bg-white text-slate-700 hover:border-slate-400'}`}>{c}</Link>)}
        </div>}
      </div>
    </section>
    <main className="mx-auto max-w-6xl px-5 py-12">
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">The blog could not be loaded right now. Please try again shortly.</div>}
      {!error && posts.length === 0 && <div className="rounded-2xl border border-dashed bg-white p-14 text-center"><h2 className="text-xl font-semibold">No articles yet</h2><p className="mt-2 text-slate-500">{category ? 'No published articles in this category.' : 'Our first articles are on their way. Check back soon.'}</p></div>}
      {lead && <Link href={`/blog/${lead.slug}`} className="group mb-12 grid overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg md:grid-cols-2">
        <div className="aspect-[16/10] bg-gradient-to-br from-violet-200 to-sky-200 md:aspect-auto">{lead.featuredImage && <img src={lead.featuredImage} alt={lead.featuredImageAlt || lead.title} className="h-full w-full object-cover" />}</div>
        <div className="flex flex-col justify-center p-7 sm:p-10">
          {lead.category && <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">{lead.category}</span>}
          <h2 className="mt-2 text-2xl font-bold leading-tight group-hover:text-violet-700 sm:text-3xl">{lead.title}</h2>
          {lead.excerpt && <p className="mt-3 text-slate-600">{lead.excerpt}</p>}
          <p className="mt-5 text-sm text-slate-500">{[lead.author, fdate(lead.publishedAt), `${readingMinutes(lead.content)} min read`].filter(Boolean).join(' · ')}</p>
        </div>
      </Link>}
      {rest.length > 0 && <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => (
        <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="aspect-[16/10] bg-gradient-to-br from-violet-100 to-sky-100">{p.featuredImage && <img src={p.featuredImage} alt={p.featuredImageAlt || p.title} loading="lazy" className="h-full w-full object-cover" />}</div>
          <div className="flex flex-1 flex-col p-5">
            {p.category && <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">{p.category}</span>}
            <h3 className="mt-1.5 text-lg font-semibold leading-snug group-hover:text-violet-700">{p.title}</h3>
            {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.excerpt}</p>}
            <p className="mt-auto pt-4 text-xs text-slate-500">{[fdate(p.publishedAt), `${readingMinutes(p.content)} min read`].filter(Boolean).join(' · ')}</p>
          </div>
        </Link>))}</div>}
    </main>
    <footer className="border-t bg-white py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} SafarOS</footer>
  </div>);
}
