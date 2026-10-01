'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, MessageCircle, Star, X, Send, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { id: 'booking', label: 'Booking' },
  { id: 'payment', label: 'Payment' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'refund', label: 'Refund' },
  { id: 'host', label: 'Host' },
  { id: 'traveler', label: 'Traveler' },
  { id: 'listing', label: 'Listing' },
  { id: 'technical', label: 'Technical Issue' },
  { id: 'general', label: 'General Inquiry' },
];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const STATUS_COLOR = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting: 'bg-slate-100 text-slate-700 border-slate-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-200 text-slate-700 border-slate-300',
  merged: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function SupportPanel({ role = 'traveler' }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/support/tickets', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setTickets(d.tickets || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        <aside className="rounded-2xl border bg-white">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-display font-bold">My Tickets</div>
            <Button size="sm" onClick={() => setShowNew(true)} className="rounded-full bg-emerald2 hover:bg-emerald2-deep h-8">
              <Plus className="size-3 mr-1" /> New
            </Button>
          </div>
          {loading ? (
            <div className="py-8 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No tickets yet.</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto divide-y">
              {tickets.map((t) => (
                <button key={t.id} onClick={() => setActive(t)} className={`w-full text-left p-3 hover:bg-secondary transition ${active?.id === t.id ? 'bg-emerald-50' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLOR[t.status] || ''}`}>{t.status?.replace('_', ' ')}</span>
                    <span className="text-[10px] text-muted-foreground">{t.ticketNumber}</span>
                  </div>
                  <div className="font-semibold text-sm truncate">{t.subject}</div>
                  <div className="text-[11px] text-muted-foreground">{t.category} · {new Date(t.createdAt).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section>
          {!active ? (
            <div className="rounded-2xl border bg-white p-12 text-center">
              <MessageCircle className="size-8 mx-auto text-emerald2" />
              <div className="font-display text-lg font-bold mt-3">Need help?</div>
              <p className="text-sm text-muted-foreground mt-1">Select a ticket or create a new one — our team typically responds within a few hours.</p>
              <Button onClick={() => setShowNew(true)} className="mt-4 rounded-full bg-emerald2 hover:bg-emerald2-deep">
                <Plus className="size-4 mr-2" /> Create Ticket
              </Button>
            </div>
          ) : (
            <TicketView ticket={active} onUpdated={() => { load(); }} />
          )}
        </section>
      </div>
      {showNew && <NewTicketModal onClose={() => setShowNew(false)} onCreated={(t) => { setShowNew(false); load(); setActive(t); }} />}
    </>
  );
}

function NewTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ subject: '', category: 'general', priority: 'medium', message: '', attachments: [] });
  const [attInput, setAttInput] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.subject || !form.message) { toast.error('Subject + message required'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/support/tickets', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.ok) { toast.success('Ticket created'); onCreated?.(d.ticket); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full my-8 shadow-2xl">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="font-display text-lg font-bold">New Support Ticket</div>
          <button onClick={onClose} className="size-9 rounded-full grid place-items-center hover:bg-secondary"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Subject *</div>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Category</div>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm bg-white">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Priority</div>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm bg-white">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Message *</div>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none" />
          </label>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1 flex items-center gap-1"><Paperclip className="size-3" /> Attachments (URLs)</div>
            <div className="flex gap-2">
              <input value={attInput} onChange={(e) => setAttInput(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 rounded-xl border text-sm" />
              <Button size="sm" variant="outline" onClick={() => { if (attInput.trim()) { setForm({ ...form, attachments: [...form.attachments, attInput.trim()] }); setAttInput(''); } }} className="rounded-full">Add</Button>
            </div>
            {form.attachments.length > 0 && <div className="mt-1 text-xs text-muted-foreground">{form.attachments.length} attachment(s)</div>}
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />} Create Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}

function TicketView({ ticket, onUpdated }) {
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(ticket);
  const [rating, setRating] = useState({ resolution: 0, support: 0, comment: '' });

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/support/tickets/${ticket.id}`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setCurrent(d.ticket);
    })();
  }, [ticket.id]);

  const send = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/support/tickets/${ticket.id}/reply`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: reply.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        setReply('');
        const r2 = await fetch(`/api/support/tickets/${ticket.id}`, { credentials: 'include' });
        const d2 = await r2.json();
        if (d2.ok) setCurrent(d2.ticket);
        onUpdated?.();
      } else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };
  const close = async () => {
    const r = await fetch(`/api/support/tickets/${ticket.id}/status`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'closed' }) });
    const d = await r.json();
    if (d.ok) { toast.success('Ticket closed'); onUpdated?.(); }
  };
  const rate = async () => {
    if (!rating.resolution && !rating.support) return;
    const r = await fetch(`/api/support/tickets/${ticket.id}/rate`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rating) });
    const d = await r.json();
    if (d.ok) { toast.success('Thanks for the feedback!'); onUpdated?.(); }
  };

  return (
    <div className="rounded-2xl border bg-white">
      <div className="p-4 md:p-5 border-b">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLOR[current.status] || ''}`}>{current.status?.replace('_', ' ')}</span>
          <span className="text-[10px] text-muted-foreground">{current.ticketNumber}</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-secondary">{current.category}</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-secondary">{current.priority}</span>
          {(current.status === 'open' || current.status === 'in_progress' || current.status === 'waiting') && (
            <Button size="sm" variant="ghost" onClick={close} className="rounded-full ml-auto h-7 text-rose-500">Close ticket</Button>
          )}
        </div>
        <div className="font-display text-lg font-bold mt-2">{current.subject}</div>
      </div>
      <div className="p-4 md:p-5 space-y-3 max-h-[50vh] overflow-y-auto">
        {(current.conversation || []).map((c, i) => (
          <div key={i} className={`flex ${c.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${c.from === 'user' ? 'bg-emerald2 text-white' : 'bg-secondary'}`}>
              <div className="text-[10px] font-bold uppercase mb-0.5 opacity-70">{c.from === 'user' ? c.userName || 'You' : c.adminName || 'Safar Support'}</div>
              <div className="text-sm whitespace-pre-wrap">{c.message}</div>
              <div className={`text-[10px] mt-1 ${c.from === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>{new Date(c.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
      {current.status !== 'closed' && current.status !== 'merged' && (
        <div className="p-4 border-t flex gap-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Type your reply..." className="flex-1 px-3 py-2 rounded-xl border text-sm resize-none" />
          <Button onClick={send} disabled={saving || !reply.trim()} className="rounded-full bg-emerald2 hover:bg-emerald2-deep self-end">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      )}
      {current.status === 'resolved' && !current.ratingResolution && (
        <div className="p-4 border-t bg-emerald-50/50">
          <div className="font-display font-bold text-sm mb-2">Rate this resolution</div>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-xs">Resolution:</div>
            {[1, 2, 3, 4, 5].map((i) => <button key={i} onClick={() => setRating({ ...rating, resolution: i })}><Star className={`size-4 ${i <= rating.resolution ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} /></button>)}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-xs">Support:</div>
            {[1, 2, 3, 4, 5].map((i) => <button key={i} onClick={() => setRating({ ...rating, support: i })}><Star className={`size-4 ${i <= rating.support ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} /></button>)}
          </div>
          <input value={rating.comment} onChange={(e) => setRating({ ...rating, comment: e.target.value })} placeholder="Any comments?" className="w-full mb-2 px-3 py-1.5 rounded-lg border text-sm" />
          <Button size="sm" onClick={rate} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">Submit rating</Button>
        </div>
      )}
    </div>
  );
}
