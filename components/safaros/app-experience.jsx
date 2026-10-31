'use client';

// SafarOS authenticated experience (auth + workspace dashboard).
// Moved verbatim from the original app/page.js — auth/session/tenant logic UNCHANGED.
// Exposed as a reusable component so /app, /login and /signup can render it.

import { useEffect, useState, useRef } from 'react';
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
import { useLocalization } from '@/components/safaros/localization-provider';
import { GCC_COUNTRIES, getCountryDefaults } from '@/lib/localization';
import { useSync } from '@/lib/offline/useSync';
import {
  Building2, Users, Contact, ShieldCheck, LayoutDashboard, LogOut, Plus,
  Trash2, Lock, Globe, Layers, ArrowLeft, Menu, X, Search, Pencil, Eye,
  UserPlus, BookUser, CalendarClock, ListTodo, Activity, Filter, ArrowRight, CheckCircle2,
  FileText, FilePlus, Copy, FileDown, MapPin,
  Package, Map, Clock, Utensils, Car, BedDouble,
  ChevronDown, ChevronUp, CalendarDays,
  Store, Phone, Mail, ClipboardList, Wallet, Truck,
  Wifi, WifiOff, RefreshCw, CloudOff,
  Receipt, TrendingUp, CreditCard, BarChart3,
  Banknote, Printer, Undo2,
  MessageSquare, Sparkles, Send, Bot, Megaphone, UserCog, ExternalLink,
  Palette, Gauge, PieChart, Compass, Star, LayoutGrid, ChevronRight,
  Upload, Download, Database, Loader2, AlertCircle, FileSpreadsheet, Ticket, Plug,
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
  const { locale, countryCode, currency, updatePreferences } = useLocalization();
  const isArabic = locale === 'ar';
  const t = (en, ar) => isArabic ? ar : en;
  const [tab, setTab] = useState(initialTab === 'signup' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [signup, setSignup] = useState({ agencyName: '', name: '', email: '', password: '', countryCode });
  const [login, setLogin] = useState({ email: '', password: '' });

  const doSignup = async () => {
    setLoading(true);
    try {
      await api('/auth/register-agency', { method: 'POST', body: JSON.stringify({ ...signup, countryCode: signup.countryCode || countryCode, currency }) });
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
    <div className="min-h-screen grid lg:grid-cols-2 so-font" lang={locale} dir={isArabic ? 'rtl' : 'ltr'}>
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
            <CardTitle>{tab === 'signup' ? t('Create your SafarOS workspace', 'أنشئ مساحة عمل SafarOS') : t('Welcome back', 'مرحباً بعودتك')}</CardTitle>
            <CardDescription>{tab === 'signup' ? t('Bring your travel business into one intelligent operating system.', 'اجمع أعمال السفر في نظام تشغيل ذكي واحد.') : t('Sign in to continue to your workspace.', 'سجّل الدخول للمتابعة إلى مساحة عملك.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signup">{t('Create workspace', 'إنشاء مساحة عمل')}</TabsTrigger>
                <TabsTrigger value="login">{t('Sign in', 'تسجيل الدخول')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signup" className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label>{t('Your name', 'اسمك')}</Label>
                  <Input placeholder="Jane Doe" value={signup.name}
                    onChange={(e) => setSignup({ ...signup, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Business email', 'البريد الإلكتروني للعمل')}</Label>
                  <Input type="email" placeholder="jane@agency.com" value={signup.email}
                    onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Password', 'كلمة المرور')}</Label>
                  <Input type="password" placeholder="........" value={signup.password}
                    onChange={(e) => setSignup({ ...signup, password: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Agency name', 'اسم الوكالة')}</Label>
                  <Input placeholder="Wanderlust Travels" value={signup.agencyName}
                    onChange={(e) => setSignup({ ...signup, agencyName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Country', 'الدولة')}</Label>
                  <select required value={signup.countryCode || countryCode} onChange={(e) => { const code = e.target.value; const defaults = getCountryDefaults(code); setSignup({ ...signup, countryCode: code }); if (defaults) updatePreferences({ countryCode: code }); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {Object.values(GCC_COUNTRIES).map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                  </select>
                </div>
                <Button className="w-full" onClick={doSignup} disabled={loading}>
                  {loading ? t('Creating...', 'جارٍ الإنشاء...') : t('Create Workspace', 'إنشاء مساحة العمل')}
                </Button>
                <button type="button" onClick={() => setTab('login')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                  {t('Already have an account?', 'لديك حساب بالفعل؟')} <span className="font-medium text-foreground">{t('Sign in', 'تسجيل الدخول')}</span>
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
                  <div className="text-right"><a href="/reset-password?type=agency" className="text-xs text-violet-700 hover:underline">Forgot password?</a></div>
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
      { id: 'discover', label: 'Discover Suppliers', icon: Compass },
      { id: 'packages', label: 'Packages', icon: Package },
      { id: 'itineraries', label: 'Itineraries', icon: Map },
      { id: 'suppliers', label: 'Suppliers', icon: Store },
      { id: 'bookings', label: 'Bookings', icon: ClipboardList },
      { id: 'fleet', label: 'Fleet', icon: Truck },
    ],
  },
  {
    group: 'Business / Finance',
    items: [
      { id: 'fin_dashboard', label: 'Finance Dashboard', icon: Wallet },
      { id: 'fin_transactions', label: 'Transactions', icon: Receipt },
      { id: 'fin_receivables', label: 'Customer Receivables', icon: TrendingUp },
      { id: 'fin_payables', label: 'Supplier Payables', icon: Store },
      { id: 'fin_expenses', label: 'Expenses', icon: CreditCard },
      { id: 'fin_invoices', label: 'Invoices', icon: FileText },
      { id: 'fin_payments', label: 'Payments', icon: Banknote },
      { id: 'fin_reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    group: 'Communications',
    items: [
      { id: 'comm_inbox', label: 'Inbox', icon: MessageSquare },
      { id: 'comm_conversations', label: 'Conversations', icon: Contact },
      { id: 'comm_templates', label: 'Templates', icon: FileText },
      { id: 'comm_activity', label: 'Activity', icon: Activity },
    ],
  },
  {
    group: 'Website',
    items: [
      { id: 'web_dashboard', label: 'Website', icon: Globe },
      { id: 'web_settings', label: 'Settings', icon: Building2 },
      { id: 'web_appearance', label: 'Appearance', icon: Palette },
      { id: 'web_pages', label: 'Pages', icon: FileText },
      { id: 'web_seo', label: 'SEO', icon: Search },
      { id: 'web_preview', label: 'Preview', icon: Eye },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { id: 'an_overview', label: 'Overview', icon: Gauge },
      { id: 'an_sales', label: 'Sales', icon: TrendingUp },
      { id: 'an_crm', label: 'CRM', icon: Contact },
      { id: 'an_finance', label: 'Finance', icon: Wallet },
      { id: 'an_operations', label: 'Operations', icon: Truck },
    ],
  },
  {
    group: 'Subscription & Billing',
    items: [
      { id: 'sub_overview', label: 'Subscription', icon: CreditCard },
      { id: 'sub_plans', label: 'Plans', icon: Layers },
      { id: 'sub_usage', label: 'Usage & Limits', icon: Gauge },
      { id: 'sub_billing', label: 'Billing History', icon: Receipt },
      { id: 'sub_history', label: 'Change Log', icon: Clock },
    ],
  },
  {
    group: 'Integrations',
    items: [
      { id: 'int_overview', label: 'Integrations', icon: Globe },
      { id: 'int_webhooks', label: 'Webhooks', icon: ExternalLink },
      { id: 'int_api', label: 'Developer API', icon: ShieldCheck },
    ],
  },
  { id: 'copilot', label: 'Copilot', icon: Sparkles },
  { id: 'portal_admin', label: 'Customer Portal', icon: ShieldCheck },
  {
    group: 'Data Tools',
    items: [
      { id: 'data_import', label: 'Import Data', icon: Upload },
      { id: 'data_export', label: 'Export Data', icon: Download },
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
  discover: 'Discover Suppliers',
  bookings: 'Bookings',
  fleet: 'Fleet',
  fin_dashboard: 'Finance Dashboard', fin_transactions: 'Transactions',
  fin_receivables: 'Customer Receivables', fin_payables: 'Supplier Payables',
  fin_expenses: 'Expenses', fin_invoices: 'Invoices', fin_reports: 'Reports',
  fin_payments: 'Payments',
  comm_inbox: 'Communications', comm_conversations: 'Conversations', comm_templates: 'Templates', comm_activity: 'Communication Activity',
  copilot: 'AI Copilot', portal_admin: 'Customer Portal Access',
  web_dashboard: 'Website', web_settings: 'Website Settings', web_appearance: 'Appearance', web_pages: 'Website Pages', web_seo: 'SEO & Search', web_preview: 'Website Preview',
  an_overview: 'Analytics Overview', an_sales: 'Sales Analytics', an_crm: 'CRM Analytics', an_finance: 'Finance Analytics', an_operations: 'Operations Analytics',
  sub_overview: 'Subscription', sub_plans: 'Plans', sub_usage: 'Usage & Limits', sub_billing: 'Billing History', sub_history: 'Subscription Change Log',
  int_overview: 'Integrations', int_webhooks: 'Webhooks', int_api: 'Developer API',
  data_import: 'Import Data', data_export: 'Export Data',
  travelrules: 'Travel Intelligence', documents: 'Document Vault', customfields: 'Custom Fields', suppliers_network: 'Supplier Network',
  team: 'Team', settings: 'Settings',
};

function sectionGroupOf(id) {
  for (const n of NAV) {
    if (n.group && n.items?.some((it) => it.id === id)) return n.group;
    if (n.id === id) return 'Workspace';
  }
  // prefix groups (fin_, comm_, web_, an_, sub_, int_)
  const pref = String(id).split('_')[0];
  const map = { fin: 'Finance', comm: 'Communications', web: 'Website', an: 'Analytics', sub: 'Subscription & Billing', int: 'Integrations' };
  return map[pref] || 'Workspace';
}

function NavButton({ item, active, onSelect, mobile }) {
  const Icon = item.icon;
  const isActive = active === item.id;
  const base = mobile
    ? 'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors'
    : 'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors';
  const state = isActive
    ? 'so-nav-active'
    : 'text-muted-foreground hover:bg-accent hover:text-foreground';
  return (
    <button onClick={() => onSelect(item.id)} className={`${base} ${state}`}>
      {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />}
      {Icon && <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-violet-600 dark:text-violet-300' : 'text-muted-foreground group-hover:text-foreground'}`} />}
      <span className="truncate">{item.label}</span>
    </button>
  );
}

function NavList({ active, onSelect, mobile }) {
  return (
    <div className="space-y-1">
      {NAV.map((n) => {
        if (n.group) {
          return (
            <div key={n.group} className="pt-4 first:pt-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">{n.group}</div>
              <div className="space-y-0.5">
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

// ===================== K1.5 — Dual navigation model =====================
// DESKTOP = minimal major categories + a workspace app-launcher in the main area.
// MOBILE  = the familiar sidebar, reorganized into a collapsible accordion.
// Both route to the SAME existing feature ids — no routes/features are removed.

// Mobile accordion sections (collapsed by default; one open at a time).
const MOBILE_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, leaf: true },
  { id: 'crm', label: 'CRM', icon: Contact, items: [
    { id: 'crm', label: 'Dashboard' }, { id: 'leads', label: 'Leads' }, { id: 'clients', label: 'Clients' },
    { id: 'contacts', label: 'Contacts' }, { id: 'followups', label: 'Follow-ups' }, { id: 'tasks', label: 'Tasks' }, { id: 'activities', label: 'Activities' },
  ] },
  { id: 'sales', label: 'Sales', icon: FileText, items: [
    { id: 'quotations', label: 'Quotations' }, { id: 'quote-create', label: 'Create Quotation' }, { id: 'packages', label: 'Packages' },
  ] },
  { id: 'operations', label: 'Operations', icon: Truck, items: [
    { id: 'itineraries', label: 'Itineraries' }, { id: 'bookings', label: 'Bookings' }, { id: 'suppliers', label: 'Suppliers' }, { id: 'fleet', label: 'Fleet' },
  ] },
  { id: 'finance', label: 'Finance', icon: Wallet, items: [
    { id: 'fin_dashboard', label: 'Finance Dashboard' }, { id: 'fin_transactions', label: 'Transactions' }, { id: 'fin_receivables', label: 'Customer Receivables' },
    { id: 'fin_payables', label: 'Supplier Payables' }, { id: 'fin_expenses', label: 'Expenses' }, { id: 'fin_invoices', label: 'Invoices' }, { id: 'fin_payments', label: 'Payments' }, { id: 'fin_reports', label: 'Reports' },
  ] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, items: [
    { id: 'comm_inbox', label: 'Inbox' }, { id: 'comm_conversations', label: 'Conversations' }, { id: 'comm_templates', label: 'Templates' }, { id: 'comm_activity', label: 'Activity' }, { id: 'portal_admin', label: 'Customer Portal' },
  ] },
  { id: 'discover', label: 'Discover', icon: Compass, items: [
    { id: 'discover', label: 'Supplier Discovery' }, { id: 'suppliers', label: 'Saved Suppliers' },
  ] },
  { id: 'aitools', label: 'AI & Tools', icon: Sparkles, items: [
    { id: 'copilot', label: 'AI Copilot' }, { id: 'an_overview', label: 'Analytics' },
  ] },
  { id: 'more', label: 'More', icon: LayoutGrid, items: [
    { id: 'web_dashboard', label: 'Website' }, { id: 'int_overview', label: 'Integrations' }, { id: 'data_import', label: 'Import Data' }, { id: 'data_export', label: 'Export Data' }, { id: 'sub_overview', label: 'Subscription' }, { id: 'team', label: 'Team' }, { id: 'settings', label: 'Settings' },
  ] },
];

// Desktop minimal majors + their workspace tiles (the app launcher).
const DESKTOP_WORKSPACES = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, home: true },
  { id: 'crm', label: 'CRM', icon: Contact, subtitle: 'Leads, clients & your sales pipeline', tiles: [
    { id: 'crm', label: 'CRM Dashboard', desc: 'Live pipeline snapshot', icon: LayoutDashboard, tone: 'violet' },
    { id: 'leads', label: 'Leads', desc: 'Manage and track prospects', icon: UserPlus, tone: 'sky' },
    { id: 'clients', label: 'Clients', desc: 'Customer relationships', icon: Contact, tone: 'violet' },
    { id: 'contacts', label: 'Contacts', desc: 'Contact management', icon: BookUser, tone: 'emerald' },
    { id: 'followups', label: 'Follow-ups', desc: 'Scheduled follow-ups', icon: CalendarClock, tone: 'amber' },
    { id: 'tasks', label: 'Tasks', desc: 'Team tasks', icon: ListTodo, tone: 'rose' },
    { id: 'activities', label: 'Activities', desc: 'CRM activity timeline', icon: Activity, tone: 'sky' },
  ] },
  { id: 'sales', label: 'Sales', icon: FileText, subtitle: 'Quotations & travel packages', tiles: [
    { id: 'quotations', label: 'Quotations', desc: 'Create and manage quotes', icon: FileText, tone: 'violet' },
    { id: 'quote-create', label: 'Create Quotation', desc: 'Start a new quotation', icon: FilePlus, tone: 'emerald' },
    { id: 'packages', label: 'Packages', desc: 'Travel packages', icon: Package, tone: 'amber' },
  ] },
  { id: 'operations', label: 'Operations', icon: Truck, subtitle: 'Itineraries, bookings, suppliers & fleet', tiles: [
    { id: 'itineraries', label: 'Itineraries', desc: 'Day-by-day travel plans', icon: Map, tone: 'violet' },
    { id: 'bookings', label: 'Bookings', desc: 'Manage bookings', icon: ClipboardList, tone: 'sky' },
    { id: 'suppliers', label: 'Suppliers', desc: 'Supplier management', icon: Store, tone: 'emerald' },
    { id: 'fleet', label: 'Fleet', desc: 'Vehicles and drivers', icon: Truck, tone: 'amber' },
  ] },
  { id: 'finance', label: 'Finance', icon: Wallet, subtitle: 'Money in, money out', tiles: [
    { id: 'fin_dashboard', label: 'Finance Overview', desc: 'Financial snapshot', icon: Wallet, tone: 'violet' },
    { id: 'fin_transactions', label: 'Transactions', desc: 'All money movement', icon: Receipt, tone: 'sky' },
    { id: 'fin_receivables', label: 'Receivables', desc: 'Money owed to you', icon: TrendingUp, tone: 'emerald' },
    { id: 'fin_payables', label: 'Payables', desc: 'Money you owe suppliers', icon: Store, tone: 'amber' },
    { id: 'fin_expenses', label: 'Expenses', desc: 'Business expenses', icon: CreditCard, tone: 'rose' },
    { id: 'fin_invoices', label: 'Invoices', desc: 'Customer invoices', icon: FileText, tone: 'violet' },
    { id: 'fin_payments', label: 'Payments', desc: 'Payment records', icon: Banknote, tone: 'emerald' },
    { id: 'fin_reports', label: 'Reports', desc: 'Financial reports', icon: BarChart3, tone: 'sky' },
  ] },
  { id: 'discover', label: 'Discover', icon: Compass, direct: 'discover' },
  { id: 'more', label: 'More', icon: LayoutGrid, subtitle: 'Communications, tools & settings', tiles: [
    { id: 'comm_inbox', label: 'Communications', desc: 'Inbox, templates & logs', icon: MessageSquare, tone: 'sky' },
    { id: 'copilot', label: 'AI Copilot', desc: 'Your AI travel assistant', icon: Sparkles, tone: 'violet' },
    { id: 'an_overview', label: 'Analytics', desc: 'Business insights & reports', icon: Gauge, tone: 'emerald' },
    { id: 'travelrules', label: 'Travel Intelligence', desc: 'Rules & surcharges', icon: MapPin, tone: 'violet' },
    { id: 'documents', label: 'Document Vault', desc: 'Secure document storage', icon: FileText, tone: 'sky' },
    { id: 'customfields', label: 'Custom Fields', desc: 'Extend modules with fields', icon: Database, tone: 'emerald' },
    { id: 'suppliers_network', label: 'Supplier Network', desc: 'B2B network visibility', icon: Store, tone: 'amber' },
    { id: 'web_dashboard', label: 'Website', desc: 'Your agency website', icon: Globe, tone: 'amber' },
    { id: 'portal_admin', label: 'Customer Portal', desc: 'Client portal access', icon: ShieldCheck, tone: 'violet' },
    { id: 'int_overview', label: 'Integrations', desc: 'Connect external tools', icon: ExternalLink, tone: 'sky' },
    { id: 'data_import', label: 'Import Data', desc: 'Import CSV / XLSX records', icon: Upload, tone: 'emerald' },
    { id: 'data_export', label: 'Export Data', desc: 'Export your records to CSV', icon: Download, tone: 'sky' },
    { id: 'sub_overview', label: 'Subscription', desc: 'Plan & billing', icon: CreditCard, tone: 'rose' },
    { id: 'team', label: 'Team', desc: 'Members & roles', icon: Users, tone: 'emerald' },
    { id: 'settings', label: 'Settings', desc: 'Agency settings', icon: Building2, tone: 'violet' },
  ] },
];

const FEATURE_TO_MAJOR = (() => {
  const m = {};
  for (const ws of DESKTOP_WORKSPACES) {
    (ws.tiles || []).forEach((t) => { if (!(t.id in m)) m[t.id] = ws.id; });
    if (ws.direct) m[ws.direct] = ws.id;
    if (ws.home) m[ws.id] = ws.id;
  }
  return m;
})();

function majorOf(active) {
  if (String(active).startsWith('ws:')) return String(active).slice(3);
  if (FEATURE_TO_MAJOR[active]) return FEATURE_TO_MAJOR[active];
  if (String(active).startsWith('fin_')) return 'finance';
  if (/^(comm_|web_|an_|sub_|int_)/.test(String(active)) || ['copilot', 'portal_admin', 'team', 'settings'].includes(active)) return 'more';
  return 'overview';
}
function majorLabel(id) { const w = DESKTOP_WORKSPACES.find((x) => x.id === id); return w ? w.label : ''; }
function titleOf(active) {
  if (String(active).startsWith('ws:')) return majorLabel(String(active).slice(3)) || 'SafarOS';
  return SECTION_TITLES[active] || 'SafarOS';
}

const TILE_TONES = {
  violet: 'from-violet-500 to-indigo-600', emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-600', sky: 'from-sky-500 to-blue-600', rose: 'from-rose-500 to-pink-600',
};

// Desktop: minimal major-category rail.
function DesktopNav({ active, onSelect }) {
  const cur = majorOf(active);
  return (
    <div className="space-y-1">
      {DESKTOP_WORKSPACES.map((w) => {
        const Icon = w.icon; const on = cur === w.id;
        const target = w.home ? 'overview' : w.direct ? w.direct : `ws:${w.id}`;
        return (
          <button key={w.id} onClick={() => onSelect(target)}
            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${on ? 'so-nav-active' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
            {on && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />}
            <Icon className={`h-[18px] w-[18px] shrink-0 ${on ? 'text-violet-600 dark:text-violet-300' : 'text-muted-foreground group-hover:text-foreground'}`} />
            <span className="truncate font-medium">{w.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Desktop: workspace app-launcher grid shown when a major category is selected.
function WorkspaceLauncher({ majorId, onOpen }) {
  const w = DESKTOP_WORKSPACES.find((x) => x.id === majorId);
  if (!w || !w.tiles) return null;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{w.label}</h2>
        {w.subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{w.subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {w.tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => onOpen(t.id)} className="text-left">
              <Card className="so-kpi h-full">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${TILE_TONES[t.tone] || TILE_TONES.violet} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{t.label}</div>
                    {t.desc && <div className="mt-0.5 text-xs text-muted-foreground">{t.desc}</div>}
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-xs font-medium text-violet-600">Open <ChevronRight className="h-3.5 w-3.5" /></div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Mobile: accordion navigation — collapsed by default, one section open at a time.
function MobileAccordion({ active, onSelect }) {
  const [open, setOpen] = useState(() => majorOf(active));
  const toggle = (id) => setOpen((cur) => (cur === id ? '' : id));
  return (
    <div className="space-y-1">
      {MOBILE_NAV.map((sec) => {
        const Icon = sec.icon;
        if (sec.leaf) {
          const on = active === sec.id;
          return (
            <button key={sec.id} onClick={() => onSelect(sec.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${on ? 'so-nav-active' : 'text-foreground hover:bg-accent'}`}>
              <Icon className={`h-[18px] w-[18px] shrink-0 ${on ? 'text-violet-600' : 'text-muted-foreground'}`} /><span className="font-medium">{sec.label}</span>
            </button>
          );
        }
        const expanded = open === sec.id;
        return (
          <div key={sec.id}>
            <button onClick={() => toggle(sec.id)} aria-expanded={expanded}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent">
              <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
              <span className="flex-1 text-left font-medium">{sec.label}</span>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            {expanded && (
              <div className="mb-1 ml-4 space-y-0.5 border-l border-border pl-2">
                {sec.items.map((it) => {
                  const on = active === it.id;
                  return (
                    <button key={it.id} onClick={() => onSelect(it.id)}
                      className={`flex w-full items-center rounded-lg px-3 py-2 text-[13px] ${on ? 'so-nav-active' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                      {it.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SyncStatusIndicator() {
  const { online, status, pendingCount, syncNow } = useSync();
  // Unobtrusive: fully synced + online with nothing pending => subtle dot only.
  if (online && status === 'synced' && !pendingCount) {
    return (
      <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground" title="Online — all changes synced">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
      </span>
    );
  }
  let cfg;
  if (!online) cfg = { icon: WifiOff, text: 'Offline', cls: 'bg-muted text-muted-foreground border-border' };
  else if (status === 'syncing') cfg = { icon: RefreshCw, text: 'Syncing…', cls: 'bg-sky-50 text-sky-700 border-sky-200', spin: true };
  else if (status === 'error') cfg = { icon: CloudOff, text: 'Sync error', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  else if (pendingCount) cfg = { icon: RefreshCw, text: `${pendingCount} pending`, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  else cfg = { icon: Wifi, text: 'Online', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  const Icon = cfg.icon;
  const clickable = online && (status === 'error' || pendingCount > 0);
  return (
    <button type="button" disabled={!clickable} onClick={() => clickable && syncNow()}
      title={clickable ? 'Sync now' : cfg.text}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.cls} ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>
      <Icon className={`h-3.5 w-3.5 ${cfg.spin ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">{cfg.text}</span>
    </button>
  );
}

// ======================= SUPPLIER DISCOVERY (K1) =======================
const DISCOVER_TYPE_LABEL = { hotel: 'Hotel', houseboat: 'Houseboat', transport: 'Transport', activity: 'Activity', guide: 'Guide', restaurant: 'Restaurant', other: 'Other' };
const DISCOVER_EXAMPLES = ['Hotels in Srinagar', 'Houseboats in Nigeen', 'Cabs in Pahalgam', 'Shikara services in Dal Lake', 'Tour guides in Kashmir', 'Hotels in Dubai'];
const DISCOVER_CATEGORIES = ['hotel', 'houseboat', 'transport', 'activity', 'guide', 'restaurant'];
const waDigits = (n) => String(n || '').replace(/[^\d]/g, '');

function DiscoverResultCard({ r, session, onSaved }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(r.saved ? 'saved' : 'idle'); // idle | saving | saved | duplicate
  const canSave = can(session?.user?.role, 'suppliers:create');
  const wa = r.whatsapp || waDigits(r.phone);
  const typeLabel = DISCOVER_TYPE_LABEL[r.supplierType] || 'Other';

  const save = async () => {
    if (state === 'saving' || state === 'saved') return;
    setState('saving');
    try {
      const res = await api('/discovery/save', { method: 'POST', body: JSON.stringify(r) });
      if (res.duplicate) { setState('duplicate'); toast.info(`"${r.name}" is already in your suppliers.`); }
      else { setState('saved'); toast.success(`"${r.name}" added to My Suppliers.`); }
      onSaved && onSaved(r, res);
    } catch (e) { setState('idle'); toast.error(e.message || 'Could not save supplier'); }
  };

  const openWhatsApp = () => {
    if (!wa) return;
    api('/discovery/activity', { method: 'POST', body: JSON.stringify({ action: 'whatsapp', name: r.name, sourceId: r.sourceId }) }).catch(() => {});
    window.open(`https://wa.me/${wa}`, '_blank', 'noopener');
  };

  const renderSave = (full = false) => (
    <Button size="sm" onClick={save} disabled={!canSave || state === 'saving' || state === 'saved'}
      className={`${full ? 'w-full ' : ''}${state === 'saved' ? 'bg-emerald-600 hover:bg-emerald-600' : state === 'duplicate' ? 'bg-slate-500 hover:bg-slate-500' : 'bg-violet-600 hover:bg-violet-700'}`}>
      {state === 'saved' ? <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Saved</>
        : state === 'duplicate' ? <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Already saved</>
        : state === 'saving' ? 'Saving…'
        : <><Plus className="mr-1.5 h-4 w-4" /> Add to My Suppliers</>}
    </Button>
  );

  return (
    <Card className="flex flex-col overflow-hidden so-kpi">
      <div className="relative h-32 w-full bg-gradient-to-br from-violet-500/15 to-indigo-500/10">
        {r.photoName ? (
          <img src={`/api/discovery/photo?name=${encodeURIComponent(r.photoName)}`} alt={r.name}
            className="h-full w-full object-cover" loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-violet-400"><Store className="h-10 w-10" /></div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold capitalize text-violet-700 shadow-sm">{typeLabel}</span>
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0">
          <div className="truncate font-semibold" title={r.name}>{r.name}</div>
          {r.category && <div className="truncate text-xs capitalize text-muted-foreground">{r.category}</div>}
        </div>
        {(r.rating != null) && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r.rating}
            {r.reviews != null && <span className="text-muted-foreground">({r.reviews})</span>}
          </div>
        )}
        {r.address && <div className="flex items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="line-clamp-2">{r.address}</span></div>}

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setOpen(true)}><Eye className="h-4 w-4" /></Button>
            {wa && <Button size="sm" variant="outline" className="h-8 px-2 text-emerald-700" onClick={openWhatsApp} title="WhatsApp"><MessageSquare className="h-4 w-4" /></Button>}
            {r.phone && <a href={`tel:${r.phone}`} className="inline-flex"><Button size="sm" variant="outline" className="h-8 px-2" title="Call"><Phone className="h-4 w-4" /></Button></a>}
            {r.website && <a href={r.website} target="_blank" rel="noopener noreferrer" className="inline-flex"><Button size="sm" variant="outline" className="h-8 px-2" title="Website"><Globe className="h-4 w-4" /></Button></a>}
          </div>
          {renderSave(true)}
          </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="truncate pr-6">{r.name}</DialogTitle></DialogHeader>
          <div className="space-y-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold capitalize text-violet-700">{typeLabel}</span>
              {r.category && <span className="text-xs capitalize text-muted-foreground">{r.category}</span>}
              {r.rating != null && <span className="flex items-center gap-1 text-xs text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{r.rating}{r.reviews != null ? ` (${r.reviews})` : ''}</span>}
            </div>
            <DiscoverDetailRow icon={MapPin} label="Address" value={r.address} />
            <DiscoverDetailRow icon={Phone} label="Phone" value={r.phone} />
            <DiscoverDetailRow icon={Mail} label="Email" value={r.email} />
            <DiscoverDetailRow icon={Globe} label="Website" value={r.website} isLink />
            {r.mapUrl && <a href={r.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"><ExternalLink className="h-3.5 w-3.5" /> View on map</a>}
            <div className="text-[11px] text-muted-foreground">Source: {r.source === 'google_places' ? 'Google Places' : (r.source || 'provider')}</div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {wa && <Button variant="outline" className="text-emerald-700" onClick={openWhatsApp}><MessageSquare className="mr-1.5 h-4 w-4" /> WhatsApp</Button>}
            {renderSave(false)}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DiscoverDetailRow({ icon: Icon, label, value, isLink }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        {value
          ? (isLink
            ? <a href={value} target="_blank" rel="noopener noreferrer" className="break-all text-violet-600 hover:underline">{value}</a>
            : <div className="break-words">{value}</div>)
          : <div className="text-muted-foreground">Not available</div>}
      </div>
    </div>
  );
}

function SupplierDiscovery({ session, onGo = () => {} }) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [results, setResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(null); // null = unknown
  const [error, setError] = useState('');

  useEffect(() => {
    api('/discovery/status').then((d) => setConfigured(!!d.configured)).catch(() => setConfigured(false));
  }, []);

  const runSearch = async (q) => {
    const term = String(q ?? query).trim();
    if (!term) { toast.error('Enter a business or service to discover'); return; }
    setLoading(true); setError(''); setSubmitted(term);
    try {
      const d = await api(`/discovery/search?q=${encodeURIComponent(term)}&limit=12`);
      setConfigured(!!d.configured);
      setResults(Array.isArray(d.results) ? d.results : []);
    } catch (e) { setError(e.message || 'Discovery search failed'); setResults([]); }
    finally { setLoading(false); }
  };

  const onSubmit = (e) => { e.preventDefault(); runSearch(); };
  const pickExample = (ex) => { setQuery(ex); runSearch(ex); };
  const pickCategory = (cat) => {
    const loc = submitted.replace(new RegExp(`^(${DISCOVER_CATEGORIES.join('|')}|hotels|cabs|taxis)\\s+in\\s+`, 'i'), '').trim();
    const q = `${cat}s${loc ? ` in ${loc}` : ''}`;
    setQuery(q); runSearch(q);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold"><Compass className="h-5 w-5 text-violet-600" /> Discover Suppliers</h2>
        <p className="text-sm text-muted-foreground">Search real travel businesses anywhere and save them straight into your Supplier Management.</p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Houseboats in Nigeen, Hotels in Dubai…" className="pl-9" />
            </div>
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 sm:w-auto">
              <Search className="mr-1.5 h-4 w-4" /> {loading ? 'Searching…' : 'Search'}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DISCOVER_CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => pickCategory(c)}
                className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-muted-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">
                {DISCOVER_TYPE_LABEL[c]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider-not-configured notice */}
      {configured === false && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-start gap-3 p-5 text-sm">
            <Globe className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <div className="font-semibold text-amber-900">Discovery provider not connected yet</div>
              <p className="mt-0.5 text-amber-800">A business-data provider needs to be enabled for SafarOS before live results appear. The search experience is ready and will return real businesses as soon as the provider is configured. No sample or fake data is shown.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <Card className="border-rose-200 bg-rose-50/60"><CardContent className="p-4 text-sm text-rose-700">{error}</CardContent></Card>}

      {/* Initial prompt */}
      {results === null && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Compass className="h-7 w-7" /></div>
            <div className="space-y-1">
              <h3 className="font-semibold">Find your next supplier</h3>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">Search for hotels, houseboats, transport, guides, restaurants and activities — anywhere in Kashmir, India or worldwide.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {DISCOVER_EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => pickExample(ex)} className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">{ex}</button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse rounded-xl border bg-muted/30" />)}
        </div>
      )}

      {/* Empty results */}
      {!loading && Array.isArray(results) && results.length === 0 && configured !== false && !error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Search className="h-6 w-6 text-muted-foreground" /></div>
            <div className="space-y-1">
              <h3 className="font-semibold">No businesses found</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">We couldn&apos;t find results for &ldquo;{submitted}&rdquo;. Try a different location or service.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && Array.isArray(results) && results.length > 0 && (
        <>
          <div className="text-sm text-muted-foreground">{results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{submitted}&rdquo;</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((r, i) => <DiscoverResultCard key={r.sourceId || i} r={r} session={session} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ================= Universal Global Search =================
function GlobalSearch({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setData(null); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try { const d = await api(`/search?q=${encodeURIComponent(term)}`); setData(d); }
      catch { setData(null); } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const choose = (route) => { setOpen(false); setQ(''); setData(null); onNavigate(route); };

  return (
    <div ref={boxRef} className="relative">
      <div className="hidden w-56 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 sm:flex lg:w-72">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="Search everything…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        {q && <button onClick={() => { setQ(''); setData(null); }} aria-label="Clear" className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
      </div>
      <button onClick={() => setOpen((o) => !o)} aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent sm:hidden"><Search className="h-5 w-5" /></button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[92vw] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="flex items-center gap-2 border-b px-3 py-2 sm:hidden">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything…" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <div className="max-h-[60vh] overflow-auto p-2">
            {loading && <div className="px-3 py-6 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />Searching…</div>}
            {!loading && q.trim().length < 2 && <div className="px-3 py-6 text-center text-xs text-muted-foreground">Type at least 2 characters. Searches leads, clients, suppliers, quotations, packages, itineraries, bookings, fleet &amp; payments.</div>}
            {!loading && q.trim().length >= 2 && data && data.total === 0 && <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matches for &ldquo;{q.trim()}&rdquo;.</div>}
            {!loading && data && data.groups.map((g) => (
              <div key={g.type} className="mb-1">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</div>
                {g.items.map((it) => (
                  <button key={it.id} onClick={() => choose(g.route)} className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-accent">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{it.title}</div>
                      {it.subtitle && <div className="truncate text-xs text-muted-foreground">{it.subtitle}</div>}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= Data Import & Migration =================
const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = reject;
  r.readAsDataURL(file);
});

function DataImport({ session, onNavigate }) {
  const role = session?.user?.role;
  const [targets, setTargets] = useState([]);
  const [target, setTarget] = useState('');
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('csv');
  const [content, setContent] = useState('');
  const [step, setStep] = useState('upload'); // upload | map | preview | done
  const [analysis, setAnalysis] = useState(null);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const fileRef = useRef(null);

  const loadHistory = () => api('/import/history').then((d) => setHistory(d.jobs || [])).catch(() => {});
  useEffect(() => { api('/import/targets').then((d) => setTargets(d.targets || [])).catch(() => {}); loadHistory(); }, []);

  const reset = () => { setFile(null); setContent(''); setAnalysis(null); setMapping({}); setPreview(null); setResult(null); setStep('upload'); if (fileRef.current) fileRef.current.value = ''; };

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const ext = f.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls', 'docx', 'pdf'].includes(ext)) {
      toast.error('Choose CSV, Excel (.xlsx/.xls), Word (.docx), or PDF');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setFile(f);
    setFileType(ext === 'xls' ? 'xlsx' : ext);
    try { setContent(await readFileAsBase64(f)); }
    catch { toast.error('Could not read the file'); setFile(null); setContent(''); }
  };

  const analyze = async () => {
    if (!target) { toast.error('Choose what to import first'); return; }
    if (!content) { toast.error('Choose a file to upload'); return; }
    setBusy(true);
    try {
      const d = await api('/import/analyze', { method: 'POST', body: JSON.stringify({ target, type: fileType, content }) });
      setAnalysis(d); setMapping(d.mapping || {}); setStep('map');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const runPreview = async () => {
    setBusy(true);
    try {
      const d = await api('/import/preview', { method: 'POST', body: JSON.stringify({ target, type: fileType, content, mapping }) });
      setPreview(d.preview); setStep('preview');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const commit = async () => {
    setBusy(true);
    try {
      const d = await api('/import/commit', { method: 'POST', body: JSON.stringify({ target, type: fileType, content, mapping, fileName: file ? file.name : '' }) });
      setResult(d.result); setStep('done'); loadHistory();
      toast.success(`Imported ${d.result.imported} record(s)`);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (!can(role, 'suppliers:create') && !can(role, 'clients:create') && !can(role, 'leads:create') && !can(role, 'fleet:create')) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">You don&apos;t have permission to import data.</CardContent></Card>;
  }

  const steps = [['upload', 'Upload'], ['map', 'Map fields'], ['preview', 'Preview'], ['done', 'Done']];
  const stepIdx = steps.findIndex((s) => s[0] === step);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Import Data</h2>
          <p className="text-sm text-muted-foreground">Import records from CSV, Excel, Word tables or text-based PDF tables. Duplicates are detected and never overwritten.</p>
        </div>
        {step !== 'upload' && <Button variant="outline" size="sm" onClick={reset}>Start over</Button>}
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {steps.map(([id, label], i) => (
          <div key={id} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${i <= stepIdx ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
            <span className={i <= stepIdx ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <Card><CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label>What do you want to import?</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select a data type" /></SelectTrigger>
              <SelectContent>{targets.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>File (CSV, Excel, Word or PDF)</Label>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.docx,.pdf" onChange={onFile}
              className="block w-full max-w-md text-sm file:mr-3 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-violet-700" />
            <p className="text-xs text-muted-foreground">Word files must contain a table with column headers. PDFs must contain selectable text arranged in columns; scanned/image-only PDFs are not supported yet.</p>
            {file && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><FileSpreadsheet className="h-3.5 w-3.5" />{file.name}</p>}
          </div>
          <Button onClick={analyze} disabled={busy || !target || !content}>{busy ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Analyzing…</> : 'Analyze file'}</Button>
        </CardContent></Card>
      )}

      {step === 'map' && analysis && (
        <Card><CardContent className="space-y-4 p-5">
          <div className="text-sm text-muted-foreground">{analysis.totalRows} row(s) detected{analysis.capped ? ' (first 2000 will be processed)' : ''}. Match your file columns to SafarOS fields.</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}{f.required && <span className="text-rose-500"> *</span>}</Label>
                <Select value={mapping[f.key] || '__none__'} onValueChange={(v) => setMapping({ ...mapping, [f.key]: v === '__none__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Not mapped" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not mapped —</SelectItem>
                    {analysis.columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
            <Button onClick={runPreview} disabled={busy}>{busy ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Checking…</> : 'Preview import'}</Button>
          </div>
        </CardContent></Card>
      )}

      {step === 'preview' && preview && (
        <Card><CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat2 label="Total rows" value={preview.total} />
            <Stat2 label="Ready" value={preview.ready} tone="emerald" />
            <Stat2 label="Duplicates" value={preview.duplicates} tone="amber" />
            <Stat2 label="Errors" value={preview.errors} tone="rose" />
          </div>
          {preview.issues && preview.issues.length > 0 && (
            <div className="rounded-lg border">
              <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold">Rows needing attention</div>
              <div className="max-h-56 overflow-auto divide-y text-sm">
                {preview.issues.map((it) => (
                  <div key={it.row} className="flex items-center gap-2 px-3 py-1.5">
                    <AlertCircle className={`h-3.5 w-3.5 ${it.status === 'duplicate' ? 'text-amber-500' : 'text-rose-500'}`} />
                    <span className="text-muted-foreground">Row {it.row}:</span><span>{it.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Only new, valid rows will be imported. Duplicate rows are skipped — nothing existing is overwritten.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
            <Button onClick={commit} disabled={busy || preview.ready === 0}>{busy ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Importing…</> : `Confirm import (${preview.ready})`}</Button>
          </div>
        </CardContent></Card>
      )}

      {step === 'done' && result && (
        <Card><CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold">Import complete</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat2 label="Imported" value={result.imported} tone="emerald" />
            <Stat2 label="Duplicates skipped" value={result.duplicates} tone="amber" />
            <Stat2 label="Errors" value={result.errors} tone="rose" />
            <Stat2 label="Total rows" value={result.total} />
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>Import another file</Button>
            {onNavigate && target && <Button variant="outline" onClick={() => onNavigate(target === 'vehicles' || target === 'drivers' ? 'fleet' : target)}>View {target}</Button>}
          </div>
        </CardContent></Card>
      )}

      {/* History */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Recent imports</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No imports yet.</p>
        ) : (
          <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>File</TableHead><TableHead>Imported</TableHead><TableHead>Duplicates</TableHead><TableHead>Errors</TableHead></TableRow></TableHeader>
            <TableBody>{history.map((j) => (
              <TableRow key={j.id}>
                <TableCell className="whitespace-nowrap text-xs">{new Date(j.createdAt).toLocaleString()}</TableCell>
                <TableCell className="capitalize">{j.target}</TableCell>
                <TableCell className="max-w-[160px] truncate text-xs">{j.fileName || '—'}</TableCell>
                <TableCell className="text-emerald-600">{j.imported}</TableCell>
                <TableCell className="text-amber-600">{j.duplicates}</TableCell>
                <TableCell className="text-rose-600">{j.errors}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></div></CardContent></Card>
        )}
      </div>
    </div>
  );
}

function Stat2({ label, value, tone }) {
  const cls = { emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600' }[tone] || 'text-foreground';
  return (<div className="rounded-lg border bg-background p-3"><div className="text-xs text-muted-foreground">{label}</div><div className={`mt-0.5 text-xl font-bold ${cls}`}>{value}</div></div>);
}

// ================= Data Export =================
function DataExport({ session }) {
  const role = session?.user?.role;
  const [busy, setBusy] = useState('');
  const EXPORTS = [
    { entity: 'suppliers', label: 'Suppliers', perm: 'suppliers:read', icon: Store },
    { entity: 'clients', label: 'Clients', perm: 'clients:read', icon: Contact },
    { entity: 'leads', label: 'Leads', perm: 'leads:read', icon: UserPlus },
    { entity: 'bookings', label: 'Bookings', perm: 'bookings:read', icon: ClipboardList },
    { entity: 'quotations', label: 'Quotations', perm: 'quotations:read', icon: FileText },
    { entity: 'payments', label: 'Payments', perm: 'payments:read', icon: Banknote },
  ];
  const available = EXPORTS.filter((e) => can(role, e.perm));

  const download = async (entity) => {
    setBusy(entity);
    try {
      const res = await fetch(`/api/export/${entity}`, { credentials: 'include' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Export failed'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `safaros-${entity}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast.success(`${entity} exported`);
    } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Export Data</h2>
        <p className="text-sm text-muted-foreground">Download your agency&apos;s records as CSV. Exports include only your agency&apos;s data.</p>
      </div>
      {available.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">You don&apos;t have permission to export data.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((e) => {
            const Icon = e.icon;
            return (
              <Card key={e.entity}><CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0"><div className="truncate font-semibold">{e.label}</div><div className="text-xs text-muted-foreground">CSV export</div></div>
                </div>
                <Button size="sm" variant="outline" disabled={busy === e.entity} onClick={() => download(e.entity)}>
                  {busy === e.entity ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="mr-1 h-4 w-4" />CSV</>}
                </Button>
              </CardContent></Card>
            );
          })}
        </div>
      )}
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
  const initials = (agency?.name || 'S').trim().charAt(0).toUpperCase();
  const userInitial = (user?.name || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-muted/40 so-font">
      {/* ---------------- Desktop sidebar ---------------- */}
      <aside className="w-64 xl:w-[272px] shrink-0 border-r border-border bg-sidebar/80 backdrop-blur hidden md:flex flex-col">
        {/* Brand + agency identity */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="so-brandmark flex h-9 w-9 items-center justify-center rounded-xl">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold tracking-tight">SafarOS</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Agency Workspace</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-border bg-background/70 px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">{initials}</div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{agency?.name || 'Your agency'}</div>
              <div className="text-[11px] capitalize text-muted-foreground">{agency?.plan || 'trial'} plan</div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="so-nav flex-1 overflow-auto px-3 py-3">
          <DesktopNav active={active} onSelect={setActive} />
        </div>
        {/* User footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-xs font-bold text-white">{userInitial}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{user?.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{user?.email}</div>
            </div>
            <button onClick={onLogout} title="Sign out" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------- Main workspace ---------------- */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur flex items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
              className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-accent">
              <Menu className="h-5 w-5" />
            </button>
            <span className="flex items-center gap-2 font-extrabold md:hidden">
              <span className="so-brandmark flex h-7 w-7 items-center justify-center rounded-lg"><Layers className="h-4 w-4 text-white" /></span>
              SafarOS
            </span>
            <div className="hidden min-w-0 md:block">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{majorLabel(majorOf(active)) || 'Workspace'}</div>
              <h1 className="truncate text-[17px] font-bold leading-tight">{titleOf(active)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <GlobalSearch onNavigate={go} />
            <SyncStatusIndicator />
            <div className="hidden items-center gap-2.5 rounded-full border border-border bg-background px-2 py-1 pr-3 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-[11px] font-bold text-white">{userInitial}</div>
              <div className="text-right leading-tight">
                <div className="text-[12px] font-semibold">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{user?.role}</div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1400px]">
          {String(active).startsWith('ws:') ? (
            <WorkspaceLauncher majorId={String(active).slice(3)} onOpen={setActive} />
          ) : (
          <>
          {active !== 'overview' && DESKTOP_WORKSPACES.find((w) => w.id === majorOf(active))?.tiles && (
            <button onClick={() => setActive(`ws:${majorOf(active)}`)}
              className="mb-4 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex">
              <ArrowLeft className="h-4 w-4" /> {majorLabel(majorOf(active))}
            </button>
          )}
          {active === 'overview' && <Overview session={session} onGo={setActive} onNavigate={navigateTo} />}
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
          {active === 'discover' && <SupplierDiscovery key="discover" session={session} onGo={setActive} />}
          {active === 'bookings' && <Bookings key="bk" session={session} navPayload={navPayload} onConsumePayload={() => setNavPayload(null)} />}
          {active === 'fleet' && <Fleet key="fleet" session={session} />}
          {String(active).startsWith('fin_') && <Finance key="finance" session={session} tab={String(active).slice(4)} onNav={(t) => setActive('fin_' + t)} />}
          {String(active).startsWith('comm_') && <Communications key="comm" session={session} tab={String(active).slice(5)} onNav={(t) => setActive('comm_' + t)} />}
          {active === 'copilot' && <CopilotWorkspace session={session} />}
          {String(active).startsWith('web_') && <Website key="web" session={session} tab={String(active).slice(4)} onNav={(t) => setActive('web_' + t)} />}
          {String(active).startsWith('an_') && <Analytics key="an" session={session} tab={String(active).slice(3)} onNav={(t) => setActive('an_' + t)} />}
          {String(active).startsWith('sub_') && <Billing key="sub" session={session} tab={String(active).slice(4)} onNav={(t) => setActive('sub_' + t)} />}
          {String(active).startsWith('int_') && <Integrations key="int" session={session} tab={String(active).slice(4)} onNav={(t) => setActive('int_' + t)} />}
          {active === 'portal_admin' && <PortalAdmin session={session} />}
          {active === 'travelrules' && <TravelRules session={session} />}
          {active === 'documents' && <DocumentVault session={session} />}
          {active === 'customfields' && <CustomFields session={session} />}
          {active === 'suppliers_network' && <SupplierNetwork session={session} />}
          {active === 'data_import' && <DataImport key="imp" session={session} onNavigate={navigateTo} />}
          {active === 'data_export' && <DataExport key="exp" session={session} />}
          {active === 'team' && <Team session={session} />}
          {active === 'settings' && <Settings session={session} />}
          </>
          )}
          </div>
        </div>
      </main>

      <CopilotFab session={session} />

      {/* Mobile navigation drawer */}
      <div className={`fixed inset-0 z-50 overflow-hidden md:hidden ${menuOpen ? '' : 'pointer-events-none'}`}>
        <div onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute left-0 top-0 flex h-full w-72 max-w-[84%] flex-col border-r border-border bg-sidebar shadow-2xl transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-4">
            <span className="flex items-center gap-2 text-[15px] font-extrabold">
              <span className="so-brandmark flex h-8 w-8 items-center justify-center rounded-lg"><Layers className="h-4 w-4 text-white" /></span>
              SafarOS
            </span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-accent"><X className="h-5 w-5" /></button>
          </div>
          <Separator />
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{agency?.name}</div>
              <div className="truncate text-xs capitalize text-muted-foreground">{agency?.plan || 'trial'} plan</div>
            </div>
          </div>
          <Separator />
          <nav className="so-nav flex-1 overflow-auto px-3 py-3">
            <MobileAccordion active={active} onSelect={go} />
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

const fmtMoney = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtNum = (n) => (Number(n) || 0).toLocaleString('en-IN');

function KpiCard({ icon: Icon, label, value, tone = 'violet', hint, onClick }) {
  const tones = {
    violet: 'from-violet-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    sky: 'from-sky-500 to-blue-600',
    rose: 'from-rose-500 to-pink-600',
  };
  const inner = (
    <Card className={`so-kpi h-full ${onClick ? 'cursor-pointer' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1.5 truncate text-[26px] font-bold leading-none tracking-tight">{value}</div>
            {hint && <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>}
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]} text-white shadow-sm`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return onClick ? <button type="button" onClick={onClick} className="block w-full text-left">{inner}</button> : inner;
}

function Overview({ session, onGo = () => {}, onNavigate = () => {} }) {
  const { agency, user } = session;
  const role = user?.role;
  const hasAnalytics = can(role, 'analytics:read');
  const canCreateQuote = can(role, 'quotations:create');
  const canCreateLead = can(role, 'leads:create');
  const canCreateBooking = can(role, 'bookings:create');

  const [ov, setOv] = useState(null);
  const [crm, setCrm] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const calls = [
        hasAnalytics ? api('/analytics/overview') : Promise.reject(new Error('skip')),
        api('/crm/stats'),
        api('/activities'),
      ];
      const [ovR, crmR, actR] = await Promise.allSettled(calls);
      if (!alive) return;
      if (ovR.status === 'fulfilled') setOv(ovR.value.overview || null);
      if (crmR.status === 'fulfilled') setCrm(crmR.value.stats || null);
      if (actR.status === 'fulfilled') setActivities((actR.value.activities || []).slice(0, 6));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [hasAnalytics]);

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const firstName = user?.name?.split(' ')[0] || 'there';

  const crmCards = [
    { key: 'activeLeads', label: 'Active Leads', icon: UserPlus, tone: 'sky', go: 'leads' },
    { key: 'totalClients', label: 'Total Clients', icon: Contact, tone: 'violet', go: 'clients' },
    { key: 'followUpsDue', label: 'Follow-ups Due', icon: CalendarClock, tone: 'amber', go: 'followups' },
    { key: 'openTasks', label: 'Open Tasks', icon: ListTodo, tone: 'rose', go: 'tasks' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero / greeting */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-violet-50 via-background to-indigo-50/40 p-5 dark:from-violet-950/30 dark:to-indigo-950/10 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-300">{today}</div>
          <h2 className="mt-1 truncate text-2xl font-bold tracking-tight">Welcome back, {firstName}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s what&apos;s happening at <span className="font-medium text-foreground">{agency?.name}</span> today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateQuote && <Button size="sm" onClick={() => onGo('quote-create')} className="bg-violet-600 hover:bg-violet-700"><FilePlus className="mr-1.5 h-4 w-4" /> New Quotation</Button>}
          {canCreateLead && <Button size="sm" variant="outline" onClick={() => onGo('leads')}><UserPlus className="mr-1.5 h-4 w-4" /> Add Lead</Button>}
          {canCreateBooking && <Button size="sm" variant="outline" onClick={() => onGo('bookings')}><ClipboardList className="mr-1.5 h-4 w-4" /> New Booking</Button>}
        </div>
      </div>

      {/* Workspace launcher cards */}
      <div>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Workspaces</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: 'CRM', desc: 'Leads & clients', icon: Contact, tone: 'violet', go: 'ws:crm' },
            { label: 'Sales', desc: 'Quotes & packages', icon: FileText, tone: 'sky', go: 'ws:sales' },
            { label: 'Operations', desc: 'Trips & suppliers', icon: Truck, tone: 'emerald', go: 'ws:operations' },
            { label: 'Finance', desc: 'Money & invoices', icon: Wallet, tone: 'amber', go: 'ws:finance' },
            { label: 'Discover', desc: 'Find suppliers', icon: Compass, tone: 'rose', go: 'discover' },
            { label: 'AI Copilot', desc: 'Ask anything', icon: Sparkles, tone: 'violet', go: 'copilot' },
          ].map((w) => {
            const Icon = w.icon;
            return (
              <button key={w.label} onClick={() => onGo(w.go)} className="text-left">
                <Card className="so-kpi h-full">
                  <CardContent className="flex flex-col items-start gap-2.5 p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${w.tone === 'violet' ? 'from-violet-500 to-indigo-600' : w.tone === 'emerald' ? 'from-emerald-500 to-teal-600' : w.tone === 'amber' ? 'from-amber-500 to-orange-600' : w.tone === 'sky' ? 'from-sky-500 to-blue-600' : 'from-rose-500 to-pink-600'} text-white shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{w.label}</div>
                      <div className="text-[11px] text-muted-foreground">{w.desc}</div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted/30" />)}
        </div>
      ) : (
        <>
          {/* Financial KPIs (role-gated — only owner/manager/finance) */}
          {hasAnalytics && ov && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard icon={TrendingUp} tone="emerald" label="Revenue (this month)" value={fmtMoney(ov.totalRevenue)} hint={`${fmtNum(ov.totalPayments)} payments received`} onClick={() => onGo('an_finance')} />
              <KpiCard icon={Wallet} tone="violet" label="Gross Profit (this month)" value={fmtMoney(ov.grossProfit)} hint={`Expenses ${fmtMoney(ov.totalExpenses)}`} onClick={() => onGo('an_finance')} />
              <KpiCard icon={Receipt} tone="amber" label="Outstanding Receivables" value={fmtMoney(ov.outstandingReceivables)} hint={`Payables ${fmtMoney(ov.outstandingPayables)}`} onClick={() => onGo('fin_receivables')} />
              <KpiCard icon={ClipboardList} tone="sky" label="Bookings (this month)" value={fmtNum(ov.totalBookings)} hint={`${fmtNum(ov.activeLeads)} active leads`} onClick={() => onGo('bookings')} />
            </div>
          )}

          {/* CRM snapshot — available to all roles */}
          {crm && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {crmCards.map((c) => (
                <KpiCard key={c.key} icon={c.icon} tone={c.tone} label={c.label} value={fmtNum(crm[c.key])} onClick={() => onGo(c.go)} />
              ))}
            </div>
          )}

          {/* Recent activity + quick links */}
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Recent activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onGo('activities')}>View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
              </CardHeader>
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Activity className="h-6 w-6 text-muted-foreground" /></div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">No activity yet</h3>
                      <p className="mx-auto max-w-sm text-sm text-muted-foreground">Activity appears automatically as your team creates leads, clients, follow-ups and quotations.</p>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {activities.map((a) => {
                      const meta = ACTIVITY_META[a.type] || { icon: Activity, color: 'text-muted-foreground bg-muted' };
                      const Icon = meta.icon;
                      return (
                        <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.color}`}><Icon className="h-4 w-4" /></div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm">{a.message}</div>
                            <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Quick links</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Quotations', icon: FileText, go: 'quotations' },
                    { label: 'Clients', icon: Contact, go: 'clients' },
                    { label: 'Bookings', icon: ClipboardList, go: 'bookings' },
                    { label: 'Packages', icon: Package, go: 'packages' },
                    { label: 'Payments', icon: Banknote, go: 'fin_payments' },
                    { label: 'Copilot', icon: Sparkles, go: 'copilot' },
                  ].map((q) => {
                    const Icon = q.icon;
                    return (
                      <button key={q.go} onClick={() => onGo(q.go)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background px-3 py-4 text-center transition hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300"><Icon className="h-[18px] w-[18px]" /></span>
                        <span className="text-xs font-medium">{q.label}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/20">
                <CardContent className="flex items-start gap-3 p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                  <div>
                    <div className="text-sm font-semibold">Tenant isolation active</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">Every record is scoped to {agency?.name} on the server. Data from other agencies is never visible here.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
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

const EMPTY_FORM = { name: '', email: '', role: 'agent' };

function AddMemberForm({ open, setOpen, onAdded, actorRole }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset state whenever the dialog is opened/closed.
  const onOpenChange = (v) => {
    setOpen(v);
    if (!v) { setForm(EMPTY_FORM); setError(''); }
  };

  const emailValid = EMAIL_RE.test(form.email.trim());
  const canSubmit = !!form.name.trim() && emailValid && !!form.role;

  const submit = async () => {
    setError('');
    if (!form.name.trim()) return setError('Full name is required.');
    if (!emailValid) return setError('Enter a valid business email address.');
    setSubmitting(true);
    try {
      await api('/members', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
        }),
      });
      toast.success('Invitation email sent');
      setForm(EMPTY_FORM);
      setOpen(false);
      onAdded();
    } catch (e) {
      const msg = String(e.message || '');
      if (/already registered|duplicate|E11000/i.test(msg)) setError('A member with this email already exists.');
      else if (/forbidden/i.test(msg)) setError('You do not have permission to add team members.');
      else if (/invalid role/i.test(msg)) setError('Please select a valid role.');
      else if (/email delivery is not configured/i.test(msg)) setError('Connect the agency email provider in Integrations before inviting staff.');
      else if (/required|valid name, email and role/i.test(msg)) setError('Please enter a name, valid email and role.');
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
          <div className="rounded-md border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
            SafarOS will email this employee a secure, single-use password setup link. They choose their own password; you never need to create or share one.
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {actorRole === 'owner' && <SelectItem value="manager">Manager</SelectItem>}
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
          <AddMemberForm open={open} setOpen={setOpen} onAdded={load} actorRole={session.user.role} />
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
            {canInvite && <AddMemberForm open={open} setOpen={setOpen} onAdded={load} actorRole={session.user.role} />}
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
          {q.convertedBookingId && onNavigate && <Button variant="outline" size="sm" onClick={() => onNavigate('bookings', { openBookingId: q.convertedBookingId })}><CheckCircle2 className="h-4 w-4 mr-1" /> View booking {q.convertedBookingNumber || ''}</Button>}
          {!q.convertedBookingId && canCreateBooking && onNavigate && <Button variant="outline" size="sm" onClick={() => onNavigate('bookings', { convertToBooking: q })}><CheckCircle2 className="h-4 w-4 mr-1" /> Convert to Booking</Button>}
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

// ---- Itinerary status + service metadata ----
const ITINERARY_STATUS_META = {
  draft:    { label: 'Draft',    cls: 'bg-muted text-muted-foreground border-border' },
  prepared: { label: 'Prepared', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  shared:   { label: 'Shared',   cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { label: 'Archived', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};
const ITINERARY_STATUS_OPTIONS = Object.keys(ITINERARY_STATUS_META);
function ItineraryStatusBadge({ status }) { return <MetaBadge meta={ITINERARY_STATUS_META[status] || ITINERARY_STATUS_META.draft} />; }

const ITIN_SERVICE_META = {
  hotel:     { label: 'Hotel',     icon: BedDouble, cls: 'text-rose-600' },
  transport: { label: 'Transport', icon: Car,       cls: 'text-emerald-600' },
  activity:  { label: 'Activity',  icon: Clock,     cls: 'text-sky-600' },
  meal:      { label: 'Meal',      icon: Utensils,  cls: 'text-amber-600' },
  guide:     { label: 'Guide',     icon: Users,     cls: 'text-violet-600' },
  other:     { label: 'Other',     icon: MapPin,    cls: 'text-muted-foreground' },
};
const ITIN_SERVICE_OPTIONS = Object.keys(ITIN_SERVICE_META);
const rid = (p) => p + Math.random().toString(36).slice(2);

// ---- Itinerary day/service factories + client-side normalization ----
function blankActivity() {
  return { id: rid('a'), name: '', description: '', location: '', startTime: '', endTime: '', notes: '' };
}
function blankItinService(type = 'activity') {
  return { id: rid('s'), type, name: '', description: '', location: '', lat: '', lng: '', startTime: '', endTime: '', supplierId: '', supplierName: '', cost: 0, price: 0, notes: '' };
}
function blankDay(n) {
  return {
    id: rid('d'),
    dayNumber: n, date: '', title: '', description: '', location: '', lat: '', lng: '', startTime: '', endTime: '', notes: '',
    services: [],
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
    services: (d.services || []).map((s) => ({ ...blankItinService(s.type || 'other'), ...s })),
  };
}
// Renumber days 1..n and recompute each day's date from the trip start date.
function renumberDays(days, startDate) {
  return days.map((d, i) => {
    const next = { ...d, dayNumber: i + 1 };
    if (startDate) { const dt = new Date(startDate + 'T00:00:00'); if (!isNaN(dt.getTime())) { dt.setDate(dt.getDate() + i); next.date = dt.toISOString().slice(0, 10); } }
    return next;
  });
}
function blankTravelMeta() {
  return { title: '', destination: '', startDate: '', endDate: '', status: 'draft', notes: '', adults: 0, children: 0, pickupLocation: '', dropLocation: '', meetingPoint: '', mealPlan: '', contactName: '', contactPhone: '', contactEmail: '' };
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

function DayCard({ day, index, open, onToggle, canUpdate, onPatch, onRemove, isFirst, isLast, onMoveUp, onMoveDown, onDuplicate, dayOptions, onMoveService, suppliers }) {
  const upd = (fn) => onPatch(fn(day));
  const services = day.services || [];
  const otherDays = (dayOptions || []).filter((o) => o.id !== day.id);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <button type="button" onClick={onToggle} className="flex items-center gap-2 min-w-0 text-left">
          {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          <span className="inline-flex h-6 items-center rounded-full bg-violet-600 px-2.5 text-xs font-semibold text-white">Day {day.dayNumber}</span>
          <span className="truncate text-sm font-medium">{day.title || day.location || 'Untitled day'}</span>
          {services.length > 0 && <span className="hidden sm:inline text-xs text-muted-foreground">· {services.length} service{services.length === 1 ? '' : 's'}</span>}
        </button>
        {canUpdate && (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" disabled={isFirst} title="Move up" onClick={onMoveUp}><ChevronUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" disabled={isLast} title="Move down" onClick={onMoveDown}><ChevronDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Duplicate day" onClick={onDuplicate}><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onRemove} title="Remove day"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
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

          {/* Services (hotels / transport / activities / meals / guides / other) */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-medium"><Layers className="h-4 w-4 text-violet-600" /> Services</span>
              {canUpdate && (
                <Select value="" onValueChange={(t) => upd((d) => ({ ...d, services: [...(d.services || []), blankItinService(t)] }))}>
                  <SelectTrigger className="h-8 w-[140px] text-xs"><span className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add service</span></SelectTrigger>
                  <SelectContent>{ITIN_SERVICE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{ITIN_SERVICE_META[t].label}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            {services.length === 0 && <p className="text-xs text-muted-foreground">No services yet. Add hotels, transport, activities, meals or guides.</p>}
            {services.map((s) => {
              const meta = ITIN_SERVICE_META[s.type] || ITIN_SERVICE_META.other;
              const SIcon = meta.icon;
              const setS = (patch) => upd((d) => ({ ...d, services: d.services.map((x) => x.id === s.id ? { ...x, ...patch } : x) }));
              return (
                <div key={s.id} className="rounded-md bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <SIcon className={`h-4 w-4 shrink-0 ${meta.cls}`} />
                    <Select value={s.type} disabled={!canUpdate} onValueChange={(v) => setS({ type: v })}>
                      <SelectTrigger className="h-8 w-[118px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{ITIN_SERVICE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{ITIN_SERVICE_META[t].label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="flex-1 min-w-0" value={s.name} disabled={!canUpdate} placeholder={`${meta.label} name`} onChange={(e) => setS({ name: e.target.value })} />
                    {canUpdate && <Button variant="ghost" size="icon" title="Duplicate service" onClick={() => upd((d) => { const idx = d.services.findIndex((x) => x.id === s.id); const copy = { ...s, id: rid('s') }; const arr = [...d.services]; arr.splice(idx + 1, 0, copy); return { ...d, services: arr }; })}><Copy className="h-4 w-4" /></Button>}
                    {canUpdate && <Button variant="ghost" size="icon" title="Remove service" onClick={() => upd((d) => ({ ...d, services: d.services.filter((x) => x.id !== s.id) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input value={s.location} disabled={!canUpdate} placeholder="Location" onChange={(e) => setS({ location: e.target.value })} />
                    <Input type="time" value={s.startTime} disabled={!canUpdate} onChange={(e) => setS({ startTime: e.target.value })} />
                    <Input type="time" value={s.endTime} disabled={!canUpdate} onChange={(e) => setS({ endTime: e.target.value })} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(suppliers && suppliers.length > 0) ? (
                      <Select value={s.supplierId || 'none'} disabled={!canUpdate} onValueChange={(v) => { if (v === 'none') { setS({ supplierId: '', supplierName: '' }); } else { const sup = suppliers.find((x) => x.id === v); setS({ supplierId: v, supplierName: sup ? sup.name : '' }); } }}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Supplier" /></SelectTrigger>
                        <SelectContent><SelectItem value="none">No supplier</SelectItem>{suppliers.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input value={s.supplierName} disabled={!canUpdate} placeholder="Supplier" onChange={(e) => setS({ supplierName: e.target.value })} />
                    )}
                    <Input type="number" min="0" value={s.cost} disabled={!canUpdate} placeholder="Cost" onChange={(e) => setS({ cost: e.target.value })} />
                    <Input type="number" min="0" value={s.price} disabled={!canUpdate} placeholder="Selling price" onChange={(e) => setS({ price: e.target.value })} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input value={s.lat} disabled={!canUpdate} placeholder="Latitude (optional)" onChange={(e) => setS({ lat: e.target.value })} />
                    <Input value={s.lng} disabled={!canUpdate} placeholder="Longitude (optional)" onChange={(e) => setS({ lng: e.target.value })} />
                  </div>
                  <Textarea rows={1} value={s.notes} disabled={!canUpdate} placeholder="Notes" onChange={(e) => setS({ notes: e.target.value })} />
                  {canUpdate && otherDays.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">Move to</span>
                      <Select value="" onValueChange={(target) => onMoveService && onMoveService(day.id, target, s.id)}>
                        <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="another day" /></SelectTrigger>
                        <SelectContent>{otherDays.map((o) => <SelectItem key={o.id} value={o.id}>Day {o.dayNumber}{o.title ? ` · ${o.title}` : ''}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
  const [meta, setMeta] = useState(blankTravelMeta());
  const [days, setDays] = useState([]);
  const [open, setOpen] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { (async () => { try { const d = await api('/suppliers'); setSuppliers((d.suppliers || []).filter((s) => s.status !== 'inactive')); } catch { /* suppliers optional */ } })(); }, []);

  useEffect(() => { (async () => { setLoading(true); try {
    const { itinerary } = await api(`/itineraries/${itineraryId}`);
    const t = itinerary.travelers || {}; const c = itinerary.contact || {};
    setMeta({
      title: itinerary.title || '', destination: itinerary.destination || '',
      startDate: itinerary.startDate || '', endDate: itinerary.endDate || '',
      status: itinerary.status || 'draft', notes: itinerary.notes || '',
      adults: t.adults || 0, children: t.children || 0,
      pickupLocation: itinerary.pickupLocation || '', dropLocation: itinerary.dropLocation || '',
      meetingPoint: itinerary.meetingPoint || '', mealPlan: itinerary.mealPlan || '',
      contactName: c.name || '', contactPhone: c.phone || '', contactEmail: c.email || '',
    });
    const nd = (itinerary.days || []).map(normalizeDayClient);
    setDays(nd);
    setOpen(nd.length ? { [nd[0].id]: true } : {});
  } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, [itineraryId]);

  const dayOptions = days.map((d) => ({ id: d.id, dayNumber: d.dayNumber, title: d.title }));

  const setStartDate = (v) => { setMeta((m) => ({ ...m, startDate: v })); setDays((x) => renumberDays(x, v)); };
  const addDay = () => { const nd = renumberDays([...days, blankDay(days.length + 1)], meta.startDate); setDays(nd); setOpen((o) => ({ ...o, [nd[nd.length - 1].id]: true })); };
  const removeDay = (id) => setDays((x) => renumberDays(x.filter((d) => d.id !== id), meta.startDate));
  const patchDay = (id, nextDay) => setDays((x) => x.map((d) => d.id === id ? nextDay : d));
  const moveDay = (id, dir) => { const i = days.findIndex((d) => d.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= days.length) return; const arr = [...days]; [arr[i], arr[j]] = [arr[j], arr[i]]; setDays(renumberDays(arr, meta.startDate)); };
  const duplicateDay = (id) => { const i = days.findIndex((d) => d.id === id); if (i < 0) return; const src = days[i]; const copy = { ...normalizeDayClient(src), id: rid('d'), services: (src.services || []).map((s) => ({ ...s, id: rid('s') })), activities: (src.activities || []).map((a) => ({ ...a, id: rid('a') })) }; const arr = [...days]; arr.splice(i + 1, 0, copy); setDays(renumberDays(arr, meta.startDate)); setOpen((o) => ({ ...o, [copy.id]: true })); };
  const moveService = (fromId, toId, serviceId) => {
    let moving = null;
    const stripped = days.map((d) => { if (d.id === fromId) { const found = (d.services || []).find((s) => s.id === serviceId); if (found) moving = found; return { ...d, services: (d.services || []).filter((s) => s.id !== serviceId) }; } return d; });
    if (!moving) return;
    setDays(stripped.map((d) => d.id === toId ? { ...d, services: [...(d.services || []), moving] } : d));
    toast.success('Service moved');
  };

  const save = async () => {
    if (!meta.destination.trim()) { toast.error('Destination is required'); return; }
    if (meta.startDate && meta.endDate && meta.startDate > meta.endDate) { toast.error('End date must be on or after the start date'); return; }
    setSaving(true);
    try {
      const payload = {
        title: meta.title, destination: meta.destination, startDate: meta.startDate, endDate: meta.endDate,
        status: meta.status, notes: meta.notes,
        travelers: { adults: Number(meta.adults) || 0, children: Number(meta.children) || 0 },
        pickupLocation: meta.pickupLocation, dropLocation: meta.dropLocation,
        meetingPoint: meta.meetingPoint, mealPlan: meta.mealPlan,
        contact: { name: meta.contactName, phone: meta.contactPhone, email: meta.contactEmail },
        days,
      };
      const { itinerary } = await api(`/itineraries/${itineraryId}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast.success('Itinerary saved');
      setDays((itinerary.days || []).map(normalizeDayClient));
      onSaved && onSaved(itinerary);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); }
  };

  // Cost summary — per-day and whole-trip totals from itinerary service cost/selling fields.
  const dayTotals = days.map((d) => {
    const cost = (d.services || []).reduce((s, x) => s + (Number(x.cost) || 0), 0);
    const sell = (d.services || []).reduce((s, x) => s + (Number(x.price) || 0), 0);
    return { id: d.id, dayNumber: d.dayNumber, cost, sell, profit: sell - cost };
  });
  const tripTotals = dayTotals.reduce((a, d) => ({ cost: a.cost + d.cost, sell: a.sell + d.sell, profit: a.profit + d.profit }), { cost: 0, sell: 0, profit: 0 });
  const hasCosts = dayTotals.some((d) => d.cost || d.sell);

  const sendToClient = async () => {
    if (!window.confirm('Send this itinerary to the linked client by email? The itinerary status will be set to "Shared".')) return;
    setSharing(true);
    try {
      const r = await api(`/itineraries/${itineraryId}/share`, { method: 'POST', body: JSON.stringify({}) });
      toast.success(`Itinerary sent to ${r.sentTo}`);
      setMeta((m) => ({ ...m, status: 'shared' }));
      onSaved && onSaved({ ...r, id: itineraryId });
    } catch (e) { toast.error(friendlyError(e)); } finally { setSharing(false); }
  };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h2 className="text-xl font-bold">{heading || 'Itinerary builder'}</h2>
            <p className="text-sm text-muted-foreground">Plan the trip day by day — services, meals, transport and stays.</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && <Button variant="outline" size="sm" onClick={addDay}><Plus className="h-4 w-4 mr-1" /> Add day</Button>}
          {canUpdate && <Button variant="outline" size="sm" onClick={sendToClient} disabled={sharing}><Send className="h-4 w-4 mr-1" /> {sharing ? 'Sending…' : 'Send to client'}</Button>}
          {canUpdate && <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save itinerary'}</Button>}
        </div>
      </div>

      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Itinerary title</Label><Input value={meta.title} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Destination</Label><Input value={meta.destination} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, destination: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Status</Label>
          <Select value={meta.status} disabled={!canUpdate} onValueChange={(v) => setMeta({ ...meta, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ITINERARY_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{ITINERARY_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={meta.startDate} disabled={!canUpdate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={meta.endDate} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, endDate: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Adults</Label><Input type="number" min="0" value={meta.adults} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, adults: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Children</Label><Input type="number" min="0" value={meta.children} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, children: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Pickup location</Label><Input value={meta.pickupLocation} disabled={!canUpdate} placeholder="Airport / hotel" onChange={(e) => setMeta({ ...meta, pickupLocation: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Drop location</Label><Input value={meta.dropLocation} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, dropLocation: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Meeting point</Label><Input value={meta.meetingPoint} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, meetingPoint: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Meal plan</Label><Input value={meta.mealPlan} disabled={!canUpdate} placeholder="e.g. Breakfast + Dinner (MAP)" onChange={(e) => setMeta({ ...meta, mealPlan: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Contact name</Label><Input value={meta.contactName} disabled={!canUpdate} placeholder="Trip coordinator" onChange={(e) => setMeta({ ...meta, contactName: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Contact phone</Label><Input value={meta.contactPhone} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, contactPhone: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Contact email</Label><Input value={meta.contactEmail} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, contactEmail: e.target.value })} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Overall notes</Label><Textarea rows={2} value={meta.notes} disabled={!canUpdate} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} /></div>
      </CardContent></Card>

      {hasCosts && (
        <Card><CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4 text-emerald-600" /> Cost summary <span className="text-xs font-normal text-muted-foreground">(internal — not shown to the customer)</span></div>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="py-1.5 pr-2 font-medium">Day</th><th className="py-1.5 px-2 font-medium text-right">Cost</th><th className="py-1.5 px-2 font-medium text-right">Selling</th><th className="py-1.5 pl-2 font-medium text-right">Profit</th>
              </tr></thead>
              <tbody>
                {dayTotals.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-2">Day {d.dayNumber}</td>
                    <td className="py-1.5 px-2 text-right">{fmtMoney(d.cost)}</td>
                    <td className="py-1.5 px-2 text-right">{fmtMoney(d.sell)}</td>
                    <td className={`py-1.5 pl-2 text-right ${d.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(d.profit)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 font-semibold">
                <td className="py-2 pr-2">Whole trip</td>
                <td className="py-2 px-2 text-right">{fmtMoney(tripTotals.cost)}</td>
                <td className="py-2 px-2 text-right">{fmtMoney(tripTotals.sell)}</td>
                <td className={`py-2 pl-2 text-right ${tripTotals.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(tripTotals.profit)}</td>
              </tr></tfoot>
            </table>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <div className="rounded-lg border p-2 text-center"><div className="text-xs text-muted-foreground">Cost</div><div className="font-semibold">{fmtMoney(tripTotals.cost)}</div></div>
            <div className="rounded-lg border p-2 text-center"><div className="text-xs text-muted-foreground">Selling</div><div className="font-semibold">{fmtMoney(tripTotals.sell)}</div></div>
            <div className="rounded-lg border p-2 text-center"><div className="text-xs text-muted-foreground">Profit</div><div className={`font-semibold ${tripTotals.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtMoney(tripTotals.profit)}</div></div>
          </div>
        </CardContent></Card>
      )}

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
            isFirst={i === 0} isLast={i === days.length - 1}
            onToggle={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))}
            onPatch={(nd) => patchDay(d.id, nd)} onRemove={() => removeDay(d.id)}
            onMoveUp={() => moveDay(d.id, -1)} onMoveDown={() => moveDay(d.id, 1)}
            onDuplicate={() => duplicateDay(d.id)} dayOptions={dayOptions} onMoveService={moveService} suppliers={suppliers} />
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

function ItineraryTravelOverview({ itin }) {
  const t = itin.travelers || {};
  const c = itin.contact || {};
  const pax = [t.adults ? `${t.adults} adult${t.adults === 1 ? '' : 's'}` : '', t.children ? `${t.children} child${t.children === 1 ? '' : 'ren'}` : ''].filter(Boolean).join(', ');
  const rows = [
    ['Travellers', pax], ['Pickup', itin.pickupLocation], ['Drop-off', itin.dropLocation],
    ['Meeting point', itin.meetingPoint], ['Meal plan', itin.mealPlan],
    ['Contact', [c.name, c.phone, c.email].filter(Boolean).join(' · ')],
  ].filter(([, v]) => v);
  if (rows.length === 0) return null;
  return (
    <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-2 text-sm"><span className="text-muted-foreground shrink-0">{label}:</span><span className="font-medium">{value}</span></div>
      ))}
    </div>
  );
}

function DayServices({ services }) {
  if (!services || services.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {services.map((s) => {
        const meta = ITIN_SERVICE_META[s.type] || ITIN_SERVICE_META.other;
        const SIcon = meta.icon;
        const time = [s.startTime, s.endTime].filter(Boolean).join('–');
        const extra = [time, s.location, s.supplierName && `Supplier: ${s.supplierName}`].filter(Boolean).join(' · ');
        return (
          <div key={s.id} className="flex gap-2 text-sm">
            <SIcon className={`h-4 w-4 shrink-0 mt-0.5 ${meta.cls}`} />
            <div className="min-w-0">
              <span className="font-medium">{s.name || meta.label}</span>
              <span className="text-xs text-muted-foreground"> · {meta.label}</span>
              {extra && <span className="text-muted-foreground"> · {extra}</span>}
              {s.description && <div className="text-muted-foreground">{s.description}</div>}
              {s.notes && <div className="text-muted-foreground italic">{s.notes}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
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
          <div key={day.id || day.dayNumber} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 items-center rounded-full bg-violet-600 px-3 text-sm font-semibold text-white">Day {day.dayNumber}</span>
                <span className="font-semibold">{day.title || 'Untitled day'}</span>
              </div>
              <div className="text-sm text-muted-foreground">{day.date ? formatJoined(day.date) : ''}{day.location ? `${day.date ? ' · ' : ''}${day.location}` : ''}</div>
            </div>
            {day.description && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{day.description}</p>}

            <DayServices services={day.services} />

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
// Live Maps foundation — reuses the lat/lng already stored on days & services.
// Uses a key-less OpenStreetMap embed (no new provider/API key); architecture stays
// ready for the centralized SafarOS Maps/Places service planned later.
function collectItinPoints(itin) {
  const pts = [];
  for (const d of (itin.days || [])) {
    const dlat = parseFloat(d.lat); const dlng = parseFloat(d.lng);
    if (!isNaN(dlat) && !isNaN(dlng)) pts.push({ name: d.title || `Day ${d.dayNumber}`, lat: dlat, lng: dlng });
    for (const s of (d.services || [])) {
      const slat = parseFloat(s.lat); const slng = parseFloat(s.lng);
      if (!isNaN(slat) && !isNaN(slng)) pts.push({ name: s.name || s.location || 'Location', lat: slat, lng: slng });
    }
  }
  return pts;
}
function ItineraryMap({ itin }) {
  const pts = collectItinPoints(itin);
  if (pts.length === 0) return null;
  const lats = pts.map((p) => p.lat); const lngs = pts.map((p) => p.lng);
  let minLat = Math.min(...lats); let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs); let maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.3, 0.03);
  const padLng = Math.max((maxLng - minLng) * 0.3, 0.03);
  minLat -= padLat; maxLat += padLat; minLng -= padLng; maxLng += padLng;
  const center = pts[0];
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${center.lat},${center.lng}`;
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-4 w-4 text-violet-600" /> Trip map</div>
      <div className="no-print overflow-hidden rounded-xl border">
        <iframe title="Itinerary map" src={src} className="h-64 w-full" loading="lazy" />
      </div>
      <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        {pts.map((p, i) => (
          <li key={i} className="flex gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" /><a className="text-violet-700 hover:underline" href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=14/${p.lat}/${p.lng}`} target="_blank" rel="noreferrer">{p.name}</a></li>
        ))}
      </ul>
    </div>
  );
}

function CustomerItineraryView({ itin, agencyName }) {
  const days = itin.days || [];
  const t = itin.travelers || {};
  const c = itin.contact || {};
  const pax = [t.adults ? `${t.adults} adult${t.adults === 1 ? '' : 's'}` : '', t.children ? `${t.children} child${t.children === 1 ? '' : 'ren'}` : ''].filter(Boolean).join(', ');
  return (
    <div id="itinerary-print" className="mx-auto max-w-3xl bg-white p-8 text-slate-800">
      <style>{`@media print { body * { visibility: hidden !important; } #itinerary-print, #itinerary-print * { visibility: visible !important; } #itinerary-print { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`}</style>
      <div className="border-b-2 border-violet-600 pb-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">{agencyName || 'Travel Itinerary'}</div>
        <h1 className="mt-1 text-2xl font-bold">{itin.title || 'Trip Itinerary'}</h1>
        <p className="mt-1 text-sm text-slate-500">{itin.destination}{itin.destination && (itin.startDate || itin.endDate) ? ' · ' : ''}{travelDates(itin)}</p>
      </div>

      <div className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
        {pax && <div><span className="text-slate-500">Travellers: </span><span className="font-medium">{pax}</span></div>}
        {itin.mealPlan && <div><span className="text-slate-500">Meal plan: </span><span className="font-medium">{itin.mealPlan}</span></div>}
        {itin.pickupLocation && <div><span className="text-slate-500">Pickup: </span><span className="font-medium">{itin.pickupLocation}</span></div>}
        {itin.dropLocation && <div><span className="text-slate-500">Drop-off: </span><span className="font-medium">{itin.dropLocation}</span></div>}
        {itin.meetingPoint && <div><span className="text-slate-500">Meeting point: </span><span className="font-medium">{itin.meetingPoint}</span></div>}
      </div>

      {itin.notes && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{itin.notes}</p>}

      <div className="mt-6 space-y-5">
        {days.map((day) => {
          const meals = day.meals || {};
          const mealText = ['breakfast', 'lunch', 'dinner'].filter((k) => meals[k]).map((k) => `${k[0].toUpperCase()}${k.slice(1)}: ${meals[k]}`).join(' · ');
          const acc = day.accommodation || {};
          return (
            <div key={day.id || day.dayNumber} className="break-inside-avoid">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-violet-700">Day {day.dayNumber}</span>
                <span className="font-semibold">{day.title || ''}</span>
                <span className="ml-auto text-xs text-slate-500">{day.date ? formatJoined(day.date) : ''}{day.location ? `${day.date ? ' · ' : ''}${day.location}` : ''}</span>
              </div>
              {day.description && <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{day.description}</p>}
              <ul className="mt-2 space-y-1 text-sm">
                {(day.services || []).map((s) => {
                  const meta = ITIN_SERVICE_META[s.type] || ITIN_SERVICE_META.other;
                  const extra = [[s.startTime, s.endTime].filter(Boolean).join('–'), s.location].filter(Boolean).join(' · ');
                  return <li key={s.id} className="pl-3">• <span className="font-medium">{s.name || meta.label}</span> <span className="text-slate-400 text-xs">({meta.label})</span>{extra && <span className="text-slate-500"> — {extra}</span>}</li>;
                })}
                {(day.activities || []).map((a) => (
                  <li key={a.id} className="pl-3">• <span className="font-medium">{a.name || 'Activity'}</span>{(a.startTime || a.endTime) && <span className="text-slate-500"> — {[a.startTime, a.endTime].filter(Boolean).join('–')}</span>}</li>
                ))}
              </ul>
              <div className="mt-1 space-y-0.5 pl-3 text-sm text-slate-600">
                {mealText && <div>Meals: {mealText}</div>}
                {acc.name && <div>Stay: {[acc.name, acc.location].filter(Boolean).join(', ')}</div>}
                {day.notes && <div className="italic">{day.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <ItineraryMap itin={itin} />

      {(c.name || c.phone || c.email) && (
        <div className="mt-6 border-t pt-3 text-sm text-slate-600">
          <span className="font-semibold">Contact:</span> {[c.name, c.phone, c.email].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
}

function ItineraryViewPage({ session, itineraryId, onBack, onEdit }) {
  const [itin, setItin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(false);
  const canUpdate = can(session.user.role, 'itineraries:update');
  const agencyName = (session.agency && session.agency.name) || (session.user && session.user.agencyName) || '';
  useEffect(() => { (async () => { setLoading(true); try { const d = await api(`/itineraries/${itineraryId}`); setItin(d.itinerary); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, [itineraryId]);
  if (loading) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  if (!itin) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Itinerary not found.</CardContent></Card>;

  if (customer) {
    return (
      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCustomer(false)}><ArrowLeft className="h-4 w-4 mr-1" /> Back to editor view</Button>
          <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print / Save as PDF</Button>
        </div>
        <Card className="overflow-hidden"><CardContent className="p-0"><CustomerItineraryView itin={itin} agencyName={agencyName} /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">{itin.title}</h2><ItineraryStatusBadge status={itin.status} /></div>
            <p className="text-sm text-muted-foreground">{itin.destination} · {travelDates(itin)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCustomer(true)}><Eye className="h-4 w-4 mr-1" /> Customer view</Button>
          {canUpdate && <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="h-4 w-4 mr-1" /> Edit itinerary</Button>}
        </div>
      </div>
      <Card><CardContent className="p-5"><ItineraryTravelOverview itin={itin} /></CardContent></Card>
      {itin.notes && <Card><CardContent className="p-4 text-sm whitespace-pre-wrap">{itin.notes}</CardContent></Card>}
      <Card><CardContent className="p-5"><ItineraryView itin={itin} /></CardContent></Card>
    </div>
  );
}

function ItineraryCreateDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({ title: '', destination: '', startDate: '', endDate: '', adults: 2, children: 0 });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!form.destination.trim()) { toast.error('Destination is required'); return; }
    if (form.startDate && form.endDate && form.startDate > form.endDate) { toast.error('End date must be on or after the start date'); return; }
    setSaving(true);
    try {
      const { itinerary } = await api('/itineraries', { method: 'POST', body: JSON.stringify({
        title: form.title, destination: form.destination, startDate: form.startDate, endDate: form.endDate,
        travelers: { adults: Number(form.adults) || 0, children: Number(form.children) || 0 },
      }) });
      toast.success('Itinerary created');
      onOpenChange(false);
      setForm({ title: '', destination: '', startDate: '', endDate: '', adults: 2, children: 0 });
      onCreated && onCreated(itinerary);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New itinerary</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Title</Label><Input value={form.title} placeholder="Optional — auto-named from destination" onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Destination *</Label><Input value={form.destination} placeholder="Goa" onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Adults</Label><Input type="number" min="0" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Children</Label><Input type="number" min="0" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create & build'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Itineraries({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [mode, setMode] = useState('view');
  const [creating, setCreating] = useState(false);
  const canCreate = can(session.user.role, 'itineraries:create');
  const canDelete = can(session.user.role, 'itineraries:delete');

  const load = async () => { setLoading(true); try { const d = await api('/itineraries'); setRows(d.itineraries || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this itinerary? This cannot be undone.')) return;
    try { await api(`/itineraries/${id}`, { method: 'DELETE' }); toast.success('Itinerary deleted'); load(); } catch (e) { toast.error(friendlyError(e)); }
  };

  if (openId) {
    if (mode === 'edit') return <ItineraryEditor session={session} itineraryId={openId} onBack={() => setMode('view')} onSaved={() => { setMode('view'); load(); }} />;
    return <ItineraryViewPage session={session} itineraryId={openId} onBack={() => { setOpenId(null); load(); }} onEdit={() => setMode('edit')} />;
  }

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    const mq = !q || [r.title, r.destination].some((f) => String(f || '').toLowerCase().includes(q));
    const ms = statusFilter === 'all' || (r.status || 'draft') === statusFilter;
    return mq && ms;
  });
  const isEmpty = !loading && rows.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold">Itineraries</h2><p className="text-sm text-muted-foreground">Day-by-day travel plans — standalone or linked to your packages.</p></div>
        {canCreate && !isEmpty && <Button onClick={() => setCreating(true)} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" /> Create itinerary</Button>}
      </div>

      {!isEmpty && !loading && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or destination" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{ITINERARY_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{ITINERARY_STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />)}</div>}

      {isEmpty && (
        <Card><CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Map className="h-6 w-6 text-muted-foreground" /></div>
          <div className="space-y-1"><h3 className="font-semibold">No itineraries yet</h3><p className="mx-auto max-w-sm text-sm text-muted-foreground">Create a standalone itinerary here, or open a package to build one linked to it.</p></div>
          {canCreate && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1.5" /> Create itinerary</Button>}
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
                <TableHead>Title</TableHead><TableHead>Destination</TableHead><TableHead>Dates</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => { setOpenId(r.id); setMode('view'); }}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="text-muted-foreground">{r.destination}</TableCell>
                    <TableCell className="text-muted-foreground">{travelDates(r)}</TableCell>
                    <TableCell className="text-muted-foreground">{(r.days || []).length}</TableCell>
                    <TableCell><ItineraryStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" title="Open" onClick={() => { setOpenId(r.id); setMode('view'); }}><Eye className="h-4 w-4" /></Button>
                      {canDelete && <Button variant="ghost" size="icon" title="Delete" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="cursor-pointer" onClick={() => { setOpenId(r.id); setMode('view'); }}><CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2"><div className="font-semibold truncate">{r.title}</div><ItineraryStatusBadge status={r.status} /></div>
                <div className="text-sm text-muted-foreground truncate">{r.destination} · {(r.days || []).length} day{(r.days || []).length === 1 ? '' : 's'}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{travelDates(r)}</div>
                  {canDelete && <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); remove(r.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </CardContent></Card>
            ))}
          </div>
        </>
      )}

      <ItineraryCreateDialog open={creating} onOpenChange={setCreating} onCreated={(it) => { setOpenId(it.id); setMode('edit'); }} />
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
                      <TableCell className="text-muted-foreground">{it.supplierId ? (it.supplierName || 'Linked supplier') : 'Unassigned'}</TableCell>
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
                  <div className="text-muted-foreground">{it.supplierId ? (it.supplierName || 'Linked supplier') : 'Unassigned'}</div>
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
    } else if (navPayload && navPayload.openBookingId) {
      setSelectedId(navPayload.openBookingId); setView('detail');
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
  leave:     { label: 'On Leave',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
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
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { setLoading(true); try {
    const [s, a] = await Promise.all([api('/fleet/stats'), api('/fleet/alerts').catch(() => ({ alerts: [] }))]);
    setStats(s.stats); setAlerts(a.alerts || []);
  } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, []);
  if (loading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  const v = (stats && stats.vehicles) || {}; const d = (stats && stats.drivers) || {};
  const expired = alerts.filter((a) => a.severity === 'expired');
  const upcoming = alerts.filter((a) => a.severity === 'upcoming');
  return (
    <div className="space-y-5">
      {alerts.length > 0 && (
        <Card className={expired.length ? 'border-rose-200' : 'border-amber-200'}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <X className={`h-4 w-4 ${expired.length ? 'text-rose-600' : 'text-amber-600'}`} />
              Document & licence alerts
              {expired.length > 0 && <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">{expired.length} expired</Badge>}
              {upcoming.length > 0 && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{upcoming.length} expiring soon</Badge>}
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {alerts.slice(0, 8).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${a.severity === 'expired' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground">· {a.document} {a.severity === 'expired' ? 'expired' : 'expires'} {formatJoined(a.expiry)}</span>
                </div>
              ))}
            </div>
            {alerts.length > 8 && <div className="text-xs text-muted-foreground">+{alerts.length - 8} more</div>}
          </CardContent>
        </Card>
      )}
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
        <div className="mb-2 text-sm font-semibold text-muted-foreground">Drivers & assignments</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FleetStatCard icon={Users} label="Total drivers" value={d.total || 0} tint="bg-violet-50 text-violet-600" />
          <FleetStatCard icon={CheckCircle2} label="Available drivers" value={d.available || 0} tint="bg-emerald-50 text-emerald-600" />
          <FleetStatCard icon={MapPin} label="On trip" value={d.on_trip || 0} tint="bg-amber-50 text-amber-600" />
          <FleetStatCard icon={CalendarClock} label="On leave" value={d.leave || 0} tint="bg-purple-50 text-purple-600" />
          <FleetStatCard icon={ClipboardList} label="Active assignments" value={(stats && stats.activeAssignments) || 0} tint="bg-sky-50 text-sky-600" />
        </div>
      </div>
      <Card><CardContent className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><MapPin className="h-6 w-6 text-muted-foreground" /></div>
        <h3 className="font-semibold">Live map</h3>
        <p className="max-w-sm text-sm text-muted-foreground">Vehicle coordinates are stored and ready. Real-time GPS tracking will be available in a future phase.</p>
      </CardContent></Card>
    </div>
  );
}

// ----------------------------- VEHICLES -----------------------------
function VehicleForm({ session, mode, vehicleId, onDone, onCancel }) {
  const [form, setForm] = useState({ vehicleNumber: '', registrationNumber: '', vehicleType: 'car', make: '', model: '', year: 0, color: '', seatingCapacity: 0, fuelType: '', status: 'available', currentDriverId: '', notes: '', registrationExpiry: '', insuranceNumber: '', insuranceExpiry: '', permitNumber: '', permitExpiry: '', fitnessExpiry: '' });
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }));
  useEffect(() => { (async () => { try { const d = await api('/drivers'); setDrivers(d.drivers || []); } catch { /* */ } })(); }, []);
  useEffect(() => {
    if (mode === 'edit' && vehicleId) {
      (async () => { setLoading(true); try { const { vehicle: v } = await api(`/vehicles/${vehicleId}`);
        setForm({ vehicleNumber: v.vehicleNumber || '', registrationNumber: v.registrationNumber || '', vehicleType: v.vehicleType || 'car', make: v.make || '', model: v.model || '', year: v.year || 0, color: v.color || '', seatingCapacity: v.seatingCapacity || 0, fuelType: v.fuelType || '', status: v.status || 'available', currentDriverId: v.currentDriverId || '', notes: v.notes || '', registrationExpiry: v.registrationExpiry || '', insuranceNumber: v.insuranceNumber || '', insuranceExpiry: v.insuranceExpiry || '', permitNumber: v.permitNumber || '', permitExpiry: v.permitExpiry || '', fitnessExpiry: v.fitnessExpiry || '' });
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
        <div className="sm:col-span-2 pt-1 text-sm font-semibold text-muted-foreground">Documents & expiry</div>
        <div className="space-y-1.5"><Label>Registration expiry</Label><Input type="date" value={form.registrationExpiry} onChange={set('registrationExpiry')} /></div>
        <div className="space-y-1.5"><Label>Fitness expiry</Label><Input type="date" value={form.fitnessExpiry} onChange={set('fitnessExpiry')} /></div>
        <div className="space-y-1.5"><Label>Insurance number</Label><Input value={form.insuranceNumber} onChange={set('insuranceNumber')} /></div>
        <div className="space-y-1.5"><Label>Insurance expiry</Label><Input type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} /></div>
        <div className="space-y-1.5"><Label>Permit number</Label><Input value={form.permitNumber} onChange={set('permitNumber')} /></div>
        <div className="space-y-1.5"><Label>Permit expiry</Label><Input type="date" value={form.permitExpiry} onChange={set('permitExpiry')} /></div>
      </CardContent></Card>
      <div className="flex gap-2"><Button className="flex-1 sm:flex-none" onClick={submit} disabled={!canSubmit || submitting}>{submitting ? 'Saving…' : (mode === 'edit' ? 'Save changes' : 'Add vehicle')}</Button><Button variant="outline" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}

const MAINTENANCE_STATUS_META = {
  scheduled:   { label: 'Scheduled',   cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-muted text-muted-foreground border-border' },
};
const MAINTENANCE_STATUS_OPTIONS = Object.keys(MAINTENANCE_STATUS_META);

function VehicleMaintenance({ session, vehicleId }) {
  const canUpdate = can(session.user.role, 'fleet:update');
  const canCreate = can(session.user.role, 'fleet:create');
  const [rows, setRows] = useState([]); const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true); const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: '', date: '', description: '', cost: 0, odometer: 0, nextServiceDate: '', vendor: '', status: 'completed', notes: '' });
  const load = async () => { setLoading(true); try { const d = await api(`/vehicles/${vehicleId}/maintenance`); setRows(d.maintenance || []); setTotalCost(d.totalCost || 0); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [vehicleId]);
  const submit = async () => {
    if (!form.type.trim()) { toast.error('Maintenance type is required'); return; }
    setSaving(true);
    try { await api(`/vehicles/${vehicleId}/maintenance`, { method: 'POST', body: JSON.stringify(form) }); toast.success('Maintenance logged'); setOpen(false); setForm({ type: '', date: '', description: '', cost: 0, odometer: 0, nextServiceDate: '', vendor: '', status: 'completed', notes: '' }); load(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); }
  };
  const remove = async (id) => { if (!window.confirm('Delete this maintenance record?')) return; try { await api(`/maintenance/${id}`, { method: 'DELETE' }); toast.success('Record deleted'); load(); } catch (e) { toast.error(friendlyError(e)); } };
  return (
    <Card><CardContent className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-orange-600" /> Maintenance
          {totalCost > 0 && <span className="text-xs font-normal text-muted-foreground">· Total {fmtMoney(totalCost)}</span>}</div>
        {canCreate && <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add record</Button>}
      </div>
      {loading && <div className="h-12 rounded-lg border bg-muted/30 animate-pulse" />}
      {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground">No maintenance records yet.</p>}
      {!loading && rows.map((m) => (
        <div key={m.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2"><span className="font-medium">{m.type}</span><MetaBadge meta={MAINTENANCE_STATUS_META[m.status] || MAINTENANCE_STATUS_META.completed} /></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{fmtMoney(m.cost)}</span>
              {canUpdate && <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
            </div>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {m.date ? formatJoined(m.date) : ''}{m.vendor ? ` · ${m.vendor}` : ''}{m.odometer ? ` · ${fmtNum(m.odometer)} km` : ''}{m.nextServiceDate ? ` · Next: ${formatJoined(m.nextServiceDate)}` : ''}
          </div>
          {m.description && <p className="mt-1 text-sm whitespace-pre-wrap">{m.description}</p>}
          {m.notes && <p className="mt-1 text-sm text-muted-foreground italic">{m.notes}</p>}
        </div>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add maintenance record</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Type *</Label><Input value={form.type} placeholder="Service / Repair / Tyre" onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MAINTENANCE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{MAINTENANCE_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Next service date</Label><Input type="date" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Cost</Label><Input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Odometer (km)</Label><Input type="number" min="0" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Vendor / garage</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea rows={1} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Add record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent></Card>
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
          <PkgRow label="Registration expiry" value={formatJoined(v.registrationExpiry)} />
          <PkgRow label="Insurance" value={v.insuranceNumber} />
          <PkgRow label="Insurance expiry" value={formatJoined(v.insuranceExpiry)} />
          <PkgRow label="Permit" value={v.permitNumber} />
          <PkgRow label="Permit expiry" value={formatJoined(v.permitExpiry)} />
          <PkgRow label="Fitness expiry" value={formatJoined(v.fitnessExpiry)} />
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
      <VehicleMaintenance session={session} vehicleId={vehicleId} />
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
  const [form, setForm] = useState({ name: '', phone: '', email: '', licenseNumber: '', licenseExpiry: '', status: 'available', notes: '', address: '', emergencyContactName: '', emergencyContactPhone: '' });
  const [loading, setLoading] = useState(mode === 'edit'); const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  useEffect(() => { if (mode === 'edit' && driverId) { (async () => { setLoading(true); try { const { driver: d } = await api(`/drivers/${driverId}`); setForm({ name: d.name || '', phone: d.phone || '', email: d.email || '', licenseNumber: d.licenseNumber || '', licenseExpiry: d.licenseExpiry || '', status: d.status || 'available', notes: d.notes || '', address: d.address || '', emergencyContactName: d.emergencyContactName || '', emergencyContactPhone: d.emergencyContactPhone || '' }); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); } }, [mode, driverId]);
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
        <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={set('address')} /></div>
        <div className="space-y-1.5"><Label>Emergency contact name</Label><Input value={form.emergencyContactName} onChange={set('emergencyContactName')} /></div>
        <div className="space-y-1.5"><Label>Emergency contact phone</Label><Input value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} /></div>
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
        <PkgRow label="Address" value={d.address} />
        <PkgRow label="Emergency contact" value={[d.emergencyContactName, d.emergencyContactPhone].filter(Boolean).join(' · ')} />
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

// ======================= FINANCE =======================
const FIN_PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other'];
const FIN_PM_LABEL = { cash: 'Cash', bank_transfer: 'Bank Transfer', upi: 'UPI', card: 'Card', cheque: 'Cheque', other: 'Other' };
const FIN_EXP_CATS = ['transport', 'hotel', 'activity', 'staff', 'office', 'marketing', 'fuel', 'supplier', 'other'];
const SETTLE_META = {
  pending: { label: 'Pending', cls: 'bg-muted text-muted-foreground border-border' },
  partially_paid: { label: 'Partially Paid', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Overdue', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};
const EXP_STATUS_META = { pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' }, paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' } };
const TXN_STATUS_META = { pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' }, completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' } };
const INV_STATUS_META = { draft: { label: 'Draft', cls: 'bg-muted text-muted-foreground border-border' }, issued: { label: 'Issued', cls: 'bg-sky-50 text-sky-700 border-sky-200' }, partially_paid: { label: 'Partially Paid', cls: 'bg-amber-50 text-amber-700 border-amber-200' }, paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, overdue: { label: 'Overdue', cls: 'bg-rose-50 text-rose-700 border-rose-200' }, cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' } };
function finOverdue(rec) { return rec.outstandingAmount > 0 && rec.dueDate && String(rec.dueDate).slice(0, 10) < new Date().toISOString().slice(0, 10) && rec.status !== 'paid' && rec.status !== 'cancelled'; }
function titleCase(s) { return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }

function FinClientPicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/clients'); setOpts(d.clients || []); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}><SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger><SelectContent><SelectItem value="none">No client</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name || o.companyName || o.contactName || o.email}</SelectItem>)}</SelectContent></Select>);
}
function FinSupplierPicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/suppliers'); setOpts(d.suppliers || []); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}><SelectTrigger><SelectValue placeholder="No supplier" /></SelectTrigger><SelectContent><SelectItem value="none">No supplier</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>);
}
function FinBookingPicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/bookings'); setOpts(d.bookings || []); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}><SelectTrigger><SelectValue placeholder="No booking" /></SelectTrigger><SelectContent><SelectItem value="none">No booking</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.bookingNumber} · {o.customerName}</SelectItem>)}</SelectContent></Select>);
}

function FinanceDashboard() {
  const [d, setD] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { setLoading(true); try { const r = await api('/finance/dashboard'); setD(r.dashboard); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } })(); }, []);
  if (loading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 rounded-lg border bg-muted/30 animate-pulse" />)}</div>;
  const x = d || {};
  const cards = [
    { label: 'Total revenue (billed)', value: x.totalRevenue, icon: TrendingUp, tint: 'bg-violet-50 text-violet-600' },
    { label: 'Payments received', value: x.receivedPayments, icon: Wallet, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Outstanding (customers)', value: x.outstandingCustomer, icon: Receipt, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Supplier payables', value: x.totalPayables, icon: Store, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Outstanding (suppliers)', value: x.outstandingSupplier, icon: CreditCard, tint: 'bg-orange-50 text-orange-600' },
    { label: 'Expenses', value: x.totalExpenses, icon: CreditCard, tint: 'bg-rose-50 text-rose-600' },
    { label: 'Gross profit', value: x.grossProfit, icon: BarChart3, tint: 'bg-teal-50 text-teal-600' },
  ];
  const allZero = !cards.some((c) => Number(c.value) > 0);
  const recentTxns = x.recentTransactions || [];
  const trends = x.trends || [];
  const maxTrend = Math.max(...trends.map((t) => Math.max(t.income || 0, t.expense || 0)), 1);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => { const Icon = c.icon; return (<Card key={c.label}><CardContent className="flex items-center gap-3 p-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.tint}`}><Icon className="h-5 w-5" /></div><div className="min-w-0"><div className="text-xl font-bold leading-none">{money(c.value || 0)}</div><div className="mt-1 text-xs text-muted-foreground truncate">{c.label}</div></div></CardContent></Card>); })}
      </div>
      {allZero && <Card><CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">No financial records yet. Add receivables, expenses, invoices or record a payment to see live figures here.</CardContent></Card>}
      {!allZero && trends.length > 0 && (<Card><CardContent className="p-5 space-y-3">
        <div className="font-semibold">Financial trends (last 6 months)</div>
        <div className="flex items-end justify-between gap-2 h-40">
          {trends.map((t) => { const ih = Math.round((t.income / maxTrend) * 100); const eh = Math.round((t.expense / maxTrend) * 100); return (<div key={t.key} className="flex flex-col items-center gap-1 flex-1">
            <div className="flex items-end gap-0.5 w-full h-32">
              <div className="flex-1 bg-emerald-200 rounded-t" style={{ height: `${ih}%` }} title={`Income: ${money(t.income)}`} />
              <div className="flex-1 bg-rose-200 rounded-t" style={{ height: `${eh}%` }} title={`Expense: ${money(t.expense)}`} />
            </div>
            <div className="text-xs text-muted-foreground">{t.label}</div>
          </div>); })}
        </div>
        <div className="flex gap-4 text-xs"><div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-emerald-200" /><span>Income</span></div><div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-rose-200" /><span>Expense</span></div></div>
      </CardContent></Card>)}
      {recentTxns.length > 0 && (<Card><CardContent className="p-5">
        <div className="mb-3 font-semibold">Recent transactions</div>
        <div className="space-y-2">
          {recentTxns.map((t) => (<div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
            <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{t.description || titleCase(t.category) || 'Transaction'}</div><div className="text-xs text-muted-foreground">{t.transactionDate} · {titleCase(t.type)}</div></div>
            <div className={`text-sm font-semibold shrink-0 ${t.type === 'income' ? 'text-emerald-700' : t.type === 'expense' ? 'text-rose-700' : 'text-muted-foreground'}`}>{t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{money(t.amount)}</div>
          </div>))}
        </div>
      </CardContent></Card>)}
    </div>
  );
}

function FinReports() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const load = async () => {
    setLoading(true);
    try {
      let url = '/finance/reports';
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (params.toString()) url += '?' + params.toString();
      const r = await api(url);
      setData(r);
    } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const applyFilter = () => { load(); };
  if (loading) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  const rows = (data && data.reports) || [];
  const custBal = (data && data.customerBalances) || [];
  const suppBal = (data && data.supplierBalances) || [];
  const bookProf = (data && data.bookingProfitability) || [];
  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1 flex-1 min-w-[140px]"><Label className="text-xs">From date</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-1 flex-1 min-w-[140px]"><Label className="text-xs">To date</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <Button size="sm" onClick={applyFilter}><Filter className="h-4 w-4 mr-1" /> Apply filter</Button>
          {(from || to) && <Button size="sm" variant="outline" onClick={() => { setFrom(''); setTo(''); setTimeout(load, 50); }}>Clear</Button>}
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-5"><div className="mb-3 font-semibold">Financial summary</div>{rows.map((r) => <FinRow key={r.key} label={r.label} value={money(r.value || 0)} strong={r.key === 'gross_profit'} />)}</CardContent></Card>
      {custBal.length > 0 && (<Card><CardContent className="p-5">
        <div className="mb-3 font-semibold">Customer outstanding balances</div>
        <div className="space-y-2">
          {custBal.slice(0, 10).map((c, i) => (<div key={i} className="flex items-center justify-between py-1 border-b last:border-0"><span className="text-sm">{c.name}</span><span className="text-sm font-medium">{money(c.outstanding)}</span></div>))}
        </div>
      </CardContent></Card>)}
      {suppBal.length > 0 && (<Card><CardContent className="p-5">
        <div className="mb-3 font-semibold">Supplier outstanding balances</div>
        <div className="space-y-2">
          {suppBal.slice(0, 10).map((s, i) => (<div key={i} className="flex items-center justify-between py-1 border-b last:border-0"><span className="text-sm">{s.name}</span><span className="text-sm font-medium">{money(s.outstanding)}</span></div>))}
        </div>
      </CardContent></Card>)}
      {bookProf.length > 0 && (<Card><CardContent className="p-5">
        <div className="mb-3 font-semibold">Booking profitability</div>
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Booking</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Supplier cost</TableHead><TableHead className="text-right">Expenses</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
          <TableBody>{bookProf.slice(0, 20).map((b, i) => (<TableRow key={i}><TableCell className="font-medium">{b.bookingNumber || b.bookingId}</TableCell><TableCell>{b.customerName || '—'}</TableCell><TableCell className="text-right">{money(b.revenue)}</TableCell><TableCell className="text-right">{money(b.supplierCost)}</TableCell><TableCell className="text-right">{money(b.expenses)}</TableCell><TableCell className={`text-right font-medium ${b.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{money(b.profit)}</TableCell></TableRow>))}</TableBody></Table></div>
      </CardContent></Card>)}
    </div>
  );
}

// Generic finance list wrapper with search + create panel toggle
function FinListShell({ title, subtitle, canCreate, createLabel, children, onCreate, showing, query, setQuery, searchPlaceholder, filters }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          {setQuery && <div className="relative sm:max-w-xs sm:flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className="pl-9" /></div>}
          {filters}
        </div>
        {canCreate && <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1.5" /> {createLabel}</Button>}
      </div>
      {children}
    </div>
  );
}

function TransactionsPane({ session }) {
  const canCreate = can(session.user.role, 'finance:create');
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState('');
  const [typeF, setTypeF] = useState('all'); const [statusF, setStatusF] = useState('all'); const [show, setShow] = useState(false);
  const [f, setF] = useState({ type: 'income', amount: 0, category: '', description: '', clientId: '', supplierId: '', bookingId: '', paymentMethod: 'cash', transactionDate: '', status: 'completed' });
  const load = async () => { setLoading(true); try { const d = await api('/finance/transactions'); setRows(d.transactions || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => { if (!(Number(f.amount) > 0)) { toast.error('Amount must be greater than zero'); return; } try { await api('/finance/transactions', { method: 'POST', body: JSON.stringify(f) }); toast.success('Transaction recorded'); setShow(false); setF({ type: 'income', amount: 0, category: '', description: '', clientId: '', supplierId: '', bookingId: '', paymentMethod: 'cash', transactionDate: '', status: 'completed' }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const q = query.trim().toLowerCase();
  const rr = rows.filter((r) => (!q || [r.description, r.category, r.clientName, r.supplierName, r.bookingNumber].some((v) => String(v || '').toLowerCase().includes(q))) && (typeF === 'all' || r.type === typeF) && (statusF === 'all' || r.status === statusF));
  const filters = (<><Select value={typeF} onValueChange={setTypeF}><SelectTrigger className="sm:w-36"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem><SelectItem value="transfer">Transfer</SelectItem></SelectContent></Select>
    <Select value={statusF} onValueChange={setStatusF}><SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.keys(TXN_STATUS_META).map((s) => <SelectItem key={s} value={s}>{TXN_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></>);
  const isTransfer = f.type === 'transfer';
  return (
    <FinListShell canCreate={canCreate} createLabel="Add transaction" onCreate={() => setShow((v) => !v)} query={query} setQuery={setQuery} searchPlaceholder="Search transactions" filters={filters}>
      {show && (<Card><CardContent className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="space-y-1"><Label>Type</Label><Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem><SelectItem value="transfer">Transfer</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label>Amount</Label><Input type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: Math.max(0, Number(e.target.value) || 0) })} /></div>
        <div className="space-y-1"><Label>Category</Label><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder={isTransfer ? 'e.g. bank_to_cash' : ''} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Description</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="space-y-1"><Label>Method</Label><Select value={f.paymentMethod} onValueChange={(v) => setF({ ...f, paymentMethod: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FIN_PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{FIN_PM_LABEL[m]}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Client (optional)</Label><FinClientPicker value={f.clientId} onChange={(v) => setF({ ...f, clientId: v })} /></div>
        <div className="space-y-1"><Label>Supplier (optional)</Label><FinSupplierPicker value={f.supplierId} onChange={(v) => setF({ ...f, supplierId: v })} /></div>
        <div className="space-y-1"><Label>Booking (optional)</Label><FinBookingPicker value={f.bookingId} onChange={(v) => setF({ ...f, bookingId: v })} /></div>
        <div className="space-y-1"><Label>Date</Label><Input type="date" value={f.transactionDate} onChange={(e) => setF({ ...f, transactionDate: e.target.value })} /></div>
        <div className="space-y-1"><Label>Status</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(TXN_STATUS_META).map((s) => <SelectItem key={s} value={s}>{TXN_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></div>
        <div className="sm:col-span-3"><Button size="sm" onClick={save}>Save transaction</Button></div>
      </CardContent></Card>)}
      {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
      {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No transactions yet.</CardContent></Card>}
      {!loading && rr.length > 0 && (<Card className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Party</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{rr.map((r) => (<TableRow key={r.id}><TableCell className="text-muted-foreground">{r.transactionDate}</TableCell><TableCell><Badge variant="outline" className={`font-normal ${r.type === 'income' ? 'text-emerald-700' : r.type === 'expense' ? 'text-rose-700' : 'text-blue-700'}`}>{titleCase(r.type)}</Badge></TableCell><TableCell>{titleCase(r.category) || '—'}</TableCell><TableCell className="max-w-[200px] truncate">{r.description || '—'}</TableCell><TableCell className="text-muted-foreground">{r.clientName || r.supplierName || (r.bookingNumber ? `Booking ${r.bookingNumber}` : '—')}</TableCell><TableCell className={`text-right font-medium ${r.type === 'income' ? 'text-emerald-700' : r.type === 'expense' ? 'text-rose-700' : ''}`}>{r.type === 'income' ? '+' : r.type === 'expense' ? '-' : ''}{money(r.amount)}</TableCell><TableCell className="text-muted-foreground">{FIN_PM_LABEL[r.paymentMethod] || '—'}</TableCell><TableCell><MetaBadge meta={TXN_STATUS_META[r.status] || TXN_STATUS_META.completed} /></TableCell></TableRow>))}</TableBody></Table></Card>)}
    </FinListShell>
  );
}

function PaymentPanel({ onSubmit, onCancel }) {
  const [f, setF] = useState({ amount: 0, paymentDate: '', paymentMethod: 'cash', reference: '', notes: '' });
  return (<div className="mt-2 rounded-lg border bg-muted/30 p-3 space-y-2">
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="space-y-1"><Label className="text-xs">Amount</Label><Input type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: Math.max(0, Number(e.target.value) || 0) })} /></div>
      <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={f.paymentDate} onChange={(e) => setF({ ...f, paymentDate: e.target.value })} /></div>
      <div className="space-y-1"><Label className="text-xs">Method</Label><Select value={f.paymentMethod} onValueChange={(v) => setF({ ...f, paymentMethod: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{FIN_PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{FIN_PM_LABEL[m]}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Reference</Label><Input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></div>
    </div>
    <div className="flex gap-2"><Button size="sm" onClick={() => onSubmit(f)}>Record payment</Button><Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button></div>
  </div>);
}

function ReceivablesPane({ session }) {
  const canCreate = can(session.user.role, 'finance:create');
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [show, setShow] = useState(false); const [payId, setPayId] = useState(null);
  const [f, setF] = useState({ clientId: '', bookingId: '', totalAmount: 0, dueDate: '', notes: '' });
  const load = async () => { setLoading(true); try { const d = await api('/finance/receivables'); setRows(d.receivables || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => { if (!(Number(f.totalAmount) > 0)) { toast.error('Total must be greater than zero'); return; } try { await api('/finance/receivables', { method: 'POST', body: JSON.stringify(f) }); toast.success('Receivable created'); setShow(false); setF({ clientId: '', bookingId: '', totalAmount: 0, dueDate: '', notes: '' }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const pay = async (id, data) => { try { await api(`/finance/receivables/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }); toast.success('Payment recorded'); setPayId(null); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const q = query.trim().toLowerCase();
  const rr = rows.filter((r) => !q || [r.clientName, r.bookingNumber].some((v) => String(v || '').toLowerCase().includes(q)));
  return (
    <FinListShell canCreate={canCreate} createLabel="Add receivable" onCreate={() => setShow((v) => !v)} query={query} setQuery={setQuery} searchPlaceholder="Search customer / booking">
      {show && (<Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="space-y-1"><Label>Client</Label><FinClientPicker value={f.clientId} onChange={(v) => setF({ ...f, clientId: v })} /></div>
        <div className="space-y-1"><Label>Booking</Label><FinBookingPicker value={f.bookingId} onChange={(v) => setF({ ...f, bookingId: v })} /></div>
        <div className="space-y-1"><Label>Total amount</Label><Input type="number" min="0" value={f.totalAmount} onChange={(e) => setF({ ...f, totalAmount: Math.max(0, Number(e.target.value) || 0) })} /></div>
        <div className="space-y-1"><Label>Due date</Label><Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
        <div className="sm:col-span-2"><Button size="sm" onClick={save}>Save receivable</Button></div>
      </CardContent></Card>)}
      {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
      {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No customer receivables yet.</CardContent></Card>}
      {!loading && rr.map((r) => { const ov = finOverdue(r); const meta = ov ? SETTLE_META.overdue : (SETTLE_META[r.status] || SETTLE_META.pending); return (
        <Card key={r.id}><CardContent className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0"><div className="font-semibold">{r.clientName || 'Customer'}</div><div className="text-sm text-muted-foreground">{r.bookingNumber || '—'}{r.dueDate ? ` · due ${r.dueDate}` : ''}</div></div>
            <MetaBadge meta={meta} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm"><div><div className="text-xs text-muted-foreground">Total</div>{money(r.totalAmount)}</div><div><div className="text-xs text-muted-foreground">Received</div>{money(r.receivedAmount)}</div><div><div className="text-xs text-muted-foreground">Outstanding</div><span className="font-medium">{money(r.outstandingAmount)}</span></div></div>
          {canCreate && r.status !== 'paid' && r.status !== 'cancelled' && payId !== r.id && <Button size="sm" variant="outline" className="mt-2" onClick={() => setPayId(r.id)}><Wallet className="h-4 w-4 mr-1" /> Record payment</Button>}
          {payId === r.id && <PaymentPanel onSubmit={(data) => pay(r.id, data)} onCancel={() => setPayId(null)} />}
        </CardContent></Card>); })}
    </FinListShell>
  );
}

function PayablesPane({ session }) {
  const canCreate = can(session.user.role, 'finance:create');
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [show, setShow] = useState(false); const [payId, setPayId] = useState(null);
  const [f, setF] = useState({ supplierId: '', bookingId: '', totalAmount: 0, dueDate: '', notes: '' });
  const load = async () => { setLoading(true); try { const d = await api('/finance/payables'); setRows(d.payables || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => { if (!f.supplierId) { toast.error('Please select a supplier'); return; } if (!(Number(f.totalAmount) > 0)) { toast.error('Total must be greater than zero'); return; } try { await api('/finance/payables', { method: 'POST', body: JSON.stringify(f) }); toast.success('Payable created'); setShow(false); setF({ supplierId: '', bookingId: '', totalAmount: 0, dueDate: '', notes: '' }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const pay = async (id, data) => { try { await api(`/finance/payables/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }); toast.success('Payment recorded'); setPayId(null); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const q = query.trim().toLowerCase();
  const rr = rows.filter((r) => !q || [r.supplierName, r.bookingNumber].some((v) => String(v || '').toLowerCase().includes(q)));
  return (
    <FinListShell canCreate={canCreate} createLabel="Add payable" onCreate={() => setShow((v) => !v)} query={query} setQuery={setQuery} searchPlaceholder="Search supplier / booking">
      {show && (<Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="space-y-1"><Label>Supplier</Label><FinSupplierPicker value={f.supplierId} onChange={(v) => setF({ ...f, supplierId: v })} /></div>
        <div className="space-y-1"><Label>Booking</Label><FinBookingPicker value={f.bookingId} onChange={(v) => setF({ ...f, bookingId: v })} /></div>
        <div className="space-y-1"><Label>Total amount</Label><Input type="number" min="0" value={f.totalAmount} onChange={(e) => setF({ ...f, totalAmount: Math.max(0, Number(e.target.value) || 0) })} /></div>
        <div className="space-y-1"><Label>Due date</Label><Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
        <div className="sm:col-span-2"><Button size="sm" onClick={save}>Save payable</Button></div>
      </CardContent></Card>)}
      {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
      {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No supplier payables yet.</CardContent></Card>}
      {!loading && rr.map((r) => { const ov = finOverdue(r); const meta = ov ? SETTLE_META.overdue : (SETTLE_META[r.status] || SETTLE_META.pending); return (
        <Card key={r.id}><CardContent className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0"><div className="font-semibold">{r.supplierName || 'Supplier'}</div><div className="text-sm text-muted-foreground">{r.bookingNumber || '—'}{r.dueDate ? ` · due ${r.dueDate}` : ''}</div></div>
            <MetaBadge meta={meta} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm"><div><div className="text-xs text-muted-foreground">Total</div>{money(r.totalAmount)}</div><div><div className="text-xs text-muted-foreground">Paid</div>{money(r.paidAmount)}</div><div><div className="text-xs text-muted-foreground">Outstanding</div><span className="font-medium">{money(r.outstandingAmount)}</span></div></div>
          {canCreate && r.status !== 'paid' && r.status !== 'cancelled' && payId !== r.id && <Button size="sm" variant="outline" className="mt-2" onClick={() => setPayId(r.id)}><Wallet className="h-4 w-4 mr-1" /> Record payment</Button>}
          {payId === r.id && <PaymentPanel onSubmit={(data) => pay(r.id, data)} onCancel={() => setPayId(null)} />}
        </CardContent></Card>); })}
    </FinListShell>
  );
}

function ExpensesPane({ session }) {
  const canCreate = can(session.user.role, 'finance:create'); const canUpdate = can(session.user.role, 'finance:update');
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [catF, setCatF] = useState('all'); const [statusF, setStatusF] = useState('all'); const [show, setShow] = useState(false); const [editId, setEditId] = useState(null);
  const blank = { category: 'other', amount: 0, description: '', supplierId: '', bookingId: '', expenseDate: '', paymentMethod: 'cash', status: 'pending', notes: '' };
  const [f, setF] = useState(blank);
  const load = async () => { setLoading(true); try { const d = await api('/finance/expenses'); setRows(d.expenses || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => { if (!(Number(f.amount) > 0)) { toast.error('Amount must be greater than zero'); return; } try { if (editId) await api(`/finance/expenses/${editId}`, { method: 'PUT', body: JSON.stringify(f) }); else await api('/finance/expenses', { method: 'POST', body: JSON.stringify(f) }); toast.success('Expense saved'); setShow(false); setEditId(null); setF(blank); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const setStatus = async (id, status) => { try { await api(`/finance/expenses/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const openEdit = (r) => { setEditId(r.id); setF({ category: r.category, amount: r.amount, description: r.description || '', supplierId: r.supplierId || '', bookingId: r.bookingId || '', expenseDate: r.expenseDate || '', paymentMethod: r.paymentMethod || 'cash', status: r.status, notes: r.notes || '' }); setShow(true); };
  const q = query.trim().toLowerCase();
  const rr = rows.filter((r) => (!q || [r.description, r.supplierName, r.bookingNumber].some((v) => String(v || '').toLowerCase().includes(q))) && (catF === 'all' || r.category === catF) && (statusF === 'all' || r.status === statusF));
  const filters = (<><Select value={catF} onValueChange={setCatF}><SelectTrigger className="sm:w-36"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{FIN_EXP_CATS.map((c) => <SelectItem key={c} value={c}>{titleCase(c)}</SelectItem>)}</SelectContent></Select>
    <Select value={statusF} onValueChange={setStatusF}><SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.keys(EXP_STATUS_META).map((s) => <SelectItem key={s} value={s}>{EXP_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></>);
  return (
    <FinListShell canCreate={canCreate} createLabel="Add expense" onCreate={() => { setEditId(null); setF(blank); setShow((v) => !v); }} query={query} setQuery={setQuery} searchPlaceholder="Search expenses" filters={filters}>
      {show && (<Card><CardContent className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="space-y-1"><Label>Category</Label><Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FIN_EXP_CATS.map((c) => <SelectItem key={c} value={c}>{titleCase(c)}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Amount</Label><Input type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: Math.max(0, Number(e.target.value) || 0) })} /></div>
        <div className="space-y-1"><Label>Date</Label><Input type="date" value={f.expenseDate} onChange={(e) => setF({ ...f, expenseDate: e.target.value })} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Description</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="space-y-1"><Label>Method</Label><Select value={f.paymentMethod} onValueChange={(v) => setF({ ...f, paymentMethod: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FIN_PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{FIN_PM_LABEL[m]}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Supplier</Label><FinSupplierPicker value={f.supplierId} onChange={(v) => setF({ ...f, supplierId: v })} /></div>
        <div className="space-y-1"><Label>Status</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(EXP_STATUS_META).map((s) => <SelectItem key={s} value={s}>{EXP_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select></div>
        <div className="sm:col-span-3 flex gap-2"><Button size="sm" onClick={save}>{editId ? 'Save changes' : 'Save expense'}</Button><Button size="sm" variant="outline" onClick={() => { setShow(false); setEditId(null); setF(blank); }}>Cancel</Button></div>
      </CardContent></Card>)}
      {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
      {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No expenses yet.</CardContent></Card>}
      {!loading && rr.length > 0 && (<Card className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>{rr.map((r) => (<TableRow key={r.id}><TableCell className="text-muted-foreground">{r.expenseDate}</TableCell><TableCell>{titleCase(r.category)}</TableCell><TableCell className="max-w-[200px] truncate">{r.description || '—'}</TableCell><TableCell className="text-muted-foreground">{r.supplierName || '—'}</TableCell><TableCell className="text-right font-medium">{money(r.amount)}</TableCell><TableCell>{canUpdate ? <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}><SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(EXP_STATUS_META).map((s) => <SelectItem key={s} value={s}>{EXP_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select> : <MetaBadge meta={EXP_STATUS_META[r.status] || EXP_STATUS_META.pending} />}</TableCell><TableCell>{canUpdate && <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>}</TableCell></TableRow>))}</TableBody></Table></Card>)}
    </FinListShell>
  );
}

function InvoicesPane({ session }) {
  const canCreate = can(session.user.role, 'finance:create'); const canUpdate = can(session.user.role, 'finance:update');
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [show, setShow] = useState(false); const [selectedInvoice, setSelectedInvoice] = useState(null);
  const blank = { clientId: '', bookingId: '', subtotal: 0, discount: 0, taxPercent: 0, taxInclusive: false, tax: 0, dueDate: '', status: 'draft', notes: '' };
  const [f, setF] = useState(blank);
  const load = async () => { setLoading(true); try { const d = await api('/finance/invoices'); setRows(d.invoices || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const taxable = Math.max(0, (Number(f.subtotal) || 0) - (Number(f.discount) || 0));
  const taxP = Math.min(Math.max(0, Number(f.taxPercent) || 0), 100);
  let calcTax = 0; let calcTotal = taxable;
  if (taxP > 0) {
    if (f.taxInclusive) { calcTax = Math.round((taxable - (taxable * 100) / (100 + taxP)) * 100) / 100; calcTotal = taxable; }
    else { calcTax = Math.round((taxable * taxP / 100) * 100) / 100; calcTotal = Math.round((taxable + calcTax) * 100) / 100; }
  } else {
    calcTax = Number(f.tax) || 0;
    calcTotal = Math.max(0, taxable + calcTax);
  }
  const save = async () => { try { const payload = { ...f, tax: calcTax, total: calcTotal }; await api('/finance/invoices', { method: 'POST', body: JSON.stringify(payload) }); toast.success('Invoice created'); setShow(false); setF(blank); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const setStatus = async (id, status) => { try { await api(`/finance/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const q = query.trim().toLowerCase();
  const rr = rows.filter((r) => !q || [r.invoiceNumber, r.clientName, r.bookingNumber].some((v) => String(v || '').toLowerCase().includes(q)));
  return (
    <FinListShell canCreate={canCreate} createLabel="Create invoice" onCreate={() => setShow((v) => !v)} query={query} setQuery={setQuery} searchPlaceholder="Search invoices">
      {show && (<Card><CardContent className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="space-y-1"><Label>Client</Label><FinClientPicker value={f.clientId} onChange={(v) => setF({ ...f, clientId: v })} /></div>
        <div className="space-y-1"><Label>Booking</Label><FinBookingPicker value={f.bookingId} onChange={(v) => setF({ ...f, bookingId: v })} /></div>
        <div className="space-y-1"><Label>Due date</Label><Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
        <div className="space-y-1"><Label>Subtotal</Label><Input type="number" min="0" value={f.subtotal} onChange={(e) => setF({ ...f, subtotal: Math.max(0, Number(e.target.value) || 0) })} /></div>
        <div className="space-y-1"><Label>Discount</Label><Input type="number" min="0" value={f.discount} onChange={(e) => setF({ ...f, discount: Math.max(0, Number(e.target.value) || 0) })} /></div>
        <div className="space-y-1"><Label>Tax %</Label><Input type="number" min="0" max="100" value={f.taxPercent} onChange={(e) => setF({ ...f, taxPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} placeholder="e.g. 18 for 18%" /></div>
        <div className="space-y-1 flex items-center gap-2 pt-6"><input type="checkbox" id="taxInc" checked={f.taxInclusive} onChange={(e) => setF({ ...f, taxInclusive: e.target.checked })} className="h-4 w-4" /><Label htmlFor="taxInc" className="cursor-pointer">Tax inclusive</Label></div>
        {taxP === 0 && <div className="space-y-1"><Label>Tax (flat)</Label><Input type="number" min="0" value={f.tax} onChange={(e) => setF({ ...f, tax: Math.max(0, Number(e.target.value) || 0) })} /></div>}
        <div className="space-y-1"><Label>Status</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="issued">Issued</SelectItem></SelectContent></Select></div>
        <div className="flex items-end text-sm"><span className="text-muted-foreground mr-2">Tax: {money(calcTax)}</span><span className="text-muted-foreground mr-2">Total:</span><span className="font-semibold">{money(calcTotal)}</span></div>
        <div className="sm:col-span-3"><Button size="sm" onClick={save}>Create invoice</Button></div>
      </CardContent></Card>)}
      {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
      {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No invoices yet.</CardContent></Card>}
      {!loading && rr.length > 0 && (<Card className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Client</TableHead><TableHead>Issued</TableHead><TableHead>Due</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{rr.map((r) => { const ov = finOverdue(r); const meta = ov ? INV_STATUS_META.overdue : (INV_STATUS_META[r.status] || INV_STATUS_META.draft); return (<TableRow key={r.id}><TableCell className="font-medium"><Button variant="link" className="h-auto p-0 font-medium" onClick={() => setSelectedInvoice(r)}>{r.invoiceNumber}</Button></TableCell><TableCell>{r.clientName || '—'}</TableCell><TableCell className="text-muted-foreground">{r.issueDate || '—'}</TableCell><TableCell className="text-muted-foreground">{r.dueDate || '—'}</TableCell><TableCell className="text-right font-medium">{money(r.total)}</TableCell><TableCell className="text-right text-muted-foreground">{money(r.paidAmount)}</TableCell><TableCell>{canUpdate ? <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}><SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(INV_STATUS_META).map((s) => <SelectItem key={s} value={s}>{INV_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select> : <MetaBadge meta={meta} />}</TableCell></TableRow>); })}</TableBody></Table></Card>)}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedInvoice ? selectedInvoice.invoiceNumber : 'Invoice details'}</DialogTitle></DialogHeader>
          {selectedInvoice && <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <KV k="Client" v={selectedInvoice.clientName || '—'} />
              <KV k="Booking" v={selectedInvoice.bookingNumber || '—'} />
              <KV k="Issue date" v={selectedInvoice.issueDate || '—'} />
              <KV k="Due date" v={selectedInvoice.dueDate || '—'} />
              <KV k="Status" v={(INV_STATUS_META[selectedInvoice.status] || INV_STATUS_META.draft).label} />
              <KV k="Subtotal" v={money(selectedInvoice.subtotal)} />
              <KV k="Discount" v={money(selectedInvoice.discount)} />
              <KV k="Tax" v={money(selectedInvoice.tax)} />
              <KV k="Total" v={money(selectedInvoice.total)} />
              <KV k="Paid" v={money(selectedInvoice.paidAmount)} />
              <KV k="Outstanding" v={money(Math.max(0, Number(selectedInvoice.total || 0) - Number(selectedInvoice.paidAmount || 0)))} />
            </div>
            {selectedInvoice.notes && <div><div className="text-xs text-muted-foreground">Notes</div><p className="whitespace-pre-wrap">{selectedInvoice.notes}</p></div>}
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </FinListShell>
  );
}

// ======================= PAYMENTS (Phase 5.2) =======================
const PAY_STATUS_META = {
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Failed', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  refunded: { label: 'Refunded', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  partially_refunded: { label: 'Partially Refunded', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};
function KV({ k, v }) { return (<div className="min-w-0"><div className="text-xs text-muted-foreground">{k}</div><div className="truncate">{v}</div></div>); }

function FinInvoicePicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/finance/invoices'); setOpts((d.invoices || []).filter((i) => i.status !== 'cancelled')); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}><SelectTrigger><SelectValue placeholder="No invoice" /></SelectTrigger><SelectContent><SelectItem value="none">No invoice</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.invoiceNumber} · {money(o.outstandingAmount)} due</SelectItem>)}</SelectContent></Select>);
}
function FinReceivablePicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/finance/receivables'); setOpts((d.receivables || []).filter((r) => r.status !== 'cancelled' && r.outstandingAmount > 0)); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}><SelectTrigger><SelectValue placeholder="No receivable" /></SelectTrigger><SelectContent><SelectItem value="none">No receivable</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{(o.clientName || 'Customer')} · {money(o.outstandingAmount)} due</SelectItem>)}</SelectContent></Select>);
}
function FinPayablePicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/finance/payables'); setOpts((d.payables || []).filter((r) => r.status !== 'cancelled' && r.outstandingAmount > 0)); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}><SelectTrigger><SelectValue placeholder="No payable" /></SelectTrigger><SelectContent><SelectItem value="none">No payable</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{(o.supplierName || 'Supplier')} · {money(o.outstandingAmount)} due</SelectItem>)}</SelectContent></Select>);
}

function PaymentForm({ f, setF, onSave, onCancel }) {
  const isCust = f.type === 'customer';
  return (<Card><CardContent className="grid gap-3 p-4 sm:grid-cols-3">
    <div className="space-y-1"><Label>Payment type</Label><Select value={f.type} onValueChange={(v) => setF({ ...f, type: v, clientId: '', supplierId: '', invoiceId: '', receivableId: '', payableId: '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Customer payment</SelectItem><SelectItem value="supplier">Supplier payment</SelectItem></SelectContent></Select></div>
    {isCust ? <div className="space-y-1"><Label>Client</Label><FinClientPicker value={f.clientId} onChange={(v) => setF({ ...f, clientId: v })} /></div> : <div className="space-y-1"><Label>Supplier</Label><FinSupplierPicker value={f.supplierId} onChange={(v) => setF({ ...f, supplierId: v })} /></div>}
    <div className="space-y-1"><Label>Booking</Label><FinBookingPicker value={f.bookingId} onChange={(v) => setF({ ...f, bookingId: v })} /></div>
    {isCust && <div className="space-y-1"><Label>Invoice</Label><FinInvoicePicker value={f.invoiceId} onChange={(v) => setF({ ...f, invoiceId: v })} /></div>}
    {isCust && <div className="space-y-1"><Label>Receivable</Label><FinReceivablePicker value={f.receivableId} onChange={(v) => setF({ ...f, receivableId: v })} /></div>}
    {!isCust && <div className="space-y-1"><Label>Payable</Label><FinPayablePicker value={f.payableId} onChange={(v) => setF({ ...f, payableId: v })} /></div>}
    <div className="space-y-1"><Label>Amount</Label><Input type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: Math.max(0, Number(e.target.value) || 0) })} /></div>
    <div className="space-y-1"><Label>Date</Label><Input type="date" value={f.paymentDate} onChange={(e) => setF({ ...f, paymentDate: e.target.value })} /></div>
    <div className="space-y-1"><Label>Method</Label><Select value={f.paymentMethod} onValueChange={(v) => setF({ ...f, paymentMethod: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FIN_PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{FIN_PM_LABEL[m]}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1"><Label>Status</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div>
    <div className="space-y-1 sm:col-span-2"><Label>Transaction reference</Label><Input value={f.transactionReference} onChange={(e) => setF({ ...f, transactionReference: e.target.value })} /></div>
    <div className="space-y-1 sm:col-span-3"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
    <div className="sm:col-span-3 flex gap-2"><Button size="sm" onClick={onSave}>Record payment</Button><Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button></div>
  </CardContent></Card>);
}

function PaymentReceipt({ id, onClose }) {
  const [r, setR] = useState(null);
  useEffect(() => { (async () => { try { const d = await api(`/payments/${id}/receipt`); setR(d.receipt); } catch (e) { toast.error(friendlyError(e)); } })(); }, [id]);
  if (!r) return <div className="h-32 rounded-lg border bg-muted/30 animate-pulse" />;
  const a = r.agency || {}; const p = r.payment || {};
  return (<div className="rounded-lg border p-4 space-y-2">
    <div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="font-bold truncate">{a.name || 'Agency'}</div><div className="text-xs text-muted-foreground truncate">{a.email || ''}{a.phone ? ` · ${a.phone}` : ''}</div></div><div className="text-right shrink-0"><div className="text-xs text-muted-foreground">Payment receipt</div><div className="font-semibold">{p.paymentNumber}</div></div></div>
    <Separator />
    <div className="grid grid-cols-2 gap-2 text-sm">
      <KV k={p.type === 'customer' ? 'Received from' : 'Paid to'} v={p.clientName || p.supplierName || '—'} />
      <KV k="Date" v={p.paymentDate || '—'} />
      <KV k="Booking" v={p.bookingNumber || '—'} />
      <KV k="Method" v={FIN_PM_LABEL[p.paymentMethod] || '—'} />
      <KV k="Reference" v={p.transactionReference || '—'} />
      <KV k="Status" v={(PAY_STATUS_META[p.status] || {}).label || titleCase(p.status)} />
    </div>
    {p.notes && <div className="rounded-md bg-muted/40 p-2 text-sm text-muted-foreground">{p.notes}</div>}
    <Separator />
    <div className="flex items-center justify-between"><span className="text-muted-foreground">Amount</span><span className="text-lg font-bold">{money(p.amount)} {p.currency || ''}</span></div>
    <div className="flex gap-2 pt-1"><Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button><Button size="sm" variant="outline" onClick={onClose}>Close</Button></div>
  </div>);
}

function PaymentDetailDialog({ id, session, onClose, onChanged }) {
  const role = session.user.role;
  const canRefund = can(role, 'payments:refund'); const canUpdate = can(role, 'payments:update');
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  const [showRefund, setShowRefund] = useState(false); const [rf, setRf] = useState({ amount: 0, refundDate: '', refundReference: '', notes: '' });
  const [showReceipt, setShowReceipt] = useState(false);
  const load = async () => { setLoading(true); try { const d = await api(`/payments/${id}`); setData(d); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [id]);
  const p = data && data.payment;
  const setStatus = async (status) => { try { await api(`/payments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); toast.success('Status updated'); load(); if (onChanged) onChanged(); } catch (e) { toast.error(friendlyError(e)); } };
  const doRefund = async () => { if (!(Number(rf.amount) > 0)) { toast.error('Refund amount must be greater than zero'); return; } try { await api(`/payments/${id}/refund`, { method: 'POST', body: JSON.stringify(rf) }); toast.success('Refund recorded'); setShowRefund(false); setRf({ amount: 0, refundDate: '', refundReference: '', notes: '' }); load(); if (onChanged) onChanged(); } catch (e) { toast.error(friendlyError(e)); } };
  return (<Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{p ? p.paymentNumber : 'Payment'}</DialogTitle></DialogHeader>
      {loading && <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />}
      {!loading && p && (<div className="space-y-3 text-sm">
        <div className="flex items-center justify-between"><MetaBadge meta={PAY_STATUS_META[p.status] || PAY_STATUS_META.pending} /><span className={`text-lg font-bold ${p.direction === 'incoming' ? 'text-emerald-700' : 'text-rose-700'}`}>{p.direction === 'incoming' ? '+' : '-'}{money(p.amount)}</span></div>
        <div className="grid grid-cols-2 gap-2">
          <KV k="Type" v={titleCase(p.type)} /><KV k="Direction" v={titleCase(p.direction)} />
          <KV k={p.type === 'customer' ? 'Customer' : 'Supplier'} v={p.clientName || p.supplierName || '—'} />
          <KV k="Booking" v={p.bookingNumber || '—'} />
          <KV k="Date" v={p.paymentDate || '—'} /><KV k="Method" v={FIN_PM_LABEL[p.paymentMethod] || '—'} />
          <KV k="Reference" v={p.transactionReference || '—'} />
          {p.refundedAmount > 0 && <KV k="Refunded" v={money(p.refundedAmount)} />}
        </div>
        {p.notes && <div className="rounded-md bg-muted/40 p-2 text-muted-foreground">{p.notes}</div>}
        {data.linked && (<div className="rounded-lg border p-3"><div className="mb-1 font-medium">{titleCase(data.linked.kind)}{data.linked.invoiceNumber ? ` · ${data.linked.invoiceNumber}` : ''}</div><div className="grid grid-cols-3 gap-2"><div><div className="text-xs text-muted-foreground">Original</div>{money(data.linked.totalAmount)}</div><div><div className="text-xs text-muted-foreground">Paid</div>{money(data.linked.paidAmount)}</div><div><div className="text-xs text-muted-foreground">Outstanding</div><span className="font-medium">{money(data.linked.outstandingAmount)}</span></div></div></div>)}
        {data.refunds && data.refunds.length > 0 && (<div className="rounded-lg border p-3"><div className="mb-1 font-medium">Refund history</div>{data.refunds.map((r) => (<div key={r.id} className="flex justify-between border-t py-1 first:border-t-0"><span className="text-muted-foreground">{r.refundDate} · {titleCase(r.status)}{r.refundReference ? ` · ${r.refundReference}` : ''}</span><span className="font-medium text-rose-700">-{money(r.amount)}</span></div>))}</div>)}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => setShowReceipt((v) => !v)}><Printer className="h-4 w-4 mr-1" /> Receipt</Button>
          {canUpdate && p.status === 'pending' && <Button size="sm" onClick={() => setStatus('completed')}>Mark completed</Button>}
          {canUpdate && (p.status === 'pending' || p.status === 'completed') && <Button size="sm" variant="outline" onClick={() => setStatus('cancelled')}>Cancel payment</Button>}
          {canRefund && p.type === 'customer' && (p.status === 'completed' || p.status === 'partially_refunded') && <Button size="sm" variant="outline" onClick={() => setShowRefund((v) => !v)}><Undo2 className="h-4 w-4 mr-1" /> Refund</Button>}
        </div>
        {showRefund && (<div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Refund amount</Label><Input type="number" min="0" value={rf.amount} onChange={(e) => setRf({ ...rf, amount: Math.max(0, Number(e.target.value) || 0) })} /></div>
            <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={rf.refundDate} onChange={(e) => setRf({ ...rf, refundDate: e.target.value })} /></div>
            <div className="space-y-1 col-span-2"><Label className="text-xs">Reference</Label><Input value={rf.refundReference} onChange={(e) => setRf({ ...rf, refundReference: e.target.value })} /></div>
            <div className="space-y-1 col-span-2"><Label className="text-xs">Notes</Label><Input value={rf.notes} onChange={(e) => setRf({ ...rf, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2"><Button size="sm" onClick={doRefund}>Record refund</Button><Button size="sm" variant="outline" onClick={() => setShowRefund(false)}>Cancel</Button></div>
        </div>)}
        {showReceipt && <PaymentReceipt id={id} onClose={() => setShowReceipt(false)} />}
      </div>)}
    </DialogContent>
  </Dialog>);
}

function PaymentsPane({ session }) {
  const role = session.user.role;
  const canCreate = can(role, 'payments:create');
  const [rows, setRows] = useState([]); const [dash, setDash] = useState(null); const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(''); const [typeF, setTypeF] = useState('all'); const [statusF, setStatusF] = useState('all'); const [methodF, setMethodF] = useState('all');
  const [show, setShow] = useState(false); const [detailId, setDetailId] = useState(null);
  const blank = { type: 'customer', clientId: '', supplierId: '', bookingId: '', invoiceId: '', receivableId: '', payableId: '', amount: 0, paymentMethod: 'cash', transactionReference: '', paymentDate: '', notes: '', status: 'completed' };
  const [f, setF] = useState(blank);
  const load = async () => { setLoading(true); try { const [d, dd] = await Promise.all([api('/payments'), api('/payments/dashboard')]); setRows(d.payments || []); setDash(dd.dashboard); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (f.type === 'customer' && !f.clientId && !f.invoiceId && !f.receivableId && !f.bookingId) { toast.error('Select a customer, invoice, receivable or booking'); return; }
    if (f.type === 'supplier' && !f.supplierId && !f.payableId) { toast.error('Select a supplier or payable'); return; }
    if (!(Number(f.amount) > 0)) { toast.error('Amount must be greater than zero'); return; }
    try { await api('/payments', { method: 'POST', body: JSON.stringify(f) }); toast.success('Payment recorded'); setShow(false); setF(blank); load(); } catch (e) { toast.error(friendlyError(e)); }
  };
  const q = query.trim().toLowerCase();
  const rr = rows.filter((r) => (!q || [r.paymentNumber, r.clientName, r.supplierName, r.bookingNumber, r.transactionReference].some((v) => String(v || '').toLowerCase().includes(q))) && (typeF === 'all' || r.type === typeF) && (statusF === 'all' || r.status === statusF) && (methodF === 'all' || r.paymentMethod === methodF));
  const filters = (<>
    <Select value={typeF} onValueChange={setTypeF}><SelectTrigger className="sm:w-32"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="customer">Customer</SelectItem><SelectItem value="supplier">Supplier</SelectItem></SelectContent></Select>
    <Select value={statusF} onValueChange={setStatusF}><SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.keys(PAY_STATUS_META).map((s) => <SelectItem key={s} value={s}>{PAY_STATUS_META[s].label}</SelectItem>)}</SelectContent></Select>
    <Select value={methodF} onValueChange={setMethodF}><SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All methods</SelectItem>{FIN_PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{FIN_PM_LABEL[m]}</SelectItem>)}</SelectContent></Select>
  </>);
  const x = dash || {};
  const cards = [
    { label: 'Total payments', value: x.totalPayments, icon: Banknote, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Customer payments', value: x.customerPayments, icon: TrendingUp, tint: 'bg-violet-50 text-violet-600' },
    { label: 'Supplier payments', value: x.supplierPayments, icon: Store, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Pending', value: x.pendingPayments, icon: Clock, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Refunded', value: x.refundedAmount, icon: Undo2, tint: 'bg-rose-50 text-rose-600' },
    { label: 'This month', value: x.monthPayments, icon: CalendarDays, tint: 'bg-teal-50 text-teal-600' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => { const Icon = c.icon; return (<Card key={c.label}><CardContent className="flex items-center gap-3 p-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.tint}`}><Icon className="h-5 w-5" /></div><div className="min-w-0"><div className="text-lg font-bold leading-none">{money(c.value || 0)}</div><div className="mt-1 text-xs text-muted-foreground truncate">{c.label}</div></div></CardContent></Card>); })}
      </div>
      <FinListShell canCreate={canCreate} createLabel="Record payment" onCreate={() => { setF(blank); setShow((v) => !v); }} query={query} setQuery={setQuery} searchPlaceholder="Search payments" filters={filters}>
        {show && <PaymentForm f={f} setF={setF} onSave={save} onCancel={() => { setShow(false); setF(blank); }} />}
        {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
        {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No payments yet. Record a customer or supplier payment to get started.</CardContent></Card>}
        {!loading && rr.length > 0 && (<Card className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Payment #</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Party</TableHead><TableHead>Booking</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{rr.map((r) => (<TableRow key={r.id} className="cursor-pointer" onClick={() => setDetailId(r.id)}><TableCell className="font-medium">{r.paymentNumber}</TableCell><TableCell className="text-muted-foreground">{r.paymentDate}</TableCell><TableCell><Badge variant="outline" className={`font-normal ${r.type === 'customer' ? 'text-violet-700' : 'text-sky-700'}`}>{titleCase(r.type)}</Badge></TableCell><TableCell>{r.clientName || r.supplierName || '—'}</TableCell><TableCell className="text-muted-foreground">{r.bookingNumber || '—'}</TableCell><TableCell className={`text-right font-medium ${r.direction === 'incoming' ? 'text-emerald-700' : 'text-rose-700'}`}>{r.direction === 'incoming' ? '+' : '-'}{money(r.amount)}</TableCell><TableCell className="text-muted-foreground">{FIN_PM_LABEL[r.paymentMethod] || '—'}</TableCell><TableCell><MetaBadge meta={PAY_STATUS_META[r.status] || PAY_STATUS_META.pending} /></TableCell><TableCell><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDetailId(r.id); }}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></Card>)}
      </FinListShell>
      {detailId && <PaymentDetailDialog id={detailId} session={session} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  );
}

function Finance({ session, tab, onNav }) {
  const current = tab || 'dashboard';
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'receivables', label: 'Receivables', icon: TrendingUp },
    { id: 'payables', label: 'Payables', icon: Store },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: Banknote },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold">Finance</h2><p className="text-sm text-muted-foreground">Transactions, receivables, payables, expenses and invoices for your agency.</p></div>
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
        {tabs.map((t) => { const Icon = t.icon; const a = current === t.id; return (<button key={t.id} onClick={() => onNav(t.id)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${a ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Icon className="h-4 w-4" /> {t.label}</button>); })}
      </div>
      {current === 'dashboard' && <FinanceDashboard />}
      {current === 'transactions' && <TransactionsPane session={session} />}
      {current === 'receivables' && <ReceivablesPane session={session} />}
      {current === 'payables' && <PayablesPane session={session} />}
      {current === 'expenses' && <ExpensesPane session={session} />}
      {current === 'invoices' && <InvoicesPane session={session} />}
      {current === 'payments' && <PaymentsPane session={session} />}
      {current === 'reports' && <FinReports />}
    </div>
  );
}

function Settings({ session }) {
  const { agency, user } = session;
  // Agency profile updates are owner-only in the API RBAC policy.
  const canManageAgency = user?.role === 'owner';
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const save = async () => {
    setSaving(true);
    try {
      const result = await api('/agency', { method: 'PUT', body: JSON.stringify(form) });
      const updated = result?.agency || form;
      setForm((current) => ({ ...current, ...updated }));
      toast.success('Agency profile updated');
      setEditing(false);
    } catch (error) {
      toast.error(error?.message || 'Could not update agency profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Workspace settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your travel business profile and regional preferences.</p>
          {!canManageAgency && <p className="text-xs text-muted-foreground mt-1">Only the agency owner can edit these settings.</p>}
        </div>
        {!editing && canManageAgency && <Button onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-2" /> Edit agency profile</Button>}
      </div>
      <Card>
        <CardContent className="p-5">
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Agency name</Label><Input value={form.name} onChange={update('name')} required /></div>
              <div className="space-y-1.5"><Label>Business email</Label><Input type="email" value={form.email} onChange={update('email')} /></div>
              <div className="space-y-1.5"><Label>Business phone</Label><Input value={form.phone} onChange={update('phone')} placeholder="+91 98765 43210" /></div>
              <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={update('website')} placeholder="https://" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Business address</Label><Input value={form.address} onChange={update('address')} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={update('city')} /></div>
              <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={update('country')} /></div>
              <div className="space-y-1.5"><Label>Currency</Label><Input value={form.currency} onChange={update('currency')} placeholder="INR" /></div>
              <div className="space-y-1.5"><Label>Timezone</Label><Input value={form.timezone} onChange={update('timezone')} placeholder="Asia/Kolkata" /></div>
              <div className="sm:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setForm({ name: agency?.name || '', email: agency?.email || user?.email || '', phone: agency?.phone || '', website: agency?.website || '', address: agency?.address || '', city: agency?.city || '', country: agency?.country || 'India', currency: agency?.currency || 'INR', timezone: agency?.timezone || 'Asia/Kolkata' }); setEditing(false); }} disabled={saving}>Cancel</Button>
                <Button onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save changes'}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Row label="Agency name" value={form.name || '—'} />
              <Row label="Business email" value={form.email || '—'} />
              <Row label="Business phone" value={form.phone || '—'} />
              <Row label="Website" value={form.website || '—'} icon={Globe} />
              <Row label="Business address" value={form.address || '—'} />
              <Row label="City" value={form.city || '—'} />
              <Row label="Country" value={form.country || '—'} />
              <Row label="Currency" value={form.currency || 'INR'} />
              <Row label="Timezone" value={form.timezone || 'Asia/Kolkata'} />
              <Separator />
              <Row label="Workspace slug" value={agency?.slug} icon={Globe} />
              <Row label="Plan" value={agency?.plan} />
              <Separator />
              <Row label="Your role" value={<RoleBadge role={user?.role} />} />
              <Row label="Agency ID (tenant key)" value={<code className="text-xs">{agency?.id}</code>} icon={Lock} />
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Lock className="h-3 w-3" /> Your agency ID, workspace slug, plan and role are read-only here. Changes apply only to this agency.
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
        ? (session.agency?.setupCompleted || session.user?.role !== 'owner' // only owners can submit agency setup (agency:manage)
            ? <Dashboard session={session} onLogout={logout} />
            : <AgencySetup session={session} onDone={loadMe} onLogout={logout} />)
        : <AuthView onAuthed={onAuthed} initialTab={initialTab} />}
      <Toaster richColors position="top-right" />
    </>
  );
}

// ======================= COMMUNICATIONS UI (Phase 5.3) =======================
const COMM_CH = [
  { id: 'whatsapp', label: 'WhatsApp' }, { id: 'email', label: 'Email' }, { id: 'phone', label: 'Phone' },
  { id: 'sms', label: 'SMS' }, { id: 'note', label: 'Internal Note' }, { id: 'other', label: 'Other' },
];
const COMM_CH_LABEL = Object.fromEntries(COMM_CH.map((c) => [c.id, c.label]));
const COMM_DIR = ['incoming', 'outgoing', 'internal'];
const COMM_ST_META = {
  draft: { label: 'Draft', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
  sent: { label: 'Sent', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  delivered: { label: 'Delivered', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  read: { label: 'Read', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Failed', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  archived: { label: 'Archived', cls: 'bg-muted text-muted-foreground border-border' },
};
function waLink(phone, text) { const d = String(phone || '').replace(/[^0-9]/g, ''); return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`; }

function CommLeadPicker({ value, onChange }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => { (async () => { try { const d = await api('/leads'); setOpts(d.leads || []); } catch { /* */ } })(); }, []);
  return (<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}><SelectTrigger><SelectValue placeholder="No lead" /></SelectTrigger><SelectContent><SelectItem value="none">No lead</SelectItem>{opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>);
}

function CommForm({ onSaved, onCancel }) {
  const blank = { channel: 'whatsapp', direction: 'outgoing', type: 'message', clientId: '', leadId: '', supplierId: '', bookingId: '', subject: '', message: '', phone: '', status: '' };
  const [f, setF] = useState(blank); const [saving, setSaving] = useState(false);
  const save = async () => { if (!f.message.trim() && !f.subject.trim()) { toast.error('Enter a message'); return; } setSaving(true); try { const d = await api('/communications', { method: 'POST', body: JSON.stringify(f) }); toast.success('Communication logged'); if (onSaved) onSaved(d.communication); } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); } };
  const openWa = () => { if (!f.phone.trim()) { toast.error('Enter a phone number for WhatsApp'); return; } window.open(waLink(f.phone, f.message), '_blank'); };
  return (<Card><CardContent className="grid gap-3 p-4 sm:grid-cols-3">
    <div className="space-y-1"><Label>Channel</Label><Select value={f.channel} onValueChange={(v) => setF({ ...f, channel: v, direction: v === 'note' ? 'internal' : f.direction })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMM_CH.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1"><Label>Direction</Label><Select value={f.direction} onValueChange={(v) => setF({ ...f, direction: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMM_DIR.map((d) => <SelectItem key={d} value={d}>{titleCase(d)}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1"><Label>Status</Label><Select value={f.status || 'auto'} onValueChange={(v) => setF({ ...f, status: v === 'auto' ? '' : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Auto</SelectItem>{Object.keys(COMM_ST_META).map((s) => <SelectItem key={s} value={s}>{COMM_ST_META[s].label}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1"><Label>Client</Label><FinClientPicker value={f.clientId} onChange={(v) => setF({ ...f, clientId: v })} /></div>
    <div className="space-y-1"><Label>Lead</Label><CommLeadPicker value={f.leadId} onChange={(v) => setF({ ...f, leadId: v })} /></div>
    <div className="space-y-1"><Label>Supplier</Label><FinSupplierPicker value={f.supplierId} onChange={(v) => setF({ ...f, supplierId: v })} /></div>
    <div className="space-y-1"><Label>Booking</Label><FinBookingPicker value={f.bookingId} onChange={(v) => setF({ ...f, bookingId: v })} /></div>
    <div className="space-y-1"><Label>Phone (for WhatsApp)</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91..." /></div>
    {f.channel === 'email' && <div className="space-y-1 sm:col-span-2"><Label>Subject</Label><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></div>}
    <div className="space-y-1 sm:col-span-3"><Label>Message</Label><Textarea rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
    <div className="sm:col-span-3 flex flex-wrap gap-2"><Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Log communication'}</Button>{f.channel === 'whatsapp' && <Button size="sm" variant="outline" onClick={openWa}><Phone className="h-4 w-4 mr-1" /> Open WhatsApp</Button>}<Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button></div>
  </CardContent></Card>);
}

function CommRow({ r }) {
  const contact = r.clientName || r.leadName || r.supplierName || (r.bookingNumber ? `Booking ${r.bookingNumber}` : 'General');
  return (<Card><CardContent className="flex items-start gap-3 p-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"><MessageSquare className="h-4 w-4 text-muted-foreground" /></div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2"><span className="font-medium truncate">{contact}</span><Badge variant="outline" className="font-normal">{COMM_CH_LABEL[r.channel] || r.channel}</Badge><Badge variant="outline" className="font-normal text-muted-foreground">{titleCase(r.direction)}</Badge><MetaBadge meta={COMM_ST_META[r.status] || COMM_ST_META.sent} /></div>
      {r.subject && <div className="mt-0.5 text-sm font-medium">{r.subject}</div>}
      {r.message && <div className="mt-0.5 text-sm text-muted-foreground whitespace-pre-wrap">{r.message}</div>}
      <div className="mt-1 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
    </div>
  </CardContent></Card>);
}

function CommInbox({ activity, canCreate }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [q, setQ] = useState(''); const [chan, setChan] = useState('all'); const [show, setShow] = useState(false);
  const load = async () => { setLoading(true); try { const d = await api('/communications'); setRows(d.communications || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const ql = q.trim().toLowerCase();
  const rr = rows.filter((r) => (!ql || [r.subject, r.message, r.clientName, r.leadName, r.supplierName, r.bookingNumber].some((v) => String(v || '').toLowerCase().includes(ql))) && (chan === 'all' || r.channel === chan));
  return (<div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search communications" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Select value={chan} onValueChange={setChan}><SelectTrigger className="w-40"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue /></div></SelectTrigger><SelectContent><SelectItem value="all">All channels</SelectItem>{COMM_CH.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select>
      {canCreate && !activity && <Button size="sm" onClick={() => setShow((v) => !v)}><Plus className="h-4 w-4 mr-1" /> Log</Button>}
    </div>
    {show && <CommForm onSaved={() => { setShow(false); load(); }} onCancel={() => setShow(false)} />}
    {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
    {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No communications yet.{canCreate && !activity ? ' Log your first message above.' : ''}</CardContent></Card>}
    {!loading && rr.length > 0 && <div className="space-y-2">{rr.map((r) => <CommRow key={r.id} r={r} />)}</div>}
  </div>);
}

function CommConversations() {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [sel, setSel] = useState(null);
  const load = async () => { setLoading(true); try { const d = await api('/communications'); setRows(d.communications || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const groups = {};
  rows.forEach((r) => { const key = r.clientId ? `client:${r.clientId}` : r.leadId ? `lead:${r.leadId}` : r.supplierId ? `supplier:${r.supplierId}` : r.bookingId ? `booking:${r.bookingId}` : 'general'; const name = r.clientName || r.leadName || r.supplierName || (r.bookingNumber ? `Booking ${r.bookingNumber}` : 'General'); if (!groups[key]) groups[key] = { key, name, items: [] }; groups[key].items.push(r); });
  const list = Object.values(groups).sort((a, b) => String((b.items[0] || {}).createdAt).localeCompare(String((a.items[0] || {}).createdAt)));
  if (loading) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  if (rows.length === 0) return <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No conversations yet.</CardContent></Card>;
  const current = list.find((g) => g.key === sel) || list[0];
  return (<div className="grid gap-3 md:grid-cols-[260px_1fr]">
    <Card className="overflow-hidden"><div className="max-h-[70vh] overflow-auto divide-y">{list.map((g) => { const on = current && g.key === current.key; return (<button key={g.key} onClick={() => setSel(g.key)} className={`block w-full text-left px-3 py-2.5 ${on ? 'bg-accent' : ''}`}><div className="font-medium truncate">{g.name}</div><div className="text-xs text-muted-foreground truncate">{g.items.length} message{g.items.length > 1 ? 's' : ''} · {COMM_CH_LABEL[g.items[0].channel] || g.items[0].channel}</div></button>); })}</div></Card>
    <Card><CardContent className="p-4 space-y-3 max-h-[70vh] overflow-auto">{current && current.items.slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))).map((m) => (<div key={m.id} className={`flex ${m.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.direction === 'incoming' ? 'bg-muted' : m.direction === 'internal' ? 'bg-amber-50 border border-amber-200' : 'bg-primary text-primary-foreground'}`}>{m.subject && <div className="font-medium">{m.subject}</div>}<div className="whitespace-pre-wrap">{m.message}</div><div className={`mt-1 text-[10px] ${m.direction === 'outgoing' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{COMM_CH_LABEL[m.channel]} · {new Date(m.createdAt).toLocaleString()}</div></div></div>))}</CardContent></Card>
  </div>);
}

function CommTemplates({ role }) {
  const canCreate = can(role, 'communications:create'); const canUpdate = can(role, 'communications:update');
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [edit, setEdit] = useState(null); const [show, setShow] = useState(false);
  const blank = { name: '', channel: 'whatsapp', subject: '', body: '', variablesText: '' };
  const [f, setF] = useState(blank);
  const load = async () => { setLoading(true); try { const d = await api('/communications/templates'); setRows(d.templates || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => { if (!f.name.trim()) { toast.error('Template name is required'); return; } const payload = { name: f.name, channel: f.channel, subject: f.subject, body: f.body, variables: f.variablesText.split(',').map((s) => s.trim()).filter(Boolean) }; try { if (edit) await api(`/communications/templates/${edit}`, { method: 'PUT', body: JSON.stringify(payload) }); else await api('/communications/templates', { method: 'POST', body: JSON.stringify(payload) }); toast.success('Template saved'); setShow(false); setEdit(null); setF(blank); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const startEdit = (t) => { setEdit(t.id); setF({ name: t.name, channel: t.channel, subject: t.subject || '', body: t.body || '', variablesText: (t.variables || []).join(', ') }); setShow(true); };
  return (<div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm text-muted-foreground">Reusable drafts with variables like {'{{clientName}}'}, {'{{bookingNumber}}'}.</div>{canCreate && <Button size="sm" onClick={() => { setEdit(null); setF(blank); setShow((v) => !v); }}><Plus className="h-4 w-4 mr-1" /> New template</Button>}</div>
    {show && <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2">
      <div className="space-y-1"><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="space-y-1"><Label>Channel</Label><Select value={f.channel} onValueChange={(v) => setF({ ...f, channel: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMM_CH.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1 sm:col-span-2"><Label>Subject (optional)</Label><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></div>
      <div className="space-y-1 sm:col-span-2"><Label>Body</Label><Textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
      <div className="space-y-1 sm:col-span-2"><Label>Variables (comma separated)</Label><Input value={f.variablesText} onChange={(e) => setF({ ...f, variablesText: e.target.value })} placeholder="clientName, bookingNumber, destination" /></div>
      <div className="sm:col-span-2 flex gap-2"><Button size="sm" onClick={save}>Save template</Button><Button size="sm" variant="ghost" onClick={() => { setShow(false); setEdit(null); setF(blank); }}>Cancel</Button></div>
    </CardContent></Card>}
    {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
    {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No templates yet.</CardContent></Card>}
    {!loading && rows.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{rows.map((t) => (<Card key={t.id}><CardContent className="p-4 space-y-1"><div className="flex items-center justify-between"><span className="font-medium">{t.name}</span><Badge variant="outline" className="font-normal">{COMM_CH_LABEL[t.channel] || t.channel}</Badge></div>{t.subject && <div className="text-sm font-medium">{t.subject}</div>}<div className="text-sm text-muted-foreground whitespace-pre-wrap">{t.body}</div>{(t.variables || []).length > 0 && <div className="flex flex-wrap gap-1 pt-1">{t.variables.map((v) => <Badge key={v} variant="secondary" className="font-normal">{`{{${v}}}`}</Badge>)}</div>}{canUpdate && <div className="pt-2"><Button size="sm" variant="outline" onClick={() => startEdit(t)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button></div>}</CardContent></Card>))}</div>}
  </div>);
}

function Communications({ session, tab, onNav }) {
  const role = session.user.role;
  const canCreate = can(role, 'communications:create');
  const TABS = [
    { id: 'inbox', label: 'Inbox', icon: MessageSquare },
    { id: 'conversations', label: 'Conversations', icon: Contact },
    { id: 'support', label: 'Support Tickets', icon: Ticket },
    { id: 'integrations', label: 'Channel Integrations', icon: Plug },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];
  const current = TABS.some((t) => t.id === tab) ? tab : 'inbox';
  return (<div className="space-y-4">
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
      {TABS.map((t) => { const Icon = t.icon; const on = current === t.id; return (<button key={t.id} onClick={() => onNav(t.id)} className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${on ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}><Icon className="h-4 w-4" />{t.label}</button>); })}
    </div>
    {(current === 'inbox' || current === 'activity') && <CommInbox activity={current === 'activity'} canCreate={canCreate} />}
    {current === 'conversations' && <CommConversations />}
    {current === 'templates' && <CommTemplates role={role} />}
    {current === 'support' && <SupportTickets session={session} />}
    {current === 'integrations' && <ChannelIntegrations session={session} />}
  </div>);
}

function SupportTickets({ session }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false); const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'normal', status: 'open', clientId: '' });
  const canCreate = can(session.user.role, 'communications:create');
  const load = async () => { setLoading(true); try { const d = await api('/communications/tickets'); setRows(d.tickets || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!form.subject.trim()) { toast.error('Ticket subject is required'); return; }
    setSaving(true);
    try { await api('/communications/tickets', { method: 'POST', body: JSON.stringify(form) }); toast.success('Support ticket created'); setForm({ subject: '', description: '', priority: 'normal', status: 'open', clientId: '' }); setShow(false); load(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); }
  };
  const update = async (id, status) => { try { await api(`/communications/tickets/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const counts = { open: rows.filter((r) => r.status === 'open').length, pending: rows.filter((r) => r.status === 'pending').length, resolved: rows.filter((r) => r.status === 'resolved').length };
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">{[['Open', counts.open], ['Pending', counts.pending], ['Resolved', counts.resolved]].map(([label, n]) => <Card key={label}><CardContent className="p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="text-2xl font-semibold">{n}</div></CardContent></Card>)}</div>
    <div className="flex justify-end">{canCreate && <Button onClick={() => setShow((v) => !v)}><Plus className="h-4 w-4 mr-1" /> New ticket</Button>}</div>
    {show && <Card><CardContent className="grid gap-3 p-4">
      <div className="space-y-1"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Customer needs to change booking dates" /></div>
      <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="space-y-1"><Label>Priority</Label><Select value={form.priority} onValueChange={(priority) => setForm({ ...form, priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
      <div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create ticket'}</Button><Button variant="outline" onClick={() => setShow(false)}>Cancel</Button></div>
    </CardContent></Card>}
    {loading ? <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" /> : rows.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No support tickets yet. Create a ticket to track a customer issue.</CardContent></Card> : <div className="space-y-2">{rows.map((r) => <Card key={r.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="font-medium">{r.subject}</div><div className="text-sm text-muted-foreground whitespace-pre-wrap">{r.description || 'No description provided'}</div><div className="mt-1 flex flex-wrap gap-2 text-xs"><Badge variant="outline">{r.priority} priority</Badge><Badge variant="outline">{r.status}</Badge><span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span></div></div><Select value={r.status} onValueChange={(v) => update(r.id, v)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></CardContent></Card>)}</div>}
  </div>;
}

function ChannelIntegrations({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({});
  const definitions = [
    { id: 'website_chat', name: 'Website live chat', detail: 'Register the website where your agency wants the SafarOS chat widget.', fields: [{ key: 'websiteUrl', label: 'Agency website URL', placeholder: 'https://travel.example.com' }] },
    { id: 'whatsapp', name: 'WhatsApp Business', detail: 'Add the number and WhatsApp Business Account ID. Provider authorization is a separate step.', fields: [{ key: 'phoneNumber', label: 'Business phone number', placeholder: '+919876543210' }, { key: 'businessAccountId', label: 'WhatsApp Business Account ID', placeholder: 'Meta WhatsApp Business Account ID' }] },
    { id: 'email', name: 'Email support', detail: 'Register your agency support address. Mailbox authorization and inbound sync are separate steps.', fields: [{ key: 'supportEmail', label: 'Support email address', placeholder: 'support@youragency.com' }] },
  ];
  const load = async () => { setLoading(true); try { const d = await api('/communications/integrations'); setItems(d.integrations || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const begin = (d) => { const saved = items.find((x) => x.id === d.id); setConfig(saved?.config || {}); setEditing(d); };
  const save = async () => {
    setSaving(true);
    try {
      const d = await api('/communications/integrations/' + editing.id, { method: 'PUT', body: JSON.stringify({ config }) });
      setItems((old) => old.map((x) => x.id === editing.id ? d.integration : x).concat(old.some((x) => x.id === editing.id) ? [] : [d.integration]));
      toast.success('Channel details saved. Provider verification is still required.');
      setEditing(null);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); }
  };
  return <div className="space-y-3">
    <div><h3 className="font-semibold">Agency-owned support channels</h3><p className="text-sm text-muted-foreground">Each agency registers its own website, WhatsApp Business number and support mailbox. Details are tenant-scoped. Saving does not turn on live traffic until provider authorization and webhook verification are implemented.</p></div>
    {loading ? <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" /> : definitions.map((d) => { const item = items.find((x) => x.id === d.id); const status = item?.status || 'not_connected'; return <Card key={d.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Plug className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="font-medium">{d.name}</div><p className="text-sm text-muted-foreground">{d.detail}</p><div className="mt-2"><Badge variant="outline">{status === 'connected' ? 'Connected' : status === 'pending' ? 'Setup pending' : 'Not connected'}</Badge></div></div><Button variant="outline" onClick={() => begin(d)}>{item?.config ? 'Edit details' : 'Configure'}</Button></CardContent></Card>; })}
    {editing && <Card><CardContent className="space-y-4 p-4"><div><h4 className="font-semibold">Configure {editing.name}</h4><p className="text-sm text-muted-foreground">These are connection details only; never enter access tokens or passwords here.</p></div>{editing.fields.map((field) => <div key={field.key} className="space-y-1"><Label>{field.label}</Label><Input value={config[field.key] || ''} placeholder={field.placeholder} onChange={(e) => setConfig((v) => ({ ...v, [field.key]: e.target.value }))} /></div>)}<div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save details'}</Button><Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button></div></CardContent></Card>}
    <p className="text-xs text-muted-foreground">Next stages: secure provider authorization, signed webhook verification, message ingestion/replies, and end-to-end tests. No channel is marked connected by saving these fields.</p>
  </div>;
}

// ======================= AI COPILOT UI (Phase 5.4) =======================
const COPILOT_SUGGESTIONS = [
  "Give me today's business priorities",
  'Which follow-ups are due?',
  'What bookings are coming up?',
  'Show outstanding customer payments',
  'Summarize recent activity',
  'Draft a friendly payment reminder',
];

function CopilotChat({ session }) {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [conv, setConv] = useState(null);
  useEffect(() => { (async () => { try { const s = await api('/ai/status'); setStatus(s); } catch { setStatus({ configured: false }); } })(); }, []);
  const send = async (text) => { const msg = (text || input).trim(); if (!msg || busy) return; setInput(''); setMessages((m) => [...m, { role: 'user', text: msg }]); setBusy(true); try { const d = await api('/ai/chat', { method: 'POST', body: JSON.stringify({ conversationId: conv, message: msg }) }); setConv(d.conversationId); setMessages((m) => [...m, { role: 'assistant', text: d.reply }]); } catch (e) { setMessages((m) => [...m, { role: 'assistant', text: friendlyError(e), error: true }]); } finally { setBusy(false); } };
  return (<div className="flex flex-col h-full min-h-0">
    {status && !status.configured && <div className="m-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">AI Copilot is not configured. Set <code>ANTHROPIC_API_KEY</code> on the server to enable it — the rest of SafarOS keeps working normally.</div>}
    <div className="flex-1 min-h-0 overflow-auto space-y-3 p-3">
      {messages.length === 0 && (<div className="space-y-3"><div className="flex items-start gap-2 text-sm text-muted-foreground"><Bot className="mt-0.5 h-4 w-4 shrink-0" /> <span>Ask about your agency data or get drafting help. I only use your agency&apos;s data and never perform actions without your confirmation.</span></div><div className="flex flex-wrap gap-2">{COPILOT_SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border px-3 py-1 text-xs hover:bg-accent">{s}</button>)}</div></div>)}
      {messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : m.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-muted'}`}>{m.text}</div></div>))}
      {busy && <div className="flex justify-start"><div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Thinking…</div></div>}
    </div>
    <div className="border-t p-2 flex gap-2">
      <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask the Copilot…" disabled={busy} />
      <Button size="icon" onClick={() => send()} disabled={busy || !input.trim()}><Send className="h-4 w-4" /></Button>
    </div>
  </div>);
}

function CopilotWorkspace({ session }) {
  return (<Card className="h-[calc(100vh-10rem)] overflow-hidden flex flex-col"><CardHeader className="border-b py-3"><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-5 w-5 text-violet-600" /> AI Copilot</CardTitle><CardDescription>Business summaries, CRM assistance and drafting — grounded only in your agency data.</CardDescription></CardHeader><CardContent className="p-0 flex-1 min-h-0"><CopilotChat session={session} /></CardContent></Card>);
}

function CopilotFab({ session }) {
  const [open, setOpen] = useState(false);
  const role = session && session.user && session.user.role;
  if (role && !can(role, 'ai:use')) return null;
  return (<>
    <button onClick={() => setOpen((o) => !o)} className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition" aria-label="Open Copilot">{open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}</button>
    {open && <div className="fixed bottom-24 right-5 z-40 flex h-[70vh] w-[92vw] max-w-sm flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"><div className="flex items-center justify-between border-b px-3 py-2"><span className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-violet-600" /> Copilot</span><button onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button></div><div className="flex-1 min-h-0"><CopilotChat session={session} /></div></div>}
  </>);
}

// ======================= CUSTOMER PORTAL ADMIN (Phase 5.5, staff side) =======================
function PortalAccessDialog({ client, onClose }) {
  const [info, setInfo] = useState(null); const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(client.email || ''); const [password, setPassword] = useState(''); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const d = await api(`/portal-access?clientId=${encodeURIComponent(client.id)}`); setInfo(d.portalAccess); if (d.portalAccess && d.portalAccess.email) setEmail(d.portalAccess.email); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [client.id]);
  const save = async () => { if (!email.trim()) { toast.error('Email is required'); return; } if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; } setSaving(true); try { await api('/portal-access', { method: 'POST', body: JSON.stringify({ clientId: client.id, email, password }) }); toast.success(info ? 'Portal access updated' : 'Portal access created'); setPassword(''); load(); } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); } };
  const toggle = async () => { try { await api(`/portal-access/${info.id}/status`, { method: 'PUT', body: JSON.stringify({ status: info.status === 'active' ? 'disabled' : 'active' }) }); toast.success('Status updated'); load(); } catch (e) { toast.error(friendlyError(e)); } };
  return (<Dialog open onOpenChange={(o) => { if (!o) onClose(); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Portal access · {client.name}</DialogTitle></DialogHeader>
    {loading ? <div className="h-32 rounded-lg border bg-muted/30 animate-pulse" /> : (<div className="space-y-3 text-sm">
      {info ? <div className="flex flex-wrap items-center gap-2"><MetaBadge meta={info.status === 'active' ? { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' } : { label: 'Disabled', cls: 'bg-rose-50 text-rose-700 border-rose-200' }} />{info.lastLoginAt ? <span className="text-xs text-muted-foreground">Last login {new Date(info.lastLoginAt).toLocaleString()}</span> : <span className="text-xs text-muted-foreground">Never logged in</span>}</div> : <div className="text-muted-foreground">No portal access yet. Create a login below.</div>}
      <div className="space-y-1"><Label>Login email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-1"><Label>{info ? 'Reset password' : 'Password'}</Label><Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
      <div className="flex flex-wrap gap-2 pt-1"><Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : (info ? 'Update access' : 'Create access')}</Button>{info && <Button size="sm" variant="outline" onClick={toggle}>{info.status === 'active' ? 'Disable' : 'Enable'}</Button>}<Button size="sm" variant="ghost" onClick={onClose}>Close</Button></div>
      <div className="text-xs text-muted-foreground">Customers sign in at <code>/portal</code> with this email and password.</div>
    </div>)}
  </DialogContent></Dialog>);
}

function PortalAdmin({ session }) {
  const role = session.user.role; const canManage = can(role, 'portal:manage');
  const [clients, setClients] = useState([]); const [loading, setLoading] = useState(true); const [q, setQ] = useState(''); const [sel, setSel] = useState(null);
  const load = async () => { setLoading(true); try { const d = await api('/clients'); setClients(d.clients || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const ql = q.trim().toLowerCase();
  const rr = clients.filter((c) => !ql || [c.name, c.email, c.phone].some((v) => String(v || '').toLowerCase().includes(ql)));
  return (<div className="space-y-4">
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-2 p-4"><div className="text-sm"><div className="font-medium">Customer Portal</div><div className="text-muted-foreground">Grant existing clients secure access to their trips, invoices and payments.</div></div><a href="/portal" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline"><ExternalLink className="h-4 w-4" /> Open portal</a></CardContent></Card>
    <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
    {!loading && clients.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No clients yet. Add clients in CRM to grant portal access.</CardContent></Card>}
    {!loading && rr.length > 0 && <Card className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>{rr.map((c) => (<TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell className="text-muted-foreground">{c.email || '—'}</TableCell><TableCell className="text-muted-foreground">{c.phone || '—'}</TableCell><TableCell className="text-right">{canManage && <Button size="sm" variant="outline" onClick={() => setSel(c)}><UserCog className="h-4 w-4 mr-1" /> Portal access</Button>}</TableCell></TableRow>))}</TableBody></Table></Card>}
    {sel && <PortalAccessDialog client={sel} onClose={() => setSel(null)} />}
  </div>);
}

// ======================= WEBSITE BUILDER + SEO UI (5.6/5.7) =======================
function WebsiteDashboard({ data, siteUrl, canManage, onChanged }) {
  const s = data.settings; const published = s.status === 'published';
  const toggle = async () => { try { await api('/website/settings', { method: 'PUT', body: JSON.stringify({ status: published ? 'draft' : 'published' }) }); toast.success(published ? 'Website unpublished' : 'Website published'); onChanged(); } catch (e) { toast.error(friendlyError(e)); } };
  return (<div className="grid gap-4 md:grid-cols-2">
    <Card><CardContent className="space-y-3 p-5"><div className="flex items-center justify-between"><span className="font-semibold">Status</span><MetaBadge meta={published ? { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' } : { label: 'Draft', cls: 'bg-amber-50 text-amber-700 border-amber-200' }} /></div><div className="text-sm text-muted-foreground">{published ? 'Your website is publicly visible.' : 'Your website is private until you publish it.'}</div>{canManage && <Button size="sm" onClick={toggle}>{published ? 'Unpublish' : 'Publish website'}</Button>}</CardContent></Card>
    <Card><CardContent className="space-y-2 p-5"><span className="font-semibold">Public address</span><div className="break-all text-sm text-violet-600">{siteUrl}</div><a href={siteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline"><ExternalLink className="h-4 w-4" /> Open website</a></CardContent></Card>
  </div>);
}

function WebsiteSettings({ data, canManage, onSaved }) {
  const s = data.settings;
  const [f, setF] = useState({ siteTitle: s.siteTitle || '', tagline: s.tagline || '', logo: s.logo || '', favicon: s.favicon || '', contactEmail: s.contactEmail || '', phone: s.phone || '', address: s.address || '', social: { facebook: '', instagram: '', twitter: '', youtube: '', linkedin: '', website: '', ...(s.social || {}) } });
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); try { await api('/website/settings', { method: 'PUT', body: JSON.stringify(f) }); toast.success('Settings saved'); onSaved(); } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); } };
  const field = (k, label) => (<div className="space-y-1"><Label>{label}</Label><Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} disabled={!canManage} /></div>);
  const soc = (k, label) => (<div className="space-y-1"><Label>{label}</Label><Input value={f.social[k]} onChange={(e) => setF({ ...f, social: { ...f.social, [k]: e.target.value } })} disabled={!canManage} /></div>);
  return (<Card><CardContent className="grid gap-3 p-5 sm:grid-cols-2">
    {field('siteTitle', 'Website title')}{field('tagline', 'Tagline')}
    {field('contactEmail', 'Contact email')}{field('phone', 'Phone')}
    <div className="space-y-1 sm:col-span-2"><Label>Address</Label><Textarea rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} disabled={!canManage} /></div>
    {field('logo', 'Logo URL')}{field('favicon', 'Favicon URL')}
    {soc('facebook', 'Facebook')}{soc('instagram', 'Instagram')}{soc('twitter', 'Twitter / X')}{soc('youtube', 'YouTube')}{soc('linkedin', 'LinkedIn')}{soc('website', 'Website')}
    {canManage && <div className="sm:col-span-2"><Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button></div>}
  </CardContent></Card>);
}

function WebsiteAppearance({ data, canManage, onSaved }) {
  const s = data.settings || {};
  const fallbackThemes = [
    { themeKey: 'atlas-journeys', name: 'Atlas Journeys', category: 'General', description: 'A versatile modern website for any travel agency.', primaryColor: '#2563eb', secondaryColor: '#0ea5e9', font: 'Inter' },
    { themeKey: 'luxe-voyage', name: 'Luxe Voyage', category: 'Luxury', description: 'Premium holidays, honeymoon trips and luxury escapes.', primaryColor: '#9a7848', secondaryColor: '#efe4d0', font: 'Montserrat' },
    { themeKey: 'wildtrail', name: 'Wildtrail', category: 'Adventure', description: 'Trekking, outdoor adventures and expedition tours.', primaryColor: '#315c43', secondaryColor: '#d5a84f', font: 'Lato' },
    { themeKey: 'coastline', name: 'Coastline', category: 'Beach', description: 'Beach holidays, island escapes and coastal resorts.', primaryColor: '#0f766e', secondaryColor: '#2dd4bf', font: 'Poppins' },
    { themeKey: 'roots-routes', name: 'Roots & Routes', category: 'Culture', description: 'Cultural journeys, heritage walks and local experiences.', primaryColor: '#92400e', secondaryColor: '#d97706', font: 'Lato' },
    { themeKey: 'happy-trails', name: 'Happy Trails', category: 'Family', description: 'Friendly family breaks and group holiday packages.', primaryColor: '#15803d', secondaryColor: '#f59e0b', font: 'Poppins' },
    { themeKey: 'meridian', name: 'Meridian', category: 'Business', description: 'Professional corporate travel and managed business trips.', primaryColor: '#334155', secondaryColor: '#64748b', font: 'Inter' },
  ];
  const themes = (data.themes || []).length ? data.themes : fallbackThemes;
  const [f, setF] = useState({ primaryColor: s.primaryColor || '#2563eb', secondaryColor: s.secondaryColor || '#0ea5e9', font: s.font || 'Inter', theme: themes.some(t => (t.themeKey || t.id) === s.theme) ? s.theme : 'atlas-journeys', logo: s.logo || '' });
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState('');
  const choose = (theme) => setF({ ...f, theme: theme.themeKey || theme.id, primaryColor: theme.primaryColor || f.primaryColor, secondaryColor: theme.secondaryColor || f.secondaryColor, font: theme.font || f.font });
  const save = async () => { setSaving(true); try { await api('/website/settings', { method: 'PUT', body: JSON.stringify(f) }); toast.success('Appearance saved'); onSaved(); } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); } };
  const apply = async (theme) => {
    const key = theme.themeKey || theme.id;
    const hasExistingPages = Boolean(data.pages && data.pages.length);
    const replaceExisting = hasExistingPages ? window.confirm('This agency already has website pages. Replace them with the selected template starter pages? This cannot be undone.') : false;
    if (hasExistingPages && !replaceExisting) return;
    setApplying(key);
    try {
      try {
        await api('/website/templates/apply', { method: 'POST', body: JSON.stringify({ theme: key, replaceExisting }) });
      } catch (firstError) {
        const message = friendlyError(firstError);
        if (!message.toLowerCase().includes('already has website pages')) throw firstError;
        const confirmed = window.confirm('This agency already has website pages. Replace them with this template’s starter pages? This cannot be undone.');
        if (!confirmed) return;
        await api('/website/templates/apply', { method: 'POST', body: JSON.stringify({ theme: key, replaceExisting: true }) });
      }
      setF({ ...f, theme: key, primaryColor: theme.primaryColor || f.primaryColor, secondaryColor: theme.secondaryColor || f.secondaryColor, font: theme.font || f.font });
      toast.success('Template applied with demo pages. Review the content before publishing.');
      onSaved();
    } catch (e) {
      console.error('[website template apply] Request failed:', e);
      toast.error(e?.message || 'Template could not be applied. Please try again.');
    } finally { setApplying(''); }
  };
  return (<div className="space-y-4">
    <Card><CardContent className="space-y-4 p-5">
      <div><h3 className="text-base font-semibold">Website templates</h3><p className="mt-1 text-sm text-muted-foreground">Choose a design for your agency. Each template includes editable starter pages and sample travel content. Demo prices, contact details and itineraries must be reviewed before publishing.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => {
          const key = theme.themeKey || theme.id;
          const selected = f.theme === key;
          return <div key={key} className={`overflow-hidden rounded-xl border ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
            <div className="h-28 p-3" style={{ background: `linear-gradient(135deg,${theme.primaryColor || '#2563eb'},${theme.secondaryColor || '#0ea5e9'})` }}>
              <div className="flex h-full flex-col justify-between rounded-lg border border-white/30 bg-white/10 p-3 text-white">
                <div className="text-xs uppercase tracking-[.18em]">{theme.category || 'Travel'}</div>
                <div><div className="text-lg font-semibold">{theme.name || titleCase(key)}</div><div className="mt-1 flex gap-1"><span className="h-1.5 w-8 rounded-full bg-white/90"/><span className="h-1.5 w-4 rounded-full bg-white/60"/></div></div>
              </div>
            </div>
            <div className="space-y-3 p-3"><p className="min-h-10 text-sm text-muted-foreground">{theme.description || 'A customizable travel agency website design.'}</p>
              <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-full border" style={{ background: theme.primaryColor || '#2563eb' }}/><span className="h-5 w-5 rounded-full border" style={{ background: theme.secondaryColor || '#0ea5e9' }}/><span className="text-xs text-muted-foreground">{theme.font || 'Inter'}</span></div>
              <div className="flex gap-2"><Button size="sm" variant={selected ? 'default' : 'outline'} onClick={() => choose(theme)} className="flex-1">{selected ? 'Selected' : 'Customize'}</Button><Button size="sm" onClick={() => apply(theme)} disabled={!canManage || Boolean(applying)} className="flex-1">{applying === key ? 'Applying…' : 'Use template'}</Button></div>
            </div>
          </div>;
        })}
      </div>
    </CardContent></Card>
    <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
      <div className="space-y-1"><Label>Primary color</Label><div className="flex gap-2"><input type="color" value={f.primaryColor} onChange={(e) => setF({ ...f, primaryColor: e.target.value })} disabled={!canManage} className="h-9 w-12 rounded border" /><Input value={f.primaryColor} onChange={(e) => setF({ ...f, primaryColor: e.target.value })} disabled={!canManage} /></div></div>
      <div className="space-y-1"><Label>Secondary color</Label><div className="flex gap-2"><input type="color" value={f.secondaryColor} onChange={(e) => setF({ ...f, secondaryColor: e.target.value })} disabled={!canManage} className="h-9 w-12 rounded border" /><Input value={f.secondaryColor} onChange={(e) => setF({ ...f, secondaryColor: e.target.value })} disabled={!canManage} /></div></div>
      <div className="space-y-1"><Label>Font</Label><Select value={f.font} onValueChange={(v) => setF({ ...f, font: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Inter', 'Poppins', 'Roboto', 'Lato', 'Montserrat'].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label>Selected template</Label><Select value={f.theme} onValueChange={(v) => { const chosen = themes.find((t) => (t.themeKey || t.id) === v); setF({ ...f, theme: v, ...(chosen ? { primaryColor: chosen.primaryColor, secondaryColor: chosen.secondaryColor, font: chosen.font } : {}) }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{themes.map((x) => <SelectItem key={x.themeKey || x.id} value={x.themeKey || x.id}>{x.name || titleCase(x.themeKey || x.id)}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1 sm:col-span-2"><Label>Logo URL</Label><Input value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} disabled={!canManage} /></div>
      <div className="flex items-center gap-3 sm:col-span-2"><div className="flex items-center gap-2 text-sm"><span className="h-6 w-6 rounded" style={{ background: f.primaryColor }} /><span className="h-6 w-6 rounded" style={{ background: f.secondaryColor }} /><span className="text-muted-foreground">Palette preview</span></div>{canManage && <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save appearance'}</Button>}</div>
    </CardContent></Card>
  </div>);
}

function WebsitePageDialog({ page, onClose, onSaved }) {
  const isNew = !page.id;
  const [f, setF] = useState({ title: page.title || '', slug: page.slug || '', pageType: page.pageType || 'custom', content: page.content || '', status: page.status || 'draft', seoTitle: page.seoTitle || '', seoDescription: page.seoDescription || '', canonicalUrl: page.canonicalUrl || '', noindex: Boolean(page.noindex), ogTitle: page.ogTitle || '', ogDescription: page.ogDescription || '' });
  const [saving, setSaving] = useState(false);
  const save = async () => { if (!f.title.trim()) { toast.error('Title is required'); return; } setSaving(true); try { if (isNew) await api('/website/pages', { method: 'POST', body: JSON.stringify(f) }); else await api(`/website/pages/${page.id}`, { method: 'PUT', body: JSON.stringify(f) }); toast.success('Page saved'); onSaved(); } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); } };
  return (<Dialog open onOpenChange={(o) => { if (!o) onClose(); }}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{isNew ? 'New page' : 'Edit page'}</DialogTitle></DialogHeader>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1"><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
      <div className="space-y-1"><Label>Slug</Label><Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="auto from title" /></div>
      <div className="space-y-1"><Label>Type</Label><Select value={f.pageType} onValueChange={(v) => setF({ ...f, pageType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['home', 'about', 'contact', 'packages', 'destinations', 'custom'].map((x) => <SelectItem key={x} value={x}>{titleCase(x)}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label>Status</Label><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select></div>
      <div className="space-y-1 sm:col-span-2"><Label>Content</Label><Textarea rows={4} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></div>
      <div className="sm:col-span-2 border-t pt-2 text-sm font-medium text-muted-foreground">SEO</div>
      <div className="space-y-1 sm:col-span-2"><Label>SEO title</Label><Input value={f.seoTitle} onChange={(e) => setF({ ...f, seoTitle: e.target.value })} /></div>
      <div className="space-y-1 sm:col-span-2"><Label>Meta description</Label><Textarea rows={2} value={f.seoDescription} onChange={(e) => setF({ ...f, seoDescription: e.target.value })} /></div>
      <div className="space-y-1"><Label>Canonical URL</Label><Input value={f.canonicalUrl} onChange={(e) => setF({ ...f, canonicalUrl: e.target.value })} /></div>
      <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={f.noindex} onChange={(e) => setF({ ...f, noindex: e.target.checked })} id="noidx" /><Label htmlFor="noidx">No-index this page</Label></div>
      <div className="space-y-1 sm:col-span-2"><Label>OG title</Label><Input value={f.ogTitle} onChange={(e) => setF({ ...f, ogTitle: e.target.value })} /></div>
      <div className="space-y-1 sm:col-span-2"><Label>OG description</Label><Textarea rows={2} value={f.ogDescription} onChange={(e) => setF({ ...f, ogDescription: e.target.value })} /></div>
    </div>
    <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save page'}</Button></DialogFooter>
  </DialogContent></Dialog>);
}

function WebsitePages({ canManage }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [edit, setEdit] = useState(null);
  const load = async () => { setLoading(true); try { const d = await api('/website/pages'); setRows(d.pages || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const toggle = async (p) => { try { await api(`/website/pages/${p.id}/status`, { method: 'PUT', body: JSON.stringify({ status: p.status === 'published' ? 'draft' : 'published' }) }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const del = async (p) => { if (!window.confirm('Delete this page?')) return; try { await api(`/website/pages/${p.id}`, { method: 'DELETE' }); toast.success('Page deleted'); load(); } catch (e) { toast.error(friendlyError(e)); } };
  return (<div className="space-y-3">
    <div className="flex justify-end">{canManage && <Button size="sm" onClick={() => setEdit({})}><Plus className="h-4 w-4 mr-1" /> New page</Button>}</div>
    {loading && <div className="h-24 rounded-lg border bg-muted/30 animate-pulse" />}
    {!loading && rows.length === 0 && <Card><CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">No pages yet.{canManage ? ' Create your first page.' : ''}</CardContent></Card>}
    {!loading && rows.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{rows.map((p) => (<Card key={p.id}><CardContent className="space-y-1 p-4"><div className="flex items-center justify-between gap-2"><span className="font-medium">{p.title}</span><MetaBadge meta={p.status === 'published' ? { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' } : { label: 'Draft', cls: 'bg-amber-50 text-amber-700 border-amber-200' }} /></div><div className="text-xs text-muted-foreground">/{p.slug} · {titleCase(p.pageType)}</div>{canManage && <div className="flex gap-2 pt-2"><Button size="sm" variant="outline" onClick={() => setEdit(p)}><Pencil className="h-4 w-4 mr-1" />Edit</Button><Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.status === 'published' ? 'Unpublish' : 'Publish'}</Button><Button size="sm" variant="ghost" onClick={() => del(p)}><Trash2 className="h-4 w-4" /></Button></div>}</CardContent></Card>))}</div>}
    {edit !== null && <WebsitePageDialog page={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
  </div>);
}

function WebsiteSeo({ data, canManage, onSaved }) {
  const s = data.settings.seo || {};
  const [f, setF] = useState({ metaTitle: s.metaTitle || '', metaDescription: s.metaDescription || '', keywords: s.keywords || '', canonicalUrl: s.canonicalUrl || '', robots: s.robots || 'index', ogTitle: s.ogTitle || '', ogDescription: s.ogDescription || '', ogImage: s.ogImage || '' });
  const [saving, setSaving] = useState(false); const [overview, setOverview] = useState(null);
  useEffect(() => { (async () => { try { const d = await api('/website/seo/overview'); setOverview(d); } catch { /* */ } })(); }, []);
  const save = async () => { setSaving(true); try { await api('/website/settings', { method: 'PUT', body: JSON.stringify({ seo: f }) }); toast.success('SEO saved'); onSaved(); } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); } };
  const Check = ({ ok, label }) => (<span className={`inline-flex items-center gap-1 text-xs ${ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}{label}</span>);
  return (<div className="space-y-4">
    <Card><CardContent className="grid gap-3 p-5 sm:grid-cols-2">
      <div className="sm:col-span-2 text-sm font-medium">Site SEO defaults</div>
      <div className="space-y-1 sm:col-span-2"><Label>Meta title</Label><Input value={f.metaTitle} onChange={(e) => setF({ ...f, metaTitle: e.target.value })} disabled={!canManage} /></div>
      <div className="space-y-1 sm:col-span-2"><Label>Meta description</Label><Textarea rows={2} value={f.metaDescription} onChange={(e) => setF({ ...f, metaDescription: e.target.value })} disabled={!canManage} /></div>
      <div className="space-y-1"><Label>Default keywords</Label><Input value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} disabled={!canManage} /></div>
      <div className="space-y-1"><Label>Canonical URL</Label><Input value={f.canonicalUrl} onChange={(e) => setF({ ...f, canonicalUrl: e.target.value })} disabled={!canManage} /></div>
      <div className="space-y-1"><Label>Indexing</Label><Select value={f.robots} onValueChange={(v) => setF({ ...f, robots: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="index">Allow indexing</SelectItem><SelectItem value="noindex">No-index</SelectItem></SelectContent></Select></div>
      <div className="space-y-1"><Label>OG image URL</Label><Input value={f.ogImage} onChange={(e) => setF({ ...f, ogImage: e.target.value })} disabled={!canManage} /></div>
      {canManage && <div className="sm:col-span-2"><Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save SEO defaults'}</Button></div>}
    </CardContent></Card>
    <Card><CardContent className="space-y-3 p-5">
      <div className="flex items-center justify-between"><span className="font-medium">Page SEO checklist</span><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Search Console not connected</span></div>
      {!overview ? <div className="h-16 animate-pulse rounded bg-muted/30" /> : (overview.pages.length === 0 ? <div className="text-sm text-muted-foreground">No pages to analyze yet.</div> : <div className="space-y-2">{overview.pages.map((p) => (<div key={p.id} className="rounded-lg border p-3"><div className="flex items-center justify-between"><span className="font-medium">{p.title}</span><span className="text-xs text-muted-foreground">/{p.slug}</span></div><div className="mt-2 flex flex-wrap gap-3"><Check ok={p.checks.seoTitle} label="SEO title" /><Check ok={p.checks.metaDescription} label="Meta description" /><Check ok={p.checks.slugValid} label="Valid slug" /><Check ok={p.checks.canonical} label="Canonical" /><span className="text-xs text-muted-foreground">{p.checks.indexing}</span></div></div>))}</div>)}
    </CardContent></Card>
  </div>);
}

function WebsitePreview({ siteUrl, published }) {
  return (<Card><CardContent className="space-y-3 p-4">
    {!published && <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Website is in draft. Publish it to make it publicly visible.</div>}
    <div className="flex items-center justify-between gap-2"><span className="break-all text-sm text-muted-foreground">{siteUrl}</span><a href={siteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline"><ExternalLink className="h-4 w-4" />Open</a></div>
    <div className="overflow-hidden rounded-lg border"><iframe title="Website preview" src={siteUrl} className="h-[65vh] w-full bg-white" /></div>
  </CardContent></Card>);
}

function Website({ session, tab, onNav }) {
  const role = session.user.role; const canManage = can(role, 'website:manage');
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const d = await api('/website/settings'); setData(d); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const TABS = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'settings', label: 'Settings' }, { id: 'appearance', label: 'Appearance' }, { id: 'pages', label: 'Pages' }, { id: 'seo', label: 'SEO' }, { id: 'preview', label: 'Preview' }];
  const current = TABS.some((t) => t.id === tab) ? tab : 'dashboard';
  const slug = (data && data.agency && data.agency.slug) || '';
  const siteUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/site/' + slug;
  return (<div className="space-y-4">
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">{TABS.map((t) => { const on = current === t.id; return (<button key={t.id} onClick={() => onNav(t.id)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${on ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}>{t.label}</button>); })}</div>
    {loading || !data ? <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" /> : (<>
      {current === 'dashboard' && <WebsiteDashboard data={data} siteUrl={siteUrl} canManage={canManage} onChanged={load} />}
      {current === 'settings' && <WebsiteSettings data={data} canManage={canManage} onSaved={load} />}
      {current === 'appearance' && <WebsiteAppearance data={data} canManage={canManage} onSaved={load} />}
      {current === 'pages' && <WebsitePages canManage={canManage} />}
      {current === 'seo' && <WebsiteSeo data={data} canManage={canManage} onSaved={load} />}
      {current === 'preview' && <WebsitePreview siteUrl={siteUrl} published={data.settings.status === 'published'} />}
    </>)}
  </div>);
}

// ======================= BUSINESS ANALYTICS UI (5.8) =======================
const AN_RANGES = [{ id: 'today', label: 'Today' }, { id: 'week', label: 'This Week' }, { id: 'month', label: 'This Month' }, { id: 'year', label: 'This Year' }, { id: 'all', label: 'All Time' }];
function AnStat({ label, value }) { return (<Card><CardContent className="p-4"><div className="text-xl font-bold text-slate-900">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></CardContent></Card>); }
function AnBars({ data }) { const entries = Object.entries(data || {}); const max = Math.max(1, ...entries.map(([, v]) => Number(v) || 0)); if (!entries.length) return <div className="text-sm text-muted-foreground">No data available for this period.</div>; return (<div className="space-y-2">{entries.map(([k, v]) => (<div key={k}><div className="flex justify-between text-xs"><span className="capitalize text-muted-foreground">{String(k).replace(/_/g, ' ')}</span><span className="font-medium">{v}</span></div><div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-violet-500" style={{ width: `${(Number(v) / max) * 100}%` }} /></div></div>))}</div>); }

function Analytics({ session, tab, onNav }) {
  const TABS = [{ id: 'overview', label: 'Overview' }, { id: 'sales', label: 'Sales' }, { id: 'crm', label: 'CRM' }, { id: 'finance', label: 'Finance' }, { id: 'operations', label: 'Operations' }];
  const current = TABS.some((t) => t.id === tab) ? tab : 'overview';
  const [range, setRange] = useState('month'); const [d, setD] = useState(null); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const r = await api(`/analytics/${current}?range=${range}`); setD(r); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [current, range]);
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">{TABS.map((t) => { const on = current === t.id; return (<button key={t.id} onClick={() => onNav(t.id)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${on ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}>{t.label}</button>); })}</div>
      <Select value={range} onValueChange={setRange}><SelectTrigger className="w-40"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /><SelectValue /></div></SelectTrigger><SelectContent>{AN_RANGES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent></Select>
    </div>
    {loading ? <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg border bg-muted/30 animate-pulse" />)}</div> : (<>
      {current === 'overview' && d && d.overview && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><AnStat label="Total revenue" value={money(d.overview.totalRevenue)} /><AnStat label="Total expenses" value={money(d.overview.totalExpenses)} /><AnStat label="Gross profit" value={money(d.overview.grossProfit)} /><AnStat label="Bookings" value={d.overview.totalBookings} /><AnStat label="Active leads" value={d.overview.activeLeads} /><AnStat label="Clients" value={d.overview.totalClients} /><AnStat label="Outstanding receivables" value={money(d.overview.outstandingReceivables)} /><AnStat label="Outstanding payables" value={money(d.overview.outstandingPayables)} /><AnStat label="Customer payments" value={d.overview.totalPayments} /></div>}
      {current === 'sales' && d && d.sales && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><AnStat label="Quotations" value={d.sales.quotations} /><AnStat label="Approved" value={d.sales.approvedQuotations} /><AnStat label="Bookings" value={d.sales.bookings} /><AnStat label="Conversion" value={`${d.sales.conversionRate}%`} /><AnStat label="Booking value" value={money(d.sales.bookingValue)} /><AnStat label="Quotation value" value={money(d.sales.quotationValue)} /></div><Card><CardContent className="p-5"><div className="mb-3 font-medium">Revenue trend (recent months)</div><AnBars data={Object.fromEntries((d.sales.revenueTrend || []).map((x) => [x.month, x.value]))} /></CardContent></Card></div>}
      {current === 'crm' && d && d.crm && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><AnStat label="Total leads" value={d.crm.totalLeads} /><AnStat label="Converted" value={d.crm.convertedLeads} /><AnStat label="Conversion" value={`${d.crm.conversionRate}%`} /><AnStat label="Clients" value={d.crm.totalClients} /><AnStat label="Pending follow-ups" value={d.crm.pendingFollowups} /><AnStat label="Open tasks" value={d.crm.openTasks} /></div><div className="grid gap-4 md:grid-cols-2"><Card><CardContent className="p-5"><div className="mb-3 font-medium">Leads by status</div><AnBars data={d.crm.leadsByStatus} /></CardContent></Card><Card><CardContent className="p-5"><div className="mb-3 font-medium">Lead sources</div><AnBars data={d.crm.leadSources} /></CardContent></Card></div></div>}
      {current === 'finance' && d && d.finance && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><AnStat label="Income" value={money(d.finance.income)} /><AnStat label="Expenses" value={money(d.finance.expenses)} /><AnStat label="Profit" value={money(d.finance.profit)} /><AnStat label="Receivables" value={money(d.finance.receivables)} /><AnStat label="Payables" value={money(d.finance.payables)} /></div><div className="grid gap-4 md:grid-cols-2"><Card><CardContent className="p-5"><div className="mb-3 font-medium">Invoice status</div><AnBars data={d.finance.invoiceStatus} /></CardContent></Card><Card><CardContent className="p-5"><div className="mb-3 font-medium">Payment status</div><AnBars data={d.finance.paymentStatus} /></CardContent></Card></div></div>}
      {current === 'operations' && d && d.operations && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><AnStat label="Upcoming bookings" value={d.operations.upcomingBookings} /><AnStat label="Suppliers" value={d.operations.totalSuppliers} /><AnStat label="Vehicles" value={d.operations.vehicles.total} /><AnStat label="Drivers" value={d.operations.drivers.total} /><AnStat label="Packages" value={d.operations.totalPackages} /></div><div className="grid gap-4 md:grid-cols-2"><Card><CardContent className="p-5"><div className="mb-3 font-medium">Bookings by status</div><AnBars data={d.operations.bookingsByStatus} /></CardContent></Card><Card><CardContent className="p-5"><div className="mb-3 font-medium">Vehicles by status</div><AnBars data={d.operations.vehicles.byStatus} /></CardContent></Card></div></div>}
    </>)}
  </div>);
}

// ======================= SAAS SUBSCRIPTION & BILLING UI (5.9) =======================
const SUB_STATUS_META = {
  trial:     { label: 'Trial',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  active:    { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  past_due:  { label: 'Past Due',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  suspended: { label: 'Suspended', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  expired:   { label: 'Expired',   cls: 'bg-muted text-muted-foreground border-border' },
};
const SAAS_INVOICE_META = {
  draft:     { label: 'Draft',     cls: 'bg-muted text-muted-foreground border-border' },
  issued:    { label: 'Issued',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid:      { label: 'Paid',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed:    { label: 'Failed',    cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-muted text-muted-foreground border-border' },
  refunded:  { label: 'Refunded',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};
const PLAN_ORDER = ['trial', 'starter', 'professional', 'enterprise'];
const humanizeKey = (k) => String(k).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
function SubStatusBadge({ status }) { const m = SUB_STATUS_META[status] || SUB_STATUS_META.active; return <Badge variant="outline" className={`capitalize ${m.cls}`}>{m.label}</Badge>; }

function SubOverview({ sub, onGo }) {
  if (!sub) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  const { subscription: s, plan, price, trialDaysLeft } = sub;
  return (<div className="space-y-4">
    <Card><CardContent className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3><SubStatusBadge status={s.status} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">{price ? `${plan.currency} ${Number(price).toLocaleString()}` : 'Free'}</div>
          <div className="text-xs text-muted-foreground">{price ? `per ${s.billingInterval === 'yearly' ? 'year' : 'month'}` : 'Trial plan'}</div>
        </div>
      </div>
      {s.status === 'trial' && trialDaysLeft !== null && (<div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">Trial — {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} remaining.</div>)}
      {s.status === 'cancelled' && (<div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">Subscription cancelled{s.cancellationReason ? ` — ${s.cancellationReason}` : ''}. Access remains until the end of the current period.</div>)}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><div className="text-xs text-muted-foreground">Status</div><div className="font-medium">{(SUB_STATUS_META[s.status] || {}).label || s.status}</div></div>
        <div><div className="text-xs text-muted-foreground">Started</div><div className="font-medium">{formatJoined(s.startDate)}</div></div>
        <div><div className="text-xs text-muted-foreground">Current period</div><div className="font-medium">{formatJoined(s.currentPeriodStart)} – {formatJoined(s.currentPeriodEnd)}</div></div>
        <div><div className="text-xs text-muted-foreground">Renews / Ends</div><div className="font-medium">{formatJoined(s.currentPeriodEnd)}</div></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => onGo('plans')}>Change plan</Button><Button variant="outline" onClick={() => onGo('usage')}>View usage</Button></div>
    </CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Plan features</CardTitle></CardHeader><CardContent className="space-y-1">{Object.entries(plan.features || {}).map(([k, v]) => (<div key={k} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{humanizeKey(k)}</span>{v ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</div>))}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Plan limits</CardTitle></CardHeader><CardContent className="space-y-1">{Object.entries(plan.limits || {}).map(([k, v]) => (<div key={k} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{humanizeKey(k)}</span><span className="font-medium">{v === -1 ? 'Unlimited' : v}</span></div>))}</CardContent></Card>
    </div>
  </div>);
}

function SubPlans({ sub, canManage, onChanged }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState((sub && sub.subscription && sub.subscription.billingInterval) || 'monthly');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const currentPlanId = sub && sub.subscription ? sub.subscription.planId : '';
  const currentStatus = sub && sub.subscription ? sub.subscription.status : '';
  const load = async () => { setLoading(true); try { const d = await api('/billing/plans'); setPlans(d.plans || []); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const doChange = async () => {
    if (!pending) return; setBusy(true);
    try { await api('/billing/subscription/change', { method: 'POST', body: JSON.stringify({ planId: pending.slug, billingInterval: interval }) }); toast.success(`Switched to ${pending.name}`); setPending(null); onChanged(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setBusy(false); }
  };
  const doCancel = async () => {
    setBusy(true);
    try { await api('/billing/subscription/cancel', { method: 'POST', body: JSON.stringify({ reason: cancelReason }) }); toast.success('Subscription cancelled'); setCancelOpen(false); setCancelReason(''); onChanged(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setBusy(false); }
  };
  const changeLabel = (slug) => { const a = PLAN_ORDER.indexOf(currentPlanId); const b = PLAN_ORDER.indexOf(slug); if (b > a) return 'Upgrade'; if (b < a) return 'Downgrade'; return 'Switch'; };
  if (loading) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">Plan changes take effect immediately. No payment is collected in this phase.</p>
      <Select value={interval} onValueChange={setInterval}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{plans.map((p) => {
      const isCurrent = p.slug === currentPlanId;
      const price = interval === 'yearly' ? p.priceYearly : p.price;
      return (<Card key={p.id} className={isCurrent ? 'border-violet-400 ring-1 ring-violet-200' : ''}><CardContent className="flex h-full flex-col p-5">
        <div className="flex items-center justify-between"><h4 className="text-lg font-bold text-slate-900">{p.name}</h4>{isCurrent && <Badge className="bg-violet-600 text-white">Current</Badge>}</div>
        <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
        <div className="mt-3 text-2xl font-bold text-slate-900">{price ? `${p.currency} ${Number(price).toLocaleString()}` : 'Free'}</div>
        <div className="text-xs text-muted-foreground">{price ? `per ${interval === 'yearly' ? 'year' : 'month'}` : (p.slug === 'trial' ? `${p.trialDays}-day trial` : 'Free')}</div>
        <div className="mt-4 flex-1 space-y-1">{Object.entries(p.features).filter(([, v]) => v).slice(0, 6).map(([k]) => (<div key={k} className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /><span>{humanizeKey(k)}</span></div>))}</div>
        <div className="mt-4">{isCurrent ? <Button variant="outline" className="w-full" disabled>Current plan</Button> : canManage ? <Button className="w-full" onClick={() => setPending(p)}>{changeLabel(p.slug)} to {p.name}</Button> : <Button variant="outline" className="w-full" disabled>Owner only</Button>}</div>
      </CardContent></Card>);
    })}</div>
    {canManage && currentStatus !== 'cancelled' && (<Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-5"><div><div className="font-medium">Cancel subscription</div><div className="text-xs text-muted-foreground">Your plan stays active until the end of the current period.</div></div><Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => setCancelOpen(true)}>Cancel subscription</Button></CardContent></Card>)}
    <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}><DialogContent><DialogHeader><DialogTitle>Switch to {pending ? pending.name : ''}?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This changes your SafarOS plan to <b>{pending ? pending.name : ''}</b> ({interval}). No payment is collected in this phase — billing integration comes later.</p><DialogFooter><Button variant="outline" onClick={() => setPending(null)} disabled={busy}>Cancel</Button><Button onClick={doChange} disabled={busy}>{busy ? 'Updating…' : 'Confirm change'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={cancelOpen} onOpenChange={(o) => { if (!o) { setCancelOpen(false); setCancelReason(''); } }}><DialogContent><DialogHeader><DialogTitle>Cancel subscription</DialogTitle></DialogHeader><div className="space-y-2"><Label>Reason (optional)</Label><Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Tell us why you're cancelling…" /></div><DialogFooter><Button variant="outline" onClick={() => { setCancelOpen(false); setCancelReason(''); }} disabled={busy}>Keep plan</Button><Button className="bg-rose-600 hover:bg-rose-700" onClick={doCancel} disabled={busy}>{busy ? 'Cancelling…' : 'Confirm cancellation'}</Button></DialogFooter></DialogContent></Dialog>
  </div>);
}

function SubUsage() {
  const [d, setD] = useState(null); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const r = await api('/billing/usage'); setD(r); } catch (e) { toast.error(friendlyError(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  if (loading || !d) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  return (<div className="space-y-3">
    <p className="text-sm text-muted-foreground">Live usage for your agency against your current plan limits. Limits are tracked but not yet enforced in this foundation phase.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(d.usage || []).map((u) => { const pct = u.unlimited ? 8 : Math.min(100, u.limit ? (u.usage / u.limit) * 100 : 0); const over = !u.unlimited && u.usage >= u.limit; return (<Card key={u.key}><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">{humanizeKey(u.key)}</span><span className="text-xs text-muted-foreground">{u.usage}{u.unlimited ? '' : ` / ${u.limit}`}</span></div><div className="mt-2 h-2 rounded bg-muted"><div className={`h-2 rounded ${over ? 'bg-rose-500' : 'bg-violet-500'}`} style={{ width: `${pct}%` }} /></div><div className="mt-1 text-xs text-muted-foreground">{u.unlimited ? 'Unlimited' : (over ? 'Limit reached' : `${u.remaining} remaining`)}</div></CardContent></Card>); })}</div>
  </div>);
}

function SubInvoices() {
  const [invoices, setInvoices] = useState(null);
  const load = async () => { try { const d = await api('/billing/invoices'); setInvoices(d.invoices || []); } catch (e) { toast.error(friendlyError(e)); } };
  useEffect(() => { load(); }, []);
  if (invoices === null) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  if (!invoices.length) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No SaaS billing records yet. Subscription invoices will appear here once billing is activated.</CardContent></Card>;
  return (<Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Issued</TableHead></TableRow></TableHeader><TableBody>{invoices.map((inv) => (<TableRow key={inv.id}><TableCell className="font-medium">{inv.invoiceNumber}</TableCell><TableCell>{formatJoined(inv.billingPeriodStart)} – {formatJoined(inv.billingPeriodEnd)}</TableCell><TableCell>{inv.currency} {Number(inv.amount || 0).toLocaleString()}</TableCell><TableCell><Badge variant="outline" className={`capitalize ${(SAAS_INVOICE_META[inv.status] || {}).cls || ''}`}>{(SAAS_INVOICE_META[inv.status] || {}).label || inv.status}</Badge></TableCell><TableCell>{formatJoined(inv.issuedAt)}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>);
}

function SubHistory() {
  const [history, setHistory] = useState(null);
  const load = async () => { try { const d = await api('/billing/subscription/history'); setHistory(d.history || []); } catch (e) { toast.error(friendlyError(e)); } };
  useEffect(() => { load(); }, []);
  if (history === null) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  if (!history.length) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No subscription changes recorded yet.</CardContent></Card>;
  return (<div className="space-y-2">{history.map((h) => (<Card key={h.id}><CardContent className="p-4"><div className="flex items-center justify-between gap-3"><div className="text-sm"><span className="font-medium capitalize">{h.previousPlan}</span> → <span className="font-medium capitalize">{h.newPlan}</span>{h.previousStatus !== h.newStatus && <span className="text-muted-foreground"> ({h.previousStatus} → {h.newStatus})</span>}</div><span className="shrink-0 text-xs text-muted-foreground">{formatJoined(h.changedAt)}</span></div>{h.reason && <div className="mt-1 text-xs text-muted-foreground">{h.reason}</div>}</CardContent></Card>))}</div>);
}

function Billing({ session, tab, onNav }) {
  const canManage = can(session.user.role, 'subscription:manage');
  const TABS = [{ id: 'overview', label: 'Subscription' }, { id: 'plans', label: 'Plans' }, { id: 'usage', label: 'Usage & Limits' }, { id: 'billing', label: 'Billing History' }, { id: 'history', label: 'Change Log' }];
  const current = TABS.some((t) => t.id === tab) ? tab : 'overview';
  const [sub, setSub] = useState(null);
  const loadSub = async () => { try { const d = await api('/billing/subscription'); setSub(d); } catch (e) { toast.error(friendlyError(e)); } };
  useEffect(() => { loadSub(); }, []);
  return (<div className="space-y-4">
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">{TABS.map((t) => { const on = current === t.id; return (<button key={t.id} onClick={() => onNav(t.id)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${on ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}>{t.label}</button>); })}</div>
    {current === 'overview' && <SubOverview sub={sub} onGo={onNav} />}
    {current === 'plans' && <SubPlans sub={sub} canManage={canManage} onChanged={loadSub} />}
    {current === 'usage' && <SubUsage />}
    {current === 'billing' && <SubInvoices />}
    {current === 'history' && <SubHistory />}
  </div>);
}

// ======================= INTEGRATION MANAGER UI (Phase 5.10) =======================
const INT_STATUS_META = {
  not_connected:          { label: 'Not Connected',          cls: 'bg-muted text-muted-foreground border-border' },
  connected:              { label: 'Connected',              cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  disabled:               { label: 'Disabled',               cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  error:                  { label: 'Error',                  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  configuration_required: { label: 'Configuration Required', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};
const INT_CAT_ICON = { ai: Bot, payments: CreditCard, communications: MessageSquare, email: Mail, sms: Phone, google: Globe, calendar: CalendarDays, webhooks: ExternalLink, api: ShieldCheck };
function IntStatusBadge({ status }) { const m = INT_STATUS_META[status] || INT_STATUS_META.not_connected; return <Badge variant="outline" className={m.cls}>{m.label}</Badge>; }

function CopyOnce({ value, label }) {
  const copy = async () => { try { await navigator.clipboard.writeText(value); toast.success('Copied'); } catch { toast.error('Copy failed'); } };
  return (<div className="rounded-md border bg-muted/40 p-3">
    <div className="mb-1 text-xs font-medium text-muted-foreground">{label} — shown once, store it securely</div>
    <div className="flex items-center gap-2"><code className="flex-1 break-all rounded bg-background px-2 py-1 text-xs">{value}</code><Button size="sm" variant="outline" onClick={copy}><Copy className="h-3.5 w-3.5" /></Button></div>
  </div>);
}

function ConfigureDialog({ provider, canManage, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { (async () => { try { const d = await api(`/integrations/${provider}`); setData(d.integration); setForm({}); } catch (e) { toast.error(friendlyError(e)); } })(); }, [provider]);
  const save = async () => {
    setBusy(true);
    try { const d = await api(`/integrations/${provider}/configure`, { method: 'POST', body: JSON.stringify({ config: form }) }); setData(d.integration); toast.success('Integration saved'); onChanged(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setBusy(false); }
  };
  const toggle = async (enabled) => {
    setBusy(true);
    try { const d = await api(`/integrations/${provider}`, { method: 'PUT', body: JSON.stringify({ enabled }) }); setData(d.integration); toast.success(enabled ? 'Enabled' : 'Disabled'); onChanged(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true);
    try { const d = await api(`/integrations/${provider}/disconnect`, { method: 'POST', body: JSON.stringify({}) }); setData(d.integration); toast.success('Disconnected'); onChanged(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setBusy(false); }
  };
  return (<Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>{data ? data.name : 'Integration'}</DialogTitle></DialogHeader>
    {!data ? <div className="h-32 animate-pulse rounded bg-muted/40" /> : (<div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{data.description}</p><IntStatusBadge status={data.status} /></div>
      {data.managed === 'env' ? (<div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">Managed via secure server environment. Credentials are set on the server and never editable from the browser.</div>) : (<>
        {data.fields.map((f) => {
          const hint = data.secretHints[f.key];
          const existing = data.config[f.key];
          return (<div key={f.key} className="space-y-1.5">
            <Label>{f.label}{f.required ? ' *' : ''}</Label>
            <Input type={f.type === 'secret' ? 'password' : 'text'} placeholder={f.type === 'secret' ? (hint ? `•••• ${hint} (leave blank to keep)` : (f.placeholder || 'Enter secret')) : (existing || f.placeholder || '')} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} disabled={!canManage} />
          </div>);
        })}
        {canManage && (<div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={save} disabled={busy}>Save configuration</Button>
          {(data.status === 'connected') && <Button variant="outline" onClick={() => toggle(false)} disabled={busy}>Disable</Button>}
          {(data.status === 'disabled') && <Button variant="outline" onClick={() => toggle(true)} disabled={busy}>Enable</Button>}
          {data.status !== 'not_connected' && <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50" onClick={disconnect} disabled={busy}>Disconnect</Button>}
        </div>)}
        {!canManage && <p className="text-xs text-muted-foreground">You have view-only access. Only the agency owner can configure integrations.</p>}
      </>)}
    </div>)}
  </DialogContent></Dialog>);
}

function IntOverview({ canManage }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const load = async () => { try { const d = await api('/integrations'); setData(d); } catch (e) { toast.error(friendlyError(e)); } };
  useEffect(() => { load(); }, []);
  if (!data) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  const cats = data.categories.filter((c) => ['payments', 'email'].includes(c.id));
  return (<div className="space-y-6">
    <p className="text-sm text-muted-foreground">Connect your agency's own payment gateway or email provider. Only optional agency-level services are shown here; platform-wide services are managed by SafarOS.</p>
    {cats.map((cat) => {
      const items = data.integrations.filter((i) => i.category === cat.id);
      if (!items.length) return null;
      const Icon = INT_CAT_ICON[cat.id] || Globe;
      return (<div key={cat.id} className="space-y-2">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-violet-600" /><h3 className="font-semibold text-slate-900">{cat.label}</h3><span className="text-xs text-muted-foreground">{cat.description}</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((i) => (<Card key={i.provider}><CardContent className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2"><div className="font-medium text-slate-900">{i.name}</div><IntStatusBadge status={i.status} /></div>
          <p className="mt-1 flex-1 text-xs text-muted-foreground">{i.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{i.connectionStatus}</span>
            {i.managed === 'env' ? <span className="text-xs font-medium text-muted-foreground">Server-managed</span> : <Button size="sm" variant="outline" onClick={() => setSelected(i.provider)}>{i.status === 'not_connected' ? 'Connect' : 'Configure'}</Button>}
          </div>
        </CardContent></Card>))}</div>
      </div>);
    })}
    {selected && <ConfigureDialog provider={selected} canManage={canManage} onClose={() => setSelected(null)} onChanged={load} />}
  </div>);
}

function IntWebhooks({ canManage }) {
  const [items, setItems] = useState(null);
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', direction: 'outgoing', endpoint: '', event: '' });
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState('');
  const load = async () => { try { const d = await api('/webhooks'); setItems(d.webhooks || []); setEvents(d.events || []); if (!form.event && d.events) setForm((f) => ({ ...f, event: d.events[0] })); } catch (e) { toast.error(friendlyError(e)); } };
  useEffect(() => { load(); }, []);
  const create = async () => {
    setBusy(true);
    try { const d = await api('/webhooks', { method: 'POST', body: JSON.stringify(form) }); setRevealed(d.secret); setOpen(false); setForm({ name: '', direction: 'outgoing', endpoint: '', event: events[0] || '' }); load(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setBusy(false); }
  };
  const toggle = async (w) => { try { await api(`/webhooks/${w.id}`, { method: 'PUT', body: JSON.stringify({ enabled: !w.enabled }) }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const remove = async (w) => { try { await api(`/webhooks/${w.id}`, { method: 'DELETE' }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  if (items === null) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">Incoming and outgoing event webhooks. Signing secrets are shown once and stored hashed — never retrievable.</p>
      {canManage && <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> New webhook</Button>}
    </div>
    {!items.length ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No webhooks yet.</CardContent></Card> : (<Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Direction</TableHead><TableHead>Event</TableHead><TableHead>Endpoint</TableHead><TableHead>Secret</TableHead><TableHead>Status</TableHead>{canManage && <TableHead></TableHead>}</TableRow></TableHeader>
      <TableBody>{items.map((w) => (<TableRow key={w.id}><TableCell className="font-medium">{w.name}</TableCell><TableCell className="capitalize">{w.direction}</TableCell><TableCell><code className="text-xs">{w.event}</code></TableCell><TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{w.endpoint || '—'}</TableCell><TableCell><code className="text-xs">{w.secretHint}</code></TableCell><TableCell><Badge variant="outline" className={w.enabled ? INT_STATUS_META.connected.cls : INT_STATUS_META.disabled.cls}>{w.enabled ? 'Active' : 'Disabled'}</Badge></TableCell>{canManage && <TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => toggle(w)}>{w.enabled ? 'Disable' : 'Enable'}</Button><Button size="sm" variant="ghost" className="text-rose-600" onClick={() => remove(w)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>}</TableRow>))}</TableBody>
    </Table></CardContent></Card>)}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>New webhook</DialogTitle></DialogHeader><div className="space-y-3">
      <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Booking notifier" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Direction</Label><Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="outgoing">Outgoing</SelectItem><SelectItem value="incoming">Incoming</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Event</Label><Select value={form.event} onValueChange={(v) => setForm({ ...form, event: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{events.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
      </div>
      {form.direction === 'outgoing' && <div className="space-y-1.5"><Label>Endpoint URL *</Label><Input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} placeholder="https://example.com/webhook" /></div>}
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create webhook'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!revealed} onOpenChange={(o) => !o && setRevealed('')}><DialogContent><DialogHeader><DialogTitle>Webhook signing secret</DialogTitle></DialogHeader><CopyOnce value={revealed} label="Signing secret" /><DialogFooter><Button onClick={() => setRevealed('')}>Done</Button></DialogFooter></DialogContent></Dialog>
  </div>);
}

function IntApiKeys({ canManage }) {
  const [items, setItems] = useState(null);
  const [scopes, setScopes] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', scopes: [] });
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState('');
  const load = async () => { try { const d = await api('/dev/api-keys'); setItems(d.apiKeys || []); setScopes(d.scopes || []); } catch (e) { toast.error(friendlyError(e)); } };
  useEffect(() => { load(); }, []);
  const toggleScope = (s) => setForm((f) => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter((x) => x !== s) : [...f.scopes, s] }));
  const create = async () => {
    setBusy(true);
    try { const d = await api('/dev/api-keys', { method: 'POST', body: JSON.stringify(form) }); setRevealed(d.key); setOpen(false); setForm({ name: '', scopes: [] }); load(); }
    catch (e) { toast.error(friendlyError(e)); } finally { setBusy(false); }
  };
  const toggle = async (k) => { try { await api(`/dev/api-keys/${k.id}`, { method: 'PUT', body: JSON.stringify({ enabled: !k.enabled }) }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  const remove = async (k) => { try { await api(`/dev/api-keys/${k.id}`, { method: 'DELETE' }); load(); } catch (e) { toast.error(friendlyError(e)); } };
  if (items === null) return <div className="h-40 rounded-lg border bg-muted/30 animate-pulse" />;
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">Agency API keys for developer access. Keys are shown once and stored hashed — only a masked preview is kept.</p>
      {canManage && <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> New API key</Button>}
    </div>
    {!items.length ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No API keys yet.</CardContent></Card> : (<Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Key</TableHead><TableHead>Scopes</TableHead><TableHead>Status</TableHead>{canManage && <TableHead></TableHead>}</TableRow></TableHeader>
      <TableBody>{items.map((k) => (<TableRow key={k.id}><TableCell className="font-medium">{k.name}</TableCell><TableCell><code className="text-xs">{k.displayKey}</code></TableCell><TableCell className="text-xs text-muted-foreground">{(k.scopes || []).join(', ') || '—'}</TableCell><TableCell><Badge variant="outline" className={k.enabled ? INT_STATUS_META.connected.cls : INT_STATUS_META.disabled.cls}>{k.enabled ? 'Active' : 'Disabled'}</Badge></TableCell>{canManage && <TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => toggle(k)}>{k.enabled ? 'Disable' : 'Enable'}</Button><Button size="sm" variant="ghost" className="text-rose-600" onClick={() => remove(k)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>}</TableRow>))}</TableBody>
    </Table></CardContent></Card>)}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>New API key</DialogTitle></DialogHeader><div className="space-y-3">
      <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Server integration" /></div>
      <div className="space-y-1.5"><Label>Scopes</Label><div className="flex flex-wrap gap-2">{scopes.map((s) => { const on = form.scopes.includes(s); return (<button key={s} type="button" onClick={() => toggleScope(s)} className={`rounded-full border px-3 py-1 text-xs ${on ? 'border-violet-400 bg-violet-50 text-violet-700' : 'text-muted-foreground'}`}>{s}</button>); })}</div></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create key'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!revealed} onOpenChange={(o) => !o && setRevealed('')}><DialogContent><DialogHeader><DialogTitle>Your new API key</DialogTitle></DialogHeader><CopyOnce value={revealed} label="API key" /><DialogFooter><Button onClick={() => setRevealed('')}>Done</Button></DialogFooter></DialogContent></Dialog>
  </div>);
}

function Integrations({ session, tab, onNav }) {
  const canManage = can(session.user.role, 'integrations:manage');
  const TABS = [{ id: 'overview', label: 'Integrations' }, { id: 'webhooks', label: 'Webhooks' }, { id: 'api', label: 'Developer API' }];
  const current = TABS.some((t) => t.id === tab) ? tab : 'overview';
  return (<div className="space-y-4">
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">{TABS.map((t) => { const on = current === t.id; return (<button key={t.id} onClick={() => onNav(t.id)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${on ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}>{t.label}</button>); })}</div>
    {current === 'overview' && <IntOverview canManage={canManage} />}
    {current === 'webhooks' && <IntWebhooks canManage={canManage} />}
    {current === 'api' && <IntApiKeys canManage={canManage} />}
  </div>);
}

// ================================================================
// PROMPT 2 FRONTEND: Kashmir Travel Intelligence / Travel Rules
// ================================================================
function TravelRules({ session }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [form, setForm] = useState({ name: '', serviceCategory: '', surchargeType: 'fixed', surchargeValue: 0, destination: '', season: '', effectiveFrom: '', effectiveTo: '', active: true });

  const canManage = can(session.role, 'travelrules:manage');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/travel-rules');
      setRules(data.rules || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await api('/travel-rules', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Travel rule created');
      setCreateOpen(false);
      setForm({ name: '', serviceCategory: '', surchargeType: 'fixed', surchargeValue: 0, destination: '', season: '', effectiveFrom: '', effectiveTo: '', active: true });
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleEdit = async () => {
    if (!editRule) return;
    try {
      await api(`/travel-rules/${editRule.id}`, { method: 'PUT', body: JSON.stringify(form) });
      toast.success('Travel rule updated');
      setEditRule(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this travel rule?')) return;
    try {
      await api(`/travel-rules/${id}`, { method: 'DELETE' });
      toast.success('Travel rule deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const openEdit = (rule) => {
    setEditRule(rule);
    setForm({ name: rule.name, serviceCategory: rule.serviceCategory, surchargeType: rule.surchargeType, surchargeValue: rule.surchargeValue, destination: rule.destination || '', season: rule.season || '', effectiveFrom: rule.effectiveFrom || '', effectiveTo: rule.effectiveTo || '', active: rule.active });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Travel Intelligence</h2>
          <p className="text-sm text-muted-foreground">Manage travel rules and surcharges</p>
        </div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Create Rule</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Travel Rule</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Rule Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Service Category</Label><Input placeholder="transport, hotel, activities..." value={form.serviceCategory} onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Surcharge Type</Label>
                    <Select value={form.surchargeType} onValueChange={(v) => setForm({ ...form, surchargeType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="percentage">Percentage</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Surcharge Value</Label><Input type="number" value={form.surchargeValue} onChange={(e) => setForm({ ...form, surchargeValue: parseFloat(e.target.value) || 0 })} /></div>
                </div>
                <div><Label>Destination (optional)</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
                <div><Label>Season (optional)</Label><Input placeholder="winter, summer..." value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Effective From</Label><Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></div>
                  <div><Label>Effective To</Label><Input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={handleCreate}>Create Rule</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rules.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><MapPin className="mb-4 h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">No travel rules yet</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Rule Name</TableHead><TableHead>Service</TableHead><TableHead>Surcharge</TableHead><TableHead>Destination</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell><Badge variant="outline">{r.serviceCategory}</Badge></TableCell>
                  <TableCell>{r.surchargeType === 'percentage' ? `${r.surchargeValue}%` : `₹${r.surchargeValue}`}</TableCell>
                  <TableCell>{r.destination || '—'}</TableCell>
                  <TableCell>{r.active ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                  <TableCell>
                    {canManage && (
                      <div className="flex gap-2">
                        <Dialog open={editRule?.id === r.id} onOpenChange={(open) => { if (!open) setEditRule(null); }}>
                          <DialogTrigger asChild><Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button></DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Edit Travel Rule</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              <div><Label>Rule Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                              <div><Label>Service Category</Label><Input value={form.serviceCategory} onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })} /></div>
                              <div className="grid grid-cols-2 gap-3">
                                <div><Label>Surcharge Type</Label>
                                  <Select value={form.surchargeType} onValueChange={(v) => setForm({ ...form, surchargeType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="percentage">Percentage</SelectItem></SelectContent>
                                  </Select>
                                </div>
                                <div><Label>Surcharge Value</Label><Input type="number" value={form.surchargeValue} onChange={(e) => setForm({ ...form, surchargeValue: parseFloat(e.target.value) || 0 })} /></div>
                              </div>
                              <div><Label>Destination (optional)</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
                              <div><Label>Season (optional)</Label><Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} /></div>
                              <div className="grid grid-cols-2 gap-3">
                                <div><Label>Effective From</Label><Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></div>
                                <div><Label>Effective To</Label><Input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} /></div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                                <Label htmlFor="active">Active</Label>
                              </div>
                            </div>
                            <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ================================================================
// PROMPT 2 FRONTEND: Universal Document Vault
// ================================================================
function DocumentVault({ session }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState({ entityType: 'clients', entityId: '', fileName: '', file: null, category: 'contract', expiryDate: '' });

  const canCreate = can(session.role, 'documents:create');
  const canDelete = can(session.role, 'documents:delete');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/documents');
      setDocuments(data.documents || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    if (!form.file) { toast.error('Please select a file'); return; }
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        await api('/documents', { method: 'POST', body: JSON.stringify({ ...form, fileData: base64, file: undefined }) });
        toast.success('Document uploaded');
        setUploadOpen(false);
        setForm({ entityType: 'clients', entityId: '', fileName: '', file: null, category: 'contract', expiryDate: '' });
        load();
      };
      reader.readAsDataURL(form.file);
    } catch (e) { toast.error(e.message); }
  };

  const handleDownload = (doc) => {
    window.open(`/api/documents/${doc.id}/download`, '_blank');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api(`/documents/${id}`, { method: 'DELETE' });
      toast.success('Document deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Document Vault</h2>
          <p className="text-sm text-muted-foreground">Secure document storage and management</p>
        </div>
        {canCreate && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button><Upload className="mr-2 h-4 w-4" />Upload Document</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Entity Type</Label>
                  <Select value={form.entityType} onValueChange={(v) => setForm({ ...form, entityType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clients">Client</SelectItem>
                      <SelectItem value="leads">Lead</SelectItem>
                      <SelectItem value="bookings">Booking</SelectItem>
                      <SelectItem value="suppliers">Supplier</SelectItem>
                      <SelectItem value="vehicles">Vehicle</SelectItem>
                      <SelectItem value="drivers">Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Entity ID</Label><Input placeholder="Enter ID of client, booking, etc." value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="id_proof">ID Proof</SelectItem>
                      <SelectItem value="license">License</SelectItem>
                      <SelectItem value="permit">Permit</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>File Name</Label><Input value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} /></div>
                <div><Label>File</Label><Input type="file" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} /></div>
                <div><Label>Expiry Date (optional)</Label><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={handleUpload}>Upload</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : documents.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><FileText className="mb-4 h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">No documents yet</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>File Name</TableHead><TableHead>Category</TableHead><TableHead>Entity</TableHead><TableHead>Expiry</TableHead><TableHead>Uploaded</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.fileName}</TableCell>
                  <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                  <TableCell className="text-xs">{d.entityType} • {d.entityId.slice(0, 8)}</TableCell>
                  <TableCell>{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-xs">{new Date(d.uploadedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(d)}><Download className="h-4 w-4" /></Button>
                      {canDelete && <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ================================================================
// PROMPT 2 FRONTEND: Custom Fields & Custom Modules
// ================================================================
function CustomFields({ session }) {
  const [fields, setFields] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createFieldOpen, setCreateFieldOpen] = useState(false);
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState({ name: '', fieldType: 'text', moduleName: 'clients', required: false, options: '' });
  const [moduleForm, setModuleForm] = useState({ name: '', description: '' });

  const canManage = can(session.role, 'customization:manage');

  const load = async () => {
    setLoading(true);
    try {
      const [fieldsData, modulesData] = await Promise.all([api('/custom-fields'), api('/custom-modules')]);
      setFields(fieldsData.fields || []);
      setModules(modulesData.modules || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreateField = async () => {
    try {
      const payload = { ...fieldForm };
      if (fieldForm.fieldType === 'select' && fieldForm.options) {
        payload.options = fieldForm.options.split(',').map(o => o.trim()).filter(Boolean);
      }
      await api('/custom-fields', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Custom field created');
      setCreateFieldOpen(false);
      setFieldForm({ name: '', fieldType: 'text', moduleName: 'clients', required: false, options: '' });
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleCreateModule = async () => {
    try {
      await api('/custom-modules', { method: 'POST', body: JSON.stringify(moduleForm) });
      toast.success('Custom module created');
      setCreateModuleOpen(false);
      setModuleForm({ name: '', description: '' });
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleDeleteField = async (id) => {
    if (!confirm('Delete this field?')) return;
    try {
      await api(`/custom-fields/${id}`, { method: 'DELETE' });
      toast.success('Field deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleDeleteModule = async (id) => {
    if (!confirm('Delete this module?')) return;
    try {
      await api(`/custom-modules/${id}`, { method: 'DELETE' });
      toast.success('Module deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Custom Fields & Modules</h2>
        <p className="text-sm text-muted-foreground">Extend modules with custom fields</p>
      </div>

      <Tabs defaultValue="fields">
        <TabsList><TabsTrigger value="fields">Custom Fields</TabsTrigger><TabsTrigger value="modules">Custom Modules</TabsTrigger></TabsList>

        <TabsContent value="fields" className="space-y-4">
          <div className="flex justify-end">
            {canManage && (
              <Dialog open={createFieldOpen} onOpenChange={setCreateFieldOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Create Field</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Custom Field</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Field Name</Label><Input value={fieldForm.name} onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })} /></div>
                    <div><Label>Field Type</Label>
                      <Select value={fieldForm.fieldType} onValueChange={(v) => setFieldForm({ ...fieldForm, fieldType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Module</Label>
                      <Select value={fieldForm.moduleName} onValueChange={(v) => setFieldForm({ ...fieldForm, moduleName: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clients">Clients</SelectItem>
                          <SelectItem value="leads">Leads</SelectItem>
                          <SelectItem value="bookings">Bookings</SelectItem>
                          <SelectItem value="suppliers">Suppliers</SelectItem>
                          <SelectItem value="quotations">Quotations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {fieldForm.fieldType === 'select' && (
                      <div><Label>Options (comma-separated)</Label><Input placeholder="Option 1, Option 2, Option 3" value={fieldForm.options} onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })} /></div>
                    )}
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="required" checked={fieldForm.required} onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })} />
                      <Label htmlFor="required">Required field</Label>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleCreateField}>Create Field</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : fields.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><Database className="mb-4 h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">No custom fields yet</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Field Name</TableHead><TableHead>Type</TableHead><TableHead>Module</TableHead><TableHead>Required</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {fields.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell><Badge variant="outline">{f.fieldType}</Badge></TableCell>
                      <TableCell>{f.moduleName}</TableCell>
                      <TableCell>{f.required ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : '—'}</TableCell>
                      <TableCell>{f.active ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                      <TableCell>
                        {canManage && <Button size="sm" variant="ghost" onClick={() => handleDeleteField(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-end">
            {canManage && (
              <Dialog open={createModuleOpen} onOpenChange={setCreateModuleOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Create Module</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Custom Module</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Module Name</Label><Input value={moduleForm.name} onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} /></div>
                    <div><Label>Description</Label><Textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={handleCreateModule}>Create Module</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : modules.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><Layers className="mb-4 h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">No custom modules yet</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <Card key={m.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{m.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{m.description}</CardDescription>
                      </div>
                      {canManage && <Button size="sm" variant="ghost" onClick={() => handleDeleteModule(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {m.active ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ================================================================
// PROMPT 2 FRONTEND: B2B Supplier Network
// ================================================================
function SupplierNetwork({ session }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const canManage = can(session.role, 'suppliers:update');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/suppliers');
      setSuppliers(data.suppliers || []);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggleNetwork = async (id, currentVisibility) => {
    try {
      const newVisibility = currentVisibility === 'network' ? 'private' : 'network';
      await api(`/suppliers/${id}/network`, { method: 'PUT', body: JSON.stringify({ networkVisibility: newVisibility }) });
      toast.success(`Supplier visibility set to ${newVisibility}`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Supplier Network</h2>
        <p className="text-sm text-muted-foreground">Manage B2B supplier network visibility</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : suppliers.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><Store className="mb-4 h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">No suppliers yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => {
            const isNetwork = s.networkVisibility === 'network';
            return (
              <Card key={s.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{s.category}</CardDescription>
                    </div>
                    <Badge variant={isNetwork ? 'default' : 'outline'} className={isNetwork ? 'bg-violet-100 text-violet-700 border-violet-200' : ''}>
                      {isNetwork ? 'Network' : 'Private'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs space-y-1">
                    {s.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{s.phone}</div>}
                    {s.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{s.email}</div>}
                    {s.services && <div className="flex items-center gap-2 text-muted-foreground"><Layers className="h-3.5 w-3.5" />{s.services}</div>}
                  </div>
                  {canManage && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleToggleNetwork(s.id, s.networkVisibility)}>
                      {isNetwork ? <Lock className="mr-2 h-3.5 w-3.5" /> : <Globe className="mr-2 h-3.5 w-3.5" />}
                      {isNetwork ? 'Make Private' : 'Share to Network'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AppExperience;
