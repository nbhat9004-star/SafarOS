'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { CheckCircle2, XCircle, Clock, MessageCircle, Loader2 } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import { REQUESTS_RECEIVED, REQUESTS_SENT } from '@/lib/explore-v2-data';
import { fetchReceivedRequests, decideRequest } from '@/lib/explore-api';
import { toast } from 'sonner';

export default function Requests() {
  const [tab, setTab] = useState('received');
  const [actioned, setActioned] = useState({});
  const [pending, setPending] = useState({});
  const [received, setReceived] = useState(REQUESTS_RECEIVED);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchReceivedRequests();
      if (list.length > 0) {
        setReceived(list.map(r => ({
          id: r.id,
          journeyId: r.journeyId,
          name: r.userName || 'Traveler',
          avatar: r.userAvatar || `https://i.pravatar.cc/80?u=${encodeURIComponent(r.userId || r.id)}`,
          mutual: r.mutual || 0,
          when: r.when || 'recently',
          message: r.message || `Wants to join${r.journeyName ? ' ' + r.journeyName : ''}`,
          trip: r.journeyName || 'your trip',
        })));
      }
    } catch { /* keep mock */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'received') load(); }, [tab, load]);

  const act = async (r, action) => {
    setPending(p => ({ ...p, [r.id]: action }));
    try {
      if (r.journeyId) await decideRequest(r.journeyId, r.id, action);
      setActioned(p => ({ ...p, [r.id]: action }));
      toast.success(action === 'accept' ? 'Traveler accepted' : 'Request declined');
    } catch (e) {
      toast.error(e.message || 'Could not update request');
    } finally {
      setPending(p => { const n = { ...p }; delete n[r.id]; return n; });
    }
  };

  return (
    <Shell>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pb-3">
          <h1 className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-center md:text-left">Join Requests</h1>
          <div className="mt-3 rounded-2xl bg-slate-100/70 p-1 grid grid-cols-2 max-w-sm mx-auto md:mx-0">
            {['received','sent'].map(id => {
              const active = tab === id;
              const count = id === 'received' ? received.length : REQUESTS_SENT.length;
              return (
                <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-[13.5px] font-semibold transition-all ${active ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-slate-600'}`}>
                  {id === 'received' ? 'Received' : 'Sent'}
                  {count > 0 && <span className={`text-[10px] font-bold size-5 grid place-items-center rounded-full ${active ? 'bg-rose-500 text-white' : 'bg-white text-violet-700'}`}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-5">
        {tab === 'received' && (
          <div className="space-y-3">
            {loading && <div className="py-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-violet-600" /></div>}
            {!loading && received.map(r => {
              const status = actioned[r.id];
              const busy = pending[r.id];
              return (
                <div key={r.id} className="rounded-2xl bg-white border border-slate-100 p-4">
                  <div className="flex items-start gap-3">
                    <Image src={r.avatar} alt={r.name} width={48} height={48} className="rounded-full object-cover" unoptimized />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[14px] text-slate-900">{r.name}</div>
                          <div className="text-[11.5px] text-slate-500">{r.mutual} mutual {r.mutual === 1 ? 'friend' : 'friends'} \u00B7 wants to join <span className="font-semibold text-slate-700">{r.trip}</span></div>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">{r.when}</span>
                      </div>
                      <p className="mt-2 text-[13px] text-slate-700">{r.message}</p>
                      {status ? (
                        <div className={`mt-3 inline-flex items-center gap-1 text-[12px] font-semibold ${status === 'accept' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {status === 'accept' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                          {status === 'accept' ? 'Accepted' : 'Declined'}
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button onClick={() => act(r, 'decline')} disabled={!!busy} className="rounded-xl border border-slate-200 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50">{busy === 'decline' ? '\u2026' : 'Decline'}</button>
                          <button onClick={() => act(r, 'accept')} disabled={!!busy} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-2 text-[13px] font-semibold active:scale-[0.98] transition disabled:opacity-70">{busy === 'accept' ? '\u2026' : 'Accept'}</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'sent' && (
          <div className="space-y-3">
            {REQUESTS_SENT.map(r => (
              <div key={r.id} className="rounded-2xl bg-white border border-slate-100 p-4 flex items-start gap-3">
                <Image src={r.cover} alt={r.trip} width={56} height={56} className="rounded-xl object-cover" unoptimized />
                <div className="flex-1">
                  <div className="font-semibold text-[14px] text-slate-900">{r.trip}</div>
                  <div className="text-[12px] text-slate-500">Hosted by {r.host}</div>
                  <div className="mt-2 flex items-center gap-2">
                    {r.status === 'accepted' ? (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700"><CheckCircle2 className="size-3.5" /> Accepted</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-amber-700"><Clock className="size-3.5" /> Pending</span>
                    )}
                    <span className="text-[11px] text-slate-400 ml-auto">{r.when}</span>
                  </div>
                </div>
                {r.status === 'accepted' && (
                  <button className="size-9 grid place-items-center rounded-full bg-violet-50 text-violet-600"><MessageCircle className="size-4" /></button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </Shell>
  );
}
