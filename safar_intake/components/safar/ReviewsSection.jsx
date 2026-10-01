'use client';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Star, ThumbsUp, ThumbsDown, ShieldCheck, Camera, Video, MessageCircle, Flag, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CATEGORY_LABELS = {
  cleanliness: 'Cleanliness',
  location: 'Location',
  value: 'Value',
  hostBehaviour: 'Host',
  communication: 'Communication',
  accuracy: 'Accuracy',
  amenities: 'Amenities',
  safety: 'Safety',
};

function StarRow({ v = 0, size = 4 }) {
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  return (
    <div className={`inline-flex items-center gap-0.5 text-amber-500`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-${size} ${i <= full ? 'fill-amber-500' : (i === full + 1 && half ? 'fill-amber-500/40' : 'fill-transparent')}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function VerifiedPill({ label = 'Verified Booking' }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
      <ShieldCheck className="size-3" /> {label}
    </span>
  );
}

function ReviewCard({ r, viewerId, canReplyAsHost, onVote, onReport, onReply, onDeleteReply, isAdmin }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(r.hostReply?.text || '');
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportNote, setReportNote] = useState('');
  const [voting, setVoting] = useState(false);
  const [replySaving, setReplySaving] = useState(false);
  const myVote = (r.helpfulVoters || []).includes(viewerId) ? 'helpful'
              : (r.notHelpfulVoters || []).includes(viewerId) ? 'not_helpful' : null;

  const submitVote = async (vote) => {
    setVoting(true);
    try { await onVote?.(r.id, vote); } finally { setVoting(false); }
  };
  const submitReport = async () => {
    await onReport?.(r.id, reportReason, reportNote);
    setReporting(false); setReportNote('');
  };
  const submitReply = async () => {
    if (!replyText.trim()) return;
    setReplySaving(true);
    try {
      await onReply?.(r.id, replyText.trim(), !!r.hostReply);
      setReplyOpen(false);
    } finally { setReplySaving(false); }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-full bg-emerald2 text-white grid place-items-center font-bold shrink-0">
          {(r.userName || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-sm">{r.userName || 'Anonymous'}</div>
            {r.verifiedBooking && <VerifiedPill />}
            {r.verifiedTraveler && <VerifiedPill label="Verified Traveler" />}
            {r.visitType && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-secondary">{r.visitType}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRow v={r.rating} />
            <span className="text-xs font-semibold">{Number(r.rating).toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground">· {new Date(r.createdAt).toLocaleDateString()}</span>
            {r.stayMonth && <span className="text-[10px] text-muted-foreground">· Stayed {r.stayMonth}</span>}
          </div>
          {r.title && <div className="font-semibold text-sm mt-2">{r.title}</div>}
          {r.reviewText && <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{r.reviewText}</div>}
          {(r.pros || r.cons) && (
            <div className="mt-2 grid md:grid-cols-2 gap-2">
              {r.pros && <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2 text-xs"><span className="font-semibold text-emerald-700">Pros:</span> {r.pros}</div>}
              {r.cons && <div className="rounded-xl bg-rose-50 border border-rose-100 p-2 text-xs"><span className="font-semibold text-rose-700">Cons:</span> {r.cons}</div>}
            </div>
          )}
          {r.categories && Object.keys(r.categories).length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(r.categories).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-secondary/40 p-2">
                  <div className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[k] || k}</div>
                  <div className="flex items-center gap-1 mt-0.5"><StarRow v={v} size={3} /><span className="text-xs font-semibold">{v}</span></div>
                </div>
              ))}
            </div>
          )}
          {r.photos?.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {r.photos.slice(0, 10).map((p, i) => (
                <a key={i} href={p} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={p} alt="" loading="lazy" className="size-24 rounded-xl object-cover border" />
                </a>
              ))}
            </div>
          )}
          {r.videos?.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {r.videos.slice(0, 2).map((v, i) => (
                <video key={i} src={v} controls preload="metadata" className="size-32 rounded-xl object-cover border" />
              ))}
            </div>
          )}
          {r.hostReply && (
            <div className="mt-3 rounded-2xl bg-secondary/60 border-l-4 border-emerald2 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold"><MessageCircle className="size-3 text-emerald2" /> Host reply · {r.hostReply.hostName}</div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{r.hostReply.text}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{new Date(r.hostReply.createdAt).toLocaleString()}</div>
              {isAdmin && (
                <button onClick={() => onDeleteReply?.(r.id)} className="text-[10px] text-rose-500 hover:underline mt-1">Remove reply (admin)</button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => submitVote('helpful')}
              disabled={voting}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${myVote === 'helpful' ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:bg-secondary'}`}
            >
              <ThumbsUp className="size-3" /> Helpful ({r.helpfulCount || 0})
            </button>
            <button
              onClick={() => submitVote('not_helpful')}
              disabled={voting}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${myVote === 'not_helpful' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white hover:bg-secondary'}`}
            >
              <ThumbsDown className="size-3" /> {r.notHelpfulCount || 0}
            </button>
            {canReplyAsHost && (
              <button onClick={() => setReplyOpen((v) => !v)} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border bg-white hover:bg-secondary">
                <MessageCircle className="size-3" /> {r.hostReply ? 'Edit reply' : 'Reply'}
              </button>
            )}
            <button onClick={() => setReporting((v) => !v)} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border bg-white hover:bg-rose-50 hover:text-rose-600 ml-auto">
              <Flag className="size-3" /> Report
            </button>
          </div>

          {reporting && (
            <div className="mt-2 rounded-xl border bg-white p-3">
              <div className="text-xs font-semibold mb-2">Report this review</div>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm mb-2">
                <option value="spam">Spam</option>
                <option value="fake">Fake Review</option>
                <option value="offensive">Offensive</option>
                <option value="wrong_property">Wrong Property</option>
                <option value="duplicate">Duplicate</option>
                <option value="other">Other</option>
              </select>
              <textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)} rows={2} placeholder="Additional context (optional)" className="w-full px-3 py-2 rounded-lg border text-sm" />
              <div className="mt-2 flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setReporting(false)}>Cancel</Button>
                <Button size="sm" onClick={submitReport} className="rounded-full bg-rose-500 hover:bg-rose-600">Submit report</Button>
              </div>
            </div>
          )}

          {replyOpen && (
            <div className="mt-2 rounded-xl border bg-white p-3">
              <div className="text-xs font-semibold mb-2">Reply to review</div>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="Thanks for the feedback..." className="w-full px-3 py-2 rounded-lg border text-sm" />
              <div className="mt-2 flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={submitReply} disabled={replySaving || !replyText.trim()} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                  {replySaving ? <Loader2 className="size-3 mr-1 animate-spin" /> : null}
                  {r.hostReply ? 'Update reply' : 'Post reply'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewsSection({ listingId, viewerId, viewerRole, hostId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({ verified: false, photos: false, videos: false, rating: '', visitType: '' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [showFilters, setShowFilters] = useState(false);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ sort, page, pageSize });
      if (filters.verified) params.set('verified', '1');
      if (filters.photos) params.set('photos', '1');
      if (filters.videos) params.set('videos', '1');
      if (filters.rating) params.set('rating', filters.rating);
      if (filters.visitType) params.set('visitType', filters.visitType);
      const r = await fetch(`/api/listings/${listingId}/reviews?${params.toString()}`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setData(d);
    } finally { if (!silent) setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [sort, page, filters.verified, filters.photos, filters.videos, filters.rating, filters.visitType]);

  const vote = async (id, vote) => {
    const r = await fetch(`/api/reviews/${id}/vote`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote }) });
    const d = await r.json();
    if (d.ok) load({ silent: true });
    else toast.error(d.error || 'Please sign in to vote');
  };
  const report = async (id, reason, note) => {
    const r = await fetch(`/api/reviews/${id}/report`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason, note }) });
    const d = await r.json();
    if (d.ok) toast.success('Thanks. Our team will review this.');
    else toast.error(d.error || 'Failed');
  };
  const reply = async (id, text, isEdit) => {
    const r = await fetch(`/api/reviews/${id}/reply`, { method: isEdit ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const d = await r.json();
    if (d.ok) { toast.success('Reply saved'); load({ silent: true }); }
    else toast.error(d.error || 'Failed');
  };
  const deleteReply = async (id) => {
    if (!confirm('Remove host reply?')) return;
    const r = await fetch(`/api/reviews/${id}/reply`, { method: 'DELETE', credentials: 'include' });
    const d = await r.json();
    if (d.ok) { toast.success('Reply removed'); load({ silent: true }); }
  };

  const s = data?.summary;
  const totalReviews = s?.count || 0;
  const canReplyAsHost = viewerRole === 'host' && viewerId === hostId;
  const isAdmin = ['admin', 'super_admin'].includes(viewerRole);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-4">
      {/* Summary + histogram */}
      {loading && !data ? (
        <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
      ) : (
        <>
          <div className="rounded-2xl border bg-white p-5">
            <div className="grid md:grid-cols-[220px_1fr] gap-6">
              <div className="text-center md:text-left">
                <div className="font-display text-5xl font-bold">{s?.averageRating || 0}</div>
                <StarRow v={s?.averageRating || 0} size={5} />
                <div className="text-xs text-muted-foreground mt-1">Based on {totalReviews} review{totalReviews === 1 ? '' : 's'}</div>
              </div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = s?.histogram?.[n] || 0;
                  const w = totalReviews ? (c / totalReviews) * 100 : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs">
                      <span className="w-4 tabular-nums">{n}</span>
                      <Star className="size-3 fill-amber-500 text-amber-500" />
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-emerald2" style={{ width: `${w}%` }} /></div>
                      <span className="w-8 text-right text-muted-foreground tabular-nums">{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {s?.categoryAverages && Object.values(s.categoryAverages).some((v) => v > 0) && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t">
                {Object.entries(s.categoryAverages).filter(([, v]) => v > 0).map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-secondary/40 p-2">
                    <div className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[k] || k}</div>
                    <div className="flex items-center justify-between mt-0.5"><StarRow v={v} size={3} /><span className="text-xs font-semibold">{v}</span></div>
                  </div>
                ))}
              </div>
            )}
            {s?.aiSummary && (
              <div className="mt-4 rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 text-sm text-slate-700">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">AI Summary · </span>
                {s.aiSummary}
              </div>
            )}
          </div>

          {/* Sort + filter bar */}
          <div className="rounded-2xl border bg-white p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-full md:w-56 px-3 py-2 rounded-xl border text-sm bg-white">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
                <option value="most_helpful">Most helpful</option>
                <option value="photos_first">Photos first</option>
                <option value="videos_first">Videos first</option>
              </select>
            </div>
            <button onClick={() => setShowFilters((v) => !v)} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-sm hover:bg-secondary">
              <Filter className="size-3.5" /> Filters <ChevronDown className={`size-3.5 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="rounded-2xl border bg-white p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.verified} onChange={(e) => { setFilters({ ...filters, verified: e.target.checked }); setPage(1); }} className="accent-emerald-600" /> Verified only</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.photos} onChange={(e) => { setFilters({ ...filters, photos: e.target.checked }); setPage(1); }} className="accent-emerald-600" /><Camera className="size-3" /> With photos</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.videos} onChange={(e) => { setFilters({ ...filters, videos: e.target.checked }); setPage(1); }} className="accent-emerald-600" /><Video className="size-3" /> With videos</label>
              <select value={filters.rating} onChange={(e) => { setFilters({ ...filters, rating: e.target.value }); setPage(1); }} className="px-3 py-2 rounded-xl border text-sm bg-white">
                <option value="">Any rating</option>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
              </select>
              <select value={filters.visitType} onChange={(e) => { setFilters({ ...filters, visitType: e.target.value }); setPage(1); }} className="px-3 py-2 rounded-xl border text-sm bg-white">
                <option value="">Any trip type</option>
                <option value="solo">Solo</option>
                <option value="family">Family</option>
                <option value="couple">Couple</option>
                <option value="friends">Friends</option>
                <option value="business">Business</option>
              </select>
            </div>
          )}

          {/* Reviews list */}
          {(data?.reviews || []).length === 0 ? (
            <div className="p-8 border rounded-2xl bg-white text-center text-sm text-muted-foreground">No reviews match these filters yet.</div>
          ) : (
            <div className="space-y-3">
              {data.reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  r={r}
                  viewerId={viewerId}
                  isAdmin={isAdmin}
                  canReplyAsHost={canReplyAsHost}
                  onVote={vote}
                  onReport={report}
                  onReply={reply}
                  onDeleteReply={deleteReply}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full">Previous</Button>
              <div className="text-xs text-muted-foreground grid place-items-center px-3">Page {page} of {totalPages}</div>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-full">Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
