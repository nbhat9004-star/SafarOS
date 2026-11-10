// SafarOS — replaceable server-side AI provider abstraction (Phase 5.4).
// API keys are read from server-side env ONLY. They are never sent to the browser,
// never stored in MongoDB, and never hard-coded. Swap providers via AI_PROVIDER / AI_MODEL
// without changing the Copilot architecture.
import { decryptSecret } from '@/lib/secrets';

// Gemini 2.5 Flash is restricted for new API users. Move legacy SafarOS configs to the current stable Flash model.
export function normalizeAiModel(provider, model) {
  const value = String(model || '').trim();
  if (provider === 'gemini' && (!value || value === 'gemini-2.5-flash')) return 'gemini-3.8-flash';
  return value;
}

export function aiConfig() {
  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const model = process.env.AI_MODEL
    || (provider === 'openai' ? 'gpt-4o'
      : provider === 'gemini' ? 'gemini-3.8-flash'
        : 'claude-3-5-sonnet-latest');
  return { provider, model, configured: Boolean(keyFor(provider)) };
}

function keyFor(provider) {
  if (provider === 'openai') return process.env.OPENAI_API_KEY || '';
  if (provider === 'gemini') return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  return process.env.ANTHROPIC_API_KEY || '';
}

// Resolve the platform-selected provider from the database. Stored API keys are encrypted at rest.
export async function aiRuntimeConfig(db) {
  let selected = null;
  try { selected = await db.collection('platformAiProviders').findOne({ isActive: true }); } catch { /* env fallback below */ }
  if (selected?.provider) {
    const provider = String(selected.provider).toLowerCase();
    const key = selected.apiKeyEnc ? decryptSecret(selected.apiKeyEnc) : keyFor(provider);
    const model = normalizeAiModel(provider, selected.model || aiConfig().model);
    // Persist this one-time compatibility migration so the Super Admin card and runtime agree.
    if (provider === 'gemini' && selected.model !== model) {
      try { await db.collection('platformAiProviders').updateOne({ provider }, { $set: { model, updatedAt: new Date().toISOString() } }); } catch { /* runtime still uses normalized model */ }
    }
    return { provider, model, configured: Boolean(key), key, keyResolved: Boolean(key), keyLast4: selected.keyLast4 || '', source: selected.apiKeyEnc ? (key ? 'stored' : 'stored_unreadable') : (key ? 'env' : 'none') };
  }
  const config = aiConfig();
  return { ...config, key: keyFor(config.provider), keyResolved: Boolean(keyFor(config.provider)), keyLast4: keyFor(config.provider).slice(-4), source: keyFor(config.provider) ? 'env' : 'none' };
}

// Resolve an enabled secondary provider without changing the platform's selected primary.
async function aiBackupRuntimeConfig(db, primaryProvider) {
  const docs = await db.collection('platformAiProviders').find(
    { provider: { $in: ['gemini', 'openai', 'anthropic'] } },
    { projection: { _id: 0, provider: 1, model: 1, enabled: 1, apiKeyEnc: 1, keyLast4: 1, isActive: 1 } },
  ).toArray();
  const backup = docs.find((d) => d.provider !== primaryProvider && d.enabled !== false && d.isActive !== true);
  if (!backup) return null;
  const key = backup.apiKeyEnc ? decryptSecret(backup.apiKeyEnc) : keyFor(backup.provider);
  if (!key) return null;
  const defaultModel = backup.provider === 'openai' ? 'gpt-4o'
    : backup.provider === 'gemini' ? 'gemini-3.8-flash' : 'claude-3-5-sonnet-latest';
  return { provider: backup.provider, model: normalizeAiModel(backup.provider, backup.model || defaultModel), key };
}

function callProvider(config, request) {
  const args = { ...request, key: config.key, model: config.model };
  if (config.provider === 'anthropic') return anthropic(args);
  if (config.provider === 'openai') return openai(args);
  if (config.provider === 'gemini') return gemini(args);
  const e = new Error('Unsupported AI provider'); e.code = 'AI_UNSUPPORTED'; throw e;
}

