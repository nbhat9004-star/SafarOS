// SafarOS — Travel Inventory domain foundation.
// Pure validation and deterministic rate-selection helpers; tenant scoping stays in the API layer.
export const INVENTORY_TYPES = Object.freeze({
  accommodation: 'inventoryAccommodations',
  activity: 'inventoryActivities',
  transport: 'inventoryTransport',
});
export const INVENTORY_STATUSES = Object.freeze(['active', 'inactive', 'archived']);
export const RATE_UNITS = Object.freeze(['per_night', 'per_person', 'per_vehicle', 'per_group', 'per_booking']);

const text = (value, max = 240) => String(value ?? '').trim().slice(0, max);
const money = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round((n + Number.EPSILON) * 100) / 100 : null;
};
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(Date.parse(value));

export function buildInventoryItem(type, body = {}, { partial = false } = {}) {
  if (!Object.prototype.hasOwnProperty.call(INVENTORY_TYPES, type)) return { error: 'Unsupported inventory type' };
  const value = {};
  for (const key of ['name', 'supplierId']) {
    if (!partial || body[key] !== undefined) {
      const v = text(body[key], key === 'name' ? 160 : 100);
      if (!v) return { error: key === 'name' ? 'Name is required' : 'A supplier is required' };
      value[key] = v;
    }
  }
  for (const key of ['description', 'destination', 'location', 'address', 'internalNotes']) {
    if (!partial || body[key] !== undefined) value[key] = text(body[key], key === 'description' ? 3000 : 1000);
  }
  if (!partial || body.status !== undefined) {
    const status = body.status === undefined ? 'active' : text(body.status, 20);
    if (!INVENTORY_STATUSES.includes(status)) return { error: 'Invalid inventory status' };
    value.status = status;
  }
  if (!partial || body.images !== undefined) {
    if (body.images !== undefined && !Array.isArray(body.images)) return { error: 'Images must be a list' };
    value.images = (Array.isArray(body.images) ? body.images : []).slice(0, 20).map(v => text(v, 1000)).filter(Boolean);
  }
  if (type === 'accommodation') {
    for (const key of ['propertyType', 'checkInTime', 'checkOutTime']) if (!partial || body[key] !== undefined) value[key] = text(body[key], 80);
    if (!partial || body.roomTypes !== undefined) value.roomTypes = Array.isArray(body.roomTypes) ? body.roomTypes.slice(0, 100) : [];
    if (!partial || body.amenities !== undefined) value.amenities = Array.isArray(body.amenities) ? body.amenities.slice(0, 100).map(v => text(v, 80)) : [];
  }
  if (type === 'activity') {
    for (const key of ['activityType', 'duration', 'meetingPoint', 'cancellationPolicy']) if (!partial || body[key] !== undefined) value[key] = text(body[key], 500);
    if (!partial || body.operatingDays !== undefined) {
      const days = Array.isArray(body.operatingDays) ? body.operatingDays.map(Number) : [];
      if (days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) return { error: 'Operating days must be weekday numbers from 0 to 6' };
      value.operatingDays = [...new Set(days)];
    }
  }
  if (type === 'transport') {
    for (const key of ['serviceType', 'vehicleType', 'route', 'transferType']) if (!partial || body[key] !== undefined) value[key] = text(body[key], 160);
    for (const key of ['passengerCapacity', 'luggageCapacity']) if (!partial || body[key] !== undefined) {
      const n = Number(body[key] ?? 0);
      if (!Number.isInteger(n) || n < 0 || n > 1000) return { error: key + ' must be a non-negative whole number' };
      value[key] = n;
    }
  }
  return { value };
}

