'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, BedDouble, Car, CheckCircle2, Clipboard, Loader2, Package, Search, Send, Sparkles, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

async function api(path) {
  const res = await fetch('/api' + path, { credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Unable to load agency data');
  return data;
}
const money = (n, currency = 'INR') => Number.isFinite(Number(n)) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n)) : 'Price not set';
const getPrice = (p) => [p.sellingGuidePrice, p.priceFrom, p.sellingPrice, p.totalPrice, p.price, p.amount].find(v => v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)));
const textOf = (v) => String(v || '').toLowerCase();

function parseBudget(text) {
  const s = String(text || '').replace(/,/g, '');
  const m = s.match(/(?:under|below|less than|max(?:imum)?|within|budget(?: of)?|upto|up to)\s*(?:₹|inr\s*)?([\d.]+)\s*(k|thousand|lakh|lac)?/i) || s.match(/₹\s*([\d.]+)\s*(k|thousand|lakh|lac)?/i);
  if (!m) return null;
  const factor = /^(k|thousand)$/i.test(m[2] || '') ? 1000 : /^(lakh|lac)$/i.test(m[2] || '') ? 100000 : 1;
  return Number(m[1]) * factor;
}
function priceLabel(item) {
  const value = getPrice(item);
  return value == null ? 'Price not set' : money(value, item.currency || 'INR');
}

