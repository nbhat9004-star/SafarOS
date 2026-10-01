'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ChevronLeft, ChevronRight, Check, Upload, Sparkles, Loader2, AlertTriangle,
  Hotel, Car, Bike, UtensilsCrossed, Compass, Camera, Mountain, Drama, ShoppingBag, Package,
  Wifi, Coffee, Wind, ParkingCircle, Image as ImageIcon, ListChecks, X, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { listingsApi } from '@/lib/listings-api';
import { IMG } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';

// ---------- CATEGORY CATALOG ----------
// Each card maps to a backend `category` (must be one of stay/transport/experience/tour)
// plus a `subcategory` slug + a UI schema of fields to show.
const CATEGORIES = [
  {
    key: 'stay',        emoji: '🏨', label: 'Stay',
    apiCategory: 'stay', subcategory: 'stay',
    tagline: 'Hotels · Homestays · Houseboats',
    hue: 'from-emerald-400 via-teal-400 to-cyan-400',
    Icon: Hotel,
  },
  {
    key: 'cab',         emoji: '🚗', label: 'Cab',
    apiCategory: 'transport', subcategory: 'cab',
    tagline: 'Rides, transfers & rentals',
    hue: 'from-sky-400 via-blue-400 to-indigo-400',
    Icon: Car,
  },
  {
    key: 'bike',        emoji: '🏍', label: 'Bike Rental',
    apiCategory: 'transport', subcategory: 'bike',
    tagline: 'Self-drive bikes & scooters',
    hue: 'from-orange-400 via-amber-400 to-yellow-400',
    Icon: Bike,
  },
  {
    key: 'food',        emoji: '🍽', label: 'Food',
    apiCategory: 'experience', subcategory: 'food',
    tagline: 'Meals, kitchens & tastings',
    hue: 'from-rose-400 via-pink-400 to-fuchsia-400',
    Icon: UtensilsCrossed,
  },
  {
    key: 'guide',       emoji: '🧭', label: 'Tour Guide',
    apiCategory: 'tour', subcategory: 'guide',
    tagline: 'Local expertise & storytelling',
    hue: 'from-lime-400 via-green-400 to-emerald-400',
    Icon: Compass,
  },
  {
    key: 'photography', emoji: '📸', label: 'Photography',
    apiCategory: 'tour', subcategory: 'photography',
    tagline: 'Portraits · Landscape · Events',
    hue: 'from-violet-400 via-purple-400 to-fuchsia-400',
    Icon: Camera,
  },
  {
    key: 'adventure',   emoji: '🎿', label: 'Adventure',
    apiCategory: 'experience', subcategory: 'adventure',
    tagline: 'Trekking · Rafting · Skiing',
    hue: 'from-red-400 via-orange-400 to-yellow-400',
    Icon: Mountain,
  },
  {
    key: 'cultural',    emoji: '🎭', label: 'Cultural Experience',
    apiCategory: 'experience', subcategory: 'cultural',
    tagline: 'Craft · Music · Traditions',
    hue: 'from-amber-400 via-orange-400 to-rose-400',
    Icon: Drama,
  },
  {
    key: 'shopping',    emoji: '🛍', label: 'Shopping Assistance',
    apiCategory: 'tour', subcategory: 'shopping',
    tagline: 'Markets · Bazaars · Souvenirs',
    hue: 'from-pink-400 via-fuchsia-400 to-violet-400',
    Icon: ShoppingBag,
  },
  {
    key: 'other',       emoji: '📦', label: 'Other Services',
    apiCategory: 'experience', subcategory: 'other',
    tagline: 'Anything else you offer',
    hue: 'from-slate-400 via-zinc-400 to-neutral-400',
    Icon: Package,
  },
];

const AMEN = [{i:Wifi,t:'Wi-Fi'},{i:Coffee,t:'Kahwa'},{i:Wind,t:'Heater'},{i:ParkingCircle,t:'Parking'},{i:ImageIcon,t:'Mountain view'},{i:ListChecks,t:'Breakfast'}];

