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
  FileText, FilePlus, Copy, FileDown, MapPin,
  Package, Map, Clock, Utensils, Car, BedDouble,
  ChevronDown, ChevronUp, CalendarDays,
  Store, Phone, Mail, ClipboardList, Wallet, Truck,
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
  {
    group: 'Quotations',
    items: [
      { id: 'quotations', label: 'Quotations', icon: FileText },
      { id: 'quote-create', label: 'Create Quotation', icon: FilePlus },
    ],
  },
  {
    group: 'Travel Operations',
    items: [
      { id: 'packages', label: 'Packages', icon: Package },
      { id: 'itineraries', label: 'Itineraries', icon: Map },
      { id: 'suppliers', label: 'Suppliers', icon: Store },
      { id: 'bookings', label: 'Bookings', icon: ClipboardList },
      { id: 'fleet', label: 'Fleet', icon: Truck },
    ],
  },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Building2 },
];

const SECTION_TITLES = {
  overview: 'Overview', crm: 'CRM Dashboard', leads: 'Leads', clients: 'Clients',
  contacts: 'Contacts', followups: 'Follow-ups', tasks: 'Tasks', activities: 'Activities',
  quotations: 'Quotations', 'quote-create': 'Create Quotation',
  packages: 'Packages', itineraries: 'Itineraries',
  suppliers: 'Suppliers',
  bookings: 'Bookings',
  fleet: 'Fleet',
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
  const [navPayload, setNavPayload] = useState(null);
  const { user, agency } = session;
  const go = (id) => { setActive(id); setMenuOpen(false); };
  const navigateTo = (id, payload = null) => { setNavPayload(payload); setActive(id); setMenuOpen(false); };

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
          {active === 'quotations' && <Quotations key="q-list" session={session} initialView="list" onNavigate={navigateTo} />}
          {active === 'quote-create' && <Quotations key="q-create" session={session} initialView="create" onNavigate={navigateTo} />}
          {active === 'packages' && <Packages key="pkg" session={session} navPayload={navPayload} onConsumePayload={() => setNavPayload(null)} />}
          {active === 'itineraries' && <Itineraries key="itin" session={session} />}
          {active === 'suppliers' && <Suppliers key="sup" session={session} />}
          {active === 'bookings' && <Bookings key="bk" session={session} navPayload={navPayload} onConsumePayload={() => setNavPayload(null)} />}
          {active === 'fleet' && <Fleet key="fleet" session={session} />}
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
  quotation_created: { icon: FileText,      color: 'text-teal-600 bg-teal-50' },
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

// ======================= QUOTATIONS =======================

const QUOTE_STATUS_META = {
  draft:    { label: 'Draft',    cls: 'bg-muted text-muted-foreground border-border' },
  sent:     { label: 'Sent',     cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  expired:  { label: 'Expired',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};
const QUOTE_STATUS_OPTIONS = Object.keys(QUOTE_STATUS_META);
const QUOTE_CATEGORIES = ['Hotel', 'Transport', 'Activity', 'Meal', 'Guide', 'Other'];

function QuoteStatusBadge({ status }) { return <MetaBadge meta={QUOTE_STATUS_META[status] || QUOTE_STATUS_META.draft} />; }
function money(n) { const v = Number(n) || 0; return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function travelDates(q) {
  if (q.startDate && q.endDate) return `${formatJoined(q.startDate)} → ${formatJoined(q.endDate)}`;
  if (q.startDate) return formatJoined(q.startDate);
  return '—';
}

// Mirror of the server's authoritative pricing — used for a live preview only.
function computeTotalsFE(items, discount, tax) {
  const norm = items.map((it) => {
    const q = Math.max(0, Number(it.quantity) || 0);
    const uc = Math.max(0, Number(it.unitCost) || 0);
    const sp = Math.max(0, Number(it.sellingPrice) || 0);
    return { total: q * sp, cost: q * uc };
  });
  const subtotal = norm.reduce((s, i) => s + i.total, 0);
  const internalCost = norm.reduce((s, i) => s + i.cost, 0);
  let discountAmount = discount.type === 'percent'
    ? subtotal * Math.min(Number(discount.value) || 0, 100) / 100
    : (Number(discount.value) || 0);
  discountAmount = Math.min(discountAmount, subtotal);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * Math.min(Math.max(0, Number(tax.percent) || 0), 100) / 100;
  const grandTotal = taxable + taxAmount;
  const expectedProfit = taxable - internalCost;
  return { subtotal, internalCost, discountAmount, taxable, taxAmount, grandTotal, expectedProfit };
}

// ---- Customer picker (reuses CRM clients + leads, no duplication) ----
function CustomerPicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const [c, l] = await Promise.all([api('/clients'), api('/leads')]);
        setOpts([
          ...(c.clients || []).map((x) => ({ key: `client:${x.id}`, type: 'client', id: x.id, name: x.name })),
          ...(l.leads || []).map((x) => ({ key: `lead:${x.id}`, type: 'lead', id: x.id, name: x.name })),
        ]);
      } catch { /* non-blocking */ }
    })();
  }, []);
  const current = value?.customerId ? `${value.customerType}:${value.customerId}` : '';
  return (
    <Select value={current} onValueChange={(v) => { const o = opts.find((x) => x.key === v); if (o) onChange({ customerType: o.type, customerId: o.id, customerName: o.name }); }}>
      <SelectTrigger><SelectValue placeholder="Select a client or lead" /></SelectTrigger>
      <SelectContent>
        {opts.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No clients or leads yet</div>}
        {opts.map((o) => <SelectItem key={o.key} value={o.key}>{o.name} · {o.type}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

const BLANK_ITEM = () => ({ _k: Math.random().toString(36).slice(2), category: 'Hotel', description: '', quantity: 1, unitCost: 0, markup: '', sellingPrice: 0 });

function QuotationForm({ session, mode, quotationId, onDone, onCancel }) {
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customerType: 'client', customerId: '', customerName: '',
    destination: '', startDate: '', endDate: '', adults: 2, children: 0, rooms: 1, nights: 0,
    internalNotes: '', customerNotes: '',
    discount: { type: 'fixed', value: 0 }, tax: { percent: 0 },
  });
  const [items, setItems] = useState([BLANK_ITEM()]);

  useEffect(() => {
    if (mode === 'edit' && quotationId) {
      (async () => {
        try {
          const { quotation: q } = await api(`/quotations/${quotationId}`);
          setForm({
            customerType: q.customerType, customerId: q.customerId, customerName: q.customerName,
            destination: q.destination || '', startDate: q.startDate || '', endDate: q.endDate || '',
            adults: q.adults || 0, children: q.children || 0, rooms: q.rooms || 0, nights: q.nights || 0,
            internalNotes: q.internalNotes || '', customerNotes: q.customerNotes || '',
            discount: q.discount || { type: 'fixed', value: 0 }, tax: q.tax || { percent: 0 },
          });
          setItems((q.items || []).map((it) => ({ ...it, _k: Math.random().toString(36).slice(2), markup: '' })));
        } catch (e) { setError(friendlyError(e)); }
        finally { setLoading(false); }
      })();
    }
  }, [mode, quotationId]);

  const updateItem = (k, patch) => setItems((prev) => prev.map((it) => {
    if (it._k !== k) return it;
    const next = { ...it, ...patch };
    if (('unitCost' in patch || 'markup' in patch) && next.markup !== '' && next.markup != null) {
      next.sellingPrice = Math.round((Number(next.unitCost) || 0) * (1 + (Number(next.markup) || 0) / 100) * 100) / 100;
    }
    return next;
  }));
  const addItem = () => setItems((prev) => [...prev, BLANK_ITEM()]);
  const removeItem = (k) => setItems((prev) => (prev.length > 1 ? prev.filter((it) => it._k !== k) : prev));

  // Auto-fill nights from dates (still editable).
  const setDates = (patch) => setForm((f) => {
    const next = { ...f, ...patch };
    if (next.startDate && next.endDate && next.endDate >= next.startDate) {
      const d = Math.round((new Date(next.endDate) - new Date(next.startDate)) / 86400000);
      next.nights = d;
    }
    return next;
  });

  const totals = computeTotalsFE(items, form.discount, form.tax);
  const canSubmit = !!form.customerId && !!form.destination.trim() && (!form.startDate || !form.endDate || form.endDate >= form.startDate);

  const submit = async () => {
    setError('');
    if (!form.customerId) return setError('Please select a client or lead.');
    if (!form.destination.trim()) return setError('Destination is required.');
    if (form.startDate && form.endDate && form.endDate < form.startDate) return setError('Travel end date must be on or after the start date.');
    setSubmitting(true);
    try {
      const payload = {
        customerType: form.customerType, customerId: form.customerId,
        destination: form.destination.trim(), startDate: form.startDate, endDate: form.endDate,
        adults: form.adults, children: form.children, rooms: form.rooms, nights: form.nights,
        internalNotes: form.internalNotes, customerNotes: form.customerNotes,
        discount: { type: form.discount.type, value: Number(form.discount.value) || 0 },
        tax: { percent: Number(form.tax.percent) || 0 },
        items: items.map((it) => ({ category: it.category, description: it.description, quantity: Number(it.quantity) || 0, unitCost: Number(it.unitCost) || 0, sellingPrice: Number(it.sellingPrice) || 0 })),
      };
      const res = mode === 'edit'
        ? await api(`/quotations/${quotationId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/quotations', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(mode === 'edit' ? 'Quotation updated' : 'Quotation created');
      onDone(res.quotation);
    } catch (e) { setError(friendlyError(e)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h2 className="text-xl font-bold">{mode === 'edit' ? 'Edit quotation' : 'Create quotation'}</h2>
          <p className="text-sm text-muted-foreground">Build a travel quotation for a client or lead.</p></div>
      </div>
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card><CardContent className="space-y-4 p-4">
            <h3 className="font-semibold">Trip details</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Client / Lead</Label><CustomerPicker value={form} onChange={(c) => setForm({ ...form, ...c })} /></div>
              <div className="space-y-1.5"><Label>Destination</Label><Input value={form.destination} placeholder="e.g. Bali, Indonesia" onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Travel start</Label><Input type="date" value={form.startDate} onChange={(e) => setDates({ startDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Travel end</Label><Input type="date" value={form.endDate} onChange={(e) => setDates({ endDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5"><Label>Adults</Label><Input type="number" min="0" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Children</Label><Input type="number" min="0" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Rooms</Label><Input type="number" min="0" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Nights</Label><Input type="number" min="0" value={form.nights} onChange={(e) => setForm({ ...form, nights: e.target.value })} /></div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold">Line items</h3>
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add item</Button></div>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it._k} className="rounded-lg border border-border p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                    <div className="col-span-2 sm:col-span-3 space-y-1"><Label className="text-xs">Category</Label>
                      <Select value={it.category} onValueChange={(v) => updateItem(it._k, { category: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{QUOTE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="col-span-2 sm:col-span-9 space-y-1"><Label className="text-xs">Description</Label>
                      <Input className="h-9" value={it.description} placeholder="Describe this item" onChange={(e) => updateItem(it._k, { description: e.target.value })} /></div>
                    <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Qty</Label>
                      <Input className="h-9" type="number" min="0" value={it.quantity} onChange={(e) => updateItem(it._k, { quantity: e.target.value })} /></div>
                    <div className="space-y-1 sm:col-span-3"><Label className="text-xs">Unit cost</Label>
                      <Input className="h-9" type="number" min="0" value={it.unitCost} onChange={(e) => updateItem(it._k, { unitCost: e.target.value })} /></div>
                    <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Markup %</Label>
                      <Input className="h-9" type="number" min="0" placeholder="opt." value={it.markup} onChange={(e) => updateItem(it._k, { markup: e.target.value })} /></div>
                    <div className="space-y-1 sm:col-span-3"><Label className="text-xs">Sell price</Label>
                      <Input className="h-9" type="number" min="0" value={it.sellingPrice} onChange={(e) => updateItem(it._k, { sellingPrice: e.target.value, markup: '' })} /></div>
                    <div className="flex items-end justify-between gap-2 sm:col-span-2">
                      <div className="min-w-0"><Label className="text-xs">Total</Label><div className="h-9 flex items-center font-medium">{money((Number(it.quantity) || 0) * (Number(it.sellingPrice) || 0))}</div></div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(it._k)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>

          <Card><CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Internal notes (private)</Label><Textarea value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Customer notes</Label><Textarea value={form.customerNotes} onChange={(e) => setForm({ ...form, customerNotes: e.target.value })} /></div>
          </CardContent></Card>
        </div>

        <div className="space-y-4">
          <Card><CardContent className="space-y-3 p-4">
            <h3 className="font-semibold">Pricing</h3>
            <div className="space-y-1.5"><Label>Discount</Label>
              <div className="flex gap-2">
                <Select value={form.discount.type} onValueChange={(v) => setForm({ ...form, discount: { ...form.discount, type: v } })}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="percent">Percent</SelectItem></SelectContent>
                </Select>
                <Input type="number" min="0" value={form.discount.value} onChange={(e) => setForm({ ...form, discount: { ...form.discount, value: e.target.value } })} />
              </div></div>
            <div className="space-y-1.5"><Label>Tax %</Label>
              <Input type="number" min="0" max="100" value={form.tax.percent} onChange={(e) => setForm({ ...form, tax: { percent: e.target.value } })} /></div>
            <Separator />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>- {money(totals.discountAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{money(totals.taxAmount)}</span></div>
              <div className="flex justify-between border-t pt-1.5 text-base font-bold"><span>Grand total</span><span>{money(totals.grandTotal)}</span></div>
            </div>
            <div className="rounded-md bg-muted/50 p-2.5 text-sm">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Lock className="h-3 w-3" /> Internal only</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Internal cost</span><span>{money(totals.internalCost)}</span></div>
              <div className="flex justify-between font-medium"><span className="text-muted-foreground">Expected profit</span><span className={totals.expectedProfit < 0 ? 'text-destructive' : 'text-emerald-600'}>{money(totals.expectedProfit)}</span></div>
            </div>
          </CardContent></Card>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={!canSubmit || submitting}>{submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Create quotation')}</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuotationDetail({ session, quotationId, onBack, onEdit, onChanged, onNavigate }) {
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const role = session.user.role;
  const canUpdate = can(role, 'quotations:update');
  const canDelete = can(role, 'quotations:delete');
  const canCreate = can(role, 'quotations:create');
  const canCreatePackage = can(role, 'packages:create');
  const canCreateBooking = can(role, 'bookings:create');

  const load = async () => { setLoading(true); try { const d = await api(`/quotations/${quotationId}`); setQ(d.quotation); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [quotationId]);

  const changeStatus = async (status) => { try { await api(`/quotations/${quotationId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); toast.success('Status updated'); load(); onChanged && onChanged(); } catch (e) { toast.error(friendlyError(e)); } };
  const duplicate = async () => { try { const d = await api(`/quotations/${quotationId}/duplicate`, { method: 'POST' }); toast.success(`Duplicated as ${d.quotation.quotationNumber}`); onChanged && onChanged(); onEdit(d.quotation.id); } catch (e) { toast.error(friendlyError(e)); } };
  const remove = async () => { try { await api(`/quotations/${quotationId}`, { method: 'DELETE' }); toast.success('Draft deleted'); onBack(true); } catch (e) { toast.error(friendlyError(e)); } };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  if (!q) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Quotation not found.</CardContent></Card>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => onBack(false)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2"><h2 className="text-xl font-bold">{q.quotationNumber}</h2><QuoteStatusBadge status={q.status} /></div>
            <p className="text-sm text-muted-foreground">{q.customerName} · {q.destination}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && <Button variant="outline" size="sm" onClick={() => onEdit(q.id)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
          {canCreate && <Button variant="outline" size="sm" onClick={duplicate}><Copy className="h-4 w-4 mr-1" /> Duplicate</Button>}
          {canCreatePackage && onNavigate && <Button variant="outline" size="sm" onClick={() => onNavigate('packages', { createFromQuotation: q })}><Package className="h-4 w-4 mr-1" /> Create package</Button>}
          {canCreateBooking && onNavigate && <Button variant="outline" size="sm" onClick={() => onNavigate('bookings', { convertToBooking: q })}><CheckCircle2 className="h-4 w-4 mr-1" /> Convert to Booking</Button>}
          <Button variant="outline" size="sm" disabled title="Available in a later phase"><FileDown className="h-4 w-4 mr-1" /> PDF (soon)</Button>
          {canDelete && q.status === 'draft' && <Button variant="outline" size="sm" onClick={remove}><Trash2 className="h-4 w-4 mr-1 text-destructive" /> Delete</Button>}
        </div>
      </div>

      {canUpdate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Change status:</span>
          <Select value={q.status} onValueChange={changeStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{QUOTE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{QUOTE_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled title="Available after the Booking module is built"><ArrowRight className="h-4 w-4 mr-1" /> Convert to Booking (soon)</Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card><CardContent className="p-4">
            <h3 className="mb-3 font-semibold">Trip</h3>
            <div className="grid grid-cols-2 gap-x-4">
              <ClientDetailRow label="Customer" value={q.customerName} />
              <ClientDetailRow label="Destination" value={q.destination} />
              <ClientDetailRow label="Travel dates" value={travelDates(q)} />
              <ClientDetailRow label="Nights" value={q.nights || '—'} />
              <ClientDetailRow label="Travelers" value={`${q.adults || 0} adults · ${q.children || 0} children`} />
              <ClientDetailRow label="Rooms" value={q.rooms || '—'} />
            </div>
          </CardContent></Card>

          <Card className="overflow-hidden"><CardContent className="p-0">
            <div className="p-4 pb-0 font-semibold">Items</div>
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {(q.items || []).map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.category}</TableCell>
                    <TableCell className="text-muted-foreground">{it.description || '—'}</TableCell>
                    <TableCell className="text-right">{it.quantity}</TableCell>
                    <TableCell className="text-right">{money(it.sellingPrice)}</TableCell>
                    <TableCell className="text-right">{money(it.total)}</TableCell>
                  </TableRow>
                ))}
                {(!q.items || q.items.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No items</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>

          {(q.customerNotes || q.internalNotes) && (
            <Card><CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div><div className="mb-1 text-xs text-muted-foreground">Customer notes</div><p className="whitespace-pre-wrap text-sm">{q.customerNotes || '—'}</p></div>
              <div><div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Internal notes</div><p className="whitespace-pre-wrap text-sm">{q.internalNotes || '—'}</p></div>
            </CardContent></Card>
          )}
        </div>

        <div className="space-y-4">
          <Card><CardContent className="space-y-1.5 p-4 text-sm">
            <h3 className="mb-2 font-semibold">Totals</h3>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(q.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>- {money(q.discountAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{money(q.taxAmount)}</span></div>
            <div className="flex justify-between border-t pt-1.5 text-base font-bold"><span>Grand total</span><span>{money(q.grandTotal)}</span></div>
          </CardContent></Card>
          <Card><CardContent className="space-y-1.5 p-4 text-sm">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Lock className="h-3 w-3" /> Internal only</div>
            <div className="flex justify-between"><span className="text-muted-foreground">Internal cost</span><span>{money(q.internalCost)}</span></div>
            <div className="flex justify-between font-medium"><span className="text-muted-foreground">Expected profit</span><span className={q.expectedProfit < 0 ? 'text-destructive' : 'text-emerald-600'}>{money(q.expectedProfit)}</span></div>
          </CardContent></Card>
          <Card><CardContent className="space-y-1 p-4 text-xs text-muted-foreground">
            <div>Created {formatJoined(q.createdAt)}</div>
            <div>Updated {formatJoined(q.updatedAt)}</div>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}

function QuotationList({ session, onCreate, onOpen }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const canCreate = can(session.user.role, 'quotations:create');
  useEffect(() => { (async () => { setLoading(true); try { const d = await api('/quotations'); setRows(d.quotations || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, []);
  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    const mq = !q || [r.quotationNumber, r.customerName, r.destination].some((f) => String(f || '').toLowerCase().includes(q));
    const ms = statusFilter === 'all' || r.status === statusFilter;
    return mq && ms;
  });
  const isEmpty = !loading && rows.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold">Quotations</h2><p className="text-sm text-muted-foreground">Create and manage travel quotations for your customers.</p></div>
        {canCreate && !isEmpty && <Button onClick={onCreate} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Create quotation</Button>}
      </div>

      {!isEmpty && !loading && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search number, customer or destination" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{QUOTE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{QUOTE_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}

      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><FileText className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No quotations yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Create your first quotation for a client or lead to kick off the sales workflow.</p></div>
          {canCreate && <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1.5" /> Create quotation</Button>}
        </CardContent></Card>
      )}

      {!loading && rows.length > 0 && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No quotations match your filters.</CardContent></Card>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Destination</TableHead>
                <TableHead>Travel dates</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                    <TableCell className="font-medium">{r.quotationNumber}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.destination}</TableCell>
                    <TableCell className="text-muted-foreground">{travelDates(r)}</TableCell>
                    <TableCell className="text-right font-medium">{money(r.grandTotal)}</TableCell>
                    <TableCell><QuoteStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatJoined(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}><CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="truncate font-semibold">{r.quotationNumber}</div><div className="truncate text-sm text-muted-foreground">{r.customerName} · {r.destination}</div></div>
                  <QuoteStatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">{travelDates(r)}</span>
                  <span className="font-semibold">{money(r.grandTotal)}</span>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Quotations({ session, initialView = 'list', onNavigate }) {
  const [view, setView] = useState(initialView);
  const [selectedId, setSelectedId] = useState(null);
  const openDetail = (id) => { setSelectedId(id); setView('detail'); };
  const openEdit = (id) => { setSelectedId(id); setView('edit'); };
  if (view === 'create') return <QuotationForm session={session} mode="create" onDone={(q) => openDetail(q.id)} onCancel={() => setView('list')} />;
  if (view === 'edit') return <QuotationForm session={session} mode="edit" quotationId={selectedId} onDone={(q) => openDetail(q.id)} onCancel={() => openDetail(selectedId)} />;
  if (view === 'detail') return <QuotationDetail session={session} quotationId={selectedId} onBack={() => setView('list')} onEdit={openEdit} onChanged={() => {}} onNavigate={onNavigate} />;
  return <QuotationList session={session} onCreate={() => setView('create')} onOpen={openDetail} />;
}

// ======================= PACKAGES & ITINERARIES =======================

const PACKAGE_STATUS_META = {
  draft:     { label: 'Draft',     cls: 'bg-muted text-muted-foreground border-border' },
  active:    { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};
const PACKAGE_STATUS_OPTIONS = Object.keys(PACKAGE_STATUS_META);
function PackageStatusBadge({ status }) { return <MetaBadge meta={PACKAGE_STATUS_META[status] || PACKAGE_STATUS_META.draft} />; }

function travelerSummary(p) {
  const bits = [];
  const a = Number(p.adults) || 0, c = Number(p.children) || 0, n = Number(p.nights) || 0;
  if (a) bits.push(`${a} adult${a > 1 ? 's' : ''}`);
  if (c) bits.push(`${c} child${c > 1 ? 'ren' : ''}`);
  if (n) bits.push(`${n} night${n > 1 ? 's' : ''}`);
  return bits.length ? bits.join(' · ') : '—';
}

// ---- Itinerary day/activity factories + client-side normalization ----
function blankActivity() {
  return { id: 'a' + Math.random().toString(36).slice(2), name: '', description: '', location: '', startTime: '', endTime: '', notes: '' };
}
function blankDay(n) {
  return {
    id: 'd' + Math.random().toString(36).slice(2),
    dayNumber: n, date: '', title: '', description: '', location: '', startTime: '', endTime: '', notes: '',
    activities: [],
    meals: { breakfast: '', lunch: '', dinner: '' },
    transport: { type: '', pickupLocation: '', dropLocation: '', pickupTime: '', notes: '' },
    accommodation: { name: '', location: '', checkIn: '', checkOut: '', roomNotes: '' },
  };
}
function normalizeDayClient(d) {
  const base = blankDay(d.dayNumber || 1);
  return {
    ...base, ...d,
    meals: { ...base.meals, ...(d.meals || {}) },
    transport: { ...base.transport, ...(d.transport || {}) },
    accommodation: { ...base.accommodation, ...(d.accommodation || {}) },
    activities: (d.activities || []).map((a) => ({ ...blankActivity(), ...a })),
  };
}

// ----------------------------- PACKAGE LIST -----------------------------
function PackageList({ session, onCreate, onOpen }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const canCreate = can(session.user.role, 'packages:create');
  useEffect(() => { (async () => { setLoading(true); try { const d = await api('/packages'); setRows(d.packages || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, []);
  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    const mq = !q || [r.name, r.customerName, r.destination].some((f) => String(f || '').toLowerCase().includes(q));
    const ms = statusFilter === 'all' || r.status === statusFilter;
    return mq && ms;
  });
  const isEmpty = !loading && rows.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold">Packages</h2><p className="text-sm text-muted-foreground">Build complete travel offerings for your clients and leads.</p></div>
        {canCreate && !isEmpty && <Button onClick={onCreate} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Create package</Button>}
      </div>

      {!isEmpty && !loading && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, customer or destination" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{PACKAGE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{PACKAGE_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}

      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Package className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No packages yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Create your first travel package for a client or lead. You can start from scratch or link an existing quotation.</p></div>
          {canCreate && <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1.5" /> Create package</Button>}
        </CardContent></Card>
      )}

      {!loading && rows.length > 0 && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No packages match your filters.</CardContent></Card>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Package</TableHead><TableHead>Customer</TableHead><TableHead>Destination</TableHead>
                <TableHead>Travel dates</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.destination}</TableCell>
                    <TableCell className="text-muted-foreground">{travelDates(r)}</TableCell>
                    <TableCell><PackageStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatJoined(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}><CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="truncate font-semibold">{r.name}</div><div className="truncate text-sm text-muted-foreground">{r.customerName} · {r.destination}</div></div>
                  <PackageStatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                  <span>{travelDates(r)}</span>
                  <span>{formatJoined(r.createdAt)}</span>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// -------------------------- QUOTATION PICKER (optional) --------------------------
function QuotationPicker({ value, onChange, onPick }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/quotations'); setOpts(d.quotations || []); } catch { /* non-blocking */ } })(); }, []);
  return (
    <Select value={value || 'none'} onValueChange={(v) => { if (v === 'none') { onChange(''); } else { onChange(v); const o = opts.find((x) => x.id === v); if (o && onPick) onPick(o); } }}>
      <SelectTrigger><SelectValue placeholder="No quotation" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No quotation</SelectItem>
        {opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.quotationNumber} · {o.customerName}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ----------------------------- PACKAGE FORM -----------------------------
function PackageForm({ session, mode, packageId, prefill, onDone, onCancel }) {
  const [form, setForm] = useState({ name: '', destination: '', startDate: '', endDate: '', adults: 0, children: 0, nights: 0, description: '', quotationId: '' });
  const [customer, setCustomer] = useState({ customerType: '', customerId: '', customerName: '' });
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && packageId) {
      (async () => { setLoading(true); try {
        const { package: p } = await api(`/packages/${packageId}`);
        setForm({ name: p.name || '', destination: p.destination || '', startDate: p.startDate || '', endDate: p.endDate || '', adults: p.adults || 0, children: p.children || 0, nights: p.nights || 0, description: p.description || '', quotationId: p.quotationId || '' });
        setCustomer({ customerType: p.customerType, customerId: p.customerId, customerName: p.customerName });
      } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })();
    } else if (prefill) {
      setForm((f) => ({ ...f, name: prefill.name || '', destination: prefill.destination || '', startDate: prefill.startDate || '', endDate: prefill.endDate || '', adults: prefill.adults || 0, children: prefill.children || 0, nights: prefill.nights || 0, quotationId: prefill.quotationId || '' }));
      setCustomer({ customerType: prefill.customerType, customerId: prefill.customerId, customerName: prefill.customerName });
    }
  }, [mode, packageId]);

  const applyQuotation = (qo) => {
    setForm((f) => ({ ...f, destination: qo.destination || f.destination, startDate: qo.startDate || f.startDate, endDate: qo.endDate || f.endDate, adults: qo.adults || f.adults, children: qo.children || f.children, nights: qo.nights || f.nights }));
    setCustomer({ customerType: qo.customerType, customerId: qo.customerId, customerName: qo.customerName });
  };

  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }));
  const canSubmit = form.name.trim() && customer.customerId && form.destination.trim();

  const submit = async () => {
    if (!canSubmit) { toast.error('Name, customer and destination are required'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, customerType: customer.customerType, customerId: customer.customerId };
      const res = mode === 'edit'
        ? await api(`/packages/${packageId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/packages', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(mode === 'edit' ? 'Package updated' : 'Package created');
      onDone(res.package);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h2 className="text-xl font-bold">{mode === 'edit' ? 'Edit package' : 'Create package'}</h2>
          <p className="text-sm text-muted-foreground">Reuse an existing client or lead — no duplicate customer records are created.</p></div>
      </div>
      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Package name</Label><Input value={form.name} placeholder="Goa Honeymoon — 5 Nights" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Client or lead</Label><CustomerPicker value={customer} onChange={setCustomer} /></div>
        <div className="space-y-1.5"><Label>Linked quotation <span className="text-muted-foreground">(optional)</span></Label><QuotationPicker value={form.quotationId} onChange={(v) => setForm((f) => ({ ...f, quotationId: v }))} onPick={applyQuotation} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Destination</Label><Input value={form.destination} placeholder="Goa, India" onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Adults</Label><Input type="number" min="0" value={form.adults} onChange={setNum('adults')} /></div>
        <div className="space-y-1.5"><Label>Children</Label><Input type="number" min="0" value={form.children} onChange={setNum('children')} /></div>
        <div className="space-y-1.5"><Label>Nights</Label><Input type="number" min="0" value={form.nights} onChange={setNum('nights')} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} rows={4} placeholder="Overview of the package, inclusions, highlights…" onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      </CardContent></Card>
      <div className="flex gap-2">
        <Button className="flex-1 sm:flex-none" onClick={submit} disabled={!canSubmit || submitting}>{submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Create package')}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ----------------------------- PACKAGE DETAIL -----------------------------
function PkgRow({ label, value }) {
  return (<div className="flex items-start justify-between gap-4 py-1.5"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-right">{value || '—'}</span></div>);
}

function PackageDetail({ session, packageId, onBack, onEdit }) {
  const role = session.user.role;
  const canUpdate = can(role, 'packages:update');
  const canDelete = can(role, 'packages:delete');
  const canItinCreate = can(role, 'itineraries:create');
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itin, setItin] = useState(null);
  const [editingItin, setEditingItin] = useState(false);

  const load = async () => { setLoading(true); try { const d = await api(`/packages/${packageId}`); setP(d.package); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [packageId]);

  useEffect(() => {
    if (p && p.itineraryId) { (async () => { try { const d = await api(`/itineraries/${p.itineraryId}`); setItin(d.itinerary); } catch { setItin(null); } })(); }
    else setItin(null);
  }, [p && p.itineraryId]);

  const changeStatus = async (status) => { try { const d = await api(`/packages/${packageId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); setP(d.package); toast.success('Status updated'); } catch (e) { toast.error(friendlyError(e)); } };
  const createItinerary = async () => { try { const d = await api('/itineraries', { method: 'POST', body: JSON.stringify({ packageId }) }); setItin(d.itinerary); setP((prev) => ({ ...prev, itineraryId: d.itinerary.id })); setEditingItin(true); toast.success('Itinerary created'); } catch (e) { toast.error(friendlyError(e)); } };
  const remove = async () => { try { await api(`/packages/${packageId}`, { method: 'DELETE' }); toast.success('Draft package deleted'); onBack(); } catch (e) { toast.error(friendlyError(e)); } };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  if (!p) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Package not found.</CardContent></Card>;

  if (editingItin && itin) {
    return <ItineraryEditor session={session} itineraryId={itin.id} heading={`Itinerary · ${p.name}`} onBack={() => setEditingItin(false)} onSaved={(it) => { setItin(it); setEditingItin(false); }} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">{p.name}</h2><PackageStatusBadge status={p.status} /></div>
            <p className="text-sm text-muted-foreground">{p.customerName} · {p.destination}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && <Button variant="outline" size="sm" onClick={() => onEdit(p.id)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
          {canDelete && p.status === 'draft' && <Button variant="outline" size="sm" onClick={remove}><Trash2 className="h-4 w-4 mr-1 text-destructive" /> Delete</Button>}
        </div>
      </div>

      {canUpdate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Change status:</span>
          <Select value={p.status} onValueChange={changeStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{PACKAGE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{PACKAGE_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled title="Available after the Booking module is built"><ArrowRight className="h-4 w-4 mr-1" /> Convert to Booking (soon)</Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardContent className="p-5">
          <PkgRow label="Customer" value={p.customerName} />
          <PkgRow label="Destination" value={p.destination} />
          <PkgRow label="Travel dates" value={travelDates(p)} />
          <PkgRow label="Travelers" value={travelerSummary(p)} />
          <PkgRow label="Related quotation" value={p.quotationNumber} />
          <Separator className="my-2" />
          <PkgRow label="Created" value={formatJoined(p.createdAt)} />
          <PkgRow label="Updated" value={formatJoined(p.updatedAt)} />
          {p.description && (<><Separator className="my-2" /><div className="pt-1"><div className="text-sm text-muted-foreground mb-1">Description</div><p className="text-sm whitespace-pre-wrap">{p.description}</p></div></>)}
        </CardContent></Card>

        <Card className="lg:col-span-2"><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><Map className="h-4 w-4 text-violet-600" /> Itinerary</div>
          {itin ? (
            <>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="font-medium truncate">{itin.title}</div>
                <div className="text-sm text-muted-foreground">{(itin.days || []).length} day{(itin.days || []).length === 1 ? '' : 's'} planned</div>
              </div>
              {can(role, 'itineraries:update') && <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingItin(true)}><Pencil className="h-4 w-4 mr-1" /> Open itinerary builder</Button>}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">No itinerary yet. Create one to start planning day-by-day.</p>
              {canItinCreate && <Button size="sm" className="w-full" onClick={createItinerary}><Plus className="h-4 w-4 mr-1" /> Create itinerary</Button>}
            </>
          )}
        </CardContent></Card>
      </div>

      {itin && !editingItin && (
        <Card><CardContent className="p-5"><ItineraryView itin={itin} /></CardContent></Card>
      )}
    </div>
  );
}

// ----------------------------- ITINERARY EDITOR (day-by-day builder) -----------------------------
function FieldInput({ label, ...props }) {
  return (<div className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label><Input {...props} /></div>);
}

function DayCard({ day, index, open, onToggle, canUpdate, onPatch, onRemove }) {
  const upd = (fn) => onPatch(fn(day));
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <button type="button" onClick={onToggle} className="flex items-center gap-2 min-w-0 text-left">
          {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          <span className="inline-flex h-6 items-center rounded-full bg-violet-600 px-2.5 text-xs font-semibold text-white">Day {day.dayNumber}</span>
          <span className="truncate text-sm font-medium">{day.title || day.location || 'Untitled day'}</span>
        </button>
        {canUpdate && <Button variant="ghost" size="icon" onClick={onRemove} title="Remove day"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
      </div>
      {open && (
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput label="Title" value={day.title} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, title: e.target.value }))} placeholder="Arrival & check-in" />
            <FieldInput label="Date" type="date" value={day.date} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, date: e.target.value }))} />
            <FieldInput label="Location" value={day.location} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, location: e.target.value }))} placeholder="Panaji" />
            <div className="grid grid-cols-2 gap-2">
              <FieldInput label="Start time" type="time" value={day.startTime} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, startTime: e.target.value }))} />
              <FieldInput label="End time" type="time" value={day.endTime} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, endTime: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Day description</Label><Textarea rows={2} value={day.description} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, description: e.target.value }))} placeholder="Overview of the day" /></div>

          {/* Activities */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium"><Clock className="h-4 w-4 text-sky-600" /> Activities</span>
              {canUpdate && <Button variant="outline" size="sm" onClick={() => upd((d) => ({ ...d, activities: [...d.activities, blankActivity()] }))}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>}
            </div>
            {day.activities.length === 0 && <p className="text-xs text-muted-foreground">No activities added.</p>}
            {day.activities.map((a) => (
              <div key={a.id} className="rounded-md bg-muted/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input className="flex-1" value={a.name} disabled={!canUpdate} placeholder="Activity name" onChange={(e) => upd((d) => ({ ...d, activities: d.activities.map((x) => x.id === a.id ? { ...x, name: e.target.value } : x) }))} />
                  {canUpdate && <Button variant="ghost" size="icon" onClick={() => upd((d) => ({ ...d, activities: d.activities.filter((x) => x.id !== a.id) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input value={a.location} disabled={!canUpdate} placeholder="Location" onChange={(e) => upd((d) => ({ ...d, activities: d.activities.map((x) => x.id === a.id ? { ...x, location: e.target.value } : x) }))} />
                  <Input type="time" value={a.startTime} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, activities: d.activities.map((x) => x.id === a.id ? { ...x, startTime: e.target.value } : x) }))} />
                  <Input type="time" value={a.endTime} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, activities: d.activities.map((x) => x.id === a.id ? { ...x, endTime: e.target.value } : x) }))} />
                </div>
                <Textarea rows={1} value={a.description} disabled={!canUpdate} placeholder="Notes / description" onChange={(e) => upd((d) => ({ ...d, activities: d.activities.map((x) => x.id === a.id ? { ...x, description: e.target.value } : x) }))} />
              </div>
            ))}
          </div>

          {/* Meals */}
          <div className="rounded-lg border p-3 space-y-2">
            <span className="flex items-center gap-1.5 text-sm font-medium"><Utensils className="h-4 w-4 text-amber-600" /> Meals</span>
            <div className="grid gap-2 sm:grid-cols-3">
              <FieldInput label="Breakfast" value={day.meals.breakfast} disabled={!canUpdate} placeholder="Included / notes" onChange={(e) => upd((d) => ({ ...d, meals: { ...d.meals, breakfast: e.target.value } }))} />
              <FieldInput label="Lunch" value={day.meals.lunch} disabled={!canUpdate} placeholder="Included / notes" onChange={(e) => upd((d) => ({ ...d, meals: { ...d.meals, lunch: e.target.value } }))} />
              <FieldInput label="Dinner" value={day.meals.dinner} disabled={!canUpdate} placeholder="Included / notes" onChange={(e) => upd((d) => ({ ...d, meals: { ...d.meals, dinner: e.target.value } }))} />
            </div>
          </div>

          {/* Transport */}
          <div className="rounded-lg border p-3 space-y-2">
            <span className="flex items-center gap-1.5 text-sm font-medium"><Car className="h-4 w-4 text-emerald-600" /> Transport</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <FieldInput label="Type" value={day.transport.type} disabled={!canUpdate} placeholder="Private cab / Flight" onChange={(e) => upd((d) => ({ ...d, transport: { ...d.transport, type: e.target.value } }))} />
              <FieldInput label="Pickup time" type="time" value={day.transport.pickupTime} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, transport: { ...d.transport, pickupTime: e.target.value } }))} />
              <FieldInput label="Pickup location" value={day.transport.pickupLocation} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, transport: { ...d.transport, pickupLocation: e.target.value } }))} />
              <FieldInput label="Drop location" value={day.transport.dropLocation} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, transport: { ...d.transport, dropLocation: e.target.value } }))} />
            </div>
          </div>

          {/* Accommodation */}
          <div className="rounded-lg border p-3 space-y-2">
            <span className="flex items-center gap-1.5 text-sm font-medium"><BedDouble className="h-4 w-4 text-rose-600" /> Accommodation</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <FieldInput label="Property name" value={day.accommodation.name} disabled={!canUpdate} placeholder="Taj Resort" onChange={(e) => upd((d) => ({ ...d, accommodation: { ...d.accommodation, name: e.target.value } }))} />
              <FieldInput label="Location" value={day.accommodation.location} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, accommodation: { ...d.accommodation, location: e.target.value } }))} />
              <FieldInput label="Check-in" type="date" value={day.accommodation.checkIn} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, accommodation: { ...d.accommodation, checkIn: e.target.value } }))} />
              <FieldInput label="Check-out" type="date" value={day.accommodation.checkOut} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, accommodation: { ...d.accommodation, checkOut: e.target.value } }))} />
            </div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Room / notes</Label><Input value={day.accommodation.roomNotes} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, accommodation: { ...d.accommodation, roomNotes: e.target.value } }))} /></div>
          </div>

          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Day notes</Label><Textarea rows={2} value={day.notes} disabled={!canUpdate} onChange={(e) => upd((d) => ({ ...d, notes: e.target.value }))} /></div>
        </CardContent>
      )}
    </Card>
  );
}

