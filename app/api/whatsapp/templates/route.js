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

function authorize(request, permission) {
  const session = getSession(request);
  if (!session?.agencyId) return { error: json({ error: 'Authentication required' }, 401) };
  if (!can(session.role, permission)) return { error: json({ error: 'You do not have permission to manage WhatsApp templates' }, 403) };
  return { session };
}

async function loadConnection(db, session) {
  const connection = await db.collection('whatsappConnections').findOne(
    tenantFilter(session, { status: 'connected' }),
    { projection: { _id: 0, id: 1, wabaId: 1, encryptedAccessToken: 1 } }
  );
  if (!connection?.wabaId || !connection?.encryptedAccessToken) {
    return { error: 'Connect this agency WhatsApp Business Account before managing templates.', status: 409 };
  }
  let token;
  try {
    token = decryptAgencyWhatsAppToken(connection.encryptedAccessToken, String(session.agencyId));
  } catch {
    return { error: 'SafarOS could not unlock this agency WhatsApp token. Reconnect the WhatsApp account after an administrator verifies the encryption key.', status: 503 };
  }
  return { connection, token };
}

async function metaRequest(path, token, options = {}) {
  const response = await fetch(`${graphBase()}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.error) {
    const error = payload?.error || {};
    return {
      ok: false,
      status: response.status,
      code: Number(error.code || 0),
      message: String(error.message || 'Meta rejected the WhatsApp template request').slice(0, 240),
    };
  }
  return { ok: true, payload };
}

function safeTemplate(template) {
  return {
    id: String(template.id || ''),
    name: String(template.name || ''),
    language: String(template.language || ''),
    category: String(template.category || ''),
    status: String(template.status || ''),
    components: Array.isArray(template.components) ? template.components : [],
    quality_score: template.quality_score || null,
  };
}

export async function GET(request) {
  const { session, error } = authorize(request, 'communications:read');
  if (error) return error;
  try {
    const db = await getDb();
    const { connection, token, error: connectionError, status } = await loadConnection(db, session);
    if (connectionError) return json({ error: connectionError }, status);
    const result = await metaRequest(
      `${encodeURIComponent(connection.wabaId)}/message_templates?fields=id,name,language,category,status,components,quality_score&limit=100`,
      token
    );
    if (!result.ok) {
      return json({ error: 'Meta could not load WhatsApp templates. Check the token permissions and WABA access.', metaCode: result.code || undefined }, 502);
    }

    const templates = (Array.isArray(result.payload.data) ? result.payload.data : []).map(safeTemplate);
    const now = new Date().toISOString();
    const collection = db.collection('whatsappTemplates');
    for (const template of templates) {
      await collection.updateOne(
        tenantFilter(session, { metaTemplateId: template.id }),
        { $set: { ...withAgency(session, template), provider: 'meta_whatsapp_cloud_api', syncedAt: now, updatedAt: now },
          $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
    }
    return json({ templates, syncedAt: now, paging: result.payload.paging || null });
  } catch (error) {
    console.error('[whatsapp-templates] sync failed:', String(error?.message || 'unknown error').slice(0, 160));
    return json({ error: 'Unable to synchronize WhatsApp templates right now.' }, 500);
  }
}

export async function POST(request) {
  const { session, error } = authorize(request, 'communications:manage');
  if (error) return error;
  let body;
  try {
    if (Number(request.headers.get('content-length') || 0) > 12000) return json({ error: 'Request too large' }, 413);
    body = await request.json();
  } catch {
    return json({ error: 'A valid JSON request is required' }, 400);
  }

  const name = String(body?.name || '').trim().toLowerCase();
  const language = String(body?.language || 'en_US').trim();
  const category = String(body?.category || 'UTILITY').trim().toUpperCase();
  const text = String(body?.body || '').trim();
  if (!/^[a-z0-9_]{1,512}$/.test(name)) return json({ error: 'Template name must use lowercase letters, numbers and underscores only.' }, 400);
  if (!/^[a-z]{2}_[A-Z]{2}$/.test(language)) return json({ error: 'Use a supported language code such as en_US.' }, 400);
  if (!['UTILITY', 'MARKETING'].includes(category)) return json({ error: 'Choose a valid WhatsApp template category.' }, 400);
  if (text.length < 1 || text.length > 1024) return json({ error: 'Template body must contain 1–1,024 characters.' }, 400);

  const placeholders = [...text.matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
  if (placeholders.some((number) => !Number.isInteger(number) || number < 1) ||
      [...new Set(placeholders)].sort((a, b) => a - b).some((number, index) => number !== index + 1)) {
    return json({ error: 'Use sequential numbered variables such as {{1}}, {{2}} in the template body.' }, 400);
  }

  try {
    const db = await getDb();
    const { connection, token, error: connectionError, status } = await loadConnection(db, session);
    if (connectionError) return json({ error: connectionError }, status);

    const payload = {
      name,
      language,
      category,
      components: [{ type: 'BODY', text, ...(placeholders.length ? { example: { body_text: [placeholders.map((number) => 'Sample ' + number)] } } : {}) }],
    };
    const result = await metaRequest(
      `${encodeURIComponent(connection.wabaId)}/message_templates`,
      token,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    if (!result.ok) {
      return json({
        error: 'Meta rejected the template. Review the name, category, language, body and WhatsApp Business permissions.',
        metaCode: result.code || undefined,
        metaMessage: result.message,
      }, 422);
    }

    const now = new Date().toISOString();
    const template = {
      id: String(result.payload.id || randomUUID()),
      metaTemplateId: String(result.payload.id || ''),
      name,
      language,
      category,
      status: String(result.payload.status || 'PENDING'),
      components: payload.components,
      provider: 'meta_whatsapp_cloud_api',
      syncedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection('whatsappTemplates').updateOne(
      tenantFilter(session, { name, language }),
      { $set: withAgency(session, template), $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    return json({ success: true, template }, 201);
  } catch (error) {
    console.error('[whatsapp-templates] create failed:', String(error?.message || 'unknown error').slice(0, 160));
    return json({ error: 'Unable to create the WhatsApp template right now.' }, 500);
  }
}
