import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { resolveProviderConfig, encryptSecret } from '@/lib/secrets';
import { SITE_URL } from '@/lib/site-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALLBACK_URI = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI
  || `${SITE_URL}/api/seo/google-search-console/callback`;

function finish(status, extra = '') {
  const url = new URL('/dashboard', SITE_URL);
  url.searchParams.set('googleSearchConsole', status);
  if (extra) url.searchParams.set('detail', extra);
  return NextResponse.redirect(url);
}

export async function GET(request) {
  const incoming = new URL(request.url);
  const googleError = incoming.searchParams.get('error');
  if (googleError) return finish('cancelled');
  const code = incoming.searchParams.get('code');
  const state = incoming.searchParams.get('state');
  if (!code || !state || !/^[a-f0-9]{64}$/i.test(state)) return finish('invalid_request');

  try {
    const db = await getDb();
    const stateHash = crypto.createHash('sha256').update(state).digest('hex');
    const states = db.collection('agencyGoogleSearchConsoleOAuthStates');
    const savedState = await states.findOne({ stateHash, usedAt: null, expiresAt: { $gt: new Date() } });
    if (!savedState) return finish('invalid_state');

    const claimed = await states.updateOne(
      { _id: savedState._id, usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date().toISOString() } },
    );
    if (claimed.modifiedCount !== 1) return finish('invalid_state');

    const { values } = await resolveProviderConfig(db, 'google_search_console');
    const clientId = values.clientId || '';
    const clientSecret = values.clientSecret || '';
    if (!clientId || !clientSecret) return finish('not_configured');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      cache: 'no-store',
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: CALLBACK_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok) {
      console.error('[gsc-callback] Google token exchange failed:', tokenData.error || tokenResponse.status);
      return finish('token_exchange_failed');
    }

    const existing = await db.collection('agencyGoogleSearchConsole').findOne(
      { agencyId: savedState.agencyId },
      { projection: { refreshTokenEnc: 1 } },
    );
    const refreshToken = tokenData.refresh_token || '';
    if (!refreshToken && !existing?.refreshTokenEnc) return finish('refresh_token_missing');

    const set = {
      agencyId: savedState.agencyId,
      propertyUrl: savedState.propertyUrl,
      scopes: String(tokenData.scope || 'https://www.googleapis.com/auth/webmasters.readonly').split(' '),
      tokenType: tokenData.token_type || 'Bearer',
      connectedAt: new Date().toISOString(),
      connectedBy: savedState.userId || '',
      status: 'connected',
      updatedAt: new Date().toISOString(),
    };
    if (refreshToken) set.refreshTokenEnc = encryptSecret(refreshToken);
    if (tokenData.access_token) {
      set.accessTokenEnc = encryptSecret(tokenData.access_token);
      set.accessTokenExpiresAt = new Date(Date.now() + (Number(tokenData.expires_in) || 3600) * 1000).toISOString();
    }

    // Verify that the Google account can access the selected Search Console property.
    let propertyVerified = false;
    if (tokenData.access_token) {
      const propertyResponse = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(savedState.propertyUrl)}`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` }, cache: 'no-store' },
      );
      propertyVerified = propertyResponse.ok;
      set.propertyVerified = propertyVerified;
      set.propertyCheckAt = new Date().toISOString();
    }

    await db.collection('agencyGoogleSearchConsole').updateOne(
      { agencyId: savedState.agencyId },
      { $set: set, $setOnInsert: { id: crypto.randomUUID(), createdAt: new Date().toISOString() } },
      { upsert: true },
    );

    // Never expose OAuth tokens in logs, URLs, or browser responses.
    return finish(propertyVerified ? 'connected' : 'connected_property_check');
  } catch (error) {
    console.error('[gsc-callback] OAuth callback failed:', error?.message || error);
    return finish('connection_failed');
  }
}
