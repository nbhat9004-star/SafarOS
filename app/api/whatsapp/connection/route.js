import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { tenantFilter } from '@/lib/tenancy';
import { encryptAgencyWhatsAppToken } from '@/lib/whatsapp-credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function safeConnectionView(connection) {
  if (!connection) return {
    connected: false,
    status: 'not_connected',
    displayPhoneNumber: '',
    verifiedName: '',
    qualityRating: '',
    lastHealthCheckAt: null,
    connectedAt: null,
  };

  return {
    connected: connection.status === 'connected',
    status: String(connection.status || 'error'),
    displayPhoneNumber: String(connection.displayPhoneNumber || ''),
    verifiedName: String(connection.verifiedName || ''),
    qualityRating: String(connection.qualityRating || ''),
    lastHealthCheckAt: connection.lastHealthCheckAt || null,
    connectedAt: connection.connectedAt || null,
    lastErrorCode: String(connection.lastErrorCode || ''),
  };
}

function graphBase() {
  const version = String(process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0').trim();
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('Invalid WhatsApp Graph API version');
  return `https://graph.facebook.com/${version}`;
}

async function graphRequest(path, token, method = 'GET') {
  const response = await fetch(`${graphBase()}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(method === 'POST' ? { body: '{}' } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });

  let payload;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok || payload?.error) {
    const error = payload?.error || {};
    const failure = new Error('Meta rejected the WhatsApp connection request');
    failure.metaCode = Number(error.code || 0);
    failure.httpStatus = response.status;
    throw failure;
  }
  return payload || {};
}

export async function GET(request) {
  const session = getSession(request);
  if (!session?.agencyId) return json({ error: 'Authentication required' }, 401);
  if (!can(session.role, 'communications:read')) {
    return json({ error: 'You do not have permission to view WhatsApp connection status' }, 403);
  }

  try {
    const db = await getDb();
    const connection = await db.collection('whatsappConnections').findOne(
      tenantFilter(session),
      { projection: { _id: 0, encryptedAccessToken: 0, accessToken: 0, token: 0 } }
    );
    return json({ connection: safeConnectionView(connection) });
  } catch {
    return json({ error: 'Unable to load WhatsApp connection status' }, 500);
  }
}

export async function DELETE(request) {
  const session = getSession(request);
  if (!session?.agencyId) return json({ error: 'Authentication required' }, 401);
  if (!can(session.role, 'communications:manage')) {
    return json({ error: 'Only an agency owner or manager can disconnect WhatsApp' }, 403);
  }

  try {
    const db = await getDb();
    const now = new Date().toISOString();
    const result = await db.collection('whatsappConnections').updateOne(
      tenantFilter(session, { status: { $ne: 'disconnected' } }),
      {
        $set: {
          status: 'disconnected',
          encryptedAccessToken: null,
          tokenKeyVersion: null,
          disconnectedAt: now,
          updatedAt: now,
          updatedBy: String(session.userId || ''),
        },
      }
    );
    return json({ success: true, disconnected: result.modifiedCount > 0 });
  } catch {
    return json({ error: 'Unable to disconnect WhatsApp right now' }, 500);
  }
}

export async function POST(request) {
  const session = getSession(request);
  if (!session?.agencyId) return json({ error: 'Authentication required' }, 401);
  if (!can(session.role, 'communications:manage')) {
    return json({ error: 'Only an agency owner or manager can connect WhatsApp' }, 403);
  }

  let body;
  try {
    if (Number(request.headers.get('content-length') || 0) > 20000) {
      return json({ error: 'Request too large' }, 413);
    }
    body = await request.json();
  } catch {
    return json({ error: 'A valid JSON request is required' }, 400);
  }

  const wabaId = String(body?.wabaId || '').trim();
  const phoneNumberId = String(body?.phoneNumberId || '').trim();
  const accessToken = String(body?.accessToken || '').trim();

  if (!/^\d{5,30}$/.test(wabaId) || !/^\d{5,30}$/.test(phoneNumberId)) {
    return json({ error: 'Enter a valid WhatsApp Business Account ID and Phone Number ID' }, 400);
  }
  if (accessToken.length < 30 || accessToken.length > 10000) {
    return json({ error: 'The Meta access token is missing or invalid' }, 400);
  }

  try {
    const db = await getDb();
    const connections = db.collection('whatsappConnections');

    const phoneOwner = await connections.findOne(
      { phoneNumberId, status: 'connected' },
      { projection: { _id: 0, agencyId: 1 } }
    );
    if (phoneOwner && String(phoneOwner.agencyId) !== String(session.agencyId)) {
      return json({ error: 'This WhatsApp number is already connected to another SafarOS agency' }, 409);
    }

    const phoneList = await graphRequest(
      `${encodeURIComponent(wabaId)}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating&limit=100`,
      accessToken
    );
    const phone = Array.isArray(phoneList.data)
      ? phoneList.data.find((item) => String(item.id) === phoneNumberId)
      : null;
    if (!phone) {
      return json({ error: 'Meta did not find this Phone Number ID inside the supplied WhatsApp Business Account' }, 422);
    }

    const encryptedAccessToken = encryptAgencyWhatsAppToken(accessToken, String(session.agencyId));
    await graphRequest(`${encodeURIComponent(wabaId)}/subscribed_apps`, accessToken, 'POST');

    const now = new Date().toISOString();
    // Keep the agency's connection ID stable when refreshing its token.
    // Existing conversations reference this ID; replacing it would make
    // those conversations appear disconnected even though the agency is connected.
    const existingConnection = await connections.findOne(
      { agencyId: String(session.agencyId) },
      { projection: { _id: 0, id: 1 } }
    );
    const connection = {
      id: existingConnection?.id || randomUUID(),
      agencyId: String(session.agencyId),
      provider: 'meta_whatsapp_cloud_api',
      wabaId,
      phoneNumberId,
      displayPhoneNumber: String(phone.display_phone_number || ''),
      verifiedName: String(phone.verified_name || ''),
      qualityRating: String(phone.quality_rating || ''),
      encryptedAccessToken,
      tokenKeyVersion: 'v1',
      status: 'connected',
      connectedAt: now,
      lastHealthCheckAt: now,
      lastErrorCode: '',
      updatedAt: now,
      updatedBy: String(session.userId || ''),
    };

    await connections.updateOne(
      { agencyId: String(session.agencyId) },
      { $set: connection, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    return json({
      success: true,
      connection: {
        connected: true,
        status: 'connected',
        displayPhoneNumber: connection.displayPhoneNumber,
        verifiedName: connection.verifiedName,
        qualityRating: connection.qualityRating,
        connectedAt: connection.connectedAt,
        lastHealthCheckAt: connection.lastHealthCheckAt,
      },
    }, 201);
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('CREDENTIALS_ENCRYPTION_KEY')) {
      return json({ error: 'WhatsApp credential encryption is not configured correctly on this deployment' }, 503);
    }
    if (error?.metaCode || error?.httpStatus) {
      return json({
        error: 'Meta could not authorize this WhatsApp account. Check that the token has WhatsApp Business Management permissions and that the IDs belong to the same account.',
        metaErrorCode: error.metaCode || undefined,
      }, 422);
    }
    console.error('[whatsapp-connect] connection failed:', message.slice(0, 160));
    return json({ error: 'Unable to save the WhatsApp connection right now' }, 500);
  }
}
