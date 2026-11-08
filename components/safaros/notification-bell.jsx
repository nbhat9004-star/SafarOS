'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Inbox, X, Trash2, ArrowUpRight, RefreshCw } from 'lucide-react';

async function request(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to complete request');
  return data;
}

const timeLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const priorityStyle = {
  critical: 'bg-rose-50 text-rose-700',
  high: 'bg-amber-50 text-amber-700',
  normal: 'bg-indigo-50 text-indigo-700',
  low: 'bg-slate-100 text-slate-600',
};

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await request('/api/notifications?limit=30');
      setItems(data.notifications || []);
      setUnread(Number(data.unreadCount || 0));
      setError('');
    } catch (e) {
      if (!quiet) setError(e.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const timer = window.setInterval(() => load(true), 45000);
    return () => window.clearInterval(timer);
  }, [load]);

  const markRead = async (item) => {
    if (!item.readAt) {
      try {
        await request('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id: item.id }) });
        setItems((old) => old.map((n) => n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n));
        setUnread((n) => Math.max(0, n - 1));
      } catch (e) { setError(e.message); }
    }
    if (item.actionUrl) window.location.assign(item.actionUrl);
  };

  const markAll = async () => {
    try {
      await request('/api/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) });
      setItems((old) => old.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      setUnread(0);
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    try {
      await request('/api/notifications?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const item = items.find((n) => n.id === id);
      setItems((old) => old.filter((n) => n.id !== id));
      if (item && !item.readAt) setUnread((n) => Math.max(0, n - 1));
    } catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="relative">
        <button type="button" onClick={() => { setOpen((v) => !v); if (!open) load(); }}
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          aria-expanded={open}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute -right-1 -top-1 flex min-w-[17px] h-[17px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white ring-2 ring-background">{unread > 99 ? '99+' : unread}</span>}
        </button>
        {open && <button aria-label="Close notifications" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />}
        {open && (
          <div className="absolute right-0 z-50 mt-2 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div><div className="text-sm font-semibold">Notifications</div><div className="text-xs text-muted-foreground">{unread} unread</div></div>
              <div className="flex items-center gap-1">
                {unread > 0 && <button onClick={markAll} className="rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">Mark all read</button>}
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {loading && items.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Loading notifications…</div>
                : error && items.length === 0 ? <div className="p-6 text-center text-sm text-rose-600">{error}</div>
                : items.length === 0 ? <div className="p-8 text-center"><Inbox className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-2 text-sm font-medium">You're all caught up</p><p className="mt-1 text-xs text-muted-foreground">New updates will appear here.</p></div>
                : items.slice(0, 12).map((item) => (
                  <div key={item.id} className={`group flex gap-3 border-b border-border/70 px-4 py-3 transition hover:bg-muted/40 ${item.readAt ? '' : 'bg-indigo-50/40'}`}>
                    <button onClick={() => markRead(item)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${item.readAt ? 'bg-transparent' : 'bg-indigo-600'}`} /><span className="truncate text-sm font-semibold">{item.title}</span></div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.message}</p>
                      <div className="mt-2 flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${priorityStyle[item.priority] || priorityStyle.normal}`}>{item.category || 'update'}</span><span className="text-[10px] text-muted-foreground">{timeLabel(item.createdAt)}</span>{item.actionUrl && <ArrowUpRight className="h-3 w-3 text-indigo-600" />}</div>
                    </button>
                    <button onClick={() => remove(item.id)} aria-label="Delete notification" className="self-start rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
            </div>
            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5">
              <span className="text-[11px] text-muted-foreground">Updates every 45 seconds</span>
              <button onClick={() => load()} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"><RefreshCw className="h-3 w-3" /> Refresh</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
