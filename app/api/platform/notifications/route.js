import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { getPlatformSession } from '@/lib/auth';
import { canPlatform } from '@/lib/platform-rbac';

const json = (data, status = 200) => NextResponse.json(data, { status });
const error = (message, status = 400) => json({ error: message }, status);

async function adminContext(request) {
  const admin = getPlatformSession(request);
  if (!admin) return { response: error('unauthenticated', 401) };
  if (admin.mcp) return { response: error('password change required', 403) };
  if (!canPlatform(admin.role, 'notifications:manage')) return { response: error('forbidden', 403) };
  return { admin, db: await getDb() };
}

export async function GET(request) {
  try {
    const ctx = await adminContext(request);
    if (ctx.response) return ctx.response;
    const { db } = ctx;
    const [total, unread, recent] = await Promise.all([
      db.collection('notifications').countDocuments({ source: 'platform' }),
      db.collection('notifications').countDocuments({ source: 'platform', readAt: null }),
      db.collection('notifications').find({ source: 'platform' }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(30).toArray(),
    ]);
    return json({ stats: { total, unread }, notifications: recent });
  } catch (e) {
    console.error('[platform notifications] GET failed:', e.message);
    return error('Unable to load notification activity', 500);
  }
}

export async function POST(request) {
  try {
    const ctx = await adminContext(request);
    if (ctx.response) return ctx.response;
    const { admin, db } = ctx;
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim().slice(0, 120);
    const message = String(body.message || '').trim().slice(0, 2000);
    const priority = ['low', 'normal', 'high', 'critical'].includes(body.priority) ? body.priority : 'normal';
    const category = ['announcement', 'system', 'billing', 'security', 'maintenance'].includes(body.category) ? body.category : 'announcement';
    if (!title || !message) return error('A title and message are required');

    const userQuery = { status: { $ne: 'suspended' } };
    const agencyIds = Array.isArray(body.agencyIds) ? [...new Set(body.agencyIds.map(String).filter(Boolean))].slice(0, 200) : [];
    const userIds = Array.isArray(body.userIds) ? [...new Set(body.userIds.map(String).filter(Boolean))].slice(0, 500) : [];
    const role = ['owner', 'manager', 'agent', 'finance'].includes(body.role) ? body.role : '';
    if (userIds.length) userQuery.id = { $in: userIds };
    else if (agencyIds.length) userQuery.agencyId = { $in: agencyIds };
    else if (role) userQuery.role = role;
    else if (body.audience !== 'all') return error('Choose all users, an agency, a role, or selected users');

    const recipients = await db.collection('users').find(userQuery, { projection: { _id: 0, id: 1, agencyId: 1 } }).limit(5000).toArray();
    if (!recipients.length) return error('No matching active recipients were found', 404);
    const now = new Date().toISOString();
    const actionUrl = typeof body.actionUrl === 'string' && body.actionUrl.startsWith('/') ? body.actionUrl.slice(0, 300) : '';
    const docs = recipients.map((u) => ({
      id: uuidv4(), userId: u.id, agencyId: u.agencyId, source: 'platform',
      title, message, category, priority, actionUrl, readAt: null,
      createdAt: now, updatedAt: now, createdBy: admin.adminId,
    }));
    await db.collection('notifications').insertMany(docs, { ordered: false });
    return json({ ok: true, sent: docs.length, notification: { title, category, priority, createdAt: now } }, 201);
  } catch (e) {
    console.error('[platform notifications] POST failed:', e.message);
    return error('Unable to send notification', 500);
  }
}
