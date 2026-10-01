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
  UserPlus, BookUser, CalendarClock, ListTodo, Activity, Filter, ArrowRight, CheckCircle2,
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
  {
    group: 'CRM',
    items: [
      { id: 'crm', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'leads', label: 'Leads', icon: UserPlus },
      { id: 'clients', label: 'Clients', icon: Contact },
      { id: 'contacts', label: 'Contacts', icon: BookUser },
      { id: 'followups', label: 'Follow-ups', icon: CalendarClock },
      { id: 'tasks', label: 'Tasks', icon: ListTodo },
      { id: 'activities', label: 'Activities', icon: Activity },
    ],
  },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Building2 },
];

const SECTION_TITLES = {
  overview: 'Overview', crm: 'CRM Dashboard', leads: 'Leads', clients: 'Clients',
  contacts: 'Contacts', followups: 'Follow-ups', tasks: 'Tasks', activities: 'Activities',
  team: 'Team', settings: 'Settings',
};

function NavButton({ item, active, onSelect, mobile }) {
  const Icon = item.icon;
  const base = mobile
    ? 'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition'
    : 'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition';
  const state = active === item.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent';
  return (
    <button onClick={() => onSelect(item.id)} className={`${base} ${state}`}>
      {Icon && <Icon className="h-4 w-4 shrink-0" />} {item.label}
    </button>
  );
}

