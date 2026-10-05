'use client';

// SafarOS — Platform Super Admin control center (Final Stage 1).
// A SEPARATE workspace at /admin with its own platform session. It never mixes
// with the agency dashboard and talks only to /api/platform/* endpoints.

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  LayoutDashboard, Building2, Users as UsersIcon, CreditCard, Layers, Bot, Globe,
  BarChart3, ScrollText, Settings as SettingsIcon, LogOut, Search, ShieldCheck,
  Trash2, Eye, Shield, Plug, Menu, X, KeyRound, CheckCircle2, XCircle,
} from 'lucide-react';

async function api(path, options = {}) {
  const res = await fetch(`/api/platform${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
const money = (n, c = 'INR') => `${c} ${Number(n || 0).toLocaleString()}`;
const fdate = (iso) => { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; } };
const fdt = (iso) => { if (!iso) return '—'; try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } };
const humanize = (k) => String(k).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agencies', label: 'Agencies', icon: Building2 },
  { id: 'users', label: 'Users', icon: UsersIcon },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'plans', label: 'Plans', icon: Layers },
  { id: 'ai', label: 'AI Platforms', icon: Bot },
  { id: 'api_integrations', label: 'API & Integrations', icon: KeyRound },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText },
  { id: 'settings', label: 'Platform Settings', icon: SettingsIcon },
];

const STATUS_CLS = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  deleted: 'bg-muted text-muted-foreground border-border',
  past_due: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  expired: 'bg-muted text-muted-foreground border-border',
  not_connected: 'bg-muted text-muted-foreground border-border',
  connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  disabled: 'bg-amber-50 text-amber-700 border-amber-200',
};
function StatusBadge({ status }) {
  return <Badge variant="outline" className={`capitalize ${STATUS_CLS[status] || STATUS_CLS.not_connected}`}>{String(status || '').replace(/_/g, ' ')}</Badge>;
}

function Stat({ label, value, sub }) {
  return (<Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>{sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}</CardContent></Card>);
}

// ---------- Dashboard ----------
function DashboardView() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/dashboard').then(setD).catch((e) => toast.error(e.message)); }, []);
  if (!d) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  return (<div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Total Agencies" value={d.agencies.total} sub={`${d.agencies.active} active · ${d.agencies.suspended} suspended`} />
      <Stat label="Trial Agencies" value={d.agencies.trial} />
      <Stat label="Total Users" value={d.users.total} sub={`${d.users.active} active`} />
      <Stat label="Subscriptions" value={d.subscriptions.total} sub={`${d.subscriptions.active} active · ${d.subscriptions.trial} trial`} />
      <Stat label="Paid Revenue" value={money(d.revenue.paidTotal, d.revenue.currency)} sub="SaaS invoices marked paid" />
      <Stat label="Connected Integrations" value={d.integrations.connected} />
      <Stat label="AI Provider" value={d.ai.activeProvider} sub={d.ai.activeModel} />
      <Stat label="Deleted Agencies" value={d.agencies.deleted} />
    </div>
    <Card><CardHeader><CardTitle className="text-base">AI Provider Status</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-4">
      {d.ai.providers.map((p) => (<div key={p.provider} className="flex items-center gap-2 text-sm"><span className="capitalize font-medium">{p.provider}</span><StatusBadge status={p.configured ? 'connected' : 'not_connected'} /></div>))}
    </CardContent></Card>
  </div>);
}

// ---------- Agencies ----------
function AgenciesView() {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [detail, setDetail] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const load = useCallback(async () => {
    try { const q = new URLSearchParams(); if (search) q.set('search', search); if (status !== 'all') q.set('status', status); const d = await api(`/agencies?${q}`); setRows(d.agencies); }
    catch (e) { toast.error(e.message); }
  }, [search, status]);
  useEffect(() => { load(); }, [load]);
  const setAgStatus = async (id, s) => { try { await api(`/agencies/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: s }) }); toast.success(`Agency ${s}`); load(); } catch (e) { toast.error(e.message); } };
  const del = async (id) => { try { await api(`/agencies/${id}`, { method: 'DELETE' }); toast.success('Agency archived'); setConfirmDel(null); load(); } catch (e) { toast.error(e.message); } };
  const openDetail = async (id) => { try { const d = await api(`/agencies/${id}`); setDetail(d); } catch (e) { toast.error(e.message); } };
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-64 pl-8" placeholder="Search name or slug…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="deleted">Deleted</SelectItem></SelectContent></Select>
    </div>
    {rows === null ? <div className="h-40 animate-pulse rounded-lg border bg-muted/30" /> : !rows.length ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No agencies found.</CardContent></Card> : (<Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow><TableHead>Agency</TableHead><TableHead>Plan</TableHead><TableHead>Subscription</TableHead><TableHead>Users</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead></TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((a) => (<TableRow key={a.id}><TableCell><div className="font-medium">{a.name}</div><div className="text-xs text-muted-foreground">{a.slug}</div></TableCell><TableCell className="capitalize">{a.plan || 'trial'}</TableCell><TableCell>{a.subscription ? <StatusBadge status={a.subscription.status} /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell><TableCell>{a.userCount}</TableCell><TableCell><StatusBadge status={a.status} /></TableCell><TableCell className="text-xs text-muted-foreground">{fdate(a.createdAt)}</TableCell><TableCell><div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openDetail(a.id)}><Eye className="h-4 w-4" /></Button>
        {a.status === 'active' ? <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => setAgStatus(a.id, 'suspended')}>Suspend</Button> : a.status === 'suspended' ? <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => setAgStatus(a.id, 'active')}>Activate</Button> : null}
        {a.status !== 'deleted' && <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setConfirmDel(a)}><Trash2 className="h-4 w-4" /></Button>}
      </div></TableCell></TableRow>))}</TableBody>
    </Table></CardContent></Card>)}

    <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{detail ? detail.agency.name : ''}</DialogTitle></DialogHeader>
      {detail && (<div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-muted-foreground">Slug</span><div className="font-medium">{detail.agency.slug}</div></div>
          <div><span className="text-muted-foreground">Plan</span><div className="font-medium capitalize">{detail.agency.plan || 'trial'}</div></div>
          <div><span className="text-muted-foreground">Status</span><div><StatusBadge status={detail.agency.status} /></div></div>
          <div><span className="text-muted-foreground">Subscription</span><div>{detail.subscription ? <StatusBadge status={detail.subscription.status} /> : '—'}</div></div>
          <div><span className="text-muted-foreground">Created</span><div className="font-medium">{fdate(detail.agency.createdAt)}</div></div>
          <div><span className="text-muted-foreground">Website</span><div className="font-medium capitalize">{detail.websiteStatus}</div></div>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/30 p-3">
          {Object.entries(detail.metrics).map(([k, v]) => (<div key={k}><div className="text-xs text-muted-foreground">{humanize(k)}</div><div className="font-semibold">{v}</div></div>))}
        </div>
        <div><div className="text-xs text-muted-foreground mb-1">Integrations configured</div>{detail.integrations.length ? <div className="flex flex-wrap gap-1">{detail.integrations.map((i) => <Badge key={i.provider} variant="outline" className="text-xs">{i.provider}</Badge>)}</div> : <span className="text-xs text-muted-foreground">None</span>}</div>
      </div>)}
    </DialogContent></Dialog>

    <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}><DialogContent>
      <DialogHeader><DialogTitle>Delete agency?</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">This archives <b>{confirmDel?.name}</b> (status → deleted) and locks out all its users. Data is retained to preserve financial & audit integrity. This is a destructive, audited action.</p>
      <DialogFooter><Button variant="outline" onClick={() => setConfirmDel(null)}>Cancel</Button><Button className="bg-rose-600 hover:bg-rose-700" onClick={() => del(confirmDel.id)}>Delete agency</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>);
}

