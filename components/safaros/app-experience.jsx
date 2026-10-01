'use client';

// SafarOS authenticated experience (auth + workspace dashboard).
// Moved verbatim from the original app/page.js — auth/session/tenant logic UNCHANGED.
// Exposed as a reusable component so /app, /login and /signup can render it.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { can } from '@/lib/rbac';
import {
  Building2, Users, Contact, ShieldCheck, LayoutDashboard, LogOut, Plus,
  Trash2, Lock, Globe, Layers, ArrowLeft, Menu, X, Search, Pencil, Eye,
} from 'lucide-react';

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const ROLE_COLORS = {
  owner: 'bg-violet-600 text-white',
  manager: 'bg-blue-600 text-white',
  agent: 'bg-emerald-600 text-white',
  finance: 'bg-amber-600 text-white',
};

function RoleBadge({ role }) {
  return <Badge className={`capitalize ${ROLE_COLORS[role] || ''}`}>{role}</Badge>;
}

function StatusBadge({ status }) {
  const s = status || 'active';
  const cls = s === 'active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-muted text-muted-foreground border-border';
  return <Badge variant="outline" className={`capitalize ${cls}`}>{s}</Badge>;
}

function formatJoined(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthView({ onAuthed, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab === 'signup' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [signup, setSignup] = useState({ agencyName: '', name: '', email: '', password: '' });
  const [login, setLogin] = useState({ email: '', password: '' });

  const doSignup = async () => {
    setLoading(true);
    try {
      await api('/auth/register-agency', { method: 'POST', body: JSON.stringify(signup) });
      toast.success('Agency workspace created');
      onAuthed();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };
  const doLogin = async () => {
    setLoading(true);
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify(login) });
      toast.success('Signed in');
      onAuthed();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 so-font">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 text-white overflow-hidden">
        <div className="relative z-10">
          <a href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight hover:opacity-90">
            <Layers className="h-6 w-6" /> SafarOS
          </a>
          <p className="mt-2 text-sm text-white/70">The Operating System for Travel Businesses</p>
        </div>
        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Run your agency on one multi-tenant workspace.</h1>
          <ul className="space-y-3 text-white/85">
            <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0" /> Strict org isolation — every record scoped to your agency</li>
            <li className="flex gap-3"><Users className="h-5 w-5 shrink-0" /> Role-based access: owner, manager, agent, finance</li>
            <li className="flex gap-3"><Building2 className="h-5 w-5 shrink-0" /> Workspace onboarding built for teams</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-white/50">SafarOS workspace</div>
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-white/10 blur-3xl so-aurora" />
        <div className="absolute -left-10 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl so-aurora" />
      </div>

      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md border-border/60 shadow-lg">
          <CardHeader>
            <a href="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-2 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to safaros.com
            </a>
            <CardTitle>{tab === 'signup' ? 'Create your SafarOS workspace' : 'Welcome back'}</CardTitle>
            <CardDescription>{tab === 'signup' ? 'Bring your travel business into one intelligent operating system.' : 'Sign in to continue to your workspace.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signup">Create workspace</TabsTrigger>
                <TabsTrigger value="login">Sign in</TabsTrigger>
              </TabsList>

              <TabsContent value="signup" className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label>Your name</Label>
                  <Input placeholder="Jane Doe" value={signup.name}
                    onChange={(e) => setSignup({ ...signup, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Business email</Label>
                  <Input type="email" placeholder="jane@agency.com" value={signup.email}
                    onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" placeholder="........" value={signup.password}
                    onChange={(e) => setSignup({ ...signup, password: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Agency name</Label>
                  <Input placeholder="Wanderlust Travels" value={signup.agencyName}
                    onChange={(e) => setSignup({ ...signup, agencyName: e.target.value })} />
                </div>
                <Button className="w-full" onClick={doSignup} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Workspace'}
                </Button>
                <button type="button" onClick={() => setTab('login')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                  Already have an account? <span className="font-medium text-foreground">Sign in</span>
                </button>
              </TabsContent>

              <TabsContent value="login" className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@agency.com" value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" placeholder="........" value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })} />
                </div>
                <Button className="w-full" onClick={doLogin} disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Contact },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Building2 },
];

function Dashboard({ session, onLogout }) {
  const [active, setActive] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, agency } = session;
  const go = (id) => { setActive(id); setMenuOpen(false); };

  return (
    <div className="min-h-screen flex bg-muted/30 so-font">
      <aside className="w-64 shrink-0 border-r border-border bg-sidebar hidden md:flex flex-col">
        <div className="p-5 flex items-center gap-2 font-bold text-lg">
          <Layers className="h-5 w-5 text-violet-600" /> SafarOS
        </div>
        <Separator />
        <div className="p-3 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button key={n.id} onClick={() => setActive(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                ${active === n.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}>
                <Icon className="h-4 w-4" /> {n.label}
              </button>
            );
          })}
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-lg border border-border p-3 bg-background">
            <div className="text-sm font-medium truncate">{agency?.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{agency?.plan} plan</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
              className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent">
              <Menu className="h-5 w-5" />
            </button>
            <span className="flex items-center gap-2 font-bold md:hidden"><Layers className="h-5 w-5 text-violet-600" /> SafarOS</span>
            <span className="font-semibold capitalize hidden md:inline">{active}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <RoleBadge role={user?.role} />
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto">
          {active === 'overview' && <Overview session={session} />}
          {active === 'clients' && <Clients session={session} />}
          {active === 'team' && <Team session={session} />}
          {active === 'settings' && <Settings session={session} />}
        </div>
      </main>

      {/* Mobile navigation drawer */}
      <div className={`fixed inset-0 z-50 overflow-hidden md:hidden ${menuOpen ? '' : 'pointer-events-none'}`}>
        <div onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col border-r border-border bg-sidebar shadow-2xl transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-4">
            <span className="flex items-center gap-2 text-lg font-bold"><Layers className="h-5 w-5 text-violet-600" /> SafarOS</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent"><X className="h-5 w-5" /></button>
          </div>
          <Separator />
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-sm font-bold text-white">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user?.name}</div>
              <div className="truncate text-xs text-muted-foreground">{agency?.name}</div>
            </div>
          </div>
          <Separator />
          <nav className="flex-1 space-y-1 p-3">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <button key={n.id} onClick={() => go(n.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition
                  ${active === n.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}>
                  <Icon className="h-4 w-4" /> {n.label}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-border p-3">
            <Button variant="outline" className="w-full" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Overview({ session }) {
  const { agency, user } = session;
  const [counts, setCounts] = useState({ clients: 0, members: 0 });
  useEffect(() => {
    (async () => {
      try {
        const [c, m] = await Promise.all([api('/clients'), api('/members')]);
        setCounts({ clients: c.clients.length, members: m.members.length });
      } catch { /* ignore */ }
    })();
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]}</h2>
        <p className="text-muted-foreground">Here is your agency workspace at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Contact} label="Clients" value={counts.clients} />
        <StatCard icon={Users} label="Team members" value={counts.members} />
        <StatCard icon={Building2} label="Workspace" value={agency?.name} small />
      </div>
      <Card className="border-violet-200 bg-violet-50/50 dark:bg-violet-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-violet-600" /> Multi-tenant isolation active
          </CardTitle>
          <CardDescription>
            Every record you create is tagged with your agency id on the server. Data from other
            agencies is never visible here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, small }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={small ? 'text-base font-semibold' : 'text-2xl font-bold'}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const CLIENT_STATUS_META = {
  active:   { label: 'Active',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  lead:     { label: 'Lead',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  inactive: { label: 'Inactive', cls: 'bg-muted text-muted-foreground border-border' },
};

function ClientStatusBadge({ status }) {
  const meta = CLIENT_STATUS_META[status] || CLIENT_STATUS_META.active;
  return <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>;
}

const EMPTY_CLIENT = { name: '', email: '', phone: '', notes: '', status: 'active' };

function normalizeClient(c) {
  if (!c) return { ...EMPTY_CLIENT };
  return {
    name: c.name || '', email: c.email || '', phone: c.phone || '',
    notes: c.notes || '', status: c.status || 'active',
  };
}

function ClientFormDialog({ mode, open, setOpen, target, onSaved }) {
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm(mode === 'edit' ? normalizeClient(target) : { ...EMPTY_CLIENT }); setError(''); }
  }, [open, mode, target]);

  const emailOk = !form.email.trim() || EMAIL_RE.test(form.email.trim());
  const canSubmit = !!form.name.trim() && emailOk;

  const submit = async () => {
    setError('');
    if (!form.name.trim()) return setError('Client name is required.');
    if (!emailOk) return setError('Please enter a valid email address.');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(), email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(), notes: form.notes.trim(), status: form.status,
      };
      if (mode === 'edit') {
        await api(`/clients/${target.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Client updated');
      } else {
        await api('/clients', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Client added');
      }
      setOpen(false);
      onSaved();
    } catch (e) {
      const msg = String(e.message || '');
      if (/forbidden/i.test(msg)) setError('You do not have permission to do this.');
      else if (/valid email/i.test(msg)) setError('Please enter a valid email address.');
      else if (/not found/i.test(msg)) setError('This client could not be found.');
      else if (/required|no fields/i.test(msg)) setError('Please fill in the required fields.');
      else if (/too long/i.test(msg)) setError(msg);
      else if (/unauthenticated/i.test(msg)) setError('Your session has expired. Please sign in again.');
      else setError('Something went wrong. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{mode === 'edit' ? 'Edit client' : 'Add client'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-1.5"><Label>Full name</Label>
            <Input value={form.name} placeholder="Jane Doe" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label>
            <Input type="email" value={form.email} placeholder="jane@email.com" onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Phone</Label>
            <Input value={form.phone} placeholder="+1 555 000 1234" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Notes</Label>
            <Textarea value={form.notes} placeholder="Preferences, context, etc." onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!canSubmit || submitting} className="w-full sm:w-auto">
            {submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Add client')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientDetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right break-words">{value}</span>
    </div>
  );
}

function ClientActions({ c, canUpdate, canDelete, onView, onEdit, onRemove }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" title="View" onClick={() => onView(c)}><Eye className="h-4 w-4" /></Button>
      {canUpdate && <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(c)}><Pencil className="h-4 w-4" /></Button>}
      {canDelete && <Button variant="ghost" size="icon" title="Delete" onClick={() => onRemove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
    </div>
  );
}

function ClientDetailDialog({ client, open, setOpen, canUpdate, onEdit }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{client?.name || 'Client'}</DialogTitle></DialogHeader>
        {client && (
          <div className="space-y-3">
            <div><ClientStatusBadge status={client.status} /></div>
            <div className="rounded-lg border border-border p-3">
              <ClientDetailRow label="Email" value={client.email || '—'} />
              <ClientDetailRow label="Phone" value={client.phone || '—'} />
              <ClientDetailRow label="Created" value={formatJoined(client.createdAt)} />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Notes</div>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">{client.notes || '—'}</p>
            </div>
          </div>
        )}
        {client && canUpdate && (
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto"
              onClick={() => { setOpen(false); onEdit(client); }}>
              <Pencil className="h-4 w-4 mr-1.5" /> Edit client
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Clients({ session }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const role = session.user.role;
  const canCreate = can(role, 'clients:create');
  const canUpdate = can(role, 'clients:update');
  const canDelete = can(role, 'clients:delete');

  const load = async () => {
    setLoading(true);
    try { const d = await api('/clients'); setClients(d.clients || []); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    try { await api(`/clients/${id}`, { method: 'DELETE' }); toast.success('Client deleted'); load(); }
    catch (e) { toast.error(e.message); }
  };
  const openEdit = (c) => { setEditTarget(c); setEditOpen(true); };
  const openView = (c) => { setViewTarget(c); setViewOpen(true); };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? clients.filter((c) => [c.name, c.email, c.phone].some((f) => String(f || '').toLowerCase().includes(q)))
    : clients;
  const isEmpty = !loading && clients.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Clients</h2>
          <p className="text-sm text-muted-foreground">Your agency&apos;s client records.</p>
        </div>
        {canCreate && !isEmpty && (
          <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Add client</Button>
        )}
      </div>

      {!isEmpty && !loading && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone" className="pl-9" />
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}
        </div>
      )}

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Contact className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">No clients yet</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Add your first client to start building your agency CRM.
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add client</Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && clients.length > 0 && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No clients match “{query}”.</CardContent></Card>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* Desktop: compact professional table */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => openView(c)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone || '—'}</TableCell>
                    <TableCell><ClientStatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatJoined(c.createdAt)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <ClientActions c={c} canUpdate={canUpdate} canDelete={canDelete}
                          onView={openView} onEdit={openEdit} onRemove={remove} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: stacked client cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((c) => (
              <Card key={c.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button className="min-w-0 text-left" onClick={() => openView(c)}>
                      <div className="truncate font-semibold">{c.name}</div>
                      {c.email && <div className="truncate text-sm text-muted-foreground">{c.email}</div>}
                      {c.phone && <div className="truncate text-sm text-muted-foreground">{c.phone}</div>}
                    </button>
                    <ClientStatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">Added {formatJoined(c.createdAt)}</span>
                    <ClientActions c={c} canUpdate={canUpdate} canDelete={canDelete}
                      onView={openView} onEdit={openEdit} onRemove={remove} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {canCreate && <ClientFormDialog mode="add" open={addOpen} setOpen={setAddOpen} onSaved={load} />}
      {canUpdate && <ClientFormDialog mode="edit" open={editOpen} setOpen={setEditOpen} target={editTarget} onSaved={load} />}
      <ClientDetailDialog client={viewTarget} open={viewOpen} setOpen={setViewOpen} canUpdate={canUpdate} onEdit={openEdit} />
    </div>
  );
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'agent' };

function AddMemberForm({ open, setOpen, onAdded }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset state whenever the dialog is opened/closed.
  const onOpenChange = (v) => {
    setOpen(v);
    if (!v) { setForm(EMPTY_FORM); setError(''); }
  };

  const emailValid = EMAIL_RE.test(form.email.trim());
  const canSubmit = !!form.name.trim() && emailValid && form.password.length >= 6 && !!form.role;

  const submit = async () => {
    setError('');
    if (!form.name.trim()) return setError('Full name is required.');
    if (!emailValid) return setError('Enter a valid business email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setSubmitting(true);
    try {
      await api('/members', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
        }),
      });
      toast.success('Team member added');
      setForm(EMPTY_FORM);
      setOpen(false);
      onAdded();
    } catch (e) {
      const msg = String(e.message || '');
      if (/already registered|duplicate|E11000/i.test(msg)) setError('A member with this email already exists.');
      else if (/forbidden/i.test(msg)) setError('You do not have permission to add team members.');
      else if (/invalid role/i.test(msg)) setError('Please select a valid role.');
      else if (/required/i.test(msg)) setError('Please fill in all required fields.');
      else if (/unauthenticated/i.test(msg)) setError('Your session has expired. Please sign in again.');
      else setError('Something went wrong while adding the member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Add team member</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input
              value={form.name}
              placeholder="Jane Doe"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Business email</Label>
            <Input
              type="email"
              value={form.email}
              placeholder="jane@agency.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              placeholder="At least 6 characters"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Share this with the employee so they can sign in.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!canSubmit || submitting} className="w-full sm:w-auto">
            {submitting ? 'Adding…' : 'Add team member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Team({ session }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const canInvite = can(session.user.role, 'members:invite');

  const load = async () => {
    setLoading(true);
    try { const d = await api('/members'); setMembers(d.members || []); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const isEmpty = !loading && members.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Team</h2>
          <p className="text-sm text-muted-foreground">
            Manage the employees in your SafarOS workspace.
          </p>
        </div>
        {canInvite && !isEmpty && (
          <AddMemberForm open={open} setOpen={setOpen} onAdded={load} />
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">No team members yet</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Add employees to your SafarOS workspace so your team can work together.
              </p>
            </div>
            {canInvite && <AddMemberForm open={open} setOpen={setOpen} onAdded={load} />}
          </CardContent>
        </Card>
      )}

      {!loading && members.length > 0 && (
        <>
          {/* Desktop: professional table */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell><RoleBadge role={m.role} /></TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatJoined(m.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: stacked member cards */}
          <div className="space-y-3 md:hidden">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{m.name}</div>
                      <div className="truncate text-sm text-muted-foreground">{m.email}</div>
                    </div>
                    <RoleBadge role={m.role} />
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 text-sm">
                    <StatusBadge status={m.status} />
                    <span className="text-muted-foreground">Joined {formatJoined(m.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Settings({ session }) {
  const { agency, user } = session;
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold">Workspace settings</h2>
      <Card>
        <CardContent className="p-5 space-y-3">
          <Row label="Agency name" value={agency?.name} />
          <Row label="Workspace slug" value={agency?.slug} icon={Globe} />
          <Row label="Plan" value={agency?.plan} />
          <Separator />
          <Row label="Your role" value={<RoleBadge role={user?.role} />} />
          <Row label="Agency ID (tenant key)" value={<code className="text-xs">{agency?.id}</code>} icon={Lock} />
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Lock className="h-3 w-3" /> The agency ID is derived server-side from your session and scopes all your data.
      </p>
    </div>
  );
}

function Row({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />} {label}
      </span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

function AgencySetup({ session, onDone, onLogout }) {
  const { agency, user } = session;
  const [form, setForm] = useState({
    name: agency?.name || '',
    email: agency?.email || user?.email || '',
    phone: agency?.phone || '',
    website: agency?.website || '',
    address: agency?.address || '',
    city: agency?.city || '',
    country: agency?.country || 'India',
    currency: agency?.currency || 'INR',
    timezone: agency?.timezone || 'Asia/Kolkata',
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async () => {
    setLoading(true);
    try {
      await api('/agency', { method: 'PUT', body: JSON.stringify(form) });
      toast.success('Workspace ready');
      await onDone();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-muted/30 so-font">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-5">
        <span className="flex items-center gap-2 font-bold"><Layers className="h-5 w-5 text-violet-600" /> SafarOS</span>
        <Button variant="ghost" size="sm" onClick={onLogout}><LogOut className="h-4 w-4 mr-1" /> Sign out</Button>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Set up your travel business</h1>
          <p className="mt-1 text-muted-foreground">A few details to tailor your SafarOS workspace.</p>
        </div>
        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label>Agency name</Label><Input value={form.name} onChange={set('name')} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></div>
            <div className="space-y-1.5"><Label>Business email</Label><Input type="email" value={form.email} onChange={set('email')} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Website</Label><Input value={form.website} onChange={set('website')} placeholder="https://youragency.com" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={set('address')} /></div>
            <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={set('city')} /></div>
            <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={set('country')} /></div>
            <div className="space-y-1.5"><Label>Currency</Label><Input value={form.currency} onChange={set('currency')} /></div>
            <div className="space-y-1.5"><Label>Timezone</Label><Input value={form.timezone} onChange={set('timezone')} /></div>
          </CardContent>
        </Card>
        <Button className="mt-5 w-full sm:w-auto" onClick={save} disabled={loading || !form.name}>
          {loading ? 'Saving...' : 'Enter SafarOS'}
        </Button>
      </div>
    </div>
  );
}

export function AppExperience({ initialTab = 'login' }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = async () => {
    try { const d = await api('/auth/me'); setSession(d); }
    catch { setSession(null); } finally { setLoading(false); }
  };
  useEffect(() => { loadMe(); }, []);

  const onAuthed = async () => { await loadMe(); router.push('/dashboard'); };

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setSession(null);
    toast.success('Signed out');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Layers className="h-5 w-5 so-float text-violet-600" /> Loading SafarOS...
        </div>
      </div>
    );
  }

  return (
    <>
      {session
        ? (session.agency?.setupCompleted
            ? <Dashboard session={session} onLogout={logout} />
            : <AgencySetup session={session} onDone={loadMe} onLogout={logout} />)
        : <AuthView onAuthed={onAuthed} initialTab={initialTab} />}
      <Toaster richColors position="top-right" />
    </>
  );
}

export default AppExperience;
