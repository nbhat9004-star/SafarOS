// SafarOS — privacy-conscious agency usage tracking.
// Stores HOURLY AGGREGATES only: one document per agency + user + module + hour, with a counter.
// Repeated calls/re-renders within the same hour only increment a counter (no duplicate events).
// Never stores request bodies, message content, passwords, tokens or payment data.

const MODULE_ALIASES = {
  me: 'dashboard', dashboard: 'dashboard', login: 'login',
  leads: 'leads', clients: 'clients', followups: 'follow-ups', 'follow-ups': 'follow-ups', tasks: 'tasks',
  quotations: 'quotations', bookings: 'bookings', packages: 'packages', itineraries: 'itineraries',
  suppliers: 'suppliers', discovery: 'suppliers', vehicles: 'fleet', drivers: 'fleet', fleet: 'fleet',
  payments: 'finance', invoices: 'finance', expenses: 'finance', finance: 'finance', receivables: 'finance', payables: 'finance',
  website: 'website', copilot: 'ai', ai: 'ai', documents: 'documents', import: 'import', export: 'export',
  integrations: 'integrations', team: 'team', members: 'team', agency: 'settings', settings: 'settings', subscription: 'subscription',
  analytics: 'analytics', marketing: 'marketing', campaigns: 'marketing', portal: 'portal',
};
const SKIP = new Set(['auth', 'platform', 'public', 'health', 'early-access', 'search']);

export function moduleForPath(path) {
  const seg = String(path || '').split('/').filter(Boolean)[0] || '';
  if (!seg || SKIP.has(seg) || !/^[a-z0-9_-]{1,40}$/.test(seg)) return '';
  return MODULE_ALIASES[seg] || seg;
}

// Activity types in the existing `activities` log (e.g. 'lead_created') → module.
export function moduleForActivityType(type) {
  const first = String(type || '').split(/[_.]/)[0];
  const map = { lead: 'leads', client: 'clients', followup: 'follow-ups', task: 'tasks', quotation: 'quotations', booking: 'bookings', package: 'packages', itinerary: 'itineraries', supplier: 'suppliers', payment: 'finance', invoice: 'finance', expense: 'finance', vehicle: 'fleet', driver: 'fleet', document: 'documents', website: 'website' };
  return map[first] || (first ? first.slice(0, 30) : 'other');
}

export async function recordUsage(db, { agencyId, userId, module, action = 'use' }) {
  if (!db || !agencyId || !module) return;
  try {
    const now = new Date(); const iso = now.toISOString();
    const hour = iso.slice(0, 13); // YYYY-MM-DDTHH (UTC)
    await db.collection('usageEvents').updateOne(
      { agencyId: String(agencyId), userId: String(userId || ''), module, hour },
      { $inc: { count: 1, [`actions.${action === 'login' ? 'login' : action}`]: 1 }, $set: { lastAt: iso }, $setOnInsert: { day: iso.slice(0, 10), hourOfDay: now.getUTCHours(), createdAt: iso } },
      { upsert: true },
    );
  } catch (e) { console.warn('[safaros] usage event skipped:', e.message); }
}
