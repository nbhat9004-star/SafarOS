'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Save, CheckCircle2, Plus, ArrowUp, ArrowDown, Trash2, ExternalLink } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi, SECTION_LIBRARY, findSectionMeta } from '@/lib/cms-api';

export default function PageEditor() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    (async () => { try { const r = await cmsApi.getPage(id); setDoc(r.page); setServer(JSON.parse(JSON.stringify(r.page))); } catch (e) { toast.error(e.message); } finally { setLoading(false); } })();
  }, [id]);

  const dirty = useMemo(() => JSON.stringify(doc) !== JSON.stringify(server), [doc, server]);
  function setSections(s) { setDoc({ ...doc, sections: s }); }
  function move(i, dir) { const s = [...doc.sections]; const j = i + dir; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; setSections(s); }
  function rem(i) { if (!confirm('Remove?')) return; const s = [...doc.sections]; s.splice(i,1); setSections(s); }
  function add(type) { const m = findSectionMeta(type); setSections([...(doc.sections||[]), { id: type+'-'+Math.random().toString(36).slice(2,7), type, hidden:false, props: { title: m.label } }]); setShowAdd(false); }
  function updProps(i, p) { const s = [...doc.sections]; s[i] = { ...s[i], props: { ...(s[i].props||{}), ...p } }; setSections(s); }

  async function save() { try { const r = await cmsApi.updatePage(id, { title: doc.title, slug: doc.slug, sections: doc.sections, seo: doc.seo }); setDoc(r.page); setServer(JSON.parse(JSON.stringify(r.page))); toast.success('Saved'); } catch (e) { toast.error(e.message); } }
  async function publish() { if (dirty) await save(); try { await cmsApi.publishPage(id); toast.success('Published'); const r = await cmsApi.getPage(id); setDoc(r.page); setServer(JSON.parse(JSON.stringify(r.page))); } catch (e) { toast.error(e.message); } }

  if (loading) return <WebsiteBuilderShell title="Loading…"><div/></WebsiteBuilderShell>;
  if (!doc) return <WebsiteBuilderShell title="Not found"><Link href="/admin/website-builder/pages" className="text-emerald2">← Back</Link></WebsiteBuilderShell>;

  return (
    <WebsiteBuilderShell title={doc.title} subtitle={`/${doc.slug} · ${doc.status}`}
      actions={<div className="flex gap-2">
        <Link href={`/p/${doc.slug}`} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm hover:border-emerald2"><ExternalLink className="size-4" /> Preview</Link>
        <button onClick={save} disabled={!dirty} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-charcoal text-white text-sm font-semibold disabled:opacity-40"><Save className="size-4" /> Save</button>
        {doc.status!=='published' && <button onClick={publish} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><CheckCircle2 className="size-4" /> Publish</button>}
      </div>}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
          <h3 className="font-semibold">Page details</h3>
          <Field label="Title" value={doc.title} onChange={(v)=>setDoc({...doc, title: v})} />
          <Field label="Slug" value={doc.slug} onChange={(v)=>setDoc({...doc, slug: v})} />
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</span>
            <select value={doc.status} onChange={(e)=>setDoc({...doc, status: e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <hr />
          <h3 className="font-semibold">SEO</h3>
          <Field label="Meta title" value={doc.seo?.title||''} onChange={(v)=>setDoc({...doc, seo:{...(doc.seo||{}), title:v}})} />
          <Field label="Meta description" textarea value={doc.seo?.description||''} onChange={(v)=>setDoc({...doc, seo:{...(doc.seo||{}), description:v}})} />
          <Field label="Keywords (comma sep.)" value={(doc.seo?.keywords||[]).join(', ')} onChange={(v)=>setDoc({...doc, seo:{...(doc.seo||{}), keywords: v.split(',').map(x=>x.trim()).filter(Boolean)}})} />
        </div>
        <div className="space-y-2">
          <button onClick={()=>setShowAdd(!showAdd)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-emerald2/40 text-emerald2 hover:bg-emerald2/5 font-semibold text-sm"><Plus className="size-4" /> Add Section</button>
          {showAdd && <div className="bg-white rounded-2xl border p-3 grid grid-cols-2 gap-2 max-h-80 overflow-auto">{SECTION_LIBRARY.map(s=>(<button key={s.type} onClick={()=>add(s.type)} className="flex items-center gap-2 p-2 rounded-lg border text-xs text-left hover:border-emerald2"><span className="text-lg">{s.icon}</span><span className="font-semibold truncate">{s.label}</span></button>))}</div>}
          {(doc.sections||[]).map((s,i)=>{ const m = findSectionMeta(s.type); return (
            <div key={s.id} className="bg-white rounded-2xl border p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-lg bg-emerald2/10 text-emerald2 grid place-items-center text-lg">{m.icon}</div>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{m.label}</div><div className="text-xs text-muted-foreground truncate">{s.props?.title||m.desc}</div></div>
                <button onClick={()=>move(i,-1)} disabled={i===0} className="p-1.5 rounded hover:bg-emerald2/10 disabled:opacity-20"><ArrowUp className="size-4" /></button>
                <button onClick={()=>move(i,1)} disabled={i===doc.sections.length-1} className="p-1.5 rounded hover:bg-emerald2/10 disabled:opacity-20"><ArrowDown className="size-4" /></button>
                <button onClick={()=>rem(i)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="size-4" /></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Field label="Title" value={s.props?.title||''} onChange={(v)=>updProps(i,{title:v})} />
                <Field label="Subtitle" value={s.props?.subtitle||''} onChange={(v)=>updProps(i,{subtitle:v})} />
              </div>
            </div>
          ); })}
        </div>
      </div>
    </WebsiteBuilderShell>
  );
}

function Field({ label, value, onChange, textarea }) {
  return <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>{textarea? <textarea value={value||''} onChange={(e)=>onChange(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none" /> : <input value={value||''} onChange={(e)=>onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none" />}</label>;
}
