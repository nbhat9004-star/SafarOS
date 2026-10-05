// SafarOS — Platform Intelligence foundations (Combined Prompt 2).
// Pure, reusable helpers: Kashmir travel rules, document vault metadata,
// and custom-field/module validation. No fake data, no external calls.
import { v4 as uuidv4 } from 'uuid';

const s = (v, max = 300) => String(v == null ? '' : v).slice(0, max);
const n = (v, def = 0) => { const x = Number(v); return Number.isFinite(x) ? x : def; };
const round2 = (x) => Math.round((Number(x) + Number.EPSILON) * 100) / 100;

// ---------------- Kashmir Travel Intelligence ----------------
export const RULE_SERVICE_CATEGORIES = [
  'transport', 'local_transport', 'hotel', 'meal_plan', 'houseboat', 'shikara',
  'pony', 'guide', 'activity', 'permit', 'other',
];
export const RULE_SEASONS = ['all', 'summer', 'winter', 'spring', 'autumn', 'peak'];
export const RULE_CONDITIONS = ['any', 'normal', 'snow', 'heavy_snow', 'rain', 'peak_rush'];
export const RULE_SURCHARGE_TYPES = ['flat', 'percent'];

// Validate/normalize a travel rule. `partial` for PUT. Returns {value}|{error}.
export function buildTravelRule(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = s(body.name, 160).trim();
    if (!name) return { error: 'Rule name is required' };
    out.name = name;
  }
  if (!partial || body.serviceCategory !== undefined) {
    const c = s(body.serviceCategory).toLowerCase();
    if (!RULE_SERVICE_CATEGORIES.includes(c)) return { error: 'Invalid service category' };
    out.serviceCategory = c;
  }
  if (!partial || body.season !== undefined) {
    const se = s(body.season).toLowerCase() || 'all';
    if (!RULE_SEASONS.includes(se)) return { error: 'Invalid season' };
    out.season = se;
  }
  if (!partial || body.condition !== undefined) {
    const co = s(body.condition).toLowerCase() || 'any';
    if (!RULE_CONDITIONS.includes(co)) return { error: 'Invalid operational condition' };
    out.condition = co;
  }
  if (!partial || body.surchargeType !== undefined) {
    const st = s(body.surchargeType).toLowerCase() || 'flat';
    if (!RULE_SURCHARGE_TYPES.includes(st)) return { error: 'Invalid surcharge type' };
    out.surchargeType = st;
  }
  if (!partial || body.vehicleType !== undefined) out.vehicleType = s(body.vehicleType, 60);
  if (!partial || body.destination !== undefined) out.destination = s(body.destination, 120);
  if (!partial || body.supplierId !== undefined) out.supplierId = s(body.supplierId, 80);
  if (!partial || body.supplierName !== undefined) out.supplierName = s(body.supplierName, 160);
  if (!partial || body.surchargeValue !== undefined) out.surchargeValue = Math.max(0, round2(n(body.surchargeValue, 0)));
  if (!partial || body.cost !== undefined) out.cost = Math.max(0, round2(n(body.cost, 0)));
  if (!partial || body.price !== undefined) out.price = Math.max(0, round2(n(body.price, 0)));
  if (!partial || body.nightHaltRate !== undefined) out.nightHaltRate = Math.max(0, round2(n(body.nightHaltRate, 0)));
  if (!partial || body.effectiveFrom !== undefined) out.effectiveFrom = s(body.effectiveFrom, 40);
  if (!partial || body.effectiveTo !== undefined) out.effectiveTo = s(body.effectiveTo, 40);
  if (!partial || body.notes !== undefined) out.notes = s(body.notes, 2000);
  if (!partial || body.active !== undefined) out.active = body.active === undefined ? true : !!body.active;
  if (out.effectiveFrom && out.effectiveTo && out.effectiveFrom > out.effectiveTo) {
    return { error: 'Effective end date must be on or after the start date' };
  }
  return { value: out };
}

// Does a rule apply to the given context? Loose matching: empty/any = wildcard.
function ruleMatches(rule, ctx) {
  if (rule.active === false) return false;
  if (rule.serviceCategory && ctx.serviceCategory && rule.serviceCategory !== ctx.serviceCategory) return false;
  if (rule.vehicleType && ctx.vehicleType && rule.vehicleType.toLowerCase() !== String(ctx.vehicleType).toLowerCase()) return false;
  if (rule.season && rule.season !== 'all' && ctx.season && rule.season !== ctx.season) return false;
  if (rule.condition && rule.condition !== 'any' && ctx.condition && rule.condition !== ctx.condition) return false;
  if (rule.destination && ctx.destination && !String(ctx.destination).toLowerCase().includes(rule.destination.toLowerCase())) return false;
  if (rule.supplierId && ctx.supplierId && rule.supplierId !== ctx.supplierId) return false;
  const d = ctx.date || '';
  if (d) {
    if (rule.effectiveFrom && d < rule.effectiveFrom) return false;
    if (rule.effectiveTo && d > rule.effectiveTo) return false;
  }
  return true;
}

