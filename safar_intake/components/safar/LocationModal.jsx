'use client';

/**
 * LocationModal — Premium bottom-sheet / dialog that handles:
 *   1) Requesting geolocation permission (native browser prompt).
 *   2) Reverse-geocoding (BigDataCloud free client endpoint — no API key).
 *   3) Manual location picker with search + popular destinations.
 *   4) Persistence to localStorage under `safar_location`.
 *
 * Only the LOCATION SELECTOR button behaviour changes. No UI/branding
 * changes outside of this new component.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, X, Search, Loader2, Navigation2, Check, ChevronRight } from 'lucide-react';

/* ---------------------------------------------------------------------------
 * Storage helpers
 * ------------------------------------------------------------------------ */
export const LOCATION_STORAGE_KEY = 'safar_location';

export const readSavedLocation = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeSavedLocation = (loc) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    // Broadcast so any part of the app can react without a refresh.
    window.dispatchEvent(new CustomEvent('safar:location-changed', { detail: loc }));
  } catch {
    /* ignore */
  }
};

/* ---------------------------------------------------------------------------
 * Popular Kashmir destinations (curated for the manual picker)
 * ------------------------------------------------------------------------ */
const POPULAR_LOCATIONS = [
  { name: 'Srinagar',    region: 'Kashmir', lat: 34.0837, lng: 74.7973 },
  { name: 'Gulmarg',     region: 'Kashmir', lat: 34.0484, lng: 74.3805 },
  { name: 'Pahalgam',    region: 'Kashmir', lat: 34.0159, lng: 75.3151 },
  { name: 'Sonamarg',    region: 'Kashmir', lat: 34.3025, lng: 75.2925 },
  { name: 'Doodhpathri', region: 'Kashmir', lat: 33.8531, lng: 74.6099 },
  { name: 'Yusmarg',     region: 'Kashmir', lat: 33.8306, lng: 74.6669 },
  { name: 'Gurez',       region: 'Kashmir', lat: 34.6383, lng: 74.8353 },
  { name: 'Kupwara',     region: 'Kashmir', lat: 34.5307, lng: 74.2565 },
];

/* ---------------------------------------------------------------------------
 * Reverse-geocode a coordinate pair to a human-readable location.
 * Uses BigDataCloud's free client-side endpoint (no API key required).
 * ------------------------------------------------------------------------ */
async function reverseGeocode(lat, lng) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error('Reverse geocoding failed');
  const data = await res.json();
  const name =
    data.city ||
    data.locality ||
    data.principalSubdivision ||
    data.countryName ||
    'Your Location';
  const region =
    data.principalSubdivision ||
    data.countryName ||
    '';
  return { name, region, lat, lng };
}

