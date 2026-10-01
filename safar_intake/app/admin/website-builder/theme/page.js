'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, RefreshCw } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function ThemeSettings() {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{(async()=>{try{const r=await cmsApi.getTheme();setDoc(r.theme);}catch(e){toast.error(e.message);}finally{setLoading(false);}})();},[]);
  async function save(){try{const r=await cmsApi.updateTheme(doc);setDoc(r.theme);toast.success('Theme saved');}catch(e){toast.error(e.message);}}
  if(loading||!doc) return <WebsiteBuilderShell title="Theme Settings"><div/></WebsiteBuilderShell>;
  const c = doc.colors||{}; const f = doc.fonts||{}; const r = doc.radius||{};
  return (
    <WebsiteBuilderShell title="Theme Settings" subtitle="Global colors, typography, radius, dark mode, animations" actions={<button onClick={save} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><Save className="size-4" /> Save</button>}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
          <h3 className="font-semibold">Colors</h3>
          {['primary','secondary','accent','background','text'].map(k=>(
            <div key={k} className="grid grid-cols-[100px_1fr_60px] items-center gap-2">
              <span className="text-xs uppercase font-semibold text-muted-foreground">{k}</span>
              <input value={c[k]||''} onChange={(e)=>setDoc({...doc, colors:{...c, [k]: e.target.value}})} className="px-3 py-2 rounded-lg border text-sm" />
              <input type="color" value={c[k]||'#000000'} onChange={(e)=>setDoc({...doc, colors:{...c, [k]: e.target.value}})} className="w-full h-9 rounded border" />
            </div>
          ))}
          <hr />
          <h3 className="font-semibold">Typography</h3>
          <Field label="Display font" value={f.display||''} onChange={(v)=>setDoc({...doc, fonts:{...f, display:v}})} />
          <Field label="Body font" value={f.body||''} onChange={(v)=>setDoc({...doc, fonts:{...f, body:v}})} />
        </div>
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
          <h3 className="font-semibold">Layout</h3>
          <Field label="Container max width" value={doc.containerWidth||''} onChange={(v)=>setDoc({...doc, containerWidth:v})} />
          {['sm','md','lg','xl'].map(k=>(
            <Field key={k} label={`Border radius — ${k}`} value={r[k]||''} onChange={(v)=>setDoc({...doc, radius:{...r, [k]: v}})} />
          ))}
          <hr />
          <label className="flex items-center justify-between text-sm py-1"><span>Dark mode enabled</span><input type="checkbox" checked={!!doc.dark} onChange={(e)=>setDoc({...doc, dark: e.target.checked})} className="size-4" /></label>
          <label className="flex items-center justify-between text-sm py-1"><span>Animations enabled</span><input type="checkbox" checked={doc.animations !== false} onChange={(e)=>setDoc({...doc, animations: e.target.checked})} className="size-4" /></label>
          <hr />
          <h3 className="font-semibold flex items-center gap-2"><RefreshCw className="size-4" /> Preview swatch</h3>
          <div className="grid grid-cols-5 gap-2">{['primary','secondary','accent','background','text'].map(k=>(<div key={k} className="aspect-square rounded-xl border shadow-inner" style={{background:c[k]||'#eee'}} title={k} />))}</div>
        </div>
      </div>
    </WebsiteBuilderShell>
  );
}

function Field({ label, value, onChange }) {
  return <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span><input value={value||''} onChange={(e)=>onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none" /></label>;
}
