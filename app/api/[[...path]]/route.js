// SafarOS — tenant-aware API skeleton (Phase 3 foundation).
// Modules wired: auth (agency signup/login/me/logout), agency, members, clients(demo).
// Every tenant query is scoped to session.agencyId (server-derived, never client-trusted).
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import {
  COOKIE_NAME, hashPassword, verifyPassword, signSession, getSession,
} from '@/lib/auth';
import { can, isValidRole } from '@/lib/rbac';
import { tenantFilter, withAgency } from '@/lib/tenancy';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function pathOf(params) {
  const p = params?.path || [];
  return '/' + (Array.isArray(p) ? p.join('/') : p);
}

function setSessionCookie(res, token) {
  res.cookies.set({
    name: COOKIE_NAME, value: token, httpOnly: true, sameSite: 'lax',
    path: '/', maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

// --- CRM client helpers (minimal, schema-compatible) ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLIENT_STATUSES = ['active', 'lead', 'inactive'];

// Validate + normalize incoming client fields. Returns { value } or { error }.
// `partial` = true for PUT (only validate provided keys).
function buildClientFields(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (!name) return { error: 'Client name is required' };
    if (name.length > 120) return { error: 'Name is too long (max 120 characters)' };
    out.name = name;
  }
  if (!partial || body.email !== undefined) {
    const email = String(body.email ?? '').trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' };
    if (email.length > 160) return { error: 'Email is too long' };
    out.email = email;
  }
  if (!partial || body.phone !== undefined) {
    const phone = String(body.phone ?? '').trim();
    if (phone.length > 40) return { error: 'Phone number is too long' };
    out.phone = phone;
  }
  if (!partial || body.notes !== undefined) {
    const notes = String(body.notes ?? '').trim();
    if (notes.length > 2000) return { error: 'Notes are too long (max 2000 characters)' };
    out.notes = notes;
  }
  if (!partial || body.status !== undefined) {
    const status = body.status === undefined ? 'active' : String(body.status);
    if (!CLIENT_STATUSES.includes(status)) return { error: 'Invalid client status' };
    out.status = status;
  }
  return { value: out };
}

// --- CRM helpers ---
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const FOLLOWUP_STATUSES = ['pending', 'completed'];
const TASK_STATUSES = ['open', 'completed'];

// Fire-and-forget activity log (never block the request if it fails).
async function logActivity(db, session, { type, message, refType = '', refId = '' }) {
  try {
    await db.collection('activities').insertOne(withAgency(session, {
      id: uuidv4(), type, message, refType, refId,
      actorId: session.userId, actorName: session.name || '',
      createdAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[safaros] activity log skipped:', e.message);
  }
}

function buildLeadFields(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (!name) return { error: 'Lead name is required' };
    if (name.length > 120) return { error: 'Name is too long (max 120 characters)' };
    out.name = name;
  }
  if (!partial || body.email !== undefined) {
    const email = String(body.email ?? '').trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' };
    out.email = email;
  }
  if (!partial || body.phone !== undefined) out.phone = String(body.phone ?? '').trim().slice(0, 40);
  if (!partial || body.source !== undefined) out.source = String(body.source ?? '').trim().slice(0, 60);
  if (!partial || body.notes !== undefined) {
    const notes = String(body.notes ?? '').trim();
    if (notes.length > 2000) return { error: 'Notes are too long (max 2000 characters)' };
    out.notes = notes;
  }
  if (!partial || body.status !== undefined) {
    const status = body.status === undefined ? 'new' : String(body.status);
    if (!LEAD_STATUSES.includes(status)) return { error: 'Invalid lead status' };
    out.status = status;
  }
  return { value: out };
}

function buildFollowUpFields(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim();
    if (!title) return { error: 'Follow-up title is required' };
    out.title = title.slice(0, 160);
  }
  if (!partial || body.relatedType !== undefined) {
    const rt = String(body.relatedType ?? '').trim();
    if (rt && !['lead', 'client'].includes(rt)) return { error: 'Invalid related record type' };
    out.relatedType = rt;
  }
  if (!partial || body.relatedId !== undefined) out.relatedId = String(body.relatedId ?? '').trim();
  if (!partial || body.relatedName !== undefined) out.relatedName = String(body.relatedName ?? '').trim().slice(0, 160);
  if (!partial || body.dueDate !== undefined) out.dueDate = String(body.dueDate ?? '').trim();
  if (!partial || body.notes !== undefined) out.notes = String(body.notes ?? '').trim().slice(0, 2000);
  if (!partial || body.status !== undefined) {
    const status = body.status === undefined ? 'pending' : String(body.status);
    if (!FOLLOWUP_STATUSES.includes(status)) return { error: 'Invalid follow-up status' };
    out.status = status;
  }
  return { value: out };
}

function buildTaskFields(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim();
    if (!title) return { error: 'Task title is required' };
    out.title = title.slice(0, 160);
  }
  if (!partial || body.assigneeId !== undefined) out.assigneeId = String(body.assigneeId ?? '').trim();
  if (!partial || body.assigneeName !== undefined) out.assigneeName = String(body.assigneeName ?? '').trim().slice(0, 120);
  if (!partial || body.relatedType !== undefined) {
    const rt = String(body.relatedType ?? '').trim();
    if (rt && !['lead', 'client'].includes(rt)) return { error: 'Invalid related record type' };
    out.relatedType = rt;
  }
  if (!partial || body.relatedId !== undefined) out.relatedId = String(body.relatedId ?? '').trim();
  if (!partial || body.relatedName !== undefined) out.relatedName = String(body.relatedName ?? '').trim().slice(0, 160);
  if (!partial || body.dueDate !== undefined) out.dueDate = String(body.dueDate ?? '').trim();
  if (!partial || body.status !== undefined) {
    const status = body.status === undefined ? 'open' : String(body.status);
    if (!TASK_STATUSES.includes(status)) return { error: 'Invalid task status' };
    out.status = status;
  }
  return { value: out };
}


// ---------------------------------------------------------------- GET
// --- Quotation helpers ---
const QUOTE_STATUSES = ['draft', 'sent', 'approved', 'rejected', 'expired'];
function num(v, def = 0) { const n = Number(v); return Number.isFinite(n) ? n : def; }
function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

// Authoritative server-side pricing. Never trust client-computed totals.
function computeQuotation(body) {
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems.map((it) => {
    const quantity = Math.max(0, num(it.quantity, 0));
    const unitCost = Math.max(0, num(it.unitCost, 0));
    const sellingPrice = Math.max(0, num(it.sellingPrice, 0));
    return {
      id: it.id || uuidv4(),
      category: String(it.category || 'Other').slice(0, 40),
      description: String(it.description || '').slice(0, 300),
      quantity, unitCost, sellingPrice,
      total: round2(quantity * sellingPrice),
      cost: round2(quantity * unitCost),
    };
  });
  const subtotal = round2(items.reduce((s, i) => s + i.total, 0));
  const internalCost = round2(items.reduce((s, i) => s + i.cost, 0));
  const discount = {
    type: body.discount && body.discount.type === 'percent' ? 'percent' : 'fixed',
    value: Math.max(0, num(body.discount && body.discount.value, 0)),
  };
  let discountAmount = discount.type === 'percent'
    ? subtotal * Math.min(discount.value, 100) / 100
    : discount.value;
  discountAmount = round2(Math.min(discountAmount, subtotal)); // never produce a negative total
  const taxable = Math.max(0, round2(subtotal - discountAmount));
  const tax = { percent: Math.min(Math.max(0, num(body.tax && body.tax.percent, 0)), 100) };
  const taxAmount = round2(taxable * tax.percent / 100);
  const grandTotal = round2(taxable + taxAmount);
  const expectedProfit = round2(taxable - internalCost);
  return { items, subtotal, internalCost, discount, discountAmount, tax, taxAmount, grandTotal, expectedProfit };
}

function validateQuotationInput(body) {
  const customerType = body.customerType === 'lead' ? 'lead' : 'client';
  const customerId = String(body.customerId || '').trim();
  if (!customerId) return { error: 'Please select a client or lead' };
  const destination = String(body.destination || '').trim();
  if (!destination) return { error: 'Destination is required' };
  const startDate = String(body.startDate || '').trim();
  const endDate = String(body.endDate || '').trim();
  if (startDate && endDate && startDate > endDate) return { error: 'Travel end date must be on or after the start date' };
  const rawItems = Array.isArray(body.items) ? body.items : [];
  for (const it of rawItems) {
    if (num(it.quantity, 0) < 0) return { error: 'Item quantity cannot be negative' };
    if (num(it.unitCost, 0) < 0 || num(it.sellingPrice, 0) < 0) return { error: 'Item prices cannot be negative' };
  }
  return {
    value: {
      customerType, customerId, destination, startDate, endDate,
      adults: Math.max(0, Math.floor(num(body.adults, 0))),
      children: Math.max(0, Math.floor(num(body.children, 0))),
      rooms: Math.max(0, Math.floor(num(body.rooms, 0))),
      nights: Math.max(0, Math.floor(num(body.nights, 0))),
    },
  };
}

// Resolve + verify the referenced CRM record belongs to this agency (tenant-safe).
async function resolveQuotationCustomer(db, session, type, id) {
  const coll = type === 'lead' ? 'leads' : 'clients';
  const rec = await db.collection(coll).findOne(tenantFilter(session, { id }));
  if (!rec) return null;
  return { customerName: rec.name, customerEmail: rec.email || '' };
}

async function nextQuotationNumber(db, session) {
  const r = await db.collection('agencies').findOneAndUpdate(
    { id: session.agencyId }, { $inc: { quotationSeq: 1 } }, { returnDocument: 'after' },
  );
  const agDoc = r && r.value !== undefined ? r.value : r;
  const seq = (agDoc && agDoc.quotationSeq) || 1;
  return `QT-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
}

// --- Package & Itinerary helpers ---
const PACKAGE_STATUSES = ['draft', 'active', 'completed', 'cancelled'];

function validatePackageInput(body) {
  const name = String(body.name || '').trim();
  if (!name) return { error: 'Package name is required' };
  const customerType = body.customerType === 'lead' ? 'lead' : 'client';
  const customerId = String(body.customerId || '').trim();
  if (!customerId) return { error: 'Please select a client or lead' };
  const destination = String(body.destination || '').trim();
  if (!destination) return { error: 'Destination is required' };
  const startDate = String(body.startDate || '').trim();
  const endDate = String(body.endDate || '').trim();
  if (startDate && endDate && startDate > endDate) return { error: 'End date must be on or after the start date' };
  return {
    value: {
      name: name.slice(0, 160), customerType, customerId, destination: destination.slice(0, 160),
      startDate, endDate,
      adults: Math.max(0, Math.floor(num(body.adults, 0))),
      children: Math.max(0, Math.floor(num(body.children, 0))),
      nights: Math.max(0, Math.floor(num(body.nights, 0))),
      description: String(body.description || '').slice(0, 4000),
      quotationId: String(body.quotationId || '').trim(),
    },
  };
}

function str(v, max = 300) { return String(v == null ? '' : v).slice(0, max); }

// Normalize the embedded day-by-day structure (activities/meals/transport/accommodation).
function normalizeItineraryDays(rawDays) {
  const days = Array.isArray(rawDays) ? rawDays : [];
  return days.map((d, i) => ({
    id: d.id || uuidv4(),
    dayNumber: Math.max(1, Math.floor(num(d.dayNumber, i + 1))),
    date: str(d.date, 40),
    title: str(d.title, 200),
    description: str(d.description, 2000),
    location: str(d.location, 200),
    startTime: str(d.startTime, 20),
    endTime: str(d.endTime, 20),
    notes: str(d.notes, 2000),
    activities: (Array.isArray(d.activities) ? d.activities : []).map((a) => ({
      id: a.id || uuidv4(),
      name: str(a.name, 200), description: str(a.description, 1000),
      location: str(a.location, 200), startTime: str(a.startTime, 20),
      endTime: str(a.endTime, 20), notes: str(a.notes, 1000),
    })),
    meals: {
      breakfast: str(d.meals && d.meals.breakfast, 300),
      lunch: str(d.meals && d.meals.lunch, 300),
      dinner: str(d.meals && d.meals.dinner, 300),
    },
    transport: {
      type: str(d.transport && d.transport.type, 120),
      pickupLocation: str(d.transport && d.transport.pickupLocation, 200),
      dropLocation: str(d.transport && d.transport.dropLocation, 200),
      pickupTime: str(d.transport && d.transport.pickupTime, 20),
      notes: str(d.transport && d.transport.notes, 1000),
    },
    accommodation: {
      name: str(d.accommodation && d.accommodation.name, 200),
      location: str(d.accommodation && d.accommodation.location, 200),
      checkIn: str(d.accommodation && d.accommodation.checkIn, 40),
      checkOut: str(d.accommodation && d.accommodation.checkOut, 40),
      roomNotes: str(d.accommodation && d.accommodation.roomNotes, 1000),
    },
  }));
}


// --- Supplier helpers ---
const SUPPLIER_TYPES = ['hotel', 'houseboat', 'transport', 'activity', 'guide', 'restaurant', 'other'];
const SUPPLIER_STATUSES = ['active', 'inactive'];
const SUPPLIER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSupplierInput(body) {
  const name = String(body.name || '').trim();
  if (!name) return { error: 'Supplier name is required' };
  const type = String(body.type || '').trim().toLowerCase();
  if (!SUPPLIER_TYPES.includes(type)) return { error: 'Please select a valid supplier type' };
  const email = String(body.email || '').trim();
  if (email && !SUPPLIER_EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' };
  let status = String(body.status || 'active').trim().toLowerCase();
  if (!SUPPLIER_STATUSES.includes(status)) status = 'active';
  return {
    value: {
      name: name.slice(0, 160), type, email: email.slice(0, 160), status,
      contactPerson: str(body.contactPerson, 160),
      phone: str(body.phone, 40),
      website: str(body.website, 200),
      address: str(body.address, 300),
      city: str(body.city, 120),
      state: str(body.state, 120),
      country: str(body.country, 120),
      description: str(body.description, 4000),
      notes: str(body.notes, 4000),
    },
  };
}

// --- Booking helpers ---
const BOOKING_STATUSES = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const BOOKING_SERVICE_TYPES = ['hotel', 'houseboat', 'transport', 'activity', 'guide', 'restaurant', 'other'];
const BOOKING_SERVICE_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

function computeBookingServices(rawItems) {
  return (Array.isArray(rawItems) ? rawItems : []).map((it) => {
    const quantity = Math.max(0, num(it.quantity, 0));
    const unitPrice = Math.max(0, num(it.unitPrice, 0));
    const type = BOOKING_SERVICE_TYPES.includes(String(it.type || '').toLowerCase()) ? String(it.type).toLowerCase() : 'other';
    const status = BOOKING_SERVICE_STATUSES.includes(String(it.status || '').toLowerCase()) ? String(it.status).toLowerCase() : 'pending';
    return {
      id: it.id || uuidv4(), type, status,
      description: str(it.description, 300),
      supplierId: str(it.supplierId, 80),
      supplierName: str(it.supplierName, 160),
      quantity, unitPrice, total: round2(quantity * unitPrice),
      notes: str(it.notes, 1000),
    };
  });
}

// Authoritative server-side booking totals. Subtotal always derives from service items.
function computeBookingTotals(body, serviceItems) {
  const subtotal = round2(serviceItems.reduce((s, i) => s + i.total, 0));
  const discount = {
    type: body.discount && body.discount.type === 'percent' ? 'percent' : 'fixed',
    value: Math.max(0, num(body.discount && body.discount.value, 0)),
  };
  let discountAmount = discount.type === 'percent' ? subtotal * Math.min(discount.value, 100) / 100 : discount.value;
  discountAmount = round2(Math.min(discountAmount, subtotal));
  const taxable = Math.max(0, round2(subtotal - discountAmount));
  const tax = { percent: Math.min(Math.max(0, num(body.tax && body.tax.percent, 0)), 100) };
  const taxAmount = round2(taxable * tax.percent / 100);
  const grandTotal = round2(taxable + taxAmount);
  const internalCost = Math.max(0, round2(num(body.internalCost, 0)));
  const expectedProfit = round2(taxable - internalCost);
  return { subtotal, discount, discountAmount, tax, taxAmount, grandTotal, internalCost, expectedProfit };
}

function validateBookingCore(body) {
  const customerType = body.customerType === 'lead' ? 'lead' : 'client';
  const customerId = String(body.customerId || '').trim();
  if (!customerId) return { error: 'Please select a client or lead' };
  const destination = String(body.destination || '').trim();
  if (!destination) return { error: 'Destination is required' };
  const startDate = String(body.startDate || '').trim();
  const endDate = String(body.endDate || '').trim();
  if (startDate && endDate && startDate > endDate) return { error: 'Travel end date must be on or after the start date' };
  const serviceItems = computeBookingServices(body.serviceItems);
  for (const it of serviceItems) { if (it.quantity < 0 || it.unitPrice < 0) return { error: 'Service quantity and price cannot be negative' }; }
  return {
    value: {
      customerType, customerId, destination, startDate, endDate,
      adults: Math.max(0, Math.floor(num(body.adults, 0))),
      children: Math.max(0, Math.floor(num(body.children, 0))),
      nights: Math.max(0, Math.floor(num(body.nights, 0))),
      quotationId: str(body.quotationId, 80), packageId: str(body.packageId, 80), itineraryId: str(body.itineraryId, 80),
      notes: str(body.notes, 4000), serviceItems,
    },
  };
}

async function nextBookingNumber(db, session) {
  const r = await db.collection('agencies').findOneAndUpdate(
    { id: session.agencyId }, { $inc: { bookingSeq: 1 } }, { returnDocument: 'after' },
  );
  const agDoc = r && r.value !== undefined ? r.value : r;
  const seq = (agDoc && agDoc.bookingSeq) || 1;
  return `BK-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
}

// --- Fleet (vehicles & drivers) helpers ---
const VEHICLE_TYPES = ['car', 'suv', 'tempo_traveller', 'bus', 'van', 'other'];
const VEHICLE_STATUSES = ['available', 'assigned', 'in_transit', 'maintenance', 'inactive'];
const DRIVER_STATUSES = ['available', 'assigned', 'on_trip', 'inactive'];
const BOOKING_ASSIGNMENT_STATUSES = ['unassigned', 'assigned', 'in_transit', 'completed', 'cancelled'];

function validateVehicleInput(body) {
  const vehicleNumber = String(body.vehicleNumber || '').trim();
  if (!vehicleNumber) return { error: 'Vehicle number is required' };
  const vehicleType = VEHICLE_TYPES.includes(String(body.vehicleType || '').toLowerCase()) ? String(body.vehicleType).toLowerCase() : 'other';
  let status = String(body.status || 'available').toLowerCase();
  if (!VEHICLE_STATUSES.includes(status)) status = 'available';
  const value = {
    vehicleNumber: vehicleNumber.slice(0, 40),
    registrationNumber: str(body.registrationNumber, 60),
    vehicleType, status,
    make: str(body.make, 60), model: str(body.model, 60),
    year: Math.max(0, Math.floor(num(body.year, 0))),
    color: str(body.color, 40),
    seatingCapacity: Math.max(0, Math.floor(num(body.seatingCapacity, 0))),
    fuelType: str(body.fuelType, 40),
    notes: str(body.notes, 2000),
  };
  // GPS-ready optional fields (only touched when coordinates are explicitly supplied)
  if (body.latitude !== undefined && body.latitude !== null && body.latitude !== '') value.latitude = num(body.latitude, 0);
  if (body.longitude !== undefined && body.longitude !== null && body.longitude !== '') value.longitude = num(body.longitude, 0);
  if (value.latitude !== undefined || value.longitude !== undefined) {
    value.locationSource = body.locationSource === 'gps' ? 'gps' : 'manual';
    value.lastLocationAt = new Date().toISOString();
  }
  return { value };
}

function validateDriverInput(body) {
  const name = String(body.name || '').trim();
  if (!name) return { error: 'Driver name is required' };
  const email = String(body.email || '').trim();
  if (email && !SUPPLIER_EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' };
  let status = String(body.status || 'available').toLowerCase();
  if (!DRIVER_STATUSES.includes(status)) status = 'available';
  return {
    value: {
      name: name.slice(0, 120), phone: str(body.phone, 40), email: email.slice(0, 160),
      licenseNumber: str(body.licenseNumber, 60), licenseExpiry: str(body.licenseExpiry, 40),
      status, teamMemberId: str(body.teamMemberId, 80), notes: str(body.notes, 2000),
    },
  };
}

// Keep vehicle.currentDriverId and driver.assignedVehicleId consistent (tenant-scoped, no conflicts).
async function syncVehicleDriver(db, session, vehicleId, newDriverId, oldDriverId) {
  const now = new Date().toISOString();
  newDriverId = String(newDriverId || '');
  oldDriverId = String(oldDriverId || '');
  if (oldDriverId && oldDriverId !== newDriverId) {
    await db.collection('drivers').updateOne(tenantFilter(session, { id: oldDriverId, assignedVehicleId: vehicleId }), { $set: { assignedVehicleId: '', updatedAt: now } });
  }
  if (newDriverId) {
    await db.collection('vehicles').updateMany(tenantFilter(session, { currentDriverId: newDriverId, id: { $ne: vehicleId } }), { $set: { currentDriverId: '', updatedAt: now } });
    await db.collection('drivers').updateOne(tenantFilter(session, { id: newDriverId }), { $set: { assignedVehicleId: vehicleId, updatedAt: now } });
  }
}

export async function GET(request, context) {
  const params = await context.params;
  const path = pathOf(params);
  try {
    if (path === '/' || path === '') {
      return json({ app: 'SafarOS', status: 'ok', message: 'SafarOS API — B2B multi-tenant foundation' });
    }
    if (path === '/health') {
      const db = await getDb();
      await db.command({ ping: 1 });
      return json({ status: 'healthy', db: 'connected' });
    }

    if (path === '/auth/me') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      const db = await getDb();
      const user = await db.collection('users').findOne(
        { id: session.userId }, { projection: { _id: 0, passwordHash: 0 } });
      const agency = await db.collection('agencies').findOne(
        { id: session.agencyId }, { projection: { _id: 0 } });
      if (!user || !agency) return err('unauthenticated', 401);
      return json({ user, agency });
    }

    if (path === '/agency') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      const db = await getDb();
      const agency = await db.collection('agencies').findOne(
        { id: session.agencyId }, { projection: { _id: 0 } });
      return json({ agency });
    }

    if (path === '/members') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'members:read')) return err('forbidden', 403);
      const db = await getDb();
      const members = await db.collection('users')
        .find(tenantFilter(session), { projection: { _id: 0, passwordHash: 0 } })
        .sort({ createdAt: 1 }).toArray();
      return json({ members });
    }

    if (path === '/clients') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'clients:read')) return err('forbidden', 403);
      const db = await getDb();
      const clients = await db.collection('clients')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ clients });
    }

    // ---- CRM reads (all agency-scoped via tenantFilter) ----
    if (path === '/crm/stats') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'crm:read')) return err('forbidden', 403);
      const db = await getDb();
      const f = tenantFilter(session);
      const [totalLeads, activeLeads, totalClients, followUpsDue, openTasks] = await Promise.all([
        db.collection('leads').countDocuments(f),
        db.collection('leads').countDocuments(tenantFilter(session, { status: { $in: ['new', 'contacted', 'qualified'] } })),
        db.collection('clients').countDocuments(f),
        db.collection('followUps').countDocuments(tenantFilter(session, { status: 'pending' })),
        db.collection('tasks').countDocuments(tenantFilter(session, { status: 'open' })),
      ]);
      return json({ stats: { totalLeads, activeLeads, totalClients, followUpsDue, openTasks } });
    }

    if (path === '/leads') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'leads:read')) return err('forbidden', 403);
      const db = await getDb();
      const leads = await db.collection('leads')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ leads });
    }

    if (path === '/followups') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'followups:read')) return err('forbidden', 403);
      const db = await getDb();
      const followUps = await db.collection('followUps')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ followUps });
    }

    if (path === '/tasks') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'tasks:read')) return err('forbidden', 403);
      const db = await getDb();
      const tasks = await db.collection('tasks')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ tasks });
    }

    if (path === '/activities') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'activities:read')) return err('forbidden', 403);
      const db = await getDb();
      const activities = await db.collection('activities')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).limit(50).toArray();
      return json({ activities });
    }

    if (path === '/quotations') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'quotations:read')) return err('forbidden', 403);
      const db = await getDb();
      const quotations = await db.collection('quotations')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ quotations });
    }

    if (path.startsWith('/quotations/')) {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'quotations:read')) return err('forbidden', 403);
      const db = await getDb();
      const quotation = await db.collection('quotations')
        .findOne(tenantFilter(session, { id: path.split('/')[2] }), { projection: { _id: 0 } });
      if (!quotation) return err('Quotation not found', 404);
      return json({ quotation });
    }

    if (path === '/packages') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'packages:read')) return err('forbidden', 403);
      const db = await getDb();
      const packages = await db.collection('packages')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ packages });
    }

    if (path.startsWith('/packages/')) {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'packages:read')) return err('forbidden', 403);
      const db = await getDb();
      const pkg = await db.collection('packages')
        .findOne(tenantFilter(session, { id: path.split('/')[2] }), { projection: { _id: 0 } });
      if (!pkg) return err('Package not found', 404);
      return json({ package: pkg });
    }

    if (path === '/itineraries') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'itineraries:read')) return err('forbidden', 403);
      const db = await getDb();
      const itineraries = await db.collection('itineraries')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ itineraries });
    }

    if (path.startsWith('/itineraries/')) {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'itineraries:read')) return err('forbidden', 403);
      const db = await getDb();
      const itinerary = await db.collection('itineraries')
        .findOne(tenantFilter(session, { id: path.split('/')[2] }), { projection: { _id: 0 } });
      if (!itinerary) return err('Itinerary not found', 404);
      return json({ itinerary });
    }

    if (path === '/suppliers') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'suppliers:read')) return err('forbidden', 403);
      const db = await getDb();
      const suppliers = await db.collection('suppliers')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ suppliers });
    }

    if (path.startsWith('/suppliers/')) {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'suppliers:read')) return err('forbidden', 403);
      const db = await getDb();
      const supplier = await db.collection('suppliers')
        .findOne(tenantFilter(session, { id: path.split('/')[2] }), { projection: { _id: 0 } });
      if (!supplier) return err('Supplier not found', 404);
      return json({ supplier });
    }

    if (path === '/bookings') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'bookings:read')) return err('forbidden', 403);
      const db = await getDb();
      const bookings = await db.collection('bookings')
        .find(tenantFilter(session), { projection: { _id: 0 } })
        .sort({ createdAt: -1 }).toArray();
      return json({ bookings });
    }

    if (path.startsWith('/bookings/')) {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'bookings:read')) return err('forbidden', 403);
      const db = await getDb();
      const booking = await db.collection('bookings')
        .findOne(tenantFilter(session, { id: path.split('/')[2] }), { projection: { _id: 0 } });
      if (!booking) return err('Booking not found', 404);
      return json({ booking });
    }

    if (path === '/sync/status') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      // Authenticated reachability + server clock reference for the offline sync engine.
      // agencyId is derived server-side only; never trusted from the client.
      return json({ ok: true, serverTime: new Date().toISOString(), agencyId: session.agencyId });
    }

    if (path === '/fleet/stats') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'fleet:read')) return err('forbidden', 403);
      const db = await getDb();
      const [vehicles, drivers] = await Promise.all([
        db.collection('vehicles').find(tenantFilter(session), { projection: { _id: 0, status: 1 } }).toArray(),
        db.collection('drivers').find(tenantFilter(session), { projection: { _id: 0, status: 1 } }).toArray(),
      ]);
      const by = (arr, s) => arr.filter((x) => x.status === s).length;
      return json({ stats: {
        vehicles: { total: vehicles.length, available: by(vehicles, 'available'), assigned: by(vehicles, 'assigned'), in_transit: by(vehicles, 'in_transit'), maintenance: by(vehicles, 'maintenance'), inactive: by(vehicles, 'inactive') },
        drivers: { total: drivers.length, available: by(drivers, 'available'), assigned: by(drivers, 'assigned'), on_trip: by(drivers, 'on_trip'), inactive: by(drivers, 'inactive') },
      } });
    }

    if (path === '/vehicles') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'fleet:read')) return err('forbidden', 403);
      const db = await getDb();
      const vehicles = await db.collection('vehicles').find(tenantFilter(session), { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      const driverIds = [...new Set(vehicles.map((v) => v.currentDriverId).filter(Boolean))];
      const drivers = driverIds.length ? await db.collection('drivers').find(tenantFilter(session, { id: { $in: driverIds } }), { projection: { _id: 0, id: 1, name: 1 } }).toArray() : [];
      const dmap = Object.fromEntries(drivers.map((d) => [d.id, d.name]));
      vehicles.forEach((v) => { v.currentDriverName = v.currentDriverId ? (dmap[v.currentDriverId] || '') : ''; });
      return json({ vehicles });
    }

    if (path.startsWith('/vehicles/')) {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'fleet:read')) return err('forbidden', 403);
      const db = await getDb();
      const vehicle = await db.collection('vehicles').findOne(tenantFilter(session, { id: path.split('/')[2] }), { projection: { _id: 0 } });
      if (!vehicle) return err('Vehicle not found', 404);
      if (vehicle.currentDriverId) { const dr = await db.collection('drivers').findOne(tenantFilter(session, { id: vehicle.currentDriverId }), { projection: { _id: 0, name: 1 } }); vehicle.currentDriverName = dr ? dr.name : ''; }
      return json({ vehicle });
    }

    if (path === '/drivers') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'fleet:read')) return err('forbidden', 403);
      const db = await getDb();
      const drivers = await db.collection('drivers').find(tenantFilter(session), { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      const vehIds = [...new Set(drivers.map((d) => d.assignedVehicleId).filter(Boolean))];
      const vehs = vehIds.length ? await db.collection('vehicles').find(tenantFilter(session, { id: { $in: vehIds } }), { projection: { _id: 0, id: 1, vehicleNumber: 1 } }).toArray() : [];
      const vmap = Object.fromEntries(vehs.map((v) => [v.id, v.vehicleNumber]));
      drivers.forEach((d) => { d.assignedVehicleNumber = d.assignedVehicleId ? (vmap[d.assignedVehicleId] || '') : ''; });
      return json({ drivers });
    }

    if (path.startsWith('/drivers/')) {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'fleet:read')) return err('forbidden', 403);
      const db = await getDb();
      const driver = await db.collection('drivers').findOne(tenantFilter(session, { id: path.split('/')[2] }), { projection: { _id: 0 } });
      if (!driver) return err('Driver not found', 404);
      return json({ driver });
    }

    return err('not found', 404);
  } catch (e) {
    return err(e.message || 'server error', 500);
  }
}

