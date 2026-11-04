'use client';
// Agency-scoped SafarCurated dashboard, opened from SafarOS via a signed one-time ticket.
// All data is filtered server-side (/api/integrations/safaros/me) to the signed-in agency only.
import { useCallback, useEffect, useState } from 'react';
import { Loader2, ExternalLink, AlertTriangle, CheckCircle2, Clock, XCircle, EyeOff, ArrowLeft, Link2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS = {
  pending: { label: 'Pending approval', cls: 'bg-amber-50 text-amber-800 border-amber-200', Icon: Clock },
  approved: { label: 'Published', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-800 border-red-200', Icon: XCircle },
  unpublished: { label: 'Unpublished', cls: 'bg-slate-50 text-slate-700 border-slate-200', Icon: EyeOff },
};

const api = async (path, opts = {}) => {
  const r = await fetch(`/api/integrations/safaros/${path}`, { credentials: 'same-origin', cache: 'no-store', ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
};

const SafarOSAgencyDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try { setData(await api('me')); setError(''); } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    (async () => {
      const ticket = new URLSearchParams(window.location.search).get('ticket');
      if (ticket) {
        window.history.replaceState({}, '', '/dashboard/safaros'); // never leave the ticket in the address bar
        try { await api('sso', { method: 'POST', body: JSON.stringify({ ticket }) }); } catch (e) { setError(e.message); return; }
      }
      load();
    })();
  }, [load]);

  const act = async (key, path) => {
    setBusy(key);
    try { await api(path, { method: 'POST', body: '{}' }); await load(); } catch (e) { setError(e.message); } finally { setBusy(''); }
  };

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-8 text-center shadow-sm" data-testid="safaros-dashboard-error">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Cannot open agency dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#0F3D2E]" /></div>;

  const listings = (data.listings || []).filter((l) => filter === 'all' || l.status === filter);
  const pendingLink = data.agency?.linkStatus === 'pending_confirmation';

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#0F3D2E]/70">SafarCurated · Agency dashboard</p>
            <h1 className="text-2xl font-semibold text-slate-900" data-testid="safaros-agency-name">{data.agency?.name || 'Your agency'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {data.returnUrl && <Button variant="outline" asChild data-testid="back-to-safaros"><a href={data.returnUrl}><ArrowLeft className="mr-2 h-4 w-4" />Manage packages in SafarOS</a></Button>}
            <Button variant="ghost" onClick={() => act('logout', 'me/logout').then(() => window.location.assign('/'))} data-testid="safaros-logout"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {!data.connected && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">The SafarOS connection is paused by the platform administrator. Your listings are preserved; changes are temporarily disabled.</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        {pendingLink ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm" data-testid="confirm-link-card">
            <div className="flex items-start gap-3">
              <Link2 className="mt-1 h-5 w-5 text-[#0F3D2E]" />
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Confirm your existing SafarCurated account</h2>
                <p className="text-sm text-slate-600">An account already exists for <b>{data.agency?.email}</b>. To protect it, sign in to SafarCurated with that account in this browser, then confirm the link. If it is a traveller account it will become an operator account; existing bookings and data are kept.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild><a href="/auth?redirect=/dashboard/safaros" target="_blank" rel="noreferrer">Sign in to SafarCurated</a></Button>
                  <Button onClick={() => act('confirm', 'me/confirm-link')} disabled={busy === 'confirm' || !data.connected} className="bg-[#0F3D2E] hover:bg-[#0F3D2E]/90" data-testid="confirm-link-btn">
                    {busy === 'confirm' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries(STATUS).map(([k, s]) => (
                <button key={k} type="button" onClick={() => setFilter(filter === k ? 'all' : k)} className={`rounded-xl border bg-white p-4 text-left transition hover:shadow-sm ${filter === k ? 'ring-2 ring-[#0F3D2E]' : ''}`} data-testid={`count-${k}`}>
                  <s.Icon className="h-4 w-4 text-slate-500" />
                  <p className="mt-2 text-2xl font-semibold">{data.counts?.[k] || 0}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </button>
              ))}
            </div>

            <section className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="font-semibold">My listings {filter !== 'all' && <span className="text-sm font-normal text-slate-500">· {STATUS[filter]?.label}</span>}</h2>
                <p className="text-xs text-slate-500">Drafts and edits are managed in SafarOS (source of truth).</p>
              </div>
              {listings.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-slate-500" data-testid="no-listings">No listings yet. Publish a marketplace package from SafarOS to see it here.</p>
              ) : (
                <ul className="divide-y">
                  {listings.map((l) => {
                    const s = STATUS[l.status] || STATUS.pending;
                    return (
                      <li key={l.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center" data-testid={`listing-${l.id}`}>
                        {l.image ? <img src={l.image} alt="" className="h-16 w-24 rounded-lg object-cover" /> : <div className="h-16 w-24 rounded-lg bg-slate-100" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900">{l.title}</p>
                          <p className="text-xs text-slate-500">{l.location}{l.duration ? ` · ${l.duration}` : ''} · ₹{Number(l.price || 0).toLocaleString('en-IN')}</p>
                          {l.status === 'rejected' && l.rejectionReason && <p className="mt-1 text-xs text-red-700">Feedback: {l.rejectionReason}</p>}
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${s.cls}`}><s.Icon className="h-3 w-3" />{s.label}</span>
                        <div className="flex gap-2">
                          {l.publicUrl && <Button size="sm" variant="outline" asChild><a href={l.publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-3.5 w-3.5" />View</a></Button>}
                          {['pending', 'approved'].includes(l.status) && ['owner', 'manager'].includes(data.operator?.role) && (
                            <Button size="sm" variant="ghost" disabled={busy === l.id || !data.connected} onClick={() => { if (window.confirm('Unpublish this listing from SafarCurated?')) act(l.id, `me/listings/${l.id}/unpublish`); }} data-testid={`unpublish-${l.id}`}>
                              {busy === l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Unpublish'}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default SafarOSAgencyDashboard;