function NavList({ active, onSelect, mobile }) {
  return (
    <div className="space-y-1">
      {NAV.map((n) => {
        if (n.group) {
          return (
            <div key={n.group} className="pt-3">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{n.group}</div>
              <div className="space-y-1">
                {n.items.map((it) => (
                  <NavButton key={it.id} item={it} active={active} onSelect={onSelect} mobile={mobile} />
                ))}
              </div>
            </div>
          );
        }
        return <NavButton key={n.id} item={n} active={active} onSelect={onSelect} mobile={mobile} />;
      })}
    </div>
  );
}

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
        <div className="flex-1 overflow-auto p-3">
          <NavList active={active} onSelect={setActive} />
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-lg border border-border p-3 bg-background">
            <div className="text-sm font-medium truncate">{agency?.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{agency?.plan} plan</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
              className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent">
              <Menu className="h-5 w-5" />
            </button>
            <span className="flex items-center gap-2 font-bold md:hidden"><Layers className="h-5 w-5 text-violet-600" /> SafarOS</span>
            <span className="font-semibold hidden md:inline">{SECTION_TITLES[active] || 'SafarOS'}</span>
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
          {active === 'crm' && <CrmDashboard session={session} onGo={setActive} />}
          {active === 'leads' && <Leads session={session} />}
          {active === 'clients' && <Clients session={session} />}
          {active === 'contacts' && <Contacts session={session} />}
          {active === 'followups' && <FollowUps session={session} />}
          {active === 'tasks' && <Tasks session={session} />}
          {active === 'activities' && <Activities session={session} />}
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
          <nav className="flex-1 overflow-auto p-3">
            <NavList active={active} onSelect={go} mobile />
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

// ======================= CRM WORKSPACE =======================

function MetaBadge({ meta }) {
  return <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>;
}

const LEAD_STATUS_META = {
  new:       { label: 'New',       cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  contacted: { label: 'Contacted', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  qualified: { label: 'Qualified', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  converted: { label: 'Converted', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  lost:      { label: 'Lost',      cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};
const LEAD_STATUS_OPTIONS = Object.keys(LEAD_STATUS_META);
const FOLLOWUP_STATUS_META = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};
const TASK_STATUS_META = {
  open:      { label: 'Open',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

function friendlyError(e, fallback) {
  const msg = String(e?.message || '');
  if (/forbidden/i.test(msg)) return 'You do not have permission to do this.';
  if (/valid email/i.test(msg)) return 'Please enter a valid email address.';
  if (/not found/i.test(msg)) return 'This record could not be found.';
  if (/already converted/i.test(msg)) return 'This lead was already converted.';
  if (/required|no fields/i.test(msg)) return 'Please fill in the required fields.';
  if (/too long/i.test(msg)) return msg;
  if (/unauthenticated/i.test(msg)) return 'Your session has expired. Please sign in again.';
  return fallback || 'Something went wrong. Please try again.';
}

// ---- CRM Dashboard ----
function CrmDashboard({ session, onGo }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try { const d = await api('/crm/stats'); setStats(d.stats); }
      catch (e) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, []);
  const cards = [
    { key: 'totalLeads', label: 'Total Leads', icon: UserPlus, go: 'leads' },
    { key: 'activeLeads', label: 'Active Leads', icon: Activity, go: 'leads' },
    { key: 'totalClients', label: 'Total Clients', icon: Contact, go: 'clients' },
    { key: 'followUpsDue', label: 'Follow-ups Due', icon: CalendarClock, go: 'followups' },
    { key: 'openTasks', label: 'Open Tasks', icon: ListTodo, go: 'tasks' },
  ];
  const allZero = stats && Object.values(stats).every((v) => !v);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">CRM Dashboard</h2>
        <p className="text-sm text-muted-foreground">A live snapshot of your agency pipeline.</p>
      </div>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => <div key={c.key} className="h-24 rounded-lg border bg-muted/30 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.key} onClick={() => onGo(c.go)} className="text-left">
                <Card className="h-full transition hover:border-primary/40 hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                    <div>
                      <div className="text-2xl font-bold">{stats?.[c.key] ?? 0}</div>
                      <div className="text-xs text-muted-foreground">{c.label}</div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
      {!loading && allZero && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><LayoutDashboard className="h-6 w-6 text-muted-foreground" /></div>
            <div className="space-y-1">
              <h3 className="font-semibold">Your CRM is empty</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">Capture your first lead or add a client to start tracking your agency pipeline.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => onGo('leads')}><UserPlus className="h-4 w-4 mr-1.5" /> Go to Leads</Button>
              <Button variant="outline" onClick={() => onGo('clients')}><Contact className="h-4 w-4 mr-1.5" /> Go to Clients</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Shared related-record picker (leads + clients) ----
function RelatedSelect({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const [c, l] = await Promise.all([api('/clients'), api('/leads')]);
        setOpts([
          ...(l.leads || []).map((x) => ({ key: `lead:${x.id}`, type: 'lead', id: x.id, name: x.name })),
          ...(c.clients || []).map((x) => ({ key: `client:${x.id}`, type: 'client', id: x.id, name: x.name })),
        ]);
      } catch { /* non-blocking */ }
    })();
  }, []);
  const current = value?.relatedId ? `${value.relatedType}:${value.relatedId}` : 'none';
  return (
    <Select value={current} onValueChange={(v) => {
      if (v === 'none') { onChange({ relatedType: '', relatedId: '', relatedName: '' }); return; }
      const o = opts.find((x) => x.key === v);
      if (o) onChange({ relatedType: o.type, relatedId: o.id, relatedName: o.name });
    }}>
      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {opts.map((o) => <SelectItem key={o.key} value={o.key}>{o.name} · {o.type}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ---- Leads ----
function LeadStatusBadge({ status }) { return <MetaBadge meta={LEAD_STATUS_META[status] || LEAD_STATUS_META.new} />; }
const EMPTY_LEAD = { name: '', email: '', phone: '', source: '', status: 'new', notes: '' };

function LeadFormDialog({ mode, open, setOpen, target, onSaved }) {
  const [form, setForm] = useState(EMPTY_LEAD);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setForm(mode === 'edit'
        ? { name: target?.name || '', email: target?.email || '', phone: target?.phone || '', source: target?.source || '', status: target?.status || 'new', notes: target?.notes || '' }
        : { ...EMPTY_LEAD });
      setError('');
    }
  }, [open, mode, target]);
  const emailOk = !form.email.trim() || EMAIL_RE.test(form.email.trim());
  const canSubmit = !!form.name.trim() && emailOk;
  const submit = async () => {
    setError('');
    if (!form.name.trim()) return setError('Lead name is required.');
    if (!emailOk) return setError('Please enter a valid email address.');
    setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), source: form.source.trim(), status: form.status, notes: form.notes.trim() };
      if (mode === 'edit') { await api(`/leads/${target.id}`, { method: 'PUT', body: JSON.stringify(payload) }); toast.success('Lead updated'); }
      else { await api('/leads', { method: 'POST', body: JSON.stringify(payload) }); toast.success('Lead added'); }
      setOpen(false); onSaved();
    } catch (e) { setError(friendlyError(e)); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{mode === 'edit' ? 'Edit lead' : 'Add lead'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-1.5"><Label>Full name</Label>
            <Input value={form.name} placeholder="Jane Doe" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Email</Label>
              <Input type="email" value={form.email} placeholder="jane@email.com" onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label>
              <Input value={form.phone} placeholder="+1 555 000 1234" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Source</Label>
              <Input value={form.source} placeholder="Website, referral…" onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_META[s].label}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label>
            <Textarea value={form.notes} placeholder="Context, requirements, etc." onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!canSubmit || submitting} className="w-full sm:w-auto">{submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Add lead')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeadDetailDialog({ lead, open, setOpen, canUpdate, canConvert, onEdit, onChangeStatus, onConvert }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{lead?.name || 'Lead'}</DialogTitle></DialogHeader>
        {lead && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><LeadStatusBadge status={lead.status} />{lead.source && <span className="text-xs text-muted-foreground">via {lead.source}</span>}</div>
            <div className="rounded-lg border border-border p-3">
              <ClientDetailRow label="Email" value={lead.email || '—'} />
              <ClientDetailRow label="Phone" value={lead.phone || '—'} />
              <ClientDetailRow label="Created" value={formatJoined(lead.createdAt)} />
            </div>
            <div><div className="mb-1 text-xs text-muted-foreground">Notes</div><p className="whitespace-pre-wrap text-sm text-foreground/90">{lead.notes || '—'}</p></div>
            {canUpdate && lead.status !== 'converted' && (
              <div className="space-y-1.5"><Label>Change status</Label>
                <Select value={lead.status} onValueChange={(v) => onChangeStatus(lead, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_META[s].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        {lead && (
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {canUpdate && <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setOpen(false); onEdit(lead); }}><Pencil className="h-4 w-4 mr-1.5" /> Edit</Button>}
            {canConvert && lead.status !== 'converted' && <Button className="w-full sm:w-auto" onClick={() => onConvert(lead)}><ArrowRight className="h-4 w-4 mr-1.5" /> Convert to Client</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Leads({ session }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const role = session.user.role;
  const canCreate = can(role, 'leads:create');
  const canUpdate = can(role, 'leads:update');
  const canDelete = can(role, 'leads:delete');
  const canConvert = can(role, 'clients:create');

  const load = async () => {
    setLoading(true);
    try { const d = await api('/leads'); setLeads(d.leads || []); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => { try { await api(`/leads/${id}`, { method: 'DELETE' }); toast.success('Lead deleted'); load(); } catch (e) { toast.error(e.message); } };
  const changeStatus = async (lead, status) => { try { await api(`/leads/${lead.id}`, { method: 'PUT', body: JSON.stringify({ status }) }); toast.success('Status updated'); setViewOpen(false); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const convert = async (lead) => { try { await api(`/leads/${lead.id}/convert`, { method: 'POST' }); toast.success('Lead converted to client'); setViewOpen(false); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const openEdit = (l) => { setEditTarget(l); setEditOpen(true); };
  const openView = (l) => { setViewTarget(l); setViewOpen(true); };

  const q = query.trim().toLowerCase();
  const filtered = leads.filter((l) => {
    const mq = !q || [l.name, l.email, l.phone, l.source].some((f) => String(f || '').toLowerCase().includes(q));
    const ms = statusFilter === 'all' || l.status === statusFilter;
    return mq && ms;
  });
  const isEmpty = !loading && leads.length === 0;

  const renderActions = (l) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" title="View" onClick={() => openView(l)}><Eye className="h-4 w-4" /></Button>
      {canUpdate && <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>}
      {canDelete && <Button variant="ghost" size="icon" title="Delete" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold">Leads</h2><p className="text-sm text-muted-foreground">Track and qualify incoming agency leads.</p></div>
        {canCreate && !isEmpty && <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Add lead</Button>}
      </div>

      {!isEmpty && !loading && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone or source" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_META[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}

      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><UserPlus className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No leads yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Capture your first lead to start building your agency pipeline.</p></div>
          {canCreate && <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add lead</Button>}
        </CardContent></Card>
      )}

      {!loading && leads.length > 0 && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No leads match your filters.</CardContent></Card>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Source</TableHead>
                <TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => openView(l)}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-muted-foreground">{l.email || l.phone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{l.source || '—'}</TableCell>
                    <TableCell><LeadStatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatJoined(l.createdAt)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}><div className="flex justify-end">{renderActions(l)}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-3 md:hidden">
            {filtered.map((l) => (
              <Card key={l.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button className="min-w-0 text-left" onClick={() => openView(l)}>
                      <div className="truncate font-semibold">{l.name}</div>
                      {(l.email || l.phone) && <div className="truncate text-sm text-muted-foreground">{l.email || l.phone}</div>}
                      {l.source && <div className="truncate text-xs text-muted-foreground">via {l.source}</div>}
                    </button>
                    <LeadStatusBadge status={l.status} />
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">Added {formatJoined(l.createdAt)}</span>
                    {renderActions(l)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {canCreate && <LeadFormDialog mode="add" open={addOpen} setOpen={setAddOpen} onSaved={load} />}
      {canUpdate && <LeadFormDialog mode="edit" open={editOpen} setOpen={setEditOpen} target={editTarget} onSaved={load} />}
      <LeadDetailDialog lead={viewTarget} open={viewOpen} setOpen={setViewOpen} canUpdate={canUpdate} canConvert={canConvert} onEdit={openEdit} onChangeStatus={changeStatus} onConvert={convert} />
    </div>
  );
}

function ContactTypeBadge({ type }) {
  return <Badge variant="outline" className={type === 'client' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'}>{type === 'client' ? 'Client' : 'Lead'}</Badge>;
}

// ---- Contacts (lightweight directory derived from clients + leads) ----
function Contacts({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, l] = await Promise.all([api('/clients'), api('/leads')]);
        const list = [
          ...(c.clients || []).map((x) => ({ id: `client:${x.id}`, name: x.name, email: x.email, phone: x.phone, type: 'client' })),
          ...(l.leads || []).map((x) => ({ id: `lead:${x.id}`, name: x.name, email: x.email, phone: x.phone, type: 'lead' })),
        ].filter((x) => x.email || x.phone);
        setRows(list);
      } catch (e) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, []);
  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => [r.name, r.email, r.phone].some((f) => String(f || '').toLowerCase().includes(q))) : rows;
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold">Contacts</h2><p className="text-sm text-muted-foreground">Everyone with contact details across your leads and clients.</p></div>
      {!loading && rows.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search contacts" className="pl-9" />
        </div>
      )}
      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}
      {!loading && rows.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><BookUser className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No contacts yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Contacts appear automatically from your leads and clients that have an email or phone.</p></div>
        </CardContent></Card>
      )}
      {!loading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.phone || '—'}</TableCell>
                    <TableCell><ContactTypeBadge type={r.type} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id}><CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{r.name}</div>
                  {r.email && <div className="truncate text-sm text-muted-foreground">{r.email}</div>}
                  {r.phone && <div className="truncate text-sm text-muted-foreground">{r.phone}</div>}
                </div>
                <ContactTypeBadge type={r.type} />
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
      {!loading && rows.length > 0 && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No contacts match “{query}”.</CardContent></Card>
      )}
    </div>
  );
}

// ---- Follow-ups ----
function FollowUpFormDialog({ open, setOpen, onSaved }) {
  const [form, setForm] = useState({ title: '', dueDate: '', status: 'pending', notes: '', relatedType: '', relatedId: '', relatedName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setForm({ title: '', dueDate: '', status: 'pending', notes: '', relatedType: '', relatedId: '', relatedName: '' }); setError(''); } }, [open]);
  const submit = async () => {
    setError('');
    if (!form.title.trim()) return setError('A title is required.');
    setSubmitting(true);
    try {
      await api('/followups', { method: 'POST', body: JSON.stringify({ ...form, title: form.title.trim() }) });
      toast.success('Follow-up created'); setOpen(false); onSaved();
    } catch (e) { setError(friendlyError(e)); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add follow-up</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} placeholder="Call to confirm itinerary" onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Related to</Label><RelatedSelect value={form} onChange={(rel) => setForm({ ...form, ...rel })} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
              </Select></div>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={!form.title.trim() || submitting} className="w-full sm:w-auto">{submitting ? 'Saving…' : 'Add follow-up'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FollowUps({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const role = session.user.role;
  const canCreate = can(role, 'followups:create');
  const canUpdate = can(role, 'followups:update');
  const canDelete = can(role, 'followups:delete');
  const load = async () => { setLoading(true); try { const d = await api('/followups'); setItems(d.followUps || []); } catch (e) { toast.error(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const toggle = async (f) => { try { await api(`/followups/${f.id}`, { method: 'PUT', body: JSON.stringify({ status: f.status === 'pending' ? 'completed' : 'pending' }) }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const remove = async (id) => { try { await api(`/followups/${id}`, { method: 'DELETE' }); toast.success('Follow-up deleted'); load(); } catch (e) { toast.error(e.message); } };
  const isEmpty = !loading && items.length === 0;
  const renderActions = (f) => (
    <div className="flex items-center gap-1">
      {canUpdate && <Button variant="ghost" size="icon" title={f.status === 'pending' ? 'Mark completed' : 'Mark pending'} onClick={() => toggle(f)}><CheckCircle2 className={`h-4 w-4 ${f.status === 'completed' ? 'text-emerald-600' : 'text-muted-foreground'}`} /></Button>}
      {canDelete && <Button variant="ghost" size="icon" title="Delete" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold">Follow-ups</h2><p className="text-sm text-muted-foreground">Keep track of what needs a nudge.</p></div>
        {canCreate && !isEmpty && <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Add follow-up</Button>}
      </div>
      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}
      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><CalendarClock className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No follow-ups yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Create a follow-up so nothing slips through the cracks.</p></div>
          {canCreate && <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add follow-up</Button>}
        </CardContent></Card>
      )}
      {!loading && items.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Related to</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.title}</TableCell>
                    <TableCell className="text-muted-foreground">{f.relatedName || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{f.dueDate ? formatJoined(f.dueDate) : '—'}</TableCell>
                    <TableCell><MetaBadge meta={FOLLOWUP_STATUS_META[f.status] || FOLLOWUP_STATUS_META.pending} /></TableCell>
                    <TableCell className="text-right"><div className="flex justify-end">{renderActions(f)}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {items.map((f) => (
              <Card key={f.id}><CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="truncate font-semibold">{f.title}</div>{f.relatedName && <div className="truncate text-sm text-muted-foreground">{f.relatedName}</div>}</div>
                  <MetaBadge meta={FOLLOWUP_STATUS_META[f.status] || FOLLOWUP_STATUS_META.pending} />
                </div>
                <div className="flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">Due {f.dueDate ? formatJoined(f.dueDate) : '—'}</span>{renderActions(f)}</div>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
      {canCreate && <FollowUpFormDialog open={addOpen} setOpen={setAddOpen} onSaved={load} />}
    </div>
  );
}

// ---- Tasks ----
function TaskFormDialog({ open, setOpen, onSaved }) {
  const [form, setForm] = useState({ title: '', assigneeId: '', assigneeName: '', dueDate: '', status: 'open', relatedType: '', relatedId: '', relatedName: '' });
  const [members, setMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setForm({ title: '', assigneeId: '', assigneeName: '', dueDate: '', status: 'open', relatedType: '', relatedId: '', relatedName: '' });
      setError('');
      (async () => { try { const d = await api('/members'); setMembers(d.members || []); } catch { /* ignore */ } })();
    }
  }, [open]);
  const submit = async () => {
    setError('');
    if (!form.title.trim()) return setError('A task title is required.');
    setSubmitting(true);
    try { await api('/tasks', { method: 'POST', body: JSON.stringify({ ...form, title: form.title.trim() }) }); toast.success('Task created'); setOpen(false); onSaved(); }
    catch (e) { setError(friendlyError(e)); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add task</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} placeholder="Prepare quotation draft" onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Assign to</Label>
            <Select value={form.assigneeId || 'none'} onValueChange={(v) => { if (v === 'none') { setForm({ ...form, assigneeId: '', assigneeName: '' }); return; } const m = members.find((x) => x.id === v); setForm({ ...form, assigneeId: v, assigneeName: m?.name || '' }); }}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent><SelectItem value="none">Unassigned</SelectItem>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Related to</Label><RelatedSelect value={form} onChange={(rel) => setForm({ ...form, ...rel })} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
              </Select></div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={!form.title.trim() || submitting} className="w-full sm:w-auto">{submitting ? 'Saving…' : 'Add task'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Tasks({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const role = session.user.role;
  const canCreate = can(role, 'tasks:create');
  const canUpdate = can(role, 'tasks:update');
  const canDelete = can(role, 'tasks:delete');
  const load = async () => { setLoading(true); try { const d = await api('/tasks'); setItems(d.tasks || []); } catch (e) { toast.error(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const toggle = async (t) => { try { await api(`/tasks/${t.id}`, { method: 'PUT', body: JSON.stringify({ status: t.status === 'open' ? 'completed' : 'open' }) }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const remove = async (id) => { try { await api(`/tasks/${id}`, { method: 'DELETE' }); toast.success('Task deleted'); load(); } catch (e) { toast.error(e.message); } };
  const isEmpty = !loading && items.length === 0;
  const renderActions = (t) => (
    <div className="flex items-center gap-1">
      {canUpdate && <Button variant="ghost" size="icon" title={t.status === 'open' ? 'Mark completed' : 'Reopen'} onClick={() => toggle(t)}><CheckCircle2 className={`h-4 w-4 ${t.status === 'completed' ? 'text-emerald-600' : 'text-muted-foreground'}`} /></Button>}
      {canDelete && <Button variant="ghost" size="icon" title="Delete" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold">Tasks</h2><p className="text-sm text-muted-foreground">Assign work to your team across the CRM.</p></div>
        {canCreate && !isEmpty && <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Add task</Button>}
      </div>
      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}
      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><ListTodo className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No tasks yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Create a task and assign it to a team member.</p></div>
          {canCreate && <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add task</Button>}
        </CardContent></Card>
      )}
      {!loading && items.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Assigned to</TableHead><TableHead>Related to</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-muted-foreground">{t.assigneeName || 'Unassigned'}</TableCell>
                    <TableCell className="text-muted-foreground">{t.relatedName || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{t.dueDate ? formatJoined(t.dueDate) : '—'}</TableCell>
                    <TableCell><MetaBadge meta={TASK_STATUS_META[t.status] || TASK_STATUS_META.open} /></TableCell>
                    <TableCell className="text-right"><div className="flex justify-end">{renderActions(t)}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {items.map((t) => (
              <Card key={t.id}><CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="truncate font-semibold">{t.title}</div><div className="truncate text-sm text-muted-foreground">{t.assigneeName || 'Unassigned'}{t.relatedName ? ` · ${t.relatedName}` : ''}</div></div>
                  <MetaBadge meta={TASK_STATUS_META[t.status] || TASK_STATUS_META.open} />
                </div>
                <div className="flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">Due {t.dueDate ? formatJoined(t.dueDate) : '—'}</span>{renderActions(t)}</div>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
      {canCreate && <TaskFormDialog open={addOpen} setOpen={setAddOpen} onSaved={load} />}
    </div>
  );
}

// ---- Activities (read-only timeline) ----
const ACTIVITY_META = {
  lead_created:     { icon: UserPlus,      color: 'text-sky-600 bg-sky-50' },
  client_created:   { icon: Contact,       color: 'text-emerald-600 bg-emerald-50' },
  status_changed:   { icon: ArrowRight,    color: 'text-amber-600 bg-amber-50' },
  followup_created: { icon: CalendarClock, color: 'text-indigo-600 bg-indigo-50' },
  task_created:     { icon: ListTodo,      color: 'text-violet-600 bg-violet-50' },
};

function Activities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { setLoading(true); try { const d = await api('/activities'); setItems(d.activities || []); } catch (e) { toast.error(e.message); } finally { setLoading(false); } })(); }, []);
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold">Activities</h2><p className="text-sm text-muted-foreground">A timeline of what&apos;s happening across your CRM.</p></div>
      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}
      {!loading && items.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Activity className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No activity yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Activity is recorded automatically as you create leads, clients, follow-ups and tasks.</p></div>
        </CardContent></Card>
      )}
      {!loading && items.length > 0 && (
        <Card><CardContent className="p-0">
          <ul className="divide-y divide-border">
            {items.map((a) => {
              const meta = ACTIVITY_META[a.type] || { icon: Activity, color: 'text-muted-foreground bg-muted' };
              const Icon = meta.icon;
              return (
                <li key={a.id} className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.color}`}><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{a.message}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent></Card>
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