// Small tag input helper
function TagInput({ value, onChange, placeholder, suggestions = [] }) {
  const [t, setT] = useState('');
  const add = (s) => {
    const v = (s ?? t).trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setT('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald2 text-xs font-medium border border-emerald-200">
            {v}
            <button type="button" onClick={() => onChange(value.filter(x => x !== v))} className="text-emerald2/70 hover:text-emerald2"><X className="size-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={t} onChange={(e)=>setT(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); add(); } }} placeholder={placeholder} className="flex-1 px-3 py-2 rounded-xl border text-sm" />
        <button type="button" onClick={()=>add()} className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold"><Plus className="size-3.5" /></button>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.filter(s => !value.includes(s)).map(s => (
            <button key={s} type="button" onClick={()=>add(s)} className="px-2 py-0.5 rounded-full text-[11px] border border-border hover:border-emerald2 hover:text-emerald2 transition">+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Chip-style multi-select
function ChipSelect({ options, value, onChange }) {
  const toggle = (o) => {
    if (value.includes(o)) onChange(value.filter(v => v !== o));
    else onChange([...value, o]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" onClick={()=>toggle(o)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${on ? 'bg-emerald2 text-white border-emerald2' : 'bg-white text-charcoal border-border hover:border-emerald2'}`}>{o}</button>
        );
      })}
    </div>
  );
}

