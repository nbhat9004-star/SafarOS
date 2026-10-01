'use client';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus, ArrowRight, ArrowLeft, Check, X, Sparkles, MapPin, Users, Wallet,
  Loader2, Compass, Star, Camera, Upload, ImageIcon, Share2, Copy, MessageCircle,
  Link as LinkIcon, ShieldCheck, Info,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// -------------------------------------------------------------------
// EXPLORE V3 — Publish a Trip
//   Step 1  Trip info (title, destination, description, route, dates,
//           seats, cost, category) + photos (multi upload) + cover pick
//   Step 2  Choose services (Safar Verified vs My Own Arrangements)
//   Step 3  Success screen with QR code + share buttons
// -------------------------------------------------------------------

const CATEGORIES = [
  { key: 'weekend_escape', label: 'Weekend Escape' },
  { key: 'adventure',      label: 'Adventure' },
  { key: 'road_trip',      label: 'Road Trip' },
  { key: 'photography',    label: 'Photography' },
  { key: 'food',           label: 'Food Tour' },
  { key: 'family',         label: 'Family' },
  { key: 'friends',        label: 'Friends' },
  { key: 'trekking',       label: 'Trekking' },
  { key: 'spiritual',      label: 'Spiritual' },
  { key: 'couples',        label: 'Couples' },
  { key: 'backpacking',    label: 'Backpacking' },
  { key: 'solo_friendly',  label: 'Solo Friendly' },
];

const SERVICE_CATS = [
  { key: 'stay',        label: 'Accommodation' },
  { key: 'airport',     label: 'Airport Pickup' },
  { key: 'car',         label: 'Car Rental' },
  { key: 'bike',        label: 'Bike Rental' },
  { key: 'guide',       label: 'Local Guide' },
  { key: 'experience',  label: 'Activities' },
  { key: 'food',        label: 'Meals' },
  { key: 'transport',   label: 'Transportation' },
];

const empty = () => ({
  name: '', destination: { name: '', district: '', state: 'Jammu & Kashmir', country: 'India' },
  description: '', route: '',
  startDate: '', endDate: '',
  maxMembers: 6, budget: 0, category: 'weekend_escape',
  photos: [], cover: '',
  planMode: '', services: [],
});

export default function PublishPage() { return <Suspense fallback={null}><Inner /></Suspense>; }

