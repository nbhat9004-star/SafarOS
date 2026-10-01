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
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  Building2, Users, Contact, ShieldCheck, LayoutDashboard, LogOut, Plus,
  Trash2, Lock, Globe, Layers, ArrowLeft,
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
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Create your agency workspace or sign in to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signup">Create workspace</TabsTrigger>
                <TabsTrigger value="login">Sign in</TabsTrigger>
              </TabsList>

              <TabsContent value="signup" className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label>Agency name</Label>
                  <Input placeholder="Wanderlust Travels" value={signup.agencyName}
                    onChange={(e) => setSignup({ ...signup, agencyName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Your name</Label>
                  <Input placeholder="Jane Doe" value={signup.name}
                    onChange={(e) => setSignup({ ...signup, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Work email</Label>
                  <Input type="email" placeholder="jane@agency.com" value={signup.email}
                    onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" placeholder="........" value={signup.password}
                    onChange={(e) => setSignup({ ...signup, password: e.target.value })} />
                </div>
                <Button className="w-full" onClick={doSignup} disabled={loading}>
                  {loading ? 'Creating...' : 'Create agency workspace'}
                </Button>
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
  const { user, agency } = session;

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
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold capitalize">{active}</span>
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

function Clients({ session }) {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [open, setOpen] = useState(false);
  const role = session.user.role;
  const canCreate = ['owner', 'manager', 'agent'].includes(role);
  const canDelete = ['owner', 'manager'].includes(role);

  const load = async () => {
    try { const d = await api('/clients'); setClients(d.clients); } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    try {
      await api('/clients', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Client added');
      setForm({ name: '', email: '', phone: '', notes: '' });
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };
  const remove = async (id) => {
    try { await api(`/clients/${id}`, { method: 'DELETE' }); toast.success('Deleted'); load(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Clients</h2>
          <p className="text-sm text-muted-foreground">Agency-scoped client records.</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add client</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New client</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={add} disabled={!form.name}>Save client</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {clients.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          No clients yet. {canCreate ? 'Add your first client to get started.' : ''}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    {c.email && <div className="text-sm text-muted-foreground">{c.email}</div>}
                    {c.phone && <div className="text-sm text-muted-foreground">{c.phone}</div>}
                  </div>
                  {canDelete && (
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                {c.notes && <p className="text-sm mt-2 text-foreground/80">{c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Team({ session }) {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [open, setOpen] = useState(false);
  const canInvite = ['owner', 'manager'].includes(session.user.role);

  const load = async () => {
    try { const d = await api('/members'); setMembers(d.members); } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    try {
      await api('/members', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Member added');
      setForm({ name: '', email: '', password: '', role: 'agent' });
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Team</h2>
          <p className="text-sm text-muted-foreground">Members of this agency workspace.</p>
        </div>
        {canInvite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add member</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Temporary password</Label>
                  <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Role</Label>
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
                <Button onClick={invite} disabled={!form.name || !form.email || !form.password}>Add member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.email}</div>
              </div>
              <RoleBadge role={m.role} />
            </CardContent>
          </Card>
        ))}
      </div>
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
      {session ? <Dashboard session={session} onLogout={logout} /> : <AuthView onAuthed={onAuthed} initialTab={initialTab} />}
      <Toaster richColors position="top-right" />
    </>
  );
}

export default AppExperience;
