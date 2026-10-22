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
  Trash2, Eye, Shield, Plug, Menu, X, KeyRound, CheckCircle2, XCircle, Palette,
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
  { id: 'themes', label: 'Website Theme Library', icon: Palette },
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
  const openDetail = async (id) => { try { const d = await api(`/agencies/${id}`); setDetail(d); setEditing(null); } catch (e) { toast.error(e.message || 'Could not load agency details'); } };
  // Safe profile fields only (existing PUT /platform/agencies/:id, agencies:manage). Slug/plan are intentionally not editable here.
  const [editing, setEditing] = useState(null);
  const EDIT_FIELDS = ['name', 'phone', 'website', 'city', 'country'];
  const saveEdit = async () => {
    if (!String(editing.name || '').trim()) { toast.error('Name is required'); return; }
    try { const d = await api(`/agencies/${detail.agency.id}`, { method: 'PUT', body: JSON.stringify(editing) }); setDetail({ ...detail, agency: d.agency }); setEditing(null); toast.success('Agency updated'); load(); }
    catch (e) { toast.error(e.message); }
  };
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-64 pl-8" placeholder="Search name or slug…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="deleted">Deleted</SelectItem></SelectContent></Select>
    </div>
    {rows === null ? <div className="h-40 animate-pulse rounded-lg border bg-muted/30" /> : !rows.length ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No agencies found.</CardContent></Card> : (<Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow><TableHead>Agency</TableHead><TableHead>Plan</TableHead><TableHead>Subscription</TableHead><TableHead>Users</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead></TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((a) => (<TableRow key={a.id} className="cursor-pointer" onClick={() => openDetail(a.id)}><TableCell><div className="font-medium">{a.name}</div><div className="text-xs text-muted-foreground">{a.slug}</div></TableCell><TableCell className="capitalize">{a.plan || 'trial'}</TableCell><TableCell>{a.subscription ? <StatusBadge status={a.subscription.status} /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell><TableCell>{a.userCount}</TableCell><TableCell><StatusBadge status={a.status} /></TableCell><TableCell className="text-xs text-muted-foreground">{fdate(a.createdAt)}</TableCell><TableCell><div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Button type="button" size="sm" variant="ghost" aria-label="View agency details" onClick={() => openDetail(a.id)}><Eye className="h-4 w-4" /></Button>
        {a.status === 'active' ? <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => setAgStatus(a.id, 'suspended')}>Suspend</Button> : a.status === 'suspended' ? <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => setAgStatus(a.id, 'active')}>Activate</Button> : null}
        {a.status !== 'deleted' && <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setConfirmDel(a)}><Trash2 className="h-4 w-4" /></Button>}
      </div></TableCell></TableRow>))}</TableBody>
    </Table></CardContent></Card>)}

    <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
        <div><div className="text-xs text-muted-foreground mb-1">Users ({(detail.users || []).length})</div>
          {(detail.users || []).length ? <div className="divide-y rounded-md border">{detail.users.map((u) => (<div key={u.id} className="flex items-center justify-between gap-2 px-3 py-2"><div className="min-w-0"><div className="truncate font-medium">{u.name || '—'}</div><div className="truncate text-xs text-muted-foreground">{u.email}</div></div><div className="flex shrink-0 items-center gap-1"><Badge variant="outline" className="text-xs capitalize">{u.role}</Badge><StatusBadge status={u.status || 'active'} /></div></div>))}</div> : <span className="text-xs text-muted-foreground">No users</span>}
        </div>
        {editing ? (<div className="space-y-2 rounded-md border p-3">
          {EDIT_FIELDS.map((k) => (<div key={k} className="space-y-1"><Label className="text-xs">{humanize(k)}</Label><Input value={editing[k] || ''} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} /></div>))}
          <div className="flex justify-end gap-2 pt-1"><Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button size="sm" onClick={saveEdit}>Save</Button></div>
        </div>) : (detail.agency.status !== 'deleted' && <Button size="sm" variant="outline" onClick={() => setEditing(Object.fromEntries(EDIT_FIELDS.map((k) => [k, detail.agency[k] || ''])))}>Edit details</Button>)}
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
  // View uses the row already loaded; Edit uses existing PUT /platform/users/:id (users:manage) — name only.
  const [viewU, setViewU] = useState(null);
  const [editName, setEditName] = useState(null);
  const saveName = async () => {
    const name = String(editName || '').trim();
    if (!name) { toast.error('Name is required'); return; }
    try { const d = await api(`/users/${viewU.id}`, { method: 'PUT', body: JSON.stringify({ name }) }); setViewU({ ...viewU, name: d.user?.name ?? name }); setEditName(null); toast.success('User updated'); load(); }
    catch (e) { toast.error(e.message); }
  };
  const openU = (u, edit = false) => { setViewU(u); setEditName(edit ? (u.name || '') : null); };
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-64 pl-8" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Select value={role} onValueChange={setRole}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="owner">Owner</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="agent">Agent</SelectItem><SelectItem value="finance">Finance</SelectItem></SelectContent></Select>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
    </div>
    {rows === null ? <div className="h-40 animate-pulse rounded-lg border bg-muted/30" /> : !rows.length ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No users found.</CardContent></Card> : (<Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Agency</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((u) => (<TableRow key={u.id}><TableCell><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></TableCell><TableCell className="text-sm">{u.agencyName}</TableCell><TableCell className="capitalize">{u.role}</TableCell><TableCell><StatusBadge status={u.status} /></TableCell><TableCell><div className="flex gap-1">
        <Button type="button" size="sm" variant="ghost" aria-label="View user" onClick={() => openU(u)}><Eye className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => openU(u, true)}>Edit</Button>
        {u.status === 'active' ? <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => setUStatus(u.id, 'suspended')}>Suspend</Button> : <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => setUStatus(u.id, 'active')}>Activate</Button>}
      </div></TableCell></TableRow>))}</TableBody>
    </Table></CardContent></Card>)}

    <Dialog open={!!viewU} onOpenChange={(o) => { if (!o) { setViewU(null); setEditName(null); } }}><DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{viewU ? (viewU.name || viewU.email) : ''}</DialogTitle></DialogHeader>
      {viewU && (<div className="space-y-3 text-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div><span className="text-muted-foreground">Name</span><div className="font-medium break-words">{viewU.name || '—'}</div></div>
          <div><span className="text-muted-foreground">Email</span><div className="font-medium break-all">{viewU.email}</div></div>
          <div><span className="text-muted-foreground">Agency</span><div className="font-medium">{viewU.agencyName || '—'}</div></div>
          <div><span className="text-muted-foreground">Role</span><div className="font-medium capitalize">{viewU.role}</div></div>
          <div><span className="text-muted-foreground">Status</span><div><StatusBadge status={viewU.status} /></div></div>
          <div><span className="text-muted-foreground">Created</span><div className="font-medium">{fdate(viewU.createdAt)}</div></div>
        </div>
        {editName !== null ? (<div className="space-y-2 rounded-md border p-3">
          <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveName()} /></div>
          <p className="text-xs text-muted-foreground">Email, role and agency are not editable here.</p>
          <div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEditName(null)}>Cancel</Button><Button size="sm" onClick={saveName}>Save</Button></div>
        </div>) : <Button size="sm" variant="outline" onClick={() => setEditName(viewU.name || '')}>Edit name</Button>}
      </div>)}
    </DialogContent></Dialog>
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

