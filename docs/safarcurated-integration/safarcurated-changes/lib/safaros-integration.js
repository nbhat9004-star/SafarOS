// SafarCurated <- SafarOS integration helpers (server-only).
// Every SafarOS request is HMAC-SHA256 signed over `${timestamp}.${eventId}.${rawBody}` with
// SAFAROS_INTEGRATION_SECRET (same value the SafarOS Super Admin saves as "Shared Signing Secret").
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getCollection } from '@/lib/db';

const MAX_SKEW_SECONDS = 300;
export const AGENCY_COOKIE = 'safaros_agency';
const AGENCY_SESSION_SECONDS = 8 * 60 * 60;

function secret() { return process.env.SAFAROS_INTEGRATION_SECRET || ''; }
function jwtSecret() { return process.env.JWT_SECRET || ''; }

function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

let _indexed = false;
export async function ensureIntegrationIndexes() {
  if (_indexed) return;
  const events = await getCollection('safarosIntegrationEvents');
  await events.createIndex({ eventId: 1 }, { unique: true });
  await events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
  const links = await getCollection('safarosAgencyLinks');
  await links.createIndex({ safarosAgencyId: 1 }, { unique: true });
  await links.createIndex({ hostUserId: 1 });
  const listings = await getCollection('listings');
  await listings.createIndex(
    { 'source.system': 1, 'source.externalId': 1 },
    { unique: true, partialFilterExpression: { 'source.system': 'safaros' }, name: 'safaros_source_unique' },
  );
  _indexed = true;
}

// Simple per-instance rate limit for the server-to-server channel.
const _hits = new Map();
export function rateLimited(key, max = 120, windowMs = 60000) {
  const now = Date.now();
  const h = _hits.get(key) || { n: 0, t: now };
  if (now - h.t > windowMs) { h.n = 0; h.t = now; }
  h.n += 1; _hits.set(key, h);
  return h.n > max;
}

// Verify a signed SafarOS request. Returns { ok, status, error, body, eventId }.
export async function verifySignedRequest(request) {
  const s = secret();
  if (!s) return { ok: false, status: 503, error: 'Integration not configured' };
  const raw = await request.text();
  if (raw.length > 512 * 1024) return { ok: false, status: 413, error: 'Payload too large' };
  const src = request.headers.get('x-safar-source');
  const ts = request.headers.get('x-safar-timestamp') || '';
  const eventId = request.headers.get('x-safar-event-id') || '';
  const sig = request.headers.get('x-safar-signature') || '';
  if (src !== 'safaros' || !/^\d{9,12}$/.test(ts) || !/^[A-Za-z0-9:_-]{8,100}$/.test(eventId)) return { ok: false, status: 401, error: 'Invalid signature headers' };
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > MAX_SKEW_SECONDS) return { ok: false, status: 401, error: 'Request expired' };
  const expected = 'v1=' + crypto.createHmac('sha256', s).update(`${ts}.${eventId}.${raw}`).digest('hex');
  if (!safeEqual(expected, sig)) return { ok: false, status: 401, error: 'Invalid signature' };
  let body = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { return { ok: false, status: 400, error: 'Invalid JSON' }; }
  return { ok: true, body, eventId };
}

// Idempotency: first delivery claims the eventId; duplicates get the stored response.
export async function claimEvent(eventId, path) {
  const events = await getCollection('safarosIntegrationEvents');
  try {
    await events.insertOne({ eventId, path, state: 'processing', createdAt: new Date() });
    return { fresh: true };
  } catch (e) {
    if (e?.code !== 11000) throw e;
    const reclaimed = await events.findOneAndUpdate({ eventId, state: 'failed' }, { $set: { state: 'processing', retriedAt: new Date() } });
    if (reclaimed && (reclaimed.value !== undefined ? reclaimed.value : reclaimed)) return { fresh: true };
    const prev = await events.findOne({ eventId });
    if (prev?.state === 'done') return { fresh: false, response: prev.response, status: prev.status };
    return { fresh: false, inProgress: true };
  }
}
export async function completeEvent(eventId, status, response) {
  const events = await getCollection('safarosIntegrationEvents');
  if (status >= 500) { await events.updateOne({ eventId, state: 'processing' }, { $set: { state: 'failed', status } }); return; } // retry may re-claim
  await events.updateOne({ eventId }, { $set: { state: 'done', status, response } });
}

