import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { encryptAgencyWhatsAppToken } from '@/lib/whatsapp-credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function graphBase() {
  const version = String(process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0').trim();
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('Invalid WhatsApp Graph API version');
  return `https://graph.facebook.com/${version}`;
}

async function graphGet(path, token) {
  const response = await fetch(`${graphBase()}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.error) {
    const error = new Error('Meta rejected the WhatsApp authorization');
    error.metaCode = payload?.error?.code || 0;
    throw error;
  }
  return payload;
}

async function graphPost(path, token) {
  const response = await fetch(`${graphBase()}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.error) {
    const error = new Error('Meta could not subscribe SafarOS to this WhatsApp Business Account');
    error.metaCode = payload?.error?.code || 0;
    throw error;
  }
  return payload;
}

export async function POST(request) {
  const session = getSession(request);
  if (!session?.agencyId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!can(session.role, 'communications:manage')) {
    return NextResponse.json({ error: 'Only an agency owner or manager can connect WhatsApp' }, { status: 403 });
  }

  let body;
  try {
    if (Number(request.headers.get('content-length') || 0) > 20000) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A valid JSON request is required' }, { status: 400 });
  }

  const code = String(body?.code || '').trim();
  const state = String(body?.state || '').trim();
  const wabaId = String(body?.wabaId || '').trim();
  const phoneNumberId = String(body?.phoneNumberId || '').trim();
  if (code.length < 20 || code.length > 4096 ||
      !/^[a-f0-9]{64}$/.test(state) ||
      !/^\d{5,30}$/.test(wabaId) ||
      !/^\d{5,30}$/.test(phoneNumberId)) {
    return NextResponse.json({ error: 'Meta did not return complete WhatsApp signup details. Please try connecting again.' }, { status: 400 });
  }

  const appId = String(process.env.META_APP_ID || '').trim();
  const appSecret = String(process.env.META_APP_SECRET || '').trim();
  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Meta App ID or App Secret is not configured on the SafarOS server' }, { status: 503 });
  }

  try {
    const db = await getDb();
    const stateHash = createHash('sha256').update(state).digest('hex');
    const consumed = await db.collection('whatsappSignupStates').updateOne({
      stateHash,
      agencyId: String(session.agencyId),
      usedAt: null,
      expiresAt: { $gt: new Date().toISOString() },
    }, { $set: { usedAt: new Date().toISOString() } });
    if (consumed.modifiedCount !== 1) {
      return NextResponse.json({ error: 'This WhatsApp signup session expired or was already used. Please start again.' }, { status: 400 });
    }

    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      code,
    });
    const tokenResponse = await fetch(`${graphBase()}/oauth/access_token?${tokenParams.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const tokenPayload = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenPayload?.access_token) {
      console.error('[whatsapp-embedded-signup] Meta code exchange failed:', Number(tokenPayload?.error?.code || 0));
      return NextResponse.json({ error: 'Meta could not complete the secure authorization exchange. Please try again.' }, { status: 422 });
    }
    const accessToken = String(tokenPayload.access_token);

    const phoneList = await graphGet(
      `${encodeURIComponent(wabaId)}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating&limit=100`,
      accessToken
    );
    const phone = Array.isArray(phoneList.data)
      ? phoneList.data.find((item) => String(item.id) === phoneNumberId)
      : null;
    if (!phone) {
      return NextResponse.json({ error: 'Meta authorized the account, but the selected phone number was not found in that WhatsApp Business Account.' }, { status: 422 });
    }

    const connections = db.collection('whatsappConnections');
    const phoneOwner = await connections.findOne(
      { phoneNumberId, status: 'connected' },
      { projection: { _id: 0, agencyId: 1 } }
    );
    if (phoneOwner && String(phoneOwner.agencyId) !== String(session.agencyId)) {
      return NextResponse.json({ error: 'This WhatsApp number is already connected to another SafarOS agency.' }, { status: 409 });
    }

    await graphPost(`${encodeURIComponent(wabaId)}/subscribed_apps`, accessToken);
    const existing = await connections.findOne(
      { agencyId: String(session.agencyId) },
      { projection: { _id: 0, id: 1, phoneNumberId: 1, phoneRegistrationStatus: 1, phoneRegisteredAt: 1 } }
    );
    const now = new Date().toISOString();
    const connection = {
      id: existing?.id || randomUUID(),
      agencyId: String(session.agencyId),
      provider: 'meta_whatsapp_cloud_api',
      wabaId,
      phoneNumberId,
      displayPhoneNumber: String(phone.display_phone_number || ''),
      verifiedName: String(phone.verified_name || ''),
      qualityRating: String(phone.quality_rating || ''),
      encryptedAccessToken: encryptAgencyWhatsAppToken(accessToken, String(session.agencyId)),
      tokenKeyVersion: 'v1',
      tokenExpiresAt: Number(tokenPayload.expires_in) > 0
        ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000).toISOString()
        : null,
      status: 'connected',
      phoneRegistrationStatus: existing?.phoneNumberId === phoneNumberId && existing?.phoneRegistrationStatus === 'registered'
        ? 'registered'
        : 'pending',
      ...(existing?.phoneNumberId === phoneNumberId && existing?.phoneRegistrationStatus === 'registered' && existing?.phoneRegisteredAt
        ? { phoneRegisteredAt: existing.phoneRegisteredAt }
        : {}),
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

    return NextResponse.json({
      success: true,
      connection: {
        connected: true,
        status: 'connected',
        displayPhoneNumber: connection.displayPhoneNumber,
        verifiedName: connection.verifiedName,
        qualityRating: connection.qualityRating,
        phoneRegistrationStatus: connection.phoneRegistrationStatus,
        phoneRegisteredAt: connection.phoneRegisteredAt || null,
        connectedAt: connection.connectedAt,
        lastHealthCheckAt: connection.lastHealthCheckAt,
      },
    }, { status: 201 });
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('CREDENTIALS_ENCRYPTION_KEY')) {
      return NextResponse.json({ error: 'WhatsApp credential encryption is not configured correctly on this deployment.' }, { status: 503 });
    }
    console.error('[whatsapp-embedded-signup] completion failed:', Number(error?.metaCode || 0), message.slice(0, 120));
    return NextResponse.json({ error: 'SafarOS could not finish connecting this WhatsApp account. Check the Meta app permissions and try again.' }, { status: 422 });
  }
}
