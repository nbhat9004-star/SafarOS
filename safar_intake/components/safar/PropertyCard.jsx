'use client';
import Link from 'next/link';
import Image from 'next/image';

import { Heart, Star, MapPin, Navigation } from 'lucide-react';
import { useState, memo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useWishlist } from '@/lib/safar-storage';
import { formatDistance } from '@/lib/location-utils';

function PropertyCard({ item, index = 0, priority = false }) {
  const { user } = useAuth();
  const { has, toggle } = useWishlist(user?.id);
  const liked = has(item.id);
  const [imgIdx, setImgIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const onHeartClick = (e) => {
    e.preventDefault();
    const wasLiked = liked;
    toggle(item.id);
    toast.success(wasLiked ? 'Removed from wishlist' : 'Saved to wishlist');
  };
  // Support both demo-data shape (image+gallery+host{}) and API shape (images[]+hostName+superhost)
  const gallery = (item.gallery && item.gallery.length ? item.gallery : null)
    || (Array.isArray(item.images) && item.images.length ? item.images : null)
    || [item.image].filter(Boolean);
  const isSuperhost = item.host?.superhost ?? item.superhost;

  // PERF: previously rendered all gallery images stacked with opacity, causing 3-5× more image
  // requests per card. Now we only render the currently visible image (the next/prev get prefetched
  // by the browser when the user clicks a dot, which is acceptable for a hover-only carousel).
  const currentSrc = gallery[imgIdx] || gallery[0];

  // Mobile swipe handlers
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && imgIdx < gallery.length - 1) {
      e.preventDefault();
      setImgIdx(imgIdx + 1);
    }
    if (isRightSwipe && imgIdx > 0) {
      e.preventDefault();
      setImgIdx(imgIdx - 1);
    }
  };

  return (
    <div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px', amount: 0.2 }}
      transition={{ duration: 0.55, delay: Math.min(index, 6) * 0.05, ease: 'easeOut' }}
      className="group"
    >
      <Link href={`/property/${item.id}`} className="block">
        <div 
          className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-secondary"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Image
            src={currentSrc}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            quality={60}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/15 pointer-events-none" />

          {item.badge && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-white/90 text-charcoal shadow-md backdrop-blur">{item.badge}</div>
          )}
          
          {/* Distance badge for Near Me mode */}
          {item.distance !== undefined && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-emerald2 text-white shadow-md backdrop-blur flex items-center gap-1.5">
              <Navigation className="size-3" />
              {formatDistance(item.distance)}
            </div>
          )}
          
          <button onClick={onHeartClick} aria-label="Wishlist"
            className="absolute top-3 right-3 size-9 grid place-items-center rounded-full bg-white/85 hover:bg-white transition shadow-md backdrop-blur">
            <Heart className={`size-4 transition ${liked ? 'fill-rose-500 text-rose-500' : 'text-charcoal'}`} />
          </button>

          {gallery.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {gallery.slice(0,4).map((_, i) => (
                <button key={i} aria-label={`img ${i+1}`} onClick={(e)=>{e.preventDefault();setImgIdx(i);}}
                  className={`size-1.5 rounded-full transition ${i===imgIdx ? 'bg-white w-4' : 'bg-white/55'}`} />
              ))}
            </div>
          )}

          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-charcoal/80 text-white backdrop-blur flex items-center gap-1">
            <Star className="size-3 fill-gold text-gold" /> {item.rating}
          </div>
        </div>

        <div className="pt-3.5 px-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-semibold text-[15px] leading-snug line-clamp-1 group-hover:text-emerald2 transition">{item.title}</h3>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{item.reviews} reviews</div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> <span className="line-clamp-1">{item.location}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              {item.displayPrice && item.displayPrice < item.price && (
                <span className="text-xs text-muted-foreground mr-1">From</span>
              )}
              <span className="font-display font-bold text-charcoal text-lg">₹{(item.displayPrice || item.price).toLocaleString('en-IN')}</span>
              <span className="text-xs text-muted-foreground ml-1">/ {item.duration ? item.duration : 'night'}</span>
            </div>
            {isSuperhost && <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald2 bg-emerald-50 px-2 py-0.5 rounded-full">Superhost</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}

// PERF: `memo` prevents re-rendering all 8-12 PropertyCards on the homepage
// grid whenever a sibling toggles wishlist or the parent state changes. The
// custom comparator only re-renders when the actual listing identity or
// index/priority changes (wishlist state is subscribed to internally via
// useWishlist, so wishlist changes still propagate correctly).
export default memo(PropertyCard, (prev, next) =>
  prev.item?.id === next.item?.id &&
  prev.index === next.index &&
  prev.priority === next.priority
);