function ItineraryEditor({ session, itineraryId, heading, onBack, onSaved }) {
  const canUpdate = can(session.user.role, 'itineraries:update');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ title: '', destination: '', startDate: '', endDate: '', notes: '' });
  const [days, setDays] = useState([]);
  const [open, setOpen] = useState({});

  useEffect(() => { (async () => { setLoading(true); try {
    const { itinerary } = await api(`/itineraries/${itineraryId}`);
    setMeta({ title: itinerary.title || '', destination: itinerary.destination || '', startDate: itinerary.startDate || '', endDate: itinerary.endDate || '', notes: itinerary.notes || '' });
    const nd = (itinerary.days || []).map(normalizeDayClient);
    setDays(nd);
    setOpen(nd.length ? { [nd[0].id]: true } : {});
  } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, [itineraryId]);

  const addDay = () => { const d = blankDay(days.length + 1); setDays((x) => [...x, d]); setOpen((o) => ({ ...o, [d.id]: true })); };
  const removeDay = (id) => { setDays((x) => x.filter((d) => d.id !== id).map((d, i) => ({ ...d, dayNumber: i + 1 }))); };
  const patchDay = (id, nextDay) => setDays((x) => x.map((d) => d.id === id ? nextDay : d));

  const save = async () => {
    setSaving(true);
    try {
      const { itinerary } = await api(`/itineraries/${itineraryId}`, { method: 'PUT', body: JSON.stringify({ ...meta, days }) });
      toast.success('Itinerary saved');
      setDays((itinerary.days || []).map(normalizeDayClient));
      onSaved && onSaved(itinerary);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h2 className="text-xl font-bold">{heading || 'Itinerary builder'}</h2>
            <p className="text-sm text-muted-foreground">Plan the trip day by day — activities, meals, transport and stays.</p></div>
        </div>
        <div className="flex gap-2">
          {canUpdate && <Button variant="outline" size="sm" onClick={addDay}><Plus className="h-4 w-4 mr-1" /> Add day</Button>}
          {canUpdate && <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save itinerary'}</Button>}
        </div>
      </div>

      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Itinerary title</Label><Input value={meta.title} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Destination</Label><Input value={meta.destination} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, destination: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={meta.startDate} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, startDate: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={meta.endDate} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, endDate: e.target.value })} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Overall notes</Label><Textarea rows={2} value={meta.notes} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} /></div>
      </CardContent></Card>

      {days.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><CalendarDays className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No days yet</h3><p className="text-sm text-muted-foreground">Add your first day to start building the itinerary.</p></div>
          {canUpdate && <Button onClick={addDay}><Plus className="h-4 w-4 mr-1" /> Add day</Button>}
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {days.map((d, i) => (
          <DayCard key={d.id} day={d} index={i} open={!!open[d.id]} canUpdate={canUpdate}
            onToggle={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))}
            onPatch={(nd) => patchDay(d.id, nd)} onRemove={() => removeDay(d.id)} />
        ))}
      </div>

      {days.length > 0 && canUpdate && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={addDay}><Plus className="h-4 w-4 mr-1" /> Add day</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save itinerary'}</Button>
        </div>
      )}
    </div>
  );
}

