'use client';

// Near Me — Dedicated location-aware discovery page.
//
// This is NOT a redirect to /explore. It is its own route that:
//   1) Requests the user's GPS location via the browser Geolocation API.
//   2) Fetches the same approved listings the marketplace uses.
//   3) Sorts them by real haversine distance from the user (nearest first).
//   4) Reuses the existing PropertyCard so the visual language is unchanged.
//   5) Offers Distance / Category / Price / Rating / Open Now filters.
//
// If permission is denied or the browser doesn't support geolocation, the
// user gets a fallback screen offering "Enable Location" or "Choose Location
// Manually" (opens the existing LocationModal).

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, LocateFixed, Loader2, SlidersHorizontal, X, AlertCircle } from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import PropertyCard from '@/components/safar/PropertyCard';
import { calculateListingDistance, formatDistance, getLocationCoordinates } from '@/lib/location-utils';

// Lazy-load LocationModal — only mounted when the user opts to choose manually.
const LocationModal = dynamic(() => import('@/components/safar/LocationModal'), { ssr: false });

const NEARBY_CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'stay',        label: 'Stays' },
  { id: 'houseboat',   label: 'Houseboats' },
  { id: 'hotel',       label: 'Hotels' },
  { id: 'cabin',       label: 'Cabins' },
  { id: 'experience',  label: 'Experiences' },
  { id: 'tour',        label: 'Tours' },
  { id: 'guide',       label: 'Guides' },
  { id: 'transport',   label: 'Transport' },
  { id: 'restaurant',  label: 'Restaurants' },
  { id: 'cafe',        label: 'Cafés' },
  { id: 'rental',      label: 'Rentals' },
];

// A listing's `category` (top-level marketplace bucket) or `subcategory`
// (e.g. houseboat) can both satisfy a filter. This lets the page work
// regardless of which field the seed/user data uses.
function listingMatchesCategory(listing, categoryId) {
  if (categoryId === 'all') return true;
  const cat = (listing.category || '').toLowerCase();
  const sub = (listing.subcategory || '').toLowerCase();
  return cat === categoryId || sub === categoryId;
}

const LOCATION_PERM_KEY = 'safar_nearme_permission';