export default function SalesRescueWorkspace({ onNavigate = () => {} }) {
  const [packages, setPackages] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [rates, setRates] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searching, setSearching] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      api('/packages'),
      api('/inventory/accommodations?limit=200'),
      api('/inventory/activities?limit=200'),
      api('/inventory/transport?limit=200'),
      api('/inventory/rate-plans?limit=300'),
    ]).then(([p, a, e, t, r]) => {
      if (!alive) return;
      setPackages(p.packages || []);
      setInventory([...(a.items || []), ...(e.items || []), ...(t.items || [])]);
      setRates(r.ratePlans || []);
    }).catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoadingData(false); });
    return () => { alive = false; };
  }, []);

  const runSearch = () => {
    setSearching(true);
    const q = textOf(requirements);
    const base = textOf(packageName);
    const budget = parseBudget(requirements);
    const words = q.split(/[^a-z0-9]+/).filter(w => w.length > 2 && !['under','with','the','and','for','same','keep','want','need','include','including','please','package','hotel','hotels'].includes(w));
    const pkgMatches = packages.filter(p => {
      const hay = textOf([p.name,p.destination,p.description,p.duration,p.nights].join(' '));
      const isBase = !base || hay.includes(base) || base.includes(textOf(p.name));
      const price = getPrice(p);
      const within = budget == null || (price != null && Number(price) <= budget);
      return isBase && within;
    });
    const itemMatches = inventory.filter(item => {
      const hay = textOf([item.name,item.destination,item.description,item.propertyType,item.activityType,item.vehicleType,item.serviceType].join(' '));
      const matchesWords = !words.length || words.some(w => hay.includes(w));
      return matchesWords;
    }).map(item => {
      const rate = rates.filter(r => r.serviceId === item.id && r.serviceType && r.status !== 'archived')
        .sort((a,b) => String(b.validFrom || '').localeCompare(String(a.validFrom || '')))[0];
      return { ...item, rate, sellingGuidePrice: rate?.sellingGuidePrice, netCost: rate?.netCost, currency: rate?.currency || 'INR', resultType: 'inventory' };
    }).filter(item => {
      const price = getPrice(item);
      return budget == null || (price != null && Number(price) <= budget);
    });
    const matched = [
      ...pkgMatches.map(p => ({ ...p, resultType: 'package' })),
      ...itemMatches,
    ].slice(0, 30);
    setResults({ items: matched, budget, query: requirements, packageName });
    setSelected([]);
    setSearching(false);
  };

  const shareText = useMemo(() => {
    if (!results) return '';
    const chosen = results.items.filter(x => selected.includes(x.id));
    if (!chosen.length) return '';
    return ['Here are a few alternatives based on your preferences:', ...chosen.map((x, i) => {
      const title = x.name || x.title || 'Travel option';
      const destination = x.destination ? ' — ' + x.destination : '';
      return `${i + 1}. ${title}${destination}\nPrice: ${priceLabel(x)}`;
    }), 'Let me know which option you prefer and I will confirm the details and availability.'].join('\n\n');
  }, [results, selected]);

  const copyShare = async () => {
    if (!shareText) { toast.error('Select at least one alternative first'); return; }
    try { await navigator.clipboard.writeText(shareText); setCopied(true); toast.success('Customer message copied'); }
    catch { toast.error('Could not copy the message'); }
  };

  const toggle = (id) => setSelected(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);

  return <div className="space-y-5">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white sm:p-8">
      <div className="relative z-10 max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100"><Sparkles className="h-3.5 w-3.5" /> Real-time agent workspace</div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Sales Rescue</h2><p className="mt-2 text-sm leading-6 text-indigo-100/80">Find a better option while the customer is still in the conversation. Search your agency's saved packages, inventory and supplier rates.</p>
      </div><div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
    </div>
    <Card><CardContent className="space-y-4 p-4 sm:p-6">
      <div><h3 className="font-semibold">Find alternatives</h3><p className="text-sm text-muted-foreground">Paste the original package name, then describe what the customer wants in plain language.</p></div>
      <div className="space-y-1.5"><Label>Original package or quotation name</Label><Input value={packageName} onChange={e => setPackageName(e.target.value)} placeholder="e.g. Kashmir Delight – 5 Nights / 6 Days" /></div>
      <div className="space-y-1.5"><Label>Customer's requirements</Label><Textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="e.g. Under ₹50,000, 4-star hotel, breakfast included, private SUV, keep the same dates…" rows={3} /></div>
      <div className="flex flex-wrap gap-2">{['Under ₹50,000','With a houseboat','4-star hotel','Private SUV','Family friendly','Include Gulmarg'].map(v => <button key={v} type="button" onClick={() => setRequirements(cur => cur ? cur + ', ' + v : v)} className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">{v}</button>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs text-muted-foreground">{loadingData ? 'Loading your agency catalogue…' : `${packages.length} packages · ${inventory.length} inventory items · ${rates.length} rate plans loaded`}</div>
        <Button onClick={runSearch} disabled={loadingData || searching}><Search className="mr-2 h-4 w-4" />{searching ? 'Searching…' : 'Find alternatives'}</Button>
      </div>
      {error && <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    </CardContent></Card>
    {results && <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Matching alternatives</h3><p className="text-sm text-muted-foreground">{results.items.length} result(s) from your agency catalogue{results.budget ? ` · budget up to ${money(results.budget)}` : ''}</p></div><Badge variant="outline">Supplier confirmation may be required</Badge></div>
      {!results.items.length ? <Card><CardContent className="p-10 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground" /><h4 className="mt-3 font-semibold">No matching alternatives found</h4><p className="mt-1 text-sm text-muted-foreground">Try a wider budget or different requirements, or add more supply to your Supply Hub.</p><Button variant="outline" className="mt-4" onClick={() => onNavigate('supply-hub')}>Open Supply Hub</Button></CardContent></Card> :
        <div className="grid gap-3 lg:grid-cols-2">{results.items.map((item, idx) => <Card key={item.id || idx} className={selected.includes(item.id) ? 'border-violet-400 ring-1 ring-violet-200' : ''}><CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="rounded-xl bg-violet-50 p-2 text-violet-700">{item.resultType === 'package' ? <Package className="h-5 w-5" /> : /transport/i.test(item.serviceType || item.vehicleType || '') ? <Car className="h-5 w-5" /> : <BedDouble className="h-5 w-5" />}</div><div className="min-w-0"><div className="font-semibold">{item.name || item.title}</div><div className="mt-1 text-xs text-muted-foreground">{item.destination || item.description || item.propertyType || item.activityType || item.serviceType || 'Agency catalogue item'}</div></div></div><Badge variant="secondary">{item.resultType === 'package' ? 'Package' : 'Supply'}</Badge></div>
          <div className="flex items-end justify-between gap-3"><div><div className="text-xs text-muted-foreground">Selling guide price</div><div className="text-xl font-bold">{priceLabel(item)}</div>{item.netCost != null && <div className="text-xs text-muted-foreground">Supplier cost: {money(item.netCost, item.currency || 'INR')}</div>}</div>
            <Button size="sm" variant={selected.includes(item.id) ? 'default' : 'outline'} onClick={() => toggle(item.id)} disabled={!item.id}>{selected.includes(item.id) ? <><CheckCircle2 className="mr-1 h-4 w-4" /> Selected</> : 'Select option'}</Button>
          </div>
          {item.rate && <div className="text-xs text-muted-foreground">Rate validity: {item.rate.validFrom || '—'} to {item.rate.validTo || '—'} · Price is a guide, not live availability.</div>}
        </CardContent></Card>)}</div>}
      {!!selected.length && <Card className="border-violet-200 bg-violet-50/40"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold">{selected.length} alternative(s) selected</div><p className="text-sm text-muted-foreground">Copy a ready-to-send message for the customer. Direct WhatsApp sending can be connected when the agency's WhatsApp Business API is active.</p></div><Button onClick={copyShare}><Clipboard className="mr-2 h-4 w-4" />{copied ? 'Copy again' : 'Copy customer message'}</Button></CardContent></Card>}
      {!!shareText && <Card><CardContent className="p-4"><Label>Customer message preview</Label><pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{shareText}</pre></CardContent></Card>}
    </div>}
    <div className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />This first test version searches the agency's own saved packages, inventory and rate plans. It does not yet combine multiple supplier services into a complete new package, query external live rates, or confirm availability. Always verify supplier availability and final cost before sending a firm offer.</div>
  </div>;
}
