'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function NavigationBuilder() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh(){try{const r=await cmsApi.listNavigation();setList(r.navigations||[]);if(!selected&&r.navigations?.length)setSelected(r.navigations[0]);}catch(e){toast.error(e.message);}finally{setLoading(false);}}
  useEffect(()=>{refresh();/* eslint-disable-next-line */},[]);

  async function create(){const name=prompt('Menu name (e.g. mobile, mega-menu):');if(!name)return;try{const r=await cmsApi.createNavigation({name, items:[]});toast.success('Created');await refresh();setSelected(r.navigation);}catch(e){toast.error(e.message);}}
  async function save(){if(!selected)return;try{const r=await cmsApi.updateNavigation(selected.id,{name:selected.name, items:selected.items});setSelected(r.navigation);toast.success('Saved');refresh();}catch(e){toast.error(e.message);}}
  async function del(){if(!selected)return;if(!confirm('Delete menu?'))return;try{await cmsApi.deleteNavigation(selected.id);setSelected(null);refresh();}catch(e){toast.error(e.message);}}

  function upd(items){setSelected({...selected, items});}
  function addItem(){upd([...(selected.items||[]), { label:'New', href:'/', children: [] }]);}
  function rm(i){const it=[...selected.items];it.splice(i,1);upd(it);}
  function move(i,d){const it=[...selected.items];const j=i+d;if(j<0||j>=it.length)return;[it[i],it[j]]=[it[j],it[i]];upd(it);}

  return (
    <WebsiteBuilderShell title="Navigation" subtitle="Additional named menus (mobile, mega-menu, footer-secondary)"
      actions={<button onClick={create} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><Plus className="size-4" /> New menu</button>}>
      {loading ? <div/> : list.length===0 ? <div className="bg-white border rounded-2xl p-8 text-center text-sm text-muted-foreground">No custom menus yet. Header menu is edited in the Header module.</div> :
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <div className="bg-white rounded-2xl border p-2 shadow-sm space-y-1">{list.map(n=>(<button key={n.id} onClick={()=>setSelected(n)} className={`w-full text-left px-3 py-2 rounded-xl text-sm ${selected?.id===n.id?'bg-emerald2 text-white':'hover:bg-emerald2/10'}`}>{n.name}<span className="block text-xs opacity-70">{(n.items||[]).length} items</span></button>))}</div>
        {selected && <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div><div className="font-display font-bold text-lg">{selected.name}</div><div className="text-xs text-muted-foreground">Public: /api/public/navigation/{selected.name}</div></div>
            <div className="flex gap-2"><button onClick={save} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-charcoal text-white text-sm font-semibold"><Save className="size-4" /> Save</button><button onClick={del} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-rose-300 text-rose-600 text-sm"><Trash2 className="size-4" /></button></div>
          </div>
          <button onClick={addItem} className="mb-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-emerald2 text-emerald2 text-xs font-semibold hover:bg-emerald2 hover:text-white"><Plus className="size-3" /> Add item</button>
          {(selected.items||[]).map((it,i)=>(<div key={i} className="border rounded-xl p-3 mb-2">
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2">
              <input value={it.label||''} onChange={(e)=>{const c=[...selected.items];c[i]={...c[i],label:e.target.value};upd(c);}} placeholder="Label" className="px-2 py-1.5 rounded border text-sm" />
              <input value={it.href||''} onChange={(e)=>{const c=[...selected.items];c[i]={...c[i],href:e.target.value};upd(c);}} placeholder="/href" className="px-2 py-1.5 rounded border text-sm" />
              <button onClick={()=>move(i,-1)} className="p-1.5 hover:bg-emerald2/10 rounded"><ArrowUp className="size-3" /></button>
              <button onClick={()=>move(i,1)} className="p-1.5 hover:bg-emerald2/10 rounded"><ArrowDown className="size-3" /></button>
              <button onClick={()=>rm(i)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded"><Trash2 className="size-3" /></button>
            </div>
          </div>))}
        </div>}
      </div>}
    </WebsiteBuilderShell>
  );
}
