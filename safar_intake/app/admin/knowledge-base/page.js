'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Plus, Loader2, Save, Trash2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['article', 'faq', 'guide', 'policy', 'host_guide', 'traveler_guide'];
const AUDIENCES = ['all', 'traveler', 'host', 'admin'];

function Inner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/kb/articles', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setItems(d.articles || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.title || !editing.body) { toast.error('Title + body required'); return; }
    const isNew = !editing.id;
    const r = await fetch(isNew ? '/api/admin/kb/articles' : `/api/admin/kb/articles/${editing.id}`, {
      method: isNew ? 'POST' : 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing),
    });
    const d = await r.json();
    if (d.ok) { toast.success('Saved'); setEditing(null); load(); }
    else toast.error(d.error || 'Failed');
  };
  const del = async (id) => {
    if (!confirm('Delete article?')) return;
    const r = await fetch(`/api/admin/kb/articles/${id}`, { method: 'DELETE', credentials: 'include' });
    const d = await r.json();
    if (d.ok) { toast.success('Deleted'); load(); }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Admin
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-2"><BookOpen className="size-7 text-emerald2" /> Knowledge Base</h1>
          <Button onClick={() => setEditing({ title: '', body: '', excerpt: '', category: 'article', audience: 'all', tags: [], images: [], videos: [], status: 'draft' })} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
            <Plus className="size-4 mr-2" /> New Article
          </Button>
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : items.length === 0 ? (
          <div className="mt-8 p-12 border rounded-2xl bg-white text-center">
            <BookOpen className="size-8 mx-auto text-emerald2" />
            <div className="font-display text-lg font-bold mt-3">No articles yet</div>
            <p className="text-sm text-muted-foreground mt-1">Create your first article to help users.</p>
          </div>
        ) : (
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-white p-4">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${a.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>{a.status}</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-secondary">{a.category?.replace('_', ' ')}</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-secondary">{a.audience}</span>
                </div>
                <div className="font-semibold mt-2">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Eye className="size-3" /> {a.views || 0} views</div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditing(a)} className="rounded-full h-7">Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => del(a.id)} className="rounded-full h-7 text-rose-500"><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl">
              <div className="p-5 border-b flex items-center justify-between">
                <div className="font-display text-lg font-bold">{editing.id ? 'Edit Article' : 'New Article'}</div>
                <button onClick={() => setEditing(null)} className="size-9 rounded-full grid place-items-center hover:bg-secondary"><X className="size-4" /></button>
              </div>
              <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Article title" className="w-full px-4 py-2.5 rounded-xl border text-sm" />
                <input value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} placeholder="Short excerpt (optional)" className="w-full px-4 py-2.5 rounded-xl border text-sm" />
                <div className="grid grid-cols-3 gap-2">
                  <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                  <select value={editing.audience} onChange={(e) => setEditing({ ...editing, audience: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white">
                    {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={12} placeholder="Article body (plain text or Markdown-lite)" className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none font-mono" />
                <input value={(editing.tags || []).join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Tags (comma separated)" className="w-full px-4 py-2.5 rounded-xl border text-sm" />
                <input value={(editing.images || []).join(', ')} onChange={(e) => setEditing({ ...editing, images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Image URLs (comma separated)" className="w-full px-4 py-2.5 rounded-xl border text-sm" />
                <input value={(editing.videos || []).join(', ')} onChange={(e) => setEditing({ ...editing, videos: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Video URLs (comma separated)" className="w-full px-4 py-2.5 rounded-xl border text-sm" />
              </div>
              <div className="p-5 border-t flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={save} className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Save className="size-4 mr-2" /> Save</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin', 'super_admin']}><Inner /></ProtectedRoute>;
}