// ---------- Website Theme Library ----------
const EMPTY_THEME = { name: '', category: 'Custom', description: '', primaryColor: '#334155', secondaryColor: '#0ea5e9', font: 'Inter', active: true };
function WebsiteThemesView() {
  const [themes, setThemes] = useState(null);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_THEME);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const d = await api('/themes'); setThemes(d.themes || []); }
    catch (e) { toast.error(e.message); setThemes([]); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const startEdit = (theme) => { setEditing(theme || null); setForm(theme ? { ...theme } : { ...EMPTY_THEME }); setDialogOpen(true); };
  const save = async () => {
    if (!form.name.trim()) { toast.error('Enter a theme name'); return; }
    setBusy(true);
    try {
      if (editing) await api(`/themes/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await api('/themes', { method: 'POST', body: JSON.stringify(form) });
      toast.success(editing ? 'Theme updated' : 'Theme added');
      setEditing(null); setDialogOpen(false); setForm(EMPTY_THEME); await load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const toggle = async (theme) => {
    try { await api(`/themes/${theme.id}`, { method: 'PUT', body: JSON.stringify({ active: !theme.active }) }); await load(); toast.success(theme.active ? 'Theme deactivated' : 'Theme activated'); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async (theme) => {
    if (!window.confirm(`Delete custom theme "${theme.name}"?`)) return;
    try { await api(`/themes/${theme.id}`, { method: 'DELETE' }); await load(); toast.success('Theme deleted'); }
    catch (e) { toast.error(e.message); }
  };
  if (themes === null) return <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">Manage starter website themes available to travel agencies. Edit a theme, preview its palette, or add your own custom theme.</p><p className="mt-1 text-xs text-muted-foreground">Theme catalogue records are managed here. Applying a theme to a live agency website is a separate publishing step.</p></div>
      <Button onClick={() => startEdit(null)}><Plus className="mr-2 h-4 w-4" /> Add theme</Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {themes.map(theme => <Card key={theme.id} className={!theme.active ? 'opacity-70' : ''}>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2"><div><div className="font-semibold text-slate-900">{theme.name}</div><div className="text-xs text-muted-foreground">{theme.category} · {theme.font}</div></div><Badge variant="outline" className={theme.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}>{theme.active ? 'Active' : 'Inactive'}</Badge></div>
          <div className="overflow-hidden rounded-lg border bg-white">
            <div className="flex h-20 items-end p-3" style={{ background: `linear-gradient(120deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}><div className="rounded-md bg-white/90 px-2 py-1 text-xs font-bold" style={{ color: theme.primaryColor }}>{theme.name}</div></div>
            <div className="space-y-2 p-3"><div className="h-2 w-2/3 rounded" style={{ backgroundColor: theme.primaryColor }} /><div className="h-2 w-full rounded bg-slate-100" /><div className="flex gap-2"><div className="h-6 flex-1 rounded" style={{ backgroundColor: theme.secondaryColor }} /><div className="h-6 flex-1 rounded bg-slate-100" /></div></div>
          </div>
          <p className="min-h-10 text-sm text-muted-foreground">{theme.description || 'No description yet.'}</p>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => startEdit(theme)}>Edit</Button><Button size="sm" variant="outline" onClick={() => toggle(theme)}>{theme.active ? 'Deactivate' : 'Activate'}</Button>{!theme.builtIn && <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => remove(theme)}>Delete</Button>}</div>
        </CardContent>
      </Card>)}
    </div>
    <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditing(null); setForm(EMPTY_THEME); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing ? `Edit ${editing.name}` : 'Add custom theme'}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><Label>Theme name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Category</Label><Input value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
          <div className="space-y-1"><Label>Font</Label><Select value={form.font || 'Inter'} onValueChange={font => setForm({ ...form, font })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Inter','Poppins','Roboto','Lato','Montserrat'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label>Primary colour</Label><div className="flex gap-2"><input aria-label="Primary colour picker" type="color" className="h-9 w-12 rounded border" value={form.primaryColor || '#334155'} onChange={e => setForm({ ...form, primaryColor: e.target.value })} /><Input value={form.primaryColor || ''} onChange={e => setForm({ ...form, primaryColor: e.target.value })} /></div></div>
          <div className="space-y-1"><Label>Secondary colour</Label><div className="flex gap-2"><input aria-label="Secondary colour picker" type="color" className="h-9 w-12 rounded border" value={form.secondaryColor || '#0ea5e9'} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} /><Input value={form.secondaryColor || ''} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} /></div></div>
          <div className="space-y-1 sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(EMPTY_THEME); }}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save theme'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
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
    {admin.role === 'super_admin' && <EmailSettingsCard adminEmail={admin.email} />}
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

