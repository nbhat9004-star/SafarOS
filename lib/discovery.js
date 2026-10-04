// SafarOS — Supplier Discovery provider abstraction (K1 foundation).
// A clean, provider-agnostic interface for discovering real travel businesses.
// It wires Google Places API (New) ONLY when a server-side key is configured.
// When no key is present, searches return { configured: false } and the engine
// NEVER fabricates/invents supplier records. No scraping, no anti-bot bypass.
//
// Secrets: read strictly from server-side env. Never exposed to the client.
//   GOOGLE_PLACES_API_KEY  (preferred)  or  GOOGLE_MAPS_API_KEY

const PLACES_BASE = 'https://places.googleapis.com/v1';

function apiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
}

export function discoveryConfig() {
  const key = apiKey();
  return { configured: !!key, provider: key ? 'google_places' : null };
}

// Map a discovered business into an EXISTING SafarOS supplier type.
// Specific discovery categories (cab/taxi/driver/shikara/pony/cottage/resort)
// collapse into the closest existing type — no new collections are created.
export function mapToSupplierType({ types = [], primaryType = '', query = '' } = {}) {
  const hay = [primaryType, ...(Array.isArray(types) ? types : []), query].join(' ').toLowerCase();
  const has = (...k) => k.some((w) => hay.includes(w));
  if (has('houseboat', 'house boat')) return 'houseboat';
  if (has('shikara', 'pony', 'trek', 'rafting', 'skiing', 'paraglid', 'gondola', 'sightsee',
    'tourist_attraction', 'attraction', 'adventure', 'activity', 'camp', 'safari')) return 'activity';
  if (has('hotel', 'lodging', 'resort', 'cottage', 'guest', 'motel', 'hostel', 'inn', 'homestay', 'villa')) return 'hotel';
  if (has('restaurant', 'cafe', 'food', 'dining', 'meal', 'dhaba', 'bakery', 'bar')) return 'restaurant';
  if (has('guide', 'tour_agency', 'travel_agency', 'tour operator', 'tour guide')) return 'guide';
  if (has('taxi', 'cab', 'car_rental', 'car rental', 'transport', 'driver', 'bus', 'van', 'tempo', 'rental')) return 'transport';
  return 'other';
}

function digitsOnly(s) { return String(s || '').replace(/[^\d]/g, ''); }

// Normalize a Google Places (New) place into the SafarOS discovery shape.
// Missing fields are returned empty/null — callers must never invent them.
function normalizePlace(p, query) {
  const name = (p.displayName && p.displayName.text) || '';
  const phone = p.internationalPhoneNumber || p.nationalPhoneNumber || '';
  const types = Array.isArray(p.types) ? p.types : [];
  const primaryType = (p.primaryTypeDisplayName && p.primaryTypeDisplayName.text) || p.primaryType || '';
  const loc = p.location || {};
  const photoName = Array.isArray(p.photos) && p.photos[0] ? p.photos[0].name : '';
  return {
    source: 'google_places',
    sourceId: p.id || '',
    name,
    category: primaryType || (types[0] || ''),
    supplierType: mapToSupplierType({ types, primaryType: p.primaryType || primaryType, query }),
    address: p.formattedAddress || '',
    phone,
    // Phone-derived WhatsApp target. WhatsApp capability is NOT guaranteed by the
    // provider; the UI presents this only as a convenience when a phone exists.
    whatsapp: phone ? digitsOnly(phone) : '',
    email: '', // Google Places does not expose business email
    website: p.websiteUri || '',
    rating: typeof p.rating === 'number' ? p.rating : null,
    reviews: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
    lat: typeof loc.latitude === 'number' ? loc.latitude : null,
    lng: typeof loc.longitude === 'number' ? loc.longitude : null,
    mapUrl: p.googleMapsUri
      || (typeof loc.latitude === 'number' ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}` : ''),
    photoName,
  };
}

// Discover businesses for a natural query ("Houseboats in Nigeen", "Hotels in Dubai").
// Returns { configured, provider, results[] }. Never throws for "not configured".
export async function searchBusinesses(query, { limit = 12 } = {}) {
  const key = apiKey();
  if (!key) return { configured: false, provider: null, results: [] };
  const pageSize = Math.min(Math.max(1, Number(limit) || 12), 20);
  const fieldMask = [
    'places.id', 'places.displayName', 'places.formattedAddress',
    'places.internationalPhoneNumber', 'places.nationalPhoneNumber',
    'places.websiteUri', 'places.rating', 'places.userRatingCount',
    'places.location', 'places.primaryType', 'places.primaryTypeDisplayName',
    'places.types', 'places.googleMapsUri', 'places.photos',
  ].join(',');
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify({ textQuery: String(query).slice(0, 300), pageSize, languageCode: 'en' }),
  });
  if (!res.ok) {
    let msg = `Discovery provider error (${res.status})`;
    try { const e = await res.json(); if (e && e.error && e.error.message) msg = e.error.message; } catch { /* ignore */ }
    const err = new Error(msg); err.status = res.status; throw err;
  }
  const data = await res.json().catch(() => ({}));
  const places = Array.isArray(data.places) ? data.places : [];
  return { configured: true, provider: 'google_places', results: places.map((p) => normalizePlace(p, query)) };
}

// Server-side photo fetch so the API key is NEVER exposed to the browser.
export async function fetchPlacePhoto(name, { maxWidth = 640 } = {}) {
  const key = apiKey();
  const safe = String(name || '');
  if (!key || !safe.startsWith('places/')) return null;
  const w = Math.min(Math.max(80, Number(maxWidth) || 640), 1600);
  const r = await fetch(`${PLACES_BASE}/${safe}/media?maxWidthPx=${w}&key=${key}`);
  if (!r.ok) return null;
  const buffer = await r.arrayBuffer();
  return { buffer, contentType: r.headers.get('content-type') || 'image/jpeg' };
}
