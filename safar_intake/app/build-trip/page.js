'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles, MapPin, Calendar, Users, Wallet, ChevronLeft, ChevronRight, Check, Plus, Minus,
  Hotel, Car, Bike, Compass, UtensilsCrossed, Camera, Mountain, ShoppingBag, Plane, Drama, Edit3,
  Wifi, ParkingCircle, Coffee, Wind, Image as ImageIcon, ListChecks, Star
} from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import { Button } from '@/components/ui/button';

// PERF: Footer is far below the fold on a wizard-style page — dynamic import
// keeps the initial Build-Trip JS bundle lean; only the current step's data
// blocks first paint.
const Footer = dynamic(() => import('@/components/safar/Footer'), { ssr: true });

// ---------- Config ----------
const DESTINATIONS = [
  { key: 'srinagar', label: 'Srinagar', emoji: '🌸', tag: 'Dal Lake · Old City' },
  { key: 'gulmarg',  label: 'Gulmarg',  emoji: '⛷',  tag: 'Snow · Gondola' },
  { key: 'pahalgam', label: 'Pahalgam', emoji: '🏞',  tag: 'Rivers · Meadows' },
  { key: 'sonamarg', label: 'Sonamarg', emoji: '🏔',  tag: 'Glaciers · Trek' },
  { key: 'leh',      label: 'Leh',      emoji: '🏜',  tag: 'Ladakh · Monasteries' },
  { key: 'jammu',    label: 'Jammu',    emoji: '🛕',  tag: 'Vaishno Devi' },
];

const BUDGET_TIERS = [
  { key: 'budget',   label: 'Budget',   range: '₹5k – ₹15k',   hue: 'from-emerald-400 to-teal-400',   Icon: Wallet,   tip: 'Great value stays & shared rides' },
  { key: 'standard', label: 'Standard', range: '₹15k – ₹35k',  hue: 'from-sky-400 to-indigo-400',     Icon: Star,     tip: '3-star stays, private cabs' },
  { key: 'premium',  label: 'Premium',  range: '₹35k – ₹75k',  hue: 'from-violet-400 to-fuchsia-400', Icon: Sparkles, tip: '4-star stays, curated guides' },
  { key: 'luxury',   label: 'Luxury',   range: '₹75k+',        hue: 'from-amber-400 to-rose-400',     Icon: Sparkles, tip: 'Boutique stays, exclusive access' },
  { key: 'custom',   label: 'Custom',   range: 'Set your own', hue: 'from-slate-400 to-zinc-400',     Icon: Edit3,    tip: 'Enter an exact budget' },
];

const SERVICES = [
  { key: 'accommodation', label: 'Accommodation',  emoji: '🏨', Icon: Hotel,           hue: 'from-emerald-400 to-teal-400' },
  { key: 'cab',           label: 'Cab',            emoji: '🚗', Icon: Car,             hue: 'from-sky-400 to-blue-400' },
  { key: 'bike',          label: 'Bike Rental',    emoji: '🏍', Icon: Bike,            hue: 'from-orange-400 to-amber-400' },
  { key: 'guide',         label: 'Tour Guide',     emoji: '🧭', Icon: Compass,         hue: 'from-lime-400 to-green-400' },
  { key: 'food',          label: 'Food',           emoji: '🍽', Icon: UtensilsCrossed, hue: 'from-rose-400 to-pink-400' },
  { key: 'photography',   label: 'Photography',    emoji: '📸', Icon: Camera,          hue: 'from-violet-400 to-purple-400' },
  { key: 'adventure',     label: 'Adventure',      emoji: '🎿', Icon: Mountain,        hue: 'from-red-400 to-orange-400' },
  { key: 'shopping',      label: 'Shopping',       emoji: '🛍', Icon: ShoppingBag,     hue: 'from-pink-400 to-fuchsia-400' },
  { key: 'airport',       label: 'Airport Pickup', emoji: '✈️', Icon: Plane,           hue: 'from-cyan-400 to-blue-400' },
  { key: 'experience',    label: 'Experiences',    emoji: '🎭', Icon: Drama,           hue: 'from-amber-400 to-orange-400' },
];

