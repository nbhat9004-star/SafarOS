import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

function verifyMetaSignature(rawBody, signature, appSecret) {
  if (!signature || !/^sha256=[a-f0-9]{64}$/i.test(signature) || !appSecret) return false;
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`;
  return constantTimeEqual(signature.toLowerCase(), expected.toLowerCase());
}

function extractMessageText(message) {
  if (message?.text?.body) return String(message.text.body).slice(0, 4000);
  if (message?.button?.text) return String(message.button.text).slice(0, 1000);
  if (message?.interactive?.button_reply?.title) return String(message.interactive.button_reply.title).slice(0, 1000);
  if (message?.interactive?.list_reply?.title) return String(message.interactive.list_reply.title).slice(0, 1000);
  if (message?.image?.caption) return String(message.image.caption).slice(0, 1000);
  if (message?.document?.caption) return String(message.document.caption).slice(0, 1000);
  return '';
}

function messageType(message) {
  const allowed = ['text', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'sticker', 'interactive', 'button'];
  return allowed.includes(message?.type) ? message.type : 'unknown';
}

function eventKey(phoneNumberId, item, kind) {
  if (kind === 'message' && item?.id) return `message:${phoneNumberId}:${item.id}`;
  if (kind === 'status' && item?.id) return `status:${phoneNumberId}:${item.id}:${item.status || 'unknown'}:${item.timestamp || ''}`;
  return `payload:${createHash('sha256').update(JSON.stringify(item || {})).digest('hex')}`;
}

async function processMessage(db, connection, metadata, message, contactProfile) {
  const agencyId = connection.agencyId;
  const waId = String(message?.from || '').trim();
  const metaMessageId = String(message?.id || '').trim();
  if (!waId || !metaMessageId) throw new Error('Inbound WhatsApp message is missing its sender or Meta message ID.');

  const now = new Date().toISOString();
  const contactId = randomUUID();
  const displayName = String(contactProfile?.profile?.name || '').slice(0, 160);
  await db.collection('whatsappContacts').updateOne(
    { agencyId, waId },
    { $setOnInsert: { id: contactId, agencyId, waId, phone: waId, consentStatus: 'unknown', optOut: false, createdAt: now },
      $set: { ...(displayName ? { displayName } : {}), lastInboundAt: now, updatedAt: now } },
    { upsert: true },
  );
  const contact = await db.collection('whatsappContacts').findOne({ agencyId, waId }, { projection: { _id: 0, id: 1 } });
  const text = extractMessageText(message);
  const inserted = await db.collection('whatsappMessages').updateOne(
    { agencyId, metaMessageId },
    { $setOnInsert: {
      id: randomUUID(), agencyId, connectionId: connection.id, contactId: contact.id,
      waId, direction: 'inbound', type: messageType(message), text,
      metaMessageId, status: 'received', source: 'meta_webhook', createdAt: now,
      ...(message?.timestamp ? { metaTimestamp: String(message.timestamp) } : {}),
    } },
    { upsert: true },
  );
  if (inserted.upsertedCount) {
    const preview = text || `[${messageType(message)} message]`;
    await db.collection('whatsappConversations').updateOne(
      { agencyId, connectionId: connection.id, waId },
      { $setOnInsert: {
          id: randomUUID(), agencyId, connectionId: connection.id, contactId, waId,
          status: 'open', unreadCount: 0, createdAt: now,
        },
        $set: { lastInboundAt: now, lastMessageAt: now, lastMessagePreview: preview.slice(0, 180), updatedAt: now },
        $inc: { unreadCount: 1 },
      },
      { upsert: true },
    );
  }
}

async function processStatus(db, connection, status) {
  const metaMessageId = String(status?.id || '').trim();
  if (!metaMessageId) return;
  await db.collection('whatsappMessages').updateOne(
    { agencyId: connection.agencyId, metaMessageId },
    { $set: {
      status: String(status.status || 'unknown').slice(0, 40),
      ...(status.timestamp ? { statusTimestamp: String(status.timestamp) } : {}),
      ...(status.errors?.[0]?.code ? { failureCode: String(status.errors[0].code).slice(0, 80) } : {}),
      updatedAt: new Date().toISOString(),
    } },
  );
}

async function processItem(db, connection, phoneNumberId, item, kind, contactProfile) {
  const key = eventKey(phoneNumberId, item, kind);
  const events = db.collection('whatsappWebhookEvents');
  const now = new Date().toISOString();
  await events.updateOne(
    { eventKey: key },
    { $setOnInsert: {
      id: randomUUID(), eventKey: key, phoneNumberId,
      agencyId: connection?.agencyId || null, eventType: kind,
      processingStatus: 'received', receivedAt: now,
    } },
    { upsert: true },
  );
  const event = await events.findOne({ eventKey: key }, { projection: { _id: 0, processingStatus: 1 } });
  if (event?.processingStatus === 'processed') return;
  if (!connection) {
    await events.updateOne({ eventKey: key }, { $set: { processingStatus: 'unmapped', processedAt: now } });
    return;
  }
  if (kind === 'message') await processMessage(db, connection, { phoneNumberId }, item, contactProfile);
  else await processStatus(db, connection, item);
  await events.updateOne({ eventKey: key }, { $set: { processingStatus: 'processed', processedAt: new Date().toISOString() } });
}

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode') || url.searchParams.get('hub[mode]');
  const token = url.searchParams.get('hub.verify_token') || url.searchParams.get('hub[verify_token]');
  const challenge = url.searchParams.get('hub.challenge') || url.searchParams.get('hub[challenge]');
  const expected = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
  if (mode !== 'subscribe' || !expected || !constantTimeEqual(token, expected) || !challenge) {
    return new Response('Forbidden', { status: 403 });
  }
  return new Response(challenge, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}

export async function POST(request) {
  const rawBody = await request.text();
  if (!rawBody || rawBody.length > 1024 * 1024) return json({ error: 'Invalid webhook payload.' }, 400);
  if (!verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'), process.env.META_APP_SECRET || '')) {
    return json({ error: 'Invalid webhook signature.' }, 401);
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return json({ error: 'Invalid JSON payload.' }, 400); }
  if (payload?.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) {
    return json({ received: true, ignored: true });
  }

  try {
    const db = await getDb();
    await Promise.all([
      db.collection('whatsappWebhookEvents').createIndex({ eventKey: 1 }, { unique: true, name: 'whatsapp_webhook_event_unique' }),
      db.collection('whatsappContacts').createIndex({ agencyId: 1, waId: 1 }, { unique: true, name: 'whatsapp_contact_agency_waid' }),
      db.collection('whatsappConversations').createIndex({ agencyId: 1, connectionId: 1, waId: 1 }, { unique: true, name: 'whatsapp_conversation_connection_waid' }),
      db.collection('whatsappMessages').createIndex({ agencyId: 1, metaMessageId: 1 }, { unique: true, name: 'whatsapp_message_agency_metaid' }),
    ]);

    for (const entry of payload.entry) {
      for (const change of (entry?.changes || [])) {
        if (change?.field !== 'messages') continue;
        const value = change.value || {};
        const phoneNumberId = String(value?.metadata?.phone_number_id || '').trim();
        if (!phoneNumberId) continue;
        const connection = await db.collection('whatsappConnections').findOne(
          { phoneNumberId, status: 'connected' },
          { projection: { _id: 0, id: 1, agencyId: 1, phoneNumberId: 1 } },
        );
        const profiles = Array.isArray(value.contacts) ? value.contacts : [];
        for (const message of (Array.isArray(value.messages) ? value.messages : [])) {
          const waId = String(message?.from || '');
          const profile = profiles.find((item) => String(item?.wa_id || '') === waId) || profiles[0] || null;
          await processItem(db, connection, phoneNumberId, message, 'message', profile);
        }
        for (const status of (Array.isArray(value.statuses) ? value.statuses : [])) {
          await processItem(db, connection, phoneNumberId, status, 'status', null);
        }
      }
    }
    return json({ received: true });
  } catch (error) {
    // Do not log webhook bodies, sender IDs, message text, or credentials.
    console.error('[whatsapp-webhook] processing failed:', error?.message || 'unknown error');
    return json({ error: 'Webhook processing failed; Meta may retry this event.' }, 500);
  }
}