// ---------- Users ----------
function UsersView() {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const load = useCallback(async () => {
    try { const q = new URLSearchParams(); if (search) q.set('search', search); if (role !== 'all') q.set('role', role); if (status !== 'all') q.set('status', status); const d = await api(`/users?${q}`); setRows(d.users); }
    catch (e) { toast.error(e.message); }
  }, [search, role, status]);
  useEffect(() => { load(); }, [load]);
  const setUStatus = async (id, s) => { try { await api(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: s }) }); toast.success(`User ${s}`); load(); } catch (e) { toast.error(e.message); } };
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-64 pl-8" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Select value={role} onValueChange={setRole}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="owner">Owner</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="agent">Agent</SelectItem><SelectItem value="finance">Finance</SelectItem></SelectContent></Select>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
    </div>
    {rows === null ? <div className="h-40 animate-pulse rounded-lg border bg-muted/30" /> : !rows.length ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No users found.</CardContent></Card> : (<Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Agency</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((u) => (<TableRow key={u.id}><TableCell><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></TableCell><TableCell className="text-sm">{u.agencyName}</TableCell><TableCell className="capitalize">{u.role}</TableCell><TableCell><StatusBadge status={u.status} /></TableCell><TableCell>{u.status === 'active' ? <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => setUStatus(u.id, 'suspended')}>Suspend</Button> : <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => setUStatus(u.id, 'active')}>Activate</Button>}</TableCell></TableRow>))}</TableBody>
    </Table></CardContent></Card>)}
  </div>);
}

