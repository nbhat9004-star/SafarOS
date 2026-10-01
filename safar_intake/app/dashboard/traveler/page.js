'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Heart, Calendar, MessageCircle, Wand2, BookOpen, MapPin, Loader2, X,
  Trash2, Wallet, Users, Phone, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import AIAssistantFloating from '@/components/safar/AIAssistantFloating';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { LISTINGS } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { bookingsApi } from '@/lib/listings-api';
import { useWishlist, useSavedPlans } from '@/lib/safar-storage';

const StatusPill = ({ s }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald2 border-emerald-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    cancelled:'bg-secondary text-muted-foreground border-border',
  };
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${map[s]||'bg-secondary'}`}>{s}</span>;
};

function TravelerDashboardInner() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loadingBk, setLoadingBk] = useState(true);
  const { ids: wishlistIds } = useWishlist(user?.id);
  const { plans, remove: removePlan } = useSavedPlans(user?.id);

  const wishlistItems = useMemo(() => {
    const byId = Object.fromEntries(LISTINGS.map((l) => [l.id, l]));
    return wishlistIds.map((id) => byId[id]).filter(Boolean);
  }, [wishlistIds]);

  const loadBookings = async () => {
    setLoadingBk(true);
    const { ok, data } = await bookingsApi.list();
    if (ok && data?.ok) setBookings(data.bookings || []);
    setLoadingBk(false);
  };
  useEffect(() => { loadBookings(); }, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    const { ok, data } = await bookingsApi.patch(id, 'cancelled');
    if (!ok) return toast.error(data?.error || 'Cancel failed');
    toast.success('Booking cancelled');
    loadBookings();
  };

  const onDeletePlan = (id) => {
    if (!confirm('Delete this saved itinerary?')) return;
    removePlan(id);
    toast.success('Itinerary removed');
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Welcome back, {user?.name?.split(' ')[0] || 'Traveler'}</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">Your travel hub</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full font-semibold">
              <Link href="/dashboard/traveler/messages"><MessageCircle className="size-4 mr-2" /> Messages</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full font-semibold">
              <Link href="/dashboard/traveler/reviews"><Sparkles className="size-4 mr-2" /> My Reviews</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full font-semibold">
              <Link href="/notifications"><Bell className="size-4 mr-2" /> Notifications</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full font-semibold">
              <Link href="/dashboard/traveler/bookings"><Calendar className="size-4 mr-2" /> My Bookings</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full font-semibold">
              <Link href="/dashboard/traveler/rewards"><Wallet className="size-4 mr-2" /> My Rewards</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full font-semibold">
              <Link href="/dashboard/traveler/wishlist"><Heart className="size-4 mr-2" /> My Wishlist</Link>
            </Button>
            <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold">
              <Link href="/ai-planner"><Wand2 className="size-4 mr-2" /> Open AI Planner</Link>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            {l:'My bookings', v: bookings.length, i: Calendar},
            {l:'Approved',    v: bookings.filter(b=>b.status==='approved').length, i: Calendar},
            {l:'Saved plans', v: plans.length, i: Wand2},
            {l:'Wishlist',    v: wishlistItems.length, i: Heart},
          ].map((k,i)=>{const Ico=k.i;return(
            <motion.div key={k.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }} className="rounded-3xl border bg-white p-5">
              <Ico className="size-5 text-emerald2" />
              <div className="font-display text-3xl font-bold mt-3">{k.v}</div>
              <div className="text-xs text-muted-foreground">{k.l}</div>
            </motion.div>
          );})}
        </div>

        {/* Booking History */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold">Recent bookings</h2>
            <Link href="/dashboard/traveler/bookings" className="text-sm text-emerald2 hover:underline font-semibold">View all bookings →</Link>
          </div>
          {loadingBk && <div className="py-10 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
          {!loadingBk && bookings.length === 0 && (
            <div className="p-10 border rounded-3xl bg-white text-center">
              <Calendar className="size-7 mx-auto text-emerald2" />
              <div className="font-display text-lg font-bold mt-3">No bookings yet</div>
              <p className="text-sm text-muted-foreground mt-1">Find a stay and send your first booking request.</p>
              <Button asChild className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep"><Link href="/explore">Explore Stays</Link></Button>
            </div>
          )}
          {!loadingBk && bookings.length > 0 && (
            <div className="grid md:grid-cols-2 gap-5">
              {bookings.slice(0, 4).map((b, i) => (
                <motion.div key={b.bookingId} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.04 }}
                  className="rounded-3xl border bg-white overflow-hidden flex flex-col md:flex-row">
                  {b.listingImage && <img src={b.listingImage} alt="" className="md:w-48 h-44 md:h-auto object-cover" />}
                  <div className="p-5 flex-1">
                    <div className="flex items-center justify-between gap-2"><StatusPill s={b.status} /><div className="text-[11px] text-muted-foreground">Booking #{b.bookingId.slice(0,8)}</div></div>
                    <div className="font-display font-bold mt-2">{b.listingTitle}</div>
                    <div className="text-xs text-muted-foreground mt-1">Host: {b.hostName}</div>
                    <div className="mt-3 text-sm">{new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()} · {b.nights} nights · {b.guests} guests</div>
                    <div className="mt-1 text-sm font-semibold">₹{(b.totalPrice||0).toLocaleString('en-IN')}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Link href={`/property/${b.listingId}`}>View listing</Link></Button>
                      {b.hostPhone && (
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                          <a href={`tel:${b.hostPhone}`}><Phone className="size-3.5 mr-1" /> Contact host</a>
                        </Button>
                      )}
                      {(b.status === 'pending' || b.status === 'approved') && (
                        <Button onClick={()=>cancel(b.bookingId)} size="sm" variant="outline" className="rounded-full text-rose-600"><X className="size-4 mr-1" /> Cancel</Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Saved AI Plans */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold">Saved AI plans</h2>
            <Link href="/ai-planner" className="text-sm text-emerald2 hover:underline">Create new</Link>
          </div>
          {plans.length === 0 ? (
            <div className="p-8 border rounded-3xl bg-white text-center">
              <Wand2 className="size-7 mx-auto text-emerald2" />
              <div className="font-display text-lg font-bold mt-3">No saved itineraries</div>
              <p className="text-sm text-muted-foreground mt-1">Generate a plan in AI Planner and tap “Save plan” to keep it here.</p>
              <Button asChild className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep"><Link href="/ai-planner"><Wand2 className="size-4 mr-2" /> Open AI Planner</Link></Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {plans.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.04 }}
                  className="rounded-3xl border bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-emerald2 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Sparkles className="size-3" /> AI itinerary
                    </div>
                    <button onClick={()=>onDeletePlan(p.id)} className="text-muted-foreground hover:text-rose-600" aria-label="Delete"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="font-display font-bold mt-2 text-lg">{p.title}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-3.5" /> {p.days} days</span>
                    <span className="flex items-center gap-1"><Users className="size-3.5" /> {p.travelers} travelers</span>
                    <span className="flex items-center gap-1"><Wallet className="size-3.5" /> ₹{(p.budget||0).toLocaleString('en-IN')}</span>
                  </div>
                  {p.itinerary?.length > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground line-clamp-2">
                      {p.itinerary.map((d) => `Day ${d.day}: ${d.activity}`).join(' · ')}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-[11px] text-muted-foreground">Saved {new Date(p.createdAt).toLocaleDateString()}</div>
                    <Button asChild size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                      <Link href={`/ai-planner?plan=${p.id}`}>Reopen plan</Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Saved Listings (Wishlist) */}
        <section className="mt-12 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold">Saved listings</h2>
            <Link href="/wishlist" className="text-sm text-emerald2 hover:underline">See all</Link>
          </div>
          {wishlistItems.length === 0 ? (
            <div className="p-8 border rounded-3xl bg-white text-center">
              <Heart className="size-7 mx-auto text-rose-500" />
              <div className="font-display text-lg font-bold mt-3">No saved listings</div>
              <p className="text-sm text-muted-foreground mt-1">Tap the heart on any stay, houseboat, homestay or experience.</p>
              <Button asChild className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep"><Link href="/explore">Browse listings</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {wishlistItems.slice(0, 8).map((w) => (
                <Link key={w.id} href={`/property/${w.id}`} className="group rounded-3xl overflow-hidden block relative aspect-square">
                  <img src={w.image} className="absolute inset-0 size-full object-cover group-hover:scale-110 transition duration-700" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="text-xs font-semibold line-clamp-1">{w.title}</div>
                    <div className="text-[10px] text-white/70">₹{w.price.toLocaleString('en-IN')}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
      <AIAssistantFloating />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['traveler','host','admin']}><TravelerDashboardInner /></ProtectedRoute>;
}
