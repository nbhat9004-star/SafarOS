'use client';

// SafarOS Platform Admin — Team (staff & roles), Usage Analytics and Blog CMS.
// All authorization is enforced server-side (/api/platform/*); the UI only mirrors it.

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Search, Plus, Pencil, Trash2, Eye, Send, Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Link2, Image as ImageIcon, Quote, Upload, ExternalLink, Loader2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { renderBlogMarkdown, blogSlugify } from '@/lib/blog';

async function api(path, options = {}) {
  const res = await fetch(`/api/platform${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
const fdt = (iso) => { if (!iso) return '—'; try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } };
const fdate = (iso) => { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; } };
const ROLE_LABELS = { super_admin: 'Super Admin', platform_admin: 'Platform Admin', support_admin: 'Support Admin', finance_admin: 'Finance Admin', blog_editor: 'Blog Editor' };
const ROLE_DESC = { platform_admin: 'Agencies, users, analytics, audit logs and blog', support_admin: 'Read-only agencies and users for support', finance_admin: 'Subscriptions, billing and plan analytics', blog_editor: 'Blog content only' };
const Empty = ({ children }) => <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">{children}</CardContent></Card>;
const Skeleton = () => <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;

// ============================ TEAM / STAFF ============================
export function StaffView({ admin }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null); // null | { mode, ... }
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setData(await api('/staff')); } catch (e) { toast.error(e.message); setData({ staff: [], assignableRoles: [] }); } }, []);
  useEffect(() => { load(); }, [load]);
  const submit = async () => {
    setBusy(true);
    try {
      if (form.mode === 'create') { const r = await api('/staff', { method: 'POST', body: JSON.stringify({ name: form.name, email: form.email, role: form.role }) }); toast.success(r.message); }
      else { await api(`/staff/${form.id}`, { method: 'PUT', body: JSON.stringify({ name: form.name, role: form.role }) }); toast.success('Staff account updated'); }
      setForm(null); load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const setStatus = async (s, status) => {
    if (status === 'suspended' && !window.confirm(`Deactivate ${s.name}? They will lose access immediately.`)) return;
    try { await api(`/staff/${s.id}`, { method: 'PUT', body: JSON.stringify({ status }) }); toast.success(status === 'active' ? 'Account reactivated' : 'Account deactivated'); load(); } catch (e) { toast.error(e.message); }
  };
  const sendLink = async (s) => { try { const r = await api(`/staff/${s.id}/setup-link`, { method: 'POST' }); toast[r.emailConfigured ? 'success' : 'warning'](r.message); } catch (e) { toast.error(e.message); } };
  if (!data) return <Skeleton />;
  const roles = data.assignableRoles || [];
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-2xl text-sm text-muted-foreground">Internal SafarOS team accounts. There is exactly one Super Admin; it cannot be created, assigned, demoted or deactivated here. New members receive a single-use password setup link by email.</p>
      <Button size="sm" onClick={() => setForm({ mode: 'create', name: '', email: '', role: roles[0] || 'support_admin' })}><Plus className="mr-1 h-4 w-4" />Add team member</Button>
    </div>
    {!data.emailConfigured && <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">Email is not configured, so setup links cannot be delivered yet. Configure email in Platform Settings first.</div>}
    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last login</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>{(data.staff || []).map((s) => { const isSA = s.role === 'super_admin'; return (<TableRow key={s.id}>
        <TableCell className="font-medium">{s.name}{s.id === admin?.id && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}</TableCell>
        <TableCell className="text-sm">{s.email}</TableCell>
        <TableCell><Badge variant="outline" className={isSA ? 'border-violet-200 bg-violet-50 text-violet-700' : ''}>{ROLE_LABELS[s.role] || s.role}</Badge></TableCell>
        <TableCell><Badge variant="outline" className={s.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}>{s.status === 'active' ? (s.passwordSet ? 'Active' : 'Invited') : 'Deactivated'}</Badge></TableCell>
        <TableCell className="text-xs text-muted-foreground">{fdt(s.lastLoginAt)}</TableCell>
        <TableCell className="text-right">{isSA ? <span className="text-xs text-muted-foreground">Protected</span> : (<div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" title="Edit" onClick={() => setForm({ mode: 'edit', id: s.id, name: s.name, email: s.email, role: s.role })}><Pencil className="h-4 w-4" /></Button>
          {s.status === 'active' && <Button size="sm" variant="ghost" title="Send password setup link" onClick={() => sendLink(s)}><Send className="h-4 w-4" /></Button>}
          <Button size="sm" variant="outline" onClick={() => setStatus(s, s.status === 'active' ? 'suspended' : 'active')}>{s.status === 'active' ? 'Deactivate' : 'Reactivate'}</Button>
        </div>)}</TableCell>
      </TableRow>); })}</TableBody></Table></CardContent></Card>
    {form && (<Dialog open onOpenChange={(o) => !o && setForm(null)}><DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{form.mode === 'create' ? 'Add team member' : 'Edit team member'}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1"><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} disabled={form.mode === 'edit'} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1"><Label>Role</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">{ROLE_DESC[form.role]}</p></div>
      </div>
      <DialogFooter><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={submit} disabled={busy || !form.name.trim() || (form.mode === 'create' && !form.email.trim())}>{busy ? 'Saving…' : form.mode === 'create' ? 'Create & send setup link' : 'Save changes'}</Button></DialogFooter>
    </DialogContent></Dialog>)}
  </div>);
}

// ============================ USAGE ANALYTICS ============================
const IND = {
  trial_ending_soon: ['Trial ending soon', 'border-amber-200 bg-amber-50 text-amber-800'],
  trial_expired: ['Trial ended', 'border-rose-200 bg-rose-50 text-rose-700'],
  high_engagement: ['High engagement', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
  low_engagement: ['Low engagement', 'border-slate-200 bg-slate-50 text-slate-700'],
  inactive: ['Inactive (7d)', 'border-slate-300 bg-slate-100 text-slate-600'],
  upgrade_opportunity: ['Possible upgrade', 'border-violet-200 bg-violet-50 text-violet-700'],
};
const Kpi = ({ label, value, sub }) => (<Card><CardContent className="p-4"><div className="text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-muted-foreground">{label}</div>{sub && <div className="mt-1 truncate text-[11px] text-muted-foreground">{sub}</div>}</CardContent></Card>);

export function UsageAnalyticsView() {
  const [days, setDays] = useState('30'); const [agencyId, setAgencyId] = useState('all'); const [module, setModule] = useState('all');
  const [search, setSearch] = useState(''); const [d, setD] = useState(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const q = new URLSearchParams({ days }); if (agencyId !== 'all') q.set('agencyId', agencyId); if (module !== 'all') q.set('module', module); setD(await api(`/usage?${q}`)); }
    catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }, [days, agencyId, module]);
  useEffect(() => { load(); }, [load]);
  if (!d) return <Skeleton />;
  const rows = (d.agencies || []).filter((r) => !search || `${r.name} ${r.slug}`.toLowerCase().includes(search.toLowerCase()));
  const noData = !d.kpis.totalEvents;
  const compare = (d.agencies || []).filter((r) => r.activityCount > 0).slice(0, 10).map((r) => ({ name: r.name.length > 16 ? `${r.name.slice(0, 15)}…` : r.name, count: r.activityCount }));
  const low = (d.agencies || []).filter((r) => r.indicators.some((i) => ['inactive', 'low_engagement', 'trial_ending_soon', 'upgrade_opportunity'].includes(i)));
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <Select value={days} onValueChange={setDays}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem></SelectContent></Select>
      <Select value={agencyId} onValueChange={setAgencyId}><SelectTrigger className="w-52"><SelectValue placeholder="All agencies" /></SelectTrigger><SelectContent><SelectItem value="all">All agencies</SelectItem>{(d.filters?.agencies || []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
      <Select value={module} onValueChange={setModule}><SelectTrigger className="w-44"><SelectValue placeholder="All modules" /></SelectTrigger><SelectContent><SelectItem value="all">All modules</SelectItem>{(d.filters?.modules || []).map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent></Select>
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Kpi label="Registered agencies" value={d.kpis.totalAgencies} />
      <Kpi label="Active today (UTC)" value={d.kpis.activeToday} />
      <Kpi label="Active in last 7 days" value={d.kpis.active7d} />
      <Kpi label="No recent activity (7d)" value={d.kpis.noRecentActivity} />
      <Kpi label="Most-used module" value={<span className="capitalize">{d.topModules[0]?.module || '—'}</span>} sub={d.topModules.slice(1, 4).map((m) => m.module).join(' · ')} />
    </div>
    {noData ? <Empty>No agency usage has been recorded for this period yet. Usage is recorded from real activity (logins, dashboard sessions and create/update/delete actions) going forward — no historical data is estimated.</Empty> : (<>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Daily usage ({d.range.days} days)</CardTitle></CardHeader><CardContent className="h-56"><ResponsiveContainer><LineChart data={d.daily}><CartesianGrid strokeDasharray="3 3" stroke="#eef" /><XAxis dataKey="day" tickFormatter={(v) => v.slice(5)} fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="count" name="Actions" stroke="#7c3aed" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="agencies" name="Active agencies" stroke="#0ea5e9" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Hourly activity (UTC)</CardTitle></CardHeader><CardContent className="h-56"><ResponsiveContainer><BarChart data={d.hourly}><CartesianGrid strokeDasharray="3 3" stroke="#eef" /><XAxis dataKey="hour" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Actions" fill="#7c3aed" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Most-used modules</CardTitle></CardHeader><CardContent className="h-56"><ResponsiveContainer><BarChart data={d.topModules.slice(0, 10)} layout="vertical" margin={{ left: 20 }}><XAxis type="number" fontSize={11} allowDecimals={false} /><YAxis type="category" dataKey="module" fontSize={11} width={90} /><Tooltip /><Bar dataKey="count" name="Actions" fill="#0ea5e9" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Agency activity comparison (top 10)</CardTitle></CardHeader><CardContent className="h-56"><ResponsiveContainer><BarChart data={compare}><CartesianGrid strokeDasharray="3 3" stroke="#eef" /><XAxis dataKey="name" fontSize={10} interval={0} angle={-20} textAnchor="end" height={50} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Actions" fill="#10b981" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      </div>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Recent agency activity</CardTitle></CardHeader><CardContent className="space-y-1">{(d.recent || []).map((r, i) => <div key={i} className="flex justify-between text-sm"><span><b>{r.agencyName}</b> · <span className="capitalize text-muted-foreground">{r.module}</span></span><span className="text-xs text-muted-foreground">{fdt(r.at)}</span></div>)}</CardContent></Card>
    </>)}
    {low.length > 0 && <Card className="border-violet-200"><CardHeader className="pb-2"><CardTitle className="text-sm">Engagement & upgrade signals <span className="font-normal text-muted-foreground">— recommendations only, based on plan dates and recorded usage</span></CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{low.slice(0, 30).map((r) => <span key={r.agencyId} className="rounded-md border px-2 py-1 text-xs"><b>{r.name}</b> · {r.indicators.map((i) => IND[i]?.[0]).filter(Boolean).join(', ')}</span>)}</CardContent></Card>}
    <div className="relative w-72"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search agency…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Agency</TableHead><TableHead>Status</TableHead><TableHead>Plan / trial</TableHead><TableHead>Last activity</TableHead><TableHead className="text-right">Actions</TableHead><TableHead className="text-right">Active days</TableHead><TableHead>Top modules</TableHead><TableHead>Signals</TableHead></TableRow></TableHeader>
      <TableBody>{rows.length === 0 ? <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No agencies match.</TableCell></TableRow> : rows.map((r) => (<TableRow key={r.agencyId}>
        <TableCell className="font-medium">{r.name}</TableCell>
        <TableCell className="text-xs capitalize">{r.status}</TableCell>
        <TableCell className="text-xs"><span className="capitalize">{r.plan || '—'}</span>{r.subscriptionStatus && <span className="text-muted-foreground"> · {r.subscriptionStatus}</span>}{r.trialEndDate && <div className="text-muted-foreground">ends {fdate(r.trialEndDate)}</div>}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{fdt(r.lastActivity)}</TableCell>
        <TableCell className="text-right">{r.activityCount}</TableCell>
        <TableCell className="text-right">{r.activeDays}</TableCell>
        <TableCell className="text-xs capitalize">{r.topModules.join(', ') || '—'}</TableCell>
        <TableCell><div className="flex flex-wrap gap-1">{r.indicators.map((i) => IND[i] && <Badge key={i} variant="outline" className={`text-[10px] ${IND[i][1]}`}>{IND[i][0]}</Badge>)}</div></TableCell>
      </TableRow>))}</TableBody></Table></CardContent></Card>
    {d.truncated && <p className="text-xs text-amber-700">Large volume: results were capped for performance.</p>}
  </div>);
}

// ============================ BLOG CMS ============================
const EMPTY_POST = { title: '', slug: '', excerpt: '', content: '', featuredImage: '', featuredImageAlt: '', author: '', category: '', tags: '', status: 'draft', publishedAt: '', seoTitle: '', metaDescription: '', ogImage: '' };

function fileToBase64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(file); }); }

function BlogEditor({ initial, onClose, onSaved }) {
  const [f, setF] = useState(() => ({ ...EMPTY_POST, ...initial, tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''), publishedAt: initial.publishedAt ? String(initial.publishedAt).slice(0, 10) : '' }));
  const [tab, setTab] = useState('write'); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const ta = useRef(null); const fileRef = useRef(null); const inlineFileRef = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v, ...(k === 'title' && !slugTouched ? { slug: blogSlugify(v) } : {}) }));
  const wrap = (before, after = '', placeholder = 'text') => {
    const el = ta.current; if (!el) return;
    const s = el.selectionStart; const e = el.selectionEnd; const sel = f.content.slice(s, e) || placeholder;
    const next = f.content.slice(0, s) + before + sel + after + f.content.slice(e);
    setF((p) => ({ ...p, content: next }));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); }, 0);
  };
  const linePrefix = (prefix) => wrap(`\n${prefix}`, '', 'item');
  const upload = async (file, onUrl) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { toast.error('Use a PNG, JPEG, WebP or GIF image'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be 2 MB or smaller'); return; }
    setUploading(true);
    try { const data = await fileToBase64(file); const r = await api('/blog/media', { method: 'POST', body: JSON.stringify({ mimeType: file.type, data }) }); onUrl(r.url); toast.success('Image uploaded'); }
    catch (e) { toast.error(e.message); } finally { setUploading(false); }
  };
  const save = async (status) => {
    if (!f.title.trim()) { toast.error('Title is required'); return; }
    setBusy(true);
    try {
      const payload = { ...f, status: status || f.status, publishedAt: f.publishedAt || undefined };
      const r = initial.id ? await api(`/blog/${initial.id}`, { method: 'PUT', body: JSON.stringify(payload) }) : await api('/blog', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(payload.status === 'published' ? 'Post published' : 'Draft saved'); onSaved(r.post);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const Tool = ({ icon: I, title, onClick }) => <button type="button" title={title} onClick={onClick} className="rounded p-1.5 text-slate-600 hover:bg-slate-100"><I className="h-4 w-4" /></button>;
  return (<Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
    <DialogHeader><DialogTitle>{initial.id ? 'Edit post' : 'New blog post'}</DialogTitle></DialogHeader>
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <Input className="h-12 text-lg font-semibold" placeholder="Post title" value={f.title} onChange={(e) => set('title', e.target.value)} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>/blog/</span><Input className="h-8 text-xs" value={f.slug} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: blogSlugify(e.target.value) }); }} placeholder="url-slug" /></div>
        <div className="space-y-1"><Label>Excerpt</Label><Textarea rows={2} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="A short summary shown on the blog list" /></div>
        <div className="rounded-lg border">
          <div className="flex flex-wrap items-center gap-0.5 border-b bg-slate-50 px-2 py-1">
            <button type="button" onClick={() => setTab('write')} className={`rounded px-2 py-1 text-xs ${tab === 'write' ? 'bg-white font-semibold shadow-sm' : ''}`}>Write</button>
            <button type="button" onClick={() => setTab('preview')} className={`mr-2 rounded px-2 py-1 text-xs ${tab === 'preview' ? 'bg-white font-semibold shadow-sm' : ''}`}>Preview</button>
            {tab === 'write' && <>
              <Tool icon={Heading2} title="Heading" onClick={() => linePrefix('## ')} /><Tool icon={Heading3} title="Subheading" onClick={() => linePrefix('### ')} />
              <Tool icon={Bold} title="Bold" onClick={() => wrap('**', '**')} /><Tool icon={Italic} title="Italic" onClick={() => wrap('*', '*')} />
              <Tool icon={List} title="Bullet list" onClick={() => linePrefix('- ')} /><Tool icon={ListOrdered} title="Numbered list" onClick={() => linePrefix('1. ')} />
              <Tool icon={Quote} title="Quote" onClick={() => linePrefix('> ')} />
              <Tool icon={Link2} title="Link" onClick={() => { const u = window.prompt('Link URL (https://…)'); if (u) wrap('[', `](${u})`, 'link text'); }} />
              <Tool icon={ImageIcon} title="Insert image" onClick={() => inlineFileRef.current?.click()} />
              <input ref={inlineFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { upload(e.target.files?.[0], (url) => wrap('\n![', `](${url})\n`, 'image description')); e.target.value = ''; }} />
              {uploading && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
            </>}
          </div>
          {tab === 'write'
            ? <Textarea ref={ta} rows={18} className="rounded-none border-0 font-mono text-sm focus-visible:ring-0" value={f.content} onChange={(e) => set('content', e.target.value)} placeholder={'Write your article…\n\n## A heading\nA paragraph with **bold** and a [link](https://example.com).\n\n- A list item'} />
            : <div className="prose prose-slate max-w-none p-4 text-sm [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-violet-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_img]:my-3 [&_img]:rounded-lg [&_p]:my-2" dangerouslySetInnerHTML={{ __html: renderBlogMarkdown(f.content) || '<p class="text-muted-foreground">Nothing to preview yet.</p>' }} />}
        </div>
      </div>
      <div className="space-y-3">
        <Card><CardContent className="space-y-2 p-3">
          <Label>Featured image</Label>
          {f.featuredImage ? <img src={f.featuredImage} alt={f.featuredImageAlt || ''} className="aspect-video w-full rounded-md object-cover" /> : <div className="flex aspect-video items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">No image</div>}
          <div className="flex gap-2"><Button size="sm" variant="outline" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}><Upload className="mr-1 h-3.5 w-3.5" />Upload</Button>{f.featuredImage && <Button size="sm" variant="ghost" type="button" onClick={() => set('featuredImage', '')}>Remove</Button>}</div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { upload(e.target.files?.[0], (url) => set('featuredImage', url)); e.target.value = ''; }} />
          <Input className="h-8 text-xs" placeholder="…or paste https:// image URL" value={f.featuredImage} onChange={(e) => set('featuredImage', e.target.value)} />
          <Input className="h-8 text-xs" placeholder="Image alt text" value={f.featuredImageAlt} onChange={(e) => set('featuredImageAlt', e.target.value)} />
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <div className="space-y-1"><Label>Author</Label><Input className="h-8" value={f.author} onChange={(e) => set('author', e.target.value)} /></div>
          <div className="space-y-1"><Label>Category</Label><Input className="h-8" value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Agency growth" /></div>
          <div className="space-y-1"><Label>Tags</Label><Input className="h-8" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="comma, separated" /></div>
          <div className="space-y-1"><Label>Publication date</Label><Input type="date" className="h-8" value={f.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} /></div>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO & sharing</div>
          <Input className="h-8 text-xs" placeholder="SEO title (defaults to title)" value={f.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
          <Textarea rows={2} className="text-xs" placeholder="Meta description (defaults to excerpt)" value={f.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} />
          <Input className="h-8 text-xs" placeholder="Social image URL (defaults to featured)" value={f.ogImage} onChange={(e) => set('ogImage', e.target.value)} />
        </CardContent></Card>
      </div>
    </div>
    <DialogFooter className="gap-2 sm:justify-between">
      <span className="text-xs text-muted-foreground">Status: <b className="capitalize">{f.status}</b></span>
      <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="outline" onClick={() => save('draft')} disabled={busy}>{f.status === 'published' ? 'Unpublish & save draft' : 'Save draft'}</Button><Button onClick={() => save('published')} disabled={busy}>{busy ? 'Saving…' : f.status === 'published' ? 'Update published post' : 'Publish'}</Button></div>
    </DialogFooter>
  </DialogContent></Dialog>);
}

export function BlogView() {
  const [d, setD] = useState(null); const [status, setStatus] = useState('all'); const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const load = useCallback(async () => { try { const q = new URLSearchParams(); if (status !== 'all') q.set('status', status); if (search) q.set('search', search); setD(await api(`/blog?${q}`)); } catch (e) { toast.error(e.message); setD({ posts: [], counts: {} }); } }, [status, search]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  const open = async (p) => { try { const r = await api(`/blog/${p.id}`); setEditing(r.post); } catch (e) { toast.error(e.message); } };
  const toggle = async (p) => { try { await api(`/blog/${p.id}/status`, { method: 'PUT', body: JSON.stringify({ status: p.status === 'published' ? 'draft' : 'published' }) }); toast.success(p.status === 'published' ? 'Post unpublished' : 'Post published'); load(); } catch (e) { toast.error(e.message); } };
  const del = async (p) => { if (!window.confirm(`Delete "${p.title}" permanently? This cannot be undone.`)) return; try { await api(`/blog/${p.id}`, { method: 'DELETE' }); toast.success('Post deleted'); load(); } catch (e) { toast.error(e.message); } };
  const c = d?.counts || {};
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">{[['all', `All (${c.all ?? 0})`], ['published', `Published (${c.published ?? 0})`], ['draft', `Drafts (${c.draft ?? 0})`]].map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={`rounded-md px-3 py-1 text-sm ${status === k ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}>{l}</button>)}</div>
        <div className="relative w-64"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search title, tag, category…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>
      <div className="flex gap-2"><a href="/blog" target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="mr-1 h-4 w-4" />View blog</Button></a><Button size="sm" onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" />New post</Button></div>
    </div>
    {!d ? <Skeleton /> : d.posts.length === 0 ? <Empty>{search || status !== 'all' ? 'No posts match your filters.' : 'No blog posts yet. Write your first article.'}</Empty> : (
      <div className="grid gap-3">{d.posts.map((p) => (<Card key={p.id} className="overflow-hidden"><CardContent className="flex gap-4 p-3">
        {p.featuredImage ? <img src={p.featuredImage} alt="" className="hidden h-20 w-32 shrink-0 rounded-md object-cover sm:block" /> : <div className="hidden h-20 w-32 shrink-0 rounded-md bg-gradient-to-br from-violet-100 to-sky-100 sm:block" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{p.title}</span><Badge variant="outline" className={p.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{p.status === 'published' ? 'Published' : 'Draft'}</Badge>{p.category && <Badge variant="secondary">{p.category}</Badge>}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">/blog/{p.slug} · {p.author || 'No author'} · {p.status === 'published' ? `Published ${fdate(p.publishedAt)}` : `Updated ${fdt(p.updatedAt)}`}</div>
          {p.excerpt && <p className="mt-1 line-clamp-1 text-sm text-slate-600">{p.excerpt}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {p.status === 'published' && <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" title="View"><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></a>}
          <Button size="sm" variant="ghost" title="Edit" onClick={() => open(p)}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.status === 'published' ? 'Unpublish' : 'Publish'}</Button>
          <Button size="sm" variant="ghost" title="Delete" onClick={() => del(p)}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
        </div>
      </CardContent></Card>))}</div>)}
    {editing && <BlogEditor initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
  </div>);
}
