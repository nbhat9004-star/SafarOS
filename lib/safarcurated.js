// SafarOS <-> SafarCurated integration (server-only).
// Protocol: HMAC-SHA256 over `${timestamp}.${eventId}.${rawBody}` using the shared
// secret configured by Super Admin (stored AES-GCM encrypted via lib/secrets.js).
// Headers: X-Safar-Source, X-Safar-Timestamp, X-Safar-Event-Id, X-Safar-Signature (v1=hex).
// The same eventId is re-used on every retry so the receiver can de-duplicate.
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { resolveProviderConfig } from '@/lib/secrets';

export const SC_PROVIDER = 'safarcurated';
const STATE_KEY = 'safarcurated_integration';
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 10000;

export function signPayload(secret, timestamp, eventId, rawBody) {
  return 'v1=' + crypto.createHmac('sha256', secret).update(`${timestamp}.${eventId}.${rawBody}`).digest('hex');
}

// ---- Global connection state (Super Admin controlled) ----
export async function getIntegrationState(db) {
  const doc = await db.collection('platformSettings').findOne({ key: STATE_KEY }, { projection: { _id: 0 } });
  return doc || { key: STATE_KEY, connected: false };
}

export async function setIntegrationState(db, patch) {
  await db.collection('platformSettings').updateOne(
    { key: STATE_KEY },
    { $set: { key: STATE_KEY, ...patch, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );
  return getIntegrationState(db);
}

export async function getScConfig(db) {
  const { values } = await resolveProviderConfig(db, SC_PROVIDER);
  const baseUrl = String(values.baseUrl || '').trim().replace(/\/+$/, '');
  const secret = String(values.sharedSecret || '');
  return { baseUrl, secret, configured: Boolean(baseUrl && secret && /^https?:\/\//.test(baseUrl)) };
}

// Returns { ok, reason } — every outbound call / publish action must pass this gate.
export async function integrationGate(db, { ignoreConnected = false } = {}) {
  const cfg = await getScConfig(db);
  if (!cfg.configured) return { ok: false, reason: 'SafarCurated credentials are not configured by Super Admin.', cfg };
  if (!ignoreConnected) {
    const state = await getIntegrationState(db);
    if (!state.connected) return { ok: false, reason: 'SafarCurated integration is disconnected by Super Admin.', cfg };
  }
  return { ok: true, cfg };
}

async function logSync(db, entry) {
  try {
    await db.collection('marketplaceSyncLogs').insertOne({ id: uuidv4(), at: new Date().toISOString(), ...entry });
  } catch { /* logging must never break the flow */ }
}

// Signed server-to-server call with retries (network / 5xx / 429 only) and a stable eventId.
export async function scRequest(db, apiPath, body, { agencyId = '', action = '', refId = '', eventId = uuidv4(), ignoreConnected = false } = {}) {
  const gate = await integrationGate(db, { ignoreConnected });
  if (!gate.ok) return { ok: false, status: 0, error: gate.reason, blocked: true };
  const { baseUrl, secret } = gate.cfg;
  const raw = JSON.stringify(body || {});
  let last = { ok: false, status: 0, error: 'Request not sent' };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ts = String(Math.floor(Date.now() / 1000));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(`${baseUrl}/api/integrations/safaros${apiPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Safar-Source': 'safaros',
          'X-Safar-Timestamp': ts,
          'X-Safar-Event-Id': eventId,
          'X-Safar-Signature': signPayload(secret, ts, eventId, raw),
        },
        body: raw,
        signal: ctrl.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      let data = {};
      try { data = await r.json(); } catch { /* non-json */ }
      if (r.ok) {
        last = { ok: true, status: r.status, data };
        break;
      }
      last = { ok: false, status: r.status, error: data?.error || `SafarCurated returned HTTP ${r.status}`, data };
      if (r.status < 500 && r.status !== 429) break; // client errors are not retried
    } catch (e) {
      clearTimeout(timer);
      last = { ok: false, status: 0, error: e?.name === 'AbortError' ? 'SafarCurated did not respond in time' : 'Could not reach SafarCurated' };
    }
    if (attempt < MAX_ATTEMPTS) await new Promise((res) => setTimeout(res, 400 * attempt * attempt));
  }
  await logSync(db, { agencyId, action, refId, eventId, ok: last.ok, status: last.status, error: last.ok ? '' : String(last.error || '').slice(0, 500) });
  if (last.ok) await setIntegrationState(db, { lastSuccessAt: new Date().toISOString() });
  return last;
}

// ---- Marketplace package helpers ----
const PUB_STATUSES = ['draft', 'pending', 'approved', 'rejected', 'unpublished', 'error'];
export function normalizePubStatus(s) { return PUB_STATUSES.includes(s) ? s : 'draft'; }

const strList = (v, maxItems = 40, maxLen = 300) => (Array.isArray(v) ? v : String(v || '').split('\n'))
  .map((x) => String(x || '').trim()).filter(Boolean).slice(0, maxItems).map((x) => x.slice(0, maxLen));

export function normalizeMarketplaceFields(m = {}) {
  const price = Number(m.price);
  const seats = Math.floor(Number(m.seats));
  return {
    price: Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : 0,
    currency: String(m.currency || 'INR').toUpperCase().slice(0, 3),
    images: strList(m.images, 12, 1000).filter((u) => /^https:\/\//i.test(u)),
    inclusions: strList(m.inclusions),
    exclusions: strList(m.exclusions),
    cancellationPolicy: String(m.cancellationPolicy || '').slice(0, 4000),
    seats: Number.isFinite(seats) && seats > 0 ? seats : 0,
    itinerary: (Array.isArray(m.itinerary) ? m.itinerary : []).slice(0, 60).map((d, i) => ({
      day: i + 1, title: String(d?.title || '').slice(0, 200), description: String(d?.description || '').slice(0, 2000),
    })).filter((d) => d.title || d.description),
  };
}

// Returns a list of human-readable problems; empty list = ready to publish.
export function validateForMarketplace(pkg) {
  const m = pkg?.marketplace || {};
  const issues = [];
  if (!pkg?.name || pkg.name.trim().length < 3) issues.push('Title must be at least 3 characters');
  if (!pkg?.description || pkg.description.trim().length < 10) issues.push('Description must be at least 10 characters');
  if (!pkg?.destination) issues.push('Destination is required');
  if (!(m.price > 0)) issues.push('Price must be greater than 0');
  if (!(m.seats > 0)) issues.push('Available seats must be at least 1');
  if (!m.images?.length) issues.push('At least one image (https URL) is required');
  if (!pkg?.nights && !(pkg?.startDate && pkg?.endDate)) issues.push('Duration (nights) or travel dates are required');
  if (!m.cancellationPolicy) issues.push('Cancellation policy is required');
  return issues;
}

// Map a SafarOS marketplace package onto SafarCurated's existing `listings` schema (category 'tour').
// Contains ONLY public package content — never customer, quotation or supplier-cost data.
export function mapPackageToListing(pkg, agency, itineraryDays = null) {
  const m = pkg.marketplace || {};
  const nights = Number(pkg.nights) || 0;
  const days = itineraryDays && itineraryDays.length
    ? itineraryDays.map((d, i) => ({ day: i + 1, title: String(d.title || '').slice(0, 200), description: String(d.description || d.notes || '').slice(0, 2000) }))
    : (m.itinerary || []);
  return {
    externalId: pkg.id,
    title: pkg.name,
    description: pkg.description,
    location: pkg.destination,
    price: m.price,
    currency: m.currency || 'INR',
    images: m.images || [],
    duration: nights ? `${nights + 1} days / ${nights} nights` : '',
    seats: m.seats,
    startDate: pkg.startDate || '',
    endDate: pkg.endDate || '',
    inclusions: m.inclusions || [],
    exclusions: m.exclusions || [],
    cancellationPolicy: m.cancellationPolicy || '',
    itinerary: days,
    agency: { id: agency?.id || pkg.agencyId, name: agency?.name || '', slug: agency?.slug || '' },
  };
}
