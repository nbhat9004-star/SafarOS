// SafarOS integration endpoints for SafarCurated.
// Server-to-server (HMAC-signed by SafarOS): ping, connection, agency/link, listings/upsert, listings/unpublish, listings/status
// Browser (agency-scoped cookie, issued from a signed SafarOS SSO ticket): sso, me, me/listings/:id/unpublish, me/confirm-link, me/logout
// Uses the existing `users` and `listings` collections; new listings always enter the existing moderation queue as 'pending'.
import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getCollection } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  verifySignedRequest, claimEvent, completeEvent, getState, setState, ensureIntegrationIndexes, rateLimited,
  verifyTicket, signAgencySession, getAgencySession, setAgencyCookie, publicListingUrl, normaliseListing, AGENCY_COOKIE,
} from '@/lib/safaros-integration';

export const dynamic = 'force-dynamic';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const fail = (error, status = 400) => json({ error }, status);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Content changes that must go back through SafarCurated moderation when a listing is already approved.
const MODERATED_FIELDS = ['title', 'description', 'location', 'images'];

function listingStatusView(l) {
  return { id: l.id, externalId: l.source?.externalId || '', status: l.status, rejectionReason: l.rejectionReason || '', publicUrl: l.status === 'approved' ? publicListingUrl(l.id) : '' };
}

async function linkFor(agencyId) {
  return (await getCollection('safarosAgencyLinks')).findOne({ safarosAgencyId: String(agencyId || '') }, { projection: { _id: 0 } });
}

