import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { publicPost, renderBlogMarkdown, readingMinutes } from '@/lib/blog';
import BlogHeader from '@/components/site/blog-header';

export const dynamic = 'force-dynamic';

const fdate = (iso) => { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };

// Only published posts whose publication date has arrived are public. Drafts → 404.
async function loadPost(slug) {
  if (!/^[a-z0-9-]{1,90}$/.test(String(slug || ''))) return null;
  try {
    const db = await getDb();
    const p = await db.collection('blogPosts').findOne({ slug, status: 'published', publishedAt: { $lte: new Date().toISOString() } }, { projection: { _id: 0 } });
    if (!p) return null;
    const related = await db.collection('blogPosts').find({ status: 'published', slug: { $ne: slug }, publishedAt: { $lte: new Date().toISOString() }, ...(p.category ? { category: p.category } : {}) }, { projection: { _id: 0, content: 0 } }).sort({ publishedAt: -1 }).limit(3).toArray();
    return { post: publicPost(p), related: related.map(publicPost) };
  } catch (e) { console.error('[blog] post failed:', e.message); return null; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = await loadPost(slug);
  if (!d) return { title: 'Article not found | SafarOS Blog', robots: 'noindex' };
  const p = d.post; const title = p.seoTitle || `${p.title} | SafarOS Blog`; const description = p.metaDescription || p.excerpt || undefined;
  const image = p.ogImage || p.featuredImage;
  return { title, description, keywords: (p.tags || []).join(', ') || undefined, alternates: { canonical: `/blog/${p.slug}` }, openGraph: { title: p.seoTitle || p.title, description, type: 'article', publishedTime: p.publishedAt, authors: p.author ? [p.author] : undefined, images: image ? [image] : undefined }, twitter: { card: image ? 'summary_large_image' : 'summary', title: p.seoTitle || p.title, description, images: image ? [image] : undefined } };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const d = await loadPost(slug);
  if (!d) notFound();
  const { post: p, related } = d;
  const html = renderBlogMarkdown(p.content); // escaped + whitelisted formatting only
  const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.metaDescription || p.excerpt, image: p.featuredImage || undefined, datePublished: p.publishedAt, dateModified: p.updatedAt, author: p.author ? { '@type': 'Person', name: p.author } : undefined, keywords: (p.tags || []).join(', ') };
  return (<div className="min-h-screen bg-white text-slate-900">
    <BlogHeader ctaHref="/signup" />
    <article className="mx-auto max-w-3xl px-5 pb-16 pt-10">
      <Link href="/blog" className="text-sm text-violet-600 hover:underline">← All articles</Link>
      {p.category && <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-violet-600">{p.category}</p>}
      <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{p.title}</h1>
      {p.excerpt && <p className="mt-4 text-lg text-slate-600">{p.excerpt}</p>}
      <p className="mt-5 text-sm text-slate-500">{[p.author && `By ${p.author}`, fdate(p.publishedAt), `${readingMinutes(p.content)} min read`].filter(Boolean).join(' · ')}</p>
      {p.featuredImage && <img src={p.featuredImage} alt={p.featuredImageAlt || p.title} className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />}
      <div className="mt-10 text-[17px] leading-8 text-slate-700 [&_a]:text-violet-700 [&_a]:underline [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-violet-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h4]:mt-6 [&_h4]:font-semibold [&_hr]:my-10 [&_img]:my-8 [&_img]:rounded-xl [&_li]:my-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_strong]:text-slate-900 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6" dangerouslySetInnerHTML={{ __html: html }} />
      {(p.tags || []).length > 0 && <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">{p.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">#{t}</span>)}</div>}
      <div className="mt-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white"><h2 className="text-xl font-bold">Run your travel agency from one place</h2><p className="mt-2 text-white/80">Enquiries, quotations, bookings and payments — in SafarOS.</p><Link href="/signup" className="mt-5 inline-block rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-300">Use for free</Link></div>
    </article>
    {related.length > 0 && <section className="border-t bg-slate-50"><div className="mx-auto max-w-5xl px-5 py-12"><h2 className="text-xl font-bold">Related articles</h2><div className="mt-6 grid gap-6 sm:grid-cols-3">{related.map((r) => <Link key={r.slug} href={`/blog/${r.slug}`} className="group overflow-hidden rounded-xl border bg-white"><div className="aspect-[16/10] bg-gradient-to-br from-violet-100 to-sky-100">{r.featuredImage && <img src={r.featuredImage} alt={r.featuredImageAlt || r.title} loading="lazy" className="h-full w-full object-cover" />}</div><div className="p-4"><h3 className="font-semibold leading-snug group-hover:text-violet-700">{r.title}</h3><p className="mt-1 text-xs text-slate-500">{fdate(r.publishedAt)}</p></div></Link>)}</div></div></section>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
  </div>);
}
