'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy, Search, BookOpen, Mail, Phone, MessageCircle, Clock, MapPin, Loader2 } from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';

const CATEGORY_COLORS = {
  article: 'bg-blue-50 text-blue-700 border-blue-200',
  faq: 'bg-purple-50 text-purple-700 border-purple-200',
  guide: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  policy: 'bg-slate-100 text-slate-700 border-slate-200',
  host_guide: 'bg-amber-50 text-amber-700 border-amber-200',
  traveler_guide: 'bg-rose-50 text-rose-600 border-rose-200',
};

export default function HelpCenterPage() {
  const [articles, setArticles] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const r = await fetch(`/api/kb/articles?${params.toString()}`);
      const d = await r.json();
      if (d.ok) setArticles(d.articles || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const grouped = articles.reduce((acc, a) => { (acc[a.category] = acc[a.category] || []).push(a); return acc; }, {});

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <LifeBuoy className="size-3" /> Help Center
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-4">How can we help?</h1>
          <p className="text-muted-foreground mt-2">Browse articles, guides, and FAQs — or contact our team directly.</p>
          <div className="mt-6 relative max-w-xl mx-auto">
            <Search className="size-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search help articles..." className="w-full pl-12 pr-4 py-3 rounded-full border text-base shadow-sm" />
          </div>
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : (
          <div className="mt-10 space-y-8">
            {Object.keys(grouped).length === 0 ? (
              <div className="p-12 border rounded-2xl bg-white text-center text-sm text-muted-foreground">No articles published yet.</div>
            ) : Object.entries(grouped).map(([cat, list]) => (
              <section key={cat}>
                <div className="font-display text-xl font-bold mb-3 capitalize">{cat.replace('_', ' ')}</div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((a) => (
                    <Link key={a.id} href={`/help/${a.slug}`} className="rounded-2xl border bg-white p-4 hover:shadow-md transition">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[a.category] || ''}`}>{a.category?.replace('_', ' ')}</span>
                      <div className="font-semibold mt-2">{a.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Contact Center */}
        <section className="mt-16">
          <div className="font-display text-2xl font-bold text-center">Still need help?</div>
          <div className="mt-6 grid md:grid-cols-4 gap-3">
            <a href="mailto:support@safar.com" className="rounded-2xl border bg-white p-5 hover:shadow-md transition">
              <Mail className="size-5 text-emerald2" />
              <div className="font-semibold mt-2">Email Support</div>
              <div className="text-xs text-muted-foreground">support@safar.com</div>
            </a>
            <a href="tel:+911800123456" className="rounded-2xl border bg-white p-5 hover:shadow-md transition">
              <Phone className="size-5 text-emerald2" />
              <div className="font-semibold mt-2">Emergency</div>
              <div className="text-xs text-muted-foreground">+91 1800 123 456</div>
            </a>
            <a href="https://wa.me/911800123456" target="_blank" rel="noreferrer" className="rounded-2xl border bg-white p-5 hover:shadow-md transition">
              <MessageCircle className="size-5 text-emerald2" />
              <div className="font-semibold mt-2">WhatsApp</div>
              <div className="text-xs text-muted-foreground">Chat with us</div>
            </a>
            <div className="rounded-2xl border bg-white p-5">
              <Clock className="size-5 text-emerald2" />
              <div className="font-semibold mt-2">Business Hours</div>
              <div className="text-xs text-muted-foreground">Mon–Sat · 9am–9pm IST</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border bg-emerald-50/40 p-5 flex flex-col md:flex-row items-start md:items-center gap-3">
            <MapPin className="size-5 text-emerald2 shrink-0" />
            <div>
              <div className="font-semibold">Office</div>
              <div className="text-xs text-muted-foreground">Safar HQ · Kochi, Kerala, India</div>
            </div>
            <Link href="/contact" className="md:ml-auto text-sm font-semibold text-emerald2 hover:underline">Send us a message →</Link>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
