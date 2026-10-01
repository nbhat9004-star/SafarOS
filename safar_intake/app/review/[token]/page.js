'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle2, ArrowRight, ImagePlus, FileText, Send, ExternalLink, MapPin,
} from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const SECTIONS = [
  { key: 'description', label: 'Description', hint: 'Any corrections to the description text.' },
  { key: 'photos', label: 'Photos', hint: 'Photos to remove / add / re-order. You can also upload replacements below.' },
  { key: 'contact', label: 'Contact', hint: 'Phone / email / website corrections.' },
  { key: 'amenities', label: 'Amenities', hint: 'What is missing or incorrect in amenities?' },
  { key: 'pricing', label: 'Pricing', hint: 'Corrections to prices or units.' },
  { key: 'address', label: 'Address', hint: 'Fix any address issues.' },
  { key: 'mapLocation', label: 'Map Location', hint: 'Coordinates or pin location corrections.' },
];

export default function ReviewPage() {
  const params = useParams();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const [sections, setSections] = useState({});
  const [generalComment, setGeneralComment] = useState('');
  const [photoUrls, setPhotoUrls] = useState(['']);
  const [docUrls, setDocUrls] = useState(['']);
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Claim state
  const [claim, setClaim] = useState({
    name: '', email: '', phone: '', businessRole: '',
    identityProofUrl: '', businessProofUrl: '', message: '',
  });
  const [claiming, setClaiming] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/token/${token}`);
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) setError(json.error || 'Invalid link.');
        else setData(json);
      } catch {
        if (!cancelled) setError('Unable to load listing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const listing = data?.listing || {};
  const presentationUrl = useMemo(() => `/present/${token}`, [token]);

  function updateSection(key, comment) {
    setSections(prev => ({ ...prev, [key]: { comment } }));
  }

  async function submitChanges() {
    if (submitting) return;
    const anySection = Object.values(sections).some(v => (v?.comment || '').trim());
    if (!anySection && !generalComment.trim()) {
      toast.error('Please add at least one comment.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/review/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections,
          generalComment,
          photos: photoUrls.map(s => s.trim()).filter(Boolean),
          documents: docUrls.map(s => s.trim()).filter(Boolean),
          submitterName, submitterEmail,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Thank you! ${json.tasksCreated || 0} tasks created for our team.`);
        setSubmitted(true);
      } else {
        toast.error(json.error || 'Unable to submit. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitClaim() {
    if (claiming) return;
    if (!claim.name || !claim.email || !claim.phone || !claim.businessRole) {
      toast.error('Please fill Name, Email, Phone and Business Role.');
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch(`/api/public/claim/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claim),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Your claim has been submitted. We’ll review shortly.');
        setClaimSubmitted(true);
      } else {
        toast.error(json.error || 'Unable to submit claim.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Loading review workspace…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/20 px-4">
        <div className="max-w-md text-center bg-white border rounded-3xl p-8 shadow-sm">
          <div className="mx-auto size-12 rounded-full bg-rose-100 grid place-items-center text-rose-600 mb-4">!</div>
          <h2 className="font-display text-xl font-bold mb-2">Link unavailable</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-24">
        <section className="container max-w-6xl mx-auto px-4">
          <div className="rounded-3xl border bg-white p-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Host Review</div>
              <h1 className="font-display text-2xl font-bold mt-1">{listing.title || 'Listing Review'}</h1>
              <div className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-2">
                <MapPin className="size-4" />{listing.city || listing.location || 'India'}
              </div>
            </div>
            <Link href={presentationUrl} target="_blank" className="inline-flex">
              <Button variant="outline" className="rounded-full">
                See Public Preview <ExternalLink className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Changes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border bg-white p-6">
              <h2 className="font-semibold">Request Changes</h2>
              <p className="text-sm text-muted-foreground mt-1">Add comments for any section that needs corrections. Our team will act on each one as a task.</p>
            </div>

            {SECTIONS.map(s => (
              <div key={s.key} className="rounded-3xl border bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{s.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.hint}</p>
                  </div>
                </div>
                <Textarea
                  className="mt-3"
                  rows={3}
                  placeholder={`Add your comment about ${s.label.toLowerCase()}…`}
                  value={sections[s.key]?.comment || ''}
                  onChange={(e) => updateSection(s.key, e.target.value)}
                />
              </div>
            ))}

            <div className="rounded-3xl border bg-white p-6">
              <h3 className="font-semibold">General Comments (optional)</h3>
              <Textarea className="mt-3" rows={3} placeholder="Anything else you'd like us to know…"
                value={generalComment} onChange={(e) => setGeneralComment(e.target.value)} />
            </div>

            <div className="rounded-3xl border bg-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ImagePlus className="size-4 text-emerald-700" />
                <h3 className="font-semibold">Attach Photos (URLs)</h3>
              </div>
              {photoUrls.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={u} onChange={(e) => {
                    const next = [...photoUrls]; next[i] = e.target.value; setPhotoUrls(next);
                  }} placeholder="https://... image URL" className="rounded-full" />
                  {i === photoUrls.length - 1 && (
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => setPhotoUrls([...photoUrls, ''])}>Add</Button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <FileText className="size-4 text-emerald-700" />
                <h3 className="font-semibold">Attach Documents (URLs)</h3>
              </div>
              {docUrls.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={u} onChange={(e) => {
                    const next = [...docUrls]; next[i] = e.target.value; setDocUrls(next);
                  }} placeholder="https://... document URL" className="rounded-full" />
                  {i === docUrls.length - 1 && (
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => setDocUrls([...docUrls, ''])}>Add</Button>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-3xl border bg-white p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} placeholder="Your name (optional)" className="rounded-full" />
              <Input value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} placeholder="Your email (optional)" className="rounded-full" />
            </div>

            <div className="flex justify-end">
              {submitted ? (
                <div className="inline-flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle2 className="size-5" /> Corrections submitted — thank you!
                </div>
              ) : (
                <Button onClick={submitChanges} disabled={submitting} className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
                  Submit Corrections
                </Button>
              )}
            </div>
          </div>

          {/* Claim panel */}
          <aside id="claim" className="space-y-6">
            <div className="rounded-3xl border bg-white p-6">
              <h3 className="font-semibold">Claim this Listing</h3>
              <p className="text-sm text-muted-foreground mt-1">Own or manage this business? Submit a claim to become the verified host.</p>
              {claimSubmitted ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800 inline-flex items-start gap-2">
                  <CheckCircle2 className="size-5 shrink-0" />
                  <div>
                    Your claim has been received. Our team will get back to you within 48 hours.
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <Input placeholder="Full name" className="rounded-full" value={claim.name} onChange={(e) => setClaim({ ...claim, name: e.target.value })} />
                  <Input placeholder="Email" className="rounded-full" value={claim.email} onChange={(e) => setClaim({ ...claim, email: e.target.value })} />
                  <Input placeholder="Phone (with country code)" className="rounded-full" value={claim.phone} onChange={(e) => setClaim({ ...claim, phone: e.target.value })} />
                  <Input placeholder="Your role (Owner, Manager…)" className="rounded-full" value={claim.businessRole} onChange={(e) => setClaim({ ...claim, businessRole: e.target.value })} />
                  <Input placeholder="Identity proof URL (Aadhaar / Passport / DL)" className="rounded-full" value={claim.identityProofUrl} onChange={(e) => setClaim({ ...claim, identityProofUrl: e.target.value })} />
                  <Input placeholder="Business proof URL (GST / Registration)" className="rounded-full" value={claim.businessProofUrl} onChange={(e) => setClaim({ ...claim, businessProofUrl: e.target.value })} />
                  <Textarea placeholder="Any additional notes for our team…" rows={3} value={claim.message} onChange={(e) => setClaim({ ...claim, message: e.target.value })} />
                  <Button onClick={submitClaim} disabled={claiming} className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700">
                    {claiming ? <Loader2 className="size-4 animate-spin mr-2" /> : <ArrowRight className="size-4 mr-2" />}
                    Submit Claim
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