// ---------------------------------------------------------------- POST
export async function POST(request, context) {
  const params = await context.params;
  const path = pathOf(params);
  try {
    const db = await getDb();

    // Agency onboarding: creates an agency + its owner user (REBUILD).
    if (path === '/auth/register-agency') {
      const { agencyName, name, email, password } = await readBody(request);
      if (!agencyName || !name || !email || !password) return err('agencyName, name, email, password required');
      const existing = await db.collection('users').findOne({ email: String(email).toLowerCase() });
      if (existing) return err('email already registered', 409);

      const agencyId = uuidv4();
      const now = new Date().toISOString();
      const slug = String(agencyName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'agency';
      await db.collection('agencies').insertOne({
        id: agencyId, name: agencyName, slug, plan: 'trial', createdAt: now,
      });
      const userId = uuidv4();
      await db.collection('users').insertOne({
        id: userId, agencyId, name, email: String(email).toLowerCase(),
        passwordHash: await hashPassword(password), role: 'owner', status: 'active', createdAt: now,
      });
      const token = signSession({ userId, agencyId, role: 'owner' });
      const res = json({
        user: { id: userId, name, email: String(email).toLowerCase(), role: 'owner' },
        agency: { id: agencyId, name: agencyName, slug, plan: 'trial' },
      }, 201);
      return setSessionCookie(res, token);
    }

    if (path === '/auth/login') {
      const { email, password } = await readBody(request);
      if (!email || !password) return err('email and password required');
      const user = await db.collection('users').findOne({ email: String(email).toLowerCase() });
      if (!user || !(await verifyPassword(password, user.passwordHash))) return err('invalid credentials', 401);
      const token = signSession({ userId: user.id, agencyId: user.agencyId, role: user.role });
      const res = json({ ok: true });
      return setSessionCookie(res, token);
    }

    if (path === '/auth/logout') {
      const res = json({ ok: true });
      res.cookies.set({ name: COOKIE_NAME, value: '', httpOnly: true, path: '/', maxAge: 0 });
      return res;
    }

    // Invite/add a team member — agency-scoped, RBAC-gated.
    if (path === '/members') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'members:invite')) return err('forbidden', 403);
      const { name, email, password, role } = await readBody(request);
      if (!name || !email || !password || !role) return err('name, email, password, role required');
      if (!isValidRole(role) || role === 'owner') return err('invalid role');
      const existing = await db.collection('users').findOne({ email: String(email).toLowerCase() });
      if (existing) return err('email already registered', 409);
      const doc = withAgency(session, {
        id: uuidv4(), name, email: String(email).toLowerCase(),
        passwordHash: await hashPassword(password), role, status: 'active',
        createdAt: new Date().toISOString(),
      });
      await db.collection('users').insertOne(doc);
      const { passwordHash, _id, ...safe } = doc;
      return json({ member: safe }, 201);
    }

    // Demo tenant-scoped resource proving isolation.
    if (path === '/clients') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'clients:create')) return err('forbidden', 403);
      const body = await readBody(request);
      const { value, error } = buildClientFields(body, { partial: false });
      if (error) return err(error);
      const doc = withAgency(session, {
        id: uuidv4(), ...value,
        createdBy: session.userId, createdAt: new Date().toISOString(),
      });
      await db.collection('clients').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session, { type: 'client_created', message: `Client "${safe.name}" created`, refType: 'client', refId: safe.id });
      return json({ client: safe }, 201);
    }

    // ---- CRM creates ----
    if (path === '/leads') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'leads:create')) return err('forbidden', 403);
      const { value, error } = buildLeadFields(await readBody(request), { partial: false });
      if (error) return err(error);
      const doc = withAgency(session, {
        id: uuidv4(), ...value, convertedClientId: '',
        createdBy: session.userId, createdAt: new Date().toISOString(),
      });
      await db.collection('leads').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session, { type: 'lead_created', message: `Lead "${safe.name}" created`, refType: 'lead', refId: safe.id });
      return json({ lead: safe }, 201);
    }

    if (path.startsWith('/leads/') && path.endsWith('/convert')) {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'clients:create')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const lead = await db.collection('leads').findOne(tenantFilter(session, { id }));
      if (!lead) return err('lead not found', 404);
      if (lead.convertedClientId) return err('lead already converted', 409);
      const clientDoc = withAgency(session, {
        id: uuidv4(), name: lead.name, email: lead.email || '', phone: lead.phone || '',
        notes: lead.notes || '', status: 'active',
        createdBy: session.userId, createdAt: new Date().toISOString(), fromLeadId: lead.id,
      });
      await db.collection('clients').insertOne(clientDoc);
      await db.collection('leads').updateOne(tenantFilter(session, { id }),
        { $set: { status: 'converted', convertedClientId: clientDoc.id, updatedAt: new Date().toISOString() } });
      const { _id, ...client } = clientDoc;
      await logActivity(db, session, { type: 'client_created', message: `Client "${client.name}" created from lead`, refType: 'client', refId: client.id });
      await logActivity(db, session, { type: 'status_changed', message: `Lead "${lead.name}" converted to client`, refType: 'lead', refId: lead.id });
      return json({ client }, 201);
    }

    if (path === '/followups') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'followups:create')) return err('forbidden', 403);
      const { value, error } = buildFollowUpFields(await readBody(request), { partial: false });
      if (error) return err(error);
      const doc = withAgency(session, {
        id: uuidv4(), ...value,
        createdBy: session.userId, createdAt: new Date().toISOString(),
      });
      await db.collection('followUps').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session, { type: 'followup_created', message: `Follow-up "${safe.title}" created`, refType: 'followup', refId: safe.id });
      return json({ followUp: safe }, 201);
    }

    if (path === '/tasks') {
      const session = getSession(request);
      if (!session) return err('unauthenticated', 401);
      if (!can(session.role, 'tasks:create')) return err('forbidden', 403);
      const { value, error } = buildTaskFields(await readBody(request), { partial: false });
      if (error) return err(error);
      const doc = withAgency(session, {
        id: uuidv4(), ...value,
        createdBy: session.userId, createdAt: new Date().toISOString(),
      });
      await db.collection('tasks').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session, { type: 'task_created', message: `Task "${safe.title}" created`, refType: 'task', refId: safe.id });
      return json({ task: safe }, 201);
    }

    // ---- Quotations: create + duplicate ----
    if (path === '/quotations') {
      const session2 = getSession(request);
      if (!session2) return err('unauthenticated', 401);
      if (!can(session2.role, 'quotations:create')) return err('forbidden', 403);
      const body = await readBody(request);
      const { value, error } = validateQuotationInput(body);
      if (error) return err(error);
      const cust = await resolveQuotationCustomer(db, session2, value.customerType, value.customerId);
      if (!cust) return err('The selected client or lead was not found', 404);
      const calc = computeQuotation(body);
      const quotationNumber = await nextQuotationNumber(db, session2);
      const now = new Date().toISOString();
      const doc = withAgency(session2, {
        id: uuidv4(), quotationNumber, ...value,
        customerName: cust.customerName, customerEmail: cust.customerEmail,
        items: calc.items, discount: calc.discount, tax: calc.tax,
        subtotal: calc.subtotal, discountAmount: calc.discountAmount, taxAmount: calc.taxAmount,
        grandTotal: calc.grandTotal, internalCost: calc.internalCost, expectedProfit: calc.expectedProfit,
        status: 'draft',
        internalNotes: String(body.internalNotes || '').slice(0, 2000),
        customerNotes: String(body.customerNotes || '').slice(0, 2000),
        createdBy: session2.userId, createdAt: now, updatedAt: now,
      });
      await db.collection('quotations').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session2, { type: 'quotation_created', message: `Quotation ${quotationNumber} created for ${cust.customerName}`, refType: 'quotation', refId: safe.id });
      return json({ quotation: safe }, 201);
    }

    if (path.startsWith('/quotations/') && path.endsWith('/duplicate')) {
      const session2 = getSession(request);
      if (!session2) return err('unauthenticated', 401);
      if (!can(session2.role, 'quotations:create')) return err('forbidden', 403);
      const src = await db.collection('quotations').findOne(tenantFilter(session2, { id: path.split('/')[2] }));
      if (!src) return err('Quotation not found', 404);
      const quotationNumber = await nextQuotationNumber(db, session2);
      const now = new Date().toISOString();
      const { _id, id, createdAt, updatedAt, status, quotationNumber: oldNum, createdBy, ...rest } = src;
      const doc = { ...rest, id: uuidv4(), quotationNumber, status: 'draft', createdBy: session2.userId, createdAt: now, updatedAt: now };
      await db.collection('quotations').insertOne(doc);
      const { _id: _omit, ...safe } = doc;
      await logActivity(db, session2, { type: 'quotation_created', message: `Quotation ${quotationNumber} duplicated from ${oldNum}`, refType: 'quotation', refId: safe.id });
      return json({ quotation: safe }, 201);
    }

    // ---- Packages ----
    if (path === '/packages') {
      const session2 = getSession(request);
      if (!session2) return err('unauthenticated', 401);
      if (!can(session2.role, 'packages:create')) return err('forbidden', 403);
      const body = await readBody(request);
      const { value, error } = validatePackageInput(body);
      if (error) return err(error);
      const cust = await resolveQuotationCustomer(db, session2, value.customerType, value.customerId);
      if (!cust) return err('The selected client or lead was not found', 404);
      let quotationNumber = '';
      if (value.quotationId) {
        const q = await db.collection('quotations').findOne(tenantFilter(session2, { id: value.quotationId }));
        if (!q) return err('The selected quotation was not found', 404);
        quotationNumber = q.quotationNumber;
      }
      const now = new Date().toISOString();
      const doc = withAgency(session2, {
        id: uuidv4(), ...value, quotationNumber,
        customerName: cust.customerName, customerEmail: cust.customerEmail,
        status: 'draft', itineraryId: '',
        createdBy: session2.userId, createdAt: now, updatedAt: now,
      });
      await db.collection('packages').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session2, { type: 'package_created', message: `Package "${safe.name}" created for ${cust.customerName}`, refType: 'package', refId: safe.id });
      return json({ package: safe }, 201);
    }

    // ---- Itineraries ----
    if (path === '/itineraries') {
      const session2 = getSession(request);
      if (!session2) return err('unauthenticated', 401);
      if (!can(session2.role, 'itineraries:create')) return err('forbidden', 403);
      const body = await readBody(request);
      const packageId = String(body.packageId || '').trim();
      if (!packageId) return err('A package is required');
      const pkg = await db.collection('packages').findOne(tenantFilter(session2, { id: packageId }));
      if (!pkg) return err('The package was not found', 404);
      const title = String(body.title || '').trim() || `${pkg.name} itinerary`;
      const now = new Date().toISOString();
      const doc = withAgency(session2, {
        id: uuidv4(), packageId, title: title.slice(0, 200),
        destination: String(body.destination || pkg.destination || '').slice(0, 160),
        startDate: String(body.startDate || pkg.startDate || '').trim(),
        endDate: String(body.endDate || pkg.endDate || '').trim(),
        notes: String(body.notes || '').slice(0, 4000),
        days: normalizeItineraryDays(body.days),
        createdBy: session2.userId, createdAt: now, updatedAt: now,
      });
      await db.collection('itineraries').insertOne(doc);
      await db.collection('packages').updateOne(tenantFilter(session2, { id: packageId }), { $set: { itineraryId: doc.id, updatedAt: now } });
      const { _id, ...safe } = doc;
      await logActivity(db, session2, { type: 'itinerary_created', message: `Itinerary created for package "${pkg.name}"`, refType: 'itinerary', refId: safe.id });
      return json({ itinerary: safe }, 201);
    }

    // ---- Suppliers ----
    if (path === '/suppliers') {
      const session2 = getSession(request);
      if (!session2) return err('unauthenticated', 401);
      if (!can(session2.role, 'suppliers:create')) return err('forbidden', 403);
      const body = await readBody(request);
      const { value, error } = validateSupplierInput(body);
      if (error) return err(error);
      const now = new Date().toISOString();
      const doc = withAgency(session2, {
        id: uuidv4(), ...value,
        createdBy: session2.userId, createdAt: now, updatedAt: now,
      });
      await db.collection('suppliers').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session2, { type: 'supplier_created', message: `Supplier "${safe.name}" added`, refType: 'supplier', refId: safe.id });
      return json({ supplier: safe }, 201);
    }

    // ---- Bookings (supports optional conversion from a quotation) ----
    if (path === '/bookings') {
      const session2 = getSession(request);
      if (!session2) return err('unauthenticated', 401);
      if (!can(session2.role, 'bookings:create')) return err('forbidden', 403);
      const body = await readBody(request);

      let fromQuotation = null;
      if (body.quotationId) {
        fromQuotation = await db.collection('quotations').findOne(tenantFilter(session2, { id: String(body.quotationId).trim() }));
        if (!fromQuotation) return err('Source quotation not found', 404);
        // Reuse quotation data as defaults; the original quotation is NOT modified.
        body.customerType = body.customerType || fromQuotation.customerType;
        body.customerId = body.customerId || fromQuotation.customerId;
        body.destination = body.destination || fromQuotation.destination;
        body.startDate = body.startDate || fromQuotation.startDate;
        body.endDate = body.endDate || fromQuotation.endDate;
        if (body.adults === undefined) body.adults = fromQuotation.adults;
        if (body.children === undefined) body.children = fromQuotation.children;
        if (body.nights === undefined) body.nights = fromQuotation.nights;
        if (body.discount === undefined) body.discount = fromQuotation.discount;
        if (body.tax === undefined) body.tax = fromQuotation.tax;
        if (body.internalCost === undefined) body.internalCost = fromQuotation.internalCost;
        if (!Array.isArray(body.serviceItems) || body.serviceItems.length === 0) {
          body.serviceItems = (fromQuotation.items || []).map((it) => ({
            type: BOOKING_SERVICE_TYPES.includes(String(it.category || '').toLowerCase()) ? String(it.category).toLowerCase() : 'other',
            description: it.description || it.category || '',
            quantity: it.quantity, unitPrice: it.sellingPrice, status: 'pending',
          }));
        }
      }

      const { value, error } = validateBookingCore(body);
      if (error) return err(error);
      const cust = await resolveQuotationCustomer(db, session2, value.customerType, value.customerId);
      if (!cust) return err('Selected client or lead was not found');

      const totals = computeBookingTotals(body, value.serviceItems);
      const bookingNumber = await nextBookingNumber(db, session2);
      const now = new Date().toISOString();
      const doc = withAgency(session2, {
        id: uuidv4(), bookingNumber,
        customerType: value.customerType, customerId: value.customerId, customerName: cust.customerName, customerEmail: cust.customerEmail,
        destination: value.destination, startDate: value.startDate, endDate: value.endDate,
        adults: value.adults, children: value.children, nights: value.nights,
        quotationId: value.quotationId, quotationNumber: fromQuotation ? fromQuotation.quotationNumber : '',
        packageId: value.packageId, itineraryId: value.itineraryId,
        serviceItems: value.serviceItems,
        subtotal: totals.subtotal, discount: totals.discount, discountAmount: totals.discountAmount,
        tax: totals.tax, taxAmount: totals.taxAmount, grandTotal: totals.grandTotal,
        internalCost: totals.internalCost, expectedProfit: totals.expectedProfit,
        status: 'draft', notes: value.notes,
        createdBy: session2.userId, createdAt: now, updatedAt: now,
      });
      await db.collection('bookings').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session2, { type: 'booking_created', message: fromQuotation ? `Booking ${bookingNumber} created from ${fromQuotation.quotationNumber}` : `Booking ${bookingNumber} created for ${cust.customerName}`, refType: 'booking', refId: safe.id });
      return json({ booking: safe }, 201);
    }

    // ---- Fleet: vehicles ----
    if (path === '/vehicles') {
      const session2 = getSession(request);
      if (!session2) return err('unauthenticated', 401);
      if (!can(session2.role, 'fleet:create')) return err('forbidden', 403);
      const body = await readBody(request);
      const { value, error } = validateVehicleInput(body);
      if (error) return err(error);
      let currentDriverId = str(body.currentDriverId, 80);
      if (currentDriverId) { const dr = await db.collection('drivers').findOne(tenantFilter(session2, { id: currentDriverId })); if (!dr) currentDriverId = ''; }
      const now = new Date().toISOString();
      const doc = withAgency(session2, {
        id: uuidv4(), ...value, currentDriverId,
        latitude: value.latitude !== undefined ? value.latitude : null,
        longitude: value.longitude !== undefined ? value.longitude : null,
        lastLocationAt: value.lastLocationAt || '', locationSource: value.locationSource || '',
        createdBy: session2.userId, createdAt: now, updatedAt: now,
      });
      await db.collection('vehicles').insertOne(doc);
      if (currentDriverId) await syncVehicleDriver(db, session2, doc.id, currentDriverId, '');
      const { _id, ...safe } = doc;
      await logActivity(db, session2, { type: 'vehicle_created', message: `Vehicle ${safe.vehicleNumber} added`, refType: 'vehicle', refId: safe.id });
      return json({ vehicle: safe }, 201);
    }

    // ---- Fleet: drivers ----
    if (path === '/drivers') {
      const session2 = getSession(request);
      if (!session2) return err('unauthenticated', 401);
      if (!can(session2.role, 'fleet:create')) return err('forbidden', 403);
      const body = await readBody(request);
      const { value, error } = validateDriverInput(body);
      if (error) return err(error);
      const now = new Date().toISOString();
      const doc = withAgency(session2, { id: uuidv4(), ...value, assignedVehicleId: '', createdBy: session2.userId, createdAt: now, updatedAt: now });
      await db.collection('drivers').insertOne(doc);
      const { _id, ...safe } = doc;
      await logActivity(db, session2, { type: 'driver_created', message: `Driver ${safe.name} added`, refType: 'driver', refId: safe.id });
      return json({ driver: safe }, 201);
    }

    return err('not found', 404);
  } catch (e) {
    return err(e.message || 'server error', 500);
  }
}

