'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Calendar, Star, Plus, Eye, BarChart3, ArrowUpRight, Loader2, AlertTriangle, Trash2, Check, BookOpen, DollarSign, CreditCard, Filter, Download, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import ProfileSettings from '@/components/safar/ProfileSettings';
import HostEarnings from '@/components/safar/HostEarnings';
import HostPayoutSettings from '@/components/safar/HostPayoutSettings';
import ConversationsPanel from '@/components/safar/ConversationsPanel';
import { useAuth } from '@/lib/auth-context';
import { listingsApi, bookingsApi } from '@/lib/listings-api';

function Bars({ data }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((v,i)=>(
        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${(v/max)*100}%` }} viewport={{ once: true }} transition={{ delay: i*0.04, duration: 0.6 }}
          className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400" />
      ))}
    </div>
  );
}

const StatusPill = ({ s }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald2 border-emerald-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${map[s]||'bg-secondary'}`}>{s}</span>;
};

function HostDashboardInner() {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  
  // AI Growth Center state
  const [selectedListing, setSelectedListing] = useState(null);
  const [aiContent, setAiContent] = useState(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [regeneratingType, setRegeneratingType] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiServiceAvailable, setAiServiceAvailable] = useState(true);
  
  const earnings = [12,18,9,22,28,31,26,38,33,42,46,52];

  const load = async () => {
    setLoading(true); setError(null);
    const [r, b] = await Promise.all([
      listingsApi.myHostListings(),
      bookingsApi.list('received'),
    ]);
    if (r.ok && r.data?.ok) setMyListings(r.data.listings || []);
    else setError(r.data?.error || 'Failed to load listings');
    if (b.ok && b.data?.ok) setBookings(b.data.bookings || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    if (!confirm('Delete this listing?')) return;
    const { ok, data } = await listingsApi.remove(id);
    if (!ok) return toast.error(data?.error || 'Delete failed');
    toast.success('Listing deleted');
    load();
  };

  const updateBooking = async (id, status) => {
    const { ok, data } = await bookingsApi.patch(id, status);
    if (!ok) return toast.error(data?.error || 'Action failed');
    toast.success(status === 'approved' ? 'Booking approved' : 'Booking rejected');
    load();
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }
    setResendingVerification(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox and spam folder.');
      } else {
        toast.error(data.error || 'Unable to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Unable to send verification email. Please try again.');
    } finally {
      setResendingVerification(false);
    }
  };

  // AI Growth Center Functions
  const loadAIContent = async (listingId) => {
    setAiError(null);
    try {
      const res = await fetch(`/api/host/ai-content/${listingId}`);
      const data = await res.json();
      
      if (res.status === 503) {
        setAiServiceAvailable(false);
        setAiError('AI features are temporarily unavailable. The rest of your dashboard works normally.');
        return;
      }
      
      if (data.ok && data.content) {
        setAiContent(data.content);
        setHasChanges(data.hasChanges || false);
        setAiServiceAvailable(true);
      } else {
        setAiContent(null);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to load AI content:', error);
      setAiError('Unable to load AI content. Please try again later.');
    }
  };

  const generateAllContent = async () => {
    if (!selectedListing) return;
    setGeneratingContent(true);
    setAiError(null);
    try {
      const res = await fetch('/api/host/ai-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedListing.id }),
      });
      const data = await res.json();
      
      if (res.status === 503) {
        setAiServiceAvailable(false);
        toast.error(data.error || 'AI service is temporarily unavailable');
        setAiError(data.error);
        return;
      }
      
      if (data.ok) {
        setAiContent(data.content);
        setHasChanges(false);
        setAiServiceAvailable(true);
        toast.success('AI content generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate content');
        setAiError(data.error);
      }
    } catch (error) {
      console.error('Generate content error:', error);
      toast.error('Failed to generate content');
      setAiError('Network error. Please check your connection.');
    } finally {
      setGeneratingContent(false);
    }
  };

  const regenerateContent = async (contentType) => {
    if (!selectedListing) return;
    setRegeneratingType(contentType);
    try {
      const res = await fetch('/api/host/ai-content/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedListing.id, contentType }),
      });
      const data = await res.json();
      if (data.ok) {
        setAiContent(data.content);
        toast.success(`${contentType} regenerated!`);
      } else {
        toast.error(data.error || 'Failed to regenerate');
      }
    } catch (error) {
      console.error('Regenerate error:', error);
      toast.error('Failed to regenerate content');
    } finally {
      setRegeneratingType(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Load AI content when listing is selected
  useEffect(() => {
    if (selectedListing) {
      loadAIContent(selectedListing.id);
    }
  }, [selectedListing]);

  const counts = {
    total: myListings.length,
    approved: myListings.filter(l => l.status === 'approved').length,
    pending:  myListings.filter(l => l.status === 'pending').length,
    rejected: myListings.filter(l => l.status === 'rejected').length,
  };

  // Email Verification Guard
  if (user && !user.emailVerified) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 container">
          <div className="max-w-2xl mx-auto text-center py-20">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="size-20 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-600 grid place-items-center mx-auto">
              <AlertTriangle className="size-10" />
            </motion.div>
            <h2 className="font-display text-3xl font-bold mt-6">Verify your email to access Host Dashboard</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Please verify your email address before accessing host features. Check your inbox for the verification email.
            </p>
            <Button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="mt-6 rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold"
            >
              {resendingVerification ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
            <div className="mt-8 p-5 rounded-2xl border bg-secondary/40 text-left max-w-md mx-auto">
              <div className="text-xs font-semibold text-emerald2 uppercase tracking-wider">Why verify?</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="size-4 text-emerald2 mt-0.5 shrink-0" />
                  <span>Protect your account and listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-4 text-emerald2 mt-0.5 shrink-0" />
                  <span>Receive booking notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-4 text-emerald2 mt-0.5 shrink-0" />
                  <span>Build trust with travelers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Host Studio</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">Salaam, {user?.name?.split(' ')[0] || 'Host'} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full font-semibold"><Link href="/dashboard/host/services"><Building2 className="size-4 mr-2" /> My Services</Link></Button>
            <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold"><Link href="/add-listing"><Plus className="size-4 mr-2" /> Add new listing</Link></Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="mt-8">
          <TabsList className="grid w-full max-w-5xl grid-cols-3 sm:grid-cols-7 h-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inbox">💬 Inbox</TabsTrigger>
            <TabsTrigger value="earnings">💰 Earnings</TabsTrigger>
            <TabsTrigger value="payouts">🏦 Payouts</TabsTrigger>
            <TabsTrigger value="ai-growth">📈 AI Growth</TabsTrigger>
            <TabsTrigger value="resources">📚 Resources</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {l:'Listings',     v: counts.total,    d:`+${counts.pending} pending`, i: BarChart3},
                {l:'Approved',     v: counts.approved, d:`live`, i: Eye},
                {l:'Avg rating',   v: '4.94',          d:'+0.04', i: Star},
                {l:'Earnings (mo)',v: '₹ 4,82,400',   d:'+18%', i: Wallet},
              ].map((k,i)=>{const Ico=k.i;return(
                <motion.div key={k.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }} className="rounded-3xl border bg-white p-5">
                  <div className="flex items-center justify-between"><Ico className="size-5 text-emerald2" /><div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">{k.d} <ArrowUpRight className="size-3" /></div></div>
                  <div className="font-display text-2xl font-bold mt-3">{k.v}</div>
                  <div className="text-xs text-muted-foreground">{k.l}</div>
                </motion.div>
              );})}
            </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-3xl border bg-white p-6">
            <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Earnings</div><div className="font-display text-2xl font-bold">₹ 4.82L this month</div></div><BarChart3 className="size-5 text-emerald2" /></div>
            <div className="mt-5"><Bars data={earnings} /></div>
            <div className="mt-2 grid grid-cols-12 text-[10px] text-muted-foreground">{['J','F','M','A','M','J','J','A','S','O','N','D'].map((m)=><div key={m} className="text-center">{m}</div>)}</div>
          </div>
          <div className="rounded-3xl border bg-white p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Performance</div>
            <div className="mt-3 space-y-3">
              {[{l:'Occupancy',v:78},{l:'Response rate',v:96},{l:'On-time check-ins',v:91}].map((p)=>(
                <div key={p.l}><div className="flex justify-between text-sm"><span>{p.l}</span><span className="font-semibold">{p.v}%</span></div><div className="h-2 bg-secondary rounded-full mt-1 overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: `${p.v}%` }} viewport={{ once: true }} className="h-full bg-gradient-emerald" /></div></div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Requests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold">Booking requests</h2>
            <span className="text-sm text-muted-foreground">{bookings.filter(b=>b.status==='pending').length} pending</span>
          </div>
          {!loading && bookings.length === 0 && (
            <div className="p-6 rounded-3xl border bg-white text-center text-sm text-muted-foreground">No booking requests yet.</div>
          )}
          {!loading && bookings.length > 0 && (
            <div className="rounded-3xl border bg-white overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                <div className="col-span-4">Listing</div><div className="col-span-3">Guest</div><div className="col-span-2">Dates</div><div className="col-span-1">Status</div><div className="col-span-2 text-right">Action</div>
              </div>
              {bookings.map((b) => (
                <div key={b.bookingId} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                  <div className="col-span-4 flex items-center gap-3">{b.listingImage && <img src={b.listingImage} className="size-10 rounded-lg object-cover" alt="" />}<div><div className="font-semibold text-sm line-clamp-1">{b.listingTitle}</div>{b.inventoryTypeName && <div className="text-xs text-emerald2 font-medium">{b.inventoryTypeName}</div>}<div className="text-xs text-muted-foreground">₹{(b.totalPrice||0).toLocaleString('en-IN')} · {b.nights}n</div></div></div>
                  <div className="col-span-3"><div className="text-sm">{b.travelerName}</div><div className="text-xs text-muted-foreground">{b.guests} guests</div></div>
                  <div className="col-span-2 text-xs">{new Date(b.checkInDate).toLocaleDateString()} →<br/>{new Date(b.checkOutDate).toLocaleDateString()}</div>
                  <div className="col-span-1"><span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${b.status==='approved'?'bg-emerald-50 text-emerald2 border-emerald-200':b.status==='pending'?'bg-amber-50 text-amber-700 border-amber-200':b.status==='rejected'?'bg-rose-50 text-rose-600 border-rose-200':'bg-secondary text-muted-foreground border-border'}`}>{b.status}</span></div>
                  <div className="col-span-2 flex gap-1.5 justify-end">
                    {b.status === 'pending' && <>
                      <Button onClick={()=>updateBooking(b.bookingId,'approved')} size="sm" className="rounded-full h-8 bg-emerald2 hover:bg-emerald2-deep">Approve</Button>
                      <Button onClick={()=>updateBooking(b.bookingId,'rejected')} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50">Reject</Button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Listings */}
        <section>
          <h2 className="font-display text-2xl font-bold">My listings</h2>
          {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
          {error && <div className="mt-4 p-6 border rounded-3xl bg-rose-50/40 border-rose-200 text-center"><AlertTriangle className="size-6 mx-auto text-rose-500" /><div className="mt-2 text-sm">{error}</div></div>}
          {!loading && !error && myListings.length === 0 && (
            <div className="mt-4 p-10 border rounded-3xl bg-white text-center">
              <Plus className="size-7 mx-auto text-emerald2" />
              <div className="font-display text-lg font-bold mt-3">No listings yet</div>
              <p className="text-sm text-muted-foreground mt-1">Create your first listing — it&#39;ll appear here once submitted.</p>
              <Button asChild className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep"><Link href="/add-listing">Add new listing</Link></Button>
            </div>
          )}
          {!loading && myListings.length > 0 && (
            <div className="mt-4 rounded-3xl border bg-white overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                <div className="col-span-5">Listing</div><div className="col-span-2">Price</div><div className="col-span-2">Status</div><div className="col-span-2">Rating</div><div className="col-span-1"></div>
              </div>
              {myListings.map((l)=>(
                <div key={l.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                  <div className="col-span-5 flex items-center gap-3"><img src={(l.images && l.images[0]) || ''} className="size-12 rounded-xl object-cover bg-secondary" alt="" /><div><div className="font-semibold text-sm line-clamp-1">{l.title}</div><div className="text-xs text-muted-foreground">{l.location}</div>{l.inventoryTypes && l.inventoryTypes.length > 0 && <div className="text-xs text-emerald2 font-medium mt-0.5">{l.inventoryTypes.length} type{l.inventoryTypes.length > 1 ? 's' : ''} · {l.inventoryTypes.reduce((sum, t) => sum + t.quantity, 0)} units</div>}</div></div>
                  <div className="col-span-2 text-sm font-semibold">₹{l.price.toLocaleString('en-IN')}</div>
                  <div className="col-span-2"><StatusPill s={l.status} /></div>
                  <div className="col-span-2 text-sm flex items-center gap-1"><Star className="size-3.5 text-gold fill-gold" /> {l.rating || '—'}</div>
                  <div className="col-span-1 flex items-center gap-2 justify-end">
                    <Link href={`/property/${l.id}`} className="text-xs font-semibold text-emerald2 hover:underline">View</Link>
                    <button onClick={()=>onDelete(l.id)} className="text-rose-500 hover:text-rose-700" title="Delete"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
          </TabsContent>
          
          {/* MODULE 13 — Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4">
            <ConversationsPanel role="host" />
          </TabsContent>

          {/* MODULE 12 — Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <HostEarnings myListings={myListings} />
          </TabsContent>

          {/* MODULE 12 — Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <HostPayoutSettings />
          </TabsContent>

          {/* AI Growth Center Tab */}
          <TabsContent value="ai-growth" className="space-y-6">
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold">📈 AI Growth Center</h2>
                  <p className="text-sm text-muted-foreground mt-1">Generate marketing content for your listings using AI</p>
                </div>
              </div>

              {/* Listing Selector */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2 block">Select Listing</label>
                <select 
                  value={selectedListing?.id || ''} 
                  onChange={(e) => {
                    const listing = myListings.find(l => l.id === e.target.value);
                    setSelectedListing(listing);
                  }}
                  className="w-full max-w-md px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald2/20"
                >
                  <option value="">Choose a listing...</option>
                  {myListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title} - {listing.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Listing Preview */}
              {selectedListing && (
                <div className="mb-6 p-4 rounded-xl border bg-secondary/20">
                  <div className="flex gap-4">
                    {selectedListing.images?.[0] && (
                      <img src={selectedListing.images[0]} alt="" className="size-20 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{selectedListing.title}</div>
                      <div className="text-sm text-muted-foreground">{selectedListing.location} • ₹{selectedListing.price?.toLocaleString('en-IN')}/night</div>
                      <div className="text-xs text-muted-foreground mt-1">{selectedListing.amenities?.length || 0} amenities</div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Service Unavailable Warning */}
              {!aiServiceAvailable && aiError && (
                <div className="mb-6 p-5 rounded-xl border-2 border-amber-200 bg-amber-50 flex items-start gap-3">
                  <AlertTriangle className="size-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-amber-900 text-lg">AI Features Temporarily Unavailable</div>
                    <div className="text-sm text-amber-700 mt-1">{aiError}</div>
                    <div className="text-sm text-amber-700 mt-2">
                      ✅ Your dashboard, listings, and bookings are working normally.
                    </div>
                    <div className="text-xs text-amber-600 mt-3">
                      If this issue persists, please contact support.
                    </div>
                  </div>
                </div>
              )}

              {/* Change Notification */}
              {hasChanges && aiContent && (
                <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3">
                  <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-amber-900">This listing has changed</div>
                    <div className="text-sm text-amber-700 mt-0.5">Regenerate AI content to reflect the latest changes.</div>
                  </div>
                  <Button onClick={generateAllContent} disabled={generatingContent} className="rounded-full bg-amber-600 hover:bg-amber-700 shrink-0">
                    Regenerate All
                  </Button>
                </div>
              )}

              {/* Generate Button */}
              {selectedListing && !aiContent && (
                <div className="text-center py-12">
                  <div className="mb-4 text-muted-foreground">No AI content generated yet for this listing</div>
                  <Button onClick={generateAllContent} disabled={generatingContent} className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold px-8">
                    {generatingContent ? (
                      <><Loader2 className="size-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <>Generate AI Content</>
                    )}
                  </Button>
                </div>
              )}

              {/* Content Cards */}
              {aiContent && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm text-muted-foreground">
                      Last generated: {aiContent.generatedAt ? new Date(aiContent.generatedAt).toLocaleString() : '—'}
                    </div>
                    <Button onClick={generateAllContent} disabled={generatingContent} variant="outline" className="rounded-full">
                      {generatingContent ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                      Regenerate All
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'instagramCaption', label: 'Instagram Caption', icon: '📸' },
                      { key: 'facebookCaption', label: 'Facebook Caption', icon: '📘' },
                      { key: 'reelScript', label: 'Instagram Reel Script', icon: '🎬' },
                      { key: 'shortsScript', label: 'YouTube Shorts Script', icon: '▶️' },
                      { key: 'promoCaption', label: 'Promotional Caption', icon: '🎯' },
                      { key: 'seoTitle', label: 'SEO Title', icon: '🔍' },
                      { key: 'metaDescription', label: 'Meta Description', icon: '📝' },
                      { key: 'hashtags', label: 'Hashtags (20-30)', icon: '#️⃣' },
                      { key: 'shortDescription', label: 'Short Description', icon: '📄' },
                      { key: 'longDescription', label: 'Long Description', icon: '📋' },
                    ].map((item) => (
                      <div key={item.key} className="rounded-xl border bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            <span>{item.icon}</span>
                            {item.label}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => copyToClipboard(aiContent.content?.[item.key] || '', item.label)} className="p-1.5 hover:bg-secondary rounded-lg transition" title="Copy">
                              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                            <button onClick={() => regenerateContent(item.key)} disabled={regeneratingType === item.key} className="p-1.5 hover:bg-secondary rounded-lg transition" title="Regenerate">
                              {regeneratingType === item.key ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <textarea 
                          value={aiContent.content?.[item.key] || ''} 
                          onChange={(e) => {
                            setAiContent({
                              ...aiContent,
                              content: { ...aiContent.content, [item.key]: e.target.value }
                            });
                          }}
                          className="w-full p-3 border rounded-lg text-sm resize-none outline-none focus:ring-2 focus:ring-emerald2/20"
                          rows={item.key === 'longDescription' ? 8 : item.key === 'hashtags' ? 6 : 4}
                          placeholder={`AI-generated ${item.label.toLowerCase()} will appear here...`}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-6">
            {/* MODULE 11A — Host Resources (moved out of public footer) */}
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
                <BookOpen className="size-6 text-emerald2" /> Host Resources
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Everything you need to build a successful listing and delight guests.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Listing Guide',       href: '/host-guide',      emoji: '📘', desc: 'Craft compelling listings that convert browsers into bookings.', ready: true },
                { title: 'Host Tips',           href: '/host-tips',       emoji: '💡', desc: 'Field-tested tips from top-performing Safar hosts.', ready: true },
                { title: 'Best Practices',      href: '/host-best-practices', emoji: '⭐', desc: 'Operational standards that keep ratings above 4.9.', ready: true },
                { title: 'Photography Guide',   href: '#',               emoji: '📸', desc: 'Lighting, angles, and staging tricks. Guide launching soon.', ready: false },
                { title: 'Pricing Tips',        href: '/host-pricing-tips', emoji: '💰', desc: 'Seasonal pricing, dynamic rates, and cancellation strategy.', ready: true },
                { title: 'Host Support',        href: '/contact',        emoji: '🎧', desc: 'Talk to a real human on the Safar host team.', ready: true },
                { title: 'FAQs',                href: '/host-faqs',      emoji: '❓', desc: 'Answers to the most common host questions.', ready: true },
              ].map((r) => (
                <Link
                  key={r.title}
                  href={r.ready ? r.href : '#'}
                  onClick={(e) => { if (!r.ready) e.preventDefault(); }}
                  className={`group rounded-3xl border bg-white p-5 hover:border-emerald2 hover:shadow-md transition ${!r.ready ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="text-3xl">{r.emoji}</div>
                  <div className="font-display text-lg font-bold mt-3 group-hover:text-emerald2 flex items-center gap-2">
                    {r.title}
                    {!r.ready && <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border">Soon</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">{r.desc}</div>
                  {r.ready && <div className="text-xs font-semibold text-emerald2 mt-3">Read more →</div>}
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ProfileSettings user={user} onUpdate={load} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['host','admin']}><HostDashboardInner /></ProtectedRoute>;
}
