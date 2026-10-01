'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function SEOCenter() {
  const [pages, setPages] = useState([]);
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{(async()=>{try{const [p,h]=await Promise.all([cmsApi.listPages(),cmsApi.listHomePages()]);setPages(p.pages||[]);setHomes(h.homePages||[]);}catch(e){toast.error(e.message);}finally{setLoading(false);}})();},[]);

  return (
    <WebsiteBuilderShell title="SEO Center" subtitle="Manage titles, meta descriptions and keywords for every home page and page.">
      {loading ? <div/> : (
        <div className="space-y-6">
          <Section title="Home pages" items={homes.map(h=>({...h, kind:'home', href:`/admin/website-builder/home-pages/${h.id}`, url: h.isActive?'/':''}))} />
          <Section title="Pages" items={pages.map(p=>({...p, kind:'page', href:`/admin/website-builder/pages/${p.id}`, url:`/p/${p.slug}`}))} />
        </div>
      )}
    </WebsiteBuilderShell>
  );
}

function Section({ title, items }) {
  return (
    <div>
      <h3 className="font-display font-bold text-lg mb-3">{title}</h3>
      {items.length===0 ? <div className="bg-white border rounded-2xl p-6 text-sm text-muted-foreground">None yet.</div> :
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">SEO title</th><th className="text-left px-4 py-3">Description</th><th className="text-left px-4 py-3">Keywords</th><th className="text-right px-4 py-3">Edit</th></tr></thead>
            <tbody>{items.map(i=>(<tr key={i.id} className="border-t">
              <td className="px-4 py-3 font-semibold">{i.title || i.name}{i.url && <Link href={i.url} target="_blank" className="ml-2 inline-flex text-emerald2"><ExternalLink className="size-3" /></Link>}</td>
              <td className="px-4 py-3 text-charcoal/80">{i.seo?.title || <span className="text-rose-500">Missing</span>}</td>
              <td className="px-4 py-3 text-charcoal/80 max-w-[280px] truncate">{i.seo?.description || <span className="text-rose-500">Missing</span>}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{(i.seo?.keywords||[]).join(', ') || '—'}</td>
              <td className="px-4 py-3 text-right"><Link href={i.href} className="text-emerald2 hover:underline font-semibold">Edit →</Link></td>
            </tr>))}</tbody>
          </table>
        </div>}
    </div>
  );
}
