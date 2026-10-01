'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles, MapPin, Calendar, Users, Wallet, Check, Clock, Loader2, AlertTriangle,
  Hotel, Car, Bike, Compass, UtensilsCrossed, Camera, Mountain, ShoppingBag, Plane, Drama,
  RefreshCw, ChevronRight, Search, RadioTower, MessageCircle, PartyPopper, Info, ArrowLeft
} from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';

const SERVICE_META = {
  accommodation: { label: 'Accommodation', emoji: '🏨', Icon: Hotel,           hue: 'from-emerald-400 to-teal-400' },
  cab:           { label: 'Cab',            emoji: '🚗', Icon: Car,             hue: 'from-sky-400 to-blue-400' },
  bike:          { label: 'Bike Rental',    emoji: '🏍', Icon: Bike,            hue: 'from-orange-400 to-amber-400' },
  guide:         { label: 'Tour Guide',     emoji: '🧭', Icon: Compass,         hue: 'from-lime-400 to-green-400' },
  food:          { label: 'Food',           emoji: '🍽', Icon: UtensilsCrossed, hue: 'from-rose-400 to-pink-400' },
  photography:   { label: 'Photography',    emoji: '📸', Icon: Camera,          hue: 'from-violet-400 to-purple-400' },
  adventure:     { label: 'Adventure',      emoji: '🎿', Icon: Mountain,        hue: 'from-red-400 to-orange-400' },
  shopping:      { label: 'Shopping',       emoji: '🛍', Icon: ShoppingBag,     hue: 'from-pink-400 to-fuchsia-400' },
  airport:       { label: 'Airport Pickup', emoji: '✈️', Icon: Plane,           hue: 'from-cyan-400 to-blue-400' },
  experience:    { label: 'Experiences',    emoji: '🎭', Icon: Drama,           hue: 'from-amber-400 to-orange-400' },
};