// ---------- Subscriptions ----------
const SUB_STATUSES = ['trial', 'active', 'past_due', 'cancelled', 'suspended', 'expired'];
function SubscriptionsView() {
  const [rows, setRows] = useState(null);
  const load = useCallback(async () => { try { const d = await api('/subscriptions'); setRows(d.subscriptions); } catch (e) { toast.error(e.message); } }, []);
  useEffect(() => { load(); }, [load]);
  const change = async (agencyId, status) => { try { await api(`/subscriptions/${agencyId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); toast.success('Subscription updated'); load(); } catch (e) { toast.error(e.message); } };
  if (rows === null) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  if (!rows.length) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No subscriptions yet.</CardContent></Card>;
  return (<Card><CardContent className="p-0"><Table>
    <TableHeader><TableRow><TableHead>Agency</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Period</TableHead><TableHead>Change status</TableHead></TableRow></TableHeader>
    <TableBody>{rows.map((s) => (<TableRow key={s.id}><TableCell className="font-medium">{s.agencyName}</TableCell><TableCell className="capitalize">{s.plan ? s.plan.name : s.planId}</TableCell><TableCell><StatusBadge status={s.status} /></TableCell><TableCell className="text-xs text-muted-foreground">{fdate(s.currentPeriodStart)} – {fdate(s.currentPeriodEnd)}</TableCell><TableCell><Select value={s.status} onValueChange={(v) => change(s.agencyId, v)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{SUB_STATUSES.map((st) => <SelectItem key={st} value={st} className="capitalize">{st.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></TableCell></TableRow>))}</TableBody>
  </Table></CardContent></Card>);
}

// ---------- Plans ----------
function PlansView() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: '', priceYearly: '' });
  const load = useCallback(async () => { try { const d = await api('/plans'); setData(d); } catch (e) { toast.error(e.message); } }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => { try { await api('/plans', { method: 'POST', body: JSON.stringify(form) }); toast.success('Plan created'); setOpen(false); setForm({ name: '', slug: '', description: '', price: '', priceYearly: '' }); load(); } catch (e) { toast.error(e.message); } };
  const del = async (id) => { try { await api(`/plans/${id}`, { method: 'DELETE' }); toast.success('Plan deleted'); load(); } catch (e) { toast.error(e.message); } };
  if (!data) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  return (<div className="space-y-5">
    <div><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-slate-900">Catalog plans (read-only)</h3></div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{data.catalog.map((p) => (<Card key={p.id}><CardContent className="p-4"><div className="font-bold text-slate-900">{p.name}</div><div className="text-xs text-muted-foreground">{p.slug}</div><div className="mt-2 text-lg font-semibold">{p.price ? money(p.price, p.currency) : 'Free'}</div></CardContent></Card>))}</div>
    </div>
    <div><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-slate-900">Custom plans</h3><Button size="sm" onClick={() => setOpen(true)}>New plan</Button></div>
      {!data.custom.length ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No custom plans yet.</CardContent></Card> : (<Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>{data.custom.map((p) => (<TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.slug}</TableCell><TableCell>{money(p.price, p.currency)}</TableCell><TableCell><StatusBadge status={p.status === 'inactive' ? 'disabled' : 'active'} /></TableCell><TableCell><Button size="sm" variant="ghost" className="text-rose-600" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>New custom plan</DialogTitle></DialogHeader><div className="space-y-3">
      <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-1.5"><Label>Slug *</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="agency-plus" /></div></div>
      <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Monthly price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div><div className="space-y-1.5"><Label>Yearly price</Label><Input type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: e.target.value })} /></div></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create plan</Button></DialogFooter></DialogContent></Dialog>
  </div>);
}

// ---------- AI Platforms ----------
function AiView() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ model: '', enabled: true, apiKey: '' });
  const load = useCallback(async () => { try { const d = await api('/ai-platforms'); setData(d); } catch (e) { toast.error(e.message); } }, []);
  useEffect(() => { load(); }, [load]);
  const openCfg = (p) => { setForm({ model: p.model || '', enabled: p.enabled !== false, apiKey: '' }); setSel(p); };
  const save = async () => { try { const body = { model: form.model, enabled: form.enabled }; if (form.apiKey) body.apiKey = form.apiKey; await api(`/ai-platforms/${sel.provider}/configure`, { method: 'POST', body: JSON.stringify(body) }); toast.success('AI provider saved'); setSel(null); load(); } catch (e) { toast.error(e.message); } };
  if (!data) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  return (<div className="space-y-4">
    <p className="text-sm text-muted-foreground">Production AI provider configuration. API keys are never exposed to the browser — only masked status is shown. Keys are stored masked + hashed; live keys are supplied via secure server environment.</p>
    <div className="grid gap-3 md:grid-cols-3">{data.providers.map((p) => (<Card key={p.provider} className={p.active ? 'border-violet-400 ring-1 ring-violet-200' : ''}><CardContent className="p-4">
      <div className="flex items-center justify-between"><div className="font-semibold text-slate-900">{p.name}</div><StatusBadge status={p.status} /></div>
      <div className="mt-2 space-y-1 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="font-medium">{p.model || '—'}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Key</span><code className="text-xs">{p.keyMask || '—'}</code></div><div className="flex justify-between"><span className="text-muted-foreground">Source</span><span className="text-xs capitalize">{p.source}</span></div></div>
      {p.active && <Badge variant="outline" className="mt-2 bg-violet-50 text-violet-700 border-violet-200">Active provider</Badge>}
      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => openCfg(p)}>Configure</Button>
    </CardContent></Card>))}</div>
    <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}><DialogContent><DialogHeader><DialogTitle>Configure {sel ? sel.name : ''}</DialogTitle></DialogHeader><div className="space-y-3">
      <div className="space-y-1.5"><Label>Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. claude-3-5-sonnet-latest" /></div>
      <div className="space-y-1.5"><Label>API Key</Label><Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={sel && sel.keyMask ? `${sel.keyMask} (leave blank to keep)` : 'Stored masked — never shown again'} /><p className="text-xs text-muted-foreground">Stored masked + hashed only. Never returned to the browser.</p></div>
      <div className="flex items-center gap-2"><Button size="sm" variant={form.enabled ? 'default' : 'outline'} onClick={() => setForm({ ...form, enabled: true })}>Enabled</Button><Button size="sm" variant={!form.enabled ? 'default' : 'outline'} onClick={() => setForm({ ...form, enabled: false })}>Disabled</Button></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setSel(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter></DialogContent></Dialog>
  </div>);
}

// ---------- API & Integrations (secure platform credential manager) ----------
function ProviderCredentialsView() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    try { const d = await api('/provider-credentials'); setData(d); } catch (e) { toast.error(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCfg = (p) => {
    const f = {};
    // Never prefill secrets; prefill non-secret identifiers so they can be edited.
    p.fields.forEach((fld) => { f[fld.key] = fld.secret ? '' : (fld.value || ''); });
    setForm(f); setSel(p);
  };

  const save = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      const fields = {};
      sel.fields.forEach((fld) => {
        const v = form[fld.key];
        // Only send secret fields when the admin actually typed a new value.
        if (fld.secret) { if (v && v.trim()) fields[fld.key] = v.trim(); }
        else if (v !== undefined) fields[fld.key] = v;
      });
      await api(`/provider-credentials/${sel.provider}`, { method: 'POST', body: JSON.stringify({ fields }) });
      toast.success(`${sel.name} saved`);
      setSel(null); load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const toggle = async (p, enabled) => {
    try { await api(`/provider-credentials/${p.provider}`, { method: 'PUT', body: JSON.stringify({ enabled }) }); toast.success(enabled ? 'Enabled' : 'Disabled'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const test = async (p) => {
    setTesting(p.provider);
    try { const r = await api(`/provider-credentials/${p.provider}/test`, { method: 'POST', body: '{}' }); r.ok ? toast.success(r.message || 'Connection OK') : toast.error(r.message || 'Connection failed'); load(); }
    catch (e) { toast.error(e.message); } finally { setTesting(''); }
  };

  const remove = async (p) => {
    try { await api(`/provider-credentials/${p.provider}`, { method: 'DELETE' }); toast.success('Credential removed'); setConfirmDel(null); load(); }
    catch (e) { toast.error(e.message); }
  };

  if (!data) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  const cats = data.categories || [];

  return (<div className="space-y-5">
    <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
      <div className="flex items-start gap-2"><KeyRound className="mt-0.5 h-4 w-4 text-violet-600" />
        <p className="text-sm text-violet-900">Securely configure platform-level provider credentials. Secrets are sent only over this authenticated request, <span className="font-semibold">encrypted at rest (AES-256-GCM)</span>, and never returned to the browser — only masked hints are shown. Existing server environment variables remain supported as a fallback.</p>
      </div>
    </div>

    {cats.map((cat) => (
      <div key={cat} className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.providers.filter((p) => p.category === cat).map((p) => (
            <Card key={p.provider}><CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><div className="truncate font-semibold text-slate-900">{p.name}</div>
                  <div className="text-[11px] capitalize text-muted-foreground">{p.scope} credential</div></div>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{p.description}</p>
              <div className="mt-3 space-y-1.5 text-sm">
                {p.fields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{f.label}{f.required && <span className="text-rose-500"> *</span>}</span>
                    {f.secret
                      ? <code className="text-xs">{f.hasStored ? (f.masked || 'stored') : (f.hasEnv ? 'env fallback' : '—')}</code>
                      : <span className="truncate text-xs font-medium">{f.value || (f.hasEnv ? 'env fallback' : '—')}</span>}
                  </div>
                ))}
                <div className="flex items-center justify-between pt-0.5"><span className="text-muted-foreground">Source</span><span className="text-xs capitalize">{p.source}</span></div>
                {p.lastTestedAt && (
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Last test</span>
                    <span className={`flex items-center gap-1 text-xs ${p.lastTestStatus === 'passed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {p.lastTestStatus === 'passed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}{fdt(p.lastTestedAt)}</span></div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openCfg(p)}>Configure</Button>
                {p.testable && <Button size="sm" variant="outline" disabled={testing === p.provider} onClick={() => test(p)}>{testing === p.provider ? 'Testing…' : 'Test'}</Button>}
                {p.status !== 'not_connected' && (
                  p.enabled
                    ? <Button size="sm" variant="outline" onClick={() => toggle(p, false)}>Disable</Button>
                    : <Button size="sm" variant="outline" onClick={() => toggle(p, true)}>Enable</Button>
                )}
                {p.source === 'stored' && <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => setConfirmDel(p)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    ))}

    {/* Configure dialog */}
    <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}><DialogContent>
      <DialogHeader><DialogTitle>Configure {sel ? sel.name : ''}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        {sel && sel.fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}{f.required && <span className="text-rose-500"> *</span>}</Label>
            <Input type={f.secret ? 'password' : 'text'} value={form[f.key] || ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.secret ? (f.hasStored ? `${f.masked} (leave blank to keep)` : (f.hasEnv ? 'Using env fallback — enter to override' : 'Enter value')) : (f.hasEnv && !f.value ? 'Using env fallback — enter to override' : 'Enter value')}
              autoComplete="off" />
            {f.secret && <p className="text-xs text-muted-foreground">Encrypted at rest. Never shown again after saving.</p>}
          </div>
        ))}
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setSel(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save securely'}</Button></DialogFooter>
    </DialogContent></Dialog>

    {/* Remove confirm */}
    <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}><DialogContent>
      <DialogHeader><DialogTitle>Remove {confirmDel ? confirmDel.name : ''} credential?</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">This permanently deletes the stored, encrypted credential. Any configured server environment variable will still be used as a fallback.</p>
      <DialogFooter><Button variant="outline" onClick={() => setConfirmDel(null)}>Cancel</Button><Button className="bg-rose-600 hover:bg-rose-700" onClick={() => remove(confirmDel)}>Remove</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>);
}