function canFailover(error) {
  if (error?.code === 'AI_PROVIDER_ERROR') {
    // Provider-specific auth/model errors and temporary throttling/outages can use the backup.
    return [401, 403, 404, 408, 409, 429, 500, 502, 503, 504].includes(Number(error.providerStatus));
  }
  // fetch() network failures are TypeErrors in supported Node runtimes.
  return error instanceof TypeError || error?.name === 'AbortError';
}

// messages: [{ role: 'user' | 'assistant', text }]
export async function aiComplete({ db, system, messages, maxTokens = 900, temperature = 0.3 }) {
  const primary = await aiRuntimeConfig(db);
  const request = { system, messages, maxTokens, temperature };
  if (!primary.key) {
    const backup = await aiBackupRuntimeConfig(db, primary.provider);
    if (backup) {
      console.warn('[safaros] AI primary provider has no usable key; using configured backup:', primary.provider, '->', backup.provider);
      return callProvider(backup, request);
    }
    const e = new Error('AI provider is not configured'); e.code = 'AI_UNCONFIGURED'; throw e;
  }
  try {
    return await callProvider(primary, request);
  } catch (primaryError) {
    if (!canFailover(primaryError)) throw primaryError;
    let backup = null;
    try { backup = await aiBackupRuntimeConfig(db, primary.provider); } catch (lookupError) {
      console.warn('[safaros] AI backup provider lookup failed:', lookupError?.message || 'unknown error');
    }
    if (!backup) {
      console.warn('[safaros] AI primary provider failed and no enabled backup is configured:', primary.provider, primaryError.providerStatus || primaryError.code || 'network_error');
      throw primaryError;
    }
    console.warn('[safaros] AI failover activated:', primary.provider, '->', backup.provider, 'status:', primaryError.providerStatus || primaryError.code || 'network_error');
    try {
      return await callProvider(backup, request);
    } catch (backupError) {
      console.warn('[safaros] AI backup provider also failed:', backup.provider, backupError?.providerStatus || backupError?.code || 'network_error');
      // Preserve the primary failure as the primary diagnostic; never expose provider secrets.
      backupError.failoverFrom = primary.provider;
      backupError.failoverTo = backup.provider;
      throw backupError;
    }
  }
}

async function fail(res) {
  const raw = await res.text().catch(() => '');
  let payload = null;
  try { payload = JSON.parse(raw); } catch { /* provider did not return JSON */ }
  const providerMessage = String(payload?.error?.message || payload?.message || '').replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted]').replace(/(key=)[^&\s]+/gi, '$1[redacted]').slice(0, 500);
  const providerCode = String(payload?.error?.status || payload?.error?.code || '').slice(0, 80);
  const e = new Error('AI request failed');
  e.code = 'AI_PROVIDER_ERROR';
  e.providerStatus = res.status;
  e.providerCode = providerCode;
  e.providerMessage = providerMessage;
  e.detail = providerMessage || ('Provider returned HTTP ' + res.status);
  throw e;
}

async function anthropic({ key, model, system, messages, maxTokens, temperature }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature, system,
      messages: messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
    }),
  });
  if (!res.ok) return fail(res);
  const data = await res.json();
  return (data.content || []).map((c) => c.text || '').join('').trim();
}

async function openai({ key, model, system, messages, maxTokens, temperature }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature,
      messages: [{ role: 'system', content: system }, ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))],
    }),
  });
  if (!res.ok) return fail(res);
  const data = await res.json();
  return ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
}

async function gemini({ key, model, system, messages, maxTokens, temperature }) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    }),
  });
  if (!res.ok) return fail(res);
  const data = await res.json();
  const candidate = data.candidates && data.candidates[0];
  const parts = (candidate && candidate.content && candidate.content.parts) || [];
  const text = parts.map((p) => p.text || '').join('').trim();
  if (!text) {
    const reason = data.promptFeedback?.blockReason || candidate?.finishReason || 'EMPTY_RESPONSE';
    const e = new Error('Gemini returned no text: ' + reason);
    e.code = 'AI_PROVIDER_EMPTY_RESPONSE';
    e.providerCode = String(reason).slice(0, 80);
    e.providerMessage = 'Gemini returned no text (' + String(reason).slice(0, 120) + ').';
    throw e;
  }
  return text;
}
