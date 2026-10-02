'use client';

import { useEffect, useState } from 'react';

const money = (n, c = 'INR') => `${c === 'INR' ? '₹' : ''}${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

async function papi(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Request failed'); e.status = res.status; throw e; }
  return data;
}

const STATUS_CLS = {
  paid: 'bg-emerald-100 text-emerald-700', completed: 'bg-emerald-100 text-emerald-700',
  partially_paid: 'bg-amber-100 text-amber-700', pending: 'bg-amber-100 text-amber-700',
  issued: 'bg-sky-100 text-sky-700', draft: 'bg-slate-100 text-slate-600',
  overdue: 'bg-rose-100 text-rose-700', cancelled: 'bg-rose-100 text-rose-700', confirmed: 'bg-emerald-100 text-emerald-700',
};
const Badge = ({ s }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLS[s] || 'bg-slate-100 text-slate-600'}`}>{String(s || '').replace(/_/g, ' ')}</span>;
const Empty = ({ children }) => <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center text-sm text-slate-500">{children}</div>;
const Spin = () => <div className="h-28 animate-pulse rounded-xl border border-slate-100 bg-white/70" />;

function Login({ onDone }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await papi('/portal/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); onDone(); }
    catch (x) { setErr(x.message || 'Unable to sign in'); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-sky-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold text-white">S</div>
          <h1 className="text-2xl font-bold text-slate-900">Your Travel Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to view your trips, invoices and payments.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-violet-100/40">
          {err && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder="you@email.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">Access is provided by your travel agency. Contact them if you need a login.</p>
      </div>
    </div>
  );
}

const Card = ({ title, children, right }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    {(title || right) && <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-slate-800">{title}</h3>{right}</div>}
    {children}
  </div>
);

function Overview({ cur }) {
  const [d, setD] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const r = await papi('/portal/dashboard'); setD(r.dashboard); } catch { /* */ } finally { setLoading(false); } })(); }, []);
  if (loading) return <div className="grid gap-4 sm:grid-cols-2"><Spin /><Spin /><Spin /><Spin /></div>;
  if (!d) return <Empty>Nothing to show yet.</Empty>;
  const c = d.currency || cur;
  const stats = [
    { label: 'Trips', value: d.counts.bookings },
    { label: 'Quotations', value: d.counts.quotations },
    { label: 'Outstanding', value: money(d.outstandingAmount, c) },
    { label: 'Paid to date', value: money(d.paidTotal, c) },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="text-xl font-bold text-slate-900">{s.value}</div><div className="mt-1 text-xs text-slate-500">{s.label}</div></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Upcoming trip">
          {d.upcomingTrip ? (<div className="space-y-1"><div className="text-lg font-semibold text-slate-900">{d.upcomingTrip.destination}</div><div className="text-sm text-slate-500">{d.upcomingTrip.bookingNumber} · {d.upcomingTrip.startDate || 'TBD'} → {d.upcomingTrip.endDate || 'TBD'}</div><div className="pt-1"><Badge s={d.upcomingTrip.status} /></div></div>) : <Empty>No upcoming trips.</Empty>}
        </Card>
        <Card title="Latest quotation">
          {d.latestQuotation ? (<div className="space-y-1"><div className="text-lg font-semibold text-slate-900">{d.latestQuotation.destination}</div><div className="text-sm text-slate-500">{d.latestQuotation.quotationNumber} · {money(d.latestQuotation.total, c)}</div><div className="pt-1"><Badge s={d.latestQuotation.status} /></div></div>) : <Empty>No quotations yet.</Empty>}
        </Card>
        <Card title="Recent payments">
          {d.recentPayments && d.recentPayments.length ? (<ul className="divide-y divide-slate-100">{d.recentPayments.map((p) => <li key={p.id} className="flex items-center justify-between py-2 text-sm"><span className="text-slate-600">{p.paymentDate} · {p.paymentNumber}</span><span className="font-medium text-emerald-700">{money(p.amount, c)}</span></li>)}</ul>) : <Empty>No payments recorded.</Empty>}
        </Card>
        <Card title="Recent messages">
          {d.recentCommunications && d.recentCommunications.length ? (<ul className="space-y-2">{d.recentCommunications.map((m) => <li key={m.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"><div className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()} · {m.channel}</div>{m.subject && <div className="font-medium text-slate-700">{m.subject}</div>}<div className="whitespace-pre-wrap">{m.message}</div></li>)}</ul>) : <Empty>No messages yet.</Empty>}
        </Card>
      </div>
    </div>
  );
}

function ListSection({ path, render, empty, cur }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { (async () => { try { const r = await papi(path.url); setRows(r[path.key] || []); } catch { setRows([]); } })(); }, []);
  if (rows === null) return <div className="space-y-3"><Spin /><Spin /></div>;
  if (!rows.length) return <Empty>{empty}</Empty>;
  return <div className="space-y-3">{rows.map((r) => render(r, cur))}</div>;
}

function Profile({ customer, onUpdate }) {
  const [name, setName] = useState(customer.name || ''); const [phone, setPhone] = useState(customer.phone || '');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const save = async () => { setBusy(true); setMsg(''); try { const r = await papi('/portal/profile', { method: 'PUT', body: JSON.stringify({ name, phone }) }); onUpdate(r.customer); setMsg('Saved'); } catch (e) { setMsg(e.message); } finally { setBusy(false); } };
  return (
    <Card title="Your profile">
      <div className="grid max-w-md gap-3">
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Email</label><input value={customer.email || ''} disabled className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-400" /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-700">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /></div>
        <div className="flex items-center gap-3"><button onClick={save} disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>{msg && <span className="text-sm text-slate-500">{msg}</span>}</div>
      </div>
    </Card>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Trips' },
  { id: 'quotations', label: 'Quotations' },
  { id: 'itineraries', label: 'Itineraries' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'payments', label: 'Payments' },
  { id: 'messages', label: 'Messages' },
  { id: 'profile', label: 'Profile' },
];

export default function PortalPage() {
  const [authed, setAuthed] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [tab, setTab] = useState('overview');
  const cur = 'INR';

  const loadMe = async () => { try { const r = await papi('/portal/me'); setCustomer(r.customer); setAuthed(true); } catch { setAuthed(false); } };
  useEffect(() => { loadMe(); }, []);
  const logout = async () => { try { await papi('/portal/auth/logout', { method: 'POST' }); } catch { /* */ } setAuthed(false); setCustomer(null); };

  if (authed === null) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-400">Loading…</div>;
  if (!authed) return <Login onDone={loadMe} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 font-bold text-white">S</div>
            <div><div className="text-sm font-semibold text-slate-900">Travel Portal</div><div className="text-xs text-slate-500">{customer?.name}</div></div>
          </div>
          <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Sign out</button>
        </div>
        <div className="mx-auto max-w-5xl overflow-x-auto px-4">
          <div className="flex gap-1 pb-2">
            {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${tab === t.id ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{t.label}</button>)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === 'overview' && <Overview cur={cur} />}

        {tab === 'bookings' && <ListSection cur={cur} path={{ url: '/portal/bookings', key: 'bookings' }} empty="You have no trips yet." render={(b, c) => (
          <Card key={b.id}>
            <div className="flex items-start justify-between gap-2">
              <div><div className="text-lg font-semibold text-slate-900">{b.destination}</div><div className="text-sm text-slate-500">{b.bookingNumber} · {b.startDate || 'TBD'} → {b.endDate || 'TBD'}{b.nights ? ` · ${b.nights} nights` : ''}</div></div>
              <Badge s={b.status} />
            </div>
            {b.services && b.services.length > 0 && <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">{b.services.map((s, i) => <li key={i} className="flex justify-between"><span>{s.name}{s.quantity ? ` × ${s.quantity}` : ''}</span><span>{money(s.total, c)}</span></li>)}</ul>}
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm"><span className="text-slate-500">Trip total</span><span className="font-semibold text-slate-900">{money(b.total, c)}</span></div>
          </Card>
        )} />}

        {tab === 'quotations' && <ListSection cur={cur} path={{ url: '/portal/quotations', key: 'quotations' }} empty="No quotations yet." render={(q, c) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-2"><div><div className="text-lg font-semibold text-slate-900">{q.destination}</div><div className="text-sm text-slate-500">{q.quotationNumber} · {q.startDate || 'TBD'} → {q.endDate || 'TBD'}</div></div><Badge s={q.status} /></div>
            {q.items && q.items.length > 0 && <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">{q.items.map((it, i) => <li key={i} className="flex justify-between"><span>{it.name}{it.quantity ? ` × ${it.quantity}` : ''}</span><span>{money(it.total, c)}</span></li>)}</ul>}
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm"><span className="text-slate-500">Total</span><span className="font-semibold text-slate-900">{money(q.total, c)}</span></div>
          </Card>
        )} />}

        {tab === 'itineraries' && <ListSection cur={cur} path={{ url: '/portal/itineraries', key: 'itineraries' }} empty="No itineraries shared yet." render={(it) => (
          <Card key={it.id} title={it.title || it.destination}>
            <div className="mb-3 text-sm text-slate-500">{it.startDate || ''} {it.endDate ? `→ ${it.endDate}` : ''}</div>
            <div className="space-y-3">{(it.days || []).map((d) => (
              <div key={d.dayNumber} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">{d.dayNumber}</span><span className="font-medium text-slate-800">{d.title || d.location || `Day ${d.dayNumber}`}</span>{d.date && <span className="text-xs text-slate-400">{d.date}</span>}</div>
                {d.description && <p className="mt-2 text-sm text-slate-600">{d.description}</p>}
                {d.activities && d.activities.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{d.activities.map((a, i) => <li key={i}>{a.name}{a.location ? ` — ${a.location}` : ''}</li>)}</ul>}
                {d.accommodation && d.accommodation.name && <div className="mt-2 text-sm text-slate-500">Stay: {d.accommodation.name}{d.accommodation.location ? `, ${d.accommodation.location}` : ''}</div>}
                {d.transport && d.transport.type && <div className="text-sm text-slate-500">Transport: {d.transport.type}</div>}
              </div>
            ))}</div>
          </Card>
        )} />}

        {tab === 'invoices' && <ListSection cur={cur} path={{ url: '/portal/invoices', key: 'invoices' }} empty="No invoices yet." render={(inv, c) => (
          <Card key={inv.id}>
            <div className="flex items-start justify-between gap-2"><div><div className="font-semibold text-slate-900">{inv.invoiceNumber}</div><div className="text-sm text-slate-500">Issued {inv.issueDate || '—'}{inv.dueDate ? ` · Due ${inv.dueDate}` : ''}</div></div><Badge s={inv.status} /></div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-sm">
              <div><div className="text-xs text-slate-400">Total</div><div className="font-medium">{money(inv.total, c)}</div></div>
              <div><div className="text-xs text-slate-400">Paid</div><div className="font-medium text-emerald-700">{money(inv.paidAmount, c)}</div></div>
              <div><div className="text-xs text-slate-400">Outstanding</div><div className="font-medium text-rose-700">{money(inv.outstandingAmount, c)}</div></div>
            </div>
          </Card>
        )} />}

        {tab === 'payments' && <ListSection cur={cur} path={{ url: '/portal/payments', key: 'payments' }} empty="No payments recorded yet." render={(p, c) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between"><div><div className="font-semibold text-slate-900">{money(p.amount, c)}</div><div className="text-sm text-slate-500">{p.paymentNumber} · {p.paymentDate}{p.bookingNumber ? ` · ${p.bookingNumber}` : ''}</div></div><Badge s={p.status} /></div>
          </Card>
        )} />}

        {tab === 'messages' && <ListSection cur={cur} path={{ url: '/portal/communications', key: 'communications' }} empty="No messages yet." render={(m) => (
          <Card key={m.id}>
            <div className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()} · {m.channel}</div>
            {m.subject && <div className="font-medium text-slate-800">{m.subject}</div>}
            <div className="whitespace-pre-wrap text-sm text-slate-600">{m.message}</div>
          </Card>
        )} />}

        {tab === 'profile' && customer && <Profile customer={customer} onUpdate={setCustomer} />}
      </main>
    </div>
  );
}
