import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { resolveProviderConfig } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const INDEXES = [
  ['whatsappConnections', { phoneNumberId: 1 }, { unique: true, name: 'wa_connection_phone_unique' }],
  ['whatsappWebhookEvents', { eventKey: 1 }, { unique: true, name: 'wa_webhook_event_unique' }],
  ['whatsappWebhookEvents', { agencyId: 1, receivedAt: -1 }, { name: 'wa_webhook_agency_received' }],
  ['whatsappContacts', { agencyId: 1, waId: 1 }, { unique: true, name: 'wa_contact_agency_waid_unique' }],
  ['whatsappConversations', { agencyId: 1, connectionId: 1, waId: 1 }, { unique: true, name: 'wa_conversation_agency_connection_waid_unique' }],
  ['whatsappConversations', { agencyId: 1, lastMessageAt: -1 }, { name: 'wa_conversation_agency_last_message' }],
  ['whatsappMessages', { agencyId: 1, metaMessageId: 1 }, { unique: true, name: 'wa_message_agency_meta_id_unique', partialFilterExpression: { metaMessageId: { $type: 'string' } } }],
  ['whatsappMessages', { agencyId: 1, conversationId: 1, createdAt: 1 }, { name: 'wa_message_agency_conversation_created' }],
];

let indexesPromise;
async function ensureIndexes(db) {
  if (!indexesPromise) {
    indexesPromise = Promise.all(INDEXES.map(([collection, keys, options]) =>
      db.collection(collection).createIndex(keys, options)
    )).catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }
  return indexesPromise;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifySignature(rawBody, signature, appSecret) {
  if (!signature || !appSecret || !signature.startsWith('sha256=')) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  return safeEqual(signature, expected);
}

function eventKeyFor(kind, item) {
  if (kind === 'message') return 'message:' + String(item.id || '');
  return ['status', item.id || '', item.status || '', item.timestamp || '', item.recipient_id || ''].join(':');
}

function messageKind(message) {
  if (message?.type === 'text') return 'text';
  if (['image', 'document', 'audio', 'video', 'location', 'interactive', 'sticker'].includes(message?.type)) return message.type;
  return 'unknown';
}

function previewFor(message) {
  if (message?.type === 'text') return String(message.text?.body || '').slice(0, 240);
  if (message?.type === 'button') return String(message.button?.text || 'Button response').slice(0, 240);
  if (message?.type === 'interactive') {
    return String(message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || 'Interactive response').slice(0, 240);
  }
  return message?.type ? '[' + String(message.type).slice(0, 30) + ']' : '[Message]';
}

async function persistMessage(db, connection, message, receivedAt) {
  const agencyId = connection.agencyId;
  const connectionId = connection.id;
  const waId = String(message.from || '');
  if (!waId || !message.id) return;

  const eventKey = eventKeyFor('message', message);
  try {
    await db.collection('whatsappWebhookEvents').insertOne({
      id: uuidv4(), eventKey, agencyId, connectionId,
      phoneNumberId: connection.phoneNumberId, eventType: 'message',
      metaMessageId: message.id, receivedAt, processedAt: null,
      processingStatus: 'processing',
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const prior = await db.collection('whatsappWebhookEvents').findOne({ eventKey }, { projection: { processingStatus: 1 } });
    if (prior?.processingStatus === 'processed') return;
  }

  const contactCollection = db.collection('whatsappContacts');
  // Keep insert-only fields separate from fields that may be updated on every
  // inbound message. In particular, never write displayName in both $set and
  // $setOnInsert: MongoDB rejects overlapping update paths.
  await contactCollection.updateOne(
    { agencyId, waId },
    {
      $set: { phone: waId, lastInboundAt: receivedAt, updatedAt: receivedAt },
      $setOnInsert: {
        id: uuidv4(), agencyId, waId, consentStatus: 'unknown', createdAt: receivedAt,
      },
    },
    { upsert: true }
  );
  const contact = await contactCollection.findOne({ agencyId, waId }, { projection: { _id: 0 } });
  if (!contact) throw new Error('WhatsApp contact could not be persisted');

  const conversationCollection = db.collection('whatsappConversations');
  await conversationCollection.updateOne(
    { agencyId, connectionId, waId },
    { $set: { contactId: contact.id, updatedAt: receivedAt },
      $setOnInsert: { id: uuidv4(), agencyId, connectionId, waId, unreadCount: 0, assignedUserId: '', assignedUserName: '', createdAt: receivedAt } },
    { upsert: true }
  );
  const conversation = await conversationCollection.findOne({ agencyId, connectionId, waId }, { projection: { _id: 0 } });
  if (!conversation) throw new Error('WhatsApp conversation could not be persisted');

  const text = message.type === 'text' ? String(message.text?.body || '').slice(0, 10000) : '';
  let inserted = false;
  try {
    await db.collection('whatsappMessages').insertOne({
      id: uuidv4(), agencyId, connectionId, conversationId: conversation.id, contactId: contact.id,
      metaMessageId: String(message.id), direction: 'inbound', type: messageKind(message),
      text, safeMediaMetadata: message.type === 'text' ? null : { type: message.type || 'unknown' },
      status: 'received', source: 'customer', createdAt: receivedAt, updatedAt: receivedAt,
    });
    inserted = true;
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  if (inserted) {
    await conversationCollection.updateOne(
      { agencyId, connectionId, waId },
      { $set: { lastMessageAt: receivedAt, lastMessagePreview: previewFor(message), lastInboundAt: receivedAt,
        serviceWindowExpiresAt: new Date(new Date(receivedAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: receivedAt, status: 'open' }, $inc: { unreadCount: 1 } }
    );
  }
  await db.collection('whatsappWebhookEvents').updateOne(
    { eventKey }, { $set: { processedAt: new Date().toISOString(), processingStatus: 'processed' } }
  );
}

async function persistStatus(db, connection, status, receivedAt) {
  if (!status?.id) return;
  const eventKey = eventKeyFor('status', status);
  try {
    await db.collection('whatsappWebhookEvents').insertOne({
      id: uuidv4(), eventKey, agencyId: connection.agencyId, connectionId: connection.id,
      phoneNumberId: connection.phoneNumberId, eventType: 'message_status',
      metaMessageId: status.id, messageStatus: status.status || '',
      receivedAt, processedAt: null, processingStatus: 'processing',
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const prior = await db.collection('whatsappWebhookEvents').findOne({ eventKey }, { projection: { processingStatus: 1 } });
    if (prior?.processingStatus === 'processed') return;
  }

  const allowed = ['sent', 'delivered', 'read', 'failed'];
  if (allowed.includes(status.status)) {
    const failure = Array.isArray(status.errors) ? status.errors[0] : null;
    await db.collection('whatsappMessages').updateOne(
      { agencyId: connection.agencyId, metaMessageId: String(status.id) },
      { $set: {
        status: status.status,
        failureCode: failure?.code ? String(failure.code) : '',
        failureReason: failure?.title ? String(failure.title).slice(0, 300) : '',
        updatedAt: receivedAt,
        ...(status.status === 'sent' ? { sentAt: receivedAt } : {}),
        ...(status.status === 'delivered' ? { deliveredAt: receivedAt } : {}),
        ...(status.status === 'read' ? { readAt: receivedAt } : {}),
        ...(status.status === 'failed' ? { failedAt: receivedAt } : {}),
      } }
    );
  }
  await db.collection('whatsappWebhookEvents').updateOne(
    { eventKey }, { $set: { processedAt: new Date().toISOString(), processingStatus: 'processed' } }
  );
}

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  try {
    const db = await getDb();
    const { values } = await resolveProviderConfig(db, 'whatsapp_cloud');
    const expectedToken = String(values.webhookVerifyToken || '');
    if (mode !== 'subscribe' || !expectedToken || !safeEqual(token, expectedToken) || !challenge) {
      return new Response('Forbidden', { status: 403 });
    }
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch {
    return new Response('WhatsApp webhook is not configured', { status: 503 });
  }
}

export async function POST(request) {
  let db;
  let appSecret = '';
  try {
    db = await getDb();
    const { values } = await resolveProviderConfig(db, 'whatsapp_cloud');
    appSecret = String(values.appSecret || '');
  } catch {
    return Response.json({ error: 'WhatsApp webhook is not configured' }, { status: 503 });
  }
  if (!appSecret) return Response.json({ error: 'WhatsApp webhook is not configured' }, { status: 503 });

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return Response.json({ error: 'Payload too large' }, { status: 413 });
  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'), appSecret)) {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return Response.json({ error: 'Invalid JSON payload' }, { status: 400 }); }
  if (payload?.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) {
    return Response.json({ received: true }, { status: 200 });
  }

  try {
    await ensureIndexes(db);
    const receivedAt = new Date().toISOString();

    for (const entry of payload.entry) {
      for (const change of (Array.isArray(entry?.changes) ? entry.changes : [])) {
        if (change?.field !== 'messages') continue;
        const value = change.value || {};
        const phoneNumberId = String(value.metadata?.phone_number_id || '');
        if (!phoneNumberId) continue;

        const connection = await db.collection('whatsappConnections').findOne(
          { phoneNumberId, status: 'connected' },
          { projection: { _id: 0, id: 1, agencyId: 1, phoneNumberId: 1 } }
        );

        const messages = Array.isArray(value.messages) ? value.messages : [];
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        if (!connection) {
          // Keep an auditable, content-minimized event so an operator can diagnose
          // a missing agency-to-number mapping without leaking message bodies.
          for (const message of messages) {
            const eventKey = 'unmapped:' + eventKeyFor('message', message);
            try {
              await db.collection('whatsappWebhookEvents').insertOne({
                id: uuidv4(), eventKey, agencyId: null, connectionId: null, phoneNumberId,
                eventType: 'unmapped_message', metaMessageId: message.id || '',
                senderWaId: message.from || '', receivedAt, processedAt: null,
                processingStatus: 'unmapped',
              });
            } catch (error) { if (error?.code !== 11000) throw error; }
          }
          for (const status of statuses) {
            const eventKey = 'unmapped:' + eventKeyFor('status', status);
            try {
              await db.collection('whatsappWebhookEvents').insertOne({
                id: uuidv4(), eventKey, agencyId: null, connectionId: null, phoneNumberId,
                eventType: 'unmapped_status', metaMessageId: status.id || '',
                messageStatus: status.status || '', receivedAt, processedAt: null,
                processingStatus: 'unmapped',
              });
            } catch (error) { if (error?.code !== 11000) throw error; }
          }
          continue;
        }

        for (const message of messages) await persistMessage(db, connection, message, receivedAt);
        for (const status of statuses) await persistStatus(db, connection, status, receivedAt);
      }
    }
    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    // Do not log payloads, tokens, phone numbers, or customer message content.
    console.error('[whatsapp-webhook] processing failed:', String(error?.message || 'unknown error').slice(0, 200));
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
