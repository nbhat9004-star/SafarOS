import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { resolveProviderConfig } from '@/lib/secrets';
import { SITE_URL } from '@/lib/site-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALLBACK_URI = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI
  || `${SITE_URL}/api/seo/google-search-console/callback`;

function validProperty(value) {
  const v = String(value || '').trim();
  return v.startsWith('sc-domain:') || /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(v);
}

export async function GET(request) {
  try {
    const session = getSession(request);
    if (!session?.agencyId) return NextResponse.json({ error: 'Please sign in to your agency first.' }, { status: 401 });
    if (!can(session.role, 'integrations:manage')) return NextResponse.json({ error: 'Only the agency owner can connect Google Search Console.' }, { status: 403 });

    const db = await getDb();
    const { values } = await resolveProviderConfig(db, 'google_search_console');
    const clientId = values.clientId || '';
    const clientSecret = values.clientSecret || '';
    const requestedProperty = new URL(request.url).searchParams.get('propertyUrl');
    const propertyUrl = String(requestedProperty || values.propertyUrl || '').trim();

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Google Search Console OAuth Client ID and Client Secret must be configured by SafarOS Super Admin first.' }, { status: 503 });
    }
    if (!validProperty(propertyUrl)) {
      return NextResponse.json({ error: 'Enter a valid HTTPS website property URL or sc-domain:example.com.' }, { status: 400 });
    }

    const state = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    const states = db.collection('agencyGoogleSearchConsoleOAuthStates');
    await states.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
    await states.insertOne({
      stateHash: crypto.createHash('sha256').update(state).digest('hex'),
      agencyId: String(session.agencyId),
      userId: String(session.userId || ''),
      propertyUrl,
      createdAt: now.toISOString(),
      expiresAt,
      usedAt: null,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: CALLBACK_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error) {
    console.error('[gsc-connect] Failed to start OAuth:', error?.message || error);
    return NextResponse.json({ error: 'Could not start Google Search Console connection.' }, { status: 500 });
  }
}
