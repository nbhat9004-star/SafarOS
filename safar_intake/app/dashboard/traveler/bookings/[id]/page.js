'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar, Loader2, X, Phone, ArrowLeft, Clock, User, Shield,
  CheckCircle2, XCircle, RotateCcw, Mail, FileText, Sparkles, MapPin,
  MessageCircle, Send,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { bookingsApi } from '@/lib/listings-api';

const StatusPill = ({ s }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald2 border-emerald-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    cancelled:'bg-secondary text-muted-foreground border-border',
  };
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${map[s]||'bg-secondary'}`}>{s}</span>;
};

// Rich engine-state pill from the Universal Booking Engine.
// Reads the extended `engineState` on booking + optional host deadline.
const EngineStatePill = ({ s, deadlineAt, forwardCount }) => {
  const map = {
    pending_confirmation:      { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending confirmation' },
    searching_host:            { cls: 'bg-sky-50 text-sky-700 border-sky-200',       label: '🔍 Searching for host' },
    host_reviewing:            { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: '👤 Host reviewing' },
    forwarded_to_another_host: { cls: 'bg-violet-50 text-violet-700 border-violet-200', label: '🔄 Finding another host' },
    confirmed:                 { cls: 'bg-emerald-50 text-emerald2 border-emerald-200', label: '✅ Confirmed' },
    completed:                 { cls: 'bg-emerald-50 text-emerald2 border-emerald-200', label: '🏁 Completed' },
    cancelled:                 { cls: 'bg-secondary text-muted-foreground border-border', label: 'Cancelled' },
    expired:                   { cls: 'bg-secondary text-muted-foreground border-border', label: 'Expired' },
    rejected_by_all_hosts:     { cls: 'bg-rose-50 text-rose-600 border-rose-200',   label: 'No host available' },
    payment_issue:             { cls: 'bg-rose-50 text-rose-600 border-rose-200',   label: 'Payment issue' },
  };
  const m = map[s] || { cls: 'bg-secondary', label: String(s || '').replace(/_/g, ' ') };
  const showTimer = deadlineAt && ['host_reviewing','forwarded_to_another_host'].includes(s);
  const mins = showTimer ? Math.max(0, Math.round((new Date(deadlineAt).getTime() - Date.now()) / 60000)) : null;
  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${m.cls}`}>
      {m.label}
      {typeof forwardCount === 'number' && forwardCount > 0 && <span className="opacity-70">· hop {forwardCount}</span>}
      {showTimer && mins !== null && <span className="opacity-70">· {mins}m left</span>}
    </span>
  );
};

