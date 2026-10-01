'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Star, ShieldCheck, MessageCircle, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

function HostReviewsInner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/host/reviews', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setData(d);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submitReply = async () => {
    if (!replyOpen || !replyText.trim()) return;
    setSaving(true);
    try {
      const isEdit = !!replyOpen.hostReply;
      const r = await fetch(`/api/reviews/${replyOpen.id}/reply`, {
        method: isEdit ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: replyText.trim() }),
      });
      const d = await r.json();
      if (d.ok) { toast.success('Reply saved'); setReplyOpen(null); setReplyText(''); load(); }
      else toast.error(d.error || 'Failed');
    } finally { setSaving(false); }
  };

  const stats = useMemo(() => {
    if (!data) return null;
    const revs = data.reviews;
    const avg = revs.length ? revs.reduce((s, r) => s + Number(r.rating || 0), 0) / revs.length : 0;
    return {
      avg: avg.toFixed(2),
      count: revs.length,
      pending: data.pendingReplies,
      responseRate: revs.length ? ((revs.filter((r) => r.hostReply).length / revs.length) * 100).toFixed(0) : 0,
    };
  }, [data]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/dashboard/host" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Host Studio
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Reviews & Reputation</h1>
        <p className="text-sm text-muted-foreground mt-1">Reviews received on your listings, your trust score, and badges earned.</p>

        {loading || !data ? (
          <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Reputation summary */}
            <div className="rounded-2xl border bg-white p-5">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                  <div className="text-[10px] uppercase text-emerald-700 font-bold">Trust Score</div>
                  <div className="font-display text-4xl font-bold text-emerald-700">{data.score.trustScore}</div>
                  <div className="text-xs text-muted-foreground">out of 100</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold">Average Rating</div>
                  <div className="font-display text-3xl font-bold flex items-center gap-1"><Star className="size-6 fill-amber-500 text-amber-500" /> {stats.avg}</div>
                  <div className="text-xs text-muted-foreground">{stats.count} review{stats.count === 1 ? '' : 's'}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold">Response Rate</div>
                  <div className="font-display text-3xl font-bold">{stats.responseRate}%</div>
                  <div className="text-xs text-muted-foreground">{stats.pending} pending repl{stats.pending === 1 ? 'y' : 'ies'}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold">Acceptance</div>
                  <div className="font-display text-3xl font-bold">{data.score.metrics.acceptanceRate}%</div>
                  <div className="text-xs text-muted-foreground">Cancel: {data.score.metrics.cancellationRate}%</div>
                </div>
              </div>
              {data.score.badges.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">Badges Earned</div>
                  <div className="flex flex-wrap gap-2">
                    {data.score.badges.map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Award className="size-3" /> {b.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews list */}
            <div className="rounded-2xl border bg-white">
              <div className="p-5 border-b">
                <div className="font-display text-lg font-bold">Reviews Received</div>
              </div>
              {data.reviews.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No reviews yet.</div>
              ) : (
                <div className="divide-y">
                  {data.reviews.map((r) => (
                    <div key={r.id} className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-sm">{r.userName}</div>
                            {r.verifiedBooking && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{r.listingId ? '' : ''} · {new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="inline-flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-3 ${i <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />)}</div>
                      </div>
                      {r.title && <div className="font-semibold text-sm mt-1">{r.title}</div>}
                      {r.reviewText && <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{r.reviewText}</div>}
                      {r.hostReply ? (
                        <div className="mt-2 rounded-xl bg-emerald-50/60 border-l-4 border-emerald2 p-3">
                          <div className="text-[10px] uppercase text-emerald-700 font-bold">Your reply</div>
                          <div className="text-sm mt-0.5 whitespace-pre-wrap">{r.hostReply.text}</div>
                          <button onClick={() => { setReplyOpen(r); setReplyText(r.hostReply.text); }} className="text-[10px] text-emerald2 hover:underline mt-1">Edit reply</button>
                        </div>
                      ) : (
                        <button onClick={() => { setReplyOpen(r); setReplyText(''); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald2 hover:underline">
                          <MessageCircle className="size-3" /> Reply
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {replyOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="font-display text-lg font-bold">Reply to {replyOpen.userName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{replyOpen.hostReply ? 'Editing your existing reply' : 'This will be visible under the review'}</div>
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} placeholder="Thank you for staying with us..." className="w-full mt-3 px-3 py-2 rounded-xl border text-sm" />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReplyOpen(null)}>Cancel</Button>
              <Button onClick={submitReply} disabled={saving || !replyText.trim()} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                {replyOpen.hostReply ? 'Update' : 'Post reply'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['host', 'admin', 'super_admin']}><HostReviewsInner /></ProtectedRoute>;
}
