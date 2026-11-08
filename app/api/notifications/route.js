import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const json = (data, status = 200) => NextResponse.json(data, { status });
const error = (message, status = 400) => json({ error: message }, status);

async function context(request) {
  const session = getSession(request);
  if (!session?.userId || !session?.agencyId) return { response: error('unauthenticated', 401) };
  return { session, db: await getDb() };
}

export async function GET(request) {
  try {
    const ctx = await context(request);
    if (ctx.response) return ctx.response;
    const { session, db } = ctx;
    const sp = new URL(request.url).searchParams;
    const limit = Math.min(50, Math.max(1, Number(sp.get('limit')) || 20));
    const unreadOnly = sp.get('unread') === 'true';
    const query = { userId: session.userId, agencyId: session.agencyId };
    if (unreadOnly) query.readAt = null;
    const [items, unread] = await Promise.all([
      db.collection('notifications').find(query, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray(),
      db.collection('notifications').countDocuments({ userId: session.userId, agencyId: session.agencyId, readAt: null }),
    ]);
    return json({ notifications: items, unreadCount: unread });
  } catch (e) {
    console.error('[notifications] GET failed:', e.message);
    return error('Unable to load notifications', 500);
  }
}

export async function PATCH(request) {
  try {
    const ctx = await context(request);
    if (ctx.response) return ctx.response;
    const { session, db } = ctx;
    const body = await request.json().catch(() => ({}));
    const base = { userId: session.userId, agencyId: session.agencyId };
    const now = new Date().toISOString();
    if (body.markAllRead === true) {
      await db.collection('notifications').updateMany({ ...base, readAt: null }, { $set: { readAt: now, updatedAt: now } });
      return json({ ok: true });
    }
    const id = String(body.id || '');
    if (!id) return error('Notification id is required');
    const result = await db.collection('notifications').updateOne({ ...base, id }, { $set: { readAt: now, updatedAt: now } });
    return result.matchedCount ? json({ ok: true }) : error('Notification not found', 404);
  } catch (e) {
    console.error('[notifications] PATCH failed:', e.message);
    return error('Unable to update notification', 500);
  }
}

export async function DELETE(request) {
  try {
    const ctx = await context(request);
    if (ctx.response) return ctx.response;
    const { session, db } = ctx;
    const sp = new URL(request.url).searchParams;
    const base = { userId: session.userId, agencyId: session.agencyId };
    if (sp.get('all') === 'true') {
      await db.collection('notifications').deleteMany(base);
      return json({ ok: true });
    }
    const id = String(sp.get('id') || '');
    if (!id) return error('Notification id is required');
    const result = await db.collection('notifications').deleteOne({ ...base, id });
    return result.deletedCount ? json({ ok: true }) : error('Notification not found', 404);
  } catch (e) {
    console.error('[notifications] DELETE failed:', e.message);
    return error('Unable to delete notification', 500);
  }
}