const STAY_AMENITIES = [
  { i: Wifi, t: 'Wi-Fi' },
  { i: ParkingCircle, t: 'Parking' },
  { i: Coffee, t: 'Breakfast' },
  { i: Wind, t: 'Heater' },
  { i: ImageIcon, t: 'Mountain view' },
  { i: ListChecks, t: 'Housekeeping' },
];

const STEPS = [
  { key: 'destination', label: 'Destination' },
  { key: 'dates',       label: 'Dates' },
  { key: 'travelers',   label: 'Travelers' },
  { key: 'budget',      label: 'Budget' },
  { key: 'services',    label: 'Services' },
  { key: 'filters',     label: 'Preferences' },
  { key: 'review',      label: 'Review' },
];

const DRAFT_KEY = 'safar_trip_draft';

// ---------- Small helpers ----------
function Pill({ children, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${active ? 'bg-emerald2 text-white border-emerald2' : 'bg-white text-charcoal border-border hover:border-emerald2'}`}>{children}</button>
  );
}

function Counter({ label, value, onChange, min = 0, max = 20, sub }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white/70 backdrop-blur px-4 py-3.5">
      <div>
        <div className="font-semibold text-sm">{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="size-9 rounded-full border grid place-items-center disabled:opacity-40 hover:bg-secondary transition"><Minus className="size-4" /></button>
        <div className="w-8 text-center font-semibold">{value}</div>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="size-9 rounded-full border grid place-items-center disabled:opacity-40 hover:bg-secondary transition"><Plus className="size-4" /></button>
      </div>
    </div>
  );
}

function StepHeader({ stepNumber, icon, label, subtitle }) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full bg-emerald-50 text-emerald2 text-[10px] md:text-[11px] uppercase tracking-wider font-semibold border border-emerald-200">
        {icon} Step {stepNumber}
      </div>
      <h2 className="font-display text-xl sm:text-2xl md:text-3xl leading-tight font-bold mt-2 md:mt-3">{label}</h2>
      {subtitle && <p className="text-[13px] md:text-sm text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function BigCard({ active, onClick, emoji, title, sub }) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden p-3 md:p-4 rounded-2xl border-2 text-left transition ${active ? 'border-emerald2 shadow-xl ring-4 ring-emerald2/10 bg-emerald-50/30' : 'border-border hover:border-emerald2/50 hover:shadow-md bg-white'}`}
    >
      <div className="text-xl md:text-2xl">{emoji}</div>
      <div className="font-display font-bold text-sm md:text-base mt-1.5 md:mt-2">{title}</div>
      <div className="text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-tight">{sub}</div>
      {active && <div className="absolute -top-1 -right-1 size-5 md:size-6 rounded-full bg-emerald2 text-white grid place-items-center shadow"><Check className="size-3 md:size-3.5" /></div>}
    </button>
  );
}

function FilterBlock({ title, emoji, children }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{emoji}</span>
        <div className="font-display font-bold">{title}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value, onEdit }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className="font-semibold text-sm mt-1 break-words">{value}</div>
      </div>
      <button onClick={onEdit} className="shrink-0 text-emerald2 text-xs font-semibold inline-flex items-center gap-1 hover:underline"><Edit3 className="size-3" /> Edit</button>
    </div>
  );
}

function MiniCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border bg-white/70 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">{icon} {label}</div>
      <div className="font-semibold text-sm mt-1 truncate">{value}</div>
    </div>
  );
}

