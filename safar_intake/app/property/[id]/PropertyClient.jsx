'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Heart, Share2, ShieldCheck, Wifi, Coffee, Wind, ParkingCircle, MessageCircle, ChevronRight, BadgeCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import AIAssistantFloating from '@/components/safar/AIAssistantFloating';
import ServiceBadges from '@/components/safar/ServiceBadges';
import PropertyGallery from '@/components/safar/PropertyGallery';
import { Button } from '@/components/ui/button';
import { useListing, useAvailability } from '@/lib/listings-api';
import { SERVICE_GROUPS, SERVICE_INDEX } from '@/lib/services';
import WhatsAppButton from '@/components/safar/WhatsAppButton';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const AMENITY_ICONS = { 'Wi-Fi': Wifi, 'Heater': Wind, 'Kahwa': Coffee, 'Parking': ParkingCircle };

// yyyy-mm-dd N days from today
function ymdOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function rangeOverlaps(ciStr, coStr, ranges) {
  if (!ciStr || !coStr) return null;
  const ci = new Date(ciStr), co = new Date(coStr);
  if (isNaN(ci) || isNaN(co) || co <= ci) return null;
  for (const r of ranges) {
    const rci = new Date(r.checkInDate), rco = new Date(r.checkOutDate);
    if (rci < co && rco > ci) return r;
  }
  return null;
}

