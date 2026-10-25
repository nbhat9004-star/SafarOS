import Link from 'next/link';

// Shared header for the public SafarOS blog (server component).
export default function BlogHeader({ ctaHref = '/' }) {
  return (<header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
      <Link href="/" className="flex items-center gap-2 font-bold text-slate-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-sm text-white">S</span>SafarOS</Link>
      <nav className="flex items-center gap-5 text-sm font-medium text-slate-600"><Link href="/blog" className="hover:text-slate-900">Blog</Link><Link href={ctaHref} className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-slate-900 hover:bg-amber-300">Use for free</Link></nav>
    </div>
  </header>);
}