function Inner() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty());
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(null);

  const upd = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updDest = (patch) => setForm((f) => ({ ...f, destination: { ...f.destination, ...patch } }));

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 3) return 'Trip title (3+ chars)';
    if (!form.destination.name.trim()) return 'Destination is required';
    if (!form.startDate || !form.endDate) return 'Start and end dates required';
    if (new Date(form.endDate) < new Date(form.startDate)) return 'End date must be after start date';
    if (form.photos.length === 0) return 'Add at least one photo';
    return null;
  };

  const publish = async () => {
    if (!user) { router.push('/?auth=1'); return; }
    const v = validate(); if (v) { toast.error(v); return; }
    setBusy(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        cover: form.cover || form.photos[0],
        photos: form.photos,
        destination: form.destination,
        startDate: form.startDate, endDate: form.endDate,
        maxMembers: form.maxMembers,
        budget: Number(form.budget) || null,
        theme: form.category,
        difficulty: 'moderate',
        services: form.services,
        visibility: 'public',
        meta: {
          route: form.route,
          planMode: form.planMode,
          serviceCats: form.services.map((s) => s.category),
        },
      };
      const r = await fetch('/api/circle/journeys', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Publish failed');
      setPublished(j.journey);
      setStep(3);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="container py-6 md:py-10 max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/explore/home" className="hover:text-charcoal inline-flex items-center gap-1"><ArrowLeft className="size-3.5" /> Explore</Link>
        <span>/</span>
        <span className="text-charcoal font-semibold">Publish a Trip</span>
      </div>

      {step !== 3 && (
        <div className="mt-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal tracking-tight">Publish a trip</h1>
          <p className="text-muted-foreground mt-1">Sharing a trip on Safar is completely free. Add photos, choose services if you\u2019d like our verified hosts, and invite fellow travellers.</p>
          <div className="mt-5 flex items-center gap-2">
            {[1, 2].map((n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full ${step >= n ? 'bg-emerald2' : 'bg-emerald-100'}`} />
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field full label="Trip Title *" value={form.name} onChange={(v) => upd({ name: v })} placeholder="e.g. Autumn Photography Meetup" />
          <Field label="Destination *" value={form.destination.name} onChange={(v) => updDest({ name: v })} placeholder="e.g. Pahalgam" />
          <Field label="District" value={form.destination.district} onChange={(v) => updDest({ district: v })} />
          <TextArea full label="Description" value={form.description} onChange={(v) => upd({ description: v })} rows={3} placeholder="What makes this trip special?" />
          <TextArea full label="Route" value={form.route} onChange={(v) => upd({ route: v })} rows={2} placeholder="e.g. Srinagar → Sonmarg → Zoji La → Kargil → Leh" />
          <Field label="Start Date *" type="date" value={form.startDate} onChange={(v) => upd({ startDate: v })} />
          <Field label="End Date *" type="date" value={form.endDate} onChange={(v) => upd({ endDate: v })} />
          <Field label="Seats Available" type="number" value={form.maxMembers} onChange={(v) => upd({ maxMembers: Math.max(1, Math.min(50, Number(v) || 1)) })} min={1} max={50} />
          <Field label="Estimated Cost (₹)" type="number" value={form.budget} onChange={(v) => upd({ budget: Math.max(0, Number(v) || 0) })} placeholder="Total for the trip" />
          <div className="md:col-span-2">
            <Label>Trip Category</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" onClick={() => upd({ category: c.key })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${form.category === c.key ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-emerald2/5'}`}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* Photo uploader */}
          <div className="md:col-span-2">
            <Label>Photos * (upload from device, gallery or camera)</Label>
            <PhotoUploader photos={form.photos} cover={form.cover} onChange={(photos, cover) => setForm((f) => ({ ...f, photos, cover: cover || photos[0] || '' }))} />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-4">
            <button onClick={() => { const v = validate(); if (v) return toast.error(v); setStep(2); }} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold shadow-md transition">
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <h2 className="font-display text-2xl font-bold text-charcoal">How would you like to organize this trip?</h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <ModeCard
              recommended
              title="Safar Curated Verified Services"
              icon={Star}
              tagline={<>Creating and publishing trips is completely free. If you wish your journey to be hassle-free, choose services from our <strong>Best &amp; Verified Hosts</strong>.</>}
              active={form.planMode === 'safar'}
              onClick={() => upd({ planMode: 'safar' })}
            />
            <ModeCard
              title="Use My Own Arrangements"
              icon={Compass}
              tagline="Organise everything yourself — accommodation, transport, food, activities. Trip creation stays completely free."
              active={form.planMode === 'own'}
              onClick={() => upd({ planMode: 'own' })}
            />
          </div>

          {form.planMode === 'safar' && (
            <div className="mt-6">
              <div className="text-sm font-semibold text-charcoal mb-2">Choose the categories you\u2019d like Safar to help with (optional)</div>
              <ServicesPicker services={form.services} onChange={(services) => upd({ services })} />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-2">
            <button onClick={() => setStep(1)} className="px-5 h-11 rounded-full text-charcoal/70 hover:text-charcoal font-semibold"><ArrowLeft className="size-4 inline mr-1" /> Back</button>
            <button disabled={busy || !form.planMode} onClick={publish} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white font-semibold shadow-md transition">
              {busy ? <><Loader2 className="size-4 animate-spin" /> Publishing…</> : <>Publish Trip <Check className="size-4" /></>}
            </button>
          </div>
        </div>
      )}

      {step === 3 && published && <SuccessScreen trip={published} onReset={() => { setForm(empty()); setPublished(null); setStep(1); }} />}
    </div>
  );
}

// ------------ Photo uploader (multi + cover) ------------
function PhotoUploader({ photos, cover, onChange }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFiles = async (files) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    const uploads = [];
    for (const f of arr) {
      if (!f.type.startsWith('image/')) continue;
      if (f.size > 3_500_000) { toast.error(`${f.name} too large (max 3.5MB)`); continue; }
      // eslint-disable-next-line no-await-in-loop
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target.result);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      try {
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch('/api/explore/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl }) });
        // eslint-disable-next-line no-await-in-loop
        const j = await r.json();
        if (r.ok && j?.url) uploads.push(j.url);
      } catch { /* ignore */ }
    }
    const next = [...photos, ...uploads];
    onChange(next, cover || next[0]);
  };

  const remove = (idx) => {
    const next = photos.filter((_, i) => i !== idx);
    const nextCover = photos[idx] === cover ? (next[0] || '') : cover;
    onChange(next, nextCover);
  };

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold transition"><Upload className="size-4" /> Upload from device</button>
        <button type="button" onClick={() => cameraRef.current?.click()} className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-white border text-sm font-semibold text-charcoal hover:bg-emerald2/5 transition"><Camera className="size-4" /> Camera</button>
      </div>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((p, idx) => (
            <div key={idx} className={`relative aspect-square rounded-xl overflow-hidden border-2 group ${cover === p ? 'border-amber-400 ring-2 ring-amber-200' : 'border-emerald-100'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`photo-${idx}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition" />
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                <button type="button" onClick={() => onChange(photos, p)} className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${cover === p ? 'bg-amber-400 text-emerald-950' : 'bg-white/95 text-emerald2'}`}>{cover === p ? 'Cover' : 'Set cover'}</button>
                <button type="button" onClick={() => remove(idx)} className="size-6 rounded-full bg-white/95 grid place-items-center text-rose-600"><X className="size-3" /></button>
              </div>
              {cover === p && (
                <div className="absolute top-1 left-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 shadow">Cover</div>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="mt-3 border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center text-sm text-muted-foreground">
          <ImageIcon className="size-6 mx-auto text-emerald2 mb-2" />
          No photos yet. Upload from your device or take a new one with the camera.
        </div>
      )}
    </div>
  );
}

// ------------ Services picker (marketplace listings) ------------
function ServicesPicker({ services, onChange }) {
  const [selectedCats, setSelectedCats] = useState(new Set(services.map((s) => s.category)));
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCats.size === 0) { setList([]); return; }
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '40');
        const r = await fetch('/api/circle/marketplace?' + params.toString(), { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setList((j.listings || []).filter((l) => selectedCats.has(l.category)));
      } catch {}
      finally { setLoading(false); }
    })();
  }, [selectedCats]);

  const toggleCat = (key) => {
    const next = new Set(selectedCats);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelectedCats(next);
  };

  const has = (id) => services.some((s) => s.listingId === id);
  const toggle = (l) => {
    if (has(l.id)) onChange(services.filter((s) => s.listingId !== l.id));
    else onChange([...services, { listingId: l.id, category: l.category, subcategory: l.subcategory, title: l.title, image: l.image, price: l.price, hostName: l.hostName, notes: '' }]);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {SERVICE_CATS.map((c) => (
          <button key={c.key} type="button" onClick={() => toggleCat(c.key)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedCats.has(c.key) ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-emerald2/5'}`}>{c.label}</button>
        ))}
      </div>

      {loading && <div className="mt-4 grid place-items-center py-6"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
      {!loading && list.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.slice(0, 20).map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border overflow-hidden shadow-sm">
              <div className="relative aspect-[16/10] bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.image && <img src={l.image} alt={l.title} className="absolute inset-0 w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="font-semibold text-charcoal text-sm line-clamp-1">{l.title}</div>
                <div className="text-xs text-muted-foreground truncate">{l.location}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-bold text-charcoal text-sm">₹{(l.price || 0).toLocaleString('en-IN')}</div>
                  <button type="button" onClick={() => toggle(l)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${has(l.id) ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald2 text-white'}`}>
                    {has(l.id) ? 'Added' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------ Success screen ------------
function SuccessScreen({ trip, onReset }) {
  const link = typeof window !== 'undefined' ? `${window.location.origin}/explore/j/${trip.slug || trip.id}` : `/explore/j/${trip.slug || trip.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(link)}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast.success('Link copied'); } catch { toast.error('Copy failed'); }
  };
  const shareSystem = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: trip.name, text: 'Join my trip on Safar Curated', url: link }); }
      else { copy(); }
    } catch {}
  };
  const shareWhatsApp = () => {
    const t = `Join my trip on Safar Curated: ${trip.name}\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank');
  };

  return (
    <div className="mt-8 max-w-2xl mx-auto text-center">
      <div className="inline-grid place-items-center size-16 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-xl mb-4"><Check className="size-8" strokeWidth={3} /></div>
      <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal tracking-tight">Trip published successfully</h2>
      <p className="mt-2 text-muted-foreground">Share your trip — the more travellers see it, the sooner your seats fill up.</p>

      <div className="mt-8 bg-white rounded-3xl border shadow-lg p-6 md:p-8 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">Trip Link</div>
            <div className="mt-1 font-semibold text-charcoal line-clamp-2 break-all">{trip.name}</div>
            <div className="mt-2 text-xs text-muted-foreground break-all">{link}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={copy} className="inline-flex items-center justify-center gap-2 h-10 rounded-full bg-white border text-sm font-semibold hover:bg-emerald2/5 transition"><Copy className="size-4" /> Copy link</button>
              <button onClick={shareSystem} className="inline-flex items-center justify-center gap-2 h-10 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white text-sm font-semibold transition"><Share2 className="size-4" /> Share</button>
              <button onClick={shareWhatsApp} className="col-span-2 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-[#25D366] hover:bg-[#1fa855] text-white text-sm font-semibold transition"><MessageCircle className="size-4" /> Share on WhatsApp</button>
            </div>
          </div>
          <div className="grid place-items-center">
            <div className="bg-white p-3 rounded-2xl border-2 border-emerald-100 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="Trip QR code" width={220} height={220} className="block" />
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-emerald2">Scan to open trip</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link href={`/explore/j/${trip.slug || trip.id}`} className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold transition">View Trip <ArrowRight className="size-4" /></Link>
        <button onClick={onReset} className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white border text-charcoal font-semibold hover:bg-emerald2/5 transition"><Plus className="size-4" /> Publish another</button>
      </div>
    </div>
  );
}

// ------------ Small UI atoms ------------
function ModeCard({ title, icon: Icon, tagline, active, onClick, recommended }) {
  return (
    <button type="button" onClick={onClick} className={`relative text-left rounded-3xl p-6 md:p-7 border-2 transition-all hover:-translate-y-0.5 ${
      active && recommended ? 'border-amber-400 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-xl' :
      active ? 'border-emerald2 bg-white text-charcoal shadow-lg' :
      recommended ? 'border-amber-300 bg-white text-charcoal shadow-sm hover:border-amber-400' :
      'border-emerald-100 bg-white text-charcoal shadow-sm hover:border-emerald-300'}`}>
      {recommended && (
        <div className="absolute -top-3 right-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-[10px] uppercase tracking-[0.22em] font-bold shadow-md"><Star className="size-3" strokeWidth={3} /> Recommended</div>
      )}
      <div className={`size-12 rounded-2xl grid place-items-center ${active && recommended ? 'bg-amber-400 text-emerald-950' : recommended ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald2'}`}>
        <Icon className="size-6" />
      </div>
      <h3 className={`mt-4 font-display font-bold text-xl md:text-2xl ${active && recommended ? 'text-white' : 'text-charcoal'}`}>{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${active && recommended ? 'text-white/85' : 'text-muted-foreground'}`}>{tagline}</p>
      {active && (
        <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${active && recommended ? 'text-amber-300' : 'text-emerald2'}`}><Check className="size-4" strokeWidth={3} /> Selected</div>
      )}
    </button>
  );
}
function Label({ children }) { return <label className="block text-[11px] uppercase tracking-wider font-bold text-emerald-800">{children}</label>; }
function Field({ label, value, onChange, type = 'text', placeholder, full, min, max }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={min} max={max} className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-emerald-100 bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10" />
    </div>
  );
}
function TextArea({ label, value, onChange, rows = 3, placeholder, full }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <Label>{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-emerald-100 bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10 resize-y" />
    </div>
  );
}
