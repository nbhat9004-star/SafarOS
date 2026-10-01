'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * MODULE 13 — Shared Chat Thread
 * Props:
 *   bookingId: string (required)
 *   onBack?: () => void   (mobile back nav)
 *   headerRight?: ReactNode
 */
export default function ChatThread({ bookingId, onBack, headerRight }) {
  const [messages, setMessages] = useState([]);
  const [booking, setBooking] = useState(null);
  const [viewerId, setViewerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const scrollerRef = useRef(null);
  const pollRef = useRef(null);

  const load = async ({ silent = false } = {}) => {
    if (!bookingId) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`/api/bookings/${bookingId}/messages`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) {
        setMessages(d.messages || []);
        setBooking(d.booking || null);
        setViewerId(d.viewerId);
      }
    } finally { if (!silent) setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [bookingId]);

  // Poll every 8s for near-realtime
  useEffect(() => {
    if (!bookingId) return;
    pollRef.current = setInterval(() => load({ silent: true }), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line
  }, [bookingId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = async () => {
    const txt = text.trim();
    if (!txt && !imageUrl) return;
    setSending(true);
    try {
      const r = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: txt, imageUrl: imageUrl || undefined }),
      });
      const d = await r.json();
      if (d.ok) {
        setText(''); setImageUrl(''); setShowImagePicker(false);
        load({ silent: true });
      } else {
        toast.error(d.error || 'Failed to send');
      }
    } catch { toast.error('Network error'); }
    finally { setSending(false); }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (loading) {
    return <div className="flex-1 grid place-items-center min-h-[60vh]"><Loader2 className="size-6 animate-spin text-emerald2" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] bg-white rounded-none md:rounded-2xl border-0 md:border overflow-hidden">
      {/* Header */}
      <div className="border-b p-3 md:p-4 flex items-center gap-3 bg-white sticky top-0 z-10">
        {onBack && (
          <button onClick={onBack} className="md:hidden size-9 grid place-items-center rounded-full hover:bg-secondary" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
        )}
        {booking?.listingImage && <img src={booking.listingImage} alt="" className="size-10 rounded-xl object-cover" />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{booking?.listingTitle || 'Conversation'}</div>
          <div className="text-[11px] text-muted-foreground truncate">Booking #{bookingId?.slice(0, 8) || ''}</div>
        </div>
        {headerRight}
      </div>

      {/* Message list */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 bg-secondary/20">
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center text-center">
            <div className="max-w-xs">
              <div className="text-4xl">💬</div>
              <div className="font-semibold mt-2">No messages yet</div>
              <div className="text-xs text-muted-foreground mt-1">Start a conversation about your booking.</div>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const own = m.senderId === viewerId;
            return (
              <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2.5 ${own ? 'bg-emerald2 text-white' : 'bg-white border'}`}>
                  {!own && <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-80">{m.senderName}</div>}
                  {m.imageUrl && (
                    <a href={m.imageUrl} target="_blank" rel="noreferrer" className="block mb-2">
                      <img src={m.imageUrl} alt="attachment" className="max-w-full rounded-xl" />
                    </a>
                  )}
                  {m.text && <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>}
                  <div className={`text-[10px] mt-1 ${own ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t p-3 md:p-4 bg-white sticky bottom-0">
        {imageUrl && (
          <div className="mb-2 flex items-center gap-2 p-2 rounded-xl border bg-secondary/40">
            <img src={imageUrl} alt="" className="size-12 rounded object-cover" />
            <div className="text-xs text-muted-foreground truncate flex-1">Image attached</div>
            <button onClick={() => setImageUrl('')} className="text-muted-foreground hover:text-rose-500"><X className="size-4" /></button>
          </div>
        )}
        {showImagePicker && (
          <div className="mb-2 p-3 rounded-xl border bg-white">
            <div className="text-xs font-semibold mb-1">Paste image URL</div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
            <div className="text-[10px] text-muted-foreground mt-1">Direct link to an image (JPG/PNG/WebP).</div>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowImagePicker((v) => !v)}
            className="size-10 shrink-0 grid place-items-center rounded-full border hover:bg-secondary text-emerald2"
            title="Attach image"
            aria-label="Attach image"
          >
            <ImageIcon className="size-5" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-2xl border text-sm resize-none max-h-32 outline-none focus:ring-2 focus:ring-emerald2/20"
          />
          <Button onClick={send} disabled={sending || (!text.trim() && !imageUrl)} className="size-10 rounded-full bg-emerald2 hover:bg-emerald2-deep p-0 shrink-0">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
