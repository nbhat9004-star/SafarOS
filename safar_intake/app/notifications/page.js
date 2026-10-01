'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Bell, CheckCheck, Trash2, ArrowLeft, Filter } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

// Category icon + colour map
const CATEGORY_META = {
  booking: { emoji: '📅', label: 'Booking', color: 'text-blue-600 bg-blue-50' },
  payment: { emoji: '💳', label: 'Payment', color: 'text-emerald-600 bg-emerald-50' },
  refund: { emoji: '↩️', label: 'Refund', color: 'text-rose-600 bg-rose-50' },
  wallet: { emoji: '👛', label: 'Wallet', color: 'text-amber-600 bg-amber-50' },
  credits: { emoji: '⭐', label: 'Safar Credits', color: 'text-emerald-600 bg-emerald-50' },
  referral: { emoji: '🎁', label: 'Referral', color: 'text-purple-600 bg-purple-50' },
  payout: { emoji: '🏦', label: 'Payout', color: 'text-emerald-700 bg-emerald-50' },
  promotion: { emoji: '🎉', label: 'Promotion', color: 'text-pink-600 bg-pink-50' },
  system: { emoji: '📢', label: 'Announcement', color: 'text-slate-700 bg-slate-100' },
  announcement: { emoji: '📢', label: 'Announcement', color: 'text-slate-700 bg-slate-100' },
  message: { emoji: '💬', label: 'Message', color: 'text-emerald-600 bg-emerald-50' },
};

function getCategoryKey(n) {
  if (n.category) return n.category;
  const t = String(n.type || '');
  if (t.includes('message')) return 'message';
  if (t.includes('booking')) return 'booking';
  if (t.includes('refund')) return 'refund';
  if (t.includes('payout')) return 'payout';
  if (t.includes('wallet')) return 'wallet';
  if (t.includes('credit')) return 'credits';
  if (t.includes('referral')) return 'referral';
  if (t.includes('promotion') || t.includes('promo')) return 'promotion';
  if (t.includes('announcement') || t.includes('system')) return 'system';
  return 'system';
}

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}

function NotificationsInner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('');
  const [showRead, setShowRead] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/notifications', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setItems(d.notifications || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (cat && getCategoryKey(n) !== cat) return false;
      if (!showRead && n.read) return false;
      return true;
    });
  }, [items, cat, showRead]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (id) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' }).catch(() => {});
    setItems((xs) => xs.map((n) => n.id === id ? { ...n, read: true } : n));
  };
  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' }).catch(() => {});
    setItems((xs) => xs.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };
  const del = async (id) => {
    const r = await fetch(`/api/notifications/${id}`, { method: 'DELETE', credentials: 'include' });
    const d = await r.json().catch(() => ({}));
    if (d.ok) {
      setItems((xs) => xs.filter((n) => n.id !== id));
    } else {
      toast.error('Failed to delete');
    }
  };
  const clearRead = async () => {
    if (!confirm('Delete all read notifications?')) return;
    const r = await fetch('/api/notifications/delete-all-read', { method: 'POST', credentials: 'include' });
    const d = await r.json().catch(() => ({}));
    if (d.ok) {
      setItems((xs) => xs.filter((n) => !n.read));
      toast.success(`Deleted ${d.deleted || 0} read notifications`);
    }
  };

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((n) => set.add(getCategoryKey(n)));
    return Array.from(set);
  }, [items]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mt-2">
          <div>
            <div className="font-display text-3xl md:text-4xl font-bold flex items-center gap-2">
              <Bell className="size-7 text-emerald2" /> Notifications
            </div>
            <p className="text-sm text-muted-foreground mt-1">{unread} unread of {items.length}</p>
          </div>
          <div className="flex gap-2">
            {unread > 0 && (
              <Button onClick={markAllRead} variant="outline" className="rounded-full">
                <CheckCheck className="size-4 mr-2" /> Mark all as read
              </Button>
            )}
            <Button onClick={clearRead} variant="ghost" className="rounded-full text-rose-600 hover:bg-rose-50">
              <Trash2 className="size-4 mr-2" /> Clear read
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 rounded-2xl border bg-white p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="size-4" /> Filter
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${!cat ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}
            >All</button>
            {categories.map((c) => {
              const meta = CATEGORY_META[c] || CATEGORY_META.system;
              const active = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(active ? '' : c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${active ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}
                >
                  <span className="mr-1">{meta.emoji}</span>{meta.label}
                </button>
              );
            })}
          </div>
          <label className="ml-auto flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={showRead} onChange={(e) => setShowRead(e.target.checked)} className="size-4 accent-emerald-600" />
            <span className="text-muted-foreground">Show read</span>
          </label>
        </div>

        {/* List */}
        <div className="mt-5">
          {loading ? (
            <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 border rounded-2xl bg-white text-center">
              <Bell className="size-8 mx-auto text-emerald2" />
              <div className="font-display text-lg font-bold mt-3">No notifications</div>
              <p className="text-sm text-muted-foreground mt-1">You're all caught up.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => {
                const meta = CATEGORY_META[getCategoryKey(n)] || CATEGORY_META.system;
                const Wrap = n.link ? Link : 'div';
                const wrapProps = n.link ? { href: n.link, onClick: () => !n.read && markRead(n.id) } : {};
                return (
                  <div key={n.id} className={`rounded-2xl border p-4 flex items-start gap-3 hover:shadow-sm transition ${n.read ? 'bg-white' : 'bg-emerald-50/40 border-emerald-200'}`}>
                    <div className={`size-10 rounded-xl grid place-items-center text-lg shrink-0 ${meta.color}`}>{meta.emoji}</div>
                    <Wrap {...wrapProps} className="flex-1 min-w-0 block">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm">{n.title}</div>
                        <div className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</div>
                      </div>
                      {n.body && <div className="text-sm text-muted-foreground mt-0.5">{n.body}</div>}
                    </Wrap>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="text-[10px] font-semibold text-emerald2 hover:underline">Mark read</button>
                      )}
                      <button onClick={() => del(n.id)} className="text-rose-500 hover:text-rose-700" aria-label="Delete">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['traveler', 'host', 'admin', 'super_admin']}><NotificationsInner /></ProtectedRoute>;
}
