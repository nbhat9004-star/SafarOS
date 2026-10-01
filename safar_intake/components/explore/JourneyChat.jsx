'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Send, Loader2, Pin, Trash2, ImagePlus, Users, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/**
 * JourneyChat — inline group chat for a journey.
 * Only renders content if the current user is an accepted member (curator or traveler).
 * Handles: read, send text+image, pin (organizer), delete own message, archived state.
 */
export default function JourneyChat({ journey, isOwner, isMember, archived }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const canParticipate = !!(user && (isOwner || isMember));

  const load = useCallback(async () => {
    if (!canParticipate) return;
    try {
      const r = await fetch(`/api/circle/journeys/${journey.id}/chat?limit=200`);
      const j = await r.json();
      if (j.ok) setMessages(j.messages || []);
    } catch {}
  }, [canParticipate, journey.id]);

  useEffect(() => { if (open) load(); }, [open, load]);
  // Light poll every 15s while open
  useEffect(() => {
    if (!open || !canParticipate) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [open, canParticipate, load]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if ((!text.trim() && !imageUrl.trim()) || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/circle/journeys/${journey.id}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), image: imageUrl.trim() || undefined }),
      });
      const j = await r.json();
      if (j.ok) {
        setMessages(m => [...(m || []), j.message]);
        setText(''); setImageUrl(''); setShowImageInput(false);
      }
    } catch {}
    setBusy(false);
  };

  const pin = async (mid) => {
    const r = await fetch(`/api/circle/journeys/${journey.id}/chat/${mid}/pin`, { method: 'POST' });
    const j = await r.json();
    if (j.ok) setMessages(m => m.map(x => x.id === mid ? { ...x, pinned: j.pinned } : x));
  };
  const del = async (mid) => {
    if (!confirm('Delete this message?')) return;
    await fetch(`/api/circle/journeys/${journey.id}/chat/${mid}`, { method: 'DELETE' });
    setMessages(m => m.filter(x => x.id !== mid));
  };

  if (!canParticipate) {
    return (
      <div className="e-glass rounded-2xl p-4 text-center text-sm" style={{ color: 'var(--e-text-muted)' }}>
        <Lock className="size-4 inline mr-1" /> Group chat is available only to accepted members.
      </div>
    );
  }

  const pinned = (messages || []).filter(m => m.pinned);

  return (
    <div className="e-glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.04] transition text-left"
      >
        <div className="size-9 rounded-full bg-gradient-to-br from-emerald-300 to-violet-400 grid place-items-center text-[#06080f] shrink-0">
          <MessageCircle className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Journey group chat</div>
          <div className="text-[11px]" style={{ color: 'var(--e-text-muted)' }}>{archived ? 'Archived — read-only' : `${isMember || isOwner ? 'You are a member' : ''}`}</div>
        </div>
        <div className="text-xs" style={{ color: 'var(--e-text-dim)' }}>{open ? 'Hide' : 'Open'}</div>
      </button>

      {open && (
        <div className="border-t border-white/10">
          {pinned.length > 0 && (
            <div className="px-3 py-2 bg-amber-400/[0.06] border-b border-amber-300/20 text-[11px] flex gap-2 items-start">
              <Pin className="size-3 text-amber-300 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                {pinned.map(p => (
                  <div key={p.id} className="truncate"><span className="font-semibold">{p.userName}:</span> {p.text || '📷 image'}</div>
                ))}
              </div>
            </div>
          )}
          <div ref={scrollRef} className="max-h-96 overflow-y-auto p-3 space-y-2" style={{ background: 'rgba(0,0,0,0.15)' }}>
            {messages === null && <div className="text-center py-4"><Loader2 className="size-4 animate-spin mx-auto text-white/50" /></div>}
            {messages && messages.length === 0 && <div className="text-center py-4 text-xs" style={{ color: 'var(--e-text-dim)' }}>No messages yet. Say hi 👋</div>}
            {(messages || []).map(m => {
              const mine = m.userId === user?.id;
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                  {m.userAvatar
                    ? <Image src={m.userAvatar} alt={m.userName} width={26} height={26} className="rounded-full shrink-0" unoptimized />
                    : <div className="size-6 rounded-full bg-white/10 grid place-items-center text-[10px] shrink-0">{(m.userName||'?')[0]}</div>}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm ${mine ? 'bg-emerald-400/20' : 'bg-white/[0.06]'} group relative`}>
                    {!mine && <div className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--e-text-muted)' }}>{m.userName}</div>}
                    {m.image && <div className="mb-1 rounded-lg overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={m.image} alt="" className="max-h-56 object-cover" loading="lazy"/></div>}
                    {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--e-text-dim)' }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{m.pinned ? ' · 📌' : ''}</div>
                    <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-1">
                      {isOwner && <button onClick={() => pin(m.id)} title="Pin" className="text-white/60 hover:text-amber-300 p-0.5"><Pin className="size-3" /></button>}
                      {(mine || isOwner) && <button onClick={() => del(m.id)} title="Delete" className="text-white/60 hover:text-rose-300 p-0.5"><Trash2 className="size-3" /></button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {archived ? (
            <div className="p-3 text-center text-xs border-t border-white/10" style={{ color: 'var(--e-text-muted)' }}>This journey is archived. Chat is read-only.</div>
          ) : (
            <div className="p-2 border-t border-white/10 space-y-2">
              {showImageInput && (
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" className="w-full text-xs rounded-full bg-white/[0.04] border border-white/10 px-3 py-1.5 outline-none" />
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowImageInput(v => !v)} title="Add image" className="e-btn-ghost rounded-full size-8 grid place-items-center"><ImagePlus className="size-4" /></button>
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a message…" className="flex-1 text-sm rounded-full bg-white/[0.04] border border-white/10 px-4 py-2 outline-none" />
                <button onClick={send} disabled={busy || (!text.trim() && !imageUrl.trim())} className="e-btn-primary rounded-full size-8 grid place-items-center">{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
