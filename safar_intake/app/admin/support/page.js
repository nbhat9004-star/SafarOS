'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy, Loader2, Send, UserCog, StickyNote, Merge, Search, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const STATUS_COLOR = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting: 'bg-slate-100 text-slate-700 border-slate-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-200 text-slate-700 border-slate-300',
  merged: 'bg-purple-50 text-purple-700 border-purple-200',
};

function Inner() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ status: '', q: '' });
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      const [rT, rS] = await Promise.all([
        fetch(`/api/support/tickets?${params.toString()}`, { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/admin/support/stats', { credentials: 'include' }).then((r) => r.json()),
      ]);
      if (rT.ok) setTickets(rT.tickets || []);
      if (rS.ok) setStats(rS);
    } finally { setLoading(false); }
  };
  // eslint-disable-next-line
  useEffect(() => { load(); }, [filter.status]);

  const filtered = useMemo(() => {
    const needle = filter.q.trim().toLowerCase();
    if (!needle) return tickets;
    return tickets.filter((t) => (t.subject || '').toLowerCase().includes(needle) || (t.userName || '').toLowerCase().includes(needle) || (t.ticketNumber || '').toLowerCase().includes(needle));
  }, [tickets, filter.q]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Admin
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-2"><LifeBuoy className="size-7 text-emerald2" /> Support Center</h1>

        {stats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] uppercase text-muted-foreground font-bold">Total</div><div className="font-display text-xl font-bold">{stats.total}</div></div>
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] uppercase text-amber-600 font-bold">Open + Progress</div><div className="font-display text-xl font-bold">{(stats.byStatus.open || 0) + (stats.byStatus.in_progress || 0)}</div></div>
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] uppercase text-emerald-700 font-bold">Avg First Response</div><div className="font-display text-xl font-bold">{stats.avgResponseTimeMin}m</div></div>
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] uppercase text-emerald-700 font-bold">Avg Resolution</div><div className="font-display text-xl font-bold">{stats.avgResolutionTimeHr}h</div></div>
            <div className="rounded-2xl border bg-white p-4"><div className="text-[10px] uppercase text-emerald-700 font-bold">Rating</div><div className="font-display text-xl font-bold">{stats.avgSupportRating || '—'} <span className="text-xs text-muted-foreground">({stats.totalRated})</span></div></div>
          </div>
        )}

        <div className="mt-6 grid md:grid-cols-[380px_1fr] gap-4">
          <aside className="rounded-2xl border bg-white">
            <div className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder="Search subject, user..." className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm" />
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {['', 'open', 'in_progress', 'waiting', 'resolved', 'closed'].map((s) => (
                  <button key={s || 'all'} onClick={() => setFilter({ ...filter, status: s })} className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap border ${filter.status === s ? 'bg-emerald2 text-white border-emerald2' : 'bg-white'}`}>{s || 'all'}</button>
                ))}
              </div>
            </div>
            {loading ? <div className="py-8 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
              : filtered.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No tickets.</div>
              : <div className="max-h-[70vh] overflow-y-auto divide-y">
                  {filtered.map((t) => (
                    <button key={t.id} onClick={() => setActive(t)} className={`w-full text-left p-3 hover:bg-secondary transition ${active?.id === t.id ? 'bg-emerald-50' : ''}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLOR[t.status] || ''}`}>{t.status?.replace('_', ' ')}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-secondary">{t.priority}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{t.ticketNumber}</span>
                      </div>
                      <div className="font-semibold text-sm truncate">{t.subject}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{t.userName} · {t.userEmail}</div>
                    </button>
                  ))}
                </div>}
          </aside>
          <section>
            {!active ? (
              <div className="rounded-2xl border bg-white p-12 text-center text-sm text-muted-foreground">Select a ticket to view details.</div>
            ) : (
              <AdminTicketView ticket={active} onUpdated={() => load()} />
            )}
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function AdminTicketView({ ticket, onUpdated }) {
  const [current, setCurrent] = useState(ticket);
  const [reply, setReply] = useState('');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const refresh = async () => {
    const r = await fetch(`/api/support/tickets/${ticket.id}`, { credentials: 'include' });
    const d = await r.json();
    if (d.ok) setCurrent(d.ticket);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [ticket.id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/support/tickets/${ticket.id}/reply`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: reply.trim() }) });
      const d = await r.json();
      if (d.ok) { setReply(''); refresh(); onUpdated?.(); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };
  const addNote = async () => {
    if (!noteText.trim()) return;
    const r = await fetch(`/api/admin/tickets/${ticket.id}/note`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: noteText.trim() }) });
    const d = await r.json();
    if (d.ok) { setNoteText(''); setShowNote(false); refresh(); toast.success('Note added'); }
  };
  const changeStatus = async (status) => {
    const r = await fetch(`/api/support/tickets/${ticket.id}/status`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const d = await r.json();
    if (d.ok) { refresh(); onUpdated?.(); toast.success(`Ticket ${status}`); }
  };
  const assignSelf = async () => {
    const r = await fetch(`/api/admin/tickets/${ticket.id}/assign`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assigneeId: 'self' }) });
    // Use 'self' as marker; server will accept the user's own id if valid or set null. Simpler: send my id.
    // We'll rely on the current login state — fallback prompt.
    if (!r.ok) { const uid = prompt('Assignee user id?'); if (uid) { const r2 = await fetch(`/api/admin/tickets/${ticket.id}/assign`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assigneeId: uid }) }); if (r2.ok) { refresh(); toast.success('Assigned'); } } }
    else { refresh(); toast.success('Assigned'); }
  };
  const mergeInto = async () => {
    const primary = prompt('Primary ticket ID (to keep):');
    if (!primary) return;
    const r = await fetch('/api/admin/tickets/merge', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primaryId: primary, mergeIds: [ticket.id] }) });
    const d = await r.json();
    if (d.ok) { toast.success('Merged'); onUpdated?.(); }
    else toast.error(d.error || 'Failed');
  };

  return (
    <div className="rounded-2xl border bg-white">
      <div className="p-4 md:p-5 border-b">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLOR[current.status] || ''}`}>{current.status?.replace('_', ' ')}</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-secondary">{current.category}</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-secondary">{current.priority}</span>
          {current.assignedToName && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{current.assignedToName}</span>}
          <div className="ml-auto flex gap-1 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setShowNote((v) => !v)} className="rounded-full h-8"><StickyNote className="size-3 mr-1" /> Note</Button>
            <Button size="sm" variant="outline" onClick={assignSelf} className="rounded-full h-8"><UserCog className="size-3 mr-1" /> Assign</Button>
            <Button size="sm" variant="outline" onClick={mergeInto} className="rounded-full h-8"><Merge className="size-3 mr-1" /> Merge</Button>
            {current.status !== 'resolved' && <Button size="sm" onClick={() => changeStatus('resolved')} className="rounded-full h-8 bg-emerald2 hover:bg-emerald2-deep">Resolve</Button>}
            {current.status !== 'closed' && <Button size="sm" variant="ghost" onClick={() => changeStatus('closed')} className="rounded-full h-8 text-rose-500">Close</Button>}
          </div>
        </div>
        <div className="font-display text-lg font-bold mt-2">{current.subject}</div>
        <div className="text-[11px] text-muted-foreground">{current.userName} · {current.userEmail} · {current.ticketNumber}</div>
      </div>

      {showNote && (
        <div className="p-3 bg-amber-50 border-b">
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Internal note (only admins can see)" className="w-full px-3 py-2 rounded-lg border text-sm" />
          <div className="mt-2 flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setShowNote(false)}>Cancel</Button>
            <Button size="sm" onClick={addNote} className="rounded-full bg-amber-500 hover:bg-amber-600">Save note</Button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-5 space-y-3 max-h-[50vh] overflow-y-auto">
        {(current.conversation || []).map((c, i) => (
          <div key={i} className={`flex ${c.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${c.from === 'admin' ? 'bg-emerald2 text-white' : 'bg-secondary'}`}>
              <div className="text-[10px] font-bold uppercase mb-0.5 opacity-70">{c.from === 'admin' ? c.adminName || 'Support' : c.userName || 'User'}{c.mergedFrom ? ` (merged from ${c.mergedFrom})` : ''}</div>
              <div className="text-sm whitespace-pre-wrap">{c.message}</div>
              <div className={`text-[10px] mt-1 ${c.from === 'admin' ? 'text-white/70' : 'text-muted-foreground'}`}>{new Date(c.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}

        {(current.internalNotes || []).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-[10px] uppercase font-bold text-amber-700 mb-2">Internal Notes ({current.internalNotes.length})</div>
            <div className="space-y-2">
              {current.internalNotes.map((n) => (
                <div key={n.id} className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <div className="text-[10px] uppercase font-bold text-amber-700">{n.adminName} · {new Date(n.createdAt).toLocaleString()}</div>
                  <div className="text-sm whitespace-pre-wrap mt-0.5">{n.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {current.status !== 'closed' && current.status !== 'merged' && (
        <div className="p-4 border-t flex gap-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Reply to user..." className="flex-1 px-3 py-2 rounded-xl border text-sm resize-none" />
          <Button onClick={sendReply} disabled={saving || !reply.trim()} className="rounded-full bg-emerald2 hover:bg-emerald2-deep self-end">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin', 'super_admin']}><Inner /></ProtectedRoute>;
}