// Compute applicable rules + total surcharge on a base amount. Does NOT mutate
// any quotation/booking — purely a helper the UI/workflows can call.
export function calculateSurcharge(rules, ctx) {
  const base = Math.max(0, round2(n(ctx.baseAmount, 0)));
  const nights = Math.max(0, Math.floor(n(ctx.nightHalts, 0)));
  const applied = [];
  let surcharge = 0;
  for (const r of rules) {
    if (!ruleMatches(r, ctx)) continue;
    let amt = 0;
    if (r.surchargeType === 'percent') amt = round2(base * n(r.surchargeValue, 0) / 100);
    else amt = round2(n(r.surchargeValue, 0));
    const nightHalt = round2(n(r.nightHaltRate, 0) * nights);
    const total = round2(amt + nightHalt);
    if (total <= 0 && !amt && !nightHalt) continue;
    surcharge = round2(surcharge + total);
    applied.push({ id: r.id, name: r.name, serviceCategory: r.serviceCategory, surchargeType: r.surchargeType, surchargeValue: r.surchargeValue, amount: amt, nightHaltAmount: nightHalt, total });
  }
  return { base, surcharge: round2(surcharge), total: round2(base + surcharge), nightHalts: nights, appliedRules: applied };
}

// ---------------- Universal Document Vault ----------------
export const DOCUMENT_ENTITY_TYPES = [
  'customer', 'client', 'supplier', 'booking', 'quotation', 'itinerary',
  'vehicle', 'driver', 'permit', 'invoice', 'payment', 'other',
];
export const DOCUMENT_CATEGORIES = [
  'Customer', 'Supplier', 'Booking', 'Quotation', 'Itinerary', 'Vehicle',
  'Driver', 'Permit', 'Invoice', 'Payment', 'Other',
];
export const DOCUMENT_MAX_BYTES = 8 * 1024 * 1024; // 8MB foundation cap

export function buildDocumentMeta(body) {
  const name = s(body.name, 200).trim();
  if (!name) return { error: 'Document name is required' };
  const entityType = s(body.entityType).toLowerCase() || 'other';
  if (!DOCUMENT_ENTITY_TYPES.includes(entityType)) return { error: 'Invalid entity type' };
  const category = DOCUMENT_CATEGORIES.includes(body.category) ? body.category : 'Other';
  return {
    value: {
      name, entityType, entityId: s(body.entityId, 80),
      category, description: s(body.description, 2000),
      expiryDate: s(body.expiryDate, 40),
      status: body.status === 'archived' ? 'archived' : 'active',
    },
  };
}

// ---------------- Custom Fields & Modules ----------------
export const CUSTOM_FIELD_ENTITIES = ['leads', 'clients', 'suppliers', 'bookings', 'quotations', 'vehicles', 'drivers'];
export const CUSTOM_FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'select', 'multiselect'];

export function slugify(str, max = 50) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '').slice(0, max);
}

export function buildFieldDefinition(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.label !== undefined) {
    const label = s(body.label, 80).trim();
    if (!label) return { error: 'Field label is required' };
    out.label = label;
  }
  if (!partial || body.fieldType !== undefined) {
    const t = s(body.fieldType).toLowerCase();
    if (!CUSTOM_FIELD_TYPES.includes(t)) return { error: 'Invalid field type' };
    out.fieldType = t;
  }
  if (!partial || body.options !== undefined) {
    out.options = (Array.isArray(body.options) ? body.options : []).map((o) => s(o, 80)).filter(Boolean).slice(0, 50);
  }
  if ((out.fieldType === 'select' || out.fieldType === 'multiselect') && out.options && out.options.length === 0) {
    return { error: 'Select fields need at least one option' };
  }
  if (!partial || body.required !== undefined) out.required = !!body.required;
  if (!partial || body.active !== undefined) out.active = body.active === undefined ? true : !!body.active;
  if (!partial || body.order !== undefined) out.order = Math.max(0, Math.floor(n(body.order, 0)));
  return { value: out };
}

// Coerce a value to its field type (used when saving custom field values).
export function coerceFieldValue(fieldType, options, raw) {
  switch (fieldType) {
    case 'number': { const x = Number(raw); return Number.isFinite(x) ? x : null; }
    case 'boolean': return raw === true || raw === 'true' || raw === 1 || raw === '1';
    case 'date': return s(raw, 40);
    case 'select': { const v = s(raw, 120); return options && options.includes(v) ? v : ''; }
    case 'multiselect': {
      const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
      return arr.map((x) => s(x, 120)).filter((x) => !options || options.includes(x));
    }
    default: return s(raw, 2000);
  }
}

export function buildCustomModule(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = s(body.name, 80).trim();
    if (!name) return { error: 'Module name is required' };
    out.name = name;
  }
  if (!partial || body.description !== undefined) out.description = s(body.description, 1000);
  if (!partial || body.active !== undefined) out.active = body.active === undefined ? true : !!body.active;
  if (!partial || body.fields !== undefined) {
    out.fields = (Array.isArray(body.fields) ? body.fields : []).slice(0, 50).map((f, i) => {
      const t = CUSTOM_FIELD_TYPES.includes(s(f.fieldType).toLowerCase()) ? s(f.fieldType).toLowerCase() : 'text';
      return {
        id: f.id || uuidv4(), label: s(f.label, 80), key: slugify(f.key || f.label),
        fieldType: t, required: !!f.required,
        options: (Array.isArray(f.options) ? f.options : []).map((o) => s(o, 80)).filter(Boolean).slice(0, 50),
        order: Math.max(0, Math.floor(n(f.order, i))),
      };
    }).filter((f) => f.label && f.key);
  }
  return { value: out };
}
