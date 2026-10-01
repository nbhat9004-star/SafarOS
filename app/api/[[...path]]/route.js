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

    return err('not found', 404);
  } catch (e) {
    return err(e.message || 'server error', 500);
  }
}
