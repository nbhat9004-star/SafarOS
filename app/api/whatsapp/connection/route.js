import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { tenantFilter } from '@/lib/tenancy';

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

export async function GET(request) {
  const session = getSession(request);
  if (!session?.agencyId) return json({ error: 'Authentication required' }, 401);
  if (!can(session.role, 'communications:read')) return json({ error: 'You do not have permission to view WhatsApp connection status' }, 403);

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
  if (!can(session.role, 'communications:manage')) return json({ error: 'Only an agency owner or manager can disconnect WhatsApp' }, 403);

  try {
    const db = await getDb();
    const result = await db.collection('whatsappConnections').updateOne(
      tenantFilter(session, { status: { $ne: 'disconnected' } }),
      {
        $set: {
          status: 'disconnected',
          encryptedAccessToken: null,
          tokenKeyVersion: null,
          disconnectedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: String(session.userId || ''),
        },
      }
    );
    return json({ success: true, disconnected: result.modifiedCount > 0 });
  } catch {
    return json({ error: 'Unable to disconnect WhatsApp right now' }, 500);
  }
}
