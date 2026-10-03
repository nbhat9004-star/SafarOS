// SafarOS — Integration Manager foundation (Phase 5.10).
// Single source of truth for integration categories + the provider catalog, plus
// credential-security helpers. No live providers are activated here — this is the
// reusable architecture real providers plug into later.
//
// SECURITY: secret values are NEVER persisted in plaintext. For provider API keys
// entered in the UI we store only a masked hint (last 4 chars); the usable secret
// is expected to live in secure server-side env/vault later. For SafarOS-owned
// secrets (webhook signing secrets, developer API keys) we store a SHA-256 hash +
// last 4 and reveal the full value exactly once at creation.

import crypto from 'crypto';

export const INTEGRATION_CATEGORIES = [
  { id: 'ai',             label: 'AI',                   description: 'Language model providers powering the AI Copilot.' },
  { id: 'payments',       label: 'Payments',             description: 'Payment gateways for collecting customer payments.' },
  { id: 'communications', label: 'Communications',       description: 'Messaging channels such as WhatsApp Business.' },
  { id: 'email',          label: 'Email',                description: 'Transactional / business email providers.' },
  { id: 'sms',            label: 'SMS',                  description: 'SMS delivery providers.' },
  { id: 'google',         label: 'Google Services',      description: 'Google OAuth, Maps/Places, Search Console, Analytics.' },
  { id: 'calendar',       label: 'Calendar',             description: 'Calendar sync for bookings, reminders and itineraries.' },
  { id: 'webhooks',       label: 'Webhooks',             description: 'Incoming and outgoing event webhooks.' },
  { id: 'api',            label: 'API / Developer',      description: 'Agency API keys and developer access.' },
];

// Field types: 'text' (safe to store), 'secret' (never stored in plaintext).
export const INTEGRATION_CATALOG = [
  // ---- AI (managed via secure server-side env; surfaced read-only) ----
  { provider: 'anthropic', name: 'Anthropic Claude', category: 'ai', managed: 'env',
    description: 'Claude models for the AI Copilot.', fields: [] },
  { provider: 'openai', name: 'OpenAI', category: 'ai', managed: 'env',
    description: 'GPT models for the AI Copilot.', fields: [] },
  { provider: 'gemini', name: 'Google Gemini', category: 'ai', managed: 'env',
    description: 'Gemini models for the AI Copilot.', fields: [] },

  // ---- Payments ----
  { provider: 'razorpay', name: 'Razorpay', category: 'payments',
    description: 'Collect payments via Razorpay (India).',
    fields: [
      { key: 'keyId', label: 'Key ID', type: 'text', required: true, placeholder: 'rzp_live_...' },
      { key: 'keySecret', label: 'Key Secret', type: 'secret', required: true },
    ] },
  { provider: 'stripe', name: 'Stripe', category: 'payments',
    description: 'Collect card payments globally via Stripe.',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', required: true, placeholder: 'pk_live_...' },
      { key: 'secretKey', label: 'Secret Key', type: 'secret', required: true },
    ] },

  // ---- Communications ----
  { provider: 'whatsapp_business', name: 'WhatsApp Business API', category: 'communications',
    description: 'Official WhatsApp Business Cloud API (no unofficial automation).',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'businessAccountId', label: 'WABA ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'secret', required: true },
    ] },

  // ---- Email ----
  { provider: 'sendgrid', name: 'SendGrid', category: 'email',
    description: 'Transactional email via SendGrid.',
    fields: [
      { key: 'fromEmail', label: 'From Email', type: 'text', required: true, placeholder: 'hello@agency.com' },
      { key: 'apiKey', label: 'API Key', type: 'secret', required: true },
    ] },
  { provider: 'resend', name: 'Resend', category: 'email',
    description: 'Transactional email via Resend.',
    fields: [
      { key: 'fromEmail', label: 'From Email', type: 'text', required: true, placeholder: 'hello@agency.com' },
      { key: 'apiKey', label: 'API Key', type: 'secret', required: true },
    ] },
  { provider: 'amazon_ses', name: 'Amazon SES', category: 'email',
    description: 'Transactional email via Amazon SES.',
    fields: [
      { key: 'region', label: 'AWS Region', type: 'text', required: true, placeholder: 'ap-south-1' },
      { key: 'fromEmail', label: 'From Email', type: 'text', required: true },
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'secret', required: true },
    ] },

  // ---- SMS ----
  { provider: 'twilio', name: 'Twilio', category: 'sms',
    description: 'SMS delivery via Twilio.',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'fromNumber', label: 'From Number', type: 'text', required: true, placeholder: '+1...' },
      { key: 'authToken', label: 'Auth Token', type: 'secret', required: true },
    ] },

  // ---- Google Services ----
  { provider: 'google_oauth', name: 'Google OAuth', category: 'google',
    description: 'Sign-in and account authorization via Google.',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'secret', required: true },
    ] },
  { provider: 'google_maps', name: 'Google Maps / Places', category: 'google',
    description: 'Maps, Places and geocoding.',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'secret', required: true }] },
  { provider: 'google_search_console', name: 'Google Search Console', category: 'google',
    description: 'Search performance data (OAuth-based).',
    fields: [{ key: 'propertyUrl', label: 'Property URL', type: 'text', required: true, placeholder: 'https://agency.com' }] },
  { provider: 'google_analytics', name: 'Google Analytics', category: 'google',
    description: 'Website analytics (GA4).',
    fields: [
      { key: 'measurementId', label: 'Measurement ID', type: 'text', required: true, placeholder: 'G-XXXXXXX' },
      { key: 'propertyId', label: 'Property ID', type: 'text', required: false },
    ] },

  // ---- Calendar ----
  { provider: 'google_calendar', name: 'Google Calendar', category: 'calendar',
    description: 'Create booking, follow-up and itinerary events (OAuth-based).',
    fields: [{ key: 'calendarId', label: 'Calendar ID', type: 'text', required: false, placeholder: 'primary' }] },
];

export const CATALOG_BY_PROVIDER = Object.fromEntries(INTEGRATION_CATALOG.map((p) => [p.provider, p]));

// Statuses an integration can be in.
export const INTEGRATION_STATUSES = ['not_connected', 'connected', 'disabled', 'error', 'configuration_required'];

// Lightweight, extensible webhook event catalog (NOT a full event bus).
export const WEBHOOK_EVENTS = [
  'booking.created', 'booking.updated', 'payment.completed',
  'quotation.approved', 'lead.created', 'customer.created',
];
export const WEBHOOK_DIRECTIONS = ['incoming', 'outgoing'];

// Developer API scopes (basic concept only).
export const API_SCOPES = [
  'read:crm', 'write:crm', 'read:bookings', 'write:bookings', 'read:finance', 'read:analytics',
];

// ---- credential-security helpers ----
export function last4(value) {
  const s = String(value || '');
  return s.length <= 4 ? s : s.slice(-4);
}
export function maskSecret(value) {
  const s = String(value || '');
  if (!s) return '';
  return `••••••••••••${last4(s)}`;
}
export function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}
export function genToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}
export function isValidProvider(p) { return Boolean(CATALOG_BY_PROVIDER[p]); }
