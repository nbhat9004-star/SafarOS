'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2, Bookmark, MapPin, Calendar, BadgeCheck, ShieldCheck, ChevronDown, MessageCircle, Users, Loader2 } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import TripRouteMap, { RouteList } from '@/components/explore-v2/TripRouteMap';
import { MORE_TRIPS, FEATURED_TRIPS } from '@/lib/explore-v2-data';
import { fetchTrip, requestToJoin, fetchTripMembers } from '@/lib/explore-api';
import { PROVIDER_CATEGORIES } from '@/lib/provider-categories';
import { useAuth } from '@/lib/auth-context';
import AuthGate from '@/components/safar/AuthGate';
import { toast } from 'sonner';

// Reuse the EXISTING Safar Curated auth modal (no new auth UI).
const AuthModal = dynamic(() => import('@/components/safar/AuthModal'), { ssr: false });

export default function TripDetail({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const [trip, setTrip] = useState(() => [...MORE_TRIPS, ...FEATURED_TRIPS].find(t => t.id === id) || MORE_TRIPS[0]);
  const [openDay, setOpenDay] = useState(1);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);
  // Existing Safar auth gate/modal state (same pattern as /explore/create).
  const [gateOpen, setGateOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | null
  const [pendingJoin, setPendingJoin] = useState(false);
  const [fulfill, setFulfill] = useState(null); // { current, max, min, services[], status }

  useEffect(() => {
    let alive = true;
    fetchTrip(id).then(t => { if (alive && t) setTrip(t); }).catch(() => {});
    // Phase 2: live traveler progress + required services + fulfillment status.
    fetchTripMembers(id).then(d => {
      if (!alive || !d) return;
      const j = d.journey || {};
      setFulfill({
        current: Number.isFinite(d.acceptedSeats) ? d.acceptedSeats : 0,
        max: Number(d.capacity ?? j.maxMembers ?? 0),
        min: Number(j.minimumTravelers ?? 1),
        services: Array.isArray(j.requiredServices) ? j.requiredServices : [],
        serviceFulfillment: Array.isArray(j.serviceFulfillment) ? j.serviceFulfillment : [],
        servicesTotal: Number(j.servicesTotal || 0),
        status: j.fulfillmentStatus || 'accepting_travelers',
        hostMode: j.hostMode || 'self',
      });
    }).catch(() => {});
    // Load persisted saved-state for this trip
    try {
      const raw = localStorage.getItem('safar_saved_trips');
      const list = raw ? JSON.parse(raw) : [];
      setSaved(list.includes(id));
    } catch { /* ignore */ }
    return () => { alive = false; };
  }, [id]);

  const handleJoin = async () => {
    if (!trip?.raw) { toast('Demo trip \u2014 sign in to enable Join'); return; }
    // Not signed in → open the EXISTING Safar auth experience (no red toast).
    if (!authLoading && !user) { setPendingJoin(true); setGateOpen(true); return; }
    setJoining(true);
    try {
      await requestToJoin(trip.id, { seats: 1, message: 'I\u2019d love to join!' });
      setJoined(true);
      toast.success('Request sent! The host will review shortly.');
    } catch (e) {
      toast.error(e.message || 'Could not send request. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Resume the intended join automatically once the user is signed in.
  useEffect(() => {
    if (user && pendingJoin && !gateOpen && !authMode) {
      setPendingJoin(false);
      handleJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingJoin, gateOpen, authMode]);

  // Native share sheet with clipboard fallback.
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    // Light haptic where supported
    try { navigator?.vibrate?.(15); } catch { /* ignore */ }
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = trip?.title || 'Kashmir Trip on Safar Curated';
    const location = trip?.location || 'Kashmir';
    const dates = trip?.dates || '';
    const text = `Join me on this amazing ${title} using Safar Curated.${dates ? ` (${dates})` : ''}${location ? ` — ${location}` : ''}\n${url}`;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } else {
        toast('Sharing is not supported on this device');
      }
    } catch (e) {
      // User cancelled → do nothing. Any other error → toast.
      if (e && e.name !== 'AbortError') {
        toast.error('Could not open share sheet');
      }
    } finally {
      setSharing(false);
    }
  };

  // Toggle bookmark (localStorage-backed).
  const handleSave = () => {
    try { navigator?.vibrate?.(15); } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem('safar_saved_trips');
      const list = raw ? JSON.parse(raw) : [];
      let next;
      if (list.includes(id)) {
        next = list.filter((t) => t !== id);
        setSaved(false);
        toast('Removed from saved trips');
      } else {
        next = [...list, id];
        setSaved(true);
        toast.success('Trip saved successfully');
      }
      localStorage.setItem('safar_saved_trips', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('safar:saved-trips-changed', { detail: next }));
    } catch {
      toast.error('Could not save trip');
    }
  };

  const days = [
    { day: 1, title: 'Arrival in Sonamarg, trek to Nichnai' },
    { day: 2, title: 'Nichnai to Vishansar Lake' },
    { day: 3, title: 'Vishansar to Krishansar Lake' },
  ];
  const highlights = [
    { emoji: '\u{1F550}', text: '7 Days / 6 Nights' },
    { emoji: '\u{1F3D4}\uFE0F', text: '3 Alpine Lakes' },
    { emoji: '\u26F0\uFE0F', text: 'Difficulty: Moderate' },
    { emoji: '\u{1F3E1}', text: 'Accommodation & Meals' },
  ];

  return (
    <Shell>
      {/* Hero */}
      <div className="relative aspect-[4/5] sm:aspect-[16/10] w-full max-w-4xl mx-auto overflow-hidden">
        <Image src={trip.cover} alt={trip.title || 'Trip'} fill className="object-cover" priority unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-transparent" />
        <Link href="/explore" className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 size-10 grid place-items-center rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white active:scale-95"><ArrowLeft className="size-5" /></Link>
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share trip"
            className="size-10 grid place-items-center rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white active:scale-90 hover:bg-white/25 transition-all duration-200"
          >
            <Share2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            aria-label={saved ? 'Remove from saved trips' : 'Save trip'}
            aria-pressed={saved}
            className="size-10 grid place-items-center rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white active:scale-90 hover:bg-white/25 transition-all duration-200"
          >
            <Bookmark
              className={`size-4 transition-all duration-200 ${saved ? 'text-amber-300' : 'text-white'}`}
              fill={saved ? 'currentColor' : 'none'}
              strokeWidth={saved ? 2.4 : 2}
            />
          </button>
        </div>
        <div className="absolute top-4 left-16 md:left-20">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-bold"><ShieldCheck className="size-3" /> Verified by Safar</span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 md:px-8 pb-8 -mt-6 relative">
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_-10px_30px_-10px_rgba(15,23,42,0.15)]">
          <h1 className="font-display font-bold text-[22px] md:text-[28px] tracking-tight text-slate-900 leading-tight">{trip.title || 'Kashmir Great Lakes'}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {trip.location || 'Sonamarg, Kashmir'}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {trip.dates || 'May 25 \u2013 May 30'}</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-full bg-violet-100 grid place-items-center text-violet-700 font-bold text-[13px]">{trip.host?.[0] || 'A'}</div>
              <div>
                <div className="text-[13px] text-slate-500">Hosted by <span className="font-semibold text-slate-900">{trip.host || 'Amaan'}</span></div>
                <div className="text-[11px] text-violet-700 font-semibold inline-flex items-center gap-1"><BadgeCheck className="size-3" /> Verified Host</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-800">
              <Users className="size-4 text-slate-500" /> {fulfill ? fulfill.current : (trip.joined || 0)} / {fulfill ? fulfill.max : (trip.max || 0)}
            </div>
          </div>
        </div>

        {/* Phase 2 — Traveler progress + Services Needed (real data when available) */}
        {fulfill && (fulfill.hostMode === 'safar' || fulfill.services.length > 0 || fulfill.min > 1) && (
          <section className="mt-5">
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-[14px] font-bold text-slate-900"><Users className="size-4 text-emerald-600" /> {fulfill.current} / {fulfill.max} travelers</div>
                <span className="text-[12px] font-semibold text-slate-500">Minimum: {fulfill.min}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all" style={{ width: `${Math.min(100, fulfill.max ? Math.round((fulfill.current / fulfill.max) * 100) : 0)}%` }} />
              </div>
              {/* Status line */}
              <div className="mt-3 text-[13px] font-semibold">
                {fulfill.max > 0 && fulfill.current >= fulfill.max ? (
                  <span className="text-slate-600">Trip is full</span>
                ) : fulfill.current >= fulfill.min ? (
                  <span className="text-emerald-700 inline-flex items-center gap-1"><BadgeCheck className="size-4" /> Minimum reached — ready for Safar service fulfillment</span>
                ) : (
                  <span className="text-amber-700">Waiting for {Math.max(0, fulfill.min - fulfill.current)} more traveler{fulfill.min - fulfill.current === 1 ? '' : 's'} to unlock trip services.</span>
                )}
              </div>

              {fulfill.serviceFulfillment.length > 0 ? (
                <div className="mt-4">
                  <div className="text-[12.5px] font-bold text-slate-900">Safar Services</div>
                  <div className="mt-2 space-y-2">
                    {fulfill.serviceFulfillment.map((e) => {
                      const c = PROVIDER_CATEGORIES.find((x) => x.slug === e.categorySlug);
                      const map = {
                        confirmed:   { icon: '✓', tone: 'text-emerald-700', label: e.providerName ? `Confirmed · ${e.providerName}` : 'Confirmed' },
                        pending:     { icon: '↻', tone: 'text-amber-700',   label: 'Finding a provider' },
                        searching:   { icon: '↻', tone: 'text-amber-700',   label: 'Finding a provider' },
                        unfulfilled: { icon: '⚠', tone: 'text-rose-600',    label: 'No provider available' },
                      };
                      const s = map[e.status] || { icon: '○', tone: 'text-slate-500', label: 'Waiting' };
                      return (
                        <div key={e.categorySlug} className="rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-800"><span>{c?.icon || '•'}</span> {c?.label || e.categorySlug}</span>
                            <span className={`text-[12px] font-bold ${s.tone}`}>{s.icon} {s.label}</span>
                          </div>
                          {e.status === 'confirmed' && e.quote ? (
                            <div className="mt-1.5 flex items-center justify-between text-[12px]">
                              <span className="text-slate-500 truncate">{e.quote.serviceName}</span>
                              <span className="font-bold text-slate-900 shrink-0 ml-2">₹{Number(e.quote.totalPrice || 0).toLocaleString('en-IN')}</span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  {fulfill.servicesTotal > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                      <span className="text-[12.5px] font-semibold text-slate-600">Estimated Services Total</span>
                      <span className="text-[15px] font-bold text-slate-900">₹{Number(fulfill.servicesTotal).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {fulfill.status === 'confirmed' && (
                    <p className="mt-3 text-[12.5px] font-semibold text-emerald-700 inline-flex items-center gap-1"><BadgeCheck className="size-4" /> Your Safar trip is confirmed — all services arranged.</p>
                  )}
                </div>
              ) : fulfill.services.length > 0 ? (
                <div className="mt-4">
                  <div className="text-[12.5px] font-bold text-slate-900">Services Needed</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fulfill.services.map((slug) => {
                      const c = PROVIDER_CATEGORIES.find((x) => x.slug === slug);
                      return (
                        <span key={slug} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[12.5px] font-semibold text-emerald-800">
                          <span>{c?.icon || '•'}</span> {c?.label || slug}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400 leading-snug">Safar will match verified providers for these services once the trip is ready.</p>
                </div>
              ) : null}
            </div>
          </section>
        )}

        <section className="mt-5">
          <h3 className="font-display font-bold text-[17px] tracking-tight">About Trip</h3>
          <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed">A breathtaking trek through the pristine alpine lakes of Kashmir. Experience stunning landscapes, snow-capped peaks and crystal-clear lakes.</p>
        </section>

        {Array.isArray(trip.route) && trip.route.length >= 2 && (
          <section className="mt-6">
            <h3 className="font-display font-bold text-[17px] tracking-tight">Your Journey</h3>
            <div className="mt-3">
              <TripRouteMap stops={trip.route} height={300} />
              <RouteList stops={trip.route} />
            </div>
          </section>
        )}

        <section className="mt-6">
          <h3 className="font-display font-bold text-[17px] tracking-tight">Highlights</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-3 py-3">
                <div className="text-[20px]">{h.emoji}</div>
                <span className="text-[13.5px] text-slate-700">{h.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="font-display font-bold text-[17px] tracking-tight">Itinerary</h3>
          <div className="mt-3 space-y-2">
            {days.map(d => (
              <button key={d.day} onClick={() => setOpenDay(openDay === d.day ? -1 : d.day)} className={`w-full text-left rounded-2xl border p-4 transition ${openDay === d.day ? 'border-violet-200 bg-violet-50/50' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">Day {d.day}</div>
                    <div className="text-[13px] text-slate-500 mt-0.5">{d.title}</div>
                  </div>
                  <ChevronDown className={`size-4 text-slate-400 transition ${openDay === d.day ? 'rotate-180' : ''}`} />
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-24 md:bottom-8 inset-x-0 z-30 px-4 md:px-8">
        <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl px-3 py-3 shadow-2xl flex items-center gap-2">
          <Link href="/explore/chat/demo" className="size-11 grid place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"><MessageCircle className="size-4" /></Link>
          {joined ? (
            <div className="flex-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold py-3 text-[14px] text-center inline-flex items-center justify-center gap-2"><BadgeCheck className="size-4" /> Request Sent</div>
          ) : (
            <button onClick={handleJoin} disabled={joining} className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold py-3 text-[14px] transition inline-flex items-center justify-center gap-2 disabled:opacity-70">
              {joining && <Loader2 className="size-4 animate-spin" />} Request to Join
            </button>
          )}
        </div>
      </div>

      {/* Existing Safar Curated auth experience (reused, not rebuilt) */}
      <AuthGate
        open={gateOpen}
        onClose={() => { setGateOpen(false); setPendingJoin(false); }}
        onSignIn={() => { setGateOpen(false); setAuthMode('login'); }}
        onCreate={() => { setGateOpen(false); setAuthMode('register'); }}
        title="Join this journey"
        subtitle="Sign in or create your free Safar account to request a spot."
      />
      <AuthModal open={!!authMode} defaultMode={authMode || 'login'} onClose={() => setAuthMode(null)} />
    </Shell>
  );
}
