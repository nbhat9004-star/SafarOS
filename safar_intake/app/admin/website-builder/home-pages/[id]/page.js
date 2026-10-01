'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Trash2, Eye, EyeOff, Copy, Plus, Save, CheckCircle2, XCircle, Undo2, Monitor, Tablet, Smartphone, ExternalLink, Sparkles, Search } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi, SECTION_LIBRARY, findSectionMeta } from '@/lib/cms-api';

// Home page editor. Provides:
//  - Ordered section list with move up/down, hide/show, duplicate, delete
//  - Add-Section drawer (searchable) using SECTION_LIBRARY
//  - Per-section inline props editor (title/subtitle/etc.)
//  - Save (persists sections to DB), Publish, Unpublish, Preview device toggles, Undo (rollback to server copy)
export default function HomePageEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [doc, setDoc] = useState(null);
  const [serverDoc, setServerDoc] = useState(null); // last-saved state for undo
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [device, setDevice] = useState('desktop'); // desktop|tablet|mobile

  useEffect(() => {
    (async () => {
      try {
        const res = await cmsApi.getHomePage(id);
        setDoc(res.homePage);
        setServerDoc(JSON.parse(JSON.stringify(res.homePage)));
      } catch (e) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const isDirty = useMemo(() => JSON.stringify(doc) !== JSON.stringify(serverDoc), [doc, serverDoc]);

  function updateSections(next) { setDoc({ ...doc, sections: next }); }
  function moveUp(i) { if (i === 0) return; const s = [...doc.sections]; [s[i-1], s[i]] = [s[i], s[i-1]]; updateSections(s); }
  function moveDown(i) { if (i >= doc.sections.length - 1) return; const s = [...doc.sections]; [s[i+1], s[i]] = [s[i], s[i+1]]; updateSections(s); }
  function toggleHide(i) { const s = [...doc.sections]; s[i] = { ...s[i], hidden: !s[i].hidden }; updateSections(s); }
  function dupSection(i) { const s = [...doc.sections]; const c = JSON.parse(JSON.stringify(s[i])); c.id = c.id + '-' + Math.random().toString(36).slice(2,7); s.splice(i+1, 0, c); updateSections(s); }
  function removeSection(i) { if (!confirm('Remove this section?')) return; const s = [...doc.sections]; s.splice(i, 1); updateSections(s); if (editingIdx === i) setEditingIdx(null); }
  function addSection(type) {
    const meta = findSectionMeta(type);
    const newSec = { id: type + '-' + Math.random().toString(36).slice(2,7), type, hidden: false, props: { title: meta.label } };
    updateSections([...(doc.sections || []), newSec]);
    setShowAddDrawer(false);
  }
  function updateSectionProps(i, next) { const s = [...doc.sections]; s[i] = { ...s[i], props: { ...(s[i].props || {}), ...next } }; updateSections(s); }

  async function save() {
    setSaving(true);
    try {
      const res = await cmsApi.updateHomePage(id, { sections: doc.sections, seo: doc.seo, name: doc.name });
      setDoc(res.homePage);
      setServerDoc(JSON.parse(JSON.stringify(res.homePage)));
      toast.success('Saved');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }
  async function publish() {
    if (isDirty) await save();
    try { await cmsApi.publishHomePage(id); toast.success('Published — this is now the live homepage'); const res = await cmsApi.getHomePage(id); setDoc(res.homePage); setServerDoc(JSON.parse(JSON.stringify(res.homePage))); } catch (e) { toast.error(e.message); }
  }
  async function unpublish() {
    try { await cmsApi.unpublishHomePage(id); toast.success('Unpublished'); const res = await cmsApi.getHomePage(id); setDoc(res.homePage); setServerDoc(JSON.parse(JSON.stringify(res.homePage))); } catch (e) { toast.error(e.message); }
  }
  function undo() { setDoc(JSON.parse(JSON.stringify(serverDoc))); setEditingIdx(null); toast.info('Reverted to last saved'); }

  if (loading) return <WebsiteBuilderShell title="Loading…"><div className="text-sm text-muted-foreground">Loading…</div></WebsiteBuilderShell>;
  if (!doc) return <WebsiteBuilderShell title="Not found"><Link href="/admin/website-builder/home-pages" className="text-emerald2 hover:underline">← Back</Link></WebsiteBuilderShell>;

  const filteredLib = SECTION_LIBRARY.filter(s => (s.label + ' ' + s.desc + ' ' + s.type).toLowerCase().includes(addQuery.toLowerCase()));
  const deviceWidths = { desktop: '100%', tablet: 'max-w-[820px]', mobile: 'max-w-[420px]' };

  return (
    <WebsiteBuilderShell
      title={<span className="inline-flex items-center gap-2">{doc.name}{doc.isActive && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald2 text-[10px] font-bold">LIVE</span>}</span>}
      subtitle={`${(doc.sections||[]).length} sections · ${doc.status}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden md:flex items-center bg-white border rounded-full p-1">
            <button onClick={()=>setDevice('desktop')} className={`p-1.5 rounded-full ${device==='desktop'?'bg-emerald2 text-white':'text-charcoal/60'}`} title="Desktop"><Monitor className="size-4" /></button>
            <button onClick={()=>setDevice('tablet')} className={`p-1.5 rounded-full ${device==='tablet'?'bg-emerald2 text-white':'text-charcoal/60'}`} title="Tablet"><Tablet className="size-4" /></button>
            <button onClick={()=>setDevice('mobile')} className={`p-1.5 rounded-full ${device==='mobile'?'bg-emerald2 text-white':'text-charcoal/60'}`} title="Mobile"><Smartphone className="size-4" /></button>
          </div>
          <Link href={`/?preview=${id}`} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm hover:border-emerald2 hover:text-emerald2"><ExternalLink className="size-4" /> Preview</Link>
          <button onClick={undo} disabled={!isDirty} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm disabled:opacity-40"><Undo2 className="size-4" /> Undo</button>
          <button onClick={save} disabled={saving || !isDirty} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-charcoal text-white text-sm font-semibold disabled:opacity-40"><Save className="size-4" /> {saving?'Saving…':'Save'}</button>
          {doc.isActive
            ? <button onClick={unpublish} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold"><XCircle className="size-4" /> Unpublish</button>
            : <button onClick={publish} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><CheckCircle2 className="size-4" /> Publish</button>}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        {/* Sections list */}
        <div className="space-y-2">
          <button onClick={()=>setShowAddDrawer(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-emerald2/40 text-emerald2 hover:bg-emerald2/5 font-semibold text-sm"><Plus className="size-4" /> Add Section</button>
          {(doc.sections || []).map((s, i) => {
            const meta = findSectionMeta(s.type);
            return (
              <div key={s.id} className={`bg-white rounded-2xl border p-3 shadow-sm ${editingIdx === i ? 'ring-2 ring-emerald2' : ''} ${s.hidden ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-lg bg-emerald2/10 text-emerald2 grid place-items-center text-lg">{meta.icon}</div>
                  <button onClick={()=>setEditingIdx(editingIdx===i?null:i)} className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold text-charcoal truncate">{meta.label} <span className="text-xs text-muted-foreground font-normal">#{i+1}</span></div>
                    <div className="text-xs text-muted-foreground truncate">{s.props?.title || meta.desc}</div>
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button onClick={()=>moveUp(i)} disabled={i===0} className="p-1.5 rounded hover:bg-emerald2/10 text-charcoal/70 disabled:opacity-20"><ArrowUp className="size-4" /></button>
                    <button onClick={()=>moveDown(i)} disabled={i===doc.sections.length-1} className="p-1.5 rounded hover:bg-emerald2/10 text-charcoal/70 disabled:opacity-20"><ArrowDown className="size-4" /></button>
                    <button onClick={()=>toggleHide(i)} className="p-1.5 rounded hover:bg-emerald2/10 text-charcoal/70" title={s.hidden?'Show':'Hide'}>{s.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                    <button onClick={()=>dupSection(i)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Duplicate"><Copy className="size-4" /></button>
                    <button onClick={()=>removeSection(i)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600" title="Remove"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                {editingIdx === i && <SectionPropsEditor section={s} onChange={(next)=>updateSectionProps(i, next)} />}
              </div>
            );
          })}
          {(doc.sections || []).length === 0 && (
            <div className="bg-white rounded-2xl border p-6 text-center text-sm text-muted-foreground">No sections yet. Click "Add Section" above.</div>
          )}
        </div>

        {/* Right pane — preview info & SEO */}
        <div className="space-y-4">
          <div className={`mx-auto bg-white rounded-2xl border shadow-sm overflow-hidden ${deviceWidths[device]}`} style={{ width: '100%' }}>
            <div className="px-4 py-2 bg-secondary/60 border-b text-xs text-muted-foreground flex items-center gap-2">
              <div className="size-2 rounded-full bg-rose-400"/><div className="size-2 rounded-full bg-amber-400"/><div className="size-2 rounded-full bg-emerald-400"/>
              <span className="ml-2 truncate">safarcurated.com{doc.isActive ? '  ·  live' : '  ·  draft'}</span>
              <span className="ml-auto uppercase tracking-wider">{device}</span>
            </div>
            <div className="p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Preview stack</div>
              <ol className="mt-3 space-y-2">
                {(doc.sections || []).filter(s=>!s.hidden).map((s, i) => {
                  const m = findSectionMeta(s.type);
                  return (
                    <li key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/40 border">
                      <div className="text-lg">{m.icon}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-charcoal truncate">{m.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.props?.title || m.desc}</div>
                      </div>
                    </li>
                  );
                })}
                {(doc.sections || []).filter(s=>!s.hidden).length === 0 && <li className="text-sm text-muted-foreground">All sections hidden.</li>}
              </ol>
              <div className="mt-4 text-xs text-muted-foreground">Live preview: <Link href={`/?preview=${id}`} target="_blank" className="text-emerald2 hover:underline font-semibold">open in new tab</Link></div>
            </div>
          </div>

          {/* SEO block */}
          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-gold" />
              <h3 className="font-semibold text-charcoal">SEO for this home page</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Field label="Title" value={doc.seo?.title || ''} onChange={(v)=>setDoc({...doc, seo:{...(doc.seo||{}), title:v}})} />
              <Field label="Meta description" value={doc.seo?.description || ''} onChange={(v)=>setDoc({...doc, seo:{...(doc.seo||{}), description:v}})} textarea />
              <Field label="Keywords (comma sep.)" value={(doc.seo?.keywords||[]).join(', ')} onChange={(v)=>setDoc({...doc, seo:{...(doc.seo||{}), keywords: v.split(',').map(x=>x.trim()).filter(Boolean)}})} />
            </div>
          </div>
        </div>
      </div>

      {/* Add Section drawer */}
      {showAddDrawer && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-end sm:items-center justify-center p-4" onClick={(e)=>{ if (e.target===e.currentTarget) setShowAddDrawer(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center gap-3">
              <Sparkles className="size-5 text-emerald2" />
              <div className="flex-1">
                <div className="font-display font-bold">Add a section</div>
                <div className="text-xs text-muted-foreground">Pick from Safar's section library. All sections auto-load live data where relevant.</div>
              </div>
              <button onClick={()=>setShowAddDrawer(false)} className="p-2 rounded-full hover:bg-secondary text-charcoal/70">✕</button>
            </div>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 px-3 py-2 border rounded-full">
                <Search className="size-4 text-muted-foreground" />
                <input value={addQuery} onChange={(e)=>setAddQuery(e.target.value)} placeholder="Search sections…" className="flex-1 bg-transparent outline-none text-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredLib.map(s => (
                <button key={s.type} onClick={()=>addSection(s.type)} className="flex items-start gap-3 px-3 py-3 rounded-xl border text-left hover:border-emerald2 hover:bg-emerald2/5 transition">
                  <div className="text-2xl">{s.icon}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-charcoal">{s.label}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{s.desc}</div>
                  </div>
                </button>
              ))}
              {filteredLib.length===0 && <div className="col-span-full text-sm text-muted-foreground p-8 text-center">No matches for "{addQuery}"</div>}
            </div>
          </div>
        </div>
      )}
    </WebsiteBuilderShell>
  );
}

function Field({ label, value, onChange, textarea, type='text' }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      {textarea
        ? <textarea value={value||''} onChange={(e)=>onChange(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none" />
        : <input type={type} value={value||''} onChange={(e)=>onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none" />}
    </label>
  );
}

// Renders a compact prop editor based on the section fields defined in SECTION_LIBRARY.
function SectionPropsEditor({ section, onChange }) {
  const meta = findSectionMeta(section.type);
  const p = section.props || {};
  return (
    <div className="mt-3 pt-3 border-t space-y-3">
      {meta.fields.includes('title') && <Field label="Title" value={p.title||''} onChange={(v)=>onChange({ title: v })} />}
      {meta.fields.includes('subtitle') && <Field label="Subtitle" value={p.subtitle||''} onChange={(v)=>onChange({ subtitle: v })} textarea />}
      {meta.fields.includes('limit') && <Field label="Item limit" type="number" value={p.limit||8} onChange={(v)=>onChange({ limit: Number(v)||8 })} />}
      {meta.fields.includes('columns') && <Field label="Columns" type="number" value={p.columns||4} onChange={(v)=>onChange({ columns: Number(v)||4 })} />}
      {meta.fields.includes('variant') && (
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Variant</span>
          <select value={p.variant||'seasonal-slideshow'} onChange={(e)=>onChange({ variant: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none">
            <option value="seasonal-slideshow">Seasonal slideshow (current default)</option>
            <option value="editorial">Editorial</option>
            <option value="video-still">Video-still</option>
            <option value="dark-luxe">Dark luxe</option>
            <option value="warm">Warm</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>
      )}
      {meta.fields.includes('ctaPrimary') && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Primary CTA label" value={p.ctaPrimary?.label||''} onChange={(v)=>onChange({ ctaPrimary: {...(p.ctaPrimary||{}), label: v} })} />
          <Field label="Primary CTA href" value={p.ctaPrimary?.href||''} onChange={(v)=>onChange({ ctaPrimary: {...(p.ctaPrimary||{}), href: v} })} />
        </div>
      )}
      {meta.fields.includes('ctaSecondary') && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Secondary CTA label" value={p.ctaSecondary?.label||''} onChange={(v)=>onChange({ ctaSecondary: {...(p.ctaSecondary||{}), label: v} })} />
          <Field label="Secondary CTA href" value={p.ctaSecondary?.href||''} onChange={(v)=>onChange({ ctaSecondary: {...(p.ctaSecondary||{}), href: v} })} />
        </div>
      )}
      {meta.fields.includes('style') && (
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Style</span>
          <select value={p.style||'floating-card'} onChange={(e)=>onChange({ style: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none">
            <option value="floating-card">Floating card</option>
            <option value="inline">Inline</option>
            <option value="top-bar">Top bar</option>
          </select>
        </label>
      )}
      {meta.fields.includes('buttonLabel') && <Field label="Button label" value={p.buttonLabel||''} onChange={(v)=>onChange({ buttonLabel: v })} />}
      {meta.fields.includes('buttonHref') && <Field label="Button href" value={p.buttonHref||''} onChange={(v)=>onChange({ buttonHref: v })} />}
      {meta.fields.includes('background') && <Field label="Background image URL" value={p.background||''} onChange={(v)=>onChange({ background: v })} />}
      {meta.fields.includes('html') && <Field label="HTML" value={p.html||''} onChange={(v)=>onChange({ html: v })} textarea />}
      {meta.fields.includes('handle') && <Field label="Instagram handle" value={p.handle||''} onChange={(v)=>onChange({ handle: v })} />}
      {meta.fields.includes('items') && (
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">FAQ items (Q|A per line)</span>
          <textarea rows={4} value={(p.items||[]).map(x=>`${x.q||''}|${x.a||''}`).join('\n')} onChange={(e)=>onChange({ items: e.target.value.split('\n').filter(Boolean).map(l=>{ const [q,...a] = l.split('|'); return { q: (q||'').trim(), a: a.join('|').trim() }; }) })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none" />
        </div>
      )}
    </div>
  );
}
