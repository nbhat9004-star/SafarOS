'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Megaphone, Send, Trash2, Users, User, Home, Shield, Calendar, Search, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const AUDIENCES = [
  { id: 'all', label: 'Everyone', Ico: Users, desc: 'All registered users' },
  { id: 'travelers', label: 'Travelers', Ico: User, desc: 'Users with traveler role' },
  { id: 'hosts', label: 'Hosts', Ico: Home, desc: 'Users with host role' },
  { id: 'admins', label: 'Admins', Ico: Shield, desc: 'Admins & super admins' },
  { id: 'selected', label: 'Selected Users', Ico: Users, desc: 'Pick specific users' },
];

function CommunicationInner() {
  const [tab, setTab] = useState('compose'); // compose | active | scheduled | expired
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'all',
    category: 'announcement',
    link: '',
    scheduledFor: '',
    expiresAt: '',
    userIds: [],
  });

  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/broadcasts?status=all', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setBroadcasts(d.broadcasts || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const searchUsers = async () => {
    if (!userSearch.trim() && !form.audience) return;
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set('q', userSearch.trim());
      const r = await fetch(`/api/admin/users/search?${params.toString()}`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setUserResults(d.users || []);
    } finally { setSearching(false); }
  };

  const addUser = (u) => {
    if (form.userIds.find((x) => x.id === u.id)) return;
    setForm((f) => ({ ...f, userIds: [...f.userIds, u] }));
  };
  const removeUser = (id) => setForm((f) => ({ ...f, userIds: f.userIds.filter((u) => u.id !== id) }));

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message are required'); return; }
    if (form.audience === 'selected' && form.userIds.length === 0) { toast.error('Pick at least one user'); return; }
    setSending(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        category: form.category,
        link: form.link.trim() || null,
        scheduledFor: form.scheduledFor || null,
        expiresAt: form.expiresAt || null,
        userIds: form.audience === 'selected' ? form.userIds.map((u) => u.id) : [],
      };
      const r = await fetch('/api/admin/broadcasts', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.ok) {
        toast.success(`Broadcast ${d.broadcast?.status || 'sent'} — ${d.broadcast?.recipientCount || 0} recipient(s)`);
        setForm({ title: '', message: '', audience: 'all', category: 'announcement', link: '', scheduledFor: '', expiresAt: '', userIds: [] });
        setTab('active');
        load();
      } else {
        toast.error(d.error || 'Failed to send');
      }
    } finally { setSending(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this broadcast and all its notifications?')) return;
    const r = await fetch(`/api/admin/broadcasts/${id}`, { method: 'DELETE', credentials: 'include' });
    const d = await r.json().catch(() => ({}));
    if (d.ok) { toast.success('Broadcast deleted'); load(); }
    else toast.error('Failed to delete');
  };

  const now = Date.now();
  const partitioned = useMemo(() => {
    const active = [], scheduled = [], expired = [];
    for (const b of broadcasts) {
      const sched = b.scheduledFor ? new Date(b.scheduledFor).getTime() : null;
      const exp = b.expiresAt ? new Date(b.expiresAt).getTime() : null;
      if (sched && sched > now) scheduled.push(b);
      else if (exp && exp <= now) expired.push(b);
      else active.push(b);
    }
    return { active, scheduled, expired };
  }, [broadcasts, now]);

  const currentList = tab === 'scheduled' ? partitioned.scheduled
                    : tab === 'expired' ? partitioned.expired
                    : tab === 'active' ? partitioned.active
                    : [];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Admin
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-2">
          <Megaphone className="size-8 text-emerald2" /> Communication Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Broadcast announcements to users. Every broadcast is logged.</p>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-6 -mx-4 px-4 md:mx-0 md:px-0">
          {[
            { id: 'compose', label: '✍️ Compose' },
            { id: 'active', label: `📣 Active (${partitioned.active.length})` },
            { id: 'scheduled', label: `⏰ Scheduled (${partitioned.scheduled.length})` },
            { id: 'expired', label: `📁 Expired (${partitioned.expired.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition ${tab === t.id ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}
            >{t.label}</button>
          ))}
        </div>

        {tab === 'compose' && (
          <div className="mt-4 grid lg:grid-cols-[1fr_400px] gap-4">
            <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Audience *</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {AUDIENCES.map((a) => {
                    const active = form.audience === a.id;
                    const Ico = a.Ico;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setForm({ ...form, audience: a.id })}
                        className={`p-3 rounded-xl border text-left transition ${active ? 'border-emerald2 bg-emerald-50/60 ring-2 ring-emerald2/20' : 'bg-white hover:bg-secondary'}`}
                      >
                        <Ico className="size-4 text-emerald2 mb-1" />
                        <div className="font-semibold text-xs">{a.label}</div>
                        <div className="text-[10px] text-muted-foreground line-clamp-2">{a.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.audience === 'selected' && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Selected Users ({form.userIds.length})</div>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchUsers()} placeholder="Search by name or email…" className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm" />
                    </div>
                    <Button onClick={searchUsers} disabled={searching} variant="outline" className="rounded-full">
                      {searching ? <Loader2 className="size-4 animate-spin" /> : 'Search'}
                    </Button>
                  </div>
                  {form.userIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl border bg-secondary/30">
                      {form.userIds.map((u) => (
                        <span key={u.id} className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-emerald2 text-white text-xs">
                          {u.name || u.email}
                          <button onClick={() => removeUser(u.id)} className="hover:bg-white/20 rounded-full p-0.5"><X className="size-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  {userResults.length > 0 && (
                    <div className="max-h-56 overflow-y-auto border rounded-xl divide-y">
                      {userResults.map((u) => {
                        const already = !!form.userIds.find((x) => x.id === u.id);
                        return (
                          <button key={u.id} onClick={() => addUser(u)} disabled={already} className="w-full text-left p-2.5 hover:bg-secondary/40 flex items-center justify-between gap-2 disabled:opacity-50">
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{u.name || '(no name)'}</div>
                              <div className="text-xs text-muted-foreground truncate">{u.email} · {u.role || 'traveler'}</div>
                            </div>
                            {already ? <CheckCircle2 className="size-4 text-emerald2 shrink-0" /> : <span className="text-[10px] text-emerald2 font-bold">ADD</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Category</div>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm">
                    <option value="announcement">Announcement</option>
                    <option value="promotion">Promotion</option>
                    <option value="system">System Update</option>
                    <option value="policy">Policy Change</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Optional Link</div>
                  <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/explore or https://…" className="w-full px-4 py-2.5 rounded-xl border text-sm" />
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Title *</div>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Monsoon Sale is live!" className="w-full px-4 py-2.5 rounded-xl border text-sm" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Message *</div>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Compose your announcement…" className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none" />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Schedule for (optional)</div>
                  <input type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border text-sm" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Expires at (optional)</div>
                  <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border text-sm" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={send} disabled={sending} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                  {sending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                  {form.scheduledFor ? 'Schedule Broadcast' : 'Send Now'}
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border bg-white p-5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Preview</div>
              <div className="rounded-xl border bg-emerald-50/40 p-4">
                <div className="flex items-start gap-2">
                  <div className="size-10 rounded-xl bg-emerald2 text-white grid place-items-center text-lg shrink-0">📢</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{form.title || 'Your title appears here'}</div>
                    <div className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{form.message || 'Message body preview…'}</div>
                    <div className="text-[10px] text-muted-foreground mt-2">
                      To: <span className="font-semibold">{AUDIENCES.find((a) => a.id === form.audience)?.label}</span>
                      {form.audience === 'selected' && ` · ${form.userIds.length} user${form.userIds.length === 1 ? '' : 's'}`}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-[11px] text-muted-foreground">
                Every broadcast is logged in the audit trail with actor, recipient count, and timestamp.
              </div>
            </div>
          </div>
        )}

        {tab !== 'compose' && (
          <div className="mt-4">
            {loading ? (
              <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
            ) : currentList.length === 0 ? (
              <div className="p-12 border rounded-2xl bg-white text-center">
                <Megaphone className="size-8 mx-auto text-emerald2" />
                <div className="font-display text-lg font-bold mt-3">No {tab} broadcasts</div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentList.map((b) => (
                  <div key={b.id} className="rounded-2xl border bg-white p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      <div className="size-10 rounded-xl bg-emerald2 text-white grid place-items-center text-lg shrink-0">📢</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold">{b.title}</div>
                          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border">{b.audience}</span>
                          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border">{b.category}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{b.message}</div>
                        <div className="text-[11px] text-muted-foreground mt-2 flex flex-wrap gap-3">
                          <span>by {b.createdByName}</span>
                          <span>· {new Date(b.createdAt).toLocaleString()}</span>
                          {b.recipientCount > 0 && <span>· {b.recipientCount} recipient{b.recipientCount === 1 ? '' : 's'}</span>}
                          {b.scheduledFor && <span>· Scheduled: {new Date(b.scheduledFor).toLocaleString()}</span>}
                          {b.expiresAt && <span>· Expires: {new Date(b.expiresAt).toLocaleString()}</span>}
                        </div>
                      </div>
                      <button onClick={() => del(b.id)} className="text-rose-500 hover:text-rose-700 shrink-0" aria-label="Delete">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin', 'super_admin']}><CommunicationInner /></ProtectedRoute>;
}
