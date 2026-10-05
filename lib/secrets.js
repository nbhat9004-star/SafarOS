// SafarOS — Secure platform provider credential store.
//
// Platform-level integration secrets (Google Places/Maps, WhatsApp Cloud,
// OpenWeather, Google OAuth, Search Console, Razorpay, …) are configured ONLY
// from the Super Admin panel over an authenticated HTTPS request, encrypted at
// rest with AES-256-GCM, and NEVER returned to any client in plaintext.
//
// GOLDEN RULES
//  - The master key comes from secure server env (CREDENTIALS_ENCRYPTION_KEY,
//    fallback JWT_SECRET). It is never persisted or exposed.
//  - Secrets are stored encrypted; API responses expose only masked metadata.
//  - Existing provider ENV VARS remain supported as a read fallback so nothing
//    that works today (e.g. GOOGLE_PLACES_API_KEY) ever breaks.
//  - This store is for PLATFORM-level credentials. Per-agency OAuth tokens are
//    intentionally NOT forced in here (kept for a future agency-scoped store).

import crypto from 'crypto';

const COLLECTION = 'platformProviderCredentials';
const ENC_PREFIX = 'v1';

// 32-byte key derived from the server-side master secret. Derivation is stable
// so previously encrypted blobs stay decryptable across restarts.
function masterKey() {
  const master = process.env.CREDENTIALS_ENCRYPTION_KEY || process.env.JWT_SECRET || '';
  if (!master) throw new Error('No encryption master key configured');
  return crypto.createHash('sha256').update(String(master)).digest(); // 32 bytes
}