export default function NearMePage() {
  // Geolocation state
  const [coords, setCoords] = useState(null);        // { lat, lon }
  const [permState, setPermState] = useState('idle'); // idle | prompting | granted | denied | unsupported
  const [permError, setPermError] = useState('');
  const [manualOpen, setManualOpen] = useState(false);

  // Data + filters
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [category, setCategory] = useState('all');
  const [maxDistance, setMaxDistance] = useState(50);   // km
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);          // 0 = no cap
  const [openNow, setOpenNow] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ---- Geolocation ---------------------------------------------------------
  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setPermState('unsupported');
      return;
    }
    setPermState('prompting');
    setPermError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setPermState('granted');
        try { window.localStorage.setItem(LOCATION_PERM_KEY, 'granted'); } catch { /* ignore */ }
      },
      (err) => {
        setPermState('denied');
        setPermError(err?.message || 'Location permission denied');
        try { window.localStorage.setItem(LOCATION_PERM_KEY, 'denied'); } catch { /* ignore */ }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Auto-request on first mount. If the user previously granted permission
  // the browser resolves silently without a second prompt.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setPermState('unsupported');
        return;
      }
      // Prefer the Permissions API when available — lets us skip the prompt
      // if the user previously denied without another popup.
      try {
        if (navigator.permissions?.query) {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (cancelled) return;
          if (status.state === 'denied') {
            setPermState('denied');
            return;
          }
        }
      } catch { /* fall through — some browsers throw on 'geolocation' name */ }
      requestLocation();
    })();
    return () => { cancelled = true; };
  }, [requestLocation]);

  // ---- Data fetch ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingListings(true);
      try {
        const res = await fetch('/api/listings?limit=200');
        const data = await res.json();
        if (cancelled) return;
        const arr = Array.isArray(data?.listings) ? data.listings
                  : Array.isArray(data?.items)    ? data.items
                  : Array.isArray(data)           ? data
                  : [];
        setListings(arr);
      } catch (e) {
        console.error('Near Me: failed to load listings', e);
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoadingListings(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Manual location fallback — the existing LocationModal returns a
  // `{ name, lat, lon }` object which we treat as if geolocation resolved.
  const onManualLocation = (loc) => {
    if (!loc) return;
    const lat = loc.lat ?? loc.latitude;
    const lon = loc.lon ?? loc.lng ?? loc.longitude;
    if (typeof lat === 'number' && typeof lon === 'number') {
      setCoords({ lat, lon });
      setPermState('granted');
    } else if (loc.name) {
      // Fallback: resolve well-known Kashmir names to coordinates.
      const c = getLocationCoordinates(loc.name);
      if (c) {
        setCoords({ lat: c.lat, lon: c.lon });
        setPermState('granted');
      }
    }
  };

  // ---- Enrich + filter + sort ---------------------------------------------
  const enriched = useMemo(() => {
    if (!coords) return [];
    return listings
      .map((l) => {
        // Prefer explicit coordinates on the listing; fall back to a
        // best-effort name-based lookup for legacy data.
        let lat = l?.coordinates?.lat;
        let lon = l?.coordinates?.lng ?? l?.coordinates?.lon;
        if (typeof lat !== 'number' || typeof lon !== 'number') {
          const c = getLocationCoordinates(l?.location);
          lat = c?.lat; lon = c?.lon;
        }
        const distanceKm = (typeof lat === 'number' && typeof lon === 'number')
          ? calculateListingDistance(coords.lat, coords.lon, l)
          : Number.POSITIVE_INFINITY;
        return { ...l, __distanceKm: distanceKm, __distanceLabel: isFinite(distanceKm) ? formatDistance(distanceKm) : null };
      })
      .filter((l) => listingMatchesCategory(l, category))
      .filter((l) => l.__distanceKm <= maxDistance)
      .filter((l) => (l.rating ?? 0) >= minRating)
      .filter((l) => (maxPrice > 0 ? (l.price ?? 0) <= maxPrice : true))
      .filter((l) => (openNow ? l.openNow !== false : true))
      .sort((a, b) => a.__distanceKm - b.__distanceKm);
  }, [coords, listings, category, maxDistance, minRating, maxPrice, openNow]);

  // ---- Render --------------------------------------------------------------
  return (
    <>
      <Navbar transparent={false} />
      <main className="min-h-[100dvh] pt-20 pb-24 md:pb-10 bg-secondary/30">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="mb-5 md:mb-6">
            <div className="flex items-center gap-2 text-emerald2 text-xs uppercase tracking-[0.18em] font-bold">
              <LocateFixed className="size-4" /> Near Me
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-charcoal mt-1.5">
              Discover what&apos;s around you
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stays, experiences, guides, rentals and more — sorted by distance from your location.
            </p>
          </div>

          {/* Permission gate */}
          {(permState === 'idle' || permState === 'prompting') && !coords && (
            <div className="rounded-3xl border bg-white p-6 flex flex-col items-center text-center">
              <Loader2 className="size-6 text-emerald2 animate-spin mb-3" />
              <div className="font-semibold text-charcoal">Detecting your location…</div>
              <div className="text-sm text-muted-foreground mt-1">Please allow location access when prompted.</div>
            </div>
          )}

          {(permState === 'denied' || permState === 'unsupported') && !coords && (
            <div className="rounded-3xl border bg-white p-6 md:p-8 flex flex-col items-center text-center max-w-md mx-auto">
              <div className="size-14 rounded-2xl bg-rose-50 grid place-items-center mb-3">
                <AlertCircle className="size-7 text-rose-500" strokeWidth={2.2} />
              </div>
              <div className="font-display font-semibold text-lg text-charcoal">Location access needed</div>
              <p className="text-sm text-muted-foreground mt-1.5 leading-snug">
                {permState === 'unsupported'
                  ? 'Your browser doesn\u2019t support location. You can still pick a location manually.'
                  : (permError || 'We couldn\u2019t detect your location. Enable it in your browser settings, or choose one manually.')}
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2 w-full">
                <button
                  type="button"
                  onClick={requestLocation}
                  className="flex-1 h-11 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold text-sm shadow-md shadow-emerald2/25 transition"
                >
                  Enable Location
                </button>
                <button
                  type="button"
                  onClick={() => setManualOpen(true)}
                  className="flex-1 h-11 rounded-full border border-border bg-white text-charcoal font-semibold text-sm hover:bg-secondary transition"
                >
                  Choose Location Manually
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {coords && (
            <>
              {/* Filter bar */}
              <div className="sticky top-16 md:top-20 z-30 -mx-4 md:mx-0 mb-4 md:mb-5 bg-secondary/30 md:bg-transparent backdrop-blur px-4 md:px-0 py-2">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className="shrink-0 h-9 px-3 rounded-full border border-border bg-white text-[13px] font-semibold text-charcoal flex items-center gap-1.5 hover:bg-secondary transition"
                  >
                    <SlidersHorizontal className="size-3.5" /> Filters
                  </button>
                  {NEARBY_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`shrink-0 h-9 px-3.5 rounded-full text-[13px] font-semibold transition border ${
                        category === c.id
                          ? 'bg-emerald2 text-white border-emerald2 shadow shadow-emerald2/25'
                          : 'bg-white text-charcoal border-border hover:bg-secondary'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {showFilters && (
                  <div className="mt-3 rounded-2xl border bg-white p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FilterSlider
                      label="Max distance"
                      value={maxDistance}
                      onChange={setMaxDistance}
                      min={1}
                      max={200}
                      step={1}
                      unit=" km"
                    />
                    <FilterSlider
                      label="Min rating"
                      value={minRating}
                      onChange={setMinRating}
                      min={0}
                      max={5}
                      step={0.5}
                      unit=" ★"
                    />
                    <FilterSlider
                      label="Max price"
                      value={maxPrice}
                      onChange={setMaxPrice}
                      min={0}
                      max={50000}
                      step={500}
                      unit=" ₹"
                      hint={maxPrice === 0 ? 'Any' : null}
                    />
                    <label className="flex items-center gap-2 mt-2 md:mt-0 md:self-end">
                      <input
                        type="checkbox"
                        checked={openNow}
                        onChange={(e) => setOpenNow(e.target.checked)}
                        className="size-4 accent-emerald2"
                      />
                      <span className="text-sm font-medium text-charcoal">Open now</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  {loadingListings
                    ? 'Loading…'
                    : `${enriched.length} result${enriched.length === 1 ? '' : 's'} near you`}
                </div>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="text-[13px] font-semibold text-emerald2 hover:underline inline-flex items-center gap-1.5"
                >
                  <LocateFixed className="size-3.5" /> Refresh location
                </button>
              </div>

              {loadingListings ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-3xl bg-white/60 border animate-pulse h-72" />
                  ))}
                </div>
              ) : enriched.length === 0 ? (
                <div className="rounded-3xl border bg-white p-10 text-center">
                  <MapPin className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                  <div className="font-semibold text-charcoal">No results within {maxDistance} km</div>
                  <div className="text-sm text-muted-foreground mt-1">Try increasing the distance or clearing filters.</div>
                </div>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {enriched.map((item, idx) => (
                    <li key={item.id || idx} className="relative">
                      {/* Distance chip overlaid on the reused PropertyCard —
                          keeps the card design identical while surfacing the
                          key Near-Me signal. */}
                      {item.__distanceLabel && (
                        <div className="absolute z-10 top-3 left-3 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/95 backdrop-blur border shadow text-[11.5px] font-semibold text-charcoal">
                          <LocateFixed className="size-3 text-emerald2" />
                          {item.__distanceLabel}
                        </div>
                      )}
                      <PropertyCard item={item} index={idx} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>

      <LocationModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onLocationSelected={(loc) => { setManualOpen(false); onManualLocation(loc); }}
      />
    </>
  );
}

function FilterSlider({ label, value, onChange, min, max, step, unit, hint }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11.5px] uppercase tracking-wider font-bold text-muted-foreground">{label}</span>
        <span className="text-[12px] font-semibold text-charcoal">
          {hint || `${value}${unit || ''}`}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald2"
      />
    </label>
  );
}
