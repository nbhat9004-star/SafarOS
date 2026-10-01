'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { MessageCircle, Send, ArrowLeft, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// -------------------------------------------------------------------
// EXPLORE V3 — Messenger (trip chat, approved participants only)
// Lightweight polling-based chat. Text + image attachments (base64).
// -------------------------------------------------------------------
export default function MessengerPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/explore/chat/threads', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok) setThreads(j.threads || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (!user) return (
    <div className="container py-16 text-center">
      <MessageCircle className="size-12 mx-auto text-emerald2" />
      <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">Sign in to chat</h1>
      <Link href="/?auth=1" className="mt-4 inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 text-white font-semibold">Sign in</Link>
    </div>
  );

  return (
    <div className="container py-6 md:py-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal mb-4 flex items-center gap-3">
        <span className="inline-grid place-items-center size-10 rounded-2xl bg-emerald2 text-white"><MessageCircle className="size-5" /></span>
        Messenger
      </h1>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[68vh]">
        {/* Threads list */}
        <aside className={`border-r overflow-y-auto ${selected ? 'hidden md:block' : ''}`}>
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              You&apos;ll see chats here once you’re accepted into a trip.
            </div>
          ) : threads.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)} className={`w-full text-left p-4 border-b hover:bg-emerald-50/50 transition ${selected?.id === t.id ? 'bg-emerald-50/70' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="relative size-12 rounded-xl overflow-hidden bg-secondary shrink-0">
                  {t.cover && <Image src={t.cover} alt={t.name} fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-charcoal text-sm truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.lastMessage ? `${t.lastMessage.userName}: ${t.lastMessage.text || 'sent an image'}` : (t.destination?.name || 'No messages yet')}</div>
                </div>
              </div>
            </button>
          ))}
        </aside>

        {/* Thread pane */}
        <div className={`md:col-span-2 flex flex-col ${!selected ? 'hidden md:flex' : ''}`}>
          {selected ? <ThreadView trip={selected} onBack={() => setSelected(null)} me={user} /> : (
            <div className="flex-1 grid place-items-center text-center px-6">
              <div>
                <MessageCircle className="size-12 mx-auto text-emerald-300" />
                <div className="mt-3 font-semibold text-charcoal">Select a trip to open its chat</div>
                <div className="text-xs text-muted-foreground mt-1">Only approved participants can post here.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThreadView({ trip, onBack, me }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState('');
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/explore/chat/${trip.id}/messages`, { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setMessages(j.messages || []);
    } catch {}
  }, [trip.id]);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const pickImage = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2_500_000) { toast.error('Image must be under 2.5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAttachment(ev.target.result);
    reader.readAsDataURL(f);
  };

  const send = async () => {
    const t = text.trim(); if (!t && !attachment) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/explore/chat/${trip.id}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, attachment: attachment || undefined }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Send failed');
      setMessages((m) => [...m, j.message]);
      setText(''); setAttachment('');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="md:hidden size-9 rounded-full hover:bg-secondary/40 grid place-items-center"><ArrowLeft className="size-4" /></button>
        <div className="relative size-10 rounded-xl overflow-hidden bg-secondary shrink-0">
          {trip.cover && <Image src={trip.cover} alt={trip.name} fill sizes="40px" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-charcoal truncate">{trip.name}</div>
          <div className="text-xs text-muted-foreground truncate">{trip.destination?.name || 'Trip chat'}</div>
        </div>
        <Link href={`/explore/j/${trip.slug || trip.id}`} className="text-xs font-semibold text-emerald2 hover:underline">View trip</Link>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-emerald-50/30 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">No messages yet — say hi!</div>
        )}
        {messages.map((m) => {
          const mine = m.userId === me.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${mine ? 'bg-emerald2 text-white rounded-br-md' : 'bg-white border rounded-bl-md'}`}>
                {!mine && <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2 mb-0.5">{m.userName}</div>}
                {m.attachment && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={m.attachment} alt="attachment" className="max-w-full rounded-lg mb-1" />
                )}
                {m.text && <div className="text-sm whitespace-pre-line">{m.text}</div>}
                <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        })}
      </div>

      {attachment && (
        <div className="px-4 pt-2 flex items-center gap-2 border-t">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment} alt="preview" className="h-14 rounded-lg" />
          <button onClick={() => setAttachment('')} className="size-7 rounded-full bg-secondary grid place-items-center"><X className="size-3" /></button>
        </div>
      )}
      <div className="border-t p-3 flex items-center gap-2 bg-white">
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="size-10 rounded-full bg-secondary grid place-items-center hover:bg-emerald-50 text-emerald2 transition"><ImageIcon className="size-4" /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Message…" className="flex-1 h-10 px-3 rounded-full border bg-white text-sm outline-none focus:border-emerald2 focus:ring-2 focus:ring-emerald2/10" />
        <button onClick={send} disabled={busy || (!text.trim() && !attachment)} className="size-10 rounded-full bg-emerald2 hover:bg-emerald2-deep disabled:opacity-50 text-white grid place-items-center transition">{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button>
      </div>
    </>
  );
}
