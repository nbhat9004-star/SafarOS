'use client';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, MessageCircle, Filter } from 'lucide-react';
import ChatThread from '@/components/safar/ChatThread';

/**
 * MODULE 13 — Shared Conversations panel with responsive split view.
 * Props:
 *   role: 'traveler' | 'host' — used for filter defaults + labels
 */
export default function ConversationsPanel({ role = 'traveler' }) {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetch('/api/me/conversations', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setConvos(d.conversations || []);
    } finally { if (!silent) setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setInterval(() => load({ silent: true }), 20000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return convos.filter((c) => {
      if (status && c.bookingStatus && c.bookingStatus !== status) return false;
      if (!needle) return true;
      return (c.listingTitle || '').toLowerCase().includes(needle)
        || (c.lastMessagePreview || '').toLowerCase().includes(needle)
        || (c.bookingId || '').toLowerCase().includes(needle);
    });
  }, [convos, q, status]);

  const totalUnread = convos.reduce((s, c) => s + (c.unreadCount || 0), 0);

  return (
    <div className="grid md:grid-cols-[360px_1fr] gap-0 md:gap-4 rounded-2xl md:border overflow-hidden bg-transparent md:bg-white">
      {/* Left: Conversations list */}
      <aside className={`border-r ${active ? 'hidden md:block' : 'block'}`}>
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-lg font-bold flex items-center gap-2">
              <MessageCircle className="size-5 text-emerald2" />
              {role === 'host' ? 'Inbox' : 'Messages'}
            </div>
            {totalUnread > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald2 text-white">{totalUnread} unread</span>
            )}
          </div>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations…" className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <Filter className="size-3.5 text-muted-foreground" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-2 py-1 rounded-lg border text-xs bg-white">
              <option value="">All bookings</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {convos.length === 0 ? 'No conversations yet.' : 'No matches.'}
          </div>
        ) : (
          <div className="divide-y max-h-[calc(100vh-12rem)] overflow-y-auto">
            {filtered.map((c) => {
              const isActive = active === c.bookingId;
              return (
                <button
                  key={c.bookingId}
                  onClick={() => setActive(c.bookingId)}
                  className={`w-full text-left p-3 flex items-start gap-3 hover:bg-secondary/40 transition ${isActive ? 'bg-emerald-50/60' : ''}`}
                >
                  {c.listingImage ? (
                    <img src={c.listingImage} alt="" className="size-11 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="size-11 rounded-xl bg-secondary grid place-items-center shrink-0">
                      <MessageCircle className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{c.listingTitle || 'Booking chat'}</div>
                      <div className="text-[10px] text-muted-foreground shrink-0">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessagePreview || 'No messages yet'}</div>
                    <div className="mt-1 flex items-center gap-2">
                      {c.bookingStatus && (
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full border bg-white text-muted-foreground">{c.bookingStatus}</span>
                      )}
                      {c.unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald2 text-white">{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* Right: Thread */}
      <section className={`${active ? 'block' : 'hidden md:block'}`}>
        {active ? (
          <ChatThread bookingId={active} onBack={() => { setActive(null); load({ silent: true }); }} />
        ) : (
          <div className="min-h-[60vh] grid place-items-center text-center p-8">
            <div>
              <div className="text-5xl">💬</div>
              <div className="font-display text-lg font-bold mt-3">Select a conversation</div>
              <div className="text-sm text-muted-foreground mt-1">Pick a booking from the list to view messages.</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
