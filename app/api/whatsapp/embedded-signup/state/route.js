import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const session = getSession(request);
  if (!session?.agencyId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!can(session.role, 'communications:manage')) {
    return NextResponse.json({ error: 'Only an agency owner or manager can connect WhatsApp' }, { status: 403 });
  }
  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET ||
      !process.env.META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID) {
    return NextResponse.json({ error: 'Meta Embedded Signup is not configured on this SafarOS deployment' }, { status: 503 });
  }

  const state = randomBytes(32).toString('hex');
  const now = Date.now();
  try {
    const db = await getDb();
    await db.collection('whatsappSignupStates').insertOne({
      stateHash: createHash('sha256').update(state).digest('hex'),
      agencyId: String(session.agencyId),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
      usedAt: null,
    });
    return NextResponse.json({ state });
  } catch {
    return NextResponse.json({ error: 'Unable to start secure WhatsApp authorization' }, { status: 500 });
  }
}
