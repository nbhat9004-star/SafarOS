// SafarOS — replaceable server-side AI provider abstraction (Phase 5.4).
// API keys are read from server-side env ONLY. They are never sent to the browser,
// never stored in MongoDB, and never hard-coded. Swap providers via AI_PROVIDER / AI_MODEL
// without changing the Copilot architecture.

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

// messages: [{ role: 'user' | 'assistant', text }]
export async function aiComplete({ system, messages, maxTokens = 900, temperature = 0.3 }) {
  const { provider, model } = aiConfig();
  const key = keyFor(provider);
  if (!key) { const e = new Error('AI provider is not configured'); e.code = 'AI_UNCONFIGURED'; throw e; }
  if (provider === 'anthropic') return anthropic({ key, model, system, messages, maxTokens, temperature });
  if (provider === 'openai') return openai({ key, model, system, messages, maxTokens, temperature });
  if (provider === 'gemini') return gemini({ key, model, system, messages, maxTokens, temperature });
  const e = new Error('Unsupported AI provider'); e.code = 'AI_UNSUPPORTED'; throw e;
}

async function fail(res) {
  const t = await res.text().catch(() => '');
  const e = new Error('AI request failed');
  e.code = 'AI_PROVIDER_ERROR';
  e.detail = String(t).slice(0, 300);
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
