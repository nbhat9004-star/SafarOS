'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Plus, Trash2 } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function FooterBuilder() {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{(async()=>{try{const r=await cmsApi.getFooter();setDoc(r.footer);}catch(e){toast.error(e.message);}finally{setLoading(false);}})();},[]);
  async function save(){try{const r=await cmsApi.updateFooter(doc);setDoc(r.footer);toast.success('Footer saved');}catch(e){toast.error(e.message);}}
  if (loading||!doc) return <WebsiteBuilderShell title="Footer Builder"><div/></WebsiteBuilderShell>;
  const cols = doc.columns||[];
  const socs = doc.socials||[];
  const s = doc.settings||{};

  return (
    <WebsiteBuilderShell title="Footer Builder" subtitle="Columns, links, social, contact, policies" actions={<button onClick={save} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><Save className="size-4" /> Save</button>}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Columns</h3><button onClick={()=>setDoc({...doc, columns:[...cols, { title: 'New column', links: [] }]})} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:border-emerald2"><Plus className="size-3" /> Add column</button></div>
          {cols.map((c,i)=>(
            <div key={i} className="border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <input value={c.title||''} onChange={(e)=>{const n=[...cols];n[i]={...n[i],title:e.target.value};setDoc({...doc,columns:n});}} className="flex-1 px-3 py-2 rounded-lg border text-sm font-semibold" placeholder="Column title" />
                <button onClick={()=>{const n=[...cols];n.splice(i,1);setDoc({...doc,columns:n});}} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded"><Trash2 className="size-4" /></button>
              </div>
              {(c.links||[]).map((l,j)=>(
                <div key={j} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-1">
                  <input value={l.label||''} onChange={(e)=>{const n=[...cols];const links=[...(n[i].links||[])];links[j]={...links[j],label:e.target.value};n[i]={...n[i],links};setDoc({...doc,columns:n});}} placeholder="Label" className="px-2 py-1 rounded border text-sm" />
                  <input value={l.href||''} onChange={(e)=>{const n=[...cols];const links=[...(n[i].links||[])];links[j]={...links[j],href:e.target.value};n[i]={...n[i],links};setDoc({...doc,columns:n});}} placeholder="/href" className="px-2 py-1 rounded border text-sm" />
                  <button onClick={()=>{const n=[...cols];const links=[...(n[i].links||[])];links.splice(j,1);n[i]={...n[i],links};setDoc({...doc,columns:n});}} className="p-1 hover:bg-rose-50 text-rose-600 rounded"><Trash2 className="size-3" /></button>
                </div>
              ))}
              <button onClick={()=>{const n=[...cols];n[i]={...n[i],links:[...(n[i].links||[]),{label:'',href:''}]};setDoc({...doc,columns:n});}} className="text-xs text-emerald2 mt-2 hover:underline">+ Add link</button>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
            <h3 className="font-semibold">Contact & Copyright</h3>
            <Field label="Email" value={doc.contact?.email||''} onChange={(v)=>setDoc({...doc, contact:{...(doc.contact||{}), email:v}})} />
            <Field label="Phone" value={doc.contact?.phone||''} onChange={(v)=>setDoc({...doc, contact:{...(doc.contact||{}), phone:v}})} />
            <Field label="Address" value={doc.contact?.address||''} onChange={(v)=>setDoc({...doc, contact:{...(doc.contact||{}), address:v}})} />
            <Field label="Copyright text" value={doc.copyright||''} onChange={(v)=>setDoc({...doc, copyright:v})} />
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Social links</h3><button onClick={()=>setDoc({...doc, socials:[...socs, { platform: 'twitter', href: '' }]})} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:border-emerald2"><Plus className="size-3" /> Add</button></div>
            {socs.map((s2,i)=>(
              <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 mb-2">
                <select value={s2.platform||'twitter'} onChange={(e)=>{const n=[...socs];n[i]={...n[i],platform:e.target.value};setDoc({...doc,socials:n});}} className="px-2 py-2 rounded border text-sm"><option value="twitter">Twitter/X</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="youtube">YouTube</option><option value="linkedin">LinkedIn</option></select>
                <input value={s2.href||''} onChange={(e)=>{const n=[...socs];n[i]={...n[i],href:e.target.value};setDoc({...doc,socials:n});}} placeholder="https://…" className="px-2 py-2 rounded border text-sm" />
                <button onClick={()=>{const n=[...socs];n.splice(i,1);setDoc({...doc,socials:n});}} className="p-1 hover:bg-rose-50 text-rose-600 rounded"><Trash2 className="size-3" /></button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Extras</h3>
            {['showNewsletter','showAppDownload','showPaymentIcons'].map(k=>(
              <label key={k} className="flex items-center justify-between text-sm py-1"><span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span><input type="checkbox" checked={!!s[k]} onChange={(e)=>setDoc({...doc, settings:{...s, [k]: e.target.checked}})} className="size-4" /></label>
            ))}
          </div>
        </div>
      </div>
    </WebsiteBuilderShell>
  );
}

function Field({ label, value, onChange }) {
  return <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span><input value={value||''} onChange={(e)=>onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none" /></label>;
}