// ------------------------- signed server-to-server -------------------------
async function handleSigned(path, body) {
  const listings = await getCollection('listings');
  const links = await getCollection('safarosAgencyLinks');

  if (path === 'ping') return [200, { ok: true, service: 'safarcurated' }];
  if (path === 'connection') {
    const connected = body.state === 'connected';
    await setState(connected);
    const [linkCount, listingCount] = await Promise.all([
      links.countDocuments({ status: 'linked' }),
      listings.countDocuments({ 'source.system': 'safaros' }),
    ]);
    return [200, { ok: true, connected, links: linkCount, listings: listingCount }];
  }

  const state = await getState();
  if (!state.connected) return [409, { error: 'SafarOS integration is disconnected' }];
  const agencyId = String(body.agencyId || '');
  if (!/^[A-Za-z0-9-]{8,80}$/.test(agencyId)) return [400, { error: 'agencyId is required' }];

  if (path === 'agency/link') {
    const existing = await linkFor(agencyId);
    const agencyName = String(body.agencyName || '').trim().slice(0, 160);
    if (existing) {
      if (agencyName) await links.updateOne({ safarosAgencyId: agencyId }, { $set: { agencyName, updatedAt: new Date() } });
      return [200, { link: { status: existing.status, profileUrl: '' } }];
    }
    const email = String(body.owner?.email || '').toLowerCase().trim();
    if (!EMAIL_RE.test(email)) return [400, { error: 'A valid owner email is required' }];
    const users = await getCollection('users');
    const user = await users.findOne({ email }, { projection: { passwordHash: 0 } });
    const now = new Date();
    if (user) {
      if (['admin', 'super_admin', 'co_curator'].includes(user.role)) return [409, { error: 'This email belongs to a SafarCurated staff account and cannot be linked to an agency' }];
      if (await links.findOne({ hostUserId: user.id })) return [409, { error: 'This SafarCurated account is already linked to another agency' }];
      // Existing account: ownership must be proven by signing in on SafarCurated (see me/confirm-link). No access until then.
      await links.insertOne({ id: uuid(), safarosAgencyId: agencyId, agencyName, hostUserId: user.id, email, status: 'pending_confirmation', createdAt: now, updatedAt: now });
      return [200, { link: { status: 'pending_confirmation', profileUrl: '' } }];
    }
    // New operator identity: password-less host account, accessed only via SafarOS SSO (no password hashes shared).
    const hostUser = {
      id: uuid(), name: String(body.owner?.name || agencyName || 'Agency').trim().slice(0, 120), email, role: 'host',
      passwordHash: null, authProvider: 'safaros', safarosAgencyId: agencyId, businessName: agencyName,
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(agencyName || email)}&backgroundColor=0F3D2E`,
      emailVerified: false, createdAt: now, updatedAt: now,
    };
    try { await users.insertOne(hostUser); } catch (e) { if (e?.code === 11000) return [409, { error: 'Account creation conflict, please retry' }]; throw e; }
    await links.insertOne({ id: uuid(), safarosAgencyId: agencyId, agencyName, hostUserId: hostUser.id, email, status: 'linked', createdAt: now, updatedAt: now, linkedAt: now });
    return [200, { link: { status: 'linked', profileUrl: '' } }];
  }

  const link = await linkFor(agencyId);
  if (path === 'listings/status') {
    const rows = await listings.find({ 'source.system': 'safaros', 'source.agencyId': agencyId }, { projection: { _id: 0, id: 1, status: 1, rejectionReason: 1, source: 1 } }).toArray();
    return [200, { link: link ? { status: link.status } : null, listings: rows.map(listingStatusView) }];
  }
  if (!link || link.status !== 'linked') return [403, { error: 'Agency is not linked to SafarCurated' }];

  if (path === 'listings/upsert') {
    const { value, error } = normaliseListing(body.listing || {});
    if (error) return [400, { error }];
    const host = await (await getCollection('users')).findOne({ id: link.hostUserId }, { projection: { _id: 0, id: 1, name: 1, avatar: 1, businessName: 1 } });
    if (!host) return [409, { error: 'Linked SafarCurated operator account not found' }];
    const now = new Date();
    const existing = await listings.findOne({ 'source.system': 'safaros', 'source.externalId': value.externalId });
    if (existing && existing.source?.agencyId !== agencyId) return [403, { error: 'Listing belongs to another agency' }];
    const content = { title: value.title, description: value.description, location: value.location, price: value.price, images: value.images, duration: value.duration, categoryDetails: value.categoryDetails };
    if (!existing) {
      const doc = {
        id: uuid(), ...content, category: 'tour', subcategory: 'package',
        hostId: host.id, hostName: link.agencyName || host.businessName || host.name, hostAvatar: host.avatar || null,
        superhost: false, amenities: [], services: [], badge: null, rating: 0, reviews: 0,
        status: 'pending', featured: false, isDemo: false,
        inventoryTypes: [{ id: uuid(), name: 'Seat', description: 'Per traveller', price: value.price, quantity: value.seats, available: value.seats, images: [], status: 'active', displayOrder: 0, beds: null, guests: 1, amenities: [] }],
        source: { system: 'safaros', agencyId, externalId: value.externalId, syncedAt: now },
        createdAt: now, updatedAt: now,
      };
      try { await listings.insertOne(doc); } catch (e) {
        if (e?.code === 11000) return [409, { error: 'Listing already exists for this package, retry to update' }];
        throw e;
      }
      return [201, { listing: listingStatusView(doc) }];
    }
    const set = { ...content, updatedAt: now, 'source.syncedAt': now };
    const contentChanged = MODERATED_FIELDS.some((f) => JSON.stringify(existing[f]) !== JSON.stringify(content[f]));
    // Never bypass moderation: resubmissions and moderated-content edits go back to 'pending'.
    if (['unpublished', 'rejected'].includes(existing.status) || (existing.status === 'approved' && contentChanged)) set.status = 'pending';
    const seatType = (existing.inventoryTypes || []).find((t) => t.name === 'Seat') || (existing.inventoryTypes || [])[0];
    if (seatType) {
      const delta = value.seats - (Number(seatType.quantity) || 0);
      set.inventoryTypes = existing.inventoryTypes.map((t) => (t.id === seatType.id
        ? { ...t, price: value.price, quantity: value.seats, available: Math.max(0, (Number(t.available) || 0) + delta) } : t));
    }
    const update = { $set: set };
    if (set.status === 'pending' && existing.status === 'rejected') update.$unset = { rejectionReason: '' };
    await listings.updateOne({ id: existing.id, 'source.agencyId': agencyId }, update);
    return [200, { listing: listingStatusView({ ...existing, ...set, rejectionReason: update.$unset ? '' : existing.rejectionReason }) }];
  }
  if (path === 'listings/unpublish') {
    const externalId = String(body.externalId || '');
    const l = await listings.findOne({ 'source.system': 'safaros', 'source.externalId': externalId, 'source.agencyId': agencyId });
    if (!l) return [404, { error: 'Listing not found' }];
    await listings.updateOne({ id: l.id, 'source.agencyId': agencyId }, { $set: { status: 'unpublished', unpublishedAt: new Date(), updatedAt: new Date() } });
    return [200, { listing: listingStatusView({ ...l, status: 'unpublished' }) }];
  }
  return [404, { error: 'Not found' }];
}

// ------------------------- agency-scoped browser session -------------------------
async function handleAgency(request, path, method) {
  if (path === 'sso' && method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch { /* empty */ }
    const t = verifyTicket(body.ticket);
    if (!t) return fail('This sign-in link is invalid or has expired. Open it again from SafarOS.', 401);
    if (!(await getState()).connected) return fail('The SafarOS connection is currently disabled.', 409);
    const claim = await claimEvent(`sso:${t.jti}`, 'sso');
    if (!claim.fresh) return fail('This sign-in link has already been used. Open it again from SafarOS.', 401);
    const link = await linkFor(t.agencyId);
    if (!link) { await completeEvent(`sso:${t.jti}`, 403, {}); return fail('Agency is not linked to SafarCurated', 403); }
    await completeEvent(`sso:${t.jti}`, 200, { ok: true });
    return setAgencyCookie(json({ ok: true }), signAgencySession(t));
  }

  const s = getAgencySession(request);
  if (!s) return fail('Session expired. Open the SafarCurated dashboard from SafarOS again.', 401);
  if (path === 'me/logout' && method === 'POST') {
    const res = json({ ok: true }); res.cookies.set(AGENCY_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 }); return res;
  }
  const link = await linkFor(s.agencyId);
  if (!link) return fail('Agency is not linked to SafarCurated', 403);
  const state = await getState();
  const listings = await getCollection('listings');
  // Tenant scope for everything below: this agency's own SafarOS listings on its linked host account only.
  const scope = { 'source.system': 'safaros', 'source.agencyId': s.agencyId, hostId: link.hostUserId };

  if (path === 'me' && method === 'GET') {
    const rows = link.status === 'linked'
      ? await listings.find(scope, { projection: { _id: 0, id: 1, title: 1, status: 1, rejectionReason: 1, price: 1, location: 1, images: { $slice: 1 }, duration: 1, updatedAt: 1, source: 1 } }).sort({ updatedAt: -1 }).limit(200).toArray()
      : [];
    const counts = { pending: 0, approved: 0, rejected: 0, unpublished: 0 };
    rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    const maskedEmail = link.email ? link.email.replace(/^(.).*(@.*)$/, '$1***$2') : '';
    return json({
      connected: Boolean(state.connected), agency: { name: link.agencyName || '', linkStatus: link.status, email: maskedEmail },
      operator: { name: s.name, role: s.role }, returnUrl: s.returnUrl || '', counts,
      listings: rows.map((r) => ({ id: r.id, externalId: r.source?.externalId, title: r.title, status: r.status, rejectionReason: r.rejectionReason || '', price: r.price, location: r.location, image: r.images?.[0] || '', duration: r.duration, updatedAt: r.updatedAt, publicUrl: r.status === 'approved' ? publicListingUrl(r.id) : '' })),
    });
  }
  if (!state.connected) return fail('The SafarOS connection is currently disabled by the platform administrator.', 409);
  if (!['owner', 'manager'].includes(s.role)) return fail('Your SafarOS role cannot change marketplace listings', 403);

  if (path === 'me/confirm-link' && method === 'POST') {
    if (link.status !== 'pending_confirmation') return fail('Nothing to confirm');
    if (s.role !== 'owner') return fail('Only the agency owner can confirm the link', 403);
    const me = await getCurrentUser(request); // the user's own SafarCurated login proves ownership
    if (!me || me.id !== link.hostUserId) return fail('Sign in to SafarCurated with the account that uses this email, then confirm.', 403);
    const users = await getCollection('users');
    const set = { safarosAgencyId: s.agencyId, updatedAt: new Date() };
    if (me.role === 'traveler') set.role = 'host'; // explicit, confirmed upgrade to operator
    await users.updateOne({ id: me.id }, { $set: set });
    await (await getCollection('safarosAgencyLinks')).updateOne({ safarosAgencyId: s.agencyId, status: 'pending_confirmation' }, { $set: { status: 'linked', linkedAt: new Date(), updatedAt: new Date() } });
    return json({ ok: true });
  }
  const m = path.match(/^me\/listings\/([A-Za-z0-9-]{8,80})\/unpublish$/);
  if (m && method === 'POST') {
    const r = await listings.updateOne({ ...scope, id: m[1], status: { $in: ['pending', 'approved'] } }, { $set: { status: 'unpublished', unpublishedAt: new Date(), updatedAt: new Date() } });
    if (!r.matchedCount) return fail('Listing not found', 404);
    return json({ ok: true });
  }
  return fail('Not found', 404);
}

async function handler(request, { params }) {
  const segs = Array.isArray(params?.path) ? params.path : [];
  const path = segs.join('/');
  const method = request.method;
  try {
    await ensureIntegrationIndexes();
    if (path === 'sso' || path.startsWith('me')) return await handleAgency(request, path, method);
    if (method !== 'POST') return fail('Method not allowed', 405);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (rateLimited(`s2s:${ip}`)) return fail('Too many requests', 429);
    const v = await verifySignedRequest(request);
    if (!v.ok) return fail(v.error, v.status);
    const claim = await claimEvent(v.eventId, path);
    if (!claim.fresh) {
      if (claim.inProgress) return fail('Event is already being processed', 409);
      return json(claim.response || {}, claim.status || 200); // duplicate delivery: replay stored result
    }
    let status = 500; let resBody = { error: 'Internal error' };
    try { [status, resBody] = await handleSigned(path, v.body || {}); } finally { await completeEvent(v.eventId, status, resBody); }
    return json(resBody, status);
  } catch (e) {
    console.error('[safaros-integration]', path, e?.message);
    return fail('Internal error', 500);
  }
}

export const GET = handler;
export const POST = handler;