// ---------------------------------------------------------------- PUT
export async function PUT(request, context) {
  const params = await context.params;
  const path = pathOf(params);
  try {
    const session = getSession(request);
    if (!session) return err('unauthenticated', 401);
    const db = await getDb();

    // Agency onboarding setup — updates the session's own agency only.
    if (path === '/agency') {
      if (!can(session.role, 'agency:manage')) return err('forbidden', 403);
      const b = await readBody(request);
      const fields = ['name', 'phone', 'website', 'address', 'city', 'country', 'currency', 'timezone'];
      const update = {};
      for (const k of fields) { if (b[k] !== undefined) update[k] = String(b[k]); }
      if (b.email !== undefined) update.email = String(b.email).toLowerCase();
      update.setupCompleted = true;
      update.updatedAt = new Date().toISOString();
      // agencyId is derived server-side from the session, never from the client.
      await db.collection('agencies').updateOne({ id: session.agencyId }, { $set: update });
      const agency = await db.collection('agencies').findOne({ id: session.agencyId }, { projection: { _id: 0 } });
      return json({ agency });
    }

    // Edit a client — tenant-scoped, RBAC-gated. Agency derived from session only.
    if (path.startsWith('/clients/')) {
      if (!can(session.role, 'clients:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      if (!id) return err('client id required');
      const body = await readBody(request);
      const { value, error } = buildClientFields(body, { partial: true });
      if (error) return err(error);
      if (Object.keys(value).length === 0) return err('no fields to update');
      value.updatedAt = new Date().toISOString();
      const r = await db.collection('clients').updateOne(tenantFilter(session, { id }), { $set: value });
      if (r.matchedCount === 0) return err('client not found', 404);
      const client = await db.collection('clients').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ client });
    }

    // ---- CRM edits ----
    if (path.startsWith('/leads/')) {
      if (!can(session.role, 'leads:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('leads').findOne(tenantFilter(session, { id }));
      if (!existing) return err('lead not found', 404);
      const body = await readBody(request);
      const { value, error } = buildLeadFields(body, { partial: true });
      if (error) return err(error);
      if (Object.keys(value).length === 0) return err('no fields to update');
      value.updatedAt = new Date().toISOString();
      await db.collection('leads').updateOne(tenantFilter(session, { id }), { $set: value });
      if (value.status && value.status !== existing.status) {
        await logActivity(db, session, { type: 'status_changed', message: `Lead "${existing.name}" status changed to ${value.status}`, refType: 'lead', refId: id });
      }
      const lead = await db.collection('leads').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ lead });
    }

    if (path.startsWith('/followups/')) {
      if (!can(session.role, 'followups:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const body = await readBody(request);
      const { value, error } = buildFollowUpFields(body, { partial: true });
      if (error) return err(error);
      if (Object.keys(value).length === 0) return err('no fields to update');
      value.updatedAt = new Date().toISOString();
      const r = await db.collection('followUps').updateOne(tenantFilter(session, { id }), { $set: value });
      if (r.matchedCount === 0) return err('follow-up not found', 404);
      const followUp = await db.collection('followUps').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ followUp });
    }

    if (path.startsWith('/tasks/')) {
      if (!can(session.role, 'tasks:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const body = await readBody(request);
      const { value, error } = buildTaskFields(body, { partial: true });
      if (error) return err(error);
      if (Object.keys(value).length === 0) return err('no fields to update');
      value.updatedAt = new Date().toISOString();
      const r = await db.collection('tasks').updateOne(tenantFilter(session, { id }), { $set: value });
      if (r.matchedCount === 0) return err('task not found', 404);
      const task = await db.collection('tasks').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ task });
    }

    // ---- Quotations: status change (specific) then full edit ----
    if (path.startsWith('/quotations/') && path.endsWith('/status')) {
      if (!can(session.role, 'quotations:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const { status } = await readBody(request);
      if (!QUOTE_STATUSES.includes(status)) return err('Invalid quotation status');
      const existing = await db.collection('quotations').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Quotation not found', 404);
      await db.collection('quotations').updateOne(tenantFilter(session, { id }), { $set: { status, updatedAt: new Date().toISOString() } });
      if (status !== existing.status) {
        await logActivity(db, session, { type: 'status_changed', message: `Quotation ${existing.quotationNumber} marked ${status}`, refType: 'quotation', refId: id });
      }
      const quotation = await db.collection('quotations').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ quotation });
    }

    if (path.startsWith('/quotations/')) {
      if (!can(session.role, 'quotations:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('quotations').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Quotation not found', 404);
      const body = await readBody(request);
      const { value, error } = validateQuotationInput(body);
      if (error) return err(error);
      const cust = await resolveQuotationCustomer(db, session, value.customerType, value.customerId);
      if (!cust) return err('The selected client or lead was not found', 404);
      const calc = computeQuotation(body);
      const update = {
        ...value, customerName: cust.customerName, customerEmail: cust.customerEmail,
        items: calc.items, discount: calc.discount, tax: calc.tax,
        subtotal: calc.subtotal, discountAmount: calc.discountAmount, taxAmount: calc.taxAmount,
        grandTotal: calc.grandTotal, internalCost: calc.internalCost, expectedProfit: calc.expectedProfit,
        internalNotes: String(body.internalNotes || '').slice(0, 2000),
        customerNotes: String(body.customerNotes || '').slice(0, 2000),
        updatedAt: new Date().toISOString(),
      };
      await db.collection('quotations').updateOne(tenantFilter(session, { id }), { $set: update });
      const quotation = await db.collection('quotations').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ quotation });
    }

    // ---- Packages: status change (specific) then full edit ----
    if (path.startsWith('/packages/') && path.endsWith('/status')) {
      if (!can(session.role, 'packages:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const { status } = await readBody(request);
      if (!PACKAGE_STATUSES.includes(status)) return err('Invalid package status');
      const existing = await db.collection('packages').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Package not found', 404);
      await db.collection('packages').updateOne(tenantFilter(session, { id }), { $set: { status, updatedAt: new Date().toISOString() } });
      if (status !== existing.status) {
        await logActivity(db, session, { type: 'status_changed', message: `Package "${existing.name}" marked ${status}`, refType: 'package', refId: id });
      }
      const pkg = await db.collection('packages').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ package: pkg });
    }

    if (path.startsWith('/packages/')) {
      if (!can(session.role, 'packages:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('packages').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Package not found', 404);
      const body = await readBody(request);
      const { value, error } = validatePackageInput(body);
      if (error) return err(error);
      const cust = await resolveQuotationCustomer(db, session, value.customerType, value.customerId);
      if (!cust) return err('The selected client or lead was not found', 404);
      let quotationNumber = existing.quotationNumber || '';
      if (value.quotationId && value.quotationId !== existing.quotationId) {
        const q = await db.collection('quotations').findOne(tenantFilter(session, { id: value.quotationId }));
        if (!q) return err('The selected quotation was not found', 404);
        quotationNumber = q.quotationNumber;
      } else if (!value.quotationId) {
        quotationNumber = '';
      }
      const update = { ...value, quotationNumber, customerName: cust.customerName, customerEmail: cust.customerEmail, updatedAt: new Date().toISOString() };
      await db.collection('packages').updateOne(tenantFilter(session, { id }), { $set: update });
      const pkg = await db.collection('packages').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ package: pkg });
    }

    // ---- Itineraries: full edit (including day-by-day structure) ----
    if (path.startsWith('/itineraries/')) {
      if (!can(session.role, 'itineraries:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('itineraries').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Itinerary not found', 404);
      const body = await readBody(request);
      const update = { updatedAt: new Date().toISOString() };
      if (body.title !== undefined) update.title = String(body.title || '').slice(0, 200) || existing.title;
      if (body.destination !== undefined) update.destination = String(body.destination || '').slice(0, 160);
      if (body.startDate !== undefined) update.startDate = String(body.startDate || '').trim();
      if (body.endDate !== undefined) update.endDate = String(body.endDate || '').trim();
      if (body.notes !== undefined) update.notes = String(body.notes || '').slice(0, 4000);
      if (body.days !== undefined) update.days = normalizeItineraryDays(body.days);
      await db.collection('itineraries').updateOne(tenantFilter(session, { id }), { $set: update });
      const itinerary = await db.collection('itineraries').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ itinerary });
    }

    // ---- Suppliers: status change (specific) then full edit ----
    if (path.startsWith('/suppliers/') && path.endsWith('/status')) {
      if (!can(session.role, 'suppliers:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const { status } = await readBody(request);
      if (!SUPPLIER_STATUSES.includes(status)) return err('Invalid supplier status');
      const existing = await db.collection('suppliers').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Supplier not found', 404);
      await db.collection('suppliers').updateOne(tenantFilter(session, { id }), { $set: { status, updatedAt: new Date().toISOString() } });
      if (status !== existing.status) {
        await logActivity(db, session, { type: 'status_changed', message: `Supplier "${existing.name}" marked ${status}`, refType: 'supplier', refId: id });
      }
      const supplier = await db.collection('suppliers').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ supplier });
    }

    if (path.startsWith('/suppliers/')) {
      if (!can(session.role, 'suppliers:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('suppliers').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Supplier not found', 404);
      const body = await readBody(request);
      const { value, error } = validateSupplierInput(body);
      if (error) return err(error);
      await db.collection('suppliers').updateOne(tenantFilter(session, { id }), { $set: { ...value, updatedAt: new Date().toISOString() } });
      const supplier = await db.collection('suppliers').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ supplier });
    }

    // ---- Booking: fleet assignment (vehicle/driver) — does not affect booking totals ----
    if (path.startsWith('/bookings/') && path.endsWith('/assignment')) {
      if (!can(session.role, 'fleet:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('bookings').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Booking not found', 404);
      const body = await readBody(request);
      let vehicleId = str(body.vehicleId, 80), driverId = str(body.driverId, 80);
      if (vehicleId) { const v = await db.collection('vehicles').findOne(tenantFilter(session, { id: vehicleId })); if (!v) vehicleId = ''; }
      if (driverId) { const d = await db.collection('drivers').findOne(tenantFilter(session, { id: driverId })); if (!d) driverId = ''; }
      let assignmentStatus = String(body.assignmentStatus || '').toLowerCase();
      if (!BOOKING_ASSIGNMENT_STATUSES.includes(assignmentStatus)) assignmentStatus = (vehicleId || driverId) ? 'assigned' : 'unassigned';
      await db.collection('bookings').updateOne(tenantFilter(session, { id }), { $set: { vehicleId, driverId, assignmentStatus, updatedAt: new Date().toISOString() } });
      await logActivity(db, session, { type: 'booking_assigned', message: `Fleet assignment updated for booking ${existing.bookingNumber}`, refType: 'booking', refId: id });
      const booking = await db.collection('bookings').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ booking });
    }

    // ---- Bookings: status change (specific) then full edit ----
    if (path.startsWith('/bookings/') && path.endsWith('/status')) {
      if (!can(session.role, 'bookings:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const { status } = await readBody(request);
      if (!BOOKING_STATUSES.includes(status)) return err('Invalid booking status');
      const existing = await db.collection('bookings').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Booking not found', 404);
      await db.collection('bookings').updateOne(tenantFilter(session, { id }), { $set: { status, updatedAt: new Date().toISOString() } });
      if (status !== existing.status) {
        const msg = status === 'cancelled' ? `Booking ${existing.bookingNumber} cancelled`
          : status === 'confirmed' ? `Booking ${existing.bookingNumber} confirmed`
          : `Booking ${existing.bookingNumber} marked ${status.replace('_', ' ')}`;
        await logActivity(db, session, { type: status === 'cancelled' ? 'booking_cancelled' : status === 'confirmed' ? 'booking_confirmed' : 'status_changed', message: msg, refType: 'booking', refId: id });
      }
      const booking = await db.collection('bookings').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ booking });
    }

    if (path.startsWith('/bookings/')) {
      if (!can(session.role, 'bookings:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('bookings').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Booking not found', 404);
      const body = await readBody(request);
      const { value, error } = validateBookingCore(body);
      if (error) return err(error);
      const cust = await resolveQuotationCustomer(db, session, value.customerType, value.customerId);
      if (!cust) return err('Selected client or lead was not found');
      const totals = computeBookingTotals(body, value.serviceItems);
      const prevCount = (existing.serviceItems || []).length;
      const update = {
        customerType: value.customerType, customerId: value.customerId, customerName: cust.customerName, customerEmail: cust.customerEmail,
        destination: value.destination, startDate: value.startDate, endDate: value.endDate,
        adults: value.adults, children: value.children, nights: value.nights,
        quotationId: value.quotationId, packageId: value.packageId, itineraryId: value.itineraryId,
        serviceItems: value.serviceItems,
        subtotal: totals.subtotal, discount: totals.discount, discountAmount: totals.discountAmount,
        tax: totals.tax, taxAmount: totals.taxAmount, grandTotal: totals.grandTotal,
        internalCost: totals.internalCost, expectedProfit: totals.expectedProfit,
        notes: value.notes, updatedAt: new Date().toISOString(),
      };
      await db.collection('bookings').updateOne(tenantFilter(session, { id }), { $set: update });
      if (value.serviceItems.length > prevCount) {
        await logActivity(db, session, { type: 'booking_service_added', message: `Service added to booking ${existing.bookingNumber}`, refType: 'booking', refId: id });
      }
      const booking = await db.collection('bookings').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ booking });
    }

    // ---- Fleet: vehicle status / driver assignment / vehicle edit ----
    if (path.startsWith('/vehicles/') && path.endsWith('/status')) {
      if (!can(session.role, 'fleet:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const { status } = await readBody(request);
      if (!VEHICLE_STATUSES.includes(status)) return err('Invalid vehicle status');
      const existing = await db.collection('vehicles').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Vehicle not found', 404);
      await db.collection('vehicles').updateOne(tenantFilter(session, { id }), { $set: { status, updatedAt: new Date().toISOString() } });
      const vehicle = await db.collection('vehicles').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ vehicle });
    }

    if (path.startsWith('/vehicles/') && path.endsWith('/driver')) {
      if (!can(session.role, 'fleet:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('vehicles').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Vehicle not found', 404);
      const body = await readBody(request);
      let driverId = str(body.driverId, 80);
      if (driverId) { const d = await db.collection('drivers').findOne(tenantFilter(session, { id: driverId })); if (!d) driverId = ''; }
      await db.collection('vehicles').updateOne(tenantFilter(session, { id }), { $set: { currentDriverId: driverId, updatedAt: new Date().toISOString() } });
      await syncVehicleDriver(db, session, id, driverId, existing.currentDriverId);
      const vehicle = await db.collection('vehicles').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ vehicle });
    }

    if (path.startsWith('/vehicles/')) {
      if (!can(session.role, 'fleet:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('vehicles').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Vehicle not found', 404);
      const body = await readBody(request);
      const { value, error } = validateVehicleInput(body);
      if (error) return err(error);
      let currentDriverId = str(body.currentDriverId, 80);
      if (currentDriverId) { const dr = await db.collection('drivers').findOne(tenantFilter(session, { id: currentDriverId })); if (!dr) currentDriverId = ''; }
      await db.collection('vehicles').updateOne(tenantFilter(session, { id }), { $set: { ...value, currentDriverId, updatedAt: new Date().toISOString() } });
      if (currentDriverId !== (existing.currentDriverId || '')) await syncVehicleDriver(db, session, id, currentDriverId, existing.currentDriverId);
      const vehicle = await db.collection('vehicles').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ vehicle });
    }

    if (path.startsWith('/drivers/') && path.endsWith('/status')) {
      if (!can(session.role, 'fleet:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const { status } = await readBody(request);
      if (!DRIVER_STATUSES.includes(status)) return err('Invalid driver status');
      const existing = await db.collection('drivers').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Driver not found', 404);
      await db.collection('drivers').updateOne(tenantFilter(session, { id }), { $set: { status, updatedAt: new Date().toISOString() } });
      const driver = await db.collection('drivers').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ driver });
    }

    if (path.startsWith('/drivers/')) {
      if (!can(session.role, 'fleet:update')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('drivers').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Driver not found', 404);
      const body = await readBody(request);
      const { value, error } = validateDriverInput(body);
      if (error) return err(error);
      await db.collection('drivers').updateOne(tenantFilter(session, { id }), { $set: { ...value, updatedAt: new Date().toISOString() } });
      const driver = await db.collection('drivers').findOne(tenantFilter(session, { id }), { projection: { _id: 0 } });
      return json({ driver });
    }

    return err('not found', 404);
  } catch (e) {
    return err(e.message || 'server error', 500);
  }
}

