'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, BedDouble, Car, CheckCircle2, Clipboard, FilePlus2, Loader2, Package, Search, Sparkles, Wallet, X, Plus, Minus, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Unable to complete the request');
  return data;
}

const number = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const money = (v, currency = 'INR') => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0,
}).format(number(v));
const getPrice = (p) => [p.sellingGuidePrice, p.priceFrom, p.sellingPrice, p.totalPrice, p.price, p.amount]
  .find(v => v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)));
const getCost = (p) => [p.netCost, p.unitCost, p.costPrice, p.cost]
  .find(v => v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)));
const textOf = (v) => String(v || '').toLowerCase();
const cleanWords = (v) => textOf(v).split(/[^a-z0-9]+/)
  .filter(w => /^[a-z]{3,}$/.test(w) && !['under','below','less','than','maximum','within','budget','upto','the','and','for','with','same','keep','want','need','include','including','please','package','hotel','hotels','option','options'].includes(w));

function parseBudget(text) {
  const s = String(text || '').replace(/,/g, '');
  const m = s.match(/(?:under|below|less than|max(?:imum)?|within|budget(?: of)?|upto|up to)\s*(?:₹|inr\s*)?([\d.]+)\s*(k|thousand|lakh|lac)?/i)
    || s.match(/₹\s*([\d.]+)\s*(k|thousand|lakh|lac)?/i);
  if (!m) return null;
  const factor = /^(k|thousand)$/i.test(m[2] || '') ? 1000 : /^(lakh|lac)$/i.test(m[2] || '') ? 100000 : 1;
  return number(m[1]) * factor;
}

function categoryFor(item) {
  const kind = textOf(item.resultType === 'package' ? 'package' : (item.serviceType || item.vehicleType || item.propertyType || item.activityType || item.type || ''));
  if (/transport|vehicle|car|bus|transfer/.test(kind)) return 'Transport';
  if (/activity|experience|tour|sightseeing/.test(kind)) return 'Activity';
  if (/package/.test(kind)) return 'Package';
  return 'Accommodation';
}

function rateFor(item, rates, quotation) {
  const candidates = rates.filter(r => r.serviceId === item.id && r.status !== 'archived' && (!r.serviceType || r.serviceType === item.serviceType));
  const start = quotation && quotation.startDate;
  const end = quotation && quotation.endDate;
  const valid = candidates.filter(r => {
    if (!start && !end) return true;
    const from = String(r.validFrom || '');
    const to = String(r.validTo || '');
    if (start && to && to < start) return false;
    if (end && from && from > end) return false;
    return true;
  });
  return valid.sort((a, b) => String(b.validFrom || '').localeCompare(String(a.validFrom || '')))[0] || null;
}

