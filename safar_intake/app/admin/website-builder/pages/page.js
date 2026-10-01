'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Edit3, Trash2, ExternalLink, Search, CheckCircle2 } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function PagesList() {
  const [pages, setPages] = useState([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const q = {};
      if (filter) q.q = filter;
      if (statusFilter) q.status = statusFilter;
      const r = await cmsApi.listPages(q);
      setPages(r.pages || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [statusFilter]);

  async function createPage() {
    const title = prompt('Page title:'); if (!title) return;
    const slug = prompt('URL slug (e.g. about-us):', title.toLowerCase().replace(/[^a-z0-9]+/g,'-')); if (!slug) return;
    try { const r = await cmsApi.createPage({ title, slug }); toast.success('Page created'); window.location.href = `/admin/website-builder/pages/${r.page.id}`; } catch (e) { toast.error(e.message); }
  }
  async function del(id) {
    if (!confirm('Delete this page?')) return;
    try { await cmsApi.deletePage(id); toast.success('Deleted'); refresh(); } catch (e) { toast.error(e.message); }
  }
  async function publish(id) {
    try { await cmsApi.publishPage(id); toast.success('Published'); refresh(); } catch (e) { toast.error(e.message); }
  }

  return (
    <WebsiteBuilderShell title="Pages" subtitle="Create About, Careers, Contact, Landing pages, Destination pages and more."
      actions={<button onClick={createPage} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><Plus className="size-4" /> New page</button>}>
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-4 border-b flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3 py-2 border rounded-full">
            <Search className="size-4 text-muted-foreground" />
            <input value={filter} onChange={(e)=>setFilter(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&refresh()} placeholder="Search title or slug…" className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="px-3 py-2 rounded-full border text-sm bg-white">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
          <button onClick={refresh} className="px-4 py-2 rounded-full border text-sm hover:border-emerald2 hover:text-emerald2">Apply</button>
        </div>
        {loading ? <div className="p-8 text-sm text-muted-foreground text-center">Loading…</div> :
          pages.length===0 ? <div className="p-8 text-sm text-muted-foreground text-center">No pages yet.</div> :
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Title</th><th className="text-left px-4 py-3">Slug</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Updated</th><th className="text-right px-4 py-3">Actions</th></tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-semibold text-charcoal">{p.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">/{p.slug}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.status==='published'?'bg-emerald-50 text-emerald2':'bg-slate-100 text-slate-700'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {p.status==='published' && <Link href={`/p/${p.slug}`} target="_blank" className="p-2 rounded-lg hover:bg-emerald-50 text-emerald2"><ExternalLink className="size-4" /></Link>}
                      <Link href={`/admin/website-builder/pages/${p.id}`} className="p-2 rounded-lg hover:bg-emerald2/10 text-emerald2"><Edit3 className="size-4" /></Link>
                      {p.status!=='published' && <button onClick={()=>publish(p.id)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald2" title="Publish"><CheckCircle2 className="size-4" /></button>}
                      <button onClick={()=>del(p.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
    </WebsiteBuilderShell>
  );
}
