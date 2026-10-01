'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RotateCcw, Clock } from 'lucide-react';
import WebsiteBuilderShell from '@/components/safar/WebsiteBuilderShell';
import { cmsApi } from '@/lib/cms-api';

export default function Versions() {
  const [items, setItems] = useState([]);
  const [entity, setEntity] = useState('');
  const [loading, setLoading] = useState(true);
  async function refresh(){setLoading(true);try{const r=await cmsApi.listVersions(entity?{entity}:{});setItems(r.versions||[]);}catch(e){toast.error(e.message);}finally{setLoading(false);}}
  useEffect(()=>{refresh();/* eslint-disable-next-line */},[entity]);
  async function restore(id){if(!confirm('Restore this version? Current state will be snapshotted first.'))return;try{await cmsApi.restoreVersion(id);toast.success('Restored');refresh();}catch(e){toast.error(e.message);}}

  return (
    <WebsiteBuilderShell title="Version History" subtitle="Every publish and save creates a snapshot. Restore anytime.">
      <div className="bg-white border rounded-2xl p-3 mb-4 flex items-center gap-2">
        <select value={entity} onChange={(e)=>setEntity(e.target.value)} className="px-3 py-2 rounded-full border text-sm bg-white">
          <option value="">All entities</option>
          <option value="home_page">Home Pages</option>
          <option value="page">Pages</option>
          <option value="header">Header</option>
          <option value="footer">Footer</option>
          <option value="theme">Theme</option>
        </select>
      </div>
      {loading ? <div/> : items.length===0 ? <div className="bg-white border rounded-2xl p-8 text-center text-sm text-muted-foreground">No snapshots yet. Save or publish content to create one.</div> :
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">Entity</th><th className="text-left px-4 py-3">Entity ID</th><th className="text-left px-4 py-3">Note</th><th className="text-left px-4 py-3">By</th><th className="text-left px-4 py-3">When</th><th className="text-right px-4 py-3">Action</th></tr></thead>
            <tbody>{items.map(v=>(<tr key={v.id} className="border-t">
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald2 text-[11px] font-semibold">{v.entity}</span></td>
              <td className="px-4 py-3 text-muted-foreground text-xs font-mono truncate max-w-[180px]">{v.entityId}</td>
              <td className="px-4 py-3">{v.note||'—'}</td>
              <td className="px-4 py-3">{v.actorName||'—'}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs"><Clock className="size-3 inline mr-1" />{new Date(v.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 text-right"><button onClick={()=>restore(v.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-emerald2 text-emerald2 text-xs font-semibold hover:bg-emerald2 hover:text-white"><RotateCcw className="size-3" /> Restore</button></td>
            </tr>))}</tbody>
          </table>
        </div>}
    </WebsiteBuilderShell>
  );
}