const STATUS_LABEL = {
  searching:   { label: 'Searching hosts…',        Icon: Search,     tone: 'text-sky-600 bg-sky-50 border-sky-200' },
  contacting:  { label: 'Contacting provider…',    Icon: RadioTower, tone: 'text-violet-600 bg-violet-50 border-violet-200' },
  waiting:     { label: 'Waiting for response',    Icon: Clock,      tone: 'text-amber-600 bg-amber-50 border-amber-200' },
  confirmed:   { label: 'Confirmed',               Icon: Check,      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  unavailable: { label: 'Unavailable',             Icon: AlertTriangle, tone: 'text-rose-600 bg-rose-50 border-rose-200' },
};

function fmtSecs(secs) {
  if (!secs || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function ServiceIcon({ sk, className = 'size-5' }) {
  const meta = SERVICE_META[sk];
  if (!meta) return <Sparkles className={className} />;
  const I = meta.Icon;
  return <I className={className} />;
}

export default function TripProgressPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pollRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/trip-orchestrations/by-trip/${id}`, { credentials: 'include' });
      if (res.status === 401) { router.push('/login?next=/trip/' + id); return; }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to load');
      // The by-trip endpoint returns { orchestration, trip } without estimated seconds; do a second call to /:id for ETA
      const oId = json.orchestration.id;
      const detail = await fetch(`/api/trip-orchestrations/${oId}`, { credentials: 'include' }).then(r => r.json()).catch(() => null);
      setData(detail && detail.ok ? detail : { orchestration: json.orchestration, trip: json.trip, estimatedSecondsRemaining: 0 });
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  useEffect(() => {
    if (!data) return;
    if (pollRef.current) clearInterval(pollRef.current);
    // Poll every 3s while orchestrating; stop when confirmed/partial/cancelled
    if (data.orchestration?.status === 'orchestrating') {
      pollRef.current = setInterval(load, 3000);
    }
  }, [data?.orchestration?.status]);

  const retry = async () => {
    if (!data?.orchestration) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/trip-orchestrations/${data.orchestration.id}/retry`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Retry failed');
      toast.success('Retrying unavailable services…');
      load();
    } catch (e) { toast.error(e.message || 'Retry failed'); }
    finally { setBusy(false); }
  };

  const replaceSvc = async (sk) => {
    if (!data?.orchestration) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/trip-orchestrations/${data.orchestration.id}/replace/${sk}`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Replace failed');
      toast.success(`Searching a new provider for ${SERVICE_META[sk]?.label || sk}…`);
      load();
    } catch (e) { toast.error(e.message || 'Replace failed'); }
    finally { setBusy(false); }
  };

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-white overflow-x-hidden">
        <Navbar />
        <div className="pt-20 md:pt-24 container px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 w-40 rounded-full bg-secondary animate-pulse" />
            <div className="mt-4 h-24 rounded-3xl bg-secondary animate-pulse" />
            <div className="mt-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}</div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }
  if (error && !data) {
    return (
      <main className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <div className="pt-20 md:pt-24 container max-w-2xl px-4 sm:px-6">
          <div className="p-8 rounded-3xl border text-center">
            <AlertTriangle className="size-8 text-amber-500 mx-auto" />
            <div className="mt-3 font-display text-xl font-bold">Trip not found</div>
            <div className="text-sm text-muted-foreground mt-2">{error}</div>
            <Link href="/build-trip" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald2 text-white text-sm font-semibold">← Back to Build My Trip</Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const { orchestration, trip, estimatedSecondsRemaining } = data;
  const status = orchestration.status; // orchestrating | confirmed | partial | cancelled
  const services = orchestration.services || [];
  const confirmedCount = services.filter(s => s.status === 'confirmed').length;
  const pendingCount = services.filter(s => !['confirmed', 'unavailable'].includes(s.status)).length;
  const unavailableCount = services.filter(s => s.status === 'unavailable').length;
  const progress = services.length ? Math.round(((confirmedCount + unavailableCount) / services.length) * 100) : 0;
  const totalPrice = services.filter(s => s.status === 'confirmed').reduce((n, s) => n + (Number(s.confirmedPrice) || 0), 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-white overflow-x-hidden">
      <Navbar />
      <div className="pt-20 md:pt-24 container pb-10 md:pb-16 px-4 sm:px-6">
        <Link href="/build-trip" className="text-[13px] md:text-sm text-muted-foreground hover:text-charcoal inline-flex items-center gap-1"><ArrowLeft className="size-3.5" /> Build My Trip</Link>

        {/* Header */}
        <div className="mt-3 md:mt-4 rounded-3xl border bg-white/80 backdrop-blur shadow-xl p-4 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full bg-emerald-50 text-emerald2 text-[10px] md:text-[11px] uppercase tracking-wider font-semibold border border-emerald-200">
                <Sparkles className="size-3 md:size-3.5" /> Live orchestration
              </div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl leading-tight font-bold mt-2 md:mt-3 break-words">{trip.destination}</h1>
              <div className="mt-1.5 md:mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] md:text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 md:size-4" /> {trip.startDate} → {trip.endDate}{trip.nights ? ` · ${trip.nights} night${trip.nights !== 1 ? 's' : ''}` : ''}</span>
                <span className="inline-flex items-center gap-1"><Users className="size-3.5 md:size-4" /> {trip.travelers?.total || 1} traveler{(trip.travelers?.total || 1) !== 1 ? 's' : ''}</span>
                <span className="inline-flex items-center gap-1"><Wallet className="size-3.5 md:size-4" /> {trip.budget?.label}</span>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-charcoal/80">{progress}% complete</span>
              {status === 'orchestrating' && (
                <span className="text-muted-foreground inline-flex items-center gap-1"><Clock className="size-3" /> ~{fmtSecs(estimatedSecondsRemaining)} left</span>
              )}
              {status === 'confirmed' && <span className="text-emerald-700 font-semibold inline-flex items-center gap-1"><Check className="size-3" /> All confirmed</span>}
              {status === 'partial' && <span className="text-amber-700 font-semibold">Partial confirmation</span>}
            </div>
            <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${status === 'partial' ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500'}`}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>

            {/* Live-phase strip */}
            {status === 'orchestrating' && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <PhasePill Icon={Search} label="Searching" active={services.some(s => s.status === 'searching')} />
                <PhasePill Icon={RadioTower} label="Contacting" active={services.some(s => s.status === 'contacting')} />
                <PhasePill Icon={Clock} label="Waiting" active={services.some(s => s.status === 'waiting')} />
                <PhasePill Icon={Check} label={`Confirmed ${confirmedCount}/${services.length}`} active={confirmedCount > 0} />
              </div>
            )}
          </div>

          {/* Success / partial banner */}
          {status === 'confirmed' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <PartyPopper className="size-5 text-emerald-600 mt-0.5" />
              <div className="min-w-0">
                <div className="font-semibold text-sm text-emerald-800">Your trip is fully confirmed!</div>
                <div className="text-xs text-emerald-700 mt-0.5">Booking reference <span className="font-mono font-bold">{orchestration.bookingReference}</span> · Estimated total ₹{Number(totalPrice).toLocaleString('en-IN')}</div>
              </div>
            </motion.div>
          )}
          {status === 'partial' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-600 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-amber-800">Partial confirmation ({confirmedCount}/{services.length} services)</div>
                <div className="text-xs text-amber-700 mt-0.5">Couldn't secure {unavailableCount} service{unavailableCount !== 1 ? 's' : ''}. You can retry or continue with what's confirmed.</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold" onClick={retry} disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-3.5 mr-1" />} Retry unavailable
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Services */}
        <div className="mt-4 md:mt-6 grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg md:text-xl font-bold">Services</h2>
              <span className="text-[11px] md:text-xs text-muted-foreground text-right">{confirmedCount} confirmed · {pendingCount} pending · {unavailableCount} unavailable</span>
            </div>
            <AnimatePresence mode="popLayout">
              {services.map((s) => (
                <motion.div key={s.key} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <ServiceCard s={s} onReplace={() => replaceSvc(s.key)} busy={busy} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Sidebar summary */}
          <aside className="space-y-3 md:space-y-4">
            <div className="rounded-3xl border bg-white/80 backdrop-blur p-4 md:p-6 shadow-sm lg:sticky lg:top-24">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Trip summary</div>
              <div className="font-display font-bold text-lg">{trip.destination}</div>
              <div className="text-xs text-muted-foreground mt-1">{trip.startDate} → {trip.endDate}</div>

              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow label="Travelers" value={`${trip.travelers?.total || 1} total`} />
                <SummaryRow label="Budget" value={trip.budget?.label || '—'} />
                <SummaryRow label="Services" value={`${services.length}`} />
                {(status === 'confirmed' || status === 'partial') && (
                  <>
                    <SummaryRow label="Confirmed" value={`${confirmedCount}/${services.length}`} />
                    <SummaryRow label="Estimated total" value={`₹${Number(totalPrice).toLocaleString('en-IN')}`} highlight />
                    {orchestration.bookingReference && <SummaryRow label="Ref" value={<span className="font-mono">{orchestration.bookingReference}</span>} />}
                  </>
                )}
              </div>

              {status === 'confirmed' && (
                <Link href="/dashboard/traveler" className="mt-5 block text-center rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold py-2.5 text-sm">
                  View my bookings
                </Link>
              )}
              {status === 'partial' && (
                <div className="mt-5 text-[11px] text-muted-foreground">Payment for confirmed services will be collected via the existing Safar checkout when you're ready.</div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function StatusBadge({ status }) {
  const map = {
    orchestrating: { label: 'Orchestrating', tone: 'bg-sky-50 text-sky-700 border-sky-200', anim: true },
    confirmed:     { label: 'Confirmed',     tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    partial:       { label: 'Partial',       tone: 'bg-amber-50 text-amber-700 border-amber-200' },
    cancelled:     { label: 'Cancelled',     tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  };
  const m = map[status] || { label: status, tone: 'bg-secondary text-charcoal border-border' };
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${m.tone}`}>
      {m.anim ? <span className="relative flex size-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" /><span className="relative inline-flex rounded-full size-2 bg-current" /></span> : <Check className="size-3" />}
      {m.label}
    </div>
  );
}

function PhasePill({ Icon, label, active }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-secondary/50 border-border text-muted-foreground'}`}>
      <Icon className={`size-3.5 ${active ? 'animate-pulse' : ''}`} /> <span className="font-semibold">{label}</span>
    </div>
  );
}

function ServiceCard({ s, onReplace, busy }) {
  const meta = SERVICE_META[s.key] || { label: s.label || s.key, emoji: '✨', hue: 'from-slate-400 to-zinc-400', Icon: Sparkles };
  const st = STATUS_LABEL[s.status] || STATUS_LABEL.searching;
  const StIcon = st.Icon;
  const confirmed = s.status === 'confirmed';
  const unavailable = s.status === 'unavailable';

  return (
    <div className={`rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm ${confirmed ? 'ring-1 ring-emerald-200' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`size-11 rounded-2xl bg-gradient-to-br ${meta.hue} grid place-items-center text-white shrink-0`}>
          <ServiceIcon sk={s.key} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display font-bold text-base truncate">{meta.label} {meta.emoji}</div>
              {confirmed ? (
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {s.confirmedListingTitle} · ₹{Number(s.confirmedPrice || 0).toLocaleString('en-IN')}
                </div>
              ) : s.currentRequest ? (
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  Requested <span className="font-semibold text-charcoal/80">{s.currentRequest.listingTitle}</span> · ₹{Number(s.currentRequest.price || 0).toLocaleString('en-IN')}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-0.5">Finding the best host…</div>
              )}
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${st.tone}`}>
              <StIcon className={`size-3 ${s.status === 'waiting' ? 'animate-pulse' : ''}`} /> {st.label}
            </span>
          </div>

          {/* Waiting countdown */}
          {s.status === 'waiting' && s.currentRequest?.deadlineAt && (
            <CountdownBar deadlineAt={s.currentRequest.deadlineAt} />
          )}

          {/* Confirmed image + host */}
          {confirmed && (
            <div className="mt-3 flex items-center gap-3">
              {s.confirmedListingImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.confirmedListingImage} alt={s.confirmedListingTitle} className="size-14 rounded-xl object-cover" />
              )}
              <div className="text-[11px] text-emerald-700 inline-flex items-center gap-1">
                <Check className="size-3" /> Locked in {s.confirmedAt ? '· ' + new Date(s.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
          )}

          {/* Attempted providers count */}
          {(s.status === 'contacting' || s.status === 'waiting') && (s.attemptedIds?.length > 0) && (
            <div className="mt-2 text-[10px] text-muted-foreground">Provider {s.attemptedIds.length} of {s.candidateIds?.length || s.attemptedIds.length}</div>
          )}

          {unavailable && (
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onReplace} disabled={busy} className="rounded-full text-xs">
                {busy ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3 mr-1" />} Retry this service
              </Button>
              <span className="text-[10px] text-muted-foreground">No matching providers were available in your window.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CountdownBar({ deadlineAt }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [deadlineAt]);
  const total = 300;
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  return (
    <div className="mt-2">
      <div className="h-1 rounded-full bg-amber-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-amber-700 mt-0.5">Provider has {fmtSecs(remaining)} to respond</div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${highlight ? 'font-bold text-emerald2' : 'font-semibold text-charcoal'} truncate`}>{value}</span>
    </div>
  );
}
