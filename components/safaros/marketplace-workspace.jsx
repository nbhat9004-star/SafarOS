'use client';
// SafarCurated Marketplace workspace (replaces the operator-facing Website Builder entry).
// Marketplace packages are public catalog products, kept separate from private client packages.
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Store, Link2, ExternalLink, RefreshCw, Plus, Eye, Send, EyeOff, AlertTriangle, CheckCircle2, Clock, XCircle, FileEdit, Trash2, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

async function request(path, options = {}) {
  const r = await fetch(`/api${path}`, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || 'Unable to complete the request'); e.issues = d.issues || []; throw e; }
  return d;
}

const PUB = {
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-700', Icon: FileEdit },
  pending: { label: 'Pending approval', cls: 'bg-amber-100 text-amber-800', Icon: Clock },
  approved: { label: 'Published', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700', Icon: XCircle },
  unpublished: { label: 'Unpublished', cls: 'bg-slate-100 text-slate-600', Icon: EyeOff },
  error: { label: 'Sync error', cls: 'bg-red-100 text-red-700', Icon: AlertTriangle },
};
const LINK = {
  linked: { label: 'Agency linked', cls: 'text-emerald-700' },
  pending_confirmation: { label: 'Awaiting confirmation on SafarCurated', cls: 'text-amber-700' },
  not_linked: { label: 'Not linked', cls: 'text-slate-500' },
};

const EMPTY = { name: '', destination: '', nights: '', startDate: '', endDate: '', description: '', price: '', currency: 'INR', seats: '', images: '', inclusions: '', exclusions: '', cancellationPolicy: '', itinerary: [] };
const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

function PackageForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setDay = (i, k, v) => setF((p) => ({ ...p, itinerary: p.itinerary.map((d, j) => (j === i ? { ...d, [k]: v } : d)) }));

  const save = async () => {
    setSaving(true); setError('');
    const body = {
      kind: 'marketplace', name: f.name, destination: f.destination, nights: f.nights, startDate: f.startDate, endDate: f.endDate, description: f.description,
      marketplace: { price: f.price, currency: f.currency, seats: f.seats, images: lines(f.images), inclusions: lines(f.inclusions), exclusions: lines(f.exclusions), cancellationPolicy: f.cancellationPolicy, itinerary: f.itinerary },
    };
    try {
      await request(f.id ? `/packages/${f.id}` : '/packages', { method: f.id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" data-testid="mp-package-form">
        <DialogHeader><DialogTitle>{f.id ? 'Edit marketplace package' : 'New marketplace package'}</DialogTitle></DialogHeader>
        <p className="text-xs text-slate-500">Public catalog package. No client, quotation or supplier-cost data is ever attached or sent to SafarCurated.{f.id ? ' Saving a submitted package automatically syncs it.' : ''}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Package title *</Label><Input value={f.name} onChange={set('name')} data-testid="mp-name" /></div>
          <div className="space-y-1.5"><Label>Destination *</Label><Input value={f.destination} onChange={set('destination')} data-testid="mp-destination" /></div>
          <div className="space-y-1.5"><Label>Nights</Label><Input type="number" min="0" value={f.nights} onChange={set('nights')} data-testid="mp-nights" /></div>
          <div className="space-y-1.5"><Label>Travel start date</Label><Input type="date" value={f.startDate} onChange={set('startDate')} /></div>
          <div className="space-y-1.5"><Label>Travel end date</Label><Input type="date" value={f.endDate} onChange={set('endDate')} /></div>
          <div className="space-y-1.5"><Label>Price per traveller *</Label><Input type="number" min="0" value={f.price} onChange={set('price')} data-testid="mp-price" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label>Currency</Label><Input maxLength={3} value={f.currency} onChange={set('currency')} /></div>
            <div className="space-y-1.5"><Label>Seats *</Label><Input type="number" min="0" value={f.seats} onChange={set('seats')} data-testid="mp-seats" /></div>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Description *</Label><Textarea rows={4} value={f.description} onChange={set('description')} data-testid="mp-description" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Image URLs * (https, one per line)</Label><Textarea rows={2} value={f.images} onChange={set('images')} data-testid="mp-images" /></div>
          <div className="space-y-1.5"><Label>Inclusions (one per line)</Label><Textarea rows={3} value={f.inclusions} onChange={set('inclusions')} /></div>
          <div className="space-y-1.5"><Label>Exclusions (one per line)</Label><Textarea rows={3} value={f.exclusions} onChange={set('exclusions')} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Cancellation policy *</Label><Textarea rows={2} value={f.cancellationPolicy} onChange={set('cancellationPolicy')} data-testid="mp-policy" /></div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between"><Label>Day-by-day itinerary</Label><Button type="button" size="sm" variant="outline" onClick={() => setF((p) => ({ ...p, itinerary: [...p.itinerary, { title: '', description: '' }] }))}><Plus className="mr-1 h-3.5 w-3.5" />Add day</Button></div>
            {f.itinerary.map((d, i) => (
              <div key={i} className="flex gap-2 rounded-lg border p-2">
                <span className="mt-2 w-12 shrink-0 text-xs font-medium text-slate-500">Day {i + 1}</span>
                <div className="flex-1 space-y-1.5"><Input placeholder="Title" value={d.title} onChange={(e) => setDay(i, 'title', e.target.value)} /><Textarea rows={2} placeholder="Details" value={d.description} onChange={(e) => setDay(i, 'description', e.target.value)} /></div>
                <Button type="button" size="icon" variant="ghost" onClick={() => setF((p) => ({ ...p, itinerary: p.itinerary.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving} data-testid="mp-save">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ data, onClose }) {
  const l = data?.listing || {};
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" data-testid="mp-preview">
        <DialogHeader><DialogTitle>Listing preview</DialogTitle></DialogHeader>
        {data?.issues?.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-medium">Required before publishing:</p><ul className="ml-4 list-disc">{data.issues.map((i) => <li key={i}>{i}</li>)}</ul></div>}
        {l.images?.[0] && <img src={l.images[0]} alt="" className="h-52 w-full rounded-xl object-cover" />}
        <div><h3 className="text-xl font-semibold">{l.title}</h3><p className="text-sm text-slate-500">{l.location}{l.duration ? ` · ${l.duration}` : ''} · {l.agency?.name}</p></div>
        <p className="text-lg font-semibold">{l.currency} {Number(l.price || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">per traveller · {l.seats || 0} seats</span></p>
        <p className="whitespace-pre-line text-sm text-slate-700">{l.description}</p>
        {[['Inclusions', l.inclusions], ['Exclusions', l.exclusions]].map(([t, arr]) => arr?.length > 0 && <div key={t}><p className="text-sm font-medium">{t}</p><ul className="ml-4 list-disc text-sm text-slate-600">{arr.map((x) => <li key={x}>{x}</li>)}</ul></div>)}
        {l.itinerary?.length > 0 && <div><p className="text-sm font-medium">Itinerary</p>{l.itinerary.map((d) => <p key={d.day} className="text-sm text-slate-600"><b>Day {d.day}:</b> {d.title} {d.description && `— ${d.description}`}</p>)}</div>}
        {l.cancellationPolicy && <div><p className="text-sm font-medium">Cancellation policy</p><p className="text-sm text-slate-600">{l.cancellationPolicy}</p></div>}
        <DialogFooter><Button onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MarketplaceWorkspace = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    try { setData(await request('/marketplace/overview')); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (key, fn, okMsg) => {
    setBusy(key); setError(''); setNotice('');
    try { await fn(); if (okMsg) setNotice(okMsg); } catch (e) { setError(e.issues?.length ? `${e.message}: ${e.issues.join('; ')}` : e.message); } finally { setBusy(''); load(); }
  };
  const sso = () => run('sso', async () => { const r = await request('/marketplace/sso', { method: 'POST', body: '{}' }); window.open(r.url, '_blank', 'noopener'); });
  const editPkg = (p) => setForm({ ...EMPTY, ...p, nights: p.nights || '', price: p.marketplace?.price || '', currency: p.marketplace?.currency || 'INR', seats: p.marketplace?.seats || '',
    images: (p.marketplace?.images || []).join('\n'), inclusions: (p.marketplace?.inclusions || []).join('\n'), exclusions: (p.marketplace?.exclusions || []).join('\n'),
    cancellationPolicy: p.marketplace?.cancellationPolicy || '', itinerary: p.marketplace?.itinerary || [] });

  if (!data && !error) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div>;
  if (!data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;

  const { integration, link, counts = {}, packages = [], errors = [], canPublish, canLink } = data;
  const linkInfo = LINK[link?.status] || LINK.not_linked;
  const ready = integration.available && link?.status === 'linked';

  return (
    <div className="space-y-6" data-testid="marketplace-workspace">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-700"><Store className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">SafarCurated Marketplace</h2>
              <p className="text-sm text-slate-500">Publish packages to SafarCurated.com. Listings are reviewed by SafarCurated before going live.</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className={integration.available ? 'text-emerald-700' : 'text-red-600'} data-testid="mp-connection-status"><PlugZap className="mr-1 inline h-4 w-4" />{integration.available ? 'Connected' : (integration.reason || 'Not connected')}</span>
                <span className={linkInfo.cls} data-testid="mp-link-status"><Link2 className="mr-1 inline h-4 w-4" />{linkInfo.label}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canLink && link?.status !== 'linked' && <Button onClick={() => run('link', () => request('/marketplace/link', { method: 'POST', body: '{}' }), 'Agency link request sent to SafarCurated.')} disabled={!integration.available || busy === 'link'} data-testid="mp-link-btn">{busy === 'link' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}{link?.status === 'pending_confirmation' ? 'Re-check link' : 'Link agency'}</Button>}
            <Button variant="outline" onClick={sso} disabled={!integration.available || link?.status === 'not_linked' || !link?.status || busy === 'sso'} data-testid="mp-open-dashboard"><ExternalLink className="mr-2 h-4 w-4" />{link?.status === 'pending_confirmation' ? 'Confirm on SafarCurated' : 'List on SafarCurated'}</Button>
            <Button variant="outline" onClick={() => run('sync', () => request('/marketplace/sync', { method: 'POST', body: '{}' }), 'Statuses refreshed from SafarCurated.')} disabled={!integration.available || busy === 'sync'} data-testid="mp-sync-btn"><RefreshCw className={`mr-2 h-4 w-4 ${busy === 'sync' ? 'animate-spin' : ''}`} />Refresh statuses</Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="mp-error">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {Object.entries(PUB).map(([k, s]) => (
          <div key={k} className="rounded-xl border bg-white p-4" data-testid={`mp-count-${k}`}><s.Icon className="h-4 w-4 text-slate-400" /><p className="mt-2 text-2xl font-semibold">{counts[k] || 0}</p><p className="text-xs text-slate-500">{s.label}</p></div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-semibold">Marketplace packages</h3>
          {canPublish && <Button size="sm" onClick={() => setForm({ ...EMPTY })} data-testid="mp-new-package"><Plus className="mr-1 h-4 w-4" />New marketplace package</Button>}
        </div>
        {packages.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No marketplace packages yet. Private client packages are never shown or published here.</p>
        ) : (
          <ul className="divide-y">
            {packages.map((p) => {
              const st = PUB[p.publication?.status] || PUB.draft; const pub = p.publication || {};
              const live = ['pending', 'approved', 'rejected'].includes(pub.status);
              return (
                <li key={p.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center" data-testid={`mp-pkg-${p.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.destination}{p.nights ? ` · ${p.nights} nights` : ''} · {p.marketplace?.currency} {Number(p.marketplace?.price || 0).toLocaleString()} · {p.marketplace?.seats || 0} seats{pub.lastSyncedAt ? ` · synced ${new Date(pub.lastSyncedAt).toLocaleString()}` : ''}</p>
                    {pub.status === 'rejected' && pub.rejectionReason && <p className="mt-1 text-xs text-red-700">SafarCurated feedback: {pub.rejectionReason}</p>}
                    {pub.lastError && <p className="mt-1 text-xs text-red-600"><AlertTriangle className="mr-1 inline h-3 w-3" />{pub.lastError}</p>}
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}><st.Icon className="h-3 w-3" />{st.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {canPublish && <Button size="sm" variant="ghost" onClick={() => editPkg(p)}><FileEdit className="mr-1 h-3.5 w-3.5" />Edit</Button>}
                    <Button size="sm" variant="ghost" onClick={() => run('pv' + p.id, async () => setPreview(await request(`/marketplace/packages/${p.id}/preview`)))}><Eye className="mr-1 h-3.5 w-3.5" />Preview</Button>
                    {canPublish && (
                      <Button size="sm" disabled={!ready || busy === 'pub' + p.id} onClick={() => { if (window.confirm(`${pub.listingId ? 'Resubmit' : 'Publish'} "${p.name}" to SafarCurated? It will be reviewed by SafarCurated before going live.`)) run('pub' + p.id, () => request(`/marketplace/packages/${p.id}/publish`, { method: 'POST', body: '{}' }), 'Submitted to SafarCurated.'); }} data-testid={`mp-publish-${p.id}`}>
                        {busy === 'pub' + p.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}{pub.lastError && pub.listingId ? 'Retry sync' : pub.listingId ? 'Republish' : 'Publish'}
                      </Button>
                    )}
                    {canPublish && live && <Button size="sm" variant="outline" disabled={!integration.available || busy === 'un' + p.id} onClick={() => { if (window.confirm(`Unpublish "${p.name}" from SafarCurated?`)) run('un' + p.id, () => request(`/marketplace/packages/${p.id}/unpublish`, { method: 'POST', body: '{}' }), 'Unpublished.'); }} data-testid={`mp-unpublish-${p.id}`}><EyeOff className="mr-1 h-3.5 w-3.5" />Unpublish</Button>}
                    {pub.publicUrl && <Button size="sm" variant="outline" asChild><a href={pub.publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-3.5 w-3.5" />View on SafarCurated</a></Button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {errors.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Recent publication errors</h3>
          <ul className="space-y-1.5 text-sm">{errors.map((e, i) => <li key={i} className="text-slate-600"><span className="text-slate-400">{new Date(e.at).toLocaleString()}</span> · {e.action} · <span className="text-red-600">{e.error}</span></li>)}</ul>
        </div>
      )}

      {form && <PackageForm initial={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
      {preview && <PreviewDialog data={preview} onClose={() => setPreview(null)} />}
    </div>
  );
};

export default MarketplaceWorkspace;
