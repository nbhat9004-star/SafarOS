'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  MapPin, Calendar, Users, Wallet, Sparkles, ArrowLeft, Loader2,
  UserPlus, Check, X, Bookmark, Share2, Star, ShieldCheck, Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// ------------------------------------------------------------------
// EXPLORE V2 — Trip Detail + Join flow (light theme, Safar palette)
// Reuses existing endpoints:
//   GET  /api/circle/journeys/slug/:slug
//   GET  /api/circle/journeys/:id/members
//   POST /api/circle/journeys/:id/join
// ------------------------------------------------------------------

export default function TripDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState({ members: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/circle/journeys/slug/${slug}`);
      const j = await r.json();
      if (j?.journey) {
        setTrip(j.journey);
        try {
          const rm = await fetch(`/api/circle/journeys/${j.journey.id}/members`);
          const jm = await rm.json();
          if (jm?.ok) setMembers({ members: jm.members || [], count: jm.count || 0 });
        } catch { /* silent */ }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const requestJoin = async () => {
    if (!user) { router.push('/?auth=1'); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/circle/journeys/${trip.id}/join`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Failed to request');
      toast.success('Request sent! The organiser will review shortly.');
      await load();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: trip?.name, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch {}
  };

  if (loading) return (
    <div className="container py-16 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div>
  );
  if (!trip) return (
    <div className="container py-16 text-center">
      <div className="font-display text-2xl font-bold text-charcoal">Trip not found</div>
      <Link href="/explore/home" className="mt-4 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-emerald2 text-white font-semibold"><ArrowLeft className="size-4" /> Back to Explore</Link>
    </div>
  );

  const seats = Math.max(0, (trip.maxMembers || 6) - (members.count || 0));
  const perPerson = trip.estimate?.perPerson || (trip.budget && trip.maxMembers ? Math.round(trip.budget / trip.maxMembers) : null);
  const start = trip.startDate ? new Date(trip.startDate) : null;
  const end = trip.endDate ? new Date(trip.endDate) : null;
  const dateLabel = start ? `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${end ? ' – ' + end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}` : 'Flexible dates';
  const isOwner = user?.id === trip.curatorId;
  const meMember = (members.members || []).find((m) => m.userId === user?.id);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[42vh] md:h-[58vh] w-full overflow-hidden">
        {trip.cover && <Image src={trip.cover} alt={trip.name} fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-emerald-950/20 to-emerald-950/70" />
        <div className="absolute top-4 left-4">
          <Link href="/explore/home" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/95 backdrop-blur border text-charcoal text-sm font-semibold hover:bg-white transition"><ArrowLeft className="size-4" /> Explore</Link>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button onClick={share} className="size-9 rounded-full bg-white/95 backdrop-blur grid place-items-center text-charcoal hover:bg-white transition shadow"><Share2 className="size-4" /></button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 container pb-8 md:pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 text-emerald2 text-[10px] uppercase tracking-wider font-bold">
            <MapPin className="size-3" /> {trip.destination?.name}{trip.destination?.district ? ` · ${trip.destination.district}` : ''}
          </div>
          <h1 className="mt-3 font-display text-white text-3xl md:text-5xl font-bold drop-shadow-[0_3px_20px_rgba(0,0,0,0.4)] tracking-tight max-w-3xl">{trip.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/90 text-sm drop-shadow">
            <span className="inline-flex items-center gap-1.5"><Calendar className="size-4 text-amber-300" /> {dateLabel}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-amber-300" /> {members.count}/{trip.maxMembers} joined</span>
            {perPerson != null && <span className="inline-flex items-center gap-1.5"><Wallet className="size-4 text-amber-300" /> ₹{perPerson.toLocaleString('en-IN')} / person</span>}
            {(trip.services || []).length > 0 && <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold"><Sparkles className="size-4" /> Safar Curated</span>}
          </div>
        </div>
      </div>

      <div className="container grid grid-cols-1 lg:grid-cols-3 gap-8 py-10">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Organiser */}
          <div className="bg-white rounded-2xl border p-5 flex items-center gap-4">
            <div className="size-12 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-950 grid place-items-center text-white font-bold text-lg">{(trip.curatorName || 'S').charAt(0).toUpperCase()}</div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Trip Organiser</div>
              <div className="font-semibold text-charcoal truncate">{trip.curatorName}</div>
            </div>
            <div className="ml-auto inline-flex items-center gap-1 text-xs text-emerald2 font-semibold"><ShieldCheck className="size-4" /> Verified</div>
          </div>

          {/* About */}
          {trip.description && (
            <section>
              <h2 className="font-display text-xl font-bold text-charcoal">About this trip</h2>
              <p className="mt-2 text-charcoal/80 leading-relaxed whitespace-pre-line">{trip.description}</p>
            </section>
          )}

          {/* Meeting point & rules */}
          {(trip.meta?.meetingPoint || trip.meta?.rules) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trip.meta?.meetingPoint && (
                <div className="p-4 rounded-2xl border bg-white">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">Meeting Point</div>
                  <div className="mt-1 text-charcoal font-semibold">{trip.meta.meetingPoint}</div>
                </div>
              )}
              {trip.meta?.rules && (
                <div className="p-4 rounded-2xl border bg-white">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">Rules / Expectations</div>
                  <div className="mt-1 text-charcoal/80 text-sm whitespace-pre-line">{trip.meta.rules}</div>
                </div>
              )}
            </section>
          )}

          {/* Services */}
          {(trip.services || []).length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-charcoal flex items-center gap-2"><Sparkles className="size-5 text-amber-500" /> Services included</h2>
              <p className="text-sm text-muted-foreground mt-1">Book these together through Safar Curated after joining.</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trip.services.map((s) => (
                  <div key={s.listingId} className="flex items-center gap-3 p-3 rounded-2xl border bg-white">
                    {s.image && (
                      <div className="relative size-14 rounded-xl overflow-hidden shrink-0 bg-secondary">
                        <Image src={s.image} alt={s.title} fill sizes="56px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">{s.category}{s.subcategory ? ` · ${s.subcategory}` : ''}</div>
                      <div className="font-semibold text-charcoal text-sm truncate">{s.title}</div>
                    </div>
                    <div className="font-bold text-charcoal text-sm shrink-0">₹{(s.price || 0).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Members */}
          {members.count > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-charcoal">Travellers joined ({members.count})</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(members.members || []).slice(0, 20).map((m, i) => (
                  <div key={m.userId || i} className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border">
                    <div className="size-6 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-950 grid place-items-center text-white text-[10px] font-bold">{(m.name || 'S').charAt(0).toUpperCase()}</div>
                    <span className="text-xs font-semibold text-charcoal">{m.name || 'Traveler'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — sticky booking card */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white rounded-3xl border shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              {perPerson != null ? (
                <>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">Estimated per person</div>
                  <div className="font-display font-bold text-charcoal text-3xl mt-0.5">₹{perPerson.toLocaleString('en-IN')}</div>
                  {trip.budget && <div className="text-xs text-muted-foreground">Total trip ₹{Number(trip.budget).toLocaleString('en-IN')}</div>}
                </>
              ) : (
                <div className="font-display font-bold text-charcoal text-2xl">Free to join</div>
              )}
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="inline-flex items-center gap-2 text-charcoal/80"><Users className="size-4 text-emerald2" /> Participants</div>
                <div className="font-semibold text-charcoal">{members.count} / {trip.maxMembers}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="inline-flex items-center gap-2 text-charcoal/80"><Clock className="size-4 text-emerald2" /> Seats remaining</div>
                <div className="font-semibold text-charcoal">{seats}</div>
              </div>

              {isOwner ? (
                <div className="mt-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 text-center font-semibold">You are the organiser of this trip.</div>
              ) : meMember ? (
                <div className="mt-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 text-center font-semibold">You&apos;ve already requested to join (status: {meMember.status || 'pending'}).</div>
              ) : (
                <button disabled={busy || seats === 0} onClick={requestJoin} className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white font-semibold shadow-lg shadow-emerald2/25 transition">
                  {busy ? <><Loader2 className="size-4 animate-spin" /> Requesting…</> : seats === 0 ? 'Trip full' : <><UserPlus className="size-4" /> Request to Join</>}
                </button>
              )}
              <button onClick={share} className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white border text-charcoal font-semibold hover:bg-secondary/40 transition">
                <Share2 className="size-4" /> Share Trip
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
