'use client';

import { ArrowRight, BedDouble, Compass, Database, Car, MapPin, Package, Plus, Search, Sparkles, Store, Truck, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const sections = [
  { id: 'discover', title: 'Discover suppliers', description: 'Find hotels, houseboats, transport providers, guides and experiences online.', icon: Compass, tone: 'from-sky-500 to-blue-600' },
  { id: 'suppliers', title: 'My Suppliers', description: 'Manage your agency contacts, supplier details and private negotiated terms.', icon: Store, tone: 'from-violet-500 to-indigo-600' },
  { id: 'inventory', title: 'Accommodation & Experiences', description: 'Maintain hotels, stays, sightseeing and activities in your catalogue.', icon: BedDouble, tone: 'from-emerald-500 to-teal-600' },
  { id: 'inventory', title: 'Transport & Rate Manager', description: 'Manage transport services, seasonal rates and selling guide prices.', icon: Car, tone: 'from-amber-500 to-orange-600' },
  { id: 'fleet', title: 'Agency Fleet', description: 'Manage owned vehicles, drivers, capacity and document expiry.', icon: Truck, tone: 'from-rose-500 to-pink-600' },
  { id: 'data_import', title: 'Import supply data', description: 'Bring existing supplier and inventory spreadsheets into SafarOS.', icon: Upload, tone: 'from-indigo-500 to-violet-600' },
];

export default function SupplyHubWorkspace({ onNavigate = () => {} }) {
  return <div className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white sm:p-8">
      <div className="relative z-10 max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100"><Database className="h-3.5 w-3.5" /> A connected travel supply catalogue</div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Supply Hub</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/80">Discover new travel suppliers, organise your agency's private supply, manage fleet and maintain rates — all in one place.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => onNavigate('discover')} className="bg-white text-slate-900 hover:bg-indigo-50"><Search className="mr-2 h-4 w-4" /> Discover suppliers</Button>
          <Button onClick={() => onNavigate('inventory')} variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15"><Plus className="mr-2 h-4 w-4" /> Add inventory</Button>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-130px] right-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
    </div>
    <div className="flex items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Manage your supply</h3><p className="text-sm text-muted-foreground">Choose an area to work with. Existing agency data and permissions are preserved.</p></div><span className="hidden text-xs text-muted-foreground sm:block">Agency-private workspace</span></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map((item) => { const Icon = item.icon; return <button key={item.title} type="button" onClick={() => onNavigate(item.id)} className="text-left">
        <Card className="h-full transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"><CardContent className="flex h-full flex-col gap-3 p-5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-sm`}><Icon className="h-5 w-5" /></div>
          <div><div className="font-semibold">{item.title}</div><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p></div>
          <div className="mt-auto flex items-center gap-1 pt-2 text-xs font-semibold text-violet-600">Open workspace <ArrowRight className="h-3.5 w-3.5" /></div>
        </CardContent></Card>
      </button>; })}
    </div>
    <Card className="border-violet-200 bg-violet-50/50"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-violet-100 p-2 text-violet-700"><Sparkles className="h-5 w-5" /></div><div><div className="font-semibold">Need to save a sale?</div><p className="mt-1 text-sm text-muted-foreground">Use Sales Rescue to find package and supplier alternatives while your customer is still chatting.</p></div></div>
      <Button onClick={() => onNavigate('sales-rescue')} className="shrink-0">Open Sales Rescue <ArrowRight className="ml-2 h-4 w-4" /></Button>
    </CardContent></Card>
  </div>;
}
