'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function HeaderBuilder() {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{(async()=>{try{const r=await cmsApi.getHeader();setDoc(r.header);}catch(e){toast.error(e.message);}finally{setLoading(false);}})();},[]);
  async function save(){try{const r=await cmsApi.updateHeader(doc);setDoc(r.header);toast.success('Header saved');}catch(e){toast.error(e.message);}}
  if (loading||!doc) return <WebsiteBuilderShell title="Header Builder"><div className="text-sm text-muted-foreground">Loading…</div></WebsiteBuilderShell>;
  const nav = doc.nav||[];
  const btns = doc.buttons||[];
  const s = doc.settings||{};

  return (
    <WebsiteBuilderShell title="Header Builder" subtitle="Logo, navigation, action buttons, announcement bar" actions={<button onClick={save} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><Save className="size-4" /> Save</button>}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
          <h3 className="font-semibold">Logo</h3>
          <Field label="Logo text" value={doc.logo?.text||''} onChange={(v)=>setDoc({...doc, logo:{...(doc.logo||{}), text:v}})} />
          <Field label="Logo image URL (optional)" value={doc.logo?.imageUrl||''} onChange={(v)=>setDoc({...doc, logo:{...(doc.logo||{}), imageUrl:v}})} />
          <hr />
          <h3 className="font-semibold">Settings</h3>
          {['sticky','transparent','showLanguage','showCurrency','showSearch','showAnnouncementBar'].map(k=>(
            <label key={k} className="flex items-center justify-between text-sm py-1"><span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span><input type="checkbox" checked={!!s[k]} onChange={(e)=>setDoc({...doc, settings:{...s, [k]: e.target.checked}})} className="size-4" /></label>
          ))}
          {s.showAnnouncementBar && <Field label="Announcement text" value={s.announcementText||''} onChange={(v)=>setDoc({...doc, settings:{...s, announcementText:v}})} />}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Navigation links</h3><button onClick={()=>setDoc({...doc, nav:[...nav, { label: 'New', href: '/' }]})} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:border-emerald2"><Plus className="size-3" /> Add</button></div>
            {nav.map((n,i)=>(
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center mb-2">
                <input value={n.label||''} onChange={(e)=>{const c=[...nav];c[i]={...c[i],label:e.target.value};setDoc({...doc,nav:c});}} placeholder="Label" className="px-3 py-2 rounded-lg border text-sm" />
                <input value={n.href||''} onChange={(e)=>{const c=[...nav];c[i]={...c[i],href:e.target.value};setDoc({...doc,nav:c});}} placeholder="/href" className="px-3 py-2 rounded-lg border text-sm" />
                <div className="flex">
                  <button onClick={()=>{if(i===0)return;const c=[...nav];[c[i-1],c[i]]=[c[i],c[i-1]];setDoc({...doc,nav:c});}} className="p-1 hover:bg-emerald2/10 rounded"><ArrowUp className="size-3" /></button>
                  <button onClick={()=>{if(i===nav.length-1)return;const c=[...nav];[c[i],c[i+1]]=[c[i+1],c[i]];setDoc({...doc,nav:c});}} className="p-1 hover:bg-emerald2/10 rounded"><ArrowDown className="size-3" /></button>
                  <button onClick={()=>{const c=[...nav];c.splice(i,1);setDoc({...doc,nav:c});}} className="p-1 hover:bg-rose-50 text-rose-600 rounded"><Trash2 className="size-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Action buttons</h3><button onClick={()=>setDoc({...doc, buttons:[...btns, { label: 'CTA', href: '/', variant: 'primary' }]})} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs hover:border-emerald2"><Plus className="size-3" /> Add</button></div>
            {btns.map((b,i)=>(
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center mb-2">
                <input value={b.label||''} onChange={(e)=>{const c=[...btns];c[i]={...c[i],label:e.target.value};setDoc({...doc,buttons:c});}} placeholder="Label" className="px-3 py-2 rounded-lg border text-sm" />
                <input value={b.href||''} onChange={(e)=>{const c=[...btns];c[i]={...c[i],href:e.target.value};setDoc({...doc,buttons:c});}} placeholder="/href" className="px-3 py-2 rounded-lg border text-sm" />
                <select value={b.variant||'primary'} onChange={(e)=>{const c=[...btns];c[i]={...c[i],variant:e.target.value};setDoc({...doc,buttons:c});}} className="px-2 py-2 rounded-lg border text-sm"><option value="primary">Primary</option><option value="outline">Outline</option><option value="ghost">Ghost</option></select>
                <button onClick={()=>{const c=[...btns];c.splice(i,1);setDoc({...doc,buttons:c});}} className="p-1 hover:bg-rose-50 text-rose-600 rounded"><Trash2 className="size-3" /></button>
              </div>
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
