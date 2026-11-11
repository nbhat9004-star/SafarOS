import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { tenantFilter, withAgency } from '@/lib/tenancy';
import { decryptAgencyWhatsAppToken } from '@/lib/whatsapp-credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function graphBase() {
  const version = String(process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0').trim();
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('Invalid WhatsApp Graph API version');
  return `https://graph.facebook.com/${version}`;
}

export async function POST(request) {
  const session = getSession(request);
  if (!session?.agencyId) return json({ error: 'Authentication required' }, 401);
  if (!can(session.role, 'communications:update')) {
    return json({ error: 'You do not have permission to send WhatsApp messages' }, 403);
  }

  let body;
  try {
    if (Number(request.headers.get('content-length') || 0) > 12000) return json({ error: 'Request too large' }, 413);
    body = await request.json();
  } catch {
    return json({ error: 'A valid JSON request is required' }, 400);
  }

  const conversationId = String(body?.conversationId || '').trim();
  const text = String(body?.text || '').trim();
  if (!conversationId) return json({ error: 'Choose a WhatsApp conversation first' }, 400);
  if (!text) return json({ error: 'Write a message before sending' }, 400);
  if (text.length > 4096) return json({ error: 'WhatsApp text messages cannot exceed 4,096 characters' }, 400);

  let db;
  let outgoingId;
  let stage = 'database';
  try {
    db = await getDb();
    stage = 'conversation_lookup';
    const conversation = await db.collection('whatsappConversations').findOne(
      tenantFilter(session, { id: conversationId }),
      { projection: { _id: 0, id: 1, waId: 1, connectionId: 1, serviceWindowExpiresAt: 1, lastInboundAt: 1 } }
    );
    if (!conversation) return json({ error: 'WhatsApp conversation not found' }, 404);

    const windowExpiry = conversation.serviceWindowExpiresAt
      ? new Date(conversation.serviceWindowExpiresAt).getTime()
      : (conversation.lastInboundAt ? new Date(conversation.lastInboundAt).getTime() + 24 * 60 * 60 * 1000 : 0);
    if (!Number.isFinite(windowExpiry) || windowExpiry <= Date.now()) {
      return json({
        error: 'The 24-hour customer service window has expired. Use an approved WhatsApp message template to contact this customer.',
        code: 'WHATSAPP_SERVICE_WINDOW_EXPIRED',
      }, 409);
    }

    stage = 'connection_lookup';
    const connectionCollection = db.collection('whatsappConnections');
    let connection = conversation.connectionId
      ? await connectionCollection.findOne(
          tenantFilter(session, { id: conversation.connectionId, status: 'connected' }),
          { projection: { _id: 0, id: 1, agencyId: 1, phoneNumberId: 1, encryptedAccessToken: 1 } }
        )
      : null;

    // A token refresh used to replace the connection ID. Older conversations
    // still reference the previous ID, even though the agency has one active
    // WhatsApp connection. Recover only within this authenticated agency.
    if (!connection) {
      connection = await connectionCollection.findOne(
        tenantFilter(session, { status: 'connected' }),
        { projection: { _id: 0, id: 1, agencyId: 1, phoneNumberId: 1, encryptedAccessToken: 1 } }
      );
      if (connection) {
        await db.collection('whatsappConversations').updateOne(
          tenantFilter(session, { id: conversation.id }),
          { $set: { connectionId: connection.id, updatedAt: new Date().toISOString() } }
        );
      }
    }

    if (!connection?.encryptedAccessToken || !connection.phoneNumberId) {
      return json({ error: 'This agency WhatsApp connection is unavailable. Reconnect it in Channel Integrations.' }, 409);
    }
    if (!/^\d{5,30}$/.test(String(conversation.waId || ''))) {
      return json({ error: 'The customer WhatsApp number is invalid' }, 422);
    }

    stage = 'token_decryption';
    let accessToken;
    try {
      accessToken = decryptAgencyWhatsAppToken(connection.encryptedAccessToken, String(session.agencyId));
    } catch (error) {
      console.warn('[whatsapp-send] agency token decryption failed');
      return json({
        error: 'SafarOS could not unlock this agency WhatsApp token. The encryption key may have changed since the connection was saved. Reconnect the WhatsApp account after an administrator verifies the key.',
        code: 'WHATSAPP_TOKEN_DECRYPTION_FAILED',
      }, 503);
    }
    const now = new Date().toISOString();
    outgoingId = randomUUID();
    // Older outbound records stored an empty string for metaMessageId.
    // The webhook's unique (agencyId, metaMessageId) index treats every string,
    // including "", as an indexed value, so a second send for the same agency
    // collides with the first. Remove legacy placeholders before inserting and
    // leave the field absent until Meta returns a real wamid.
    stage = 'message_persistence';
    await db.collection('whatsappMessages').updateMany(
      { agencyId: String(session.agencyId), metaMessageId: '' },
      { $unset: { metaMessageId: '' } }
    );

    const messageDoc = withAgency(session, {
      id: outgoingId,
      connectionId: connection.id,
      conversationId: conversation.id,
      contactId: '',
      direction: 'outbound',
      type: 'text',
      text,
      status: 'sending',
      source: 'agent',
      createdBy: String(session.userId || ''),
      createdAt: now,
      updatedAt: now,
    });
    await db.collection('whatsappMessages').insertOne(messageDoc);

    let response;
    try {
      stage = 'meta_request';
      const graphResponse = await fetch(
        `${graphBase()}/${encodeURIComponent(connection.phoneNumberId)}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: String(conversation.waId),
            type: 'text',
            text: { preview_url: false, body: text },
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(20000),
        }
      );
      response = await graphResponse.json().catch(() => ({}));
      if (!graphResponse.ok || response?.error) {
        const failure = response?.error || {};
        const error = new Error('Meta could not send this WhatsApp message');
        error.metaCode = Number(failure.code || 0);
        error.metaSubcode = Number(failure.error_subcode || 0);
        error.metaType = String(failure.type || '').slice(0, 80);
        error.metaMessage = String(failure.message || '').slice(0, 240);
        error.fbTraceId = String(failure.fbtrace_id || '').slice(0, 100);
        throw error;
      }
    } catch (error) {
      await db.collection('whatsappMessages').updateOne(
        tenantFilter(session, { id: outgoingId }),
        { $set: {
          status: 'failed',
          failureCode: String(error?.metaCode || ''),
          failureReason: 'Meta could not send this message. Check the WhatsApp connection and try again.',
          updatedAt: new Date().toISOString(),
        } }
      );
      const details = error?.metaCode
        ? `Meta rejected the message (code ${error.metaCode}${error.metaSubcode ? `, subcode ${error.metaSubcode}` : ''})${error.metaMessage ? `: ${error.metaMessage}` : '.'}`
        : 'The request to Meta failed. Check the connection and try again.';
      console.warn('[whatsapp-send] Meta send rejected:', JSON.stringify({
        code: error?.metaCode || null,
        subcode: error?.metaSubcode || null,
        type: error?.metaType || null,
        fbTraceId: error?.fbTraceId || null,
      }));
      return json({
        error: details,
        code: 'WHATSAPP_META_SEND_FAILED',
        metaCode: error?.metaCode || null,
        metaSubcode: error?.metaSubcode || null,
        fbTraceId: error?.fbTraceId || null,
      }, 502);
    }

    stage = 'message_status_update';
    const metaMessageId = String(response?.messages?.[0]?.id || '');
    const sentAt = new Date().toISOString();
    await db.collection('whatsappMessages').updateOne(
      tenantFilter(session, { id: outgoingId }),
      { $set: {
        metaMessageId,
        status: 'sent',
        sentAt,
        updatedAt: sentAt,
      } }
    );
    await db.collection('whatsappConversations').updateOne(
      tenantFilter(session, { id: conversation.id }),
      { $set: {
        lastMessageAt: sentAt,
        lastMessagePreview: text.slice(0, 240),
        updatedAt: sentAt,
      } }
    );

    return json({
      success: true,
      message: {
        id: outgoingId,
        direction: 'outbound',
        type: 'text',
        text,
        status: 'sent',
        createdAt: now,
      },
    }, 201);
  } catch (error) {
    if (outgoingId && db) {
      await db.collection('whatsappMessages').updateOne(
        tenantFilter(session, { id: outgoingId }),
        { $set: { status: 'failed', failureReason: 'Message could not be completed. Refresh the conversation before retrying.', updatedAt: new Date().toISOString() } }
      ).catch(() => {});
    }
    const message = String(error?.message || '');
    if (message.includes('CREDENTIALS_ENCRYPTION_KEY') || message.includes('WhatsApp credential')) {
      return json({
        error: 'WhatsApp credential encryption is not configured correctly. Ask an administrator to check CREDENTIALS_ENCRYPTION_KEY in the deployment settings.',
        code: 'WHATSAPP_ENCRYPTION_CONFIGURATION_ERROR',
      }, 503);
    }
    console.error('[whatsapp-send] internal failure:', JSON.stringify({
      stage,
      name: String(error?.name || 'Error').slice(0, 60),
      message: message.slice(0, 160),
    }));
    const stageMessages = {
      database: 'SafarOS could not connect to its database while preparing the WhatsApp reply.',
      conversation_lookup: 'SafarOS could not load this WhatsApp conversation.',
      connection_lookup: 'SafarOS could not load the agency WhatsApp connection.',
      message_persistence: 'SafarOS could not save the outgoing message before sending.',
      meta_request: 'SafarOS could not complete the request to Meta.',
      message_status_update: 'Meta may have accepted the message, but SafarOS could not update its message status. Refresh the inbox before retrying.',
    };
    return json({
      error: stageMessages[stage] || 'SafarOS could not complete this WhatsApp reply.',
      code: 'WHATSAPP_SEND_INTERNAL_ERROR',
      stage,
    }, 500);
  }
}