export function buildRatePlan(body = {}, { partial = false } = {}) {
  const value = {};
  for (const key of ['serviceType', 'serviceId', 'supplierId', 'currency', 'unit']) if (!partial || body[key] !== undefined) {
    const v = text(body[key], 100);
    if (!v) return { error: key + ' is required' };
    value[key] = key === 'currency' ? v.toUpperCase() : v;
  }
  if ((!partial || body.unit !== undefined) && !RATE_UNITS.includes(value.unit)) return { error: 'Invalid rate unit' };
  for (const key of ['validFrom', 'validTo']) if (!partial || body[key] !== undefined) {
    const v = text(body[key], 10);
    if (!validDate(v)) return { error: key + ' must be a valid YYYY-MM-DD date' };
    value[key] = v;
  }
  const from = value.validFrom ?? body.validFrom, to = value.validTo ?? body.validTo;
  if (from && to && from > to) return { error: 'Rate validity end date must be on or after start date' };
  for (const key of ['netCost', 'sellingGuidePrice']) if (!partial || body[key] !== undefined) {
    const v = money(body[key]);
    if (v === null && !(key === 'sellingGuidePrice' && body[key] == null)) return { error: key + ' must be a non-negative amount' };
    if (v !== null) value[key] = v;
  }
  if (!partial || body.weekdays !== undefined) {
    const days = body.weekdays == null ? [0,1,2,3,4,5,6] : body.weekdays;
    if (!Array.isArray(days) || days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) return { error: 'Weekdays must be numbers from 0 to 6' };
    value.weekdays = [...new Set(days)];
  }
  if (!partial || body.blackoutDates !== undefined) {
    const dates = body.blackoutDates == null ? [] : body.blackoutDates;
    if (!Array.isArray(dates) || dates.some(d => !validDate(d))) return { error: 'Blackout dates must use YYYY-MM-DD format' };
    value.blackoutDates = [...new Set(dates)].slice(0, 500);
  }
  if (!partial || body.status !== undefined) {
    const status = body.status === undefined ? 'active' : text(body.status, 20);
    if (!INVENTORY_STATUSES.includes(status)) return { error: 'Invalid rate plan status' };
    value.status = status;
  }
  return { value };
}

// Narrowest date window wins; then latest start date; ties are stable by ID.
// This selects a price only and does not claim live availability.
export function selectApplicableRate(ratePlans, { serviceType, serviceId, date, quantity = 1 } = {}) {
  if (!validDate(date)) return null;
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
  const candidates = (Array.isArray(ratePlans) ? ratePlans : []).filter(p => {
    if (p.status !== 'active' || p.serviceType !== serviceType || p.serviceId !== serviceId) return false;
    if (!validDate(p.validFrom) || !validDate(p.validTo) || date < p.validFrom || date > p.validTo) return false;
    if (Array.isArray(p.weekdays) && !p.weekdays.includes(weekday)) return false;
    if (Array.isArray(p.blackoutDates) && p.blackoutDates.includes(date)) return false;
    if (p.minQuantity != null && Number(quantity) < Number(p.minQuantity)) return false;
    if (p.maxQuantity != null && Number(quantity) > Number(p.maxQuantity)) return false;
    return money(p.netCost) !== null;
  });
  candidates.sort((a,b) => (Date.parse(a.validTo)-Date.parse(a.validFrom)) - (Date.parse(b.validTo)-Date.parse(b.validFrom)) || b.validFrom.localeCompare(a.validFrom) || String(a.id).localeCompare(String(b.id)));
  return candidates[0] || null;
}

export function inventorySnapshot(item, ratePlan) {
  if (!item || !ratePlan) return null;
  return {
    inventoryType: ratePlan.serviceType, inventoryId: item.id, inventoryName: item.name,
    supplierId: item.supplierId, ratePlanId: ratePlan.id, currency: ratePlan.currency,
    unit: ratePlan.unit, netCost: money(ratePlan.netCost), sellingGuidePrice: money(ratePlan.sellingGuidePrice),
    rateValidFrom: ratePlan.validFrom, rateValidTo: ratePlan.validTo, capturedAt: new Date().toISOString(),
  };
}