function App() {
  const { id } = useParams();
  const { user } = useAuth();
  const { listing, loading, error } = useListing(id);
  const { bookedRanges } = useAvailability(id);
  const [liked, setLiked] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [guests, setGuests] = useState(2);
  const [checkIn, setCheckIn] = useState(ymdOffset(7));
  const [checkOut, setCheckOut] = useState(ymdOffset(11));
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const todayStr = ymdOffset(0);
  const conflict = useMemo(() => rangeOverlaps(checkIn, checkOut, Array.isArray(bookedRanges) ? bookedRanges : []), [checkIn, checkOut, bookedRanges]);

  // Load reviews and wishlist status
  useEffect(() => {
    if (!id) return;
    
    // Load reviews
    fetch(`/api/reviews?propertyId=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setReviews(data.reviews || []);
          setReviewCount(data.count || 0);
          setAvgRating(data.averageRating || 0);
        }
      });
    
    // Load wishlist status
    fetch(`/api/wishlist/check?propertyId=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setLiked(data.saved);
          setSaveCount(data.count || 0);
        }
      });
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = listing?.title || 'Check out this property on Safar';
    const text = listing?.description || 'Discover Kashmir experiences';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save properties');
      return;
    }

    try {
      if (liked) {
        const res = await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.ok) {
          setLiked(false);
          setSaveCount(data.count || 0);
          toast.success('Removed from wishlist');
        }
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: id }),
        });
        const data = await res.json();
        if (data.ok) {
          setLiked(true);
          setSaveCount(data.count || 0);
          toast.success('Added to wishlist');
        } else {
          toast.error(data.error || 'Failed to save');
        }
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit a review');
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id, rating, reviewText }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Review submitted successfully!');
        setReviews([data.review, ...reviews]);
        setReviewCount(reviewCount + 1);
        setAvgRating(((avgRating * reviewCount) + rating) / (reviewCount + 1));
        setShowReviewForm(false);
        setReviewText('');
        setRating(5);
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 min-h-[60vh] grid place-items-center">
          <Loader2 className="size-7 animate-spin text-emerald2" />
        </div>
        <Footer />
      </main>
    );
  }
  if (error || !listing) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container min-h-[60vh] grid place-items-center text-center">
          <div className="max-w-md">
            <AlertTriangle className="size-7 mx-auto text-rose-500" />
            <h2 className="font-display text-2xl font-bold mt-3">Listing not available</h2>
            <p className="text-sm text-muted-foreground mt-1">{error || 'This listing could not be found, or is pending approval.'}</p>
            <Button asChild className="rounded-full mt-5 bg-emerald2 hover:bg-emerald2-deep"><Link href="/explore">Back to Explore</Link></Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const item = listing;
  const gallery = (item?.images && Array.isArray(item.images) && item.images.length) ? item.images : [];
  
  // Check if listing has inventory types
  const hasTypes = item?.inventoryTypes && Array.isArray(item.inventoryTypes) && item.inventoryTypes.length > 0;
  const selectedType = hasTypes && selectedTypeId ? item.inventoryTypes.find(t => t?.id === selectedTypeId) : null;
  const displayPrice = selectedType?.price ?? item?.price ?? 0;
  
  // Compute nights inline (no hook) — listing-existence already gates this branch
  const _ci = new Date(checkIn), _co = new Date(checkOut);
  const nights = (isNaN(_ci) || isNaN(_co) || _co <= _ci) ? 1 : Math.max(1, Math.round((_co - _ci) / 86400000));
  const subtotal = displayPrice * nights;
  const tax = Math.round(subtotal * 0.12);
  const total = subtotal + tax + 800;
  const reserveHref = `/booking?id=${item?.id ?? ''}&guests=${guests}&checkIn=${checkIn}&checkOut=${checkOut}${selectedTypeId ? `&typeId=${selectedTypeId}` : ''}`;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/explore" className="hover:text-charcoal">Explore</Link>
          <ChevronRight className="size-3" />
          <span className="capitalize">{item?.category ?? 'Property'}</span>
          <ChevronRight className="size-3" />
          <span className="text-charcoal font-medium line-clamp-1">{item?.title ?? 'Property Details'}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mt-3">
          <div>
            <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">{item?.title ?? 'Property Details'}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="size-4 text-gold fill-gold" /> {avgRating > 0 ? avgRating.toFixed(1) : '—'} {reviewCount > 0 && `(${reviewCount} Reviews)`}</span>
              <span className="flex items-center gap-1"><MapPin className="size-4" /> {item?.location ?? 'Kashmir'}</span>
              {item?.superhost && <span className="flex items-center gap-1 text-emerald2"><BadgeCheck className="size-4" /> Superhost</span>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleShare}><Share2 className="size-4 mr-2" /> Share</Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleToggleSave}><Heart className={`size-4 mr-2 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} /> {saveCount > 0 && `${saveCount} `}Saved</Button>
          </div>
        </div>

        {/* Premium image gallery — replaces the old 4-col grid.
            Mobile: single hero carousel (~38dvh) with overlay controls.
            Desktop: 4-tile collage with "View All Photos" CTA.
            Both open a shared fullscreen viewer (swipe + pinch/double-tap zoom). */}
        <PropertyGallery
          images={gallery}
          title={item?.title}
          onBack={() => (typeof window !== 'undefined' ? window.history.back() : null)}
          onShare={handleShare}
          onToggleSave={handleToggleSave}
          isSaved={liked}
          saveCount={saveCount}
        />
      </div>

      <div className="container mt-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald2 font-semibold">Hosted by</div>
              <div className="flex items-center gap-3 mt-2">
                {item?.hostAvatar && <img src={item.hostAvatar} alt="" className="size-12 rounded-full object-cover" />}
                <div>
                  <div className="font-display font-semibold">{item?.hostName ?? 'Safar Host'}</div>
                  <div className="text-xs text-muted-foreground">{item?.superhost ? 'Superhost · Local host' : 'Local host · Verified'}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              {item?.guests && <div><div className="font-semibold">{item.guests}</div><div className="text-xs text-muted-foreground">Guests</div></div>}
              {item?.beds && <div><div className="font-semibold">{item.beds}</div><div className="text-xs text-muted-foreground">Beds</div></div>}
              {item?.baths && <div><div className="font-semibold">{item.baths}</div><div className="text-xs text-muted-foreground">Baths</div></div>}
              {item?.duration && <div><div className="font-semibold">{item.duration}</div><div className="text-xs text-muted-foreground">Duration</div></div>}
            </div>
          </div>

          <div className="prose prose-zinc max-w-none">
            <h3 className="font-display text-2xl font-bold">A signature Kashmir experience</h3>
            <p className="text-charcoal/80 leading-relaxed">{item?.description ?? `${item?.title ?? 'This property'} sits in ${item?.location ?? 'Kashmir'}, ready to deliver an unforgettable Kashmir experience.`}</p>
          </div>

          {item?.amenities && Array.isArray(item.amenities) && item.amenities.length > 0 && (
            <div>
              <h3 className="font-display text-2xl font-bold mb-4">What this place offers</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {item.amenities.map((a) => {
                  const Ico = AMENITY_ICONS[a] || ShieldCheck;
                  return <div key={a} className="flex items-center gap-3 p-4 rounded-2xl border bg-white"><Ico className="size-5 text-emerald2" /><span className="font-medium">{a}</span></div>;
                })}
              </div>
            </div>
          )}

          {item?.services && Array.isArray(item.services) && item.services.length > 0 && (
            <div>
              <div className="flex items-end justify-between flex-wrap gap-2 mb-4">
                <div>
                  <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">All-in-one host</div>
                  <h3 className="font-display text-2xl font-bold">Services offered by {item?.hostName ?? 'Host'}</h3>
                </div>
                <div className="text-xs text-muted-foreground">{item.services.length} services</div>
              </div>
              <div className="space-y-4">
                {SERVICE_GROUPS.map((g) => {
                  const ids = (item.services || []).filter(id => SERVICE_INDEX[id]?.group === g.id);
                  if (!ids.length) return null;
                  return (
                    <div key={g.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-display font-semibold">{g.label}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ids.length} service{ids.length>1?'s':''}</div>
                      </div>
                      <ServiceBadges ids={ids} max={20} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-28 rounded-3xl border bg-white shadow-xl p-6">
            <div className="flex items-baseline justify-between">
              <div><span className="font-display text-3xl font-bold">₹{displayPrice.toLocaleString('en-IN')}</span><span className="text-sm text-muted-foreground"> / {item?.duration ?? 'night'}</span></div>
              <div className="text-xs flex items-center gap-1 text-muted-foreground"><Star className="size-3.5 fill-gold text-gold" /> {item?.rating ?? '—'}</div>
            </div>
            
            {hasTypes && (
              <div className="mt-4 mb-4">
                <div className="text-xs uppercase tracking-wider font-semibold mb-2">Select Type</div>
                <div className="space-y-2">
                  {item.inventoryTypes.filter(t => t?.status === 'active').map((type) => (
                    <button
                      key={type?.id ?? Math.random()}
                      type="button"
                      onClick={() => setSelectedTypeId(type?.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition ${
                        selectedTypeId === type?.id 
                          ? 'border-emerald2 bg-emerald-50' 
                          : 'border-border hover:border-charcoal/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{type?.name ?? 'Type'}</div>
                        <div className="text-emerald2 font-bold text-sm">
                          ₹{(type?.price ?? 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      {type?.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {type.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {type?.available ?? 0} of {type?.quantity ?? 0} available
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="p-3 rounded-2xl border cursor-pointer hover:border-emerald2 transition">
                <div className="text-[10px] uppercase tracking-wider font-semibold">Check-in</div>
                <input
                  type="date"
                  min={todayStr}
                  value={checkIn}
                  onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value && checkOut <= e.target.value) setCheckOut(''); }}
                  className="w-full text-sm mt-0.5 outline-none bg-transparent [color-scheme:light]"
                />
              </label>
              <label className="p-3 rounded-2xl border cursor-pointer hover:border-emerald2 transition">
                <div className="text-[10px] uppercase tracking-wider font-semibold">Check-out</div>
                <input
                  type="date"
                  min={checkIn || todayStr}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full text-sm mt-0.5 outline-none bg-transparent [color-scheme:light]"
                />
              </label>
              <div className="p-3 rounded-2xl border col-span-2 flex items-center justify-between">
                <div><div className="text-[10px] uppercase tracking-wider font-semibold">Guests</div><div className="text-sm mt-0.5">{guests} {guests === 1 ? 'adult' : 'adults'}</div></div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setGuests(Math.max(1,guests-1))} className="size-8 rounded-full border hover:bg-secondary">−</button>
                  <button onClick={()=>setGuests(Math.min(item?.guests ?? 30, guests+1))} className="size-8 rounded-full border hover:bg-secondary">+</button>
                </div>
              </div>
            </div>
            {conflict && (
              <div className="mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>These dates overlap an existing {conflict.status} booking ({new Date(conflict.checkInDate).toLocaleDateString()} → {new Date(conflict.checkOutDate).toLocaleDateString()}). Try different dates.</span>
              </div>
            )}
            <Button asChild disabled={!!conflict || (hasTypes && !selectedTypeId)} className="w-full mt-4 h-12 rounded-2xl bg-emerald2 hover:bg-emerald2-deep font-semibold disabled:opacity-60 disabled:pointer-events-none">
              <Link href={reserveHref}>Reserve <ChevronRight className="size-4 ml-1" /></Link>
            </Button>
            {hasTypes && !selectedTypeId && (
              <div className="mt-2 text-xs text-amber-600 text-center">Please select a type to continue</div>
            )}
            <WhatsAppButton 
              phone={item?.hostPhone}
              listingTitle={item?.title ?? 'Property'}
              location={item?.location ?? 'Kashmir'}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              variant="outline"
              className="w-full mt-2 h-11 rounded-2xl"
            />
            <div className="mt-5 pt-5 border-t space-y-2 text-sm">
              <div className="flex justify-between"><span>₹{(item?.price ?? displayPrice).toLocaleString('en-IN')} × {nights} nights</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Cleaning fee</span><span>₹800</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Service &amp; taxes</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Reviews Section */}
      <div className="container mt-16 mb-16">
        <h2 className="font-display text-2xl font-bold">⭐ {avgRating > 0 ? avgRating.toFixed(1) : '—'} {reviewCount > 0 && `(${reviewCount} Reviews)`}</h2>
        
        {user && !showReviewForm && (
          <Button onClick={() => setShowReviewForm(true)} className="mt-4 rounded-full bg-emerald2 hover:bg-emerald2-deep">Write a Review</Button>
        )}

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mt-6 p-6 rounded-2xl border bg-secondary/20">
            <h3 className="font-semibold mb-3">Share Your Experience</h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="hover:scale-110 transition">
                  <Star className={`size-8 ${star <= rating ? 'fill-gold text-gold' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full p-4 rounded-xl border resize-none focus:ring-2 focus:ring-emerald2/20 focus:border-emerald2 outline-none"
              rows="4"
            />
            <div className="flex gap-2 mt-3">
              <Button type="submit" disabled={submittingReview} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)} className="rounded-full">Cancel</Button>
            </div>
          </form>
        )}

        {Array.isArray(reviews) && reviews.length > 0 && (
          <div className="mt-8 space-y-6">
            {reviews.slice(0, 5).map((review) => (
              <div key={review?.id ?? Math.random()} className="p-6 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-emerald grid place-items-center text-white font-bold">
                      {review?.userName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <div className="font-semibold">{review?.userName ?? 'User'}</div>
                      <div className="text-xs text-muted-foreground">
                        {review?.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`size-4 ${i < (review?.rating ?? 0) ? 'fill-gold text-gold' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                {review?.reviewText && <p className="text-muted-foreground leading-relaxed">{review.reviewText}</p>}
              </div>
            ))}
            {reviewCount > 5 && (
              <Button variant="outline" className="w-full rounded-full">View All {reviewCount} Reviews</Button>
            )}
          </div>
        )}

        {reviewCount === 0 && !showReviewForm && (
          <p className="mt-6 text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
        )}
      </div>

      <Footer />
      <AIAssistantFloating />
    </main>
  );
}
export default App;