// ---------------------------------------------------------------- DELETE
export async function DELETE(request, context) {
  const params = await context.params;
  const path = pathOf(params);
  try {
    const session = getSession(request);
    if (!session) return err('unauthenticated', 401);
    const db = await getDb();

    if (path.startsWith('/clients/')) {
      if (!can(session.role, 'clients:delete')) return err('forbidden', 403);
      const id = path.split('/')[2];
      // filter scoped by agencyId — cannot delete another agency's record.
      const r = await db.collection('clients').deleteOne(tenantFilter(session, { id }));
      if (r.deletedCount === 0) return err('not found', 404);
      return json({ ok: true });
    }

    if (path.startsWith('/leads/')) {
      if (!can(session.role, 'leads:delete')) return err('forbidden', 403);
      const r = await db.collection('leads').deleteOne(tenantFilter(session, { id: path.split('/')[2] }));
      if (r.deletedCount === 0) return err('not found', 404);
      return json({ ok: true });
    }

    if (path.startsWith('/followups/')) {
      if (!can(session.role, 'followups:delete')) return err('forbidden', 403);
      const r = await db.collection('followUps').deleteOne(tenantFilter(session, { id: path.split('/')[2] }));
      if (r.deletedCount === 0) return err('not found', 404);
      return json({ ok: true });
    }

    if (path.startsWith('/tasks/')) {
      if (!can(session.role, 'tasks:delete')) return err('forbidden', 403);
      const r = await db.collection('tasks').deleteOne(tenantFilter(session, { id: path.split('/')[2] }));
      if (r.deletedCount === 0) return err('not found', 404);
      return json({ ok: true });
    }

    // Quotations: only DRAFT quotations may be deleted.
    if (path.startsWith('/quotations/')) {
      if (!can(session.role, 'quotations:delete')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('quotations').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Quotation not found', 404);
      if (existing.status !== 'draft') return err('Only draft quotations can be deleted');
      await db.collection('quotations').deleteOne(tenantFilter(session, { id }));
      return json({ ok: true });
    }

    // Packages: only DRAFT packages may be deleted (also removes its itinerary).
    if (path.startsWith('/packages/')) {
      if (!can(session.role, 'packages:delete')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('packages').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Package not found', 404);
      if (existing.status !== 'draft') return err('Only draft packages can be deleted');
      await db.collection('packages').deleteOne(tenantFilter(session, { id }));
      await db.collection('itineraries').deleteMany(tenantFilter(session, { packageId: id }));
      return json({ ok: true });
    }

    if (path.startsWith('/itineraries/')) {
      if (!can(session.role, 'itineraries:delete')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('itineraries').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Itinerary not found', 404);
      await db.collection('itineraries').deleteOne(tenantFilter(session, { id }));
      await db.collection('packages').updateOne(tenantFilter(session, { id: existing.packageId }), { $set: { itineraryId: '', updatedAt: new Date().toISOString() } });
      return json({ ok: true });
    }

    if (path.startsWith('/suppliers/')) {
      if (!can(session.role, 'suppliers:delete')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('suppliers').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Supplier not found', 404);
      await db.collection('suppliers').deleteOne(tenantFilter(session, { id }));
      await logActivity(db, session, { type: 'supplier_deleted', message: `Supplier "${existing.name}" removed`, refType: 'supplier', refId: id });
      return json({ ok: true });
    }

    // Bookings: only DRAFT or CANCELLED bookings may be deleted (protect active operations).
    if (path.startsWith('/bookings/')) {
      if (!can(session.role, 'bookings:delete')) return err('forbidden', 403);
      const id = path.split('/')[2];
      const existing = await db.collection('bookings').findOne(tenantFilter(session, { id }));
      if (!existing) return err('Booking not found', 404);
      if (existing.status !== 'draft' && existing.status !== 'cancelled') return err('Only draft or cancelled bookings can be deleted. Cancel the booking first.');
      await db.collection('bookings').deleteOne(tenantFilter(session, { id }));
      await logActivity(db, session, { type: 'booking_deleted', message: `Booking ${existing.bookingNumber} deleted`, refType: 'booking', refId: id });
      return json({ ok: true });
    }

    return err('not found', 404);
  } catch (e) {
    return err(e.message || 'server error', 500);
  }
}
