import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = getSession(request);
  if (!session?.agencyId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!can(session.role, 'communications:manage')) {
    const validAppId = /^\\d{5,30}$/.test(appId);
  const validConfigurationId = /^\\d{5,30}$/.test(configurationId);
  return NextResponse.json({
    enabled: validAppId && validConfigurationId && appSecretConfigured,
    appId: validAppId ? appId : '',
    configurationId: validConfigurationId ? configurationId : '',
    missing: {
      appId: !validAppId,
      configurationId: !validConfigurationId,
      appSecret: !appSecretConfigured,
    },
  });;
}