// ----------------------------- ITINERARY VIEW (read-only) -----------------------------
function ViewLine({ icon: Icon, label, value }) {
  if (!value) return null;
  return (<div className="flex gap-2 text-sm"><Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" /><span className="text-muted-foreground">{label}:</span><span className="font-medium">{value}</span></div>);
}

function ItineraryView({ itin }) {
  const days = itin.days || [];
  if (days.length === 0) return <p className="text-sm text-muted-foreground">No days have been planned yet.</p>;
  return (
    <div className="space-y-4">
      {days.map((day) => {
        const meals = day.meals || {};
        const t = day.transport || {};
        const acc = day.accommodation || {};
        const mealText = ['breakfast', 'lunch', 'dinner'].filter((k) => meals[k]).map((k) => `${k[0].toUpperCase()}${k.slice(1)}: ${meals[k]}`).join(' · ');
        return (
          <div key={day.id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 items-center rounded-full bg-violet-600 px-3 text-sm font-semibold text-white">Day {day.dayNumber}</span>
                <span className="font-semibold">{day.title || 'Untitled day'}</span>
              </div>
              <div className="text-sm text-muted-foreground">{day.date ? formatJoined(day.date) : ''}{day.location ? `${day.date ? ' · ' : ''}${day.location}` : ''}</div>
            </div>
            {day.description && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{day.description}</p>}

            {(day.activities || []).length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 text-sm font-medium mb-1"><Clock className="h-4 w-4 text-sky-600" /> Activities</div>
                <ul className="space-y-1">
                  {day.activities.map((a) => (
                    <li key={a.id} className="text-sm pl-5">
                      <span className="font-medium">{a.name || 'Activity'}</span>
                      {(a.startTime || a.endTime) && <span className="text-muted-foreground"> · {[a.startTime, a.endTime].filter(Boolean).join('–')}</span>}
                      {a.location && <span className="text-muted-foreground"> · {a.location}</span>}
                      {a.description && <div className="text-muted-foreground">{a.description}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 grid gap-1.5">
              {mealText && <ViewLine icon={Utensils} label="Meals" value={mealText} />}
              {(t.type || t.pickupLocation || t.dropLocation) && <ViewLine icon={Car} label="Transport" value={[t.type, t.pickupLocation && `from ${t.pickupLocation}`, t.dropLocation && `to ${t.dropLocation}`, t.pickupTime && `at ${t.pickupTime}`].filter(Boolean).join(' ')} />}
              {acc.name && <ViewLine icon={BedDouble} label="Stay" value={[acc.name, acc.location, acc.roomNotes].filter(Boolean).join(' · ')} />}
              {day.notes && <ViewLine icon={MapPin} label="Notes" value={day.notes} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------- PACKAGES WORKSPACE -----------------------------
function Packages({ session, navPayload, onConsumePayload }) {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [prefill, setPrefill] = useState(null);

  useEffect(() => {
    if (navPayload && navPayload.createFromQuotation) {
      const q = navPayload.createFromQuotation;
      setPrefill({
        name: q.destination ? `${q.destination} package` : '',
        customerType: q.customerType, customerId: q.customerId, customerName: q.customerName,
        destination: q.destination || '', startDate: q.startDate || '', endDate: q.endDate || '',
        adults: q.adults || 0, children: q.children || 0, nights: q.nights || 0,
        quotationId: q.id, quotationNumber: q.quotationNumber || '',
      });
      setView('create');
      onConsumePayload && onConsumePayload();
    }
  }, [navPayload]);

  const openDetail = (id) => { setSelectedId(id); setView('detail'); };
  const openEdit = (id) => { setSelectedId(id); setView('edit'); };

  if (view === 'create') return <PackageForm session={session} mode="create" prefill={prefill} onDone={(p) => { setPrefill(null); openDetail(p.id); }} onCancel={() => { setPrefill(null); setView('list'); }} />;
  if (view === 'edit') return <PackageForm session={session} mode="edit" packageId={selectedId} onDone={(p) => openDetail(p.id)} onCancel={() => openDetail(selectedId)} />;
  if (view === 'detail') return <PackageDetail session={session} packageId={selectedId} onBack={() => setView('list')} onEdit={openEdit} />;
  return <PackageList session={session} onCreate={() => { setPrefill(null); setView('create'); }} onOpen={openDetail} />;
}

// ----------------------------- ITINERARIES WORKSPACE -----------------------------
function ItineraryViewPage({ session, itineraryId, onBack, onEdit }) {
  const [itin, setItin] = useState(null);
  const [loading, setLoading] = useState(true);
  const canUpdate = can(session.user.role, 'itineraries:update');
  useEffect(() => { (async () => { setLoading(true); try { const d = await api(`/itineraries/${itineraryId}`); setItin(d.itinerary); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, [itineraryId]);
  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  if (!itin) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Itinerary not found.</CardContent></Card>;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h2 className="text-xl font-bold">{itin.title}</h2><p className="text-sm text-muted-foreground">{itin.destination} · {travelDates(itin)}</p></div>
        </div>
        {canUpdate && <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="h-4 w-4 mr-1" /> Edit itinerary</Button>}
      </div>
      {itin.notes && <Card><CardContent className="p-4 text-sm whitespace-pre-wrap">{itin.notes}</CardContent></Card>}
      <Card><CardContent className="p-5"><ItineraryView itin={itin} /></CardContent></Card>
    </div>
  );
}

function Itineraries({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [mode, setMode] = useState('view');

  const load = async () => { setLoading(true); try { const d = await api('/itineraries'); setRows(d.itineraries || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  if (openId) {
    if (mode === 'edit') return <ItineraryEditor session={session} itineraryId={openId} onBack={() => setMode('view')} onSaved={() => { setMode('view'); load(); }} />;
    return <ItineraryViewPage session={session} itineraryId={openId} onBack={() => { setOpenId(null); load(); }} onEdit={() => setMode('edit')} />;
  }

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => !q || [r.title, r.destination].some((f) => String(f || '').toLowerCase().includes(q)));
  const isEmpty = !loading && rows.length === 0;

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold">Itineraries</h2><p className="text-sm text-muted-foreground">Day-by-day plans linked to your packages.</p></div>

      {!isEmpty && !loading && (
        <div className="relative sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or destination" className="pl-9" />
        </div>
      )}

      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}

      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Map className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No itineraries yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Open a package and create an itinerary to start planning day by day.</p></div>
        </CardContent></Card>
      )}

      {!loading && rows.length > 0 && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No itineraries match your search.</CardContent></Card>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Title</TableHead><TableHead>Destination</TableHead><TableHead>Dates</TableHead><TableHead>Days</TableHead><TableHead>Created</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => { setOpenId(r.id); setMode('view'); }}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="text-muted-foreground">{r.destination}</TableCell>
                    <TableCell className="text-muted-foreground">{travelDates(r)}</TableCell>
                    <TableCell className="text-muted-foreground">{(r.days || []).length}</TableCell>
                    <TableCell className="text-muted-foreground">{formatJoined(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="cursor-pointer" onClick={() => { setOpenId(r.id); setMode('view'); }}><CardContent className="space-y-2 p-4">
                <div className="font-semibold truncate">{r.title}</div>
                <div className="text-sm text-muted-foreground truncate">{r.destination} · {(r.days || []).length} day{(r.days || []).length === 1 ? '' : 's'}</div>
                <div className="text-sm text-muted-foreground">{travelDates(r)}</div>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ======================= SUPPLIERS =======================

const SUPPLIER_TYPE_META = {
  hotel: 'Hotel', houseboat: 'Houseboat', transport: 'Transport', activity: 'Activity',
  guide: 'Guide', restaurant: 'Restaurant', other: 'Other',
};
const SUPPLIER_TYPE_OPTIONS = Object.keys(SUPPLIER_TYPE_META);
const SUPPLIER_STATUS_META = {
  active:   { label: 'Active',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactive', cls: 'bg-muted text-muted-foreground border-border' },
};
const SUPPLIER_STATUS_OPTIONS = Object.keys(SUPPLIER_STATUS_META);
function SupplierStatusBadge({ status }) { return <MetaBadge meta={SUPPLIER_STATUS_META[status] || SUPPLIER_STATUS_META.active} />; }
function supplierTypeLabel(t) { return SUPPLIER_TYPE_META[t] || 'Other'; }
function supplierLocation(s) { return [s.city, s.state, s.country].filter(Boolean).join(', ') || '—'; }

// ----------------------------- SUPPLIER LIST -----------------------------
function SupplierList({ session, onCreate, onOpen }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const canCreate = can(session.user.role, 'suppliers:create');
  useEffect(() => { (async () => { setLoading(true); try { const d = await api('/suppliers'); setRows(d.suppliers || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, []);
  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    const mq = !q || [r.name, r.contactPerson, r.phone, r.email, r.city, r.state, r.country].some((f) => String(f || '').toLowerCase().includes(q));
    const mt = typeFilter === 'all' || r.type === typeFilter;
    const ms = statusFilter === 'all' || r.status === statusFilter;
    return mq && mt && ms;
  });
  const isEmpty = !loading && rows.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold">Suppliers</h2><p className="text-sm text-muted-foreground">Manage the hotels, transport, guides and vendors you work with.</p></div>
        {canCreate && !isEmpty && <Button onClick={onCreate} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Add supplier</Button>}
      </div>

      {!isEmpty && !loading && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, contact, phone, email or location" className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-40"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger>
            <SelectContent><SelectItem value="all">All types</SelectItem>{SUPPLIER_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{SUPPLIER_TYPE_META[t]}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{SUPPLIER_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{SUPPLIER_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}

      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Store className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No suppliers yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Add the hotels, transport providers, guides and other vendors your agency works with.</p></div>
          {canCreate && <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1.5" /> Add supplier</Button>}
        </CardContent></Card>
      )}

      {!loading && rows.length > 0 && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No suppliers match your filters.</CardContent></Card>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Supplier</TableHead><TableHead>Type</TableHead><TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Location</TableHead>
                <TableHead>Status</TableHead><TableHead>Created</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-normal">{supplierTypeLabel(r.type)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{r.contactPerson || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.phone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{supplierLocation(r)}</TableCell>
                    <TableCell><SupplierStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatJoined(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}><CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{r.name}</div>
                    <div className="truncate text-sm text-muted-foreground">{supplierTypeLabel(r.type)}{r.contactPerson ? ` · ${r.contactPerson}` : ''}</div>
                  </div>
                  <SupplierStatusBadge status={r.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-sm text-muted-foreground">
                  {r.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {r.phone}</span>}
                  {r.email && <span className="flex items-center gap-1 min-w-0"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{r.email}</span></span>}
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {supplierLocation(r)}</span>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ----------------------------- SUPPLIER FORM -----------------------------
function SupplierForm({ session, mode, supplierId, onDone, onCancel }) {
  const [form, setForm] = useState({
    name: '', type: '', contactPerson: '', phone: '', email: '', website: '',
    address: '', city: '', state: '', country: '', description: '', status: 'active', notes: '',
  });
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (mode === 'edit' && supplierId) {
      (async () => { setLoading(true); try {
        const { supplier: s } = await api(`/suppliers/${supplierId}`);
        setForm({
          name: s.name || '', type: s.type || '', contactPerson: s.contactPerson || '', phone: s.phone || '',
          email: s.email || '', website: s.website || '', address: s.address || '', city: s.city || '',
          state: s.state || '', country: s.country || '', description: s.description || '', status: s.status || 'active', notes: s.notes || '',
        });
      } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })();
    }
  }, [mode, supplierId]);

  const canSubmit = form.name.trim() && form.type;
  const submit = async () => {
    if (!canSubmit) { toast.error('Supplier name and type are required'); return; }
    setSubmitting(true);
    try {
      const res = mode === 'edit'
        ? await api(`/suppliers/${supplierId}`, { method: 'PUT', body: JSON.stringify(form) })
        : await api('/suppliers', { method: 'POST', body: JSON.stringify(form) });
      toast.success(mode === 'edit' ? 'Supplier updated' : 'Supplier added');
      onDone(res.supplier);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h2 className="text-xl font-bold">{mode === 'edit' ? 'Edit supplier' : 'Add supplier'}</h2>
          <p className="text-sm text-muted-foreground">Record a vendor your agency works with — hotels, transport, guides and more.</p></div>
      </div>

      <Card><CardContent className="p-5 space-y-4">
        <div className="text-sm font-semibold text-muted-foreground">Basic information</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Supplier name</Label><Input value={form.name} placeholder="Taj Resort & Spa" onChange={set('name')} /></div>
          <div className="space-y-1.5"><Label>Supplier type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
              <SelectContent>{SUPPLIER_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{SUPPLIER_TYPE_META[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Contact person</Label><Input value={form.contactPerson} placeholder="Rahul Sharma" onChange={set('contactPerson')} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} placeholder="+91 98765 43210" onChange={set('phone')} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} placeholder="sales@supplier.com" onChange={set('email')} /></div>
          <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} placeholder="https://supplier.com" onChange={set('website')} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={set('address')} /></div>
          <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={set('city')} /></div>
          <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={set('state')} /></div>
          <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={set('country')} /></div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SUPPLIER_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{SUPPLIER_STATUS_META[s].label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Separator />
        <div className="text-sm font-semibold text-muted-foreground">Business information</div>
        <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} placeholder="What this supplier provides, areas covered, specialities…" onChange={set('description')} /></div>
        <div className="space-y-1.5"><Label>Internal notes</Label><Textarea rows={2} value={form.notes} placeholder="Private notes — not shown to customers" onChange={set('notes')} /></div>
      </CardContent></Card>

      <div className="flex gap-2">
        <Button className="flex-1 sm:flex-none" onClick={submit} disabled={!canSubmit || submitting}>{submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Add supplier')}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ----------------------------- SUPPLIER DETAIL -----------------------------
function SupplierDetail({ session, supplierId, onBack, onEdit }) {
  const role = session.user.role;
  const canUpdate = can(role, 'suppliers:update');
  const canDelete = can(role, 'suppliers:delete');
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); try { const d = await api(`/suppliers/${supplierId}`); setS(d.supplier); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [supplierId]);

  const changeStatus = async (status) => { try { const d = await api(`/suppliers/${supplierId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); setS(d.supplier); toast.success('Status updated'); } catch (e) { toast.error(friendlyError(e)); } };
  const remove = async () => { try { await api(`/suppliers/${supplierId}`, { method: 'DELETE' }); toast.success('Supplier deleted'); onBack(); } catch (e) { toast.error(friendlyError(e)); } };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  if (!s) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Supplier not found.</CardContent></Card>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">{s.name}</h2><SupplierStatusBadge status={s.status} /></div>
            <p className="text-sm text-muted-foreground"><Badge variant="outline" className="font-normal mr-1">{supplierTypeLabel(s.type)}</Badge> {supplierLocation(s)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && <Button variant="outline" size="sm" onClick={() => onEdit(s.id)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
          {canDelete && <Button variant="outline" size="sm" onClick={remove}><Trash2 className="h-4 w-4 mr-1 text-destructive" /> Delete</Button>}
        </div>
      </div>

      {canUpdate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Change status:</span>
          <Select value={s.status} onValueChange={changeStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{SUPPLIER_STATUS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{SUPPLIER_STATUS_META[o].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardContent className="p-5">
          <div className="text-sm font-semibold text-muted-foreground mb-2">Contact</div>
          <PkgRow label="Contact person" value={s.contactPerson} />
          <PkgRow label="Phone" value={s.phone} />
          <PkgRow label="Email" value={s.email} />
          <PkgRow label="Website" value={s.website ? <a href={s.website} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{s.website}</a> : ''} />
          <Separator className="my-2" />
          <PkgRow label="Address" value={s.address} />
          <PkgRow label="Location" value={supplierLocation(s)} />
          <Separator className="my-2" />
          <PkgRow label="Created" value={formatJoined(s.createdAt)} />
          <PkgRow label="Updated" value={formatJoined(s.updatedAt)} />
        </CardContent></Card>

        <Card className="lg:col-span-2"><CardContent className="p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold text-muted-foreground mb-1">Description</div>
            <p className="text-sm whitespace-pre-wrap">{s.description || '—'}</p>
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-1"><Lock className="h-3.5 w-3.5" /> Internal notes</div>
            <p className="text-sm whitespace-pre-wrap">{s.notes || '—'}</p>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

// ----------------------------- SUPPLIERS WORKSPACE -----------------------------
function Suppliers({ session }) {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const openDetail = (id) => { setSelectedId(id); setView('detail'); };
  const openEdit = (id) => { setSelectedId(id); setView('edit'); };
  if (view === 'create') return <SupplierForm session={session} mode="create" onDone={(s) => openDetail(s.id)} onCancel={() => setView('list')} />;
  if (view === 'edit') return <SupplierForm session={session} mode="edit" supplierId={selectedId} onDone={(s) => openDetail(s.id)} onCancel={() => openDetail(selectedId)} />;
  if (view === 'detail') return <SupplierDetail session={session} supplierId={selectedId} onBack={() => setView('list')} onEdit={openEdit} />;
  return <SupplierList session={session} onCreate={() => setView('create')} onOpen={openDetail} />;
}

// ======================= BOOKINGS =======================

const BOOKING_STATUS_META = {
  draft:       { label: 'Draft',       cls: 'bg-muted text-muted-foreground border-border' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};
const BOOKING_STATUS_OPTIONS = Object.keys(BOOKING_STATUS_META);
function BookingStatusBadge({ status }) { return <MetaBadge meta={BOOKING_STATUS_META[status] || BOOKING_STATUS_META.draft} />; }

const BK_SERVICE_TYPES = ['hotel', 'houseboat', 'transport', 'activity', 'guide', 'restaurant', 'other'];
const BK_SERVICE_TYPE_LABEL = { hotel: 'Hotel', houseboat: 'Houseboat', transport: 'Transport', activity: 'Activity', guide: 'Guide', restaurant: 'Restaurant', other: 'Other' };
const BK_SERVICE_STATUS_META = {
  pending:   { label: 'Pending',   cls: 'bg-muted text-muted-foreground border-border' },
  confirmed: { label: 'Confirmed', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};
const BK_SERVICE_STATUS_OPTIONS = Object.keys(BK_SERVICE_STATUS_META);

function bkRound(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
function blankService() { return { id: 'sv' + Math.random().toString(36).slice(2), type: 'hotel', description: '', supplierId: '', supplierName: '', quantity: 1, unitPrice: 0, status: 'pending', notes: '' }; }
function calcBookingTotals(items, discountType, discountValue, taxPercent, internalCost) {
  const subtotal = bkRound((items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0));
  let discAmt = discountType === 'percent' ? subtotal * Math.min(Number(discountValue) || 0, 100) / 100 : (Number(discountValue) || 0);
  discAmt = bkRound(Math.min(discAmt, subtotal));
  const taxable = Math.max(0, bkRound(subtotal - discAmt));
  const taxAmt = bkRound(taxable * Math.min(Number(taxPercent) || 0, 100) / 100);
  const grand = bkRound(taxable + taxAmt);
  const profit = bkRound(taxable - (Number(internalCost) || 0));
  return { subtotal, discAmt, taxable, taxAmt, grand, profit };
}

function FinRow({ label, value, strong }) {
  return (<div className={`flex items-center justify-between ${strong ? 'py-1.5 text-base font-semibold' : 'py-1 text-sm'}`}><span className={strong ? '' : 'text-muted-foreground'}>{label}</span><span>{value}</span></div>);
}

// Lightweight pickers (reuse existing collections; no duplicate data)
function PackagePicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/packages'); setOpts(d.packages || []); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}>
    <SelectTrigger><SelectValue placeholder="No package" /></SelectTrigger>
    <SelectContent><SelectItem value="none">No package</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
  </Select>);
}
function ItineraryPicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/itineraries'); setOpts(d.itineraries || []); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}>
    <SelectTrigger><SelectValue placeholder="No itinerary" /></SelectTrigger>
    <SelectContent><SelectItem value="none">No itinerary</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}</SelectContent>
  </Select>);
}

// ----------------------------- BOOKING LIST -----------------------------
function BookingList({ session, onCreate, onOpen }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const canCreate = can(session.user.role, 'bookings:create');
  useEffect(() => { (async () => { setLoading(true); try { const d = await api('/bookings'); setRows(d.bookings || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, []);
  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    const mq = !q || [r.bookingNumber, r.customerName, r.destination].some((f) => String(f || '').toLowerCase().includes(q));
    const ms = statusFilter === 'all' || r.status === statusFilter;
    return mq && ms;
  });
  const isEmpty = !loading && rows.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold">Bookings</h2><p className="text-sm text-muted-foreground">Confirmed travel arrangements, service items and totals.</p></div>
        {canCreate && !isEmpty && <Button onClick={onCreate} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Create booking</Button>}
      </div>

      {!isEmpty && !loading && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search booking no., customer or destination" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{BOOKING_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{BOOKING_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}

      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><ClipboardList className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No bookings yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Create a booking from scratch, or convert an approved quotation into a booking.</p></div>
          {canCreate && <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1.5" /> Create booking</Button>}
        </CardContent></Card>
      )}

      {!loading && rows.length > 0 && filtered.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No bookings match your filters.</CardContent></Card>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Booking</TableHead><TableHead>Customer</TableHead><TableHead>Destination</TableHead>
                <TableHead>Travel dates</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Created</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                    <TableCell className="font-medium">{r.bookingNumber}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.destination}</TableCell>
                    <TableCell className="text-muted-foreground">{travelDates(r)}</TableCell>
                    <TableCell><BookingStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right font-medium">{money(r.grandTotal)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatJoined(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}><CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="truncate font-semibold">{r.bookingNumber}</div><div className="truncate text-sm text-muted-foreground">{r.customerName} · {r.destination}</div></div>
                  <BookingStatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">{travelDates(r)}</span>
                  <span className="font-semibold">{money(r.grandTotal)}</span>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ----------------------------- BOOKING FORM -----------------------------
function BookingForm({ session, mode, bookingId, prefill, onDone, onCancel }) {
  const [customer, setCustomer] = useState({ customerType: '', customerId: '', customerName: '' });
  const [form, setForm] = useState({ destination: '', startDate: '', endDate: '', adults: 0, children: 0, nights: 0, quotationId: '', quotationNumber: '', packageId: '', itineraryId: '', notes: '', discountType: 'fixed', discountValue: 0, taxPercent: 0, internalCost: 0 });
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { (async () => { try { const d = await api('/suppliers'); setSuppliers((d.suppliers || []).filter((s) => s.status === 'active')); } catch { /* */ } })(); }, []);

  useEffect(() => {
    if (mode === 'edit' && bookingId) {
      (async () => { setLoading(true); try {
        const { booking: b } = await api(`/bookings/${bookingId}`);
        setCustomer({ customerType: b.customerType, customerId: b.customerId, customerName: b.customerName });
        setForm({
          destination: b.destination || '', startDate: b.startDate || '', endDate: b.endDate || '',
          adults: b.adults || 0, children: b.children || 0, nights: b.nights || 0,
          quotationId: b.quotationId || '', quotationNumber: b.quotationNumber || '', packageId: b.packageId || '', itineraryId: b.itineraryId || '',
          notes: b.notes || '', discountType: (b.discount && b.discount.type) || 'fixed', discountValue: (b.discount && b.discount.value) || 0,
          taxPercent: (b.tax && b.tax.percent) || 0, internalCost: b.internalCost || 0,
        });
        setItems((b.serviceItems || []).map((s) => ({ ...blankService(), ...s })));
      } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })();
    } else if (prefill) {
      const q = prefill;
      setCustomer({ customerType: q.customerType, customerId: q.customerId, customerName: q.customerName });
      setForm((f) => ({
        ...f, destination: q.destination || '', startDate: q.startDate || '', endDate: q.endDate || '',
        adults: q.adults || 0, children: q.children || 0, nights: q.nights || 0,
        quotationId: q.id || '', quotationNumber: q.quotationNumber || '',
        discountType: (q.discount && q.discount.type) || 'fixed', discountValue: (q.discount && q.discount.value) || 0,
        taxPercent: (q.tax && q.tax.percent) || 0, internalCost: q.internalCost || 0,
      }));
      setItems((q.items || []).map((it) => ({
        ...blankService(),
        type: BK_SERVICE_TYPES.includes(String(it.category || '').toLowerCase()) ? String(it.category).toLowerCase() : 'other',
        description: it.description || it.category || '', quantity: it.quantity || 1, unitPrice: it.sellingPrice || 0,
      })));
    }
  }, [mode, bookingId]);

  const totals = calcBookingTotals(items, form.discountType, form.discountValue, form.taxPercent, form.internalCost);
  const canSubmit = customer.customerId && form.destination.trim();
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) }));
  const setItem = (id, patch) => setItems((xs) => xs.map((x) => x.id === id ? { ...x, ...patch } : x));

  const submit = async () => {
    if (!canSubmit) { toast.error('Customer and destination are required'); return; }
    setSubmitting(true);
    try {
      const body = {
        customerType: customer.customerType, customerId: customer.customerId,
        destination: form.destination, startDate: form.startDate, endDate: form.endDate,
        adults: form.adults, children: form.children, nights: form.nights,
        quotationId: form.quotationId, packageId: form.packageId, itineraryId: form.itineraryId, notes: form.notes,
        discount: { type: form.discountType, value: Number(form.discountValue) || 0 },
        tax: { percent: Number(form.taxPercent) || 0 }, internalCost: Number(form.internalCost) || 0,
        serviceItems: items.map((x) => ({ id: x.id, type: x.type, description: x.description, supplierId: x.supplierId, supplierName: x.supplierName, quantity: Number(x.quantity) || 0, unitPrice: Number(x.unitPrice) || 0, status: x.status, notes: x.notes })),
      };
      const res = mode === 'edit'
        ? await api(`/bookings/${bookingId}`, { method: 'PUT', body: JSON.stringify(body) })
        : await api('/bookings', { method: 'POST', body: JSON.stringify(body) });
      toast.success(mode === 'edit' ? 'Booking updated' : 'Booking created');
      onDone(res.booking);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h2 className="text-xl font-bold">{mode === 'edit' ? 'Edit booking' : 'Create booking'}</h2>
          <p className="text-sm text-muted-foreground">{form.quotationNumber ? `Converting from quotation ${form.quotationNumber} — the original quotation is preserved.` : 'Reuse an existing client or lead — no duplicate customer records are created.'}</p></div>
      </div>

      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Client or lead</Label><CustomerPicker value={customer} onChange={setCustomer} /></div>
        <div className="space-y-1.5"><Label>Destination</Label><Input value={form.destination} placeholder="Kerala, India" onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Linked quotation <span className="text-muted-foreground">(optional)</span></Label><QuotationPicker value={form.quotationId} onChange={(v) => setForm((f) => ({ ...f, quotationId: v }))} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Package</Label><PackagePicker value={form.packageId} onChange={(v) => setForm((f) => ({ ...f, packageId: v }))} /></div>
          <div className="space-y-1.5"><Label>Itinerary</Label><ItineraryPicker value={form.itineraryId} onChange={(v) => setForm((f) => ({ ...f, itineraryId: v }))} /></div>
        </div>
        <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2">
          <div className="space-y-1.5"><Label>Adults</Label><Input type="number" min="0" value={form.adults} onChange={setNum('adults')} /></div>
          <div className="space-y-1.5"><Label>Children</Label><Input type="number" min="0" value={form.children} onChange={setNum('children')} /></div>
          <div className="space-y-1.5"><Label>Nights</Label><Input type="number" min="0" value={form.nights} onChange={setNum('nights')} /></div>
        </div>
      </CardContent></Card>

      {/* Service items */}
      <Card><CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Service items</div>
          <Button variant="outline" size="sm" onClick={() => setItems((xs) => [...xs, blankService()])}><Plus className="h-4 w-4 mr-1" /> Add service</Button>
        </div>
        {items.length === 0 && <p className="text-sm text-muted-foreground">No services added. Add hotels, transport, activities and more.</p>}
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border p-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-12">
              <div className="sm:col-span-3 space-y-1"><Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={it.type} onValueChange={(v) => setItem(it.id, { type: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{BK_SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{BK_SERVICE_TYPE_LABEL[t]}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="sm:col-span-5 space-y-1"><Label className="text-xs text-muted-foreground">Description</Label><Input value={it.description} placeholder="e.g. Deluxe room × 3 nights" onChange={(e) => setItem(it.id, { description: e.target.value })} /></div>
              <div className="sm:col-span-4 space-y-1"><Label className="text-xs text-muted-foreground">Supplier</Label>
                <Select value={it.supplierId || 'none'} onValueChange={(v) => { if (v === 'none') setItem(it.id, { supplierId: '', supplierName: '' }); else { const s = suppliers.find((x) => x.id === v); setItem(it.id, { supplierId: v, supplierName: s ? s.name : '' }); } }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="No supplier" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No supplier</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-12 items-end">
              <div className="sm:col-span-2 space-y-1"><Label className="text-xs text-muted-foreground">Qty</Label><Input type="number" min="0" value={it.quantity} onChange={(e) => setItem(it.id, { quantity: Math.max(0, Number(e.target.value) || 0) })} /></div>
              <div className="sm:col-span-3 space-y-1"><Label className="text-xs text-muted-foreground">Unit price</Label><Input type="number" min="0" value={it.unitPrice} onChange={(e) => setItem(it.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} /></div>
              <div className="sm:col-span-2 space-y-1"><Label className="text-xs text-muted-foreground">Total</Label><div className="flex h-9 items-center px-1 text-sm font-medium">{money((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}</div></div>
              <div className="sm:col-span-3 space-y-1"><Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={it.status} onValueChange={(v) => setItem(it.id, { status: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{BK_SERVICE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{BK_SERVICE_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="sm:col-span-2 flex justify-end"><Button variant="ghost" size="icon" onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
            </div>
            <Input value={it.notes} placeholder="Notes (optional)" onChange={(e) => setItem(it.id, { notes: e.target.value })} />
          </div>
        ))}
      </CardContent></Card>

      {/* Totals + internal */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="p-5 space-y-3">
          <div className="font-semibold">Pricing</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Discount type</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm((f) => ({ ...f, discountType: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="percent">Percent</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Discount value</Label><Input type="number" min="0" value={form.discountValue} onChange={setNum('discountValue')} /></div>
            <div className="space-y-1.5"><Label>Tax %</Label><Input type="number" min="0" value={form.taxPercent} onChange={setNum('taxPercent')} /></div>
            <div className="space-y-1.5"><Label className="flex items-center gap-1"><Lock className="h-3 w-3" /> Internal cost</Label><Input type="number" min="0" value={form.internalCost} onChange={setNum('internalCost')} /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <FinRow label="Subtotal" value={money(totals.subtotal)} />
          <FinRow label="Discount" value={`- ${money(totals.discAmt)}`} />
          <FinRow label={`Tax (${Number(form.taxPercent) || 0}%)`} value={money(totals.taxAmt)} />
          <Separator className="my-1" />
          <FinRow label="Grand total" value={money(totals.grand)} strong />
          <Separator className="my-1" />
          <FinRow label="Expected profit (staff only)" value={money(totals.profit)} />
        </CardContent></Card>
      </div>

      <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

      <div className="flex gap-2">
        <Button className="flex-1 sm:flex-none" onClick={submit} disabled={!canSubmit || submitting}>{submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Create booking')}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ----------------------------- BOOKING DETAIL -----------------------------
function BookingDetail({ session, bookingId, onBack, onEdit }) {
  const role = session.user.role;
  const canUpdate = can(role, 'bookings:update');
  const canDelete = can(role, 'bookings:delete');
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); try { const d = await api(`/bookings/${bookingId}`); setB(d.booking); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [bookingId]);

  const changeStatus = async (status) => { try { const d = await api(`/bookings/${bookingId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); setB(d.booking); toast.success('Status updated'); } catch (e) { toast.error(friendlyError(e)); } };
  const remove = async () => { try { await api(`/bookings/${bookingId}`, { method: 'DELETE' }); toast.success('Booking deleted'); onBack(); } catch (e) { toast.error(friendlyError(e)); } };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  if (!b) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Booking not found.</CardContent></Card>;

  const items = b.serviceItems || [];
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">{b.bookingNumber}</h2><BookingStatusBadge status={b.status} /></div>
            <p className="text-sm text-muted-foreground">{b.customerName} · {b.destination}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && <Button variant="outline" size="sm" onClick={() => onEdit(b.id)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
          {canUpdate && b.status !== 'cancelled' && b.status !== 'completed' && <Button variant="outline" size="sm" onClick={() => changeStatus('cancelled')}><X className="h-4 w-4 mr-1 text-destructive" /> Cancel</Button>}
          {canDelete && (b.status === 'draft' || b.status === 'cancelled') && <Button variant="outline" size="sm" onClick={remove}><Trash2 className="h-4 w-4 mr-1 text-destructive" /> Delete</Button>}
          <Button variant="outline" size="sm" disabled title="Available in a later phase"><FileDown className="h-4 w-4 mr-1" /> Confirmation PDF (soon)</Button>
        </div>
      </div>

      {canUpdate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Change status:</span>
          <Select value={b.status} onValueChange={changeStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{BOOKING_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{BOOKING_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardContent className="p-5">
          <PkgRow label="Customer" value={b.customerName} />
          <PkgRow label="Destination" value={b.destination} />
          <PkgRow label="Travel dates" value={travelDates(b)} />
          <PkgRow label="Travelers" value={travelerSummary(b)} />
          <Separator className="my-2" />
          <PkgRow label="Source quotation" value={b.quotationNumber} />
          <PkgRow label="Package" value={b.packageId ? 'Linked' : ''} />
          <PkgRow label="Itinerary" value={b.itineraryId ? 'Linked' : ''} />
          <Separator className="my-2" />
          <PkgRow label="Created" value={formatJoined(b.createdAt)} />
          <PkgRow label="Updated" value={formatJoined(b.updatedAt)} />
          {b.notes && (<><Separator className="my-2" /><div className="pt-1"><div className="text-sm text-muted-foreground mb-1">Notes</div><p className="text-sm whitespace-pre-wrap">{b.notes}</p></div></>)}
        </CardContent></Card>

        <Card className="lg:col-span-2"><CardContent className="p-5">
          <div className="mb-2 flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4 text-violet-600" /> Financial summary</div>
          <FinRow label="Subtotal" value={money(b.subtotal)} />
          <FinRow label="Discount" value={`- ${money(b.discountAmount)}`} />
          <FinRow label={`Tax (${(b.tax && b.tax.percent) || 0}%)`} value={money(b.taxAmount)} />
          <Separator className="my-1" />
          <FinRow label="Grand total" value={money(b.grandTotal)} strong />
          <Separator className="my-2" />
          <div className="rounded-lg bg-muted/40 p-2">
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Lock className="h-3 w-3" /> Staff only</div>
            <FinRow label="Internal cost" value={money(b.internalCost)} />
            <FinRow label="Expected profit" value={money(b.expectedProfit)} />
          </div>
        </CardContent></Card>
      </div>

      {/* Service items */}
      <Card><CardContent className="p-5">
        <div className="mb-3 font-semibold">Service items</div>
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No service items on this booking.</p> : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell><Badge variant="outline" className="font-normal">{BK_SERVICE_TYPE_LABEL[it.type] || 'Other'}</Badge></TableCell>
                      <TableCell>{it.description || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{it.supplierName || '—'}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">{money(it.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{money(it.total)}</TableCell>
                      <TableCell><MetaBadge meta={BK_SERVICE_STATUS_META[it.status] || BK_SERVICE_STATUS_META.pending} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2 md:hidden">
              {items.map((it) => (
                <div key={it.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between"><Badge variant="outline" className="font-normal">{BK_SERVICE_TYPE_LABEL[it.type] || 'Other'}</Badge><MetaBadge meta={BK_SERVICE_STATUS_META[it.status] || BK_SERVICE_STATUS_META.pending} /></div>
                  <div className="mt-1 font-medium">{it.description || '—'}</div>
                  {it.supplierName && <div className="text-muted-foreground">{it.supplierName}</div>}
                  <div className="mt-1 flex justify-between text-muted-foreground"><span>{it.quantity} × {money(it.unitPrice)}</span><span className="font-medium text-foreground">{money(it.total)}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
        {canUpdate && <Button variant="outline" size="sm" className="mt-3" onClick={() => onEdit(b.id)}><Plus className="h-4 w-4 mr-1" /> Add / edit services</Button>}
      </CardContent></Card>

      {/* Lightweight timeline */}
      <Card><CardContent className="p-5">
        <div className="mb-2 font-semibold">Timeline</div>
        <ol className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Booking created · {formatJoined(b.createdAt)}</li>
          {b.quotationNumber && <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-teal-600" /> Converted from quotation {b.quotationNumber}</li>}
          <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-amber-600" /> Current status: {BOOKING_STATUS_META[b.status].label} · updated {formatJoined(b.updatedAt)}</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Detailed events are recorded in the Activities tab.</p>
      </CardContent></Card>
    </div>
  );
}

// ----------------------------- BOOKINGS WORKSPACE -----------------------------
function Bookings({ session, navPayload, onConsumePayload }) {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [prefill, setPrefill] = useState(null);

  useEffect(() => {
    if (navPayload && navPayload.convertToBooking) {
      setPrefill(navPayload.convertToBooking);
      setView('create');
      onConsumePayload && onConsumePayload();
    }
  }, [navPayload]);

  const openDetail = (id) => { setSelectedId(id); setView('detail'); };
  const openEdit = (id) => { setSelectedId(id); setView('edit'); };

  if (view === 'create') return <BookingForm session={session} mode="create" prefill={prefill} onDone={(b) => { setPrefill(null); openDetail(b.id); }} onCancel={() => { setPrefill(null); setView('list'); }} />;
  if (view === 'edit') return <BookingForm session={session} mode="edit" bookingId={selectedId} onDone={(b) => openDetail(b.id)} onCancel={() => openDetail(selectedId)} />;
  if (view === 'detail') return <BookingDetail session={session} bookingId={selectedId} onBack={() => setView('list')} onEdit={openEdit} />;
  return <BookingList session={session} onCreate={() => { setPrefill(null); setView('create'); }} onOpen={openDetail} />;
}

// ======================= FLEET & GPS FOUNDATION =======================

const VEHICLE_TYPE_LABEL = { car: 'Car', suv: 'SUV', tempo_traveller: 'Tempo Traveller', bus: 'Bus', van: 'Van', other: 'Other' };
const VEHICLE_TYPE_OPTIONS = Object.keys(VEHICLE_TYPE_LABEL);
const VEHICLE_STATUS_META = {
  available:   { label: 'Available',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  assigned:    { label: 'Assigned',    cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  in_transit:  { label: 'In Transit',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  maintenance: { label: 'Maintenance', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  inactive:    { label: 'Inactive',    cls: 'bg-muted text-muted-foreground border-border' },
};
const VEHICLE_STATUS_OPTIONS = Object.keys(VEHICLE_STATUS_META);
const DRIVER_STATUS_META = {
  available: { label: 'Available', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  assigned:  { label: 'Assigned',  cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  on_trip:   { label: 'On Trip',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  inactive:  { label: 'Inactive',  cls: 'bg-muted text-muted-foreground border-border' },
};
const DRIVER_STATUS_OPTIONS = Object.keys(DRIVER_STATUS_META);
const ASSIGNMENT_STATUS_META = {
  unassigned: { label: 'Unassigned', cls: 'bg-muted text-muted-foreground border-border' },
  assigned:   { label: 'Assigned',   cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  in_transit: { label: 'In Transit', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed:  { label: 'Completed',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};
const ASSIGNMENT_STATUS_OPTIONS = Object.keys(ASSIGNMENT_STATUS_META);
function VehicleStatusBadge({ status }) { return <MetaBadge meta={VEHICLE_STATUS_META[status] || VEHICLE_STATUS_META.available} />; }
function DriverStatusBadge({ status }) { return <MetaBadge meta={DRIVER_STATUS_META[status] || DRIVER_STATUS_META.available} />; }
function vehicleLabel(v) { return v ? `${v.vehicleNumber}${v.model ? ` · ${v.make || ''} ${v.model}`.trim() : ''}` : ''; }

// ----------------------------- FLEET OVERVIEW -----------------------------
function FleetStatCard({ icon: Icon, label, value, tint }) {
  return (<Card><CardContent className="flex items-center gap-3 p-4">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
    <div><div className="text-2xl font-bold leading-none">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>
  </CardContent></Card>);
}
function FleetOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { setLoading(true); try { const d = await api('/fleet/stats'); setStats(d.stats); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, []);
  if (loading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  const v = (stats && stats.vehicles) || {}; const d = (stats && stats.drivers) || {};
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-sm font-semibold text-muted-foreground">Vehicles</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FleetStatCard icon={Truck} label="Total vehicles" value={v.total || 0} tint="bg-violet-50 text-violet-600" />
          <FleetStatCard icon={CheckCircle2} label="Available" value={v.available || 0} tint="bg-emerald-50 text-emerald-600" />
          <FleetStatCard icon={Users} label="Assigned" value={v.assigned || 0} tint="bg-sky-50 text-sky-600" />
          <FleetStatCard icon={MapPin} label="In transit" value={v.in_transit || 0} tint="bg-amber-50 text-amber-600" />
          <FleetStatCard icon={X} label="Maintenance" value={v.maintenance || 0} tint="bg-orange-50 text-orange-600" />
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold text-muted-foreground">Drivers</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FleetStatCard icon={Users} label="Total drivers" value={d.total || 0} tint="bg-violet-50 text-violet-600" />
          <FleetStatCard icon={CheckCircle2} label="Available" value={d.available || 0} tint="bg-emerald-50 text-emerald-600" />
          <FleetStatCard icon={ClipboardList} label="Assigned" value={d.assigned || 0} tint="bg-sky-50 text-sky-600" />
          <FleetStatCard icon={MapPin} label="On trip" value={d.on_trip || 0} tint="bg-amber-50 text-amber-600" />
        </div>
      </div>
      <Card><CardContent className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><MapPin className="h-6 w-6 text-muted-foreground" /></div>
        <h3 className="font-semibold">Live map</h3>
        <p className="max-w-sm text-sm text-muted-foreground">No live vehicle locations available. Real-time GPS tracking will be available in a future phase.</p>
      </CardContent></Card>
    </div>
  );
}

// ----------------------------- VEHICLES -----------------------------
function VehicleForm({ session, mode, vehicleId, onDone, onCancel }) {
  const [form, setForm] = useState({ vehicleNumber: '', registrationNumber: '', vehicleType: 'car', make: '', model: '', year: 0, color: '', seatingCapacity: 0, fuelType: '', status: 'available', currentDriverId: '', notes: '' });
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }));
  useEffect(() => { (async () => { try { const d = await api('/drivers'); setDrivers(d.drivers || []); } catch { /* */ } })(); }, []);
  useEffect(() => {
    if (mode === 'edit' && vehicleId) {
      (async () => { setLoading(true); try { const { vehicle: v } = await api(`/vehicles/${vehicleId}`);
        setForm({ vehicleNumber: v.vehicleNumber || '', registrationNumber: v.registrationNumber || '', vehicleType: v.vehicleType || 'car', make: v.make || '', model: v.model || '', year: v.year || 0, color: v.color || '', seatingCapacity: v.seatingCapacity || 0, fuelType: v.fuelType || '', status: v.status || 'available', currentDriverId: v.currentDriverId || '', notes: v.notes || '' });
      } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })();
    }
  }, [mode, vehicleId]);
  const canSubmit = form.vehicleNumber.trim();
  const submit = async () => {
    if (!canSubmit) { toast.error('Vehicle number is required'); return; }
    setSubmitting(true);
    try {
      const res = mode === 'edit' ? await api(`/vehicles/${vehicleId}`, { method: 'PUT', body: JSON.stringify(form) }) : await api('/vehicles', { method: 'POST', body: JSON.stringify(form) });
      toast.success(mode === 'edit' ? 'Vehicle updated' : 'Vehicle added'); onDone(res.vehicle);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSubmitting(false); }
  };
  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start gap-3"><Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h2 className="text-xl font-bold">{mode === 'edit' ? 'Edit vehicle' : 'Add vehicle'}</h2><p className="text-sm text-muted-foreground">Register a vehicle in your fleet.</p></div></div>
      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Vehicle number</Label><Input value={form.vehicleNumber} placeholder="KA-01-AB-1234" onChange={set('vehicleNumber')} /></div>
        <div className="space-y-1.5"><Label>Registration number</Label><Input value={form.registrationNumber} onChange={set('registrationNumber')} /></div>
        <div className="space-y-1.5"><Label>Type</Label><Select value={form.vehicleType} onValueChange={(v) => setForm((f) => ({ ...f, vehicleType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VEHICLE_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{VEHICLE_TYPE_LABEL[t]}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VEHICLE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{VEHICLE_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Make</Label><Input value={form.make} placeholder="Toyota" onChange={set('make')} /></div>
        <div className="space-y-1.5"><Label>Model</Label><Input value={form.model} placeholder="Innova Crysta" onChange={set('model')} /></div>
        <div className="space-y-1.5"><Label>Year</Label><Input type="number" min="0" value={form.year} onChange={setNum('year')} /></div>
        <div className="space-y-1.5"><Label>Color</Label><Input value={form.color} onChange={set('color')} /></div>
        <div className="space-y-1.5"><Label>Seating capacity</Label><Input type="number" min="0" value={form.seatingCapacity} onChange={setNum('seatingCapacity')} /></div>
        <div className="space-y-1.5"><Label>Fuel type</Label><Input value={form.fuelType} placeholder="Diesel / Petrol / EV" onChange={set('fuelType')} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Assigned driver</Label>
          <Select value={form.currentDriverId || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, currentDriverId: v === 'none' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder="No driver" /></SelectTrigger>
            <SelectContent><SelectItem value="none">No driver</SelectItem>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}{d.phone ? ` · ${d.phone}` : ''}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={set('notes')} /></div>
      </CardContent></Card>
      <div className="flex gap-2"><Button className="flex-1 sm:flex-none" onClick={submit} disabled={!canSubmit || submitting}>{submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Add vehicle')}</Button><Button variant="outline" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}

function VehicleDetail({ session, vehicleId, onBack, onEdit }) {
  const role = session.user.role;
  const canUpdate = can(role, 'fleet:update');
  const [v, setV] = useState(null); const [loading, setLoading] = useState(true); const [drivers, setDrivers] = useState([]);
  const load = async () => { setLoading(true); try { const d = await api(`/vehicles/${vehicleId}`); setV(d.vehicle); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [vehicleId]);
  useEffect(() => { (async () => { try { const d = await api('/drivers'); setDrivers(d.drivers || []); } catch { /* */ } })(); }, []);
  const changeStatus = async (status) => { try { const d = await api(`/vehicles/${vehicleId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); setV((p) => ({ ...p, ...d.vehicle })); toast.success('Status updated'); } catch (e) { toast.error(friendlyError(e)); } };
  const assignDriver = async (driverId) => { try { const d = await api(`/vehicles/${vehicleId}/driver`, { method: 'PUT', body: JSON.stringify({ driverId }) }); setV((p) => ({ ...p, ...d.vehicle, currentDriverName: (drivers.find((x) => x.id === driverId) || {}).name || '' })); toast.success(driverId ? 'Driver assigned' : 'Driver unassigned'); } catch (e) { toast.error(friendlyError(e)); } };
  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  if (!v) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Vehicle not found.</CardContent></Card>;
  const hasLoc = v.latitude !== null && v.latitude !== undefined && v.longitude !== null && v.longitude !== undefined;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3"><Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div><div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">{v.vehicleNumber}</h2><VehicleStatusBadge status={v.status} /></div>
            <p className="text-sm text-muted-foreground"><Badge variant="outline" className="font-normal mr-1">{VEHICLE_TYPE_LABEL[v.vehicleType] || 'Other'}</Badge>{[v.make, v.model].filter(Boolean).join(' ')}</p></div></div>
        {canUpdate && <Button variant="outline" size="sm" onClick={() => onEdit(v.id)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
      </div>
      {canUpdate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={v.status} onValueChange={changeStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{VEHICLE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{VEHICLE_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select>
          <span className="ml-2 text-sm text-muted-foreground">Driver:</span>
          <Select value={v.currentDriverId || 'none'} onValueChange={(val) => assignDriver(val === 'none' ? '' : val)}><SelectTrigger className="w-52"><SelectValue placeholder="No driver" /></SelectTrigger><SelectContent><SelectItem value="none">No driver</SelectItem>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardContent className="p-5">
          <PkgRow label="Type" value={VEHICLE_TYPE_LABEL[v.vehicleType] || 'Other'} />
          <PkgRow label="Make / Model" value={[v.make, v.model].filter(Boolean).join(' ')} />
          <PkgRow label="Year" value={v.year || ''} />
          <PkgRow label="Color" value={v.color} />
          <PkgRow label="Seating capacity" value={v.seatingCapacity || ''} />
          <PkgRow label="Fuel type" value={v.fuelType} />
          <PkgRow label="Registration" value={v.registrationNumber} />
          <PkgRow label="Current driver" value={v.currentDriverName} />
          <Separator className="my-2" /><PkgRow label="Created" value={formatJoined(v.createdAt)} /><PkgRow label="Updated" value={formatJoined(v.updatedAt)} />
          {v.notes && (<><Separator className="my-2" /><div className="pt-1"><div className="text-sm text-muted-foreground mb-1">Notes</div><p className="text-sm whitespace-pre-wrap">{v.notes}</p></div></>)}
        </CardContent></Card>
        <Card className="lg:col-span-2"><CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-violet-600" /> Location</div>
          {hasLoc ? (<><PkgRow label="Latitude" value={String(v.latitude)} /><PkgRow label="Longitude" value={String(v.longitude)} /><PkgRow label="Source" value={v.locationSource} /><PkgRow label="Updated" value={formatJoined(v.lastLocationAt)} /></>)
            : <p className="text-sm text-muted-foreground">No location set. GPS tracking will be available in a future phase.</p>}
        </CardContent></Card>
      </div>
    </div>
  );
}

function VehiclesPane({ session }) {
  const [view, setView] = useState('list'); const [sel, setSel] = useState(null);
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(''); const [statusFilter, setStatusFilter] = useState('all'); const [typeFilter, setTypeFilter] = useState('all');
  const canCreate = can(session.user.role, 'fleet:create');
  const load = async () => { setLoading(true); try { const d = await api('/vehicles'); setRows(d.vehicles || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { if (view === 'list') load(); }, [view]);
  if (view === 'create') return <VehicleForm session={session} mode="create" onDone={() => setView('list')} onCancel={() => setView('list')} />;
  if (view === 'edit') return <VehicleForm session={session} mode="edit" vehicleId={sel} onDone={() => { setView('detail'); }} onCancel={() => setView('detail')} />;
  if (view === 'detail') return <VehicleDetail session={session} vehicleId={sel} onBack={() => setView('list')} onEdit={(id) => { setSel(id); setView('edit'); }} />;
  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    const mq = !q || [r.vehicleNumber, r.make, r.model, r.currentDriverName].some((f) => String(f || '').toLowerCase().includes(q));
    const ms = statusFilter === 'all' || r.status === statusFilter; const mt = typeFilter === 'all' || r.vehicleType === typeFilter;
    return mq && ms && mt;
  });
  const isEmpty = !loading && rows.length === 0;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          {!isEmpty && (<><div className="relative sm:max-w-xs sm:flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vehicle / driver" className="pl-9" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="sm:w-40"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{VEHICLE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{VEHICLE_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{VEHICLE_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{VEHICLE_TYPE_LABEL[t]}</SelectItem>)}</SelectContent></Select></>)}
        </div>
        {canCreate && !isEmpty && <Button onClick={() => setView('create')}><Plus className="h-4 w-4 mr-1.5" /> Add vehicle</Button>}
      </div>
      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}
      {isEmpty && (<Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Truck className="h-6 w-6 text-muted-foreground" /></div><div className="space-y-1"><h3 className="font-semibold">No vehicles yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Add the vehicles in your fleet to track availability and assignments.</p></div>{canCreate && <Button onClick={() => setView('create')}><Plus className="h-4 w-4 mr-1.5" /> Add vehicle</Button>}</CardContent></Card>)}
      {!loading && rows.length > 0 && filtered.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No vehicles match your filters.</CardContent></Card>}
      {!loading && filtered.length > 0 && (<>
        <Card className="hidden md:block overflow-hidden"><Table>
          <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Type</TableHead><TableHead>Make/Model</TableHead><TableHead className="text-right">Seats</TableHead><TableHead>Driver</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((r) => (<TableRow key={r.id} className="cursor-pointer" onClick={() => { setSel(r.id); setView('detail'); }}>
            <TableCell className="font-medium">{r.vehicleNumber}</TableCell><TableCell><Badge variant="outline" className="font-normal">{VEHICLE_TYPE_LABEL[r.vehicleType] || 'Other'}</Badge></TableCell>
            <TableCell className="text-muted-foreground">{[r.make, r.model].filter(Boolean).join(' ') || '—'}</TableCell><TableCell className="text-right text-muted-foreground">{r.seatingCapacity || '—'}</TableCell>
            <TableCell className="text-muted-foreground">{r.currentDriverName || '—'}</TableCell><TableCell><VehicleStatusBadge status={r.status} /></TableCell>
          </TableRow>))}</TableBody></Table></Card>
        <div className="space-y-3 md:hidden">{filtered.map((r) => (<Card key={r.id} className="cursor-pointer" onClick={() => { setSel(r.id); setView('detail'); }}><CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate font-semibold">{r.vehicleNumber}</div><div className="truncate text-sm text-muted-foreground">{VEHICLE_TYPE_LABEL[r.vehicleType]} · {[r.make, r.model].filter(Boolean).join(' ')}</div></div><VehicleStatusBadge status={r.status} /></div>
          <div className="flex justify-between border-t pt-2 text-sm text-muted-foreground"><span>{r.currentDriverName || 'No driver'}</span><span>{r.seatingCapacity ? `${r.seatingCapacity} seats` : ''}</span></div>
        </CardContent></Card>))}</div>
      </>)}
    </div>
  );
}

// ----------------------------- DRIVERS -----------------------------
function DriverForm({ session, mode, driverId, onDone, onCancel }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', licenseNumber: '', licenseExpiry: '', status: 'available', notes: '' });
  const [loading, setLoading] = useState(mode === 'edit'); const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  useEffect(() => { if (mode === 'edit' && driverId) { (async () => { setLoading(true); try { const { driver: d } = await api(`/drivers/${driverId}`); setForm({ name: d.name || '', phone: d.phone || '', email: d.email || '', licenseNumber: d.licenseNumber || '', licenseExpiry: d.licenseExpiry || '', status: d.status || 'available', notes: d.notes || '' }); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); } }, [mode, driverId]);
  const canSubmit = form.name.trim();
  const submit = async () => { if (!canSubmit) { toast.error('Driver name is required'); return; } setSubmitting(true); try { const res = mode === 'edit' ? await api(`/drivers/${driverId}`, { method: 'PUT', body: JSON.stringify(form) }) : await api('/drivers', { method: 'POST', body: JSON.stringify(form) }); toast.success(mode === 'edit' ? 'Driver updated' : 'Driver added'); onDone(res.driver); } catch (e) { toast.error(friendlyError(e)); } finally { setSubmitting(false); } };
  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-start gap-3"><Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button><div><h2 className="text-xl font-bold">{mode === 'edit' ? 'Edit driver' : 'Add driver'}</h2><p className="text-sm text-muted-foreground">Register a driver in your fleet.</p></div></div>
      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Driver name</Label><Input value={form.name} onChange={set('name')} /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={set('phone')} /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} /></div>
        <div className="space-y-1.5"><Label>License number</Label><Input value={form.licenseNumber} onChange={set('licenseNumber')} /></div>
        <div className="space-y-1.5"><Label>License expiry</Label><Input type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} /></div>
        <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DRIVER_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{DRIVER_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={set('notes')} /></div>
      </CardContent></Card>
      <div className="flex gap-2"><Button className="flex-1 sm:flex-none" onClick={submit} disabled={!canSubmit || submitting}>{submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Add driver')}</Button><Button variant="outline" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}

function DriverDetail({ session, driverId, onBack, onEdit }) {
  const canUpdate = can(session.user.role, 'fleet:update');
  const [d, setD] = useState(null); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const r = await api(`/drivers/${driverId}`); setD(r.driver); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [driverId]);
  const changeStatus = async (status) => { try { const r = await api(`/drivers/${driverId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); setD((p) => ({ ...p, ...r.driver })); toast.success('Status updated'); } catch (e) { toast.error(friendlyError(e)); } };
  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  if (!d) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Driver not found.</CardContent></Card>;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3"><Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button><div><div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">{d.name}</h2><DriverStatusBadge status={d.status} /></div><p className="text-sm text-muted-foreground">{d.phone || 'No phone'}</p></div></div>
        {canUpdate && <Button variant="outline" size="sm" onClick={() => onEdit(d.id)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
      </div>
      {canUpdate && (<div className="flex flex-wrap items-center gap-2"><span className="text-sm text-muted-foreground">Status:</span><Select value={d.status} onValueChange={changeStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{DRIVER_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{DRIVER_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></div>)}
      <Card><CardContent className="p-5">
        <PkgRow label="Phone" value={d.phone} /><PkgRow label="Email" value={d.email} />
        <PkgRow label="License number" value={d.licenseNumber} /><PkgRow label="License expiry" value={d.licenseExpiry ? formatJoined(d.licenseExpiry) : ''} />
        <PkgRow label="Assigned vehicle" value={d.assignedVehicleNumber} />
        <Separator className="my-2" /><PkgRow label="Created" value={formatJoined(d.createdAt)} /><PkgRow label="Updated" value={formatJoined(d.updatedAt)} />
        {d.notes && (<><Separator className="my-2" /><div className="pt-1"><div className="text-sm text-muted-foreground mb-1">Notes</div><p className="text-sm whitespace-pre-wrap">{d.notes}</p></div></>)}
      </CardContent></Card>
    </div>
  );
}

function DriversPane({ session }) {
  const [view, setView] = useState('list'); const [sel, setSel] = useState(null);
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [statusFilter, setStatusFilter] = useState('all');
  const canCreate = can(session.user.role, 'fleet:create');
  const load = async () => { setLoading(true); try { const d = await api('/drivers'); setRows(d.drivers || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { if (view === 'list') load(); }, [view]);
  if (view === 'create') return <DriverForm session={session} mode="create" onDone={() => setView('list')} onCancel={() => setView('list')} />;
  if (view === 'edit') return <DriverForm session={session} mode="edit" driverId={sel} onDone={() => setView('detail')} onCancel={() => setView('detail')} />;
  if (view === 'detail') return <DriverDetail session={session} driverId={sel} onBack={() => setView('list')} onEdit={(id) => { setSel(id); setView('edit'); }} />;
  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => { const mq = !q || [r.name, r.phone, r.licenseNumber, r.email].some((f) => String(f || '').toLowerCase().includes(q)); const ms = statusFilter === 'all' || r.status === statusFilter; return mq && ms; });
  const isEmpty = !loading && rows.length === 0;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">{!isEmpty && (<><div className="relative sm:max-w-xs sm:flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search driver / phone / license" className="pl-9" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="sm:w-40"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{DRIVER_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{DRIVER_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></>)}</div>
        {canCreate && !isEmpty && <Button onClick={() => setView('create')}><Plus className="h-4 w-4 mr-1.5" /> Add driver</Button>}
      </div>
      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}
      {isEmpty && (<Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Users className="h-6 w-6 text-muted-foreground" /></div><div className="space-y-1"><h3 className="font-semibold">No drivers yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Add drivers to assign them to vehicles and trips.</p></div>{canCreate && <Button onClick={() => setView('create')}><Plus className="h-4 w-4 mr-1.5" /> Add driver</Button>}</CardContent></Card>)}
      {!loading && rows.length > 0 && filtered.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No drivers match your filters.</CardContent></Card>}
      {!loading && filtered.length > 0 && (<>
        <Card className="hidden md:block overflow-hidden"><Table>
          <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Phone</TableHead><TableHead>License</TableHead><TableHead>Expiry</TableHead><TableHead>Vehicle</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((r) => (<TableRow key={r.id} className="cursor-pointer" onClick={() => { setSel(r.id); setView('detail'); }}>
            <TableCell className="font-medium">{r.name}</TableCell><TableCell className="text-muted-foreground">{r.phone || '—'}</TableCell><TableCell className="text-muted-foreground">{r.licenseNumber || '—'}</TableCell>
            <TableCell className="text-muted-foreground">{r.licenseExpiry ? formatJoined(r.licenseExpiry) : '—'}</TableCell><TableCell className="text-muted-foreground">{r.assignedVehicleNumber || '—'}</TableCell><TableCell><DriverStatusBadge status={r.status} /></TableCell>
          </TableRow>))}</TableBody></Table></Card>
        <div className="space-y-3 md:hidden">{filtered.map((r) => (<Card key={r.id} className="cursor-pointer" onClick={() => { setSel(r.id); setView('detail'); }}><CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate font-semibold">{r.name}</div><div className="truncate text-sm text-muted-foreground">{r.phone || 'No phone'}</div></div><DriverStatusBadge status={r.status} /></div>
          <div className="flex justify-between border-t pt-2 text-sm text-muted-foreground"><span>{r.licenseNumber || 'No license'}</span><span>{r.assignedVehicleNumber || 'No vehicle'}</span></div>
        </CardContent></Card>))}</div>
      </>)}
    </div>
  );
}

// ----------------------------- ASSIGNMENTS -----------------------------
function AssignmentRow({ booking, vehicles, drivers, canUpdate, onSaved }) {
  const [vehicleId, setVehicleId] = useState(booking.vehicleId || '');
  const [driverId, setDriverId] = useState(booking.driverId || '');
  const [status, setStatus] = useState(booking.assignmentStatus || 'unassigned');
  const [saving, setSaving] = useState(false);
  const dirty = (booking.vehicleId || '') !== vehicleId || (booking.driverId || '') !== driverId || (booking.assignmentStatus || 'unassigned') !== status;
  const save = async () => { setSaving(true); try { const d = await api(`/bookings/${booking.id}/assignment`, { method: 'PUT', body: JSON.stringify({ vehicleId, driverId, assignmentStatus: status }) }); toast.success('Assignment saved'); onSaved && onSaved(d.booking); } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); } };
  return (
    <Card><CardContent className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="font-semibold">{booking.bookingNumber}</div><div className="truncate text-sm text-muted-foreground">{booking.customerName} · {booking.destination}</div><div className="text-xs text-muted-foreground">{travelDates(booking)}</div></div>
        <MetaBadge meta={ASSIGNMENT_STATUS_META[status] || ASSIGNMENT_STATUS_META.unassigned} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Vehicle</Label>
          <Select value={vehicleId || 'none'} onValueChange={(v) => setVehicleId(v === 'none' ? '' : v)} disabled={!canUpdate}><SelectTrigger className="h-9"><SelectValue placeholder="No vehicle" /></SelectTrigger><SelectContent><SelectItem value="none">No vehicle</SelectItem>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{vehicleLabel(v)}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Driver</Label>
          <Select value={driverId || 'none'} onValueChange={(v) => setDriverId(v === 'none' ? '' : v)} disabled={!canUpdate}><SelectTrigger className="h-9"><SelectValue placeholder="No driver" /></SelectTrigger><SelectContent><SelectItem value="none">No driver</SelectItem>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus} disabled={!canUpdate}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{ASSIGNMENT_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{ASSIGNMENT_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></div>
      </div>
      {canUpdate && <div className="flex justify-end"><Button size="sm" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save assignment'}</Button></div>}
    </CardContent></Card>
  );
}

function AssignmentsPane({ session }) {
  const canUpdate = can(session.user.role, 'fleet:update');
  const [bookings, setBookings] = useState([]); const [vehicles, setVehicles] = useState([]); const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true); const [query, setQuery] = useState('');
  useEffect(() => { (async () => { setLoading(true); try { const [b, v, d] = await Promise.all([api('/bookings'), api('/vehicles'), api('/drivers')]); setBookings(b.bookings || []); setVehicles(v.vehicles || []); setDrivers(d.drivers || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, []);
  const q = query.trim().toLowerCase();
  const filtered = bookings.filter((b) => b.status !== 'cancelled' && (!q || [b.bookingNumber, b.customerName, b.destination].some((f) => String(f || '').toLowerCase().includes(q))));
  const isEmpty = !loading && bookings.length === 0;
  const onSaved = (updated) => setBookings((xs) => xs.map((x) => x.id === updated.id ? { ...x, ...updated } : x));
  return (
    <div className="space-y-4">
      {!isEmpty && !loading && <div className="relative sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search booking / customer" className="pl-9" /></div>}
      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}
      {isEmpty && (<Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><ClipboardList className="h-6 w-6 text-muted-foreground" /></div><div className="space-y-1"><h3 className="font-semibold">No bookings to assign</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Create bookings first, then assign vehicles and drivers to them here.</p></div></CardContent></Card>)}
      {!loading && bookings.length > 0 && filtered.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No bookings match your search.</CardContent></Card>}
      {!loading && filtered.length > 0 && <div className="grid gap-3 lg:grid-cols-2">{filtered.map((b) => <AssignmentRow key={b.id} booking={b} vehicles={vehicles} drivers={drivers} canUpdate={canUpdate} onSaved={onSaved} />)}</div>}
    </div>
  );
}

// ----------------------------- FLEET WORKSPACE -----------------------------
function Fleet({ session }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  ];
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold">Fleet</h2><p className="text-sm text-muted-foreground">Vehicles, drivers and trip assignments for your agency.</p></div>
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
        {tabs.map((t) => { const Icon = t.icon; const active = tab === t.id; return (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="h-4 w-4" /> {t.label}
          </button>); })}
      </div>
      {tab === 'overview' && <FleetOverview />}
      {tab === 'vehicles' && <VehiclesPane session={session} />}
      {tab === 'drivers' && <DriversPane session={session} />}
      {tab === 'assignments' && <AssignmentsPane session={session} />}
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
