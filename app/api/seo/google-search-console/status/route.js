import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSession(request);
    if (!session?.agencyId) {
      return NextResponse.json({ error: 'Please sign in to your agency first.' }, { status: 401 });
    }
    if (!can(session.role, 'integrations:read')) {
      return NextResponse.json({ error: 'You do not have permission to view integrations.' }, { status: 403 });
    }

    const db = await getDb();
    const record = await db.collection('agencyGoogleSearchConsole').findOne(
      { agencyId: String(session.agencyId) },
      { projection: { _id: 0, agencyId: 1, propertyUrl: 1, status: 1, connectedAt: 1, propertyVerified: 1, propertyCheckAt: 1 } },
    );

    return NextResponse.json({
      connected: record?.status === 'connected',
      propertyUrl: record?.propertyUrl || '',
      connectedAt: record?.connectedAt || null,
      propertyVerified: record?.propertyVerified === true,
      propertyCheckAt: record?.propertyCheckAt || null,
    });
  } catch (error) {
    console.error('[gsc-status] Failed to load connection status:', error?.message || error);
    return NextResponse.json({ error: 'Could not load Google Search Console status.' }, { status: 500 });
  }
}