/* ---------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------ */
export default function LocationModal({ open, onClose, onLocationSelected }) {
  // STAGES: 'prompt' | 'detecting' | 'denied' | 'picker'
  const [stage, setStage] = useState('prompt');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState([]);
  const dialogRef = useRef(null);

  // Load recent locations on open
  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage.getItem('safar_recent_locations');
      setRecent(raw ? JSON.parse(raw) : []);
    } catch {
      setRecent([]);
    }
    setStage('prompt');
    setError('');
    setQuery('');
  }, [open]);

  // ESC to close, and lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_LOCATIONS;
    return POPULAR_LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q)
    );
  }, [query]);

  const commitLocation = (loc) => {
    writeSavedLocation(loc);
    // Update recent (dedup by name, cap 5)
    try {
      const raw = window.localStorage.getItem('safar_recent_locations');
      const prev = raw ? JSON.parse(raw) : [];
      const next = [loc, ...prev.filter((r) => r.name !== loc.name)].slice(0, 5);
      window.localStorage.setItem('safar_recent_locations', JSON.stringify(next));
    } catch {
      /* ignore */
    }
    onLocationSelected?.(loc);
    onClose?.();
  };

  const handleAllow = () => {
    setError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location is not supported on this device.');
      setStage('denied');
      return;
    }
    setStage('detecting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const loc = await reverseGeocode(latitude, longitude);
          commitLocation(loc);
        } catch (err) {
          setError(err?.message || 'Could not fetch your location details.');
          setStage('picker');
        }
      },
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err.code === 1) {
          setStage('denied');
        } else {
          setError(err.message || 'Location detection failed.');
          setStage('picker');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="safar-location-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close location picker"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Sheet / dialog */}
      <div
        ref={dialogRef}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in slide-in-from-bottom-4 duration-250"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Grabber (mobile bottom-sheet) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 sm:pt-5 pb-3">
          <h2
            id="safar-location-title"
            className="text-[17px] font-semibold text-slate-900 tracking-tight"
          >
            {stage === 'prompt' && 'Enable location'}
            {stage === 'detecting' && 'Detecting location…'}
            {stage === 'denied' && 'Choose a location'}
            {stage === 'picker' && 'Choose a location'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-500 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {stage === 'prompt' && (
            <div className="text-center pt-2 pb-1">
              <div className="mx-auto size-14 rounded-2xl bg-emerald-50 grid place-items-center">
                <MapPin className="size-7 text-emerald-700" strokeWidth={2.2} />
              </div>
              <p className="mt-4 text-[15px] font-semibold text-slate-900">
                Allow Safar Curated to access your location?
              </p>
              <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
                This helps us show nearby stays, experiences, guides, transport,
                and personalized recommendations.
              </p>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={handleAllow}
                  className="w-full h-12 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-[14.5px] shadow-[0_10px_26px_-12px_rgba(15,61,46,0.55)] transition inline-flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Navigation2 className="size-4" />
                  Allow location
                </button>
                <button
                  type="button"
                  onClick={() => setStage('picker')}
                  className="w-full h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[14.5px] transition active:scale-[0.98]"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          {stage === 'detecting' && (
            <div className="text-center py-8">
              <Loader2 className="size-8 mx-auto text-emerald-700 animate-spin" />
              <p className="mt-3 text-[14px] text-slate-600">
                Detecting your location…
              </p>
            </div>
          )}

          {(stage === 'denied' || stage === 'picker') && (
            <>
              {stage === 'denied' && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5">
                  <p className="text-[12.5px] text-amber-900 leading-relaxed">
                    <strong>Location access denied.</strong> You can continue
                    by selecting a location manually.
                  </p>
                </div>
              )}
              {!!error && stage === 'picker' && (
                <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5">
                  <p className="text-[12.5px] text-rose-900">{error}</p>
                </div>
              )}

              {/* Search */}
              <label className="flex items-center gap-2 h-12 px-4 rounded-full bg-slate-100 focus-within:ring-2 focus-within:ring-emerald-200 transition">
                <Search className="size-4 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Kashmir locations…"
                  className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-slate-500"
                />
              </label>

              {/* Try again — allow retry only if user is on denied stage */}
              {stage === 'denied' && (
                <button
                  type="button"
                  onClick={handleAllow}
                  className="mt-3 w-full h-10 rounded-full border border-emerald-200 text-emerald-800 font-semibold text-[13px] hover:bg-emerald-50 transition inline-flex items-center justify-center gap-2"
                >
                  <Navigation2 className="size-3.5" />
                  Try location again
                </button>
              )}

              {/* Recent */}
              {recent.length > 0 && (
                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">
                    Recent
                  </div>
                  <div className="grid gap-1">
                    {recent.map((r) => (
                      <button
                        key={`r-${r.name}`}
                        type="button"
                        onClick={() => commitLocation(r)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <MapPin className="size-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-slate-900 truncate">
                              {r.name}
                            </div>
                            {r.region && (
                              <div className="text-[12px] text-slate-500 truncate">
                                {r.region}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular */}
              <div className="mt-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">
                  Popular destinations
                </div>
                <div className="grid gap-1 max-h-[46vh] overflow-y-auto -mx-1 px-1">
                  {filtered.map((l) => (
                    <button
                      key={l.name}
                      type="button"
                      onClick={() => commitLocation(l)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-emerald-50/60 active:bg-emerald-50 transition text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-xl bg-emerald-50 grid place-items-center shrink-0">
                          <MapPin className="size-4 text-emerald-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14.5px] font-semibold text-slate-900 truncate">
                            {l.name}
                          </div>
                          <div className="text-[12px] text-slate-500 truncate">
                            {l.region}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-300 group-hover:text-emerald-700 shrink-0" />
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center py-6 text-[13px] text-slate-500">
                      No locations match &ldquo;{query}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
