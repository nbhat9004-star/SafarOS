// SafarOS — replaceable server-side AI provider abstraction (Phase 5.4).
// API keys are read from server-side env ONLY. They are never sent to the browser,
// never stored in MongoDB, and never hard-coded. Swap providers via AI_PROVIDER / AI_MODEL
// without changing the Copilot architecture.
import { decryptSecret } from '@/lib/secrets';

export function aiConfig() {
  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const model = process.env.AI_MODEL
    || (provider === 'openai' ? 'gpt-4o'
      : provider === 'gemini' ? 'gemini-1.5-pro'
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
    return { provider, model: selected.model || (provider === 'gemini' ? 'gemini-2.5-flash' : aiConfig().model), configured: Boolean(key), key, source: selected.apiKeyEnc ? 'stored' : (key ? 'env' : 'none') };
  }
  const config = aiConfig();
  return { ...config, key: keyFor(config.provider), source: keyFor(config.provider) ? 'env' : 'none' };
}

// messages: [{ role: 'user' | 'assistant', text }]
export async function aiComplete({ db, system, messages, maxTokens = 900, temperature = 0.3 }) {
  const { provider, model, key } = await aiRuntimeConfig(db);
  if (!key) { const e = new Error('AI provider is not configured'); e.code = 'AI_UNCONFIGURED'; throw e; }
  if (provider === 'anthropic') return anthropic({ key, model, system, messages, maxTokens, temperature });
  if (provider === 'openai') return openai({ key, model, system, messages, maxTokens, temperature });
  if (provider === 'gemini') return gemini({ key, model, system, messages, maxTokens, temperature });
  const e = new Error('Unsupported AI provider'); e.code = 'AI_UNSUPPORTED'; throw e;
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
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    }),
  });
  if (!res.ok) return fail(res);
  const data = await res.json();
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  return parts.map((p) => p.text || '').join('').trim();
}
