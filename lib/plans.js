// SafarOS — SaaS subscription plan catalog & entitlement helpers (Phase 5.9).
// This is the SINGLE source of truth for plans, features and limits so that no
// plan logic has to be hard-coded throughout the application. Enforcement is a
// FOUNDATION only in this phase: modules can ask featureEnabled()/getLimit()
// but nothing is hard-disabled yet.

// Feature entitlement keys (map to SafarOS modules).
export const FEATURE_KEYS = [
  'crm', 'quotations', 'packages', 'fleet', 'finance', 'payments',
  'communications', 'aiCopilot', 'customerPortal', 'websiteBuilder', 'analytics',
];

// Limit keys. Use -1 for "unlimited".
export const LIMIT_KEYS = [
  'teamMembers', 'clients', 'leads', 'bookings', 'quotations',
  'packages', 'storageMb', 'aiCredits', 'websitePages',
];

const ALL_FEATURES_ON = FEATURE_KEYS.reduce((acc, k) => { acc[k] = true; return acc; }, {});

// Billing intervals supported in this phase.
export const BILLING_INTERVALS = ['monthly', 'yearly'];

// Subscription lifecycle statuses.
export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'past_due', 'cancelled', 'suspended', 'expired'];

// SaaS invoice statuses (namespaced away from customer/finance invoices).
export const SAAS_INVOICE_STATUSES = ['draft', 'issued', 'paid', 'failed', 'cancelled', 'refunded'];

export const DEFAULT_CURRENCY = 'INR';

// The reusable plan catalog. Prices are per billing interval shown.
export const PLAN_CATALOG = [
  {
    id: 'trial',
    name: 'Trial',
    slug: 'trial',
    description: 'Full access to evaluate SafarOS for a limited time.',
    price: 0,
    priceYearly: 0,
    currency: DEFAULT_CURRENCY,
    billingInterval: 'monthly',
    trialDays: 14,
    status: 'active',
    // Trial unlocks everything so new / development agencies stay fully usable.
    features: { ...ALL_FEATURES_ON },
    limits: {
      teamMembers: 3, clients: 100, leads: 200, bookings: 50, quotations: 50,
      packages: 25, storageMb: 500, aiCredits: 100, websitePages: 5,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Essentials for a small travel agency getting started.',
    price: 2900,
    priceYearly: 29000,
    currency: DEFAULT_CURRENCY,
    billingInterval: 'monthly',
    trialDays: 0,
    status: 'active',
    features: {
      crm: true, quotations: true, packages: true, fleet: false, finance: true,
      payments: false, communications: true, aiCopilot: false, customerPortal: false,
      websiteBuilder: true, analytics: false,
    },
    limits: {
      teamMembers: 5, clients: 1000, leads: 2000, bookings: 500, quotations: 500,
      packages: 100, storageMb: 2048, aiCredits: 0, websitePages: 10,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    slug: 'professional',
    description: 'Scaling agencies that need automation, finance and analytics.',
    price: 7900,
    priceYearly: 79000,
    currency: DEFAULT_CURRENCY,
    billingInterval: 'monthly',
    trialDays: 0,
    status: 'active',
    features: {
      crm: true, quotations: true, packages: true, fleet: true, finance: true,
      payments: true, communications: true, aiCopilot: true, customerPortal: true,
      websiteBuilder: true, analytics: true,
    },
    limits: {
      teamMembers: 25, clients: 10000, leads: 25000, bookings: 5000, quotations: 5000,
      packages: 1000, storageMb: 20480, aiCredits: 1000, websitePages: 50,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Unlimited scale with every SafarOS capability unlocked.',
    price: 19900,
    priceYearly: 199000,
    currency: DEFAULT_CURRENCY,
    billingInterval: 'monthly',
    trialDays: 0,
    status: 'active',
    features: { ...ALL_FEATURES_ON },
    limits: {
      teamMembers: -1, clients: -1, leads: -1, bookings: -1, quotations: -1,
      packages: -1, storageMb: -1, aiCredits: -1, websitePages: -1,
    },
  },
];

const BY_SLUG = Object.fromEntries(PLAN_CATALOG.map((p) => [p.slug, p]));

export function listPlans() {
  return PLAN_CATALOG.map((p) => ({ ...p, features: { ...p.features }, limits: { ...p.limits } }));
}

export function getPlan(slug) {
  const p = BY_SLUG[String(slug || '').toLowerCase()];
  if (!p) return null;
  return { ...p, features: { ...p.features }, limits: { ...p.limits } };
}

export function isValidPlan(slug) {
  return Boolean(BY_SLUG[String(slug || '').toLowerCase()]);
}

// Resolve the price for a plan + interval.
export function priceFor(plan, interval = 'monthly') {
  if (!plan) return 0;
  return interval === 'yearly' ? Number(plan.priceYearly || 0) : Number(plan.price || 0);
}

// --- Entitlement foundation: plan -> feature/limit checks ---
export function featureEnabled(plan, feature) {
  if (!plan || !plan.features) return false;
  return Boolean(plan.features[feature]);
}

export function getLimit(plan, key) {
  if (!plan || !plan.limits || plan.limits[key] === undefined) return 0;
  return plan.limits[key];
}

// Given a plan, a limit key and the current real usage count, decide whether
// one more unit is allowed. Returns a structured result future modules can use.
export function checkLimit(plan, key, currentUsage) {
  const limit = getLimit(plan, key);
  const usage = Number(currentUsage) || 0;
  if (limit === -1) return { key, limit, usage, unlimited: true, allowed: true, remaining: -1 };
  const remaining = Math.max(0, limit - usage);
  return { key, limit, usage, unlimited: false, allowed: usage < limit, remaining };
}
