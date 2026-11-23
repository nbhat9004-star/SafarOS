import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { tenantFilter, withAgency } from '@/lib/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGE = 2000;
const publicRate = new Map();

function json(data, status = 200, origin = '') {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return NextResponse.json(data, { status, headers });
}
function hash(value) { return createHash('sha256').update(String(value)).digest('hex'); }
function clean(value, max = 160) { return String(value || '').trim().slice(0, max); }
function originOf(request) {
  const origin = request.headers.get('origin');
  if (origin) { try { return new URL(origin).origin; } catch { return ''; } }
  const referer = request.headers.get('referer');
  if (referer) { try { return new URL(referer).origin; } catch { return ''; } }
  return '';
}
function rateAllowed(key) {
  const now = Date.now();
  const current = publicRate.get(key);
  if (!current || now - current.startedAt > 60000) {
    publicRate.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= 30;
}
async function publicAgency(db, slug, origin) {
  const agency = await db.collection('agencies').findOne({ slug }, { projection: { _id: 0, id: 1, slug: 1, name: 1 } });
  if (!agency) return { error: 'This agency chat is unavailable', status: 404 };
  const integration = await db.collection('communicationIntegrations').findOne(
    { agencyId: agency.id, id: 'website_chat' },
    { projection: { _id: 0, config: 1, status: 1 } }
  );
  let allowed = '';
  try { allowed = new URL(integration?.config?.websiteUrl || '').origin; } catch {}
  if (!allowed || !origin || origin !== allowed) return { error: 'This website is not authorized to use this chat', status: 403 };
  return { agency, integration };
}
async function publicPost(request, body, db) {
  const origin = originOf(request);
  const slug = clean(body.agencySlug, 100);
  const resolved = await publicAgency(db, slug, origin);
  if (resolved.error) return json({ error: resolved.error }, resolved.status, origin);
  const { agency } = resolved;
  const ip = clean(request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown', 80);
  const action = clean(body.action || 'start', 20);
  // Polling for replies should not consume the visitor's message-send allowance.
  if (action !== 'history' && !rateAllowed(agency.id + ':' + hash(ip))) {
    return json({ error: 'Please wait a moment before sending another message.' }, 429, origin);
  }
  const visitorToken = clean(body.visitorToken, 128);
  const conversationId = clean(body.conversationId, 80);
  const visitorId = clean(body.visitorId, 100);
  const conversations = db.collection('websiteChatConversations');
  const messages = db.collection('websiteChatMessages');
  let conversation = null;

  if (visitorToken && conversationId) {
    conversation = await conversations.findOne({
      agencyId: agency.id, id: conversationId, visitorTokenHash: hash(visitorToken),
    }, { projection: { _id: 0 } });
  }

  if (action === 'start') {
    if (!conversation) {
      const token = randomBytes(32).toString('hex');
      const now = new Date().toISOString();
      const id = randomUUID();
      conversation = {
        id, agencyId: agency.id, visitorId: visitorId || randomUUID(),
        visitorTokenHash: hash(token), visitorName: clean(body.visitorName, 80) || 'Website visitor',
        visitorEmail: clean(body.visitorEmail, 160), pageUrl: clean(body.pageUrl, 500),
        packageId: clean(body.packageId, 100), packageName: clean(body.packageName, 180),
        status: 'open', unreadCount: 0, lastMessagePreview: '', lastMessageAt: now,
        createdAt: now, updatedAt: now,
      };
      await conversations.insertOne(conversation);
      return json({ conversationId: id, visitorToken: token, messages: [] }, 200, origin);
    }
    const history = await messages.find({ agencyId: agency.id, conversationId: conversation.id }, { projection: { _id: 0, id: 1, direction: 1, text: 1, createdAt: 1 } }).sort({ createdAt: 1 }).limit(100).toArray();
    return json({ conversationId: conversation.id, visitorToken, messages: history }, 200, origin);
  }

  if (!conversation) return json({ error: 'Chat session expired. Please reopen the chat.' }, 401, origin);

  if (action === 'history') {
    const history = await messages.find({ agencyId: agency.id, conversationId: conversation.id }, { projection: { _id: 0, id: 1, direction: 1, text: 1, createdAt: 1 } }).sort({ createdAt: 1 }).limit(100).toArray();
    return json({ messages: history }, 200, origin);
  }

  if (action === 'send') {
    const text = clean(body.message, MAX_MESSAGE);
    if (!text) return json({ error: 'Write a message first' }, 400, origin);
    const now = new Date().toISOString();
    await messages.insertOne({
      id: randomUUID(), agencyId: agency.id, conversationId: conversation.id,
      direction: 'inbound', text, source: 'website', createdAt: now,
    });
    await conversations.updateOne(
      { agencyId: agency.id, id: conversation.id },
      { $set: { lastMessagePreview: text.slice(0, 180), lastMessageAt: now, updatedAt: now, pageUrl: clean(body.pageUrl, 500) },
        $inc: { unreadCount: 1 } }
    );
    return json({ success: true }, 200, origin);
  }
  return json({ error: 'Unsupported chat action' }, 400, origin);
}

export async function OPTIONS(request) {
  const origin = originOf(request);
  return new NextResponse(null, { status: 204, headers: {
    ...(origin ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
  }});
}

export async function GET(request) {
  const session = getSession(request);
  if (!session?.agencyId) return json({ error: 'Authentication required' }, 401);
  if (!can(session.role, 'communications:read')) return json({ error: 'Forbidden' }, 403);
  const db = await getDb();
  const id = clean(new URL(request.url).searchParams.get('conversationId'), 80);
  if (id) {
    const conversation = await db.collection('websiteChatConversations').findOne(
      tenantFilter(session, { id }), { projection: { _id: 0, visitorTokenHash: 0 } }
    );
    if (!conversation) return json({ error: 'Website conversation not found' }, 404);
    const rows = await db.collection('websiteChatMessages').find(
      tenantFilter(session, { conversationId: id }), { projection: { _id: 0 } }
    ).sort({ createdAt: 1 }).limit(200).toArray();
    await db.collection('websiteChatConversations').updateOne(
      tenantFilter(session, { id }), { $set: { unreadCount: 0, lastReadAt: new Date().toISOString() } }
    );
    return json({ conversation, messages: rows });
  }
  const rows = await db.collection('websiteChatConversations').find(
    tenantFilter(session), { projection: { _id: 0, visitorTokenHash: 0 } }
  ).sort({ lastMessageAt: -1 }).limit(100).toArray();
  return json({ conversations: rows });
}

export async function POST(request) {
  let body;
  try {
    if (Number(request.headers.get('content-length') || 0) > 12000) return json({ error: 'Request too large' }, 413);
    body = await request.json();
  } catch { return json({ error: 'A valid JSON request is required' }, 400); }

  const session = getSession(request);
  if (!session?.agencyId) {
    try { return await publicPost(request, body || {}, await getDb()); }
    catch (error) {
      console.error('[website-chat] public request failed:', String(error?.message || 'unknown').slice(0, 120));
      return json({ error: 'Website chat is temporarily unavailable' }, 500, originOf(request));
    }
  }

  if (!can(session.role, 'communications:update')) return json({ error: 'Forbidden' }, 403);
  const action = clean(body.action, 20);
  if (action !== 'reply') return json({ error: 'Unsupported action' }, 400);
  const conversationId = clean(body.conversationId, 80);
  const text = clean(body.message, MAX_MESSAGE);
  if (!conversationId || !text) return json({ error: 'Choose a conversation and write a reply' }, 400);
  const db = await getDb();
  const conversation = await db.collection('websiteChatConversations').findOne(
    tenantFilter(session, { id: conversationId }), { projection: { _id: 0, id: 1 } }
  );
  if (!conversation) return json({ error: 'Website conversation not found' }, 404);
  const now = new Date().toISOString();
  const message = withAgency(session, {
    id: randomUUID(), conversationId, direction: 'outbound', text,
    source: 'agency', senderId: session.userId, senderName: session.name || '', createdAt: now,
  });
  await db.collection('websiteChatMessages').insertOne(message);
  await db.collection('websiteChatConversations').updateOne(
    tenantFilter(session, { id: conversationId }),
    { $set: { lastMessagePreview: text.slice(0, 180), lastMessageAt: now, updatedAt: now, status: 'open' } }
  );
  return json({ message: { id: message.id, direction: message.direction, text, createdAt: now } });
}