// ---------- Integrations ----------
function IntegrationsView() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/integrations').then(setData).catch((e) => toast.error(e.message)); }, []);
  if (!data) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  return (<div className="space-y-4"><p className="text-sm text-muted-foreground">Platform-wide integration adoption across all agencies. Reuses the Phase 5.10 Integration Manager architecture.</p>
    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Category</TableHead><TableHead>Connected agencies</TableHead><TableHead>Configured agencies</TableHead></TableRow></TableHeader><TableBody>{data.providers.map((p) => (<TableRow key={p.provider}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="capitalize">{p.category}</TableCell><TableCell>{p.connectedAgencies}</TableCell><TableCell>{p.configuredAgencies}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
  </div>);
}

// ---------- Analytics ----------
function AnalyticsView() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/analytics').then(setD).catch((e) => toast.error(e.message)); }, []);
  if (!d) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  return (<div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3"><Stat label="Active Agencies" value={d.activeAgencies} /><Stat label="Booking Volume" value={d.bookingVolume} /><Stat label="Revenue" value={money(d.revenue)} /></div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Agency Growth</CardTitle></CardHeader><CardContent>{d.agencyGrowth.length ? d.agencyGrowth.map((m) => (<div key={m.month} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{m.month}</span><span className="font-medium">{m.count}</span></div>)) : <span className="text-sm text-muted-foreground">No data</span>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Subscription Distribution</CardTitle></CardHeader><CardContent>{d.subscriptionDistribution.length ? d.subscriptionDistribution.map((s) => (<div key={s.plan} className="flex items-center justify-between text-sm"><span className="text-muted-foreground capitalize">{s.plan}</span><span className="font-medium">{s.count}</span></div>)) : <span className="text-sm text-muted-foreground">No data</span>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">User Growth</CardTitle></CardHeader><CardContent>{d.userGrowth.length ? d.userGrowth.map((m) => (<div key={m.month} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{m.month}</span><span className="font-medium">{m.count}</span></div>)) : <span className="text-sm text-muted-foreground">No data</span>}</CardContent></Card>
    </div>
  </div>);
}

// ---------- Audit Logs ----------
function AuditView() {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState('');
  const load = useCallback(async () => { try { const q = new URLSearchParams(); if (search) q.set('search', search); const d = await api(`/audit-logs?${q}`); setRows(d.logs); } catch (e) { toast.error(e.message); } }, [search]);
  useEffect(() => { load(); }, [load]);
  if (rows === null) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  return (<div className="space-y-4">
    <div className="relative w-72"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search action, target, agency…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    {!rows.length ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No audit entries.</CardContent></Card> : (<Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>IP</TableHead></TableRow></TableHeader><TableBody>{rows.map((l) => (<TableRow key={l.id}><TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fdt(l.timestamp)}</TableCell><TableCell className="text-xs">{l.actorEmail || l.actorType}</TableCell><TableCell><code className="text-xs">{l.action}</code></TableCell><TableCell className="text-xs text-muted-foreground">{l.targetType}{l.targetId ? ` · ${String(l.targetId).slice(0, 8)}` : ''}</TableCell><TableCell className="text-xs text-muted-foreground">{l.ip || '—'}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)}
  </div>);
}

// ---------- Settings ----------
function SettingsView({ admin, onPasswordChanged }) {
  const [s, setS] = useState(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  useEffect(() => { api('/settings').then((d) => setS(d.settings)).catch((e) => toast.error(e.message)); }, []);
  const save = async () => { try { const d = await api('/settings', { method: 'PUT', body: JSON.stringify(s) }); setS(d.settings); toast.success('Settings saved'); } catch (e) { toast.error(e.message); } };
  const changePw = async () => { try { await api('/auth/change-password', { method: 'POST', body: JSON.stringify(pw) }); toast.success('Password changed'); setPwOpen(false); setPw({ currentPassword: '', newPassword: '' }); onPasswordChanged && onPasswordChanged(); } catch (e) { toast.error(e.message); } };
  if (!s) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  const field = (k, label) => (<div className="space-y-1.5" key={k}><Label>{label}</Label><Input value={s[k] || ''} onChange={(e) => setS((prev) => ({ ...prev, [k]: e.target.value }))} /></div>);
  return (<div className="space-y-5 max-w-3xl">
    <Card><CardHeader><CardTitle className="text-base">Platform settings</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      {field('platformName', 'Platform name')}
      {field('supportEmail', 'Support email')}
      {field('supportPhone', 'Support phone')}
      {field('defaultCurrency', 'Default currency')}
      {field('defaultTimezone', 'Default timezone')}
      {field('defaultCountry', 'Default country')}
      <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={s.description || ''} onChange={(e) => setS({ ...s, description: e.target.value })} /></div>
      <div className="flex items-center gap-2"><Label>Maintenance mode</Label><Button size="sm" variant={s.maintenanceMode ? 'default' : 'outline'} onClick={() => setS({ ...s, maintenanceMode: !s.maintenanceMode })}>{s.maintenanceMode ? 'On' : 'Off'}</Button></div>
      <div className="sm:col-span-2"><Button onClick={save}>Save settings</Button></div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader><CardContent className="flex items-center justify-between">
      <div className="text-sm"><div className="font-medium">{admin.email}</div><div className="text-xs text-muted-foreground">Super Admin{admin.mustChangePassword ? ' · password change recommended' : ''}</div></div>
      <Button variant="outline" onClick={() => setPwOpen(true)}>Change password</Button>
    </CardContent></Card>
    <Dialog open={pwOpen} onOpenChange={setPwOpen}><DialogContent><DialogHeader><DialogTitle>Change password</DialogTitle></DialogHeader><div className="space-y-3">
      <div className="space-y-1.5"><Label>Current password</Label><Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>New password (min 10 chars)</Label><Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button><Button onClick={changePw}>Update password</Button></DialogFooter></DialogContent></Dialog>
  </div>);
}

// ---------- Login ----------
function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); try { const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); onLoggedIn(d.admin); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  return (<div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
    <Card className="w-full max-w-md"><CardContent className="p-8">
      <div className="mb-6 flex items-center gap-2"><Shield className="h-7 w-7 text-violet-600" /><div><div className="text-lg font-bold text-slate-900">SafarOS Platform</div><div className="text-xs text-muted-foreground">Super Admin control center</div></div></div>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@safaros.platform" onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
        <Button className="w-full" onClick={submit} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Platform administration only. Agency sign-in is at /login.</p>
    </CardContent></Card>
  </div>);
}

const TITLES = Object.fromEntries(NAV.map((n) => [n.id, n.label]));

function PlatformNavLinks({ section, onSelect }) {
  return NAV.map((n) => {
    const Icon = n.icon; const on = section === n.id;
    return (
      <button key={n.id} onClick={() => onSelect(n.id)}
        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${on ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <Icon className="h-4 w-4" />{n.label}
      </button>
    );
  });
}

export default function PlatformAdmin() {
  const [admin, setAdmin] = useState(undefined); // undefined = loading, null = logged out
  const [section, setSection] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const reloadMe = useCallback(async () => { try { const d = await api('/auth/me'); setAdmin(d.admin); } catch { setAdmin(null); } }, []);
  useEffect(() => { reloadMe(); }, [reloadMe]);
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } setAdmin(null); };
  const go = (id) => { setSection(id); setMenuOpen(false); };

  if (admin === undefined) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><div className="animate-pulse">Loading SafarOS Platform…</div></div>;
  if (admin === null) return (<><LoginScreen onLoggedIn={setAdmin} /><Toaster richColors position="top-right" /></>);

  return (<div className="flex min-h-screen bg-slate-50">
    {/* Desktop / tablet sidebar */}
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-slate-950 text-slate-200">
      <div className="flex items-center gap-2 px-5 py-5"><Shield className="h-6 w-6 text-violet-400" /><div><div className="text-sm font-bold text-white">SafarOS</div><div className="text-[10px] uppercase tracking-wider text-violet-300">Platform Admin</div></div></div>
      <nav className="flex-1 space-y-1 px-3"><PlatformNavLinks section={section} onSelect={setSection} /></nav>
      <div className="border-t border-slate-800 p-3"><div className="mb-2 px-2 text-xs"><div className="font-medium text-white">{admin.name}</div><div className="truncate text-slate-400">{admin.email}</div></div><button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"><LogOut className="h-4 w-4" /> Sign out</button></div>
    </aside>

    <main className="flex-1 overflow-auto min-w-0">
      {/* Mobile header (hamburger + branding) */}
      <header className="flex items-center gap-3 border-b bg-slate-950 px-4 py-3 text-white md:hidden">
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-200 hover:bg-slate-800"><Menu className="h-5 w-5" /></button>
        <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-violet-400" /><div className="leading-tight"><div className="text-sm font-bold">SafarOS</div><div className="text-[10px] uppercase tracking-wider text-violet-300">Platform Admin</div></div></div>
        <span className="ml-auto truncate text-xs text-slate-400">{TITLES[section]}</span>
      </header>
      {/* Desktop header */}
      <header className="hidden md:flex items-center justify-between border-b bg-white px-6 py-4"><h1 className="text-lg font-semibold text-slate-900">{TITLES[section]}</h1><Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> super_admin</Badge></header>
      {admin.mustChangePassword && section !== 'settings' && (<div className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 sm:mx-6">For security, please change your temporary password in <button className="font-medium underline" onClick={() => setSection('settings')}>Platform Settings → Security</button>.</div>)}
      <div className="p-4 sm:p-6">
        {section === 'dashboard' && <DashboardView />}
        {section === 'agencies' && <AgenciesView />}
        {section === 'users' && <UsersView />}
        {section === 'subscriptions' && <SubscriptionsView />}
        {section === 'plans' && <PlansView />}
        {section === 'ai' && <AiView />}
        {section === 'api_integrations' && <ProviderCredentialsView />}
        {section === 'integrations' && <IntegrationsView />}
        {section === 'analytics' && <AnalyticsView />}
        {section === 'audit' && <AuditView />}
        {section === 'settings' && <SettingsView admin={admin} onPasswordChanged={reloadMe} />}
      </div>
    </main>

    {/* Mobile navigation drawer */}
    <div className={`fixed inset-0 z-50 overflow-hidden md:hidden ${menuOpen ? '' : 'pointer-events-none'}`}>
      <div onClick={() => setMenuOpen(false)} className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute left-0 top-0 flex h-full w-72 max-w-[84%] flex-col bg-slate-950 text-slate-200 shadow-2xl transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-violet-400" /><div><div className="text-sm font-bold text-white">SafarOS</div><div className="text-[10px] uppercase tracking-wider text-violet-300">Platform Admin</div></div></div>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-auto px-3"><PlatformNavLinks section={section} onSelect={go} /></nav>
        <div className="border-t border-slate-800 p-3"><div className="mb-2 px-2 text-xs"><div className="font-medium text-white">{admin.name}</div><div className="truncate text-slate-400">{admin.email}</div></div><button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"><LogOut className="h-4 w-4" /> Sign out</button></div>
      </div>
    </div>

    <Toaster richColors position="top-right" />
  </div>);
}
