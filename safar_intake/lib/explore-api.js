// Adapter over existing /api/circle/* endpoints for the Explore module.
// Reuses: circle_journeys, circle_members, notifications, admin flow.
// Falls back gracefully to mock data when API is unreachable so UI never breaks.

const THEME_TO_UI = {
  adventure: { type: 'TREK', slug: 'treks' },
  road_trip: { type: 'ROAD TRIP', slug: 'road' },
  weekend_escape: { type: 'WEEKEND', slug: 'weekend' },
  backpacking: { type: 'BACKPACKING', slug: 'backpacking' },
  bike_expedition: { type: 'BIKE', slug: 'bike' },
  luxury: { type: 'LUXURY', slug: 'luxury' },
  spiritual: { type: 'PILGRIMAGE', slug: 'pilgrimage' },
  photography: { type: 'ADVENTURE', slug: 'photography' },
  family: { type: 'WEEKEND', slug: 'family' },
  food: { type: 'ADVENTURE', slug: 'food' },
};

const SLUG_TO_THEME = {
  trekking: 'adventure', treks: 'adventure', adventure: 'adventure',
  road: 'road_trip', 'road trips': 'road_trip',
  weekend: 'weekend_escape',
  backpacking: 'backpacking',
  bike: 'bike_expedition',
  luxury: 'luxury',
  pilgrimage: 'spiritual',
  camping: 'adventure', snow: 'adventure',
  photography: 'photography',
  women: null, men: null, family: 'family',
  all: null, upcoming: null,
};

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? '' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function journeyToTrip(j) {
  const start = fmtDate(j.startDate);
  const end = fmtDate(j.endDate);
  const themeInfo = THEME_TO_UI[j.theme] || { type: 'ADVENTURE', slug: 'treks' };
  const mode = j.hostMode || (j.services?.length ? 'safar' : 'self');
  return {
    id: j.id,
    slug: j.slug,
    title: j.name,
    type: themeInfo.type,
    typeSlug: themeInfo.slug,
    location: [j.destination?.name, j.destination?.state].filter(Boolean).join(', ') || j.destination?.name || 'India',
    destination: [j.destination?.name, j.destination?.state].filter(Boolean).join(', ') || j.destination?.name || 'India',
    dates: start && end ? `${start} \u2013 ${end}` : (start || 'Dates TBD'),
    dateRange: start && end ? `${start} \u2013 ${end}` : (start || 'Dates TBD'),
    host: j.curatorName || 'Host',
    hostName: j.curatorName || 'Host',
    hostAvatar: j.curatorAvatar || `https://i.pravatar.cc/60?u=${encodeURIComponent(j.curatorId || j.id)}`,
    verified: mode !== 'self',
    hostVerified: mode !== 'self',
    joined: j.membersAccepted || 0,
    max: j.maxMembers || 6,
    capacity: j.maxMembers || 6,
    difficulty: j.difficulty || 'moderate',
    price: j.budget || 0,
    free: !j.budget,
    mode,
    cover: j.cover || 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80',
    description: j.description || '',
    route: Array.isArray(j.route) ? j.route : [],
    verifiedServices: (j.services || []).map(s => s.category || s.title).filter(Boolean),
    visibility: j.visibility || 'public',
    raw: j,
  };
}

async function jf(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export async function fetchTrips({ theme, categorySlug, q, limit = 30 } = {}) {
  const qp = new URLSearchParams();
  const t = theme || (categorySlug ? SLUG_TO_THEME[categorySlug] : null);
  if (t) qp.set('theme', t);
  if (q) qp.set('q', q);
  qp.set('limit', String(limit));
  const data = await jf(`/api/circle/journeys?${qp.toString()}`);
  return (data.journeys || []).map(journeyToTrip);
}

export async function fetchMyTrips() {
  const data = await jf('/api/circle/journeys/mine');
  return (data.journeys || []).map(journeyToTrip);
}

export async function fetchTrip(id) {
  const data = await jf(`/api/circle/journeys/id/${encodeURIComponent(id)}`);
  return data.journey ? journeyToTrip(data.journey) : null;
}

// Phase 2: live member summary (accepted seats, capacity) + fulfillment fields.
export async function fetchTripMembers(idOrSlug) {
  try {
    return await jf(`/api/circle/journeys/${encodeURIComponent(idOrSlug)}/members`);
  } catch (e) { return null; }
}

export async function createTrip(payload) {
  const data = await jf('/api/circle/journeys', { method: 'POST', body: JSON.stringify(payload) });
  return data.journey;
}

export async function requestToJoin(id, { seats = 1, message = '' } = {}) {
  return jf(`/api/circle/journeys/${encodeURIComponent(id)}/join`, {
    method: 'POST',
    body: JSON.stringify({ seats, message }),
  });
}

export async function fetchReceivedRequests() {
  const data = await jf('/api/circle/studio/requests');
  return data.requests || data.members || [];
}

export async function decideRequest(journeyId, memberId, action) {
  return jf(`/api/circle/journeys/${encodeURIComponent(journeyId)}/members/${encodeURIComponent(memberId)}/${action}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ---- Phase-4 community fetchers ----
export async function fetchNotifications() {
  const d = await jf('/api/circle/notifications');
  return { items: d.items || [], unread: d.unread || 0 };
}
export async function markNotifRead(id) {
  return jf(`/api/circle/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', body: '{}' });
}
export async function fetchRewards() {
  const d = await jf('/api/circle/rewards');
  return { cards: d.cards || [], unlocked: d.unlocked || 0 };
}
export async function fetchHighlights(tab = 'latest') {
  const d = await jf(`/api/circle/highlights?tab=${encodeURIComponent(tab)}`);
  return d.items || [];
}
export async function likeHighlight(id) {
  return jf(`/api/circle/highlights/${encodeURIComponent(id)}/like`, { method: 'POST', body: '{}' });
}
export async function fetchLeaderboard() {
  const d = await jf('/api/circle/leaderboard');
  return d.users || [];
}

// Recent real "joined a trip" activity for the Explore live-activity section.
export async function fetchRecentJoins({ limit = 6 } = {}) {
  const d = await jf(`/api/circle/recent-joins?limit=${limit}`);
  return d.items || [];
}

export { SLUG_TO_THEME };