const ACTION_META = {
  created:                    { i: Sparkles,     color: 'text-emerald2',    bg: 'bg-emerald-50 border-emerald-200',  label: 'Booking created' },
  approved:                   { i: CheckCircle2, color: 'text-emerald2',    bg: 'bg-emerald-50 border-emerald-200',  label: 'Booking approved by host' },
  rejected:                   { i: XCircle,      color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200',        label: 'Booking rejected by host' },
  cancelled:                  { i: X,            color: 'text-muted-foreground', bg: 'bg-secondary border-border',   label: 'Booking cancelled' },
  refunded:                   { i: RotateCcw,    color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',        label: 'Refund issued' },
  invoice_sent:               { i: Mail,         color: 'text-emerald2',    bg: 'bg-emerald-50 border-emerald-200',  label: 'Invoice sent' },
  status_changed:             { i: FileText,     color: 'text-charcoal',    bg: 'bg-secondary border-border',        label: 'Status updated' },
  // Universal Booking Engine
  host_reviewing:             { i: User,         color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200',    label: '👤 Host reviewing' },
  host_rejected:              { i: XCircle,      color: 'text-rose-500',    bg: 'bg-rose-50 border-rose-200',        label: 'Host declined' },
  forwarded_to_another_host:  { i: RotateCcw,    color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200',    label: '🔄 Forwarded to another host' },
  confirmed:                  { i: CheckCircle2, color: 'text-emerald2',    bg: 'bg-emerald-50 border-emerald-200',  label: '✅ Booking confirmed' },
  rejected_by_all_hosts:      { i: XCircle,      color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200',        label: 'No host available' },
  payment_received:           { i: CheckCircle2, color: 'text-emerald2',    bg: 'bg-emerald-50 border-emerald-200',  label: '💳 Payment received' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function BookingDetailInner() {
  const params = useParams();
  const id = params?.id;
  const [booking, setBooking] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true); setError(null);
    const [b, t] = await Promise.all([
      bookingsApi.get(id),
      bookingsApi.timeline(id),
    ]);
    if (b.ok && b.data?.ok) setBooking(b.data.booking);
    else setError(b.data?.error || `Failed to load booking (${b.status})`);
    if (t.ok && t.data?.ok) setEvents(t.data.events || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const cancel = async () => {
    if (!booking) return;
    if (!confirm('Cancel this booking? This action cannot be undone.')) return;
    setCancelling(true);
    const { ok, data } = await bookingsApi.patch(booking.bookingId, 'cancelled');
    setCancelling(false);
    if (!ok) return toast.error(data?.error || 'Cancel failed');
    toast.success('Booking cancelled');
    load();
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-5xl">
        <Button asChild variant="ghost" size="sm" className="rounded-full mb-6 -ml-2">
          <Link href="/dashboard/traveler/bookings"><ArrowLeft className="size-4 mr-2" /> Back to My Bookings</Link>
        </Button>

        {loading && (
          <div className="py-20 grid place-items-center">
            <Loader2 className="size-8 animate-spin text-emerald2" />
            <p className="text-sm text-muted-foreground mt-3">Loading booking details...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-10 border rounded-3xl bg-white text-center">
            <XCircle className="size-8 mx-auto text-rose-500" />
            <div className="font-display text-xl font-bold mt-3">Unable to load booking</div>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button asChild variant="outline" className="rounded-full mt-4">
              <Link href="/dashboard/traveler/bookings">Back to bookings</Link>
            </Button>
          </div>
        )}

        {!loading && !error && booking && (
          <>
            {/* Header card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border bg-white overflow-hidden flex flex-col md:flex-row shadow-sm mb-6">
              {booking.listingImage && (
                <div className="md:w-72 h-56 md:h-auto relative overflow-hidden shrink-0">
                  <img src={booking.listingImage} alt={booking.listingTitle}
                    className="absolute inset-0 size-full object-cover" />
                </div>
              )}
              <div className="p-6 md:p-8 flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill s={booking.status} />
                    {booking.engineState && booking.engineState !== booking.status && (
                      <EngineStatePill s={booking.engineState} deadlineAt={booking.hostDeadlineAt} forwardCount={booking.hostForwardCount} />
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">#{booking.bookingId.slice(0, 12)}</div>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold">{booking.listingTitle}</h1>
                {booking.inventoryTypeName && (
                  <p className="text-sm text-emerald2 font-medium mt-1">{booking.inventoryTypeName}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                  <User className="size-3.5" /> Host: <span className="font-medium text-foreground">{booking.hostName}</span>
                </p>

                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Check-in</div>
                    <div className="font-semibold mt-0.5">{fmtDate(booking.checkInDate)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Check-out</div>
                    <div className="font-semibold mt-0.5">{fmtDate(booking.checkOutDate)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nights</div>
                    <div className="font-semibold mt-0.5">{booking.nights}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Guests</div>
                    <div className="font-semibold mt-0.5">{booking.guests}</div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Total amount</div>
                    <div className="font-display text-3xl font-bold text-emerald2">
                      ₹{(booking.totalPrice || 0).toLocaleString('en-IN')}
                    </div>
                    {booking.refunded && (
                      <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                        <RotateCcw className="size-3" /> Refunded
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={`/property/${booking.listingId}`}><MapPin className="size-3.5 mr-1" /> View Property</Link>
                    </Button>
                    {booking.hostPhone && (
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <a href={`tel:${booking.hostPhone}`}><Phone className="size-3.5 mr-1" /> Call Host</a>
                      </Button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'approved') && (
                      <Button onClick={cancel} disabled={cancelling}
                        size="sm" variant="outline" className="rounded-full text-rose-600 hover:bg-rose-50">
                        {cancelling ? <Loader2 className="size-4 mr-1 animate-spin" /> : <X className="size-4 mr-1" />}
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="size-5 text-emerald2" />
                <h2 className="font-display text-2xl font-bold">Booking Timeline</h2>
              </div>

              {events.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No events yet for this booking.
                </div>
              )}

              {events.length > 0 && (
                <ol className="relative border-l-2 border-dashed border-emerald-200 pl-6 ml-2 space-y-6">
                  {events.map((e, i) => {
                    const meta = ACTION_META[e.action] || {
                      i: FileText, color: 'text-charcoal', bg: 'bg-secondary border-border', label: e.action,
                    };
                    const Ico = meta.i;
                    return (
                      <li key={e.id || i} className="relative">
                        <span className={`absolute -left-[35px] top-0 grid place-items-center size-8 rounded-full border-2 ${meta.bg}`}>
                          <Ico className={`size-4 ${meta.color}`} />
                        </span>
                        <div className="rounded-2xl border bg-white p-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <div className="font-semibold text-sm">{meta.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                {e.actorRole === 'admin' ? <Shield className="size-3" /> : <User className="size-3" />}
                                {e.actorName || 'System'}
                                {e.actorRole && <span className="ml-1 opacity-60">· {e.actorRole}</span>}
                              </div>
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                              {fmtDateTime(e.timestamp)}
                            </div>
                          </div>
                          {e.details && Object.keys(e.details).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-dashed grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              {e.details.reason && (
                                <div className="sm:col-span-2">
                                  <span className="text-muted-foreground">Reason:</span>{' '}
                                  <span className="font-medium">{e.details.reason}</span>
                                </div>
                              )}
                              {e.details.previousStatus && (
                                <div>
                                  <span className="text-muted-foreground">Previous status:</span>{' '}
                                  <span className="font-medium">{e.details.previousStatus}</span>
                                </div>
                              )}
                              {typeof e.details.amount === 'number' && (
                                <div>
                                  <span className="text-muted-foreground">Amount:</span>{' '}
                                  <span className="font-medium">₹{Number(e.details.amount).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {e.details.invoiceId && (
                                <div className="sm:col-span-2">
                                  <span className="text-muted-foreground">Invoice ID:</span>{' '}
                                  <span className="font-medium font-mono">{e.details.invoiceId}</span>
                                </div>
                              )}
                              {typeof e.details.nights === 'number' && (
                                <div>
                                  <span className="text-muted-foreground">Nights:</span>{' '}
                                  <span className="font-medium">{e.details.nights}</span>
                                </div>
                              )}
                              {typeof e.details.guests === 'number' && (
                                <div>
                                  <span className="text-muted-foreground">Guests:</span>{' '}
                                  <span className="font-medium">{e.details.guests}</span>
                                </div>
                              )}
                              {typeof e.details.totalPrice === 'number' && (
                                <div>
                                  <span className="text-muted-foreground">Total:</span>{' '}
                                  <span className="font-medium">₹{Number(e.details.totalPrice).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {e.details.by && (
                                <div>
                                  <span className="text-muted-foreground">By:</span>{' '}
                                  <span className="font-medium capitalize">{e.details.by}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* MODULE 11 (Messaging) — Booking conversation thread */}
            <BookingMessages bookingId={booking.bookingId} />
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}

// MODULE 11 (Messaging) — reusable conversation panel scoped to one booking.
// Works for traveler / host / admin (same permission model as the parent page).
// Polls every 15s for new messages; auto-marks-read on view; auto-clears in-app
// notifications for this booking on the server side (see GET messages endpoint).
function BookingMessages({ bookingId }) {
  const [state, setState] = useState({ loading: true, messages: [], viewerId: null, error: null });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`/api/bookings/${bookingId}/messages`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setState({ loading: false, messages: d.messages || [], viewerId: d.viewerId, error: null });
      else setState((s) => ({ ...s, loading: false, error: d.error || 'Failed to load messages' }));
    } catch (e) { setState((s) => ({ ...s, loading: false, error: 'Failed to load messages' })); }
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const send = async (e) => {
    e?.preventDefault?.();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const r = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const d = await r.json();
      if (d.ok) {
        setText('');
        setState((s) => ({ ...s, messages: [...s.messages, d.message] }));
      } else {
        toast.error(d.error || 'Failed to send');
      }
    } catch (e) { toast.error('Failed to send'); }
    setSending(false);
  };

  return (
    <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="size-5 text-emerald2" />
        <h2 className="font-display text-2xl font-bold">Messages</h2>
        <span className="ml-2 text-xs text-muted-foreground">{state.messages.length} in this thread</span>
      </div>

      {state.loading && (
        <div className="py-8 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-emerald2" />
        </div>
      )}

      {!state.loading && state.error && (
        <div className="text-sm text-rose-600 py-4">{state.error}</div>
      )}

      {!state.loading && !state.error && (
        <>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 pb-2">
            {state.messages.length === 0 && (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No messages yet — start the conversation about your stay below.
              </div>
            )}
            {state.messages.map((m) => {
              const mine = m.senderId === state.viewerId;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-emerald2 text-white rounded-br-sm' : 'bg-secondary rounded-bl-sm'}`}>
                    {!mine && (
                      <div className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-0.5">
                        {m.senderName || 'Unknown'}
                        {m.senderRole && m.senderRole !== 'traveler' && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/60 text-charcoal font-semibold">{m.senderRole}</span>
                        )}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
                    <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {new Date(m.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={send} className="mt-4 pt-4 border-t flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type your message..."
              rows={2}
              maxLength={4000}
              className="flex-1 px-4 py-2.5 rounded-2xl border bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald2/40"
            />
            <Button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold shrink-0"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <span className="hidden sm:inline ml-2">Send</span>
            </Button>
          </form>
          <div className="text-[11px] text-muted-foreground mt-2">
            Both parties (and Safar admins) receive an email + in-app notification when you send.
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ProtectedRoute roles={['traveler', 'host', 'admin']}>
      <BookingDetailInner />
    </ProtectedRoute>
  );
}
