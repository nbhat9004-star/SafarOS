import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { tenantFilter } from '@/lib/tenancy';
import { decryptAgencyWhatsAppToken } from '@/lib/whatsapp-credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function graphBase() {
  const version = String(process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0').trim();
  if (!/^v\\d+\\.\\d+$/.test(version)) throw new Error('Invalid WhatsApp Graph API version');
  return `https://graph.facebook.com/${version}`;
}

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request) {
  const session = getSession(request);
  if (!session?.agencyId) return json({ error: 'Authentication required' }, 401);
  if (!can(session.role, 'communications:manage')) {
    return json({ error: 'Only an agency owner or manager can register the WhatsApp phone number' }, 403);
  }

  let body;
  try {
    if (Number(request.headers.get('content-length') || 0) > 2000) return json({ error: 'Request too large' }, 413);
    body = await request.json();
  } catch {
    return json({ error: 'A valid JSON request is required' }, 400);
  }

  const pin = String(body?.pin || '').trim();
  if (!/^\\d{6}$/.test(pin)) return json({ error: 'Enter a six-digit two-step verification PIN' }, 400);

  try {
    const db = await getDb();
    const connection = await db.collection('whatsappConnections').findOne(
      tenantFilter(session, { status: 'connected' }),
      { projection: { _id: 0, phoneNumberId: 1, encryptedAccessToken: 1, phoneRegistrationStatus: 1 } }
    );
    if (!connection?.phoneNumberId || !connection?.encryptedAccessToken) {
      return json({ error: 'Connect this agency WhatsApp account before registering its phone number' }, 409);
    }
    if (connection.phoneRegistrationStatus === 'registered') {
      return json({ success: true, alreadyRegistered: true, phoneRegistrationStatus: 'registered' });
    }

    let token;
    try {
      token = decryptAgencyWhatsAppToken(connection.encryptedAccessToken, String(session.agencyId));
    } catch {
      return json({ error: 'SafarOS could not unlock this agency WhatsApp token. Ask an administrator to verify the encryption key.' }, 503);
    }

    const response = await fetch(`${graphBase()}/${encodeURIComponent(connection.phoneNumberId)}/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.error || payload?.success !== true) {
      const metaCode = Number(payload?.error?.code || 0);
      const messages = {
        133005: 'Meta rejected this PIN. Check the six-digit PIN and try again.',
        133006: 'Meta requires this phone number to be verified again before registration.',
        133015: 'Meta asks you to wait a few minutes before trying registration again.',
        133016: 'There have been too many registration attempts. Wait before trying again.',
        131031: 'This WhatsApp Business Account is locked by Meta.',
        200: 'Meta denied registration. Check the WhatsApp Business Management permission for this agency connection.',
      };
      return json({
        error: messages[metaCode] || 'Meta could not register this phone number. Check the agency number and try again later.',
        metaCode: metaCode || undefined,
      }, 422);
    }

    const now = new Date().toISOString();
    await db.collection('whatsappConnections').updateOne(
      tenantFilter(session, { status: 'connected', phoneNumberId: connection.phoneNumberId }),
      { $set: { phoneRegistrationStatus: 'registered', phoneRegisteredAt: now, updatedAt: now, lastErrorCode: '' } }
    );

    return json({ success: true, phoneRegistrationStatus: 'registered', phoneRegisteredAt: now });
  } catch (error) {
    console.error('[whatsapp-phone-registration] failed:', String(error?.message || 'unknown error').slice(0, 140));
    return json({ error: 'SafarOS could not complete phone number registration. Please try again later.' }, 500);
  }
}
