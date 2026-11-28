'use client';

import { useState } from 'react';
import Link from 'next/link';

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100';
const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

export default function PlanTripPage() {
  const [form, setForm] = useState({ name: '', phone: '+91', email: '', destination: 'Srinagar', travelStart: '', travelEnd: '', tripType: 'Leisure', budgetMax: '', partySize: '2', consentAccepted: false, website: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/growth/enquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budgetMax: Number(form.budgetMax), partySize: Number(form.partySize), source: 'safaros_plan_trip_page' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'We could not submit your enquiry. Please try again.');
      setResult(data);
      setForm({ name: '', phone: '+91', email: '', destination: 'Srinagar', travelStart: '', travelEnd: '', tripType: 'Leisure', budgetMax: '', partySize: '2', consentAccepted: false, website: '' });
    } catch (e) { setError(e.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-violet-300 hover:text-white">← Back to SafarOS</Link>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-black/20 sm:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">SafarOS · Kashmir travel enquiry</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Plan your Kashmir trip</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">Tell us a little about your trip. Your enquiry will be reviewed before it is shared with an eligible travel operator.</p>
          {result && <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><strong>Enquiry received.</strong><p className="mt-1 text-sm">{result.message} Reference: {result.reference}</p></div>}
          {error && <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</div>}
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className={labelClass} htmlFor="name">Your name *</label><input id="name" className={inputClass} autoComplete="name" maxLength={100} required value={form.name} onChange={e => update('name', e.target.value)} /></div>
              <div><label className={labelClass} htmlFor="phone">Mobile number with country code *</label><input id="phone" className={inputClass} autoComplete="tel" inputMode="tel" maxLength={18} required value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
              <div><label className={labelClass} htmlFor="email">Email (optional)</label><input id="email" type="email" className={inputClass} autoComplete="email" maxLength={160} value={form.email} onChange={e => update('email', e.target.value)} /></div>
              <div><label className={labelClass} htmlFor="destination">Preferred destination *</label><select id="destination" className={inputClass} value={form.destination} onChange={e => update('destination', e.target.value)}>{['Srinagar','Gulmarg','Pahalgam','Sonamarg','Kashmir - multiple destinations','Not decided yet'].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className={labelClass} htmlFor="travelStart">Travel start date *</label><input id="travelStart" type="date" min={new Date().toISOString().slice(0,10)} className={inputClass} required value={form.travelStart} onChange={e => update('travelStart', e.target.value)} /></div>
              <div><label className={labelClass} htmlFor="travelEnd">Travel end date</label><input id="travelEnd" type="date" min={form.travelStart || new Date().toISOString().slice(0,10)} className={inputClass} value={form.travelEnd} onChange={e => update('travelEnd', e.target.value)} /></div>
              <div><label className={labelClass} htmlFor="tripType">Trip type</label><select id="tripType" className={inputClass} value={form.tripType} onChange={e => update('tripType', e.target.value)}>{['Leisure','Family','Honeymoon','Adventure','Business','Religious / spiritual','Other'].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className={labelClass} htmlFor="partySize">Number of travellers *</label><input id="partySize" type="number" min="1" max="40" required className={inputClass} value={form.partySize} onChange={e => update('partySize', e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={labelClass} htmlFor="budgetMax">Maximum trip budget (INR) *</label><input id="budgetMax" type="number" min="0" max="100000000" required className={inputClass} placeholder="e.g. 50000" value={form.budgetMax} onChange={e => update('budgetMax', e.target.value)} /><p className="mt-1 text-xs text-slate-500">Enter the total budget you are comfortable with. You can enter 0 if you have not decided.</p></div>
            </div>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label htmlFor="website">Website</label><input id="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={e => update('website', e.target.value)} /></div>
            <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700"><input type="checkbox" className="mt-1 h-4 w-4 accent-violet-700" required checked={form.consentAccepted} onChange={e => update('consentAccepted', e.target.checked)} /><span>I agree that Lafqa Ventures / SafarOS may use my details to respond to this enquiry and share the enquiry, including my contact details, with one eligible travel agency for the purpose of responding. My details will not be publicly displayed. I can withdraw my consent by contacting the platform.</span></label>
            <button disabled={busy} className="w-full rounded-xl bg-slate-950 px-5 py-4 font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Submitting…' : 'Submit travel enquiry'}</button>
            <p className="text-xs leading-relaxed text-slate-500">Submitting does not guarantee a booking or require a purchase. Your enquiry is subject to review; phone number format validation does not mean phone ownership has been verified.</p>
          </form>
        </div>
      </div>
    </main>
  );
}
