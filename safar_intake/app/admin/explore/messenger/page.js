'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Trash2, RefreshCw, MessageCircle } from 'lucide-react';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function Inner() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/explore/chat', { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setMessages(j.messages || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this message?')) return;
    try {
      const r = await fetch(`/api/admin/explore/chat/${id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Failed');
      toast.success('Deleted');
      setMessages((cur) => cur.filter((m) => m.id !== id));
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/admin/explore" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-charcoal"><ArrowLeft className="size-4" /> Explore Admin</Link>
          <span className="text-charcoal/40">/</span>
          <span className="font-display font-semibold text-charcoal">Messenger Moderation</span>
        </div>
      </div>

      <div className="container py-6 md:py-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Messenger Moderation</h1>
            <p className="text-sm text-muted-foreground mt-1">Recent 300 messages across all trip chats.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-white border text-sm font-semibold hover:bg-emerald2/5 transition"><RefreshCw className="size-4" /> Refresh</button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="size-8 animate-spin text-emerald2" /></div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-muted-foreground">No chat messages yet.</div>
        ) : (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/70 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Trip</th>
                  <th className="text-left px-4 py-3 font-semibold">Message</th>
                  <th className="text-left px-4 py-3 font-semibold">When</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-emerald-50/40">
                    <td className="px-4 py-3 font-semibold text-charcoal">{m.userName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[160px]">{m.tripId}</td>
                    <td className="px-4 py-3 max-w-md">
                      {m.text ? <div className="line-clamp-2 text-charcoal">{m.text}</div> : <span className="text-xs text-muted-foreground italic">[image]</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(m.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button onClick={() => remove(m.id)} className="p-2 rounded-lg hover:bg-rose-100 text-rose-600" title="Delete"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default function Page() { return <ProtectedRoute roles={['super_admin', 'admin']}><Inner /></ProtectedRoute>; }