// Single-select pill row
function PillSelect({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={()=>onChange(o)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${value===o ? 'bg-emerald2 text-white border-emerald2' : 'bg-white text-charcoal border-border hover:border-emerald2'}`}>{o}</button>
      ))}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold text-charcoal">{label}</label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function AddListingInner() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0); // 0=category, 1=details, 2=media/pricing/publish
  const [categoryKey, setCategoryKey] = useState('');
  const CAT = useMemo(() => CATEGORIES.find(c => c.key === categoryKey), [categoryKey]);

  // Common fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [availability, setAvailability] = useState('year_round');
  const [photos, setPhotos] = useState([]);          // uploaded blob previews
  const [photoUrls, setPhotoUrls] = useState(['']);  // remote URLs
  const [submitting, setSubmitting] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  // Category-specific bag
  const [details, setDetails] = useState({});
  const setD = (k, v) => setDetails(d => ({ ...d, [k]: v }));

  const onPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos((p) => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleResendVerification = async () => {
    if (!user?.email) { toast.error('No email address found'); return; }
    setResendingVerification(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (res.ok) toast.success('Verification email sent! Check your inbox.');
      else toast.error(data.error || 'Unable to send verification email.');
    } catch { toast.error('Unable to send verification email.'); }
    finally { setResendingVerification(false); }
  };

  const requiredFilledForStep1 = useMemo(() => {
    if (!CAT) return false;
    if (!title.trim() || !location.trim()) return false;
    return true;
  }, [CAT, title, location]);

  const handlePublish = async () => {
    setSubmitting(true);
    const imgs = [...photoUrls.filter(u => u && u.startsWith('http')), ...photos];
    if (imgs.length === 0) imgs.push(IMG.cot1);
    // Build amenities: from stay category, otherwise empty
    const amenities = Array.isArray(details.amenities) ? details.amenities : [];
    const payload = {
      title: title || `New ${CAT.label} in Kashmir`,
      description: description || `${CAT.label} offered by ${user?.name || 'a local host'} in ${location || 'Kashmir'}.`,
      category: CAT.apiCategory,
      subcategory: CAT.subcategory,
      location: location || 'Srinagar, Kashmir',
      price: Number(price) || 1000,
      images: imgs,
      amenities,
      services: [CAT.subcategory],
      categoryDetails: {
        categoryKey: CAT.key,
        availability,
        ...details,
      },
    };
    const { ok, data } = await listingsApi.create(payload);
    setSubmitting(false);
    if (!ok) { toast.error(data?.error || 'Failed to create listing'); return; }
    toast.success('Listing submitted! It will appear after admin approval.');
    router.push('/dashboard/host');
  };

  // Email verification guard
  if (user && !user.emailVerified) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 container">
          <div className="max-w-2xl mx-auto text-center py-20">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="size-20 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-600 grid place-items-center mx-auto">
              <AlertTriangle className="size-10" />
            </motion.div>
            <h2 className="font-display text-3xl font-bold mt-6">Verify your email to create listings</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">Please verify your email address before creating listings. Check your inbox for the verification link.</p>
            <Button onClick={handleResendVerification} disabled={resendingVerification} className="mt-6 rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold">
              {resendingVerification ? (<><Loader2 className="size-4 mr-2 animate-spin" /> Sending...</>) : ('Resend Verification Email')}
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const STEP_LABELS = ['Choose category', CAT ? `${CAT.label} details` : 'Details', 'Photos & Publish'];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container">
        <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Become a host</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">List anything on Safar</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">Choose what you want to offer and we'll only ask for what matters. Faster listings, cleaner journey.</p>

        {/* Progress */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {STEP_LABELS.map((s, i)=>(
            <div key={i} className="flex items-center gap-2">
              <div className={`size-8 rounded-full grid place-items-center text-xs font-bold ${i<=step ? 'bg-gradient-emerald text-white' : 'bg-secondary text-muted-foreground'}`}>{i<step?<Check className="size-4"/>:i+1}</div>
              <div className={`text-sm hidden sm:block ${i<=step ? 'text-charcoal font-medium' : 'text-muted-foreground'}`}>{s}</div>
              {i<STEP_LABELS.length-1 && <div className={`w-6 h-px ${i<step ? 'bg-emerald2' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="container mt-8 grid lg:grid-cols-3 gap-6 pb-16">
        <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-3xl border bg-white/80 backdrop-blur shadow-xl p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-display text-2xl md:text-3xl font-bold">What would you like to list?</h2>
                <p className="text-sm text-muted-foreground mt-1">Pick a category. We'll tailor the form so you finish faster.</p>
                <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map((c) => {
                    const on = categoryKey === c.key;
                    const Ic = c.Icon;
                    return (
                      <button
                        key={c.key}
                        onClick={() => { setCategoryKey(c.key); setDetails({}); }}
                        className={`group relative text-left p-4 rounded-2xl border-2 transition overflow-hidden ${on ? 'border-emerald2 shadow-xl ring-4 ring-emerald2/10' : 'border-border hover:border-emerald2/50 hover:shadow-md'}`}
                      >
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${c.hue} transition-opacity ${on ? 'opacity-15' : ''}`} />
                        <div className="relative">
                          <div className="flex items-start justify-between">
                            <div className={`size-11 rounded-2xl bg-gradient-to-br ${c.hue} grid place-items-center text-white shadow-md`}>
                              <Ic className="size-5" />
                            </div>
                            <span className="text-2xl">{c.emoji}</span>
                          </div>
                          <div className="font-display font-bold mt-3">{c.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.tagline}</div>
                          {on && (
                            <div className="absolute -top-1 -right-1 size-6 rounded-full bg-emerald2 text-white grid place-items-center shadow-md">
                              <Check className="size-3.5" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 1 && CAT && (
              <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`size-12 rounded-2xl bg-gradient-to-br ${CAT.hue} grid place-items-center text-white shadow-md text-xl`}>{CAT.emoji}</div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-emerald2 font-bold">Selected category</div>
                    <h2 className="font-display text-2xl font-bold">{CAT.label} details</h2>
                  </div>
                </div>

                {/* Common: title, description, location */}
                <div className="grid gap-4">
                  <Field label="Listing title" hint="Shown in search results">
                    <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={`e.g. Cozy ${CAT.label.toLowerCase()} near Dal Lake`} className="w-full px-4 py-3 rounded-xl border" />
                  </Field>
                  <Field label="Short description" hint="Optional but recommended">
                    <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder={`What makes your ${CAT.label.toLowerCase()} stand out?`} rows={4} className="w-full px-4 py-3 rounded-xl border" />
                  </Field>
                  <Field label="Location">
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border">
                      <MapPin className="size-5 text-emerald2" />
                      <input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="e.g. Dal Lake, Srinagar" className="flex-1 outline-none bg-transparent" />
                    </div>
                  </Field>
                </div>

                {/* Category-specific fields */}
                <CategorySpecificFields catKey={CAT.key} details={details} setD={setD} />

                {/* Availability (all except pure guide/experience one-off) */}
                <Field label="Availability">
                  <PillSelect options={['year_round','seasonal','weekends','on_request']} value={availability} onChange={setAvailability} />
                </Field>
              </motion.div>
            )}

            {step === 2 && CAT && (
              <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold">Photos</h2>
                  <p className="text-sm text-muted-foreground mt-1">A few good photos double bookings. Upload up to 10.</p>
                  <label className="mt-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 cursor-pointer hover:bg-secondary/40 transition">
                    <Upload className="size-6 text-emerald2" />
                    <div className="font-semibold text-sm">Click to upload</div>
                    <div className="text-xs text-muted-foreground">JPG, PNG · multiple allowed</div>
                    <input type="file" multiple accept="image/*" onChange={onPhotos} className="hidden" />
                  </label>
                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Or paste image URLs</div>
                    {photoUrls.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input value={u} onChange={(e)=>{ const n=[...photoUrls]; n[i]=e.target.value; setPhotoUrls(n); }} placeholder="https://images.unsplash.com/..." className="flex-1 px-4 py-2.5 rounded-xl border text-sm" />
                        {i === photoUrls.length-1 && <button type="button" onClick={()=>setPhotoUrls([...photoUrls, ''])} className="px-3 py-2.5 rounded-xl bg-secondary text-xs font-semibold">+ Add</button>}
                      </div>
                    ))}
                  </div>
                  {(photos.length>0 || photoUrls.some(u=>u.startsWith('http'))) && (
                    <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-2">
                      {[...photoUrls.filter(u=>u.startsWith('http')), ...photos].map((p,i)=>(<img key={i} src={p} className="aspect-square rounded-xl object-cover" alt="" />))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold">Pricing</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl">₹</span>
                    <input value={price} onChange={(e)=>setPrice(e.target.value)} type="number" placeholder="0" className="flex-1 font-display text-4xl font-bold outline-none border-b-2 pb-2" />
                    <span className="text-sm text-muted-foreground">/{priceUnitForCategory(CAT.key)}</span>
                  </div>
                  {price && Number(price) > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 rounded-xl border"><div className="text-xs text-muted-foreground">You earn (90%)</div><div className="font-bold">₹ {Math.round(Number(price)*0.9).toLocaleString('en-IN')}</div></div>
                      <div className="p-3 rounded-xl border"><div className="text-xs text-muted-foreground">Safar fee (10%)</div><div className="font-bold">₹ {Math.round(Number(price)*0.1).toLocaleString('en-IN')}</div></div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold mb-2">Review</h3>
                  <div className="p-5 rounded-2xl border bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl bg-gradient-to-br ${CAT.hue} grid place-items-center text-white text-lg`}>{CAT.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-emerald2 font-semibold">{CAT.label}</div>
                        <div className="font-display font-bold truncate">{title || `New ${CAT.label} in Kashmir`}</div>
                        <div className="text-xs text-muted-foreground truncate">{location || 'Location not set'}{price ? ` · ₹${Number(price).toLocaleString('en-IN')}/${priceUnitForCategory(CAT.key)}` : ''}</div>
                      </div>
                    </div>
                    <ReviewChips catKey={CAT.key} details={details} />
                  </div>
                </div>

                <Button onClick={handlePublish} disabled={submitting || !price} className="w-full rounded-full bg-emerald2 hover:bg-emerald2-deep h-12 font-semibold text-base">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Publish listing'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav */}
          <div className="mt-8 flex justify-between">
            <Button variant="outline" className="rounded-full" disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}><ChevronLeft className="size-4 mr-1" /> Back</Button>
            <Button
              className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold"
              disabled={
                step===2 ||
                (step===0 && !categoryKey) ||
                (step===1 && !requiredFilledForStep1)
              }
              onClick={()=>setStep(Math.min(2,step+1))}
            >
              Continue <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </motion.div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-3xl border bg-gradient-to-br from-emerald-50/60 to-white p-6">
            <Sparkles className="size-5 text-emerald2" />
            <div className="font-display font-bold text-lg mt-3">Category-first is faster</div>
            <ul className="mt-3 space-y-2 text-sm text-charcoal/80">
              <li className="flex gap-2"><Check className="size-4 text-emerald2 mt-0.5" /> Only relevant fields — no noise</li>
              <li className="flex gap-2"><Check className="size-4 text-emerald2 mt-0.5" /> Ready in under 3 minutes</li>
              <li className="flex gap-2"><Check className="size-4 text-emerald2 mt-0.5" /> Photos + pricing at the end</li>
            </ul>
          </div>

          {CAT && (
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Live preview</div>
              <div className="flex items-center gap-3">
                <div className={`size-12 rounded-2xl bg-gradient-to-br ${CAT.hue} grid place-items-center text-white text-xl`}>{CAT.emoji}</div>
                <div className="min-w-0">
                  <div className="font-display font-bold truncate">{title || `New ${CAT.label}`}</div>
                  <div className="text-xs text-muted-foreground truncate">{location || 'Location'}{price ? ` · ₹${Number(price).toLocaleString('en-IN')}` : ''}</div>
                </div>
              </div>
              <ReviewChips catKey={CAT.key} details={details} compact />
            </div>
          )}
        </aside>
      </div>
      <Footer />
    </main>
  );
}

function priceUnitForCategory(key) {
  switch (key) {
    case 'stay': return 'night';
    case 'cab': return 'trip';
    case 'bike': return 'day';
    case 'food': return 'person';
    case 'guide': return 'day';
    case 'photography': return 'session';
    case 'adventure': return 'person';
    case 'cultural': return 'person';
    case 'shopping': return 'tour';
    default: return 'service';
  }
}

// ---------- Category-specific field forms ----------
function CategorySpecificFields({ catKey, details, setD }) {
  if (catKey === 'stay') {
    return (
      <div className="space-y-4">
        <Field label="Property type">
          <PillSelect options={['Hotel','Homestay','Houseboat','Villa','Cottage','Apartment']} value={details.propertyType || ''} onChange={(v)=>setD('propertyType', v)} />
        </Field>
        <Field label="Room types">
          <TagInput value={details.roomTypes || []} onChange={(v)=>setD('roomTypes', v)} placeholder="e.g. Deluxe" suggestions={['Standard','Deluxe','Suite','Family','Dormitory']} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Number of rooms"><input type="number" min="1" value={details.numRooms || ''} onChange={(e)=>setD('numRooms', e.target.value)} placeholder="e.g. 12" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
          <Field label="Max guests"><input type="number" min="1" value={details.maxGuests || ''} onChange={(e)=>setD('maxGuests', e.target.value)} placeholder="e.g. 24" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
        </div>
        <Field label="Amenities">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {AMEN.map(a => {
              const on = (details.amenities || []).includes(a.t);
              const I = a.i;
              return (
                <button key={a.t} type="button" onClick={()=>{ const cur = details.amenities||[]; setD('amenities', on ? cur.filter(x=>x!==a.t) : [...cur, a.t]); }} className={`p-2.5 rounded-xl border-2 text-left transition flex items-center gap-2 ${on?'border-emerald-600 bg-emerald-50/40':'border-border hover:border-charcoal/40'}`}>
                  <I className="size-4 text-emerald2" /><span className="text-sm font-medium">{a.t}</span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    );
  }

  if (catKey === 'cab') {
    return (
      <div className="space-y-4">
        <Field label="Vehicle type">
          <PillSelect options={['Sedan','SUV','Hatchback','Traveller','Tempo','Luxury']} value={details.vehicleType || ''} onChange={(v)=>setD('vehicleType', v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Seats"><input type="number" min="1" value={details.seats || ''} onChange={(e)=>setD('seats', e.target.value)} placeholder="e.g. 4" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
          <Field label="Driver included">
            <PillSelect options={['Yes','No','Optional']} value={details.driverIncluded || ''} onChange={(v)=>setD('driverIncluded', v)} />
          </Field>
        </div>
        <Field label="Fuel policy">
          <PillSelect options={['Included','Excluded','Return same level']} value={details.fuelPolicy || ''} onChange={(v)=>setD('fuelPolicy', v)} />
        </Field>
        <Field label="Pricing model" hint="Set base price on the next step">
          <PillSelect options={['Per trip','Per km','Per day','Per hour']} value={details.pricingModel || ''} onChange={(v)=>setD('pricingModel', v)} />
        </Field>
      </div>
    );
  }

  if (catKey === 'bike') {
    return (
      <div className="space-y-4">
        <Field label="Bike type">
          <PillSelect options={['Scooter','Cruiser','Sport','Adventure','Electric']} value={details.bikeType || ''} onChange={(v)=>setD('bikeType', v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand"><input value={details.brand || ''} onChange={(e)=>setD('brand', e.target.value)} placeholder="e.g. Royal Enfield" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
          <Field label="Model"><input value={details.model || ''} onChange={(e)=>setD('model', e.target.value)} placeholder="e.g. Himalayan 450" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Helmet included">
            <PillSelect options={['Yes','No','Extra charge']} value={details.helmetIncluded || ''} onChange={(v)=>setD('helmetIncluded', v)} />
          </Field>
          <Field label="Security deposit (₹)"><input type="number" min="0" value={details.deposit || ''} onChange={(e)=>setD('deposit', e.target.value)} placeholder="e.g. 5000" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
        </div>
        <Field label="Pricing model">
          <PillSelect options={['Per hour','Per day','Weekly']} value={details.pricingModel || ''} onChange={(v)=>setD('pricingModel', v)} />
        </Field>
      </div>
    );
  }

  if (catKey === 'food') {
    return (
      <div className="space-y-4">
        <Field label="Cuisine">
          <TagInput value={details.cuisine || []} onChange={(v)=>setD('cuisine', v)} placeholder="e.g. Kashmiri" suggestions={['Kashmiri','Mughlai','Continental','Chinese','South Indian','Vegan','Wazwan']} />
        </Field>
        <Field label="Meal types">
          <ChipSelect options={['Breakfast','Lunch','Dinner','Brunch','Snacks','Dessert']} value={details.mealTypes || []} onChange={(v)=>setD('mealTypes', v)} />
        </Field>
        <Field label="Dietary">
          <PillSelect options={['Veg','Non-Veg','Both']} value={details.dietary || ''} onChange={(v)=>setD('dietary', v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Serving capacity"><input type="number" min="1" value={details.capacity || ''} onChange={(e)=>setD('capacity', e.target.value)} placeholder="e.g. 20" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
          <Field label="Service style">
            <PillSelect options={['Dine-in','Delivery','Both']} value={details.serviceStyle || ''} onChange={(v)=>setD('serviceStyle', v)} />
          </Field>
        </div>
      </div>
    );
  }

  if (catKey === 'guide') {
    return (
      <div className="space-y-4">
        <Field label="Languages spoken">
          <TagInput value={details.languages || []} onChange={(v)=>setD('languages', v)} placeholder="e.g. English" suggestions={['English','Hindi','Urdu','Kashmiri','French','German','Spanish']} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Years of experience"><input type="number" min="0" value={details.experience || ''} onChange={(e)=>setD('experience', e.target.value)} placeholder="e.g. 5" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
          <Field label="Group size (max)"><input type="number" min="1" value={details.groupSize || ''} onChange={(e)=>setD('groupSize', e.target.value)} placeholder="e.g. 10" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
        </div>
        <Field label="Regions covered">
          <TagInput value={details.regions || []} onChange={(v)=>setD('regions', v)} placeholder="e.g. Gulmarg" suggestions={['Srinagar','Gulmarg','Pahalgam','Sonamarg','Leh','Ladakh']} />
        </Field>
        <Field label="Certificates / Licenses">
          <TagInput value={details.certificates || []} onChange={(v)=>setD('certificates', v)} placeholder="e.g. IITTM Certified" />
        </Field>
      </div>
    );
  }

  if (catKey === 'photography') {
    return (
      <div className="space-y-4">
        <Field label="Photography type">
          <ChipSelect options={['Portrait','Wedding','Landscape','Adventure','Event','Product','Drone']} value={details.photographyTypes || []} onChange={(v)=>setD('photographyTypes', v)} />
        </Field>
        <Field label="Packages">
          <TagInput value={details.packages || []} onChange={(v)=>setD('packages', v)} placeholder="e.g. 2hr shoot + 20 edits" />
        </Field>
        <Field label="Equipment">
          <TagInput value={details.equipment || []} onChange={(v)=>setD('equipment', v)} placeholder="e.g. Sony A7 IV" suggestions={['DSLR','Mirrorless','Drone','Gimbal','Lighting kit']} />
        </Field>
        <Field label="Portfolio link"><input value={details.portfolioUrl || ''} onChange={(e)=>setD('portfolioUrl', e.target.value)} placeholder="https://your-portfolio.com" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
      </div>
    );
  }

  if (catKey === 'adventure') {
    return (
      <div className="space-y-4">
        <Field label="Activity type">
          <PillSelect options={['Trekking','Skiing','Rafting','Paragliding','Climbing','Cycling','Camping']} value={details.activityType || ''} onChange={(v)=>setD('activityType', v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Difficulty">
            <PillSelect options={['Easy','Moderate','Hard','Expert']} value={details.difficulty || ''} onChange={(v)=>setD('difficulty', v)} />
          </Field>
          <Field label="Group size"><input type="number" min="1" value={details.groupSize || ''} onChange={(e)=>setD('groupSize', e.target.value)} placeholder="e.g. 8" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
        </div>
        <Field label="Equipment included">
          <TagInput value={details.equipment || []} onChange={(v)=>setD('equipment', v)} placeholder="e.g. Helmet" suggestions={['Helmet','Harness','Boots','Tent','Sleeping bag','Rope','Life jacket']} />
        </Field>
      </div>
    );
  }

  if (catKey === 'cultural') {
    return (
      <div className="space-y-4">
        <Field label="Experience type">
          <PillSelect options={['Craft workshop','Music','Dance','Cooking class','Storytelling','Festival','Local visit']} value={details.experienceType || ''} onChange={(v)=>setD('experienceType', v)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (hours)"><input type="number" min="1" step="0.5" value={details.durationHours || ''} onChange={(e)=>setD('durationHours', e.target.value)} placeholder="e.g. 3" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
          <Field label="Group size"><input type="number" min="1" value={details.groupSize || ''} onChange={(e)=>setD('groupSize', e.target.value)} placeholder="e.g. 6" className="w-full px-3 py-2 rounded-xl border text-sm" /></Field>
        </div>
        <Field label="Languages">
          <TagInput value={details.languages || []} onChange={(v)=>setD('languages', v)} placeholder="e.g. English" suggestions={['English','Hindi','Kashmiri']} />
        </Field>
      </div>
    );
  }

  if (catKey === 'shopping') {
    return (
      <div className="space-y-4">
        <Field label="Shopping type">
          <PillSelect options={['Handicrafts','Textiles','Jewelry','Spices','Souvenirs','Antiques']} value={details.shoppingType || ''} onChange={(v)=>setD('shoppingType', v)} />
        </Field>
        <Field label="Markets covered">
          <TagInput value={details.markets || []} onChange={(v)=>setD('markets', v)} placeholder="e.g. Lal Chowk" suggestions={['Lal Chowk','Polo View','Residency Road','Old City Bazaar']} />
        </Field>
        <Field label="Languages">
          <TagInput value={details.languages || []} onChange={(v)=>setD('languages', v)} placeholder="e.g. Hindi" suggestions={['English','Hindi','Kashmiri','Urdu']} />
        </Field>
        <Field label="Duration">
          <PillSelect options={['1 hour','2 hours','Half day','Full day']} value={details.duration || ''} onChange={(v)=>setD('duration', v)} />
        </Field>
      </div>
    );
  }

  // 'other' — generic
  return (
    <div className="space-y-4">
      <Field label="Service name / short summary">
        <input value={details.summary || ''} onChange={(e)=>setD('summary', e.target.value)} placeholder="What are you offering?" className="w-full px-3 py-2 rounded-xl border text-sm" />
      </Field>
      <Field label="Highlights / includes">
        <TagInput value={details.highlights || []} onChange={(v)=>setD('highlights', v)} placeholder="Add a highlight" />
      </Field>
      <Field label="Duration / frequency">
        <input value={details.duration || ''} onChange={(e)=>setD('duration', e.target.value)} placeholder="e.g. 2 hours" className="w-full px-3 py-2 rounded-xl border text-sm" />
      </Field>
    </div>
  );
}

function ReviewChips({ catKey, details, compact }) {
  const chips = [];
  const push = (k, v) => { if (v && (Array.isArray(v) ? v.length : true)) chips.push({ k, v: Array.isArray(v) ? v.join(', ') : v }); };
  switch (catKey) {
    case 'stay':
      push('Property', details.propertyType);
      push('Rooms', details.numRooms);
      push('Guests', details.maxGuests);
      push('Amenities', details.amenities);
      break;
    case 'cab':
      push('Vehicle', details.vehicleType);
      push('Seats', details.seats);
      push('Driver', details.driverIncluded);
      break;
    case 'bike':
      push('Bike', details.bikeType);
      push('Model', [details.brand, details.model].filter(Boolean).join(' '));
      push('Deposit', details.deposit ? `₹${details.deposit}` : '');
      break;
    case 'food':
      push('Cuisine', details.cuisine);
      push('Meals', details.mealTypes);
      push('Dietary', details.dietary);
      break;
    case 'guide':
      push('Languages', details.languages);
      push('Experience', details.experience ? `${details.experience} yrs` : '');
      push('Regions', details.regions);
      break;
    case 'photography':
      push('Types', details.photographyTypes);
      push('Equipment', details.equipment);
      break;
    case 'adventure':
      push('Activity', details.activityType);
      push('Difficulty', details.difficulty);
      push('Group', details.groupSize);
      break;
    case 'cultural':
      push('Experience', details.experienceType);
      push('Duration', details.durationHours ? `${details.durationHours} hrs` : '');
      break;
    case 'shopping':
      push('Shopping', details.shoppingType);
      push('Markets', details.markets);
      push('Duration', details.duration);
      break;
    default:
      push('Summary', details.summary);
      push('Highlights', details.highlights);
  }
  if (chips.length === 0) return null;
  return (
    <div className={`mt-3 flex flex-wrap gap-1.5 ${compact ? '' : ''}`}>
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-charcoal text-[11px] border border-border">
          <span className="text-muted-foreground">{c.k}:</span>
          <span className="font-semibold">{c.v}</span>
        </span>
      ))}
    </div>
  );
}

export default function App() {
  return <ProtectedRoute roles={['host','admin','super_admin']}><AddListingInner /></ProtectedRoute>;
}
