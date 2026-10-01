'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, Search } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function MediaLibrary() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh(){setLoading(true);try{const r=await cmsApi.listMedia(q?{q}:{});setItems(r.media||[]);}catch(e){toast.error(e.message);}finally{setLoading(false);}}
  useEffect(()=>{refresh();/* eslint-disable-next-line */},[]);

  async function add(){
    const url=prompt('Image URL:'); if(!url)return;
    const name=prompt('Name:', url.split('/').pop());
    const alt=prompt('Alt text:','');
    try{await cmsApi.addMedia({url, name, alt, type:'image'}); toast.success('Added'); refresh();}catch(e){toast.error(e.message);}
  }
  async function del(id){if(!confirm('Delete asset?'))return;try{await cmsApi.deleteMedia(id);refresh();}catch(e){toast.error(e.message);}}
  function copy(url){navigator.clipboard?.writeText(url);toast.success('URL copied');}

  return (
    <WebsiteBuilderShell title="Media Library" subtitle="Images, videos, icons, documents — reusable across the site" actions={<button onClick={add} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold"><Plus className="size-4" /> Add media by URL</button>}>
      <div className="bg-white border rounded-2xl p-3 mb-4 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-full"><Search className="size-4 text-muted-foreground" /><input value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&refresh()} placeholder="Search by name, alt, tags…" className="flex-1 bg-transparent outline-none text-sm" /></div>
        <button onClick={refresh} className="px-4 py-2 rounded-full border text-sm hover:border-emerald2 hover:text-emerald2">Search</button>
      </div>
      {loading ? <div className="text-sm text-muted-foreground">Loading…</div> :
        items.length===0 ? <div className="bg-white border rounded-2xl p-8 text-center text-sm text-muted-foreground">No media yet. Add images by URL to reuse across pages.</div> :
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map(m=>(
            <div key={m.id} className="group relative bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md">
              <div className="aspect-square bg-secondary">{m.type==='image' && <img src={m.url} alt={m.alt||m.name} className="w-full h-full object-cover" loading="lazy" />}</div>
              <div className="p-2">
                <div className="text-xs font-semibold truncate">{m.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{m.alt || '—'}</div>
              </div>
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={()=>copy(m.url)} className="p-1.5 rounded bg-white/95 border shadow hover:border-emerald2" title="Copy URL"><Copy className="size-3.5" /></button>
                <button onClick={()=>del(m.id)} className="p-1.5 rounded bg-white/95 border shadow hover:border-rose-500 text-rose-600" title="Delete"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>}
    </WebsiteBuilderShell>
  );
}