// ---------- Email / Resend (Super Admin only; the API key never reaches the browser) ----------
const EMAIL_STATUS = { not_configured: ['Not configured', 'bg-slate-100 text-slate-700 border-slate-200'], configured: ['Configured', 'bg-emerald-50 text-emerald-700 border-emerald-200'], error: ['Error', 'bg-red-50 text-red-700 border-red-200'] };
function EmailSettingsCard({ adminEmail }) {
  const [v, setV] = useState(null);
  const [form, setForm] = useState({ apiKey: '', senderEmail: '', senderName: '', appBaseUrl: '' });
  const [testTo, setTestTo] = useState(adminEmail || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const apply = (e) => { setV(e); setForm({ apiKey: '', senderEmail: e.senderEmail || '', senderName: e.senderName || 'SafarOS', appBaseUrl: e.appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '') }); };
  useEffect(() => { api('/settings/email').then((d) => apply(d.email)).catch((e) => setError(e.message)); }, []);
  const save = async (extra = {}) => {
    setBusy('save'); setError('');
    try { const d = await api('/settings/email', { method: 'PUT', body: JSON.stringify({ ...form, ...extra }) }); apply(d.email); toast.success('Email settings saved'); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const test = async () => {
    setBusy('test'); setError('');
    try { const d = await api('/settings/email/test', { method: 'POST', body: JSON.stringify({ to: testTo }) }); apply(d.email); toast.success(`Test email sent to ${testTo}`); }
    catch (e) { setError(e.message); api('/settings/email').then((d) => setV(d.email)).catch(() => {}); } finally { setBusy(''); }
  };
  if (!v) return <Card><CardContent className="p-5 text-sm text-muted-foreground">{error || 'Loading email settings…'}</CardContent></Card>;
  const [label, cls] = EMAIL_STATUS[v.status] || EMAIL_STATUS.not_configured;
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (<Card><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Email / Resend configuration</CardTitle><Badge variant="outline" className={cls}>{label}</Badge></CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-md border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900 space-y-1">
        <div className="font-medium">Optional. SafarOS works fully without email; only password-reset and notification emails need this.</div>
        <ol className="list-decimal pl-4 space-y-0.5"><li>Create a free account at resend.com and add and verify your domain (Domains → Add domain, then add the DNS records it shows).</li><li>Create an API key (API Keys → Create) and paste it below. It is encrypted on the server and never shown again.</li><li>Use a sender address on your verified domain, e.g. no-reply@yourdomain.com. Until a domain is verified, Resend only delivers test emails to your own Resend account email.</li><li>Save, then press Send test email.</li></ol>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Resend API key</Label><Input type="password" autoComplete="new-password" value={form.apiKey} onChange={f('apiKey')} placeholder={v.apiKeyConfigured ? `${v.apiKeyMasked} (leave blank to keep)` : 're_…'} />
          <p className="text-xs text-muted-foreground">{v.apiKeyConfigured ? `A key is saved (${v.apiKeySource === 'environment' ? 'server environment' : 'encrypted in database'}). Enter a new one only to replace it.` : 'No key saved yet.'}</p></div>
        <div className="space-y-1.5"><Label>Sender email address</Label><Input type="email" value={form.senderEmail} onChange={f('senderEmail')} placeholder="no-reply@yourdomain.com" /></div>
        <div className="space-y-1.5"><Label>Sender display name</Label><Input value={form.senderName} onChange={f('senderName')} placeholder="SafarOS" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Application base URL</Label><Input value={form.appBaseUrl} onChange={f('appBaseUrl')} placeholder="https://app.yourdomain.com" /><p className="text-xs text-muted-foreground">Used for links inside emails (e.g. password reset). Defaults to this site&apos;s current address. Change it when you connect your own domain.</p></div>
      </div>
      {v.status === 'error' && v.lastError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Last test failed: {v.lastError}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-wrap items-end gap-2">
        <Button onClick={() => save()} disabled={!!busy}>{busy === 'save' ? 'Saving…' : 'Save settings'}</Button>
        {v.apiKeySource === 'database' && <Button variant="outline" onClick={() => save({ apiKey: '', clearApiKey: true })} disabled={!!busy}>Remove saved key</Button>}
        <div className="ml-auto flex items-end gap-2"><div className="space-y-1.5"><Label className="text-xs">Test recipient</Label><Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} className="w-56" /></div>
          <Button variant="outline" onClick={test} disabled={!!busy || v.status === 'not_configured'}>{busy === 'test' ? 'Sending…' : 'Send test email'}</Button></div>
      </div>
      {v.lastTestAt && <p className="text-xs text-muted-foreground">Last test: {fdt(v.lastTestAt)}</p>}
    </CardContent></Card>);
}

// ---------- Forced password change (temporary password) ----------
function ForcePasswordChange({ admin, onDone, onLogout }) {
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (pw.newPassword !== pw.confirm) { toast.error('New passwords do not match'); return; }
    setBusy(true);
    try { await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }) }); toast.success('Password changed'); await onDone(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (<div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
    <Card className="w-full max-w-md"><CardContent className="p-8 space-y-3">
      <div className="flex items-center gap-2"><KeyRound className="h-6 w-6 text-violet-600" /><div className="text-lg font-bold text-slate-900">Set a new password</div></div>
      <p className="text-sm text-muted-foreground">You signed in with a temporary password for {admin.email}. Choose a new password (at least 10 characters) to continue.</p>
      <div className="space-y-1.5"><Label>Temporary password</Label><Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>New password</Label><Input type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Confirm new password</Label><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
      <Button className="w-full" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Change password and continue'}</Button>
      <Button variant="ghost" className="w-full" onClick={onLogout}>Sign out</Button>
    </CardContent></Card>
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
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
        <Button className="w-full" onClick={submit} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        <div className="text-center"><a href="/reset-password?type=platform" className="text-xs text-violet-700 hover:underline">Forgot password?</a></div>
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
  if (admin.mustChangePassword) return (<><ForcePasswordChange admin={admin} onDone={reloadMe} onLogout={logout} /><Toaster richColors position="top-right" /></>);

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
        {section === 'themes' && <WebsiteThemesView />}
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
