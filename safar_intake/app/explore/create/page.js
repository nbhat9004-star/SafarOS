'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Home, Lock, Globe, Link2, QrCode, Trophy, Loader2, Plus, Trash2, ChevronUp, ChevronDown, ImagePlus, X } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import TripRouteMap, { RouteList } from '@/components/explore-v2/TripRouteMap';
import AuthGate from '@/components/safar/AuthGate';
import { useAuth } from '@/lib/auth-context';
import { VERIFIED_SERVICES } from '@/lib/explore-v2-data';
import { PROVIDER_CATEGORIES } from '@/lib/provider-categories';
import { createTrip } from '@/lib/explore-api';
import { toast } from 'sonner';

// Reuse the existing premium Sign In / Sign Up modal (no duplicate auth system).
const AuthModal = dynamic(() => import('@/components/safar/AuthModal'), { ssr: false });

const DRAFT_KEY = 'safar_create_draft';
const THEME_MAP = { self: 'adventure', safar: 'adventure' };

// Real geocoding via OpenStreetMap Nominatim (free, no key, CORS-enabled).
// Returns real coords or null (never fabricated). Biased to India.
async function geocodePlace(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q + ', India')}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export default function CreateTrip() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState(null);
  const [privacy, setPrivacy] = useState('public');
  const [addedSvc, setAddedSvc] = useState([]);
  // Phase 2 — trip fulfillment foundation
  const [minTravelers, setMinTravelers] = useState(2);
  const [maxTravelers, setMaxTravelers] = useState(8);
  const [requiredServices, setRequiredServices] = useState([]); // provider category slugs
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  // Trip Map generator state
  const [places, setPlaces] = useState(['', '']);
  const [route, setRoute] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [failed, setFailed] = useState([]);
  const [cover, setCover] = useState('');
  // Auth gate / draft-preservation state
  const [gateOpen, setGateOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | null
  const [pendingPublish, setPendingPublish] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Restore any saved draft on mount (survives refresh + sign-in navigation).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.mode !== undefined) setMode(d.mode);
        if (d.privacy) setPrivacy(d.privacy);
        if (Array.isArray(d.addedSvc)) setAddedSvc(d.addedSvc);
        if (Number.isFinite(d.minTravelers)) setMinTravelers(d.minTravelers);
        if (Number.isFinite(d.maxTravelers)) setMaxTravelers(d.maxTravelers);
        if (Array.isArray(d.requiredServices)) setRequiredServices(d.requiredServices);
        if (typeof d.title === 'string') setTitle(d.title);
        if (typeof d.destination === 'string') setDestination(d.destination);
        if (typeof d.startDate === 'string') setStartDate(d.startDate);
        if (typeof d.endDate === 'string') setEndDate(d.endDate);
        if (typeof d.description === 'string') setDescription(d.description);
        if (Array.isArray(d.places) && d.places.length) setPlaces(d.places);
        if (Array.isArray(d.route)) setRoute(d.route);
        if (typeof d.cover === 'string') setCover(d.cover);
      }
    } catch (e) { /* ignore corrupt draft */ }
    setDraftLoaded(true);
  }, []);

  // Persist the draft continuously (only after initial restore) — cover is a
  // compressed data-URL string so the selected image survives too.
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({
        mode, privacy, addedSvc, title, destination, startDate, endDate, description, places, route, cover,
        minTravelers, maxTravelers, requiredServices,
      }));
    } catch (e) { /* quota / unavailable — non-fatal */ }
  }, [draftLoaded, mode, privacy, addedSvc, title, destination, startDate, endDate, description, places, route, cover, minTravelers, maxTravelers, requiredServices]);

  const addPlace = () => setPlaces((p) => [...p, '']);
  const updatePlace = (i, v) => setPlaces((p) => p.map((x, idx) => (idx === i ? v : x)));
  const removePlace = (i) => setPlaces((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));
  const movePlace = (i, dir) => setPlaces((p) => {
    const j = i + dir;
    if (j < 0 || j >= p.length) return p;
    const n = [...p];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  const handleGenerate = async () => {
    const names = places.map((p) => p.trim()).filter(Boolean);
    if (names.length < 2) { toast.error('Add at least 2 places to generate a map'); return; }
    setGeoLoading(true);
    setFailed([]);
    const resolved = [];
    const errs = [];
    for (const name of names) {
      try {
        const r = await geocodePlace(name);
        if (r) resolved.push({ name, lat: r.lat, lng: r.lng, order: resolved.length + 1 });
        else errs.push(name);
      } catch (e) { errs.push(name); }
      // Respect Nominatim's usage policy (light spacing between calls).
      await new Promise((res) => setTimeout(res, 500));
    }
    setGeoLoading(false);
    setFailed(errs);
    if (errs.length) toast.error(`Couldn't find: ${errs.join(', ')}. Please check the name(s).`);
    if (resolved.length >= 2) { setRoute(resolved); if (!errs.length) toast.success('Trip map generated!'); }
    else if (!errs.length) toast.error('Could not build a route. Please check the place names.');
  };

  const handleCover = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 1000;
        let { width, height } = img;
        if (width > max) { height = Math.round((height * max) / width); width = max; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        setCover(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const toggleSvc = (id) => setAddedSvc(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleReqSvc = (slug) => setRequiredServices(p => p.includes(slug) ? p.filter(x => x !== slug) : [...p, slug]);

  const handlePublish = async () => {
    if (!title.trim() || title.trim().length < 3) { toast.error('Trip title must be at least 3 characters'); return; }
    // Phase 2: validate group size + required services (server re-validates too).
    const minT = Math.max(1, Number(minTravelers) || 1);
    const maxT = Math.max(1, Number(maxTravelers) || 1);
    if (maxT < minT) { toast.error('Maximum travelers must be greater than or equal to minimum travelers'); return; }
    if (mode === 'safar' && requiredServices.length === 0) { toast.error('Select at least one service Safar should arrange'); return; }
    // AUTH GATE: never surface a red "sign in" error — show the premium prompt.
    // The draft is already persisted, so nothing is lost while the user signs in.
    if (!authLoading && !user) { setPendingPublish(true); setGateOpen(true); return; }
    setPublishing(true);
    try {
      const services = mode === 'safar' ? addedSvc.map(id => {
        const s = VERIFIED_SERVICES.find(x => x.id === id);
        return { listingId: id, category: s?.id, title: s?.label, price: 0 };
      }) : [];
      const payload = {
        name: title.trim(),
        description: description.trim(),
        theme: THEME_MAP[mode] || 'adventure',
        hostMode: mode,
        destination: { name: destination.trim() || 'Kashmir', country: 'India' },
        startDate: startDate || null,
        endDate: endDate || null,
        maxMembers: maxT,
        minimumTravelers: Math.min(minT, maxT),
        requiredServices, // provider category slugs only (Safar matches later)
        services,
        cover: cover || null,
        route,
        visibility: privacy,
      };
      const journey = await createTrip(payload);
      // Only clear the draft AFTER a successful publish.
      try { window.localStorage.removeItem(DRAFT_KEY); } catch (e) { /* noop */ }
      toast.success('Trip published successfully!');
      router.push(`/explore/trip/${journey.id}`);
    } catch (e) {
      toast.error(e.message || 'Could not publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // After a successful sign-in/sign-up (user becomes available), automatically
  // resume the publish the user originally intended — no data re-entry.
  useEffect(() => {
    if (user && pendingPublish && !gateOpen && !authMode) {
      setPendingPublish(false);
      handlePublish();
    }
  }, [user, pendingPublish, gateOpen, authMode]);

  return (
    <Shell hideNav={!!mode}>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pb-3 flex items-center gap-3">
          <Link href={mode ? '#' : '/explore'} onClick={(e) => { if (mode) { e.preventDefault(); setMode(null); } }} className="size-10 grid place-items-center rounded-full hover:bg-slate-100 active:scale-95 transition"><ArrowLeft className="size-5" /></Link>
          <h1 className="flex-1 text-center font-display font-bold text-[17px] tracking-tight">Create a Trip</h1>
          <div className="size-10" />
        </div>
      </header>

      {!mode ? (
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-6">
          <div className="text-center">
            <h2 className="font-display font-bold text-[24px] md:text-[30px] tracking-tight text-slate-900">Two ways to create</h2>
            <p className="mt-1.5 text-[13.5px] md:text-[15px] text-slate-500">Choose how you want to organize your trip</p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Self Hosted */}
            <button onClick={() => setMode('self')} className="text-left rounded-3xl border-2 border-slate-200 bg-white p-5 md:p-6 hover:border-violet-300 hover:shadow-xl transition group">
              <div className="size-12 rounded-2xl bg-violet-100 text-violet-600 grid place-items-center"><Home className="size-6" strokeWidth={2} /></div>
              <h3 className="mt-4 font-display font-bold text-[18px] text-slate-900">🧳 Create a Free Trip</h3>
              <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">Plan and create your own journey for free.</p>
              <div className="mt-4 space-y-1.5">
                {['Free forever','Public or Private','You handle all logistics'].map(x => (
                  <div key={x} className="flex items-center gap-1.5 text-[12.5px] text-slate-700"><CheckCircle2 className="size-3.5 text-violet-600" />{x}</div>
                ))}
              </div>
              <div className="mt-3 text-[11.5px] text-slate-400">No reward-card unlocks</div>
              <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-900 group-hover:bg-black text-white px-4 py-2 text-[13px] font-semibold">Continue <ArrowRight className="size-4" /></div>
            </button>

            {/* Safar Assisted */}
            <button onClick={() => setMode('safar')} className="relative text-left rounded-3xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 md:p-6 hover:shadow-xl transition group">
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[10px] font-bold"><Sparkles className="size-3" /> RECOMMENDED</div>
              <div className="size-12 rounded-2xl bg-emerald-500 text-white grid place-items-center shadow-lg shadow-emerald-200"><ShieldCheck className="size-6" strokeWidth={2} /></div>
              <h3 className="mt-4 font-display font-bold text-[18px] text-emerald-900">✨ Create with Safar Hosting</h3>
              <p className="mt-1 text-[13px] text-emerald-900/80 leading-relaxed">Build your journey using verified Safar service providers.</p>
              <div className="mt-4 space-y-1.5">
                {['Verified providers','Reward progress','Badge collection','Trust for travelers'].map(x => (
                  <div key={x} className="flex items-center gap-1.5 text-[12.5px] text-emerald-900"><CheckCircle2 className="size-3.5 text-emerald-600" />{x}</div>
                ))}
              </div>
              <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white px-4 py-2 text-[13px] font-semibold">Continue <ArrowRight className="size-4" /></div>
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 flex items-start gap-3">
            <Trophy className="size-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[13.5px] text-violet-900">Verified trips unlock reward cards</div>
              <p className="mt-0.5 text-[12.5px] text-violet-900/80">Complete verified trips to reveal one of nine mystery reward cards on your Explore home.</p>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-5 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold"
            style={{ backgroundColor: mode === 'safar' ? '#d1fae5' : '#ede9fe', color: mode === 'safar' ? '#065f46' : '#5b21b6' }}>
            {mode === 'safar' ? <><ShieldCheck className="size-3" /> VERIFIED BY SAFAR</> : <>SELF HOSTED</>}
          </div>

          <h2 className="mt-3 font-display font-bold text-[22px] md:text-[26px] tracking-tight text-slate-900">Trip Details</h2>

          {/* Detail fields */}
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-slate-700">Trip Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Kashmir Great Lakes" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px] outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700">Destination</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Where are you going?" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px] outline-none focus:border-violet-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[12px] font-semibold text-slate-700">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-700">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px]" />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700">Description</label>
              <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your trip..." className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-[14px] outline-none focus:border-violet-400 resize-none" />
            </div>
          </div>

          {/* Trip Route — AI-assisted map generator (real OSM geocoding + map) */}
          <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Trip Route</h3>
          <p className="text-[12.5px] text-slate-500 mt-0.5">Where will your journey take you?</p>
          <div className="mt-3 space-y-2">
            {places.map((p, i) => (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <span className="size-8 shrink-0 grid place-items-center rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold">{String(i + 1).padStart(2, '0')}</span>
                  <input value={p} onChange={(e) => updatePlace(i, e.target.value)} placeholder="e.g. Srinagar" className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 h-11 text-[14px] outline-none focus:border-emerald-400" />
                  <button type="button" aria-label="Move up" onClick={() => movePlace(i, -1)} disabled={i === 0} className="size-8 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronUp className="size-4" /></button>
                  <button type="button" aria-label="Move down" onClick={() => movePlace(i, 1)} disabled={i === places.length - 1} className="size-8 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronDown className="size-4" /></button>
                  <button type="button" aria-label="Delete place" onClick={() => removePlace(i)} disabled={places.length <= 1} className="size-8 grid place-items-center rounded-lg text-rose-400 hover:bg-rose-50 disabled:opacity-30"><Trash2 className="size-4" /></button>
                </div>
                {p.trim() && failed.includes(p.trim()) && (
                  <p className="mt-1 ml-10 text-[11.5px] text-rose-600">Couldn&rsquo;t find this place. Please check the name.</p>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addPlace} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 hover:gap-2 transition-all"><Plus className="size-4" /> Add Place</button>

          <button type="button" onClick={handleGenerate} disabled={geoLoading} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 text-[14px] font-extrabold shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition disabled:opacity-70">
            {geoLoading ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <><Sparkles className="size-4" /> Generate Trip Map</>}
          </button>

          {route.length >= 2 && (
            <div className="mt-4">
              <TripRouteMap stops={route} height={300} />
              <RouteList stops={route} />
              <button type="button" onClick={handleGenerate} disabled={geoLoading} className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 active:scale-95"><Sparkles className="size-3.5" /> Regenerate Map</button>
            </div>
          )}

          {/* Trip Cover Image (optional) */}
          <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Trip Cover Image <span className="text-[12px] font-medium text-slate-400">(optional)</span></h3>
          <div className="mt-3">
            {cover ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                <img src={cover} alt="Trip cover" className="w-full h-44 object-cover" />
                <button type="button" aria-label="Remove cover" onClick={() => setCover('')} className="absolute top-2 right-2 size-8 grid place-items-center rounded-full bg-black/50 text-white active:scale-90"><X className="size-4" /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 cursor-pointer hover:border-emerald-300 transition">
                <ImagePlus className="size-6 text-slate-400" />
                <span className="text-[13px] font-semibold text-slate-600">Upload cover image</span>
                <span className="text-[11px] text-slate-400">One image representing your trip</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCover(e.target.files?.[0])} />
              </label>
            )}
          </div>

          {/* Phase 2 — Group size (min / max travelers) */}
          <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Group size</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <label className="block text-[12px] font-semibold text-slate-500">Minimum Travelers</label>
              <input type="number" min={1} value={minTravelers} onChange={(e) => setMinTravelers(Math.max(1, Number(e.target.value) || 1))} className="mt-1 w-full text-[20px] font-bold text-slate-900 outline-none bg-transparent" />
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Your trip can move forward once this number of travelers is reached.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <label className="block text-[12px] font-semibold text-slate-500">Maximum Travelers</label>
              <input type="number" min={1} value={maxTravelers} onChange={(e) => setMaxTravelers(Math.max(1, Number(e.target.value) || 1))} className="mt-1 w-full text-[20px] font-bold text-slate-900 outline-none bg-transparent" />
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Once this limit is reached, no more travelers can join.</p>
            </div>
          </div>

          {/* Phase 2 — Services Needed (Safar-hosted trips; category slugs only) */}
          {mode === 'safar' && (
            <>
              <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Services Needed</h3>
              <p className="text-[12.5px] text-slate-500 mt-0.5">Select the services Safar should arrange for this trip. You choose the type of service — Safar matches verified providers.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PROVIDER_CATEGORIES.map((c) => {
                  const active = requiredServices.includes(c.slug);
                  return (
                    <button key={c.slug} type="button" onClick={() => toggleReqSvc(c.slug)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'}`}>
                      <span>{c.icon}</span> {c.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Privacy */}
          <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Privacy</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setPrivacy('public')} className={`rounded-2xl border-2 p-4 text-left transition ${privacy === 'public' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <Globe className={`size-5 ${privacy === 'public' ? 'text-violet-600' : 'text-slate-500'}`} />
                {privacy === 'public' && <CheckCircle2 className="size-4 text-violet-600" />}
              </div>
              <div className="mt-2 font-semibold text-[14px] text-slate-900">Public</div>
              <div className="text-[11.5px] text-slate-500">Anyone can discover and request</div>
            </button>
            <button onClick={() => setPrivacy('private')} className={`rounded-2xl border-2 p-4 text-left transition ${privacy === 'private' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <Lock className={`size-5 ${privacy === 'private' ? 'text-violet-600' : 'text-slate-500'}`} />
                {privacy === 'private' && <CheckCircle2 className="size-4 text-violet-600" />}
              </div>
              <div className="mt-2 font-semibold text-[14px] text-slate-900">Private</div>
              <div className="text-[11.5px] text-slate-500">Invite-only via link / QR</div>
            </button>
          </div>
          {privacy === 'private' && (
            <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-3 space-y-2">
              <div className="text-[12px] font-semibold text-slate-500">Share methods (available after publishing)</div>
              {[{ icon: Link2, label: 'Invite Link' }, { icon: Link2, label: 'Referral Link' }, { icon: QrCode, label: 'QR Code' }].map((s, i) => {
                const I = s.icon;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <I className="size-4 text-slate-500" />
                    <span className="text-[13px] font-medium text-slate-700">{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Verified services */}
          {mode === 'safar' && (
            <>
              <h3 className="mt-8 font-display font-bold text-[18px] tracking-tight text-slate-900">Add Verified Services</h3>
              <p className="text-[12.5px] text-slate-500 mt-0.5">Trips built with verified partners earn reward-card unlocks.</p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                {VERIFIED_SERVICES.map(s => {
                  const added = addedSvc.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSvc(s.id)} className={`text-left rounded-2xl border-2 p-3 transition ${added ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="text-[22px]">{s.emoji}</div>
                      <div className="mt-1 font-semibold text-[13px] text-slate-900">{s.label}</div>
                      <div className={`mt-1 text-[11px] font-bold ${added ? 'text-emerald-700' : 'text-violet-700'}`}>{added ? '\u2713 Added' : '+ Add'}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Publish CTA */}
          <div className="fixed bottom-24 md:bottom-8 inset-x-0 px-4 md:px-8 z-30">
            <div className="max-w-3xl mx-auto">
              <button onClick={handlePublish} disabled={publishing} className="w-full rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold py-3.5 shadow-2xl shadow-violet-400/30 transition disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {publishing && <Loader2 className="size-4 animate-spin" />} Publish Trip
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Premium auth gate + existing Sign In/Up modal (draft already saved) */}
      <AuthGate
        open={gateOpen}
        onClose={() => { setGateOpen(false); setPendingPublish(false); }}
        onSignIn={() => { setGateOpen(false); setAuthMode('login'); }}
        onCreate={() => { setGateOpen(false); setAuthMode('register'); }}
      />
      <AuthModal open={!!authMode} defaultMode={authMode || 'login'} onClose={() => setAuthMode(null)} />
    </Shell>
  );
}
