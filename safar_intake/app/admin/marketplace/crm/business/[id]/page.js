'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building2,
  MapPin,
  Phone,
  Globe,
  Star,
  MessageCircle,
  Mail,
  Calendar,
  Clock,
  User,
  Plus,
  Save,
  Copy,
  Link as LinkIcon,
  ExternalLink,
  RotateCw,
  Ban,
  Send,
  Rocket,
  Archive as ArchiveIcon,
  UserPlus,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Info,
  PauseCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function BusinessProfileInner() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [followups, setFollowups] = useState([]);
  
  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  
  const [followupData, setFollowupData] = useState({
    followUpDate: '',
    priority: 'medium',
    note: ''
  });

  // Module 8 state ----------------------------------------------------
  const [m8Links, setM8Links] = useState([]);
  const [m8Claims, setM8Claims] = useState([]);
  const [m8ChangeRequests, setM8ChangeRequests] = useState([]);
  const [m8Tasks, setM8Tasks] = useState([]);
  const [m8Busy, setM8Busy] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '', message: '' });

  useEffect(() => {
    if (businessId) {
      loadBusinessProfile();
    }
  }, [businessId]);

  const loadBusinessProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}`);
      const data = await res.json();
      
      if (data.ok) {
        setBusiness(data.business);
        setTimeline(data.timeline || []);
        setNotes(data.notes || []);
        setFollowups(data.followups || []);
        // Fire-and-forget Module 8 fetches
        loadM8();
      } else {
        toast.error('Failed to load business profile');
        router.push('/admin/marketplace/crm');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote })
      });
      
      const data = await res.json();
      if (data.ok) {
        toast.success('Note added');
        setNewNote('');
        setShowNoteForm(false);
        loadBusinessProfile();
      } else {
        toast.error(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleUpdateStatus = async (pipelineStage) => {
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineStage })
      });
      
      const data = await res.json();
      if (data.ok) {
        toast.success('Status updated');
        loadBusinessProfile();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleScheduleFollowup = async () => {
    if (!followupData.followUpDate) {
      toast.error('Please select a follow-up date');
      return;
    }
    
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followupData)
      });
      
      const data = await res.json();
      if (data.ok) {
        toast.success('Follow-up scheduled');
        setFollowupData({ followUpDate: '', priority: 'medium', note: '' });
        setShowFollowupForm(false);
        loadBusinessProfile();
      } else {
        toast.error(data.error || 'Failed to schedule follow-up');
      }
    } catch (error) {
      console.error('Failed to schedule follow-up:', error);
      toast.error('Failed to schedule follow-up');
    }
  };

  const getWhatsAppLink = (phone) => {
    if (!phone) return '#';
    const cleaned = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleaned}`;
  };

  // -------- Module 8 helpers --------
  const loadM8 = async () => {
    try {
      const [linksRes, claimsRes, crRes, tasksRes] = await Promise.all([
        fetch(`/api/marketplace/crm/business/${businessId}/links`),
        fetch(`/api/marketplace/crm/business/${businessId}/claims`),
        fetch(`/api/marketplace/crm/business/${businessId}/change-requests`),
        fetch(`/api/marketplace/crm/business/${businessId}/tasks`),
      ]);
      const [ldata, cdata, crdata, tdata] = await Promise.all([
        linksRes.json().catch(() => ({})),
        claimsRes.json().catch(() => ({})),
        crRes.json().catch(() => ({})),
        tasksRes.json().catch(() => ({})),
      ]);
      if (ldata.ok) setM8Links(ldata.links || []);
      if (cdata.ok) setM8Claims(cdata.claims || []);
      if (crdata.ok) setM8ChangeRequests(crdata.changeRequests || []);
      if (tdata.ok) setM8Tasks(tdata.tasks || []);
    } catch (e) {
      console.error('loadM8 error', e);
    }
  };

  const activeLink = (type) => (m8Links || []).find(l => l.type === type && !l.revoked && new Date(l.expiresAt) > new Date());

  const doGenerateLink = async (type) => {
    if (m8Busy) return;
    setM8Busy(true);
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/generate-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, expiryDays: 30 }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`${type === 'review' ? 'Review' : 'Presentation'} link generated`);
        await loadM8();
      } else toast.error(data.error || 'Failed to generate link');
    } catch { toast.error('Network error'); }
    finally { setM8Busy(false); }
  };

  const doRegenerateLink = async (type) => {
    if (m8Busy) return;
    setM8Busy(true);
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/regenerate-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, expiryDays: 30 }),
      });
      const data = await res.json();
      if (data.ok) { toast.success('Link regenerated'); await loadM8(); }
      else toast.error(data.error || 'Failed to regenerate');
    } catch { toast.error('Network error'); }
    finally { setM8Busy(false); }
  };

  const doRevokeLink = async (linkId, type) => {
    if (m8Busy) return;
    if (!window.confirm('Revoke this link? It will no longer be usable.')) return;
    setM8Busy(true);
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/revoke-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: linkId, type }),
      });
      const data = await res.json();
      if (data.ok) { toast.success('Link revoked'); await loadM8(); }
      else toast.error(data.error || 'Failed to revoke');
    } catch { toast.error('Network error'); }
    finally { setM8Busy(false); }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied');
    } catch { toast.error('Copy failed'); }
  };

  const doPublish = async () => {
    if (m8Busy) return;
    if (!window.confirm('Publish this listing to the marketplace?')) return;
    setM8Busy(true);
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) { toast.success('Listing published'); loadBusinessProfile(); }
      else toast.error(data.error || 'Failed to publish');
    } catch { toast.error('Network error'); }
    finally { setM8Busy(false); }
  };

  const doArchive = async () => {
    if (m8Busy) return;
    if (!window.confirm('Archive this listing? It will be removed from the marketplace.')) return;
    setM8Busy(true);
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/archive`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) { toast.success('Listing archived'); loadBusinessProfile(); }
      else toast.error(data.error || 'Failed to archive');
    } catch { toast.error('Network error'); }
    finally { setM8Busy(false); }
  };

  const doInviteHost = async () => {
    if (!inviteData.email) { toast.error('Email is required'); return; }
    setM8Busy(true);
    try {
      const res = await fetch(`/api/marketplace/crm/business/${businessId}/invite-host`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Invitation sent');
        setShowInvite(false);
        setInviteData({ email: '', name: '', message: '' });
        loadM8();
      } else toast.error(data.error || 'Failed to send invite');
    } catch { toast.error('Network error'); }
    finally { setM8Busy(false); }
  };

  const doClaimAction = async (claimId, action) => {
    if (m8Busy) return;
    let notes = '';
    if (action === 'reject' || action === 'request_info' || action === 'suspend') {
      notes = window.prompt(`Notes for the host (optional)`) || '';
    }
    setM8Busy(true);
    try {
      const res = await fetch(`/api/marketplace/crm/claims/${claimId}/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Claim ${action.replace('_',' ')}d`);
        loadBusinessProfile();
      } else toast.error(data.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setM8Busy(false); }
  };

  const doTaskStatus = async (taskId, status) => {
    setM8Busy(true);
    try {
      const res = await fetch(`/api/marketplace/crm/tasks/${taskId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) { toast.success('Task updated'); loadM8(); }
      else toast.error(data.error || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setM8Busy(false); }
  };

  const activeReview = activeLink('review');
  const activePresent = activeLink('presentation');

  const pipelineStages = [
    { id: 'pending', label: 'Pending' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'interested', label: 'Interested' },
    { id: 'meeting_scheduled', label: 'Meeting Scheduled' },
    { id: 'negotiating', label: 'Negotiating' },
    { id: 'live_partner', label: 'Live Partner' },
    { id: 'rejected', label: 'Rejected' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/20">
        <Navbar />
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald2"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading business profile...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary/20 pt-20 lg:pt-24">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/marketplace/crm">
            <Button variant="ghost" className="rounded-full mb-4">
              <ArrowLeft className="size-4 mr-2" />
              Back to CRM
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info */}
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-start gap-4">
                {business.images && business.images[0] && (
                  <img 
                    src={business.images[0]} 
                    alt={business.title}
                    className="size-24 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h1 className="font-display text-2xl font-bold">{business.title}</h1>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                    {business.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        <span>{business.city}</span>
                      </div>
                    )}
                    {business.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{business.rating}</span>
                        <span className="text-xs">({business.reviews} reviews)</span>
                      </div>
                    )}
                    {business.category && (
                      <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium capitalize">
                        {business.category}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {business.location && (
                      <p className="text-sm">{business.location}</p>
                    )}
                    {business.contact?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="size-4 text-muted-foreground" />
                        <span>{business.contact.phone}</span>
                      </div>
                    )}
                    {business.contact?.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="size-4 text-muted-foreground" />
                        <a href={business.contact.website} target="_blank" rel="noopener noreferrer" className="text-emerald2 hover:underline">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Communication Actions */}
              <div className="flex gap-2 mt-6 pt-6 border-t flex-wrap">
                {business.contact?.phone && (
                  <>
                    <a href={`tel:${business.contact.phone}`}>
                      <Button variant="outline" className="rounded-full">
                        <Phone className="size-4 mr-2" />
                        Call
                      </Button>
                    </a>
                    <a href={getWhatsAppLink(business.contact.phone)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="rounded-full">
                        <MessageCircle className="size-4 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                  </>
                )}
                {business.contact?.website && (
                  <a href={business.contact.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-full">
                      <Globe className="size-4 mr-2" />
                      Website
                    </Button>
                  </a>
                )}
                <Button variant="outline" className="rounded-full" disabled>
                  <Mail className="size-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>

            {/* Module 8: Host Claim, Review & Publish Actions */}
            <div className="rounded-3xl border bg-white p-6" data-testid="m8-actions-panel">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="size-5 text-emerald-600" />
                <h3 className="font-semibold">Host Claim, Review & Publish</h3>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {activeReview ? (
                  <>
                    <a href={activeReview.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="rounded-full" data-testid="m8-open-review">
                        <ExternalLink className="size-4 mr-2" /> Open Review Link
                      </Button>
                    </a>
                    <Button variant="outline" className="rounded-full" onClick={() => copyToClipboard(activeReview.url)} data-testid="m8-copy-review">
                      <Copy className="size-4 mr-2" /> Copy Review
                    </Button>
                    <Button variant="outline" className="rounded-full" onClick={() => doRegenerateLink('review')} disabled={m8Busy} data-testid="m8-regenerate-review">
                      <RotateCw className="size-4 mr-2" /> Regenerate Review
                    </Button>
                    <Button variant="outline" className="rounded-full text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => doRevokeLink(activeReview.id, 'review')} disabled={m8Busy} data-testid="m8-revoke-review">
                      <Ban className="size-4 mr-2" /> Revoke Review
                    </Button>
                  </>
                ) : (
                  <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={() => doGenerateLink('review')} disabled={m8Busy} data-testid="m8-generate-review">
                    <LinkIcon className="size-4 mr-2" /> Generate Review Link
                  </Button>
                )}

                {activePresent ? (
                  <>
                    <a href={activePresent.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="rounded-full" data-testid="m8-open-present">
                        <ExternalLink className="size-4 mr-2" /> Open Presentation
                      </Button>
                    </a>
                    <Button variant="outline" className="rounded-full" onClick={() => copyToClipboard(activePresent.url)} data-testid="m8-copy-present">
                      <Copy className="size-4 mr-2" /> Copy Presentation
                    </Button>
                    <Button variant="outline" className="rounded-full" onClick={() => doRegenerateLink('presentation')} disabled={m8Busy} data-testid="m8-regenerate-present">
                      <RotateCw className="size-4 mr-2" /> Regenerate Presentation
                    </Button>
                    <Button variant="outline" className="rounded-full text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => doRevokeLink(activePresent.id, 'presentation')} disabled={m8Busy} data-testid="m8-revoke-present">
                      <Ban className="size-4 mr-2" /> Revoke Presentation
                    </Button>
                  </>
                ) : (
                  <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={() => doGenerateLink('presentation')} disabled={m8Busy} data-testid="m8-generate-present">
                    <LinkIcon className="size-4 mr-2" /> Generate Presentation Link
                  </Button>
                )}

                <Button variant="outline" className="rounded-full" onClick={() => setShowInvite(v => !v)} data-testid="m8-invite-host">
                  <UserPlus className="size-4 mr-2" /> Invite Host
                </Button>

                <Button className="rounded-full bg-emerald-700 hover:bg-emerald-800" onClick={doPublish} disabled={m8Busy} data-testid="m8-publish">
                  <Rocket className="size-4 mr-2" /> Publish
                </Button>

                <Button variant="outline" className="rounded-full text-charcoal" onClick={doArchive} disabled={m8Busy} data-testid="m8-archive">
                  <ArchiveIcon className="size-4 mr-2" /> Archive
                </Button>
              </div>

              {/* Link details row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {activeReview && (
                  <div className="rounded-2xl bg-secondary/20 border p-3 text-xs">
                    <div className="font-semibold mb-1">Review link</div>
                    <div className="break-all text-charcoal/70">{activeReview.url}</div>
                    <div className="mt-1 text-muted-foreground">Expires {new Date(activeReview.expiresAt).toLocaleDateString()}</div>
                  </div>
                )}
                {activePresent && (
                  <div className="rounded-2xl bg-secondary/20 border p-3 text-xs">
                    <div className="font-semibold mb-1">Presentation link</div>
                    <div className="break-all text-charcoal/70">{activePresent.url}</div>
                    <div className="mt-1 text-muted-foreground">Expires {new Date(activePresent.expiresAt).toLocaleDateString()}</div>
                  </div>
                )}
              </div>

              {/* Invite Host inline form */}
              {showInvite && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
                  <Input placeholder="Host email" value={inviteData.email} onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })} className="rounded-full" />
                  <Input placeholder="Host name (optional)" value={inviteData.name} onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })} className="rounded-full" />
                  <Textarea placeholder="Optional personal message" rows={2} value={inviteData.message} onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })} />
                  <div className="flex gap-2">
                    <Button onClick={doInviteHost} className="rounded-full bg-emerald-600 hover:bg-emerald-700" disabled={m8Busy} data-testid="m8-send-invite">
                      <Send className="size-4 mr-2" /> Send Invitation
                    </Button>
                    <Button variant="outline" className="rounded-full" onClick={() => setShowInvite(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Change Requests */}
            {m8ChangeRequests.length > 0 && (
              <div className="rounded-3xl border bg-white p-6" data-testid="m8-change-requests-panel">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="size-5 text-emerald-600" />
                  <h3 className="font-semibold">Change Requests</h3>
                  <span className="text-xs text-muted-foreground">({m8ChangeRequests.length})</span>
                </div>
                <div className="space-y-4">
                  {m8ChangeRequests.slice(0, 10).map(cr => (
                    <div key={cr.id} className="rounded-2xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-xs text-muted-foreground">
                          Submitted {new Date(cr.createdAt).toLocaleString()} {cr.submittedBy?.name ? `by ${cr.submittedBy.name}` : ''}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{cr.status || 'open'}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {Object.entries(cr.sections || {}).map(([k, v]) => {
                          const comment = typeof v === 'string' ? v : v?.comment;
                          if (!comment) return null;
                          return (
                            <div key={k} className="p-2 rounded-lg bg-secondary/30">
                              <div className="text-xs font-semibold capitalize text-emerald-700">{k}</div>
                              <div className="text-charcoal/80">{comment}</div>
                            </div>
                          );
                        })}
                      </div>
                      {cr.generalComment && (
                        <div className="mt-2 text-sm">
                          <div className="text-xs font-semibold text-emerald-700">General</div>
                          <div>{cr.generalComment}</div>
                        </div>
                      )}
                      {(cr.photos?.length || cr.documents?.length) ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {cr.photos?.length ? `${cr.photos.length} photo(s) attached · ` : ''}
                          {cr.documents?.length ? `${cr.documents.length} document(s) attached` : ''}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-created Tasks */}
            {m8Tasks.length > 0 && (
              <div className="rounded-3xl border bg-white p-6" data-testid="m8-tasks-panel">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="size-5 text-emerald-600" />
                  <h3 className="font-semibold">Auto-generated Tasks</h3>
                  <span className="text-xs text-muted-foreground">({m8Tasks.length})</span>
                </div>
                <div className="space-y-2">
                  {m8Tasks.slice(0, 20).map(t => (
                    <div key={t.id} className="flex items-start justify-between gap-3 p-3 rounded-2xl border">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{t.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                        <div className="mt-1 flex gap-2 items-center text-[11px] text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-full bg-secondary/40 capitalize">{t.section}</span>
                          <span className={`px-2 py-0.5 rounded-full ${t.status === 'done' ? 'bg-emerald-100 text-emerald-700' : t.status === 'dismissed' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span>
                        </div>
                      </div>
                      <Select value={t.status} onValueChange={(v) => doTaskStatus(t.id, v)}>
                        <SelectTrigger className="rounded-full h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claim Requests */}
            {m8Claims.length > 0 && (
              <div className="rounded-3xl border bg-white p-6" data-testid="m8-claims-panel">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  <h3 className="font-semibold">Host Claim Requests</h3>
                  <span className="text-xs text-muted-foreground">({m8Claims.length})</span>
                </div>
                <div className="space-y-3">
                  {m8Claims.map(c => (
                    <div key={c.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm">{c.name} <span className="text-xs text-muted-foreground">· {c.businessRole}</span></div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {c.email} · {c.phone} · {new Date(c.createdAt).toLocaleDateString()}
                          </div>
                          {(c.identityProofUrl || c.businessProofUrl) && (
                            <div className="mt-1 flex gap-3 text-xs">
                              {c.identityProofUrl && (
                                <a href={c.identityProofUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">Identity proof</a>
                              )}
                              {c.businessProofUrl && (
                                <a href={c.businessProofUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">Business proof</a>
                              )}
                            </div>
                          )}
                          {c.message && <div className="mt-2 text-sm text-charcoal/70">{c.message}</div>}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          c.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          c.status === 'suspended' ? 'bg-gray-200 text-gray-700' :
                          c.status === 'info_requested' ? 'bg-sky-100 text-sky-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{c.status?.replace('_',' ') || 'pending'}</span>
                      </div>

                      {c.status === 'pending' || c.status === 'info_requested' ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={() => doClaimAction(c.id, 'approve')} disabled={m8Busy} data-testid="m8-claim-approve">
                            <CheckCircle2 className="size-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full text-rose-700 border-rose-200" onClick={() => doClaimAction(c.id, 'reject')} disabled={m8Busy} data-testid="m8-claim-reject">
                            <XCircle className="size-3.5 mr-1" /> Reject
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => doClaimAction(c.id, 'request_info')} disabled={m8Busy} data-testid="m8-claim-info">
                            <Info className="size-3.5 mr-1" /> Request Info
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => doClaimAction(c.id, 'suspend')} disabled={m8Busy} data-testid="m8-claim-suspend">
                            <PauseCircle className="size-3.5 mr-1" /> Suspend
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {business.images && business.images.length > 1 && (
              <div className="rounded-3xl border bg-white p-6">
                <h3 className="font-semibold mb-4">Photos</h3>
                <div className="grid grid-cols-3 gap-3">
                  {business.images.slice(0, 6).map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={`${business.title} ${idx + 1}`}
                      className="w-full aspect-square rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notes</h3>
                <Button 
                  size="sm" 
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  className="rounded-full"
                >
                  <Plus className="size-4 mr-2" />
                  Add Note
                </Button>
              </div>

              {showNoteForm && (
                <div className="mb-4 p-4 rounded-xl bg-secondary/20">
                  <Textarea
                    placeholder="Write a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="mb-3"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddNote} size="sm" className="rounded-full">
                      <Save className="size-4 mr-2" />
                      Save Note
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowNoteForm(false);
                        setNewNote('');
                      }} 
                      size="sm" 
                      variant="outline"
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="p-4 rounded-xl bg-secondary/20">
                      <p className="text-sm">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <User className="size-3" />
                        <span>{note.author}</span>
                        <span>·</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="rounded-3xl border bg-white p-6">
              <h3 className="font-semibold mb-4">Activity Timeline</h3>
              
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map(event => (
                    <div key={event.id} className="flex gap-3">
                      <div className="shrink-0 size-8 rounded-full bg-emerald-50 grid place-items-center">
                        <Clock className="size-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {event.user} · {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.details && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(event.details)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pipeline Status */}
            <div className="rounded-3xl border bg-white p-6">
              <h3 className="font-semibold mb-4">Pipeline Stage</h3>
              
              <Select
                value={business.crmData?.pipelineStage || 'pending'}
                onValueChange={handleUpdateStatus}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelineStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-4 text-xs text-muted-foreground">
                Last updated: {business.crmData?.lastStatusChange ? new Date(business.crmData.lastStatusChange).toLocaleString() : 'Never'}
              </div>
            </div>

            {/* Follow-ups */}
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Follow-ups</h3>
                <Button 
                  size="sm" 
                  onClick={() => setShowFollowupForm(!showFollowupForm)}
                  className="rounded-full"
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {showFollowupForm && (
                <div className="mb-4 p-4 rounded-xl bg-secondary/20 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Follow-up Date</label>
                    <Input
                      type="date"
                      value={followupData.followUpDate}
                      onChange={(e) => setFollowupData({...followupData, followUpDate: e.target.value})}
                      className="rounded-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Priority</label>
                    <Select
                      value={followupData.priority}
                      onValueChange={(value) => setFollowupData({...followupData, priority: value})}
                    >
                      <SelectTrigger className="rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Note</label>
                    <Textarea
                      placeholder="Add a note..."
                      value={followupData.note}
                      onChange={(e) => setFollowupData({...followupData, note: e.target.value})}
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleScheduleFollowup} size="sm" className="rounded-full flex-1">
                      <Save className="size-4 mr-2" />
                      Schedule
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowFollowupForm(false);
                        setFollowupData({ followUpDate: '', priority: 'medium', note: '' });
                      }}
                      size="sm" 
                      variant="outline"
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {followups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No follow-ups scheduled</p>
              ) : (
                <div className="space-y-3">
                  {followups.map(followup => (
                    <div key={followup.id} className="p-3 rounded-xl border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {new Date(followup.followUpDate).toLocaleDateString()}
                            </span>
                          </div>
                          {followup.note && (
                            <p className="text-xs text-muted-foreground mt-2">{followup.note}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          followup.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                          followup.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {followup.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Business Details */}
            <div className="rounded-3xl border bg-white p-6">
              <h3 className="font-semibold mb-4">Details</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 font-medium capitalize">{business.status}</span>
                </div>
                
                {business.googlePlaceId && (
                  <div>
                    <span className="text-muted-foreground">Place ID:</span>
                    <span className="ml-2 font-mono text-xs">{business.googlePlaceId.substring(0, 20)}...</span>
                  </div>
                )}
                
                {business.createdAt && (
                  <div>
                    <span className="text-muted-foreground">Imported:</span>
                    <span className="ml-2">{new Date(business.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function BusinessProfilePage() {
  return (
    <ProtectedRoute requireRole="super_admin">
      <BusinessProfileInner />
    </ProtectedRoute>
  );
}
