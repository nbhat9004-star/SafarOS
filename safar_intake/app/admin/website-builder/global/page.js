'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function GlobalComponents() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  async function refresh(){setLoading(true);try{const r=await cmsApi.listGlobal();setItems(r.components||[]);}catch(e){toast.error(e.message);}finally{setLoading(false);}}
  useEffect(()=>{refresh();},[]);

  async function create(){const key=prompt('Component key (unique, e.g. top-banner):');if(!key)return;const name=prompt('Display name:',key);const kind=prompt('Kind (banner, cta, review-card, announcement, promotion, newsletter, section-title, custom):','banner');try{const r=await cmsApi.createGlobal({key,name,kind,data:{}});toast.success('Created');refresh();setSelected(r.component);}catch(e){toast.error(e.message);}}
  async function save(){if(!selected)return;try{await cmsApi.updateGlobal(selected.id,{name:selected.name,kind:selected.kind,data:selected.data});toast.success('Saved');refresh();}catch(e){toast.error(e.message);}}
  async function del(id){if(!confirm('Delete component?'))return;try{await cmsApi.deleteGlobal(id);setSelected(null);refresh();}catch(e){toast.error(e.message);}}

  return (
    <WebsiteBuilderShell title="Global Components" subtitle="Reusable banners, CTAs, cards. Edit once, updates everywhere."
      actions={<button onClick={create} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><Plus className="size-4" /> New component</button>}>
      {loading ? <div/> : items.length===0 ? <div className="bg-white border rounded-2xl p-8 text-center text-sm text-muted-foreground">No global components yet.</div> :
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
          <div className="bg-white rounded-2xl border p-2 shadow-sm space-y-1">{items.map(g=>(<button key={g.id} onClick={()=>setSelected(g)} className={`w-full text-left px-3 py-2 rounded-xl ${selected?.id===g.id?'bg-emerald2 text-white':'hover:bg-emerald2/10'}`}><div className="text-sm font-semibold">{g.name}</div><div className="text-[11px] opacity-70">{g.kind} · {g.key}</div></button>))}</div>
          {selected && <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between"><div><div className="font-display font-bold text-lg">{selected.name}</div><div className="text-xs text-muted-foreground">Key: {selected.key}</div></div><div className="flex gap-2"><button onClick={save} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-charcoal text-white text-sm font-semibold"><Save className="size-4" /> Save</button><button onClick={()=>del(selected.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-rose-300 text-rose-600 text-sm"><Trash2 className="size-4" /></button></div></div>
            <Field label="Name" value={selected.name||''} onChange={(v)=>setSelected({...selected,name:v})} />
            <Field label="Kind" value={selected.kind||''} onChange={(v)=>setSelected({...selected,kind:v})} />
            <div><span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Data (JSON)</span><textarea rows={10} value={JSON.stringify(selected.data||{},null,2)} onChange={(e)=>{try{setSelected({...selected,data:JSON.parse(e.target.value||'{}')});}catch{}}} className="mt-1 w-full px-3 py-2 rounded-xl border font-mono text-xs bg-white focus:border-emerald2 outline-none" /></div>
          </div>}
        </div>}
    </WebsiteBuilderShell>
  );
}

function Field({ label, value, onChange }) {
  return <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span><input value={value||''} onChange={(e)=>onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm bg-white focus:border-emerald2 outline-none" /></label>;
}
