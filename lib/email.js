// SafarOS — Platform transactional email via Resend (https://resend.com/docs/api-reference/emails/send-email).
//
// INACTIVE until a Super Admin saves a Resend API key + sender email in
// Super Admin → Settings → Email / Resend. Nothing in the platform depends on it:
// every caller treats "not configured" as a silent skip.
//
// SECURITY: the API key is AES-256-GCM encrypted at rest (lib/secrets.js, master key
// from CREDENTIALS_ENCRYPTION_KEY / JWT_SECRET), is never returned to any client
// (only a masked hint), and is never logged. Optional env fallback: RESEND_API_KEY.

import { decryptSecret } from '@/lib/secrets';

const SETTINGS_ID = 'email';
const RESEND_URL = 'https://api.resend.com/emails';
export const EMAIL_ADDR_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export async function loadEmailSettings(db) {
  return (await db.collection('platformSettings').findOne({ id: SETTINGS_ID }, { projection: { _id: 0 } })) || {};
}

function resolveKey(s) {
  return (s.apiKeyEnc && decryptSecret(s.apiKeyEnc)) || process.env.RESEND_API_KEY || '';
}
const senderOf = (s) => s.senderEmail || process.env.EMAIL_FROM_ADDRESS || '';

// Normalise a base URL to its origin. Returns '' for empty, null for invalid.
export function normalizeBaseUrl(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    const local = u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname);
    if ((u.protocol !== 'https:' && !local) || u.username || u.password) return null;
    return u.origin;
  } catch { return null; }
}

// Base URL used for links inside emails. Only configured values are trusted
// (never the request Host header) to prevent reset-link host poisoning.
export async function configuredBaseUrl(db) {
  const s = await loadEmailSettings(db);
  return s.appBaseUrl || normalizeBaseUrl(process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '') || '';
}

export async function isEmailConfigured(db) {
  const s = await loadEmailSettings(db);
  return !!(resolveKey(s) && senderOf(s));
}

// Safe view for the Super Admin UI — never includes the key itself.
export function emailSettingsView(s) {
  const dbKey = !!(s.apiKeyEnc && decryptSecret(s.apiKeyEnc));
  const envKey = !dbKey && !!process.env.RESEND_API_KEY;
  const senderEmail = senderOf(s);
  let status = 'not_configured';
  if ((dbKey || envKey) && senderEmail) status = s.status === 'error' ? 'error' : 'configured';
  return {
    apiKeyConfigured: dbKey || envKey,
    apiKeyMasked: dbKey ? `re_••••••••${s.apiKeyLast4 || ''}` : (envKey ? 'Set in server environment (RESEND_API_KEY)' : ''),
    apiKeySource: dbKey ? 'database' : (envKey ? 'environment' : 'none'),
    senderEmail, senderName: s.senderName || 'SafarOS', appBaseUrl: s.appBaseUrl || '',
    status, lastError: status === 'error' ? (s.lastError || '') : '', lastTestAt: s.lastTestAt || null, updatedAt: s.updatedAt || null,
  };
}

export function validateEmailSettingsInput(body = {}) {
  const out = {}; const errors = [];
  if (body.apiKey !== undefined && String(body.apiKey).trim() !== '') {
    const k = String(body.apiKey).trim();
    if (!/^re_[A-Za-z0-9_-]{8,200}$/.test(k)) errors.push('The Resend API key should start with "re_" — copy it from resend.com → API Keys.');
    else out.apiKey = k;
  }
  if (body.senderEmail !== undefined) {
    const e = String(body.senderEmail).trim().toLowerCase();
    if (e && (e.length > 200 || !EMAIL_ADDR_RE.test(e))) errors.push('Sender email is not a valid email address.');
    else out.senderEmail = e;
  }
  if (body.senderName !== undefined) out.senderName = String(body.senderName).replace(/[\r\n<>"]/g, '').trim().slice(0, 80);
  if (body.appBaseUrl !== undefined) {
    const u = normalizeBaseUrl(body.appBaseUrl);
    if (u === null) errors.push('Application base URL must be a full https:// address, e.g. https://app.yourdomain.com');
    else out.appBaseUrl = u;
  }
  return { out, errors };
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export { esc as escapeHtml };

export function emailLayout(title, bodyHtml) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">`
    + `<div style="font-weight:700;font-size:18px;color:#7c3aed;margin-bottom:16px">SafarOS</div>`
    + `<h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>${bodyHtml}`
    + `<p style="margin-top:24px;font-size:12px;color:#64748b">This is an automated security message from SafarOS.</p></div>`;
}

// Send one email. Never throws; returns { ok, skipped?, error? }. Never logs the key.
export async function sendEmail(db, { to, subject, html, text }) {
  const s = await loadEmailSettings(db);
  const apiKey = resolveKey(s); const from = senderOf(s);
  if (!apiKey || !from) return { ok: false, skipped: true, error: 'Email is not configured' };
  if (!EMAIL_ADDR_RE.test(String(to || ''))) return { ok: false, error: 'Invalid recipient' };
  const name = String(s.senderName || 'SafarOS').replace(/[\r\n<>"]/g, '') || 'SafarOS';
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST', signal: ctrl.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${name} <${from}>`, to: [to], subject: String(subject || '').slice(0, 200), html, text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: String(data?.message || `Resend returned HTTP ${res.status}`).slice(0, 300) };
    return { ok: true, id: data?.id || '' };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'Email provider timed out' : 'Could not reach the email provider' };
  } finally { clearTimeout(timer); }
}
