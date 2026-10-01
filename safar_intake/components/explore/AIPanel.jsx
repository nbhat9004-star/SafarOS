'use client';
import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function AIPanel({ title = 'Safar AI', prompt, endpoint = '/api/ai-chat', suggestions = [], defaultOpen = false, systemHint = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState(prompt || '');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async (q) => {
    const message = q || input;
    if (!message.trim()) return;
    setLoading(true); setReply('');
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: systemHint ? `${systemHint}\n\n${message}` : message })
      });
      const j = await r.json();
      setReply(j.reply || j.text || j.error || 'AI is warming up — try again in a moment.');
    } catch {
      setReply('AI is warming up — try again in a moment.');
    } finally { setLoading(false); }
  };

  return (
    <div className="e-glass rounded-3xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-300 via-violet-400 to-fuchsia-400 grid place-items-center">
            <Sparkles className="size-4 text-[#06080f]" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-white text-sm">{title}</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">Live · Powered by AI</div>
          </div>
        </div>
        <button onClick={() => setOpen(v => !v)} className="text-xs text-white/70 hover:text-white transition">{open ? 'Hide' : 'Ask AI'}</button>
      </div>
      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="Ask me anything about your trip…" className="flex-1 bg-white/[0.06] border border-white/15 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/35 min-w-0" />
            <button onClick={() => ask()} disabled={loading} className="e-btn-primary rounded-full px-4 py-2 text-sm inline-flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Ask
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); ask(s); }} className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/75 hover:text-white transition">
                  {s}
                </button>
              ))}
            </div>
          )}
          {reply && (
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
              {reply}
              <button onClick={() => ask()} className="mt-3 text-[11px] text-white/60 hover:text-white inline-flex items-center gap-1 transition"><RefreshCw className="size-3" /> Regenerate</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
