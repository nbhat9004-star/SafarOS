'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Star, Camera, Video, ShieldCheck, Award, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const CATS = [
  { k: 'cleanliness', l: 'Cleanliness' },
  { k: 'location', l: 'Location' },
  { k: 'value', l: 'Value' },
  { k: 'hostBehaviour', l: 'Host' },
  { k: 'communication', l: 'Communication' },
  { k: 'accuracy', l: 'Accuracy' },
  { k: 'amenities', l: 'Amenities' },
  { k: 'safety', l: 'Safety' },
];

const VISIT_TYPES = ['solo', 'family', 'friends', 'couple', 'business'];

function StarPicker({ value = 0, onChange, size = 5 }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`Rate ${i}`}>
          <Star className={`size-${size} ${i <= value ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

function WriteReviewModal({ booking, onClose, onSaved }) {
  const [form, setForm] = useState({
    rating: 0, title: '', reviewText: '', pros: '', cons: '',
    visitType: '', wouldRecommend: true, anonymous: false, stayMonth: '',
    categories: {}, photos: [], videos: [],
  });
  const [photoInput, setPhotoInput] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addPhoto = () => { if (photoInput.trim()) { setForm({ ...form, photos: [...form.photos, photoInput.trim()] }); setPhotoInput(''); } };
  const addVideo = () => { if (videoInput.trim()) { setForm({ ...form, videos: [...form.videos, videoInput.trim()] }); setVideoInput(''); } };

  const save = async () => {
    if (!form.rating) { toast.error('Please select an overall rating'); return; }
    if (form.reviewText && form.reviewText.length < 20) { toast.error('Review must be at least 20 characters'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: booking.listingId, bookingId: booking.bookingId, ...form }),
      });
      const d = await r.json();
      if (d.ok) { toast.success('Review posted. Thank you!'); onSaved?.(d.review); }
      else toast.error(d.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <div>
            <div className="font-display text-xl font-bold">Write a review</div>
            <div className="text-xs text-muted-foreground">{booking.listingTitle}</div>
          </div>
          <button onClick={onClose} className="size-9 rounded-full grid place-items-center hover:bg-secondary"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-center">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">Overall Rating *</div>
            <StarPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATS.map((c) => (
              <div key={c.k} className="rounded-xl border p-2 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">{c.l}</div>
                <StarPicker size={4} value={form.categories[c.k] || 0} onChange={(v) => setForm({ ...form, categories: { ...form.categories, [c.k]: v } })} />
              </div>
            ))}
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Title</div>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sum up your stay in one line" className="w-full px-4 py-2.5 rounded-xl border text-sm" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Review (min 20 chars)</div>
            <textarea value={form.reviewText} onChange={(e) => setForm({ ...form, reviewText: e.target.value })} rows={4} placeholder="Tell other travelers about your experience..." className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Pros</div>
              <textarea value={form.pros} onChange={(e) => setForm({ ...form, pros: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none" />
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Cons</div>
              <textarea value={form.cons} onChange={(e) => setForm({ ...form, cons: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Trip Type</div>
              <select value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm bg-white">
                <option value="">—</option>
                {VISIT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Stay Month</div>
              <input type="month" value={form.stayMonth} onChange={(e) => setForm({ ...form, stayMonth: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm" />
            </div>
            <label className="flex items-end gap-2 text-sm">
              <input type="checkbox" checked={form.wouldRecommend} onChange={(e) => setForm({ ...form, wouldRecommend: e.target.checked })} className="accent-emerald-600 size-4" />
              Would recommend
            </label>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 inline-flex items-center gap-1"><Camera className="size-3" /> Photos (up to 10)</div>
            <div className="flex gap-2">
              <input value={photoInput} onChange={(e) => setPhotoInput(e.target.value)} placeholder="Paste image URL..." className="flex-1 px-3 py-2 rounded-xl border text-sm" />
              <Button size="sm" onClick={addPhoto} variant="outline" className="rounded-full"><Plus className="size-3" /></Button>
            </div>
            {form.photos.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {form.photos.map((p, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={p} alt="" className="size-16 rounded-lg object-cover border" />
                    <button onClick={() => setForm({ ...form, photos: form.photos.filter((_, x) => x !== i) })} className="absolute -top-1 -right-1 size-5 rounded-full bg-rose-500 text-white grid place-items-center"><X className="size-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 inline-flex items-center gap-1"><Video className="size-3" /> Videos (up to 2)</div>
            <div className="flex gap-2">
              <input value={videoInput} onChange={(e) => setVideoInput(e.target.value)} placeholder="Paste video URL..." className="flex-1 px-3 py-2 rounded-xl border text-sm" />
              <Button size="sm" onClick={addVideo} variant="outline" className="rounded-full"><Plus className="size-3" /></Button>
            </div>
            {form.videos.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">{form.videos.length} video(s) added</div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} className="accent-emerald-600 size-4" />
            Post anonymously
          </label>
        </div>
        <div className="p-5 border-t sticky bottom-0 bg-white rounded-b-3xl flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            Post review
          </Button>
        </div>
      </div>
    </div>
  );
}

function TravelerReviewsInner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/traveler/reviews', { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setData(d);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        <Link href="/dashboard/traveler" className="text-xs text-muted-foreground hover:text-emerald2 inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">My Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">Reviews you've written and pending reviews from completed trips.</p>

        {loading || !data ? (
          <div className="py-16 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Badges + stats */}
            <div className="rounded-2xl border bg-white p-5">
              <div className="font-display text-lg font-bold mb-3 flex items-center gap-2"><Award className="size-5 text-emerald2" /> Travel Statistics</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-secondary/40 p-3"><div className="text-[10px] text-muted-foreground">Trips Completed</div><div className="font-display text-xl font-bold">{data.badges.stats.tripsCompleted}</div></div>
                <div className="rounded-xl bg-secondary/40 p-3"><div className="text-[10px] text-muted-foreground">Reviews Written</div><div className="font-display text-xl font-bold">{data.badges.stats.reviewsWritten}</div></div>
                <div className="rounded-xl bg-secondary/40 p-3"><div className="text-[10px] text-muted-foreground">Helpful Votes</div><div className="font-display text-xl font-bold">{data.badges.stats.helpfulVotes}</div></div>
                <div className="rounded-xl bg-secondary/40 p-3"><div className="text-[10px] text-muted-foreground">Referrals</div><div className="font-display text-xl font-bold">{data.badges.stats.referralCount}</div></div>
              </div>
              {data.badges.badges.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">Badges Earned</div>
                  <div className="flex flex-wrap gap-2">
                    {data.badges.badges.map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="size-3" /> {b.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pending reviews */}
            {data.eligibleBookings.length > 0 && (
              <div className="rounded-2xl border bg-white">
                <div className="p-5 border-b">
                  <div className="font-display text-lg font-bold">Waiting for your review</div>
                  <div className="text-xs text-muted-foreground">Completed trips you haven't reviewed yet.</div>
                </div>
                <div className="divide-y">
                  {data.eligibleBookings.map((b) => (
                    <div key={b.bookingId} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{b.listingTitle}</div>
                        <div className="text-xs text-muted-foreground">{new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}</div>
                      </div>
                      <Button onClick={() => setWriting(b)} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                        <Star className="size-4 mr-2" /> Write Review
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Already written */}
            <div className="rounded-2xl border bg-white">
              <div className="p-5 border-b">
                <div className="font-display text-lg font-bold">Reviews you've written ({data.reviews.length})</div>
              </div>
              {data.reviews.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No reviews yet.</div>
              ) : (
                <div className="divide-y">
                  {data.reviews.map((r) => (
                    <div key={r.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm">{r.title || 'Review'}</div>
                          <div className="text-xs text-muted-foreground truncate">{r.reviewText || '—'}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-3 ${i <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />)}</div>
                          <div className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {writing && <WriteReviewModal booking={writing} onClose={() => setWriting(null)} onSaved={() => { setWriting(null); load(); }} />}
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['traveler', 'host', 'admin']}><TravelerReviewsInner /></ProtectedRoute>;
}
