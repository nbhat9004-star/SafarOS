'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Search, Check, X } from 'lucide-react';
import { SERVICE_GROUPS } from '@/lib/services';

// Reusable, scalable multi-service selector.
// Props:
//   value: string[]  -> array of selected service ids
//   onChange(ids: string[])
//   compact?: boolean -> tighter cards (used in filters)
//   showSearch?: boolean (default true)
//   limit?: number per group (collapse with "show more")
export default function ServiceSelector({ value = [], onChange, compact = false, showSearch = true, limit = 0 }) {
  const [q, setQ] = useState('');
  const [openGroups, setOpenGroups] = useState({});

  const groups = useMemo(() => {
    if (!q) return SERVICE_GROUPS;
    const term = q.toLowerCase();
    return SERVICE_GROUPS.map(g => ({ ...g, services: g.services.filter(s => s.label.toLowerCase().includes(term)) })).filter(g => g.services.length);
  }, [q]);

  const toggle = (id) => {
    const next = value.includes(id) ? value.filter(v => v !== id) : [...value, id];
    onChange?.(next);
  };
  const clearGroup = (gid) => {
    const ids = SERVICE_GROUPS.find(g => g.id === gid)?.services.map(s => s.id) || [];
    onChange?.(value.filter(v => !ids.includes(v)));
  };
  const selectAllGroup = (gid) => {
    const ids = SERVICE_GROUPS.find(g => g.id === gid)?.services.map(s => s.id) || [];
    const merged = Array.from(new Set([...value, ...ids]));
    onChange?.(merged);
  };

  return (
    <div className="space-y-7">
      {showSearch && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white border rounded-full px-4 py-2.5 shadow-sm">
            <Search className="size-4 text-muted-foreground" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search services (e.g. wazwan, skiing, airport...)" className="flex-1 outline-none bg-transparent text-sm" />
            {q && <button onClick={()=>setQ('')} className="size-6 grid place-items-center rounded-full hover:bg-secondary"><X className="size-3.5" /></button>}
          </div>
          {value.length > 0 && (
            <div className="text-xs text-muted-foreground"><span className="font-semibold text-emerald2">{value.length}</span> selected
              <button onClick={()=>onChange?.([])} className="ml-2 underline hover:text-charcoal">Clear all</button>
            </div>
          )}
        </div>
      )}

      {groups.map((g) => {
        const selectedInGroup = g.services.filter(s => value.includes(s.id)).length;
        const expanded = openGroups[g.id] || !limit;
        const visible = expanded ? g.services : g.services.slice(0, limit);
        const accent = g.color === 'gold' ? 'bg-gold/10 text-gold-deep border-gold/30' : g.color === 'mountain' ? 'bg-mountain/10 text-mountain-deep border-mountain/30' : 'bg-emerald-50 text-emerald2 border-emerald-200';
        return (
          <div key={g.id} className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b bg-gradient-to-r from-secondary/50 to-transparent">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${accent}`}>{g.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{g.sub}</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {selectedInGroup > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald2 text-white font-semibold">{selectedInGroup}</span>}
                <button onClick={()=>selectedInGroup === g.services.length ? clearGroup(g.id) : selectAllGroup(g.id)} className="text-muted-foreground hover:text-charcoal underline">
                  {selectedInGroup === g.services.length ? 'Clear group' : 'Select all'}
                </button>
              </div>
            </div>
            <div className={`p-4 grid gap-2.5 ${compact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
              {visible.map((s) => {
                const Ico = Icons[s.icon] || Icons.Sparkles;
                const on = value.includes(s.id);
                return (
                  <motion.button key={s.id} type="button" onClick={()=>toggle(s.id)}
                    whileTap={{ scale: 0.97 }}
                    className={`group relative text-left rounded-2xl border-2 transition-all p-3.5 ${compact ? 'p-3' : 'p-3.5'} ${on ? 'border-emerald-600 bg-emerald-50/60 shadow-md shadow-emerald-900/5' : 'border-border bg-white hover:border-charcoal/40 hover:bg-secondary/40'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className={`size-10 rounded-xl grid place-items-center transition ${on ? 'bg-gradient-emerald text-white' : 'bg-secondary text-charcoal group-hover:bg-charcoal group-hover:text-white'}`}>
                        <Ico className="size-5" />
                      </div>
                      <AnimatePresence>
                        {on && (
                          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}
                            className="size-6 rounded-full bg-emerald-600 text-white grid place-items-center shadow"><Check className="size-3.5" /></motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="mt-3 font-semibold text-sm leading-snug">{s.label}</div>
                  </motion.button>
                );
              })}
            </div>
            {limit > 0 && g.services.length > limit && (
              <div className="px-5 pb-4 -mt-1">
                <button onClick={()=>setOpenGroups({ ...openGroups, [g.id]: !expanded })} className="text-xs font-semibold text-emerald2 hover:underline">
                  {expanded ? 'Show less' : `Show ${g.services.length - limit} more`}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