// ---------- Main Page ----------
export default function BuildTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // State model
  const [destination, setDestination] = useState('');
  const [customDest, setCustomDest] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [budgetTier, setBudgetTier] = useState('');
  const [customBudget, setCustomBudget] = useState('');
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({});

  // Restore draft on mount (within 24h)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || !d.draft) return;
      if (d.savedAt && Date.now() - d.savedAt < 24 * 60 * 60 * 1000) {
        const t = d.draft;
        if (t.destination) setDestination(t.destination);
        if (t.customDest) setCustomDest(t.customDest);
        if (t.startDate) setStartDate(t.startDate);
        if (t.endDate) setEndDate(t.endDate);
        if (typeof t.adults === 'number') setAdults(t.adults);
        if (typeof t.children === 'number') setChildren(t.children);
        if (typeof t.infants === 'number') setInfants(t.infants);
        if (t.budgetTier) setBudgetTier(t.budgetTier);
        if (t.customBudget) setCustomBudget(t.customBudget);
        if (Array.isArray(t.services)) setServices(t.services);
        if (t.filters) setFilters(t.filters);
      }
    } catch {}
  }, []);

  // Persist draft on any change
  useEffect(() => {
    const draft = { destination, customDest, startDate, endDate, adults, children, infants, budgetTier, customBudget, services, filters };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), draft })); } catch {}
  }, [destination, customDest, startDate, endDate, adults, children, infants, budgetTier, customBudget, services, filters]);

  const destLabel = useMemo(() => {
    if (destination === 'custom') return customDest || 'Custom destination';
    const d = DESTINATIONS.find(x => x.key === destination);
    return d ? d.label : '';
  }, [destination, customDest]);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return 0;
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  const budgetLabel = useMemo(() => {
    if (budgetTier === 'custom') return customBudget ? `₹${Number(customBudget).toLocaleString('en-IN')}` : 'Custom';
    const b = BUDGET_TIERS.find(x => x.key === budgetTier);
    return b ? `${b.label} (${b.range})` : '';
  }, [budgetTier, customBudget]);

  const canContinue = useMemo(() => {
    switch (step) {
      case 0: return destination === 'custom' ? !!customDest.trim() : !!destination;
      case 1: return !!startDate && !!endDate && nights > 0;
      case 2: return adults + children >= 1;
      case 3: return budgetTier === 'custom' ? !!customBudget && Number(customBudget) > 0 : !!budgetTier;
      case 4: return services.length > 0;
      case 5: return true;
      default: return true;
    }
  }, [step, destination, customDest, startDate, endDate, nights, adults, children, budgetTier, customBudget, services]);

  const totalTravelers = adults + children + infants;

  const setF = (sk, key, value) => setFilters(prev => ({ ...prev, [sk]: { ...(prev[sk] || {}), [key]: value } }));
  const toggleFArr = (sk, key, item) => {
    setFilters(prev => {
      const cur = (prev[sk] && prev[sk][key]) || [];
      const next = cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item];
      return { ...prev, [sk]: { ...(prev[sk] || {}), [key]: next } };
    });
  };

  const [submitting, setSubmitting] = useState(false);

  const handleContinueToBooking = async () => {
    if (submitting) return;
    const draft = {
      destination: destLabel,
      destinationKey: destination,
      startDate, endDate, nights,
      travelers: { adults, children, infants, total: totalTravelers },
      budget: { tier: budgetTier, custom: customBudget, label: budgetLabel },
      services,
      filters,
      createdAt: new Date().toISOString(),
    };
    try { localStorage.setItem('safar_pending_trip', JSON.stringify(draft)); } catch {}
    setSubmitting(true);
    try {
      const res = await fetch('/api/trip-orchestrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ draft }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          toast.error('Please sign in to continue booking');
          router.push('/login?next=/build-trip');
          return;
        }
        throw new Error(data.error || 'Failed to start orchestration');
      }
      toast.success('Finding hosts for your trip…');
      router.push(`/trip/${data.tripId}`);
    } catch (e) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const goto = (i) => setStep(Math.min(STEPS.length - 1, Math.max(0, i)));
  const next = () => goto(step + 1);
  const back = () => goto(step - 1);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-white overflow-x-hidden">
      <Navbar />
      <div className="pt-20 md:pt-24 container px-4 sm:px-6">
        <div className="flex items-center gap-2 text-emerald2 text-[11px] md:text-xs uppercase tracking-[0.18em] font-semibold">
          <Sparkles className="size-3.5 md:size-4" /> Build My Trip
        </div>
        <h1 className="font-display text-[26px] sm:text-3xl md:text-5xl leading-tight font-bold mt-1.5 md:mt-2">A guided way to plan your Safar</h1>
        <p className="mt-1.5 md:mt-2 text-muted-foreground max-w-2xl text-[13px] md:text-base leading-relaxed">Answer a few quick questions and we'll tailor the trip to exactly what you need — no marketplace hunting required.</p>

        {/* Progress */}
        <div className="mt-4 md:mt-6 relative -mx-4 sm:-mx-6 md:mx-0">
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-2 scrollbar-none px-4 sm:px-6 md:px-0">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <button
                  key={s.key}
                  onClick={() => (done ? goto(i) : null)}
                  className={`flex items-center gap-1.5 md:gap-2 shrink-0 ${done ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`size-7 md:size-8 rounded-full grid place-items-center text-[11px] md:text-xs font-bold transition ${active ? 'bg-gradient-emerald text-white scale-110 shadow-md' : done ? 'bg-emerald2 text-white' : 'bg-secondary text-muted-foreground'}`}>{done ? <Check className="size-3.5 md:size-4" /> : i + 1}</div>
                  <div className={`text-[11px] md:text-sm hidden xs:block sm:block ${active ? 'text-charcoal font-semibold' : done ? 'text-charcoal/70' : 'text-muted-foreground'}`}>{s.label}</div>
                  {i < STEPS.length - 1 && <div className={`w-3 md:w-6 h-px shrink-0 ${done ? 'bg-emerald2' : 'bg-border'}`} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mt-5 md:mt-8 grid lg:grid-cols-3 gap-4 md:gap-6 pb-10 md:pb-16 px-4 sm:px-6">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border bg-white/80 backdrop-blur shadow-xl p-4 sm:p-6 md:p-8"
            >
              {/* STEP 0: Destination */}
              {step === 0 && (
                <div>
                  <StepHeader stepNumber={1} icon={<MapPin className="size-3.5" />} label="Where are we heading?" subtitle="Pick a destination or type your own." />
                  <div className="mt-4 md:mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {DESTINATIONS.map(d => (
                      <BigCard key={d.key} active={destination === d.key} onClick={() => setDestination(d.key)} emoji={d.emoji} title={d.label} sub={d.tag} />
                    ))}
                    <BigCard active={destination === 'custom'} onClick={() => setDestination('custom')} emoji="🗺" title="Somewhere else" sub="Type your own" />
                  </div>
                  {destination === 'custom' && (
                    <div className="mt-4">
                      <input autoFocus value={customDest} onChange={(e) => setCustomDest(e.target.value)} placeholder="e.g. Kargil, Nubra Valley…" className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-emerald2" />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 1: Dates */}
              {step === 1 && (
                <div>
                  <StepHeader stepNumber={2} icon={<Calendar className="size-3.5" />} label="When would you like to travel?" subtitle="Pick your check-in and check-out dates." />
                  <div className="mt-4 md:mt-6 grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Start date</label>
                      <input type="date" value={startDate} min={new Date().toISOString().slice(0,10)} onChange={(e)=>setStartDate(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-xl border outline-none focus:border-emerald2" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">End date</label>
                      <input type="date" value={endDate} min={startDate || new Date().toISOString().slice(0,10)} onChange={(e)=>setEndDate(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-xl border outline-none focus:border-emerald2" />
                    </div>
                  </div>
                  {nights > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald2 text-sm font-semibold">
                      <Sparkles className="size-4" /> {nights} night{nights > 1 ? 's' : ''} · {nights + 1} day{nights + 1 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Travelers */}
              {step === 2 && (
                <div>
                  <StepHeader stepNumber={3} icon={<Users className="size-3.5" />} label="Who's coming with you?" subtitle="Count everyone joining the trip." />
                  <div className="mt-4 md:mt-6 grid gap-3">
                    <Counter label="Adults" sub="Age 13+" value={adults} onChange={setAdults} min={1} />
                    <Counter label="Children" sub="Age 3 – 12" value={children} onChange={setChildren} />
                    <Counter label="Infants" sub="Under 3" value={infants} onChange={setInfants} />
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">Total travelers: <span className="text-charcoal font-semibold">{totalTravelers}</span></div>
                </div>
              )}

              {/* STEP 3: Budget */}
              {step === 3 && (
                <div>
                  <StepHeader stepNumber={4} icon={<Wallet className="size-3.5" />} label="What's your budget?" subtitle="Rough guide — you'll see actual prices at checkout." />
                  <div className="mt-4 md:mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {BUDGET_TIERS.map(b => {
                      const Ic = b.Icon;
                      const on = budgetTier === b.key;
                      return (
                        <button key={b.key} onClick={() => setBudgetTier(b.key)} className={`relative overflow-hidden p-3 md:p-4 rounded-2xl border-2 text-left transition ${on ? 'border-emerald2 shadow-xl ring-4 ring-emerald2/10' : 'border-border hover:border-emerald2/50 hover:shadow-md'}`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${b.hue} transition ${on ? 'opacity-15' : 'opacity-0'}`} />
                          <div className="relative">
                            <div className={`size-9 md:size-10 rounded-xl bg-gradient-to-br ${b.hue} grid place-items-center text-white shadow`}>
                              <Ic className="size-4 md:size-5" />
                            </div>
                            <div className="font-display font-bold text-sm md:text-base mt-2 md:mt-3">{b.label}</div>
                            <div className="text-[11px] md:text-xs text-emerald2 font-semibold mt-0.5">{b.range}</div>
                            <div className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5 md:mt-1 leading-tight">{b.tip}</div>
                            {on && <div className="absolute -top-1 -right-1 size-5 md:size-6 rounded-full bg-emerald2 text-white grid place-items-center shadow"><Check className="size-3 md:size-3.5" /></div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {budgetTier === 'custom' && (
                    <div className="mt-4">
                      <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Your budget (₹, approx)</label>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl">₹</span>
                        <input type="number" value={customBudget} onChange={(e)=>setCustomBudget(e.target.value)} placeholder="0" className="flex-1 font-display text-3xl font-bold outline-none border-b-2 pb-2" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Services */}
              {step === 4 && (
                <div>
                  <StepHeader stepNumber={5} icon={<Sparkles className="size-3.5" />} label="What services would you like?" subtitle="Pick everything you need. We'll only ask for relevant preferences next." />
                  <div className="mt-4 md:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {SERVICES.map(s => {
                      const Ic = s.Icon;
                      const on = services.includes(s.key);
                      return (
                        <button key={s.key} onClick={() => setServices(on ? services.filter(x => x !== s.key) : [...services, s.key])} className={`relative overflow-hidden p-3 md:p-4 rounded-2xl border-2 text-left transition ${on ? 'border-emerald2 shadow-xl ring-4 ring-emerald2/10' : 'border-border hover:border-emerald2/50 hover:shadow-md'}`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${s.hue} transition ${on ? 'opacity-15' : 'opacity-0'}`} />
                          <div className="relative">
                            <div className="flex items-start justify-between">
                              <div className={`size-9 md:size-10 rounded-xl bg-gradient-to-br ${s.hue} grid place-items-center text-white shadow`}>
                                <Ic className="size-4 md:size-5" />
                              </div>
                              <span className="text-lg md:text-xl">{s.emoji}</span>
                            </div>
                            <div className="font-semibold text-[13px] md:text-sm mt-2 md:mt-2.5 leading-tight">{s.label}</div>
                            {on && <div className="absolute -top-1 -right-1 size-5 md:size-6 rounded-full bg-emerald2 text-white grid place-items-center shadow"><Check className="size-3 md:size-3.5" /></div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">Selected: <span className="font-semibold text-charcoal">{services.length}</span></div>
                </div>
              )}

              {/* STEP 5: Filters (relevant to selected services only) */}
              {step === 5 && (
                <div>
                  <StepHeader stepNumber={6} icon={<Sparkles className="size-3.5" />} label="Let's fine-tune your preferences" subtitle="Only filters that matter for what you picked." />
                  {services.length === 0 && (
                    <div className="mt-6 p-6 rounded-2xl border bg-secondary/30 text-sm text-muted-foreground text-center">
                      No services selected yet. Go back to add some.
                    </div>
                  )}
                  <div className="mt-6 space-y-5">
                    {services.includes('accommodation') && (
                      <FilterBlock title="Hotel / Stay" emoji="🏨">
                        <FilterRow label="Room type">
                          <div className="flex flex-wrap gap-2">
                            {['Standard','Deluxe','Suite','Family','Dormitory'].map(o => (
                              <Pill key={o} active={(filters.accommodation?.roomType || []).includes(o)} onClick={() => toggleFArr('accommodation','roomType',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Star rating">
                          <div className="flex flex-wrap gap-2">
                            {['3★','4★','5★'].map(o => (
                              <Pill key={o} active={(filters.accommodation?.rating || []).includes(o)} onClick={() => toggleFArr('accommodation','rating',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Amenities">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {STAY_AMENITIES.map(a => {
                              const on = (filters.accommodation?.amenities || []).includes(a.t);
                              const I = a.i;
                              return (
                                <button key={a.t} type="button" onClick={() => toggleFArr('accommodation','amenities',a.t)} className={`p-2.5 rounded-xl border-2 text-left flex items-center gap-2 transition ${on ? 'border-emerald2 bg-emerald-50/40' : 'border-border hover:border-charcoal/30'}`}>
                                  <I className="size-4 text-emerald2" /><span className="text-xs font-medium">{a.t}</span>
                                </button>
                              );
                            })}
                          </div>
                        </FilterRow>
                        <FilterRow label="Max nightly price (₹)">
                          <input type="number" min="0" value={filters.accommodation?.maxPrice || ''} onChange={(e)=>setF('accommodation','maxPrice',e.target.value)} placeholder="e.g. 6000" className="w-full px-3 py-2 rounded-xl border text-sm" />
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('cab') && (
                      <FilterBlock title="Cab" emoji="🚗">
                        <FilterRow label="Vehicle type">
                          <div className="flex flex-wrap gap-2">
                            {['Sedan','SUV','Hatchback','Traveller','Luxury'].map(o => (
                              <Pill key={o} active={(filters.cab?.vehicleType || []).includes(o)} onClick={() => toggleFArr('cab','vehicleType',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Seats needed">
                          <div className="flex flex-wrap gap-2">
                            {[4,6,8,12].map(o => (
                              <Pill key={o} active={filters.cab?.seats === o} onClick={() => setF('cab','seats',o)}>{o}+</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Driver included">
                          <div className="flex flex-wrap gap-2">
                            {['Yes','No','Either'].map(o => (
                              <Pill key={o} active={filters.cab?.driver === o} onClick={() => setF('cab','driver',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('bike') && (
                      <FilterBlock title="Bike Rental" emoji="🏍">
                        <FilterRow label="Bike type">
                          <div className="flex flex-wrap gap-2">
                            {['Scooter','Cruiser','Sport','Adventure','Electric'].map(o => (
                              <Pill key={o} active={(filters.bike?.bikeType || []).includes(o)} onClick={() => toggleFArr('bike','bikeType',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Helmet included">
                          <div className="flex flex-wrap gap-2">
                            {['Yes','No','Either'].map(o => (
                              <Pill key={o} active={filters.bike?.helmet === o} onClick={() => setF('bike','helmet',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('guide') && (
                      <FilterBlock title="Tour Guide" emoji="🧭">
                        <FilterRow label="Languages">
                          <div className="flex flex-wrap gap-2">
                            {['English','Hindi','Urdu','Kashmiri','French','German','Spanish'].map(o => (
                              <Pill key={o} active={(filters.guide?.languages || []).includes(o)} onClick={() => toggleFArr('guide','languages',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Minimum experience (years)">
                          <div className="flex flex-wrap gap-2">
                            {[1,3,5,10].map(o => (
                              <Pill key={o} active={filters.guide?.minExperience === o} onClick={() => setF('guide','minExperience',o)}>{o}+</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('food') && (
                      <FilterBlock title="Food" emoji="🍽">
                        <FilterRow label="Cuisine">
                          <div className="flex flex-wrap gap-2">
                            {['Kashmiri','Wazwan','Mughlai','Continental','South Indian','Chinese','Vegan'].map(o => (
                              <Pill key={o} active={(filters.food?.cuisine || []).includes(o)} onClick={() => toggleFArr('food','cuisine',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Meal">
                          <div className="flex flex-wrap gap-2">
                            {['Breakfast','Lunch','Dinner','Brunch','Snacks'].map(o => (
                              <Pill key={o} active={(filters.food?.meal || []).includes(o)} onClick={() => toggleFArr('food','meal',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Dietary">
                          <div className="flex flex-wrap gap-2">
                            {['Vegetarian','Non-Vegetarian','Both'].map(o => (
                              <Pill key={o} active={filters.food?.dietary === o} onClick={() => setF('food','dietary',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('photography') && (
                      <FilterBlock title="Photography" emoji="📸">
                        <FilterRow label="Type">
                          <div className="flex flex-wrap gap-2">
                            {['Portrait','Landscape','Wedding','Adventure','Drone'].map(o => (
                              <Pill key={o} active={(filters.photography?.type || []).includes(o)} onClick={() => toggleFArr('photography','type',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('adventure') && (
                      <FilterBlock title="Adventure" emoji="🎿">
                        <FilterRow label="Activity">
                          <div className="flex flex-wrap gap-2">
                            {['Trekking','Skiing','Rafting','Paragliding','Climbing','Cycling'].map(o => (
                              <Pill key={o} active={(filters.adventure?.activity || []).includes(o)} onClick={() => toggleFArr('adventure','activity',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Difficulty">
                          <div className="flex flex-wrap gap-2">
                            {['Easy','Moderate','Hard','Expert'].map(o => (
                              <Pill key={o} active={filters.adventure?.difficulty === o} onClick={() => setF('adventure','difficulty',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('shopping') && (
                      <FilterBlock title="Shopping" emoji="🛍">
                        <FilterRow label="Interested in">
                          <div className="flex flex-wrap gap-2">
                            {['Handicrafts','Textiles','Jewelry','Spices','Souvenirs','Antiques'].map(o => (
                              <Pill key={o} active={(filters.shopping?.interests || []).includes(o)} onClick={() => toggleFArr('shopping','interests',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('airport') && (
                      <FilterBlock title="Airport Pickup" emoji="✈️">
                        <FilterRow label="Pickup type">
                          <div className="flex flex-wrap gap-2">
                            {['Sedan','SUV','Traveller','Luxury'].map(o => (
                              <Pill key={o} active={filters.airport?.vehicleType === o} onClick={() => setF('airport','vehicleType',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                        <FilterRow label="Direction">
                          <div className="flex flex-wrap gap-2">
                            {['Airport → Stay','Stay → Airport','Both ways'].map(o => (
                              <Pill key={o} active={filters.airport?.direction === o} onClick={() => setF('airport','direction',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}

                    {services.includes('experience') && (
                      <FilterBlock title="Experiences" emoji="🎭">
                        <FilterRow label="Type">
                          <div className="flex flex-wrap gap-2">
                            {['Cultural','Craft workshop','Music','Cooking class','Storytelling','Festival'].map(o => (
                              <Pill key={o} active={(filters.experience?.type || []).includes(o)} onClick={() => toggleFArr('experience','type',o)}>{o}</Pill>
                            ))}
                          </div>
                        </FilterRow>
                      </FilterBlock>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 6: Review & Continue */}
              {step === 6 && (
                <div>
                  <StepHeader stepNumber={7} icon={<Check className="size-3.5" />} label="Your trip so far" subtitle="Review everything, edit if needed, then continue." />

                  <div className="mt-6 space-y-4">
                    <ReviewRow label="Destination" value={destLabel || '—'} onEdit={() => goto(0)} />
                    <ReviewRow label="Dates" value={startDate && endDate ? `${startDate} → ${endDate} (${nights} night${nights !== 1 ? 's' : ''})` : '—'} onEdit={() => goto(1)} />
                    <ReviewRow label="Travelers" value={`${adults} adult${adults !== 1 ? 's' : ''}${children ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}${infants ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''} · Total ${totalTravelers}`} onEdit={() => goto(2)} />
                    <ReviewRow label="Estimated budget" value={budgetLabel || '—'} onEdit={() => goto(3)} />
                    <ReviewRow label="Selected services" value={services.length === 0 ? '—' : services.map(sk => SERVICES.find(s => s.key === sk)?.label || sk).join(' · ')} onEdit={() => goto(4)} />
                    {services.length > 0 && Object.keys(filters).length > 0 && (
                      <div className="rounded-2xl border bg-white/70 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Preferences</div>
                          <button onClick={() => goto(5)} className="text-emerald2 text-xs font-semibold inline-flex items-center gap-1 hover:underline"><Edit3 className="size-3" /> Edit</button>
                        </div>
                        <div className="space-y-2">
                          {services.map(sk => {
                            const f = filters[sk];
                            if (!f || Object.keys(f).length === 0) return null;
                            const svc = SERVICES.find(s => s.key === sk);
                            return (
                              <div key={sk} className="text-xs">
                                <span className="font-semibold text-charcoal">{svc?.emoji} {svc?.label}:</span>{' '}
                                <span className="text-muted-foreground">
                                  {Object.entries(f).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 md:mt-8 rounded-2xl border bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-rose-50/30 p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <div className="size-8 md:size-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white grid place-items-center shrink-0"><Sparkles className="size-4 md:size-5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13px] md:text-sm">Live host orchestration</div>
                        <div className="text-[11px] md:text-xs text-muted-foreground mt-1 leading-relaxed">When you continue, Safar will instantly match verified hosts for every service you selected, contact the best-ranked providers, and confirm your bookings — all in one live progress screen.</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button onClick={back} variant="outline" className="rounded-full sm:w-auto h-11 md:h-10" disabled={submitting}>
                      <ChevronLeft className="size-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={handleContinueToBooking}
                      disabled={submitting || services.length === 0}
                      className="rounded-full flex-1 h-11 md:h-12 font-semibold text-[14px] md:text-base bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/25 disabled:opacity-60"
                    >
                      {submitting ? (
                        <><span className="mr-2 inline-block size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Starting orchestration…</>
                      ) : (
                        <>Continue to Booking <ChevronRight className="size-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Nav (for steps 0..5) */}
              {step < 6 && (
                <div className="mt-6 md:mt-8 flex justify-between gap-2">
                  <Button variant="outline" size="sm" className="rounded-full min-w-[92px] md:min-w-0 md:size-default" disabled={step === 0} onClick={back}>
                    <ChevronLeft className="size-4 mr-1" /> Back
                  </Button>
                  <Button size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold min-w-[110px] md:min-w-0 md:size-default" disabled={!canContinue} onClick={next}>
                    Continue <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar preview */}
        <aside className="space-y-3 md:space-y-4">
          <div className="rounded-3xl border bg-white/80 backdrop-blur p-4 md:p-6 shadow-sm lg:sticky lg:top-24">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Trip preview</div>
            <div className="font-display font-bold text-lg">{destLabel || 'Your Kashmir trip'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {startDate && endDate ? `${startDate} → ${endDate}` : 'Dates: not set'}
              {nights > 0 && ` · ${nights} night${nights > 1 ? 's' : ''}`}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniCard icon={<Users className="size-4" />} label="Travelers" value={`${totalTravelers}`} />
              <MiniCard icon={<Wallet className="size-4" />} label="Budget" value={budgetLabel || '—'} />
            </div>
            {services.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Services</div>
                <div className="flex flex-wrap gap-1.5">
                  {services.map(sk => {
                    const s = SERVICES.find(x => x.key === sk);
                    if (!s) return null;
                    return (
                      <span key={sk} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald2 text-[11px] font-semibold border border-emerald-200">
                        <span>{s.emoji}</span> {s.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border bg-gradient-to-br from-emerald-50/60 to-white p-4 md:p-5">
            <Sparkles className="size-5 text-emerald2" />
            <div className="font-display font-bold text-base mt-2">Why Build My Trip?</div>
            <ul className="mt-2 space-y-1.5 text-xs text-charcoal/80">
              <li className="flex gap-1.5"><Check className="size-3.5 text-emerald2 mt-0.5" /> No marketplace overwhelm</li>
              <li className="flex gap-1.5"><Check className="size-3.5 text-emerald2 mt-0.5" /> Only relevant preferences</li>
              <li className="flex gap-1.5"><Check className="size-3.5 text-emerald2 mt-0.5" /> One clean summary</li>
              <li className="flex gap-1.5"><Check className="size-3.5 text-emerald2 mt-0.5" /> Ready when you are</li>
            </ul>
            <Link href="/explore?cat=all" className="mt-3 text-emerald2 text-xs font-semibold hover:underline inline-block">Prefer to browse instead? →</Link>
          </div>
        </aside>
      </div>
      <Footer />
    </main>
  );
}