// Encrypt a plaintext secret → compact "v1.<ivHex>.<tagHex>.<cipherHex>".
export function encryptSecret(plaintext) {
  const text = String(plaintext == null ? '' : plaintext);
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey(), iv);
  const ct = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}.${iv.toString('hex')}.${tag.toString('hex')}.${ct.toString('hex')}`;
}

// Decrypt a stored blob → plaintext. Returns '' on any failure (never throws to
// the caller, never leaks ciphertext in errors).
export function decryptSecret(blob) {
  try {
    const s = String(blob || '');
    if (!s.startsWith(`${ENC_PREFIX}.`)) return '';
    const [, ivHex, tagHex, ctHex] = s.split('.');
    if (!ivHex || !tagHex || !ctHex) return '';
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    return '';
  }
}

// Masked hint for display — never reveals the usable secret.
export function maskValue(value, visible = 4) {
  const s = String(value || '');
  if (!s) return '';
  if (s.length <= visible) return '••••';
  return `••••••••${s.slice(-visible)}`;
}

// ------- Extensible provider catalog (single source of truth) -------
// Adding a new provider = add one entry here; the API & UI adapt automatically.
export const PLATFORM_PROVIDER_CATALOG = [
  {
    provider: 'google_places', name: 'Google Places API (New)', category: 'Maps & Places', scope: 'platform',
    description: 'Powers Supplier Discovery (real business search by keyword + location).',
    fields: [{ key: 'apiKey', label: 'API Key', secret: true, required: true }],
    env: { apiKey: ['GOOGLE_PLACES_API_KEY', 'GOOGLE_MAPS_API_KEY'] }, testable: true,
  },
  {
    provider: 'google_maps', name: 'Google Maps / Routes', category: 'Maps & Places', scope: 'platform',
    description: 'Maps, geocoding and routing where applicable.',
    fields: [{ key: 'apiKey', label: 'API Key', secret: true, required: true }],
    env: { apiKey: ['GOOGLE_MAPS_API_KEY'] }, testable: true,
  },
  {
    provider: 'whatsapp_cloud', name: 'WhatsApp Cloud API', category: 'Messaging', scope: 'platform',
    description: 'Official WhatsApp Business Cloud API (platform-level app credentials).',
    fields: [
      { key: 'accessToken', label: 'Access Token', secret: true, required: true },
      { key: 'phoneNumberId', label: 'Phone Number ID', secret: false, required: true },
      { key: 'businessAccountId', label: 'Business Account ID', secret: false, required: false },
    ],
    env: { accessToken: ['WHATSAPP_ACCESS_TOKEN'], phoneNumberId: ['WHATSAPP_PHONE_NUMBER_ID'], businessAccountId: ['WHATSAPP_BUSINESS_ACCOUNT_ID'] },
    testable: true,
  },
  {
    provider: 'openweather', name: 'OpenWeather', category: 'Data', scope: 'platform',
    description: 'Weather data for destinations and itineraries.',
    fields: [{ key: 'apiKey', label: 'API Key', secret: true, required: true }],
    env: { apiKey: ['OPENWEATHER_API_KEY'] }, testable: true,
  },
  {
    provider: 'google_oauth', name: 'Google OAuth', category: 'Identity', scope: 'platform',
    description: 'Platform OAuth app credentials. Per-agency user tokens are stored separately (future).',
    fields: [
      { key: 'clientId', label: 'Client ID', secret: false, required: true },
      { key: 'clientSecret', label: 'Client Secret', secret: true, required: true },
    ],
    env: { clientId: ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_CLIENT_ID'], clientSecret: ['GOOGLE_OAUTH_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'] },
    testable: false,
  },
  {
    provider: 'google_search_console', name: 'Google Search Console', category: 'SEO', scope: 'platform',
    description: 'Search Console API app credentials (used with per-agency OAuth later).',
    fields: [
      { key: 'clientId', label: 'Client ID', secret: false, required: false },
      { key: 'clientSecret', label: 'Client Secret', secret: true, required: false },
      { key: 'propertyUrl', label: 'Default Property URL', secret: false, required: false },
    ],
    env: {}, testable: false,
  },
  {
    provider: 'razorpay', name: 'Razorpay', category: 'Payments', scope: 'platform',
    description: 'Payment gateway (platform/default keys).',
    fields: [
      { key: 'keyId', label: 'Key ID', secret: false, required: true },
      { key: 'keySecret', label: 'Key Secret', secret: true, required: true },
    ],
    env: { keyId: ['RAZORPAY_KEY_ID'], keySecret: ['RAZORPAY_KEY_SECRET'] },
    testable: true,
  },
];

export function getProviderDef(provider) {
  return PLATFORM_PROVIDER_CATALOG.find((p) => p.provider === provider) || null;
}

export function isValidPlatformProvider(provider) {
  return !!getProviderDef(provider);
}

// Read an env fallback for a given provider field (first non-empty wins).
function envFallback(def, fieldKey) {
  const names = (def.env && def.env[fieldKey]) || [];
  for (const n of names) { if (process.env[n]) return String(process.env[n]); }
  return '';
}

// Resolve a single credential value: stored (decrypted) first, then env fallback.
// `db` is the Mongo db handle. Never returns ciphertext; returns '' if absent.
export async function resolveProviderSecret(db, provider, fieldKey) {
  const def = getProviderDef(provider);
  if (!def) return '';
  try {
    const doc = await db.collection(COLLECTION).findOne({ provider });
    if (doc && doc.enabled !== false) {
      const fieldDef = def.fields.find((f) => f.key === fieldKey);
      if (fieldDef && fieldDef.secret) {
        const blob = doc.secrets && doc.secrets[fieldKey] && doc.secrets[fieldKey].enc;
        const val = blob ? decryptSecret(blob) : '';
        if (val) return val;
      } else if (doc.fields && doc.fields[fieldKey]) {
        return String(doc.fields[fieldKey]);
      }
    }
  } catch { /* fall through to env */ }
  return envFallback(def, fieldKey);
}

// Resolve ALL fields for a provider (used by Test Connection). Includes a
// `_source` map describing where each value came from (stored | env | none).
export async function resolveProviderConfig(db, provider) {
  const def = getProviderDef(provider);
  if (!def) return { values: {}, _source: {} };
  const values = {}; const source = {};
  let doc = null;
  try { doc = await db.collection(COLLECTION).findOne({ provider }); } catch { /* ignore */ }
  for (const f of def.fields) {
    let v = '';
    let src = 'none';
    if (doc && doc.enabled !== false) {
      if (f.secret) {
        const blob = doc.secrets && doc.secrets[f.key] && doc.secrets[f.key].enc;
        v = blob ? decryptSecret(blob) : '';
      } else {
        v = (doc.fields && doc.fields[f.key]) ? String(doc.fields[f.key]) : '';
      }
      if (v) src = 'stored';
    }
    if (!v) { const e = envFallback(def, f.key); if (e) { v = e; src = 'env'; } }
    values[f.key] = v; source[f.key] = src;
  }
  return { values, _source: source };
}

// Build a SAFE view of a provider for API responses (NEVER includes plaintext
// secrets — only masked hints, non-secret identifiers, status + metadata).
export function buildProviderView(def, doc) {
  const d = doc || {};
  const fieldViews = def.fields.map((f) => {
    let hasEnv = false;
    if (def.env && def.env[f.key]) hasEnv = (def.env[f.key] || []).some((n) => !!process.env[n]);
    let masked = '';
    let hasStored = false;
    let value = '';
    if (f.secret) {
      const meta = d.secrets && d.secrets[f.key];
      hasStored = !!(meta && meta.enc);
      masked = meta && meta.last4 ? `••••••••${meta.last4}` : '';
    } else {
      value = (d.fields && d.fields[f.key]) ? String(d.fields[f.key]) : '';
      hasStored = !!value;
    }
    return { key: f.key, label: f.label, secret: !!f.secret, required: !!f.required, hasStored, hasEnv, masked, value };
  });

  // required satisfied if every required field has a stored OR env value
  const requiredOk = def.fields.filter((f) => f.required).every((f) => {
    const fv = fieldViews.find((x) => x.key === f.key);
    return fv && (fv.hasStored || fv.hasEnv);
  });
  const anyStored = fieldViews.some((fv) => fv.hasStored);
  const anyEnv = fieldViews.some((fv) => fv.hasEnv);
  const enabled = d.enabled !== false; // default enabled when a doc exists
  let status = 'not_connected';
  if (requiredOk && (anyStored || anyEnv)) status = enabled ? 'connected' : 'disabled';
  const source = anyStored ? 'stored' : (anyEnv ? 'env' : 'none');

  return {
    provider: def.provider, name: def.name, category: def.category, scope: def.scope || 'platform',
    description: def.description || '', testable: !!def.testable,
    fields: fieldViews, status, enabled, source,
    updatedAt: d.updatedAt || null, updatedBy: d.updatedBy || '',
    lastTestedAt: d.lastTestedAt || null, lastTestStatus: d.lastTestStatus || '', lastTestMessage: d.lastTestMessage || '',
  };
}

export const PLATFORM_CRED_COLLECTION = COLLECTION;
