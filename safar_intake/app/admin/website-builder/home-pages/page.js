'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Star, Copy, Trash2, Edit3, Eye, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function HomePagesIndex() {
  const [templates, setTemplates] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([cmsApi.listTemplates(), cmsApi.listHomePages()]);
      setTemplates(t.templates || []);
      setPages(p.homePages || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function useTemplate(tpl) {
    try {
      const name = prompt(`Name for new home page based on "${tpl.name}":`, `${tpl.name} — v1`);
      if (!name) return;
      const res = await cmsApi.createHomePage({ name, templateKey: tpl.key });
      toast.success('Home page created from template');
      window.location.href = `/admin/website-builder/home-pages/${res.homePage.id}`;
    } catch (e) { toast.error(e.message); }
  }

  async function publish(id) {
    if (!confirm('Publish this home page? It will replace the currently active homepage.')) return;
    try { await cmsApi.publishHomePage(id); toast.success('Published'); refresh(); } catch (e) { toast.error(e.message); }
  }
  async function unpublish(id) {
    try { await cmsApi.unpublishHomePage(id); toast.success('Unpublished'); refresh(); } catch (e) { toast.error(e.message); }
  }
  async function duplicate(id) {
    try { await cmsApi.duplicateHomePage(id); toast.success('Duplicated'); refresh(); } catch (e) { toast.error(e.message); }
  }
  async function del(id) {
    if (!confirm('Delete this home page permanently?')) return;
    try { await cmsApi.deleteHomePage(id); toast.success('Deleted'); refresh(); } catch (e) { toast.error(e.message); }
  }

  return (
    <WebsiteBuilderShell
      title="Home Pages"
      subtitle="Choose a template or manage your existing home pages. Only one can be active at a time."
    >
      {/* Templates gallery */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2"><Sparkles className="size-4 text-gold" /> Templates</h2>
          <span className="text-xs text-muted-foreground">{templates.length} ready-to-use designs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map(t => (
            <div key={t.key} className="group bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald2 transition">
              <div className="aspect-[4/3] bg-secondary overflow-hidden">
                {t.thumbnail && <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />}
              </div>
              <div className="p-4">
                <div className="font-display font-bold text-charcoal">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                <div className="text-[11px] uppercase tracking-wider text-emerald2 mt-2 font-semibold">{t.inspiration}</div>
                <button onClick={()=>useTemplate(t)} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold transition">Use Template</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Home pages list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Your Home Pages</h2>
          <button onClick={async () => {
            const name = prompt('Home page name:'); if (!name) return;
            try { const res = await cmsApi.createHomePage({ name }); toast.success('Created'); window.location.href = `/admin/website-builder/home-pages/${res.homePage.id}`; } catch (e) { toast.error(e.message); }
          }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-emerald2 text-emerald2 text-sm font-semibold hover:bg-emerald2 hover:text-white transition"><Plus className="size-4" /> Blank home page</button>
        </div>
        {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
          pages.length === 0 ? <div className="bg-white rounded-2xl border p-8 text-center text-sm text-muted-foreground">No home pages yet. Pick a template above to get started.</div> :
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Sections</th><th className="text-left px-4 py-3">Updated</th><th className="text-right px-4 py-3">Actions</th></tr>
              </thead>
              <tbody>
                {pages.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-charcoal">{p.name}</span>
                        {p.isActive && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald2 text-[10px] font-bold"><Star className="size-3 fill-emerald2" /> ACTIVE</span>}
                      </div>
                      {p.templateKey && <div className="text-xs text-muted-foreground mt-0.5">Template: {p.templateKey}</div>}
                    </td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.status==='published'?'bg-emerald-50 text-emerald2':p.status==='draft'?'bg-slate-100 text-slate-700':'bg-amber-50 text-amber-700'}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{(p.sections||[]).length}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/website-builder/home-pages/${p.id}`} className="p-2 rounded-lg hover:bg-emerald2/10 text-emerald2" title="Edit"><Edit3 className="size-4" /></Link>
                        {p.isActive ? (
                          <button onClick={()=>unpublish(p.id)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600" title="Unpublish"><XCircle className="size-4" /></button>
                        ) : (
                          <button onClick={()=>publish(p.id)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald2" title="Publish"><CheckCircle2 className="size-4" /></button>
                        )}
                        <button onClick={()=>duplicate(p.id)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Duplicate"><Copy className="size-4" /></button>
                        <button onClick={()=>del(p.id)} disabled={p.isActive} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed" title="Delete"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </WebsiteBuilderShell>
  );
}