export async function getState() {
  const col = await getCollection('safarosIntegrationState');
  return (await col.findOne({ key: 'state' })) || { key: 'state', connected: false };
}
export async function setState(connected) {
  const col = await getCollection('safarosIntegrationState');
  await col.updateOne({ key: 'state' }, { $set: { key: 'state', connected, updatedAt: new Date() } }, { upsert: true });
}

// ---- SSO ticket (browser hand-off from SafarOS) ----
export function verifyTicket(ticket) {
  const s = secret();
  if (!s || typeof ticket !== 'string' || ticket.length > 4000) return null;
  const [payload, sig] = ticket.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', s).update(`sso.${payload}`).digest('base64url');
  if (!safeEqual(expected, sig)) return null;
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (data?.v !== 1 || !data.agencyId || !data.jti || !(data.exp > Math.floor(Date.now() / 1000))) return null;
  return data;
}

export function signAgencySession(t) {
  if (!jwtSecret()) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ kind: 'safaros_agency', agencyId: t.agencyId, safarosUserId: t.userId, email: t.email, name: t.name, role: t.role,
    returnUrl: /^https:\/\//.test(t.returnUrl || '') ? t.returnUrl : '' }, jwtSecret(), { expiresIn: AGENCY_SESSION_SECONDS });
}
export function getAgencySession(request) {
  const tok = request.cookies?.get?.(AGENCY_COOKIE)?.value;
  if (!tok || !jwtSecret()) return null;
  try {
    const p = jwt.verify(tok, jwtSecret());
    return p?.kind === 'safaros_agency' && p.agencyId ? p : null;
  } catch { return null; }
}
export function setAgencyCookie(res, token) {
  res.cookies.set(AGENCY_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: AGENCY_SESSION_SECONDS });
  return res;
}

export function publicListingUrl(id) {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  return base ? `${base}/property/${id}` : `/property/${id}`;
}

const list = (v, n = 40, len = 300) => (Array.isArray(v) ? v : []).map((x) => String(x || '').trim()).filter(Boolean).slice(0, n).map((x) => x.slice(0, len));

// Validate + normalise a SafarOS listing payload into SafarCurated's existing `listings` fields.
export function normaliseListing(l = {}) {
  const title = String(l.title || '').trim();
  const description = String(l.description || '').trim();
  const location = String(l.location || '').trim();
  const price = Number(l.price);
  const seats = Math.floor(Number(l.seats));
  const images = list(l.images, 12, 1000).filter((u) => /^https:\/\//i.test(u));
  if (!l.externalId || !/^[A-Za-z0-9-]{8,80}$/.test(String(l.externalId))) return { error: 'externalId is required' };
  if (title.length < 3) return { error: 'Title is required (min 3 chars)' };
  if (description.length < 10) return { error: 'Description is required (min 10 chars)' };
  if (!location) return { error: 'Location is required' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Price must be a positive number' };
  if (!images.length) return { error: 'At least one https image is required' };
  if (!Number.isFinite(seats) || seats < 1) return { error: 'Seats must be at least 1' };
  return {
    value: {
      externalId: String(l.externalId), title: title.slice(0, 160), description: description.slice(0, 4000), location: location.slice(0, 160),
      price: Math.round(price * 100) / 100, images, seats, duration: String(l.duration || '').slice(0, 60) || null,
      categoryDetails: {
        packageSource: 'safaros', currency: String(l.currency || 'INR').slice(0, 3),
        startDate: String(l.startDate || '').slice(0, 10), endDate: String(l.endDate || '').slice(0, 10),
        inclusions: list(l.inclusions), exclusions: list(l.exclusions),
        cancellationPolicy: String(l.cancellationPolicy || '').slice(0, 4000),
        itinerary: (Array.isArray(l.itinerary) ? l.itinerary : []).slice(0, 60).map((d, i) => ({ day: i + 1, title: String(d?.title || '').slice(0, 200), description: String(d?.description || '').slice(0, 2000) })),
      },
    },
  };
}