export default function SalesRescueWorkspace({ onNavigate = () => {} }) {
  const [quotations, setQuotations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [rates, setRates] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [originalId, setOriginalId] = useState('');
  const [requirements, setRequirements] = useState('');
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [createdQuotation, setCreatedQuotation] = useState(null);
  const [copied, setCopied] = useState(false);

  const original = quotations.find(q => q.id === originalId) || null;

  useEffect(() => {
    let alive = true;
    Promise.all([
      api('/quotations'),
      api('/packages'),
      api('/inventory/accommodations?limit=200'),
      api('/inventory/activities?limit=200'),
      api('/inventory/transport?limit=200'),
      api('/inventory/rate-plans?limit=300'),
    ]).then(([q, p, a, e, t, r]) => {
      if (!alive) return;
      setQuotations(q.quotations || []);
      setPackages(p.packages || []);
      setInventory([
        ...(a.items || []).map(x => ({ ...x, serviceType: 'accommodation', resultType: 'inventory' })),
        ...(e.items || []).map(x => ({ ...x, serviceType: 'activity', resultType: 'inventory' })),
        ...(t.items || []).map(x => ({ ...x, serviceType: 'transport', resultType: 'inventory' })),
      ]);
      setRates(r.ratePlans || []);
    }).catch(e => { if (alive) setLoadingError(e.message); })
      .finally(() => { if (alive) setLoadingData(false); });
    return () => { alive = false; };
  }, []);

  const catalogue = useMemo(() => {
    return [
      ...packages.filter(p => p.status !== 'archived').map(p => ({ ...p, resultType: 'package' })),
      ...inventory.filter(x => x.status !== 'archived').map(item => {
        const rate = rateFor(item, rates, original);
        return {
          ...item,
          rate,
          sellingGuidePrice: rate ? rate.sellingGuidePrice : item.sellingGuidePrice,
          netCost: rate ? rate.netCost : item.netCost,
          currency: (rate && rate.currency) || item.currency || 'INR',
        };
      }),
    ];
  }, [packages, inventory, rates, original]);

  const runSearch = () => {
    const budget = parseBudget(requirements);
    const words = cleanWords(requirements + ' ' + (original && original.destination || ''));
    const found = catalogue.filter(item => {
      const hay = textOf([
        item.name, item.title, item.destination, item.description, item.propertyType,
        item.activityType, item.vehicleType, item.serviceType, item.category,
      ].join(' '));
      const matchesWords = !words.length || words.some(w => hay.includes(w));
      const price = getPrice(item);
      const withinBudget = budget == null || (price != null && number(price) <= budget);
      return matchesWords && withinBudget;
    }).sort((a, b) => {
      const aPrice = getPrice(a), bPrice = getPrice(b);
      if (budget != null && aPrice != null && bPrice != null) return number(aPrice) - number(bPrice);
      return 0;
    }).slice(0, 40);
    setResults({ items: found, budget, query: requirements });
    setSelected([]);
    setCreatedQuotation(null);
  };

  const addItem = (item) => {
    const id = item.id;
    if (!id || selected.some(x => x.sourceId === id)) return;
    const price = getPrice(item);
    const cost = getCost(item);
    setSelected(cur => [...cur, {
      sourceId: id,
      name: item.name || item.title || 'Travel service',
      category: categoryFor(item),
      description: [item.destination, item.description].filter(Boolean).join(' · ').slice(0, 300),
      quantity: 1,
      unitCost: cost == null ? 0 : number(cost),
      sellingPrice: price == null ? 0 : number(price),
      priceKnown: price != null,
      costKnown: cost != null,
      currency: item.currency || 'INR',
      rateValidity: item.rate ? [item.rate.validFrom, item.rate.validTo].filter(Boolean).join(' – ') : '',
      sourceType: item.resultType,
    }]);
  };

  const updateLine = (sourceId, field, value) => {
    setSelected(cur => cur.map(line => {
      if (line.sourceId !== sourceId) return line;
      const next = { ...line, [field]: field === 'quantity' ? Math.max(1, number(value, 1)) : Math.max(0, number(value, 0)) };
      if (field === 'sellingPrice') next.priceKnown = value !== '';
      if (field === 'unitCost') next.costKnown = value !== '';
      return next;
    }));
  };
  const removeLine = (sourceId) => setSelected(cur => cur.filter(x => x.sourceId !== sourceId));

  const totals = useMemo(() => {
    const selling = selected.reduce((sum, x) => sum + x.quantity * x.sellingPrice, 0);
    const cost = selected.reduce((sum, x) => sum + x.quantity * x.unitCost, 0);
    return { selling, cost, profit: selling - cost, margin: selling > 0 ? ((selling - cost) / selling) * 100 : 0 };
  }, [selected]);

  const message = useMemo(() => {
    if (!selected.length) return '';
    return [
      'I have prepared an alternative based on your preferences:',
      ...selected.map((x, i) => (i + 1) + '. ' + x.name + ' — ' + money(x.quantity * x.sellingPrice, x.currency)),
      'Total indicative price: ' + money(totals.selling, selected[0].currency || 'INR'),
      'I will confirm supplier availability and final details before booking.',
    ].join('\n\n');
  }, [selected, totals.selling]);

  const copyMessage = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Customer message copied');
    } catch { toast.error('Could not copy the message'); }
  };

  const createAlternative = async () => {
    if (!original) {
      toast.error('Choose the original quotation first');
      return;
    }
    if (!selected.length) {
      toast.error('Add at least one alternative service');
      return;
    }
    if (selected.some(x => !x.priceKnown)) {
      toast.error('Enter a selling price for every selected service before saving');
      return;
    }
    setSaving(true);
    try {
      const body = {
        customerType: original.customerType || 'client',
        customerId: original.customerId,
        destination: original.destination,
        startDate: original.startDate || '',
        endDate: original.endDate || '',
        adults: number(original.adults),
        children: number(original.children),
        rooms: number(original.rooms),
        nights: number(original.nights),
        items: selected.map(x => ({
          category: x.category,
          description: x.description || x.name,
          quantity: x.quantity,
          unitCost: x.unitCost,
          sellingPrice: x.sellingPrice,
        })),
        discount: { type: 'fixed', value: 0 },
        tax: { percent: number(original.tax && original.tax.percent) },
        internalNotes: 'Sales Rescue alternative to ' + (original.quotationNumber || original.id) + '. Original quotation was not changed. Review supplier costs and availability before sending.',
        customerNotes: original.customerNotes || '',
      };
      const data = await api('/quotations', { method: 'POST', body: JSON.stringify(body) });
      setCreatedQuotation(data.quotation);
      toast.success('Alternative saved as a new draft quotation');
    } catch (e) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const activeCount = inventory.filter(x => x.status !== 'archived').length;
  const pricedCount = catalogue.filter(x => getPrice(x) != null).length;

  return <div className="space-y-5">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white sm:p-8">
      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100"><Sparkles className="h-3.5 w-3.5" /> Sales conversion workspace</div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Sales Rescue</h2>
        <p className="mt-2 text-sm leading-6 text-indigo-100/80">Turn a price objection or unavailable option into a carefully priced alternative. Keep the original quotation intact and save a separate draft for approval.</p>
      </div>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Saved quotations</div><div className="mt-1 text-2xl font-bold">{loadingData ? '—' : quotations.length}</div><div className="mt-1 text-xs text-muted-foreground">Available as a starting point</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Active supply items</div><div className="mt-1 text-2xl font-bold">{loadingData ? '—' : activeCount}</div><div className="mt-1 text-xs text-muted-foreground">Agency catalogue</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Priced options</div><div className="mt-1 text-2xl font-bold">{loadingData ? '—' : pricedCount}</div><div className="mt-1 text-xs text-muted-foreground">Have a selling guide price</div></CardContent></Card>
    </div>

    <Card><CardContent className="space-y-4 p-4 sm:p-6">
      <div><h3 className="font-semibold">1. Choose the original quotation</h3><p className="text-sm text-muted-foreground">This links the alternative to the same customer and trip. The original quotation will never be overwritten.</p></div>
      <div className="space-y-1.5">
        <Label>Original quotation</Label>
        <select value={originalId} onChange={e => { setOriginalId(e.target.value); setResults(null); setSelected([]); setCreatedQuotation(null); }} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">Select a quotation…</option>
          {quotations.map(q => <option key={q.id} value={q.id}>{q.quotationNumber || 'Quotation'} · {q.customerName || 'Customer'} · {q.destination || 'Trip'} · {money(q.grandTotal, q.currency || 'INR')}</option>)}
        </select>
        {original && <div className="rounded-xl border bg-muted/30 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{original.quotationNumber} · {original.customerName}</span><Badge variant="outline">{original.status}</Badge></div>
          <div className="mt-1 text-muted-foreground">{original.destination} {original.startDate ? '· ' + original.startDate : ''}{original.endDate ? ' to ' + original.endDate : ''}</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>Original total: {money(original.grandTotal, original.currency || 'INR')}</span><span>Expected profit: {money(original.expectedProfit, original.currency || 'INR')}</span><span>{number(original.adults)} adults · {number(original.children)} children</span></div>
        </div>}
      </div>
      <div className="space-y-1.5"><Label>What does the customer need changed?</Label><Textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="e.g. Under ₹50,000, keep the same dates, family-friendly hotel, private SUV, include Gulmarg…" rows={3} /></div>
      <div className="flex flex-wrap gap-2">{['Under ₹50,000','Lower-cost hotel','Houseboat option','Private SUV','Family friendly','Include Gulmarg'].map(v => <button key={v} type="button" onClick={() => setRequirements(cur => cur ? cur + ', ' + v : v)} className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">{v}</button>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">{loadingData ? 'Loading your agency catalogue…' : loadingError ? 'Catalogue could not be loaded' : quotations.length + ' quotations · ' + packages.length + ' packages · ' + activeCount + ' active supply items'}</div>
        <Button onClick={runSearch} disabled={loadingData || !!loadingError}><Search className="mr-2 h-4 w-4" />Find alternatives</Button>
      </div>
      {loadingError && <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{loadingError}</div>}
    </CardContent></Card>

    {results && <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">2. Choose replacement services</h3><p className="text-sm text-muted-foreground">{results.items.length} matching options from your agency catalogue{results.budget != null ? ' · budget up to ' + money(results.budget) : ''}</p></div><Badge variant="outline">Guide prices only</Badge></div>
      {!results.items.length ? <Card><CardContent className="p-10 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground" /><h4 className="mt-3 font-semibold">No matching alternatives found</h4><p className="mt-1 text-sm text-muted-foreground">Try broader requirements or add more supplier inventory and rates.</p><Button variant="outline" className="mt-4" onClick={() => onNavigate('supply-hub')}>Open Supply Hub</Button></CardContent></Card> :
        <div className="grid gap-3 lg:grid-cols-2">{results.items.map((item, idx) => {
          const chosen = selected.some(x => x.sourceId === item.id);
          const price = getPrice(item);
          const cost = getCost(item);
          const type = categoryFor(item);
          const Icon = type === 'Transport' ? Car : type === 'Package' ? Package : BedDouble;
          return <Card key={item.id || idx} className={chosen ? 'border-violet-400 ring-1 ring-violet-200' : ''}><CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="rounded-xl bg-violet-50 p-2 text-violet-700"><Icon className="h-5 w-5" /></div><div className="min-w-0"><div className="font-semibold">{item.name || item.title}</div><div className="mt-1 text-xs text-muted-foreground">{item.destination || item.description || type}</div></div></div><Badge variant="secondary">{type}</Badge></div>
            <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs text-muted-foreground">Selling guide price</div><div className="text-xl font-bold">{price == null ? 'Not set' : money(price, item.currency || 'INR')}</div>{cost != null && <div className="text-xs text-muted-foreground">Supplier cost: {money(cost, item.currency || 'INR')}</div>}</div>
              <Button size="sm" variant={chosen ? 'secondary' : 'outline'} onClick={() => chosen ? removeLine(item.id) : addItem(item)} disabled={!item.id}>{chosen ? <><CheckCircle2 className="mr-1 h-4 w-4" />Added</> : <><Plus className="mr-1 h-4 w-4" />Add option</>}</Button>
            </div>
            {item.rate && <div className="text-xs text-muted-foreground">Rate validity: {item.rate.validFrom || '—'} to {item.rate.validTo || '—'} · not live availability.</div>}
          </CardContent></Card>;
        })}</div>}
    </div>}

    {!!selected.length && <div className="space-y-4">
      <div><h3 className="text-lg font-semibold">3. Build and price the alternative</h3><p className="text-sm text-muted-foreground">Review each quantity, supplier cost and selling price before creating the draft.</p></div>
      <Card><CardContent className="divide-y p-0">
        {selected.map((line, i) => <div key={line.sourceId} className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3"><div><div className="font-semibold">{line.name}</div><div className="text-xs text-muted-foreground">{line.category} · {line.sourceType === 'package' ? 'Saved package' : 'Agency inventory'}</div></div><button onClick={() => removeLine(line.sourceId)} className="rounded-lg p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600" aria-label="Remove line"><X className="h-4 w-4" /></button></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">Quantity<input type="number" min="1" value={line.quantity} onChange={e => updateLine(line.sourceId, 'quantity', e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground" /></label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">Supplier cost / unit<input type="number" min="0" step="0.01" value={line.unitCost} onChange={e => updateLine(line.sourceId, 'unitCost', e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground" /></label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">Selling price / unit<input type="number" min="0" step="0.01" value={line.sellingPrice} onChange={e => updateLine(line.sourceId, 'sellingPrice', e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground" /></label>
          </div>
          {(!line.costKnown || !line.priceKnown) && <div className="text-xs text-amber-700">{!line.costKnown ? 'Supplier cost is not in the saved rate plan. ' : ''}{!line.priceKnown ? 'Enter a selling price to save this quotation.' : ''}</div>}
          <div className="text-right text-sm font-semibold">{money(line.quantity * line.sellingPrice, line.currency)}</div>
        </div>)}
      </CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Alternative selling total</div><div className="mt-1 text-xl font-bold">{money(totals.selling, selected[0].currency)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Estimated supplier cost</div><div className="mt-1 text-xl font-bold">{money(totals.cost, selected[0].currency)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Estimated gross profit</div><div className={'mt-1 text-xl font-bold ' + (totals.profit < 0 ? 'text-rose-600' : 'text-emerald-700')}>{money(totals.profit, selected[0].currency)}</div><div className="text-xs text-muted-foreground">{totals.margin.toFixed(1)}% margin before tax</div></CardContent></Card>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
        <div><div className="font-semibold">Save a separate draft quotation</div><p className="text-sm text-muted-foreground">The original quote remains unchanged. Review the new draft before sending it to the customer.</p></div>
        <Button onClick={createAlternative} disabled={saving || !original || selected.some(x => !x.priceKnown)}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}{saving ? 'Saving…' : 'Create alternative draft'}</Button>
      </div>
      <Card><CardContent className="space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-semibold">Customer message preview</div><p className="text-xs text-muted-foreground">Indicative wording — confirm availability before sending.</p></div><Button size="sm" variant="outline" onClick={copyMessage}><Clipboard className="mr-2 h-4 w-4" />{copied ? 'Copy again' : 'Copy message'}</Button></div><pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{message}</pre></CardContent></Card>
    </div>}

    {createdQuotation && <Card className="border-emerald-200 bg-emerald-50/50"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" /><div><div className="font-semibold text-emerald-900">Alternative draft created: {createdQuotation.quotationNumber}</div><p className="text-sm text-emerald-800">New total: {money(createdQuotation.grandTotal, original && original.currency || 'INR')}. Your original quotation has not been changed.</p></div></div><Button onClick={() => onNavigate('quotations')} variant="outline">Open quotations <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card>}

    <div className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />This version searches only your agency's saved packages, inventory and rate plans. It does not claim live supplier availability or automatically book services. Check date validity, supplier cost and availability before sending a firm offer. Sales Rescue creates a separate draft quotation and never edits the original.</div>
  </div>;
}
