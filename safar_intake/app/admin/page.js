'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Home, Calendar, Wallet, ShieldAlert, BarChart3, ArrowUpRight, Search, Check, X, Loader2, AlertTriangle, Upload, FileSpreadsheet, Ban, RotateCcw, Shield, Trash2, UserCog, Star, Eye, TrendingUp, Pencil, Heart, Sparkles, Menu, Settings2, CreditCard, Gift, Ticket, Award, ChevronRight, LogOut, Coins, BadgeIndianRupee, Compass } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { listingsApi, apiJson, bookingsApi } from '@/lib/listings-api';
import { useAuth } from '@/lib/auth-context';

function LineChart({ data }) {
  const max = Math.max(...data); const min = Math.min(...data);
  const points = data.map((v,i)=>`${(i/(data.length-1))*100},${100-((v-min)/(max-min))*88-6}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32">
      <defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.4" /><stop offset="100%" stopColor="#10B981" stopOpacity="0" /></linearGradient></defs>
      <polyline fill="none" stroke="#0F3D2E" strokeWidth="1.6" points={points} />
      <polygon fill="url(#gd)" points={`0,100 ${points} 100,100`} />
    </svg>
  );
}

const StatusPill = ({ s }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald2 border-emerald-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    suspended: 'bg-slate-50 text-slate-600 border-slate-200',
    active: 'bg-emerald-50 text-emerald2 border-emerald-200',
    blacklisted: 'bg-rose-50 text-rose-600 border-rose-200',
    cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${map[s]||'bg-secondary'}`}>{s}</span>;
};

function AdminInner() {
  const { user } = useAuth(); // Get current user to check role
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [users, setUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('all');
  const [listingCategoryFilter, setListingCategoryFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  
  // New module states
  const [reviews, setReviews] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [promoModal, setPromoModal] = useState(null);
  const [ticketModal, setTicketModal] = useState(null);
  
  // Phase 3 module states
  const [admins, setAdmins] = useState([]);
  const [settings, setSettings] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [adminModal, setAdminModal] = useState(null);
  const [announcementModal, setAnnouncementModal] = useState(null);
  const [hostModal, setHostModal] = useState(null);
  const [safarTogetherEnabled, setSafarTogetherEnabled] = useState(false);
  const [safarPlans, setSafarPlans] = useState([]);
  // Module 11 (mobile fix): controlled tab + mobile drawer
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [safarRequests, setSafarRequests] = useState([]);
  const [safarReports, setSafarReports] = useState([]);
  const [safarStats, setSafarStats] = useState(null);
  const [safarBlockedUsers, setSafarBlockedUsers] = useState([]);
  const [safarConversations, setSafarConversations] = useState([]);
  const [safarPlanDetails, setSafarPlanDetails] = useState(null);
  
  const revenueChart = [22,28,34,30,42,55,49,62,68,71,84,96];

  const load = async () => {
    setLoading(true); setError(null);
    const [p, a, u, bk, rev, trans, revs, promos, tickets, adminsData, settingsData, announcementsData, logs, safarToggle, safarPlansData, safarRequestsData, safarReportsData, safarStatsData, safarBlockedData, safarConversationsData] = await Promise.all([
      listingsApi.list({ status: 'pending', limit: 50 }),
      listingsApi.list({ status: 'all', limit: 200 }),
      apiJson('/api/users'),
      bookingsApi.list('all'),
      apiJson('/api/admin/revenue'),
      apiJson('/api/admin/transactions'),
      apiJson('/api/reviews?limit=100'),
      apiJson('/api/admin/promos'),
      apiJson('/api/admin/tickets'),
      apiJson('/api/admin/admins'),
      apiJson('/api/admin/settings'),
      apiJson('/api/admin/announcements'),
      apiJson('/api/admin/activity-logs?limit=100'),
      apiJson('/api/settings/safar-together'),
      apiJson('/api/admin/safar-together/plans'),
      apiJson('/api/admin/safar-together/requests'),
      apiJson('/api/admin/safar-together/reports'),
      apiJson('/api/admin/safar-together/stats'),
      apiJson('/api/admin/safar-together/blocked-users'),
      apiJson('/api/admin/safar-together/conversations'),
    ]);
    if (p.ok && p.data?.ok) setPending(p.data.listings); else setError(p.data?.error || 'Failed to load pending');
    if (a.ok && a.data?.ok) setAll(a.data.listings);
    if (u.ok && u.data?.ok) setUsers(u.data.users);
    if (bk.ok && bk.data?.ok) setAllBookings(bk.data.bookings || []);
    if (rev.ok && rev.data?.ok) setRevenue(rev.data);
    if (trans.ok && trans.data?.ok) setTransactions(trans.data.transactions || []);
    if (revs.ok && revs.data?.ok) setReviews(revs.data.reviews || []);
    if (promos.ok && promos.data?.ok) setPromoCodes(promos.data.promoCodes || []);
    if (tickets.ok && tickets.data?.ok) setSupportTickets(tickets.data.tickets || []);
    if (adminsData.ok && adminsData.data?.ok) setAdmins(adminsData.data.admins || []);
    if (settingsData.ok && settingsData.data?.ok) setSettings(settingsData.data.settings || {});
    if (announcementsData.ok && announcementsData.data?.ok) setAnnouncements(announcementsData.data.announcements || []);
    if (logs.ok && logs.data?.ok) setActivityLogs(logs.data.logs || []);
    if (safarToggle.ok && safarToggle.data) setSafarTogetherEnabled(safarToggle.data.enabled || false);
    if (safarPlansData.ok && safarPlansData.data?.ok) setSafarPlans(safarPlansData.data.plans || []);
    if (safarRequestsData.ok && safarRequestsData.data?.ok) setSafarRequests(safarRequestsData.data.requests || []);
    if (safarReportsData.ok && safarReportsData.data?.ok) setSafarReports(safarReportsData.data.reports || []);
    if (safarStatsData.ok && safarStatsData.data?.ok) setSafarStats(safarStatsData.data.stats || {});
    if (safarBlockedData.ok && safarBlockedData.data?.ok) setSafarBlockedUsers(safarBlockedData.data.users || []);
    if (safarConversationsData.ok && safarConversationsData.data?.ok) setSafarConversations(safarConversationsData.data.conversations || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    const { ok, data } = await listingsApi.approve(id);
    if (!ok) return toast.error(data?.error || 'Approve failed');
    toast.success('Listing approved');
    load();
  };
  const reject = async (id) => {
    const reason = prompt('Reason for rejection (optional)') || '';
    const { ok, data } = await listingsApi.reject(id, reason);
    if (!ok) return toast.error(data?.error || 'Reject failed');
    toast.success('Listing rejected');
    load();
  };

  // User Management Actions
  const suspendUser = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/suspend`, { method: 'POST' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Suspend failed');
    toast.success('User suspended');
    load();
  };

  const reactivateUser = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/reactivate`, { method: 'POST' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Reactivate failed');
    toast.success('User reactivated');
    load();
  };

  const blacklistUser = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}/blacklist`, { method: 'POST' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Blacklist failed');
    toast.success('User blacklisted');
    load();
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Delete failed');
    toast.success('User deleted');
    load();
  };

  const changeRole = async (userId, newRole) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Role change failed');
    toast.success(`Role changed to ${newRole}`);
    setRoleModal(null);
    load();
  };

  // Listing Management Actions
  const suspendListing = async (id) => {
    const res = await fetch(`/api/listings/${id}/suspend`, { method: 'POST' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Suspend failed');
    toast.success('Listing suspended');
    load();
  };

  const activateListing = async (id) => {
    const res = await fetch(`/api/listings/${id}/activate`, { method: 'POST' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Activate failed');
    toast.success('Listing activated');
    load();
  };

  const toggleFeatured = async (id, featured) => {
    const res = await fetch(`/api/listings/${id}/featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured }),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Featured update failed');
    toast.success(featured ? 'Marked as featured' : 'Removed from featured');
    load();
  };

  const deleteListing = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Delete failed');
    toast.success('Listing deleted');
    load();
  };

  // Booking Management Actions
  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    const res = await fetch(`/api/admin/bookings/${id}/cancel`, { method: 'POST' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Cancel failed');
    toast.success('Booking cancelled');
    load();
  };

  const refundBooking = async (id) => {
    if (!confirm('Issue refund for this booking?')) return;
    const res = await fetch(`/api/admin/bookings/${id}/refund`, { method: 'POST' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Refund failed');
    toast.success('Refund issued');
    load();
  };

  // Booking Management Actions
  const updateBookingStatus = async (id, status) => {
    const res = await fetch(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Status update failed');
    toast.success(`Booking ${status}`);
    load();
  };

  // Review Management Actions
  const deleteReview = async (id) => {
    if (!confirm('Delete this review? This action cannot be undone.')) return;
    const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Delete failed');
    toast.success('Review deleted');
    load();
  };

  // Promo Code Actions
  const createPromo = async (promo) => {
    const res = await fetch('/api/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promo),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Create failed');
    toast.success('Promo code created');
    setPromoModal(null);
    load();
  };

  const updatePromo = async (id, updates) => {
    const res = await fetch(`/api/admin/promos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Update failed');
    toast.success('Promo code updated');
    setPromoModal(null);
    load();
  };

  const deletePromo = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Delete failed');
    toast.success('Promo code deleted');
    load();
  };

  // Support Ticket Actions
  const updateTicket = async (id, updates) => {
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Update failed');
    toast.success('Ticket updated');
    load();
  };

  const replyToTicket = async (id, message) => {
    const res = await fetch(`/api/admin/tickets/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Reply failed');
    toast.success('Reply sent');
    load();
  };

  // Admin Management Actions
  const createAdmin = async (adminData) => {
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Create failed');
    toast.success('Admin created successfully');
    setAdminModal(null);
    load();
  };

  const createHost = async (hostData) => {
    const res = await fetch('/api/admin/hosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...hostData, role: 'host'}),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Failed to create host');
    toast.success(`Host created! Email: ${hostData.email}, Password: ${hostData.password}`);
    setHostModal(null);
    load();
  };

  const toggleSafarTogether = async () => {
    const newState = !safarTogetherEnabled;
    const res = await fetch('/api/admin/safar-together/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: newState }),
    });
    const data = await res.json();
    if (!data.ok) return toast.error('Failed to toggle feature');
    setSafarTogetherEnabled(newState);
    toast.success(newState ? 'Safar Together enabled' : 'Safar Together disabled');
  };

  const loadPlanDetails = async (planId) => {
    const res = await fetch(`/api/admin/safar-together/plans/${planId}/details`);
    const data = await res.json();
    if (!data.ok) return toast.error('Failed to load plan details');
    setSafarPlanDetails(data);
  };

  const updateAdminRole = async (adminId, role) => {
    const res = await fetch(`/api/admin/admins/${adminId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Update failed');
    toast.success('Role updated');
    load();
  };

  const disableAdmin = async (adminId) => {
    const res = await fetch(`/api/admin/admins/${adminId}/disable`, { method: 'PATCH' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Action failed');
    toast.success('Admin disabled');
    load();
  };

  const enableAdmin = async (adminId) => {
    const res = await fetch(`/api/admin/admins/${adminId}/enable`, { method: 'PATCH' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Action failed');
    toast.success('Admin enabled');
    load();
  };

  const deleteAdmin = async (adminId) => {
    if (!confirm('Delete this admin account? This action cannot be undone.')) return;
    const res = await fetch(`/api/admin/admins/${adminId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Delete failed');
    toast.success('Admin deleted');
    load();
  };

  // Settings Actions
  const updateSettings = async (settingsData) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Update failed');
    toast.success('Settings updated');
    load();
  };

  // Announcement Actions
  const createAnnouncement = async (announcementData) => {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcementData),
    });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Create failed');
    toast.success('Announcement created');
    setAnnouncementModal(null);
    load();
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) return toast.error(data.error || 'Delete failed');
    toast.success('Announcement deleted');
    load();
  };

  const counts = {
    total:    all.length,
    approved: all.filter(l => l.status === 'approved').length,
    pending:  pending.length,
    rejected: all.filter(l => l.status === 'rejected').length,
    travelers: users.filter(u => u.role === 'traveler').length,
    hosts:    users.filter(u => u.role === 'host').length,
    todayBookings: allBookings.filter(b => {
      const today = new Date().toDateString();
      return new Date(b.createdAt).toDateString() === today;
    }).length,
  };

  // Recent Activity - last 20 activities
  const recentActivity = [];
  
  // New user registrations
  users.slice(-10).reverse().forEach(u => {
    if (u.createdAt) {
      recentActivity.push({
        type: u.role === 'host' ? 'host_registered' : 'traveler_registered',
        user: u.name,
        userId: u.id,
        timestamp: u.createdAt,
        icon: Users,
      });
    }
  });
  
  // New listings
  all.slice(-10).reverse().forEach(l => {
    if (l.createdAt) {
      recentActivity.push({
        type: 'listing_submitted',
        listing: l.title,
        listingId: l.id,
        user: l.hostName,
        status: l.status,
        timestamp: l.createdAt,
        icon: Home,
      });
    }
  });
  
  // Recent bookings
  allBookings.slice(-10).reverse().forEach(b => {
    if (b.createdAt) {
      recentActivity.push({
        type: 'booking_created',
        booking: b.listingTitle,
        bookingId: b.bookingId,
        user: b.travelerName,
        timestamp: b.createdAt,
        icon: Calendar,
      });
    }
  });
  
  // Sort by timestamp and take top 15
  recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const topActivity = recentActivity.slice(0, 15);

  // Filter functions
  const filteredListings = all.filter(l => {
    const matchesSearch = !searchQuery || 
      l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.hostName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = listingStatusFilter === 'all' || l.status === listingStatusFilter;
    const matchesCategory = listingCategoryFilter === 'all' || l.category === listingCategoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const hosts = users.filter(u => u.role === 'host');
  const travelers = users.filter(u => u.role === 'traveler');

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Admin Console</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">Safar Operations</h1>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto md:flex-row flex-col-reverse md:items-center">
            <div className="flex items-center gap-2 bg-white border rounded-full px-4 py-2.5 w-full md:w-80">
              <Search className="size-4 text-muted-foreground" />
              <input 
                placeholder="Search users, hosts, listings..." 
                className="flex-1 text-sm outline-none" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-charcoal">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold shrink-0">
              <Link href="/admin/import"><Upload className="size-4 mr-2" /> Import Listings</Link>
            </Button>
            {user?.role === 'super_admin' && (
              <Button asChild className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shrink-0">
                <Link href="/admin/marketplace"><Sparkles className="size-4 mr-2" /> AI Marketplace Builder</Link>
              </Button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { l:'Total users', v: users.length.toLocaleString(), d:`${counts.hosts} hosts · ${counts.travelers} travelers`, i: Users },
            { l:'Active listings', v: counts.approved.toLocaleString(), d:`${counts.pending} pending approval`, i: Home },
            { l:"Today's bookings", v: counts.todayBookings.toLocaleString(), d: `${allBookings.length} total bookings`, i: Calendar },
            { l:'Revenue (mo)', v: revenue?.monthlyRevenue ? `₹${(revenue.monthlyRevenue/100000).toFixed(1)}L` : '...', d:'+22% vs last month', i: Wallet },
          ].map((k,i)=>{const Ico=k.i;return(
            <motion.div key={k.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }} className="rounded-3xl border bg-white p-5">
              <div className="flex items-center justify-between"><Ico className="size-5 text-emerald2" /><div className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><TrendingUp className="size-3" /></div></div>
              <div className="font-display text-2xl font-bold mt-3">{k.v}</div>
              <div className="text-xs text-muted-foreground">{k.l}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{k.d}</div>
            </motion.div>
          );})}
        </div>

        {/* Mobile navigation trigger (below md) */}
        <div className="md:hidden mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border bg-white dark:bg-neutral-900 hover:bg-secondary text-sm font-semibold flex-1 justify-center"
          >
            <Menu className="size-4" />
            Menu · <span className="capitalize opacity-80">{activeTab}</span>
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <button
              aria-label="Close menu backdrop"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <div className="absolute top-0 left-0 h-full w-[86%] max-w-sm bg-white dark:bg-neutral-950 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-950 z-10">
                <div>
                  <div className="text-emerald2 text-[10px] uppercase tracking-[0.18em] font-bold">Super Admin</div>
                  <div className="font-display text-lg font-bold">Menu</div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="size-9 grid place-items-center rounded-full border hover:bg-secondary"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { section: 'Overview', items: [
                    { label: 'Dashboard', tab: 'overview', icon: BarChart3 },
                  ]},
                  { section: 'Marketplace', items: [
                    { label: 'Discover & Import', href: '/admin/marketplace/dashboard', icon: Search },
                    { label: 'Marketplace CRM', href: '/admin/marketplace', icon: Users },
                    { label: 'Templates', href: '/admin/marketplace/templates', icon: FileSpreadsheet },
                  ]},
                  { section: 'Website Builder', items: [
                    { label: 'Website Builder', href: '/admin/website-builder', icon: Sparkles },
                    { label: 'Home Pages', href: '/admin/website-builder/home-pages', icon: Home },
                    { label: 'Pages', href: '/admin/website-builder/pages', icon: FileSpreadsheet },
                    { label: 'Media Library', href: '/admin/website-builder/media', icon: FileSpreadsheet },
                    { label: 'Theme', href: '/admin/website-builder/theme', icon: Settings2 },
                  ]},
                  { section: 'Revenue & Rewards', items: [
                    { label: 'Finance Center', href: '/admin/finance', icon: BadgeIndianRupee },
                    { label: 'Dynamic Pricing', href: '/admin/pricing', icon: TrendingUp },
                    { label: 'Payment Gateways', href: '/admin/settings/payment-gateways', icon: CreditCard },
                    { label: 'Revenue Engine', href: '/admin/settings/revenue-engine', icon: Settings2 },
                    { label: 'Promotions', href: '/admin/settings/revenue-engine?tab=promo', icon: Sparkles },
                    { label: 'Coupons', href: '/admin/settings/revenue-engine?tab=coupons', icon: Ticket },
                    { label: 'Rewards & Analytics', href: '/admin/settings/revenue-engine?tab=analytics', icon: Gift },
                    { label: 'Wallet & Credits', href: '/admin/settings/revenue-engine?tab=rules', icon: Wallet },
                    { label: 'Loyalty Program', href: '/admin/settings/revenue-engine?tab=rules', icon: Award },
                    { label: 'Referral Program', href: '/admin/settings/revenue-engine?tab=rules', icon: Users },
                  ]},
                  { section: 'People', items: [
                    { label: 'Users', tab: 'users', icon: Users },
                    { label: 'Hosts', tab: 'hosts', icon: Home },
                    { label: 'Travelers', tab: 'travelers', icon: Users },
                    { label: 'Admins', tab: 'admins', icon: Shield },
                  ]},
                  { section: 'Operations', items: [
                    { label: 'Bookings', tab: 'bookings', icon: Calendar },
                    { label: 'Listings', tab: 'listings', icon: Home },
                    { label: 'Reviews', tab: 'reviews', icon: Star },
                    { label: 'Review Center', href: '/admin/reviews', icon: ShieldAlert },
                    { label: 'Analytics Center', href: '/admin/analytics', icon: BarChart3 },
                    { label: 'Reports (Analytics)', tab: 'revenue', icon: BarChart3 },
                    { label: 'Audit Logs', tab: 'activity', icon: FileSpreadsheet },
                    { label: 'Communication Center', href: '/admin/communication', icon: Sparkles },
                    { label: 'Support Center', href: '/admin/support', icon: ShieldAlert },
                    { label: 'Knowledge Base', href: '/admin/knowledge-base', icon: FileSpreadsheet },
                    { label: 'Announcements', tab: 'announcements', icon: Sparkles },
                    { label: 'Support', tab: 'support', icon: ShieldAlert },
                  ]},
                  { section: 'Configuration', items: [
                    { label: 'System Settings', tab: 'settings', icon: Settings2 },
                    { label: '🤝 Safar Together', tab: 'safar-together', icon: Heart },
                  ]},
                ].map((group) => (
                  <div key={group.section} className="pt-2">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">{group.section}</div>
                    {group.items.map((it) => {
                      const Ico = it.icon;
                      const activeClass = it.tab === activeTab ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald2 font-semibold' : '';
                      if (it.tab) {
                        return (
                          <button
                            key={it.label}
                            onClick={() => { setActiveTab(it.tab); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary dark:hover:bg-neutral-800 text-sm text-left touch-manipulation ${activeClass}`}
                          >
                            <Ico className="size-4 shrink-0" />
                            <span className="flex-1">{it.label}</span>
                            {it.tab === activeTab && <ChevronRight className="size-4" />}
                          </button>
                        );
                      }
                      return (
                        <Link
                          key={it.label}
                          href={it.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary dark:hover:bg-neutral-800 text-sm touch-manipulation"
                        >
                          <Ico className="size-4 shrink-0" />
                          <span className="flex-1">{it.label}</span>
                          <ArrowUpRight className="size-3.5 opacity-50" />
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 md:mt-8">
          <TabsList className="hidden md:grid w-full md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-14 h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="promotions">Promos</TabsTrigger>
            <TabsTrigger value="hosts">Hosts</TabsTrigger>
            <TabsTrigger value="travelers">Travelers</TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="revenue">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="announcements">Announce</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="safar-together">🤝 Safar Together</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 mt-6">
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 rounded-3xl border bg-white p-6">
                <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Revenue trend</div><div className="font-display text-2xl font-bold">12-month overview</div></div><BarChart3 className="size-5 text-emerald2" /></div>
                <div className="mt-4"><LineChart data={revenueChart} /></div>
              </div>
              <div className="rounded-3xl border bg-white p-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Listings overview</div>
                <div className="mt-3 space-y-3">
                  {[
                    {l:'Approved',v: counts.total ? Math.round(counts.approved/counts.total*100) : 0},
                    {l:'Pending', v: counts.total ? Math.round(counts.pending/counts.total*100) : 0},
                    {l:'Rejected',v: counts.total ? Math.round(counts.rejected/counts.total*100) : 0},
                  ].map((r)=>(
                    <div key={r.l}><div className="flex justify-between text-sm"><span>{r.l}</span><span className="font-semibold">{r.v}%</span></div><div className="h-2 bg-secondary rounded-full mt-1 overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: `${r.v}%` }} viewport={{ once: true }} className="h-full bg-gradient-emerald" /></div></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="size-5 text-emerald2" /> Recent Activity
                </h2>
                <span className="text-sm text-muted-foreground">{topActivity.length} recent events</span>
              </div>
              <div className="rounded-3xl border bg-white p-6">
                {topActivity.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">No recent activity</div>
                ) : (
                  <div className="space-y-3">
                    {topActivity.map((activity, idx) => {
                      const Icon = activity.icon;
                      const getActivityText = () => {
                        switch(activity.type) {
                          case 'host_registered':
                            return <><span className="font-semibold">{activity.user}</span> registered as a <span className="text-emerald2 font-semibold">Host</span></>;
                          case 'traveler_registered':
                            return <><span className="font-semibold">{activity.user}</span> registered as a <span className="text-blue-600 font-semibold">Traveler</span></>;
                          case 'listing_submitted':
                            return <><span className="font-semibold">{activity.user}</span> submitted listing <span className="font-semibold">"{activity.listing}"</span> · <StatusPill s={activity.status} /></>;
                          case 'booking_created':
                            return <><span className="font-semibold">{activity.user}</span> booked <span className="font-semibold">"{activity.booking}"</span></>;
                          default:
                            return null;
                        }
                      };
                      
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/40 transition">
                          <div className="size-8 rounded-full bg-secondary grid place-items-center shrink-0">
                            <Icon className="size-4 text-emerald2" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{getActivityText()}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {new Date(activity.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Pending Approvals */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl font-bold flex items-center gap-2"><ShieldAlert className="size-5 text-gold" /> Pending approvals</h2>
                <span className="text-sm text-muted-foreground">{pending.length} listing{pending.length===1?'':'s'} awaiting review</span>
              </div>
              {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
              {error && <div className="p-6 border rounded-3xl bg-rose-50/40 border-rose-200 text-center"><AlertTriangle className="size-6 mx-auto text-rose-500" /><div className="mt-2 text-sm">{error}</div></div>}
              {!loading && pending.length === 0 && !error && (
                <div className="p-10 border rounded-3xl bg-white text-center">
                  <Check className="size-7 mx-auto text-emerald2" />
                  <div className="font-display text-lg font-bold mt-3">All caught up!</div>
                  <p className="text-sm text-muted-foreground mt-1">No listings are pending approval right now.</p>
                </div>
              )}
              {!loading && pending.length > 0 && (
                <div className="rounded-3xl border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b"><div className="col-span-5">Listing</div><div className="col-span-3">Host</div><div className="col-span-2">Category</div><div className="col-span-2 text-right">Action</div></div>
                      {pending.map((p)=>(
                        <div key={p.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                          <div className="col-span-5 flex items-center gap-3"><img src={(p.images && p.images[0]) || ''} className="size-12 rounded-xl object-cover bg-secondary" alt="" /><div><div className="font-semibold text-sm line-clamp-1">{p.title}</div><div className="text-xs text-muted-foreground">{p.location}</div></div></div>
                          <div className="col-span-3 flex items-center gap-2"><div className="size-7 rounded-full bg-gradient-emerald grid place-items-center text-white text-xs font-bold">{(p.hostName||'?').charAt(0)}</div><span className="text-sm">{p.hostName || p.hostId}</span></div>
                          <div className="col-span-2 text-sm capitalize">{p.category}</div>
                          <div className="col-span-2 flex justify-end gap-1.5"><Button onClick={()=>approve(p.id)} size="sm" className="rounded-full h-8 bg-emerald2 hover:bg-emerald2-deep"><Check className="size-3.5 mr-1" /> Approve</Button><Button onClick={()=>reject(p.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"><X className="size-3.5" /></Button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </TabsContent>

          {/* Hosts Tab */}
          <TabsContent value="hosts" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Host Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage all hosts and their listings</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{hosts.length} total hosts</span>
                <Button onClick={()=>setHostModal({mode:'create'})} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">+ Create Host</Button>
              </div>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && hosts.length === 0 && (
              <div className="p-10 border rounded-3xl bg-white text-center">
                <Users className="size-7 mx-auto text-muted-foreground" />
                <div className="font-display text-lg font-bold mt-3">No hosts yet</div>
                <p className="text-sm text-muted-foreground mt-1">Hosts will appear here once they register.</p>
              </div>
            )}
            {!loading && hosts.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-3">Host</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Listings</div>
                      <div className="col-span-2">Bookings</div>
                      <div className="col-span-3 text-right">Actions</div>
                    </div>
                    {hosts.filter(h => {
                      if (!searchQuery) return true;
                      return h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             h.email?.toLowerCase().includes(searchQuery.toLowerCase());
                    }).map((h)=>(
                      <div key={h.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gradient-emerald grid place-items-center text-white font-semibold">{(h.name||'?').charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{h.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{h.email}</div>
                          </div>
                        </div>
                        <div className="col-span-2"><StatusPill s={h.status || 'active'} /></div>
                        <div className="col-span-2">
                          <div className="text-sm font-semibold">{h.listingCount || 0} listings</div>
                          <div className="text-xs text-muted-foreground">
                            {all.filter(l => l.hostId === h.id && l.status === 'approved').length} approved
                          </div>
                        </div>
                        <div className="col-span-2 text-sm">{h.bookingCount || 0} bookings</div>
                        <div className="col-span-3 flex justify-end gap-1">
                          <Button onClick={()=>setHostModal({...h, mode:'edit'})} size="sm" variant="ghost" className="rounded-full h-8" title="Edit"><Pencil className="size-3.5" /></Button>
                          {h.status !== 'suspended' && <Button onClick={()=>suspendUser(h.id)} size="sm" variant="ghost" className="rounded-full h-8" title="Suspend"><Ban className="size-3.5" /></Button>}
                          {h.status === 'suspended' && <Button onClick={()=>reactivateUser(h.id)} size="sm" variant="ghost" className="rounded-full h-8 text-emerald2" title="Reactivate"><RotateCcw className="size-3.5" /></Button>}
                          <Button onClick={()=>setUserModal(h)} size="sm" className="rounded-full h-8 bg-emerald2 hover:bg-emerald2-deep">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Travelers Tab */}
          <TabsContent value="travelers" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Traveler Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage all travelers and their bookings</p>
              </div>
              <span className="text-sm text-muted-foreground">{travelers.length} total travelers</span>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && travelers.length === 0 && (
              <div className="p-10 border rounded-3xl bg-white text-center">
                <Users className="size-7 mx-auto text-muted-foreground" />
                <div className="font-display text-lg font-bold mt-3">No travelers yet</div>
                <p className="text-sm text-muted-foreground mt-1">Travelers will appear here once they register.</p>
              </div>
            )}
            {!loading && travelers.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-4">Traveler</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Bookings</div>
                      <div className="col-span-1">Reviews</div>
                      <div className="col-span-3 text-right">Actions</div>
                    </div>
                    {travelers.filter(t => {
                      if (!searchQuery) return true;
                      return t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.email?.toLowerCase().includes(searchQuery.toLowerCase());
                    }).map((t)=>(
                      <div key={t.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="size-10 rounded-full bg-blue-500 grid place-items-center text-white font-semibold">{(t.name||'?').charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{t.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{t.email}</div>
                          </div>
                        </div>
                        <div className="col-span-2"><StatusPill s={t.status || 'active'} /></div>
                        <div className="col-span-2">
                          <div className="text-sm font-semibold">{t.bookingCount || 0} bookings</div>
                          <div className="text-xs text-muted-foreground">
                            {allBookings.filter(b => b.travelerId === t.id).length} total
                          </div>
                        </div>
                        <div className="col-span-1 text-sm">{t.reviewCount || 0}</div>
                        <div className="col-span-3 flex justify-end gap-1">
                          {t.status !== 'suspended' && <Button onClick={()=>suspendUser(t.id)} size="sm" variant="ghost" className="rounded-full h-8" title="Disable"><Ban className="size-3.5" /></Button>}
                          {t.status === 'suspended' && <Button onClick={()=>reactivateUser(t.id)} size="sm" variant="ghost" className="rounded-full h-8 text-emerald2" title="Reactivate"><RotateCcw className="size-3.5" /></Button>}
                          <Button onClick={()=>blacklistUser(t.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600" title="Blacklist"><Shield className="size-3.5" /></Button>
                          <Button onClick={()=>setUserModal(t)} size="sm" className="rounded-full h-8 bg-emerald2 hover:bg-emerald2-deep">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">All Users</h2>
                <span className="text-sm text-muted-foreground">{filteredUsers.length} of {users.length} users</span>
              </div>
              <select 
                value={userRoleFilter} 
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-full border text-sm outline-none focus:ring-2 focus:ring-emerald2/20"
              >
                <option value="all">All Roles</option>
                <option value="traveler">Travelers</option>
                <option value="host">Hosts</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && filteredUsers.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-3">User</div><div className="col-span-2">Role</div><div className="col-span-2">Status</div><div className="col-span-2">Listings/Bookings</div><div className="col-span-3 text-right">Actions</div>
                    </div>
                    {filteredUsers.map((u)=>(
                      <div key={u.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gradient-emerald grid place-items-center text-white font-semibold">{(u.name||'?').charAt(0)}</div>
                          <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{u.name}</div><div className="text-xs text-muted-foreground truncate">{u.email}</div></div>
                        </div>
                        <div className="col-span-2"><StatusPill s={u.role} /></div>
                        <div className="col-span-2"><StatusPill s={u.status || 'active'} /></div>
                        <div className="col-span-2 text-sm">{u.listingCount || 0} / {u.bookingCount || 0}</div>
                        <div className="col-span-3 flex justify-end gap-1">
                          {u.role !== 'admin' && (
                            <>
                              {u.status !== 'suspended' && <Button onClick={()=>suspendUser(u.id)} size="sm" variant="ghost" className="rounded-full h-8" title="Suspend"><Ban className="size-3.5" /></Button>}
                              {u.status === 'suspended' && <Button onClick={()=>reactivateUser(u.id)} size="sm" variant="ghost" className="rounded-full h-8 text-emerald2" title="Reactivate"><RotateCcw className="size-3.5" /></Button>}
                              <Button onClick={()=>blacklistUser(u.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600" title="Blacklist"><Shield className="size-3.5" /></Button>
                              <Button onClick={()=>setRoleModal(u)} size="sm" variant="ghost" className="rounded-full h-8" title="Change Role"><UserCog className="size-3.5" /></Button>
                              <Button onClick={()=>deleteUser(u.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600" title="Delete"><Trash2 className="size-3.5" /></Button>
                            </>
                          )}
                          <Button onClick={()=>setUserModal(u)} size="sm" className="rounded-full h-8 bg-emerald2 hover:bg-emerald2-deep">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Listing Management</h2>
                <span className="text-sm text-muted-foreground">{filteredListings.length} of {all.length} listings</span>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <select 
                  value={listingStatusFilter} 
                  onChange={(e) => setListingStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-full border text-sm outline-none focus:ring-2 focus:ring-emerald2/20"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select 
                  value={listingCategoryFilter} 
                  onChange={(e) => setListingCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-full border text-sm outline-none focus:ring-2 focus:ring-emerald2/20"
                >
                  <option value="all">All Categories</option>
                  <option value="houseboat">Houseboat</option>
                  <option value="cabin">Cabin</option>
                  <option value="cottage">Cottage</option>
                  <option value="home">Home</option>
                  <option value="camp">Camp</option>
                  <option value="tour">Tour</option>
                  <option value="transport">Transport</option>
                  <option value="experience">Experience</option>
                </select>
              </div>
            </div>
            {!loading && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-4">Listing</div><div className="col-span-2">Host</div><div className="col-span-2">Status</div><div className="col-span-1">Featured</div><div className="col-span-3 text-right">Actions</div>
                    </div>
                    {filteredListings.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">No listings match your filters</div>
                    ) : (
                      filteredListings.slice(0, 50).map((p)=>(
                        <div key={p.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                          <div className="col-span-4 flex items-center gap-3"><img src={(p.images && p.images[0]) || ''} className="size-12 rounded-xl object-cover bg-secondary" alt="" /><div><div className="font-semibold text-sm line-clamp-1">{p.title}</div><div className="text-xs text-muted-foreground">{p.location} · ₹{p.price.toLocaleString('en-IN')}</div></div></div>
                          <div className="col-span-2 text-sm">{p.hostName || p.hostId}</div>
                          <div className="col-span-2"><StatusPill s={p.status} /></div>
                          <div className="col-span-1">{p.featured ? <Star className="size-4 text-gold fill-gold" /> : <Star className="size-4 text-muted-foreground" />}</div>
                          <div className="col-span-3 flex justify-end gap-1">
                            {p.status !== 'approved' && <Button onClick={()=>approve(p.id)} size="sm" variant="outline" className="rounded-full h-8" title="Approve"><Check className="size-3.5" /></Button>}
                            {p.status !== 'suspended' && <Button onClick={()=>suspendListing(p.id)} size="sm" variant="ghost" className="rounded-full h-8" title="Suspend"><Ban className="size-3.5" /></Button>}
                            {p.status === 'suspended' && <Button onClick={()=>activateListing(p.id)} size="sm" variant="ghost" className="rounded-full h-8 text-emerald2" title="Activate"><RotateCcw className="size-3.5" /></Button>}
                            <Button onClick={()=>toggleFeatured(p.id, !p.featured)} size="sm" variant="ghost" className="rounded-full h-8 text-gold" title={p.featured ? "Unfeature" : "Feature"}><Star className="size-3.5" /></Button>
                            <Button onClick={()=>deleteListing(p.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600" title="Delete"><Trash2 className="size-3.5" /></Button>
                            <Link href={`/property/${p.id}`} className="px-3 py-1 rounded-full bg-secondary text-xs font-semibold hover:bg-secondary/80">View</Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Booking Management</h2>
                <span className="text-sm text-muted-foreground">
                  {allBookings.filter(b => bookingStatusFilter === 'all' || b.status === bookingStatusFilter).length} of {allBookings.length} bookings
                </span>
              </div>
              <select 
                value={bookingStatusFilter} 
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-full border text-sm outline-none focus:ring-2 focus:ring-emerald2/20"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {!loading && allBookings.length === 0 && (
              <div className="p-6 rounded-3xl border bg-white text-center text-sm text-muted-foreground">No bookings yet.</div>
            )}
            {!loading && allBookings.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[1100px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-3">Listing</div><div className="col-span-2">Guest → Host</div><div className="col-span-2">Dates</div><div className="col-span-1">Status</div><div className="col-span-2 text-right">Total</div><div className="col-span-2 text-right">Actions</div>
                    </div>
                    {allBookings.filter(b => bookingStatusFilter === 'all' || b.status === bookingStatusFilter).slice(0, 50).map((b) => (
                      <div key={b.bookingId} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-3 flex items-center gap-3">{b.listingImage && <img src={b.listingImage} className="size-10 rounded-lg object-cover" alt="" />}<div><div className="font-semibold text-sm line-clamp-1">{b.listingTitle}</div></div></div>
                        <div className="col-span-2 text-xs">{b.travelerName}<br/><span className="text-muted-foreground">→ {b.hostName}</span></div>
                        <div className="col-span-2 text-xs">{new Date(b.checkInDate).toLocaleDateString()} →<br/>{new Date(b.checkOutDate).toLocaleDateString()}</div>
                        <div className="col-span-1">
                          <select 
                            value={b.status} 
                            onChange={(e) => updateBookingStatus(b.bookingId, e.target.value)}
                            className="text-xs px-2 py-1 rounded-full border outline-none"
                            disabled={b.status === 'cancelled'}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="col-span-2 text-right text-sm font-semibold">₹{(b.totalPrice||0).toLocaleString('en-IN')}{b.refunded && <span className="text-xs text-emerald2 block">Refunded</span>}</div>
                        <div className="col-span-2 flex justify-end gap-1">
                          {b.status !== 'cancelled' && b.status !== 'completed' && <Button onClick={()=>updateBookingStatus(b.bookingId, 'completed')} size="sm" variant="outline" className="rounded-full h-8 text-emerald2" title="Mark Completed"><Check className="size-3.5" /></Button>}
                          {b.status !== 'cancelled' && <Button onClick={()=>cancelBooking(b.bookingId)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600" title="Cancel"><X className="size-3.5" /></Button>}
                          {!b.refunded && b.status === 'cancelled' && <Button onClick={()=>refundBooking(b.bookingId)} size="sm" variant="ghost" className="rounded-full h-8 text-emerald2" title="Refund"><Wallet className="size-3.5" /></Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Reviews Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage customer reviews and ratings</p>
              </div>
              <span className="text-sm text-muted-foreground">{reviews.length} total reviews</span>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && reviews.length === 0 && (
              <div className="p-10 rounded-3xl border bg-white text-center">
                <Star className="size-7 mx-auto text-muted-foreground" />
                <div className="font-display text-lg font-bold mt-3">No reviews yet</div>
                <p className="text-sm text-muted-foreground mt-1">Reviews will appear here once customers submit them.</p>
              </div>
            )}
            {!loading && reviews.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-3">Property</div><div className="col-span-2">Reviewer</div><div className="col-span-1">Rating</div><div className="col-span-4">Review</div><div className="col-span-2 text-right">Actions</div>
                    </div>
                    {reviews.slice(0, 50).map((r)=>(
                      <div key={r.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-3">
                          <Link href={`/property/${r.propertyId}`} className="font-semibold text-sm hover:text-emerald2 line-clamp-1">{r.propertyTitle || r.propertyId}</Link>
                        </div>
                        <div className="col-span-2 text-sm">{r.userName || 'Anonymous'}</div>
                        <div className="col-span-1">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`size-3 ${i < (r.rating || 0) ? 'fill-gold text-gold' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="col-span-4 text-xs text-muted-foreground line-clamp-2">{r.reviewText || 'No comment'}</div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <Button onClick={()=>deleteReview(r.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600" title="Delete"><Trash2 className="size-3.5" /></Button>
                          <Link href={`/property/${r.propertyId}`} className="px-3 py-1 rounded-full bg-secondary text-xs font-semibold hover:bg-secondary/80">View Property</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Promotions & Promo Codes</h2>
                <p className="text-sm text-muted-foreground mt-1">Create and manage promotional campaigns</p>
              </div>
              <Button onClick={()=>setPromoModal({mode:'create'})} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">Create Promo Code</Button>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && promoCodes.length === 0 && (
              <div className="p-10 rounded-3xl border bg-white text-center">
                <ShieldAlert className="size-7 mx-auto text-muted-foreground" />
                <div className="font-display text-lg font-bold mt-3">No promo codes yet</div>
                <p className="text-sm text-muted-foreground mt-1">Create your first promotional campaign.</p>
                <Button onClick={()=>setPromoModal({mode:'create'})} className="rounded-full bg-emerald2 hover:bg-emerald2-deep mt-4">Create Promo Code</Button>
              </div>
            )}
            {!loading && promoCodes.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[1000px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-2">Code</div><div className="col-span-3">Description</div><div className="col-span-2">Discount</div><div className="col-span-2">Valid Until</div><div className="col-span-1">Status</div><div className="col-span-2 text-right">Actions</div>
                    </div>
                    {promoCodes.map((p)=>(
                      <div key={p.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-2 font-mono font-bold text-sm">{p.code}</div>
                        <div className="col-span-3 text-xs line-clamp-1">{p.description}</div>
                        <div className="col-span-2 text-sm font-semibold text-emerald2">
                          {p.discountType === 'percentage' ? `${p.discountValue}%` : `₹${p.discountValue}`}
                        </div>
                        <div className="col-span-2 text-xs">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'No expiry'}</div>
                        <div className="col-span-1"><StatusPill s={p.active ? 'active' : 'suspended'} /></div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <Button onClick={()=>updatePromo(p.id, {active: !p.active})} size="sm" variant="outline" className="rounded-full h-8" title={p.active ? "Disable" : "Enable"}>{p.active ? <Ban className="size-3.5" /> : <Check className="size-3.5" />}</Button>
                          <Button onClick={()=>setPromoModal({mode:'edit', promo:p})} size="sm" variant="ghost" className="rounded-full h-8" title="Edit"><Eye className="size-3.5" /></Button>
                          <Button onClick={()=>deletePromo(p.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600" title="Delete"><Trash2 className="size-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Customer Support Center</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage customer support tickets and conversations</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {supportTickets.filter(t=>t.status==='open').length} open · {supportTickets.length} total
              </span>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && supportTickets.length === 0 && (
              <div className="p-10 rounded-3xl border bg-white text-center">
                <Users className="size-7 mx-auto text-muted-foreground" />
                <div className="font-display text-lg font-bold mt-3">No support tickets</div>
                <p className="text-sm text-muted-foreground mt-1">Customer support tickets will appear here.</p>
              </div>
            )}
            {!loading && supportTickets.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[1100px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-1">Ticket #</div><div className="col-span-2">Customer</div><div className="col-span-2">Category</div><div className="col-span-1">Priority</div><div className="col-span-2">Status</div><div className="col-span-2">Created</div><div className="col-span-2 text-right">Actions</div>
                    </div>
                    {supportTickets.slice(0, 50).map((t)=>(
                      <div key={t.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-1 font-mono text-xs">#{t.ticketNumber || t.id.slice(0,6)}</div>
                        <div className="col-span-2 text-sm">{t.customerName}</div>
                        <div className="col-span-2 text-xs capitalize">{t.category}</div>
                        <div className="col-span-1"><StatusPill s={t.priority || 'medium'} /></div>
                        <div className="col-span-2">
                          <select 
                            value={t.status} 
                            onChange={(e) => updateTicket(t.id, {status: e.target.value})}
                            className="text-xs px-2 py-1 rounded-full border outline-none w-full"
                          >
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="waiting">Waiting</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        <div className="col-span-2 text-xs">{new Date(t.createdAt).toLocaleDateString()}</div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <Button onClick={()=>setTicketModal(t)} size="sm" className="rounded-full h-8 bg-emerald2 hover:bg-emerald2-deep">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Admins Tab - MODULE 9 */}
          <TabsContent value="admins" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Admin Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage platform administrators</p>
              </div>
              <Button onClick={()=>setAdminModal({mode:'create'})} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">Create Admin</Button>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-3">Admin</div><div className="col-span-2">Role</div><div className="col-span-2">Status</div><div className="col-span-2">Last Login</div><div className="col-span-3 text-right">Actions</div>
                    </div>
                    {admins.map((admin)=>(
                      <div key={admin.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center text-white font-semibold">{(admin.name||'?').charAt(0)}</div>
                          <div><div className="font-semibold text-sm">{admin.name}</div><div className="text-xs text-muted-foreground">{admin.email}</div></div>
                        </div>
                        <div className="col-span-2"><StatusPill s={admin.role || 'admin'} /></div>
                        <div className="col-span-2"><StatusPill s={admin.status || 'active'} /></div>
                        <div className="col-span-2 text-xs">{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}</div>
                        <div className="col-span-3 flex justify-end gap-1">
                          {admin.role !== 'super_admin' && (
                            <>
                              <select onChange={(e)=>updateAdminRole(admin.id, e.target.value)} value={admin.role || 'admin'} className="text-xs px-2 py-1 border rounded-full">
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="support_agent">Support Agent</option>
                              </select>
                              {admin.status !== 'disabled' && <Button onClick={()=>disableAdmin(admin.id)} size="sm" variant="ghost" className="rounded-full h-8"><Ban className="size-3.5" /></Button>}
                              {admin.status === 'disabled' && <Button onClick={()=>enableAdmin(admin.id)} size="sm" variant="ghost" className="rounded-full h-8 text-emerald2"><Check className="size-3.5" /></Button>}
                              <Button onClick={()=>deleteAdmin(admin.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600"><Trash2 className="size-3.5" /></Button>
                            </>
                          )}
                          {admin.role === 'super_admin' && <span className="text-xs text-emerald2 font-semibold px-3">Protected</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab - MODULE 10 */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div>
              <h2 className="font-display text-2xl font-bold">System Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">Configure platform settings</p>
            </div>

            {/* Public Homepage — pick which EXISTING home experience is the default public landing page */}
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h3 className="font-semibold text-lg">Public Homepage</h3>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald2 border-emerald-200">
                  Active: {(settings?.publicHomepage || 'safar') === 'explore' ? 'Explore' : 'Safar Curated'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Choose which Safar experience visitors see when they open the main website.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: 'safar', title: 'Safar Curated', desc: 'Curated stays, services and travel marketplace', Icon: Home },
                  { key: 'explore', title: 'Explore', desc: 'Community trips and local travel', Icon: Compass },
                ].map(({ key, title, desc, Icon }) => {
                  const active = (settings?.publicHomepage || 'safar') === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { if (!active) updateSettings({ publicHomepage: key }); }}
                      className={`text-left rounded-2xl border p-5 flex items-start gap-4 transition ${active ? 'border-emerald2 bg-emerald-50/60 ring-1 ring-emerald2' : 'hover:border-emerald2 hover:shadow-md'}`}
                    >
                      <div className={`size-11 rounded-xl grid place-items-center shrink-0 ${active ? 'bg-emerald2 text-white' : 'bg-emerald-50 text-emerald2'}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-display text-lg font-bold flex items-center gap-2">
                          {title}
                          {active && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald2 text-white"><Check className="size-3" /> Active</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Settings — Super Admin only navigation */}
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/admin/settings/revenue-engine"
                className="group rounded-2xl border bg-white p-5 flex items-start gap-4 hover:border-emerald2 hover:shadow-md transition">
                <div className="size-11 rounded-xl bg-emerald-50 grid place-items-center text-emerald2 shrink-0 group-hover:bg-emerald2 group-hover:text-white transition">
                  <Sparkles className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-lg font-bold flex items-center gap-2">
                    Revenue Engine
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">Super Admin</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Booking fees · Wallet · Credits · Referrals · Loyalty · Promotions · Coupons · Cashback · Tax · Refunds · Analytics
                  </div>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-emerald2 transition" />
              </Link>
              <Link href="/admin/settings/payment-gateways"
                className="group rounded-2xl border bg-white p-5 flex items-start gap-4 hover:border-emerald2 hover:shadow-md transition">
                <div className="size-11 rounded-xl bg-emerald-50 grid place-items-center text-emerald2 shrink-0 group-hover:bg-emerald2 group-hover:text-white transition">
                  <Wallet className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-lg font-bold flex items-center gap-2">
                    Payment Gateways
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">Super Admin</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Configure Razorpay & other providers · encrypted secrets · test connection · audit
                  </div>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-emerald2 transition" />
              </Link>
              <Link href="/admin/marketplace/settings"
                className="group rounded-2xl border bg-white p-5 flex items-start gap-4 hover:border-emerald2 hover:shadow-md transition">
                <div className="size-11 rounded-xl bg-emerald-50 grid place-items-center text-emerald2 shrink-0 group-hover:bg-emerald2 group-hover:text-white transition">
                  <Shield className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-lg font-bold">Marketplace Integrations</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Google Places API & other 3rd-party integrations
                  </div>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-emerald2 transition" />
              </Link>
            </div>

            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const settingsData = {
                  websiteName: formData.get('websiteName'),
                  contactEmail: formData.get('contactEmail'),
                  contactPhone: formData.get('contactPhone'),
                  facebook: formData.get('facebook'),
                  instagram: formData.get('instagram'),
                  twitter: formData.get('twitter'),
                  commissionRate: Number(formData.get('commissionRate')),
                  platformStatus: formData.get('platformStatus'),
                };
                updateSettings(settingsData);
              }} className="rounded-3xl border bg-white p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <h3 className="font-semibold text-lg mb-4">General Settings</h3>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Website Name</label>
                    <input name="websiteName" defaultValue={settings?.websiteName || 'Safar Curated'} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Contact Email</label>
                    <input name="contactEmail" type="email" defaultValue={settings?.contactEmail || 'hello@safarcurated.com'} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Contact Phone</label>
                    <input name="contactPhone" defaultValue={settings?.contactPhone || '+91-XXXXXXXXXX'} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Platform Status</label>
                    <select name="platformStatus" defaultValue={settings?.platformStatus || 'online'} className="w-full mt-1 px-3 py-2 border rounded-lg">
                      <option value="online">Online</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="col-span-2 border-t pt-4">
                    <h3 className="font-semibold text-lg mb-4">Social Media</h3>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Facebook URL</label>
                    <input name="facebook" defaultValue={settings?.facebook || ''} placeholder="https://facebook.com/safar" className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Instagram URL</label>
                    <input name="instagram" defaultValue={settings?.instagram || ''} placeholder="https://instagram.com/safar" className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Twitter URL</label>
                    <input name="twitter" defaultValue={settings?.twitter || ''} placeholder="https://twitter.com/safar" className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Commission Rate (%)</label>
                    <input name="commissionRate" type="number" step="0.1" defaultValue={settings?.commissionRate || 15} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="col-span-2 border-t pt-4">
                    <h3 className="font-semibold text-lg mb-4">Feature Toggles</h3>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">🤝 Safar Together</div>
                        <div className="text-sm text-muted-foreground">Allow travelers to connect and travel together</div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleSafarTogether}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${safarTogetherEnabled ? 'bg-emerald2' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${safarTogetherEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button type="submit" className="rounded-full bg-emerald2 hover:bg-emerald2-deep">Save Settings</Button>
                  <Button type="button" variant="outline" className="rounded-full">Cancel</Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* Announcements Tab - MODULE 11 */}
          <TabsContent value="announcements" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Announcements</h2>
                <p className="text-sm text-muted-foreground mt-1">Broadcast messages to users</p>
              </div>
              <Button onClick={()=>setAnnouncementModal({mode:'create'})} className="rounded-full bg-emerald2 hover:bg-emerald2-deep">Create Announcement</Button>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && announcements.length === 0 && (
              <div className="p-10 rounded-3xl border bg-white text-center">
                <Users className="size-7 mx-auto text-muted-foreground" />
                <div className="font-display text-lg font-bold mt-3">No announcements</div>
                <p className="text-sm text-muted-foreground mt-1">Create your first announcement.</p>
                <Button onClick={()=>setAnnouncementModal({mode:'create'})} className="rounded-full bg-emerald2 hover:bg-emerald2-deep mt-4">Create Announcement</Button>
              </div>
            )}
            {!loading && announcements.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-2">Title</div><div className="col-span-4">Message</div><div className="col-span-2">Target</div><div className="col-span-1">Priority</div><div className="col-span-1">Status</div><div className="col-span-2 text-right">Actions</div>
                    </div>
                    {announcements.map((ann)=>(
                      <div key={ann.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                        <div className="col-span-2 font-semibold text-sm line-clamp-1">{ann.title}</div>
                        <div className="col-span-4 text-xs text-muted-foreground line-clamp-2">{ann.message}</div>
                        <div className="col-span-2 text-xs capitalize">{ann.target}</div>
                        <div className="col-span-1"><StatusPill s={ann.priority || 'normal'} /></div>
                        <div className="col-span-1"><StatusPill s={ann.active ? 'active' : 'inactive'} /></div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <Button onClick={()=>deleteAnnouncement(ann.id)} size="sm" variant="ghost" className="rounded-full h-8 text-rose-600"><Trash2 className="size-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Activity Log Tab - MODULE 13 */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <div>
              <h2 className="font-display text-2xl font-bold">Admin Activity Log</h2>
              <p className="text-sm text-muted-foreground mt-1">Audit trail of all admin actions</p>
            </div>
            {loading && <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-emerald2" /></div>}
            {!loading && activityLogs.length === 0 && (
              <div className="p-10 rounded-3xl border bg-white text-center">
                <BarChart3 className="size-7 mx-auto text-muted-foreground" />
                <div className="font-display text-lg font-bold mt-3">No activity logs</div>
                <p className="text-sm text-muted-foreground mt-1">Admin actions will be logged here.</p>
              </div>
            )}
            {!loading && activityLogs.length > 0 && (
              <div className="rounded-3xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[1100px]">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                      <div className="col-span-2">Timestamp</div><div className="col-span-2">Admin</div><div className="col-span-1">Role</div><div className="col-span-2">Action</div><div className="col-span-4">Details</div><div className="col-span-1">IP</div>
                    </div>
                    {activityLogs.slice(0, 100).map((log)=>(
                      <div key={log.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition text-xs">
                        <div className="col-span-2">{new Date(log.timestamp).toLocaleString()}</div>
                        <div className="col-span-2 font-semibold">{log.adminName}</div>
                        <div className="col-span-1"><StatusPill s={log.adminRole} /></div>
                        <div className="col-span-2 capitalize">{log.action?.replace(/_/g, ' ')}</div>
                        <div className="col-span-4 text-muted-foreground line-clamp-1">{log.details}</div>
                        <div className="col-span-1 font-mono">{log.ipAddress || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Safar Together Admin Tab */}
          <TabsContent value="safar-together" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">🤝 Safar Together Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Moderate community travel plans and requests</p>
              </div>
            </div>

            {/* Statistics Cards */}
            {safarStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Plans', value: safarStats.totalPlans, icon: Users },
                  { label: 'Active Plans', value: safarStats.activePlans, icon: Check },
                  { label: 'Pending Requests', value: safarStats.pendingRequests, icon: Calendar },
                  { label: 'Accepted', value: safarStats.acceptedRequests, icon: Heart },
                  { label: 'Reports', value: safarStats.totalReports, icon: AlertTriangle },
                  { label: 'Blocked Users', value: safarStats.blockedUsers, icon: Ban },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }} className="rounded-2xl border bg-white p-4">
                      <Icon className="size-5 text-emerald2 mb-2" />
                      <div className="font-display text-2xl font-bold">{stat.value || 0}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <Tabs defaultValue="plans" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 max-w-4xl">
                <TabsTrigger value="plans">Plans</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="conversations">Chats</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="blocked">Blocked</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Travel Plans Sub-tab */}
              <TabsContent value="plans" className="space-y-4">
                <div className="rounded-3xl border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                      <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                        <div className="col-span-2">User</div>
                        <div className="col-span-2">Destination</div>
                        <div className="col-span-2">Travel Dates</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Created</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {safarPlans.map((plan) => (
                        <div key={plan.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition text-sm">
                          <div className="col-span-2">
                            <div className="font-semibold">{plan.userName}</div>
                            <div className="text-xs text-muted-foreground">{plan.userEmail}</div>
                          </div>
                          <div className="col-span-2">{plan.destination}</div>
                          <div className="col-span-2 text-xs">{plan.dateFrom} to {plan.dateTo}</div>
                          <div className="col-span-2"><StatusPill s={plan.status} /></div>
                          <div className="col-span-2 text-xs">{new Date(plan.createdAt).toLocaleDateString()}</div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <Button onClick={() => loadPlanDetails(plan.id)} size="sm" className="h-7 text-xs bg-emerald2">View</Button>
                            <Button onClick={async () => {
                              await fetch(`/api/admin/safar-together/plans/${plan.id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: plan.status === 'active' ? 'hidden' : 'active' }),
                              });
                              toast.success('Status updated');
                              load();
                            }} size="sm" variant="ghost" className="h-7 text-xs">{plan.status === 'active' ? 'Hide' : 'Show'}</Button>
                            <Button onClick={async () => {
                              if (!confirm('Delete this plan?')) return;
                              await fetch(`/api/admin/safar-together/plans/${plan.id}`, { method: 'DELETE' });
                              toast.success('Plan deleted');
                              load();
                            }} size="sm" variant="ghost" className="h-7 text-xs text-rose-600">Delete</Button>
                          </div>
                        </div>
                      ))}
                      {safarPlans.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No travel plans yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Requests Sub-tab */}
              <TabsContent value="requests" className="space-y-4">
                <div className="rounded-3xl border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[1000px]">
                      <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                        <div className="col-span-3">Sender</div>
                        <div className="col-span-3">Receiver</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {safarRequests.map((req) => (
                        <div key={req.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition text-sm">
                          <div className="col-span-3 font-semibold">{req.senderName}</div>
                          <div className="col-span-3 text-muted-foreground">User ID: {req.recipientId?.slice(0, 8)}</div>
                          <div className="col-span-2"><StatusPill s={req.status} /></div>
                          <div className="col-span-2 text-xs">{new Date(req.createdAt).toLocaleDateString()}</div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <Button onClick={async () => {
                              if (!confirm('Delete this request?')) return;
                              await fetch(`/api/admin/safar-together/requests/${req.id}`, { method: 'DELETE' });
                              toast.success('Request deleted');
                              load();
                            }} size="sm" variant="ghost" className="h-7 text-xs text-rose-600">Delete</Button>
                          </div>
                        </div>
                      ))}
                      {safarRequests.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No requests yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Conversations Sub-tab */}
              <TabsContent value="conversations" className="space-y-4">
                <div className="rounded-3xl border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[1000px]">
                      <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                        <div className="col-span-4">Participants</div>
                        <div className="col-span-3">Destination</div>
                        <div className="col-span-3">Created</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {safarConversations.map((convo) => (
                        <div key={convo.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition text-sm">
                          <div className="col-span-4 font-mono text-xs">{convo.participants?.[0]?.slice(0, 8)} ↔ {convo.participants?.[1]?.slice(0, 8)}</div>
                          <div className="col-span-3">{convo.planDestination || 'N/A'}</div>
                          <div className="col-span-3 text-xs">{new Date(convo.createdAt).toLocaleDateString()}</div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <Button onClick={() => window.open(`/safar-together/chats/${convo.id}`, '_blank')} size="sm" variant="ghost" className="h-7 text-xs">View</Button>
                          </div>
                        </div>
                      ))}
                      {safarConversations.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No conversations yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Reports Sub-tab */}
              <TabsContent value="reports" className="space-y-4">
                <div className="space-y-4">
                  {safarReports.map((report) => (
                    <div key={report.id} className="rounded-2xl border bg-white p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold">{report.reporterName} reported User ID: {report.reportedUserId?.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground mt-1">{new Date(report.createdAt).toLocaleString()}</div>
                        </div>
                        <StatusPill s={report.status} />
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">{report.reason}</div>
                      <div className="flex gap-2">
                        <Button onClick={async () => {
                          await fetch(`/api/admin/safar-together/reports/${report.id}/resolve`, { method: 'PATCH' });
                          toast.success('Report resolved');
                          load();
                        }} size="sm" className="bg-emerald2">Mark Resolved</Button>
                        <Button onClick={async () => {
                          await fetch(`/api/admin/safar-together/users/${report.reportedUserId}/suspend`, { method: 'POST' });
                          toast.success('User suspended');
                          load();
                        }} size="sm" variant="outline">Suspend User</Button>
                      </div>
                    </div>
                  ))}
                  {safarReports.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground rounded-2xl border bg-white">No reports yet</div>
                  )}
                </div>
              </TabsContent>

              {/* Blocked Users Sub-tab */}
              <TabsContent value="blocked" className="space-y-4">
                <div className="rounded-3xl border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                        <div className="col-span-4">User</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-3">Blocked Date</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {safarBlockedUsers.map((user) => (
                        <div key={user.id} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition text-sm">
                          <div className="col-span-4 font-semibold">{user.name}</div>
                          <div className="col-span-3 text-muted-foreground">{user.email}</div>
                          <div className="col-span-3 text-xs">{user.safarTogetherBlockedAt ? new Date(user.safarTogetherBlockedAt).toLocaleDateString() : '—'}</div>
                          <div className="col-span-2 flex justify-end">
                            <Button onClick={async () => {
                              await fetch(`/api/admin/safar-together/users/${user.id}/unblock`, { method: 'POST' });
                              toast.success('User unblocked');
                              load();
                            }} size="sm" className="h-7 bg-emerald2">Unblock</Button>
                          </div>
                        </div>
                      ))}
                      {safarBlockedUsers.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No blocked users</div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Settings Sub-tab */}
              <TabsContent value="settings" className="space-y-4">
                <div className="rounded-2xl border bg-white p-6">
                  <h3 className="font-semibold text-lg mb-4">Feature Control</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">Enable Safar Together</div>
                      <div className="text-sm text-muted-foreground">When disabled, the feature will be hidden from all users</div>
                    </div>
                    <button
                      onClick={toggleSafarTogether}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${safarTogetherEnabled ? 'bg-emerald2' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${safarTogetherEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6 mt-6">
            <h2 className="font-display text-2xl font-bold">Revenue Dashboard</h2>
            
            {/* Revenue Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { l:'Total Revenue', v: revenue ? `₹${(revenue.totalRevenue/10000000).toFixed(2)} Cr` : '...', i: Wallet },
                { l:"Today's Revenue", v: revenue ? `₹${(revenue.todayRevenue/100000).toFixed(2)}L` : '...', i: TrendingUp },
                { l:'Monthly Revenue', v: revenue ? `₹${(revenue.monthlyRevenue/100000).toFixed(2)}L` : '...', i: Calendar },
                { l:'Pending Payments', v: revenue ? `₹${(revenue.pendingPayments/100000).toFixed(2)}L` : '...', i: AlertTriangle },
                { l:'Platform Commission', v: revenue ? `₹${(revenue.platformCommission/100000).toFixed(2)}L` : '...', i: BarChart3 },
              ].map((k,i)=>{const Ico=k.i;return(
                <motion.div key={k.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }} className="rounded-3xl border bg-white p-5">
                  <Ico className="size-5 text-emerald2 mb-3" />
                  <div className="font-display text-xl font-bold">{k.v}</div>
                  <div className="text-xs text-muted-foreground mt-1">{k.l}</div>
                </motion.div>
              );})}
            </div>

            {/* Transactions Table */}
            <div>
              <h3 className="font-display text-xl font-bold mb-4">Recent Transactions</h3>
              {transactions.length === 0 && <div className="p-6 rounded-3xl border bg-white text-center text-sm text-muted-foreground">No transactions yet.</div>}
              {transactions.length > 0 && (
                <div className="rounded-3xl border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                      <div className="grid grid-cols-12 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                        <div className="col-span-3">Booking</div><div className="col-span-2">Guest</div><div className="col-span-2">Host</div><div className="col-span-1">Status</div><div className="col-span-1 text-right">Total</div><div className="col-span-2 text-right">Commission</div><div className="col-span-1 text-right">Host Pay</div>
                      </div>
                      {transactions.map((t) => (
                        <div key={t.bookingId} className="grid grid-cols-12 px-5 py-3 border-b last:border-0 items-center hover:bg-secondary/40 transition">
                          <div className="col-span-3 text-sm font-semibold truncate">{t.listingTitle}</div>
                          <div className="col-span-2 text-xs truncate">{t.travelerName}</div>
                          <div className="col-span-2 text-xs truncate">{t.hostName}</div>
                          <div className="col-span-1"><StatusPill s={t.status} /></div>
                          <div className="col-span-1 text-right text-sm font-semibold">₹{(t.totalPrice||0).toLocaleString('en-IN')}</div>
                          <div className="col-span-2 text-right text-sm text-emerald2 font-semibold">₹{(t.commission||0).toLocaleString('en-IN')}</div>
                          <div className="col-span-1 text-right text-sm font-semibold">₹{(t.hostPayout||0).toLocaleString('en-IN')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Modal */}
      {userModal && (
        <Dialog open={!!userModal} onOpenChange={()=>setUserModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-emerald grid place-items-center text-white text-2xl font-bold">{(userModal.name||'?').charAt(0)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{userModal.name}</div>
                  <div className="text-sm text-muted-foreground">{userModal.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Role:</span> <StatusPill s={userModal.role} /></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusPill s={userModal.status || 'active'} /></div>
                <div><span className="text-muted-foreground">Listings:</span> <span className="font-semibold">{userModal.listingCount || 0}</span></div>
                <div><span className="text-muted-foreground">Bookings:</span> <span className="font-semibold">{userModal.bookingCount || 0}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Joined:</span> <span className="font-semibold">{new Date(userModal.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={()=>setUserModal(null)} variant="outline">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Role Change Modal */}
      {roleModal && (
        <Dialog open={!!roleModal} onOpenChange={()=>setRoleModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm">Change role for <span className="font-semibold">{roleModal.name}</span></div>
              <div className="flex gap-2">
                {['traveler', 'host', 'admin'].map((r) => (
                  <Button key={r} onClick={()=>changeRole(roleModal.id, r)} variant={roleModal.role === r ? 'default' : 'outline'} className="flex-1 capitalize">{r}</Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={()=>setRoleModal(null)} variant="outline">Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Promo Code Modal */}
      {promoModal && (
        <Dialog open={!!promoModal} onOpenChange={()=>setPromoModal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{promoModal.mode === 'create' ? 'Create Promo Code' : 'Edit Promo Code'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const promo = {
                code: formData.get('code'),
                description: formData.get('description'),
                discountType: formData.get('discountType'),
                discountValue: Number(formData.get('discountValue')),
                startDate: formData.get('startDate'),
                expiryDate: formData.get('expiryDate'),
                usageLimit: Number(formData.get('usageLimit')) || null,
                minAmount: Number(formData.get('minAmount')) || 0,
                active: formData.get('active') === 'on',
              };
              promoModal.mode === 'create' ? createPromo(promo) : updatePromo(promoModal.promo.id, promo);
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Promo Code</label>
                  <input name="code" defaultValue={promoModal.promo?.code} required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="SUMMER2025" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Discount Type</label>
                  <select name="discountType" defaultValue={promoModal.promo?.discountType || 'percentage'} className="w-full mt-1 px-3 py-2 border rounded-lg">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold">Description</label>
                  <input name="description" defaultValue={promoModal.promo?.description} required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Summer discount for all bookings" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Discount Value</label>
                  <input name="discountValue" type="number" defaultValue={promoModal.promo?.discountValue} required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="10" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Min Booking Amount</label>
                  <input name="minAmount" type="number" defaultValue={promoModal.promo?.minAmount} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Start Date</label>
                  <input name="startDate" type="date" defaultValue={promoModal.promo?.startDate?.split('T')[0]} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Expiry Date</label>
                  <input name="expiryDate" type="date" defaultValue={promoModal.promo?.expiryDate?.split('T')[0]} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Usage Limit</label>
                  <input name="usageLimit" type="number" defaultValue={promoModal.promo?.usageLimit} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-6">
                    <input name="active" type="checkbox" defaultChecked={promoModal.promo?.active !== false} />
                    <span className="text-sm font-semibold">Active</span>
                  </label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" onClick={()=>setPromoModal(null)} variant="outline">Cancel</Button>
                <Button type="submit" className="bg-emerald2 hover:bg-emerald2-deep">{promoModal.mode === 'create' ? 'Create' : 'Update'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Ticket Detail Modal */}
      {ticketModal && (
        <Dialog open={!!ticketModal} onOpenChange={()=>setTicketModal(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Ticket #{ticketModal.ticketNumber || ticketModal.id.slice(0,8)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span> <span className="font-semibold">{ticketModal.customerName}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-semibold">{ticketModal.customerEmail}</span></div>
                <div><span className="text-muted-foreground">Category:</span> <StatusPill s={ticketModal.category} /></div>
                <div><span className="text-muted-foreground">Priority:</span> <StatusPill s={ticketModal.priority || 'medium'} /></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusPill s={ticketModal.status} /></div>
                <div><span className="text-muted-foreground">Created:</span> <span className="font-semibold">{new Date(ticketModal.createdAt).toLocaleString()}</span></div>
              </div>
              <div className="border-t pt-4">
                <div className="text-sm font-semibold mb-2">Conversation</div>
                <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-secondary/20 rounded-lg">
                  <div className="p-3 bg-white rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">{ticketModal.customerName} • {new Date(ticketModal.createdAt).toLocaleString()}</div>
                    <div className="text-sm">{ticketModal.message}</div>
                  </div>
                  {ticketModal.conversation?.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-lg ${msg.from === 'admin' ? 'bg-emerald-50 ml-8' : 'bg-white mr-8'}`}>
                      <div className="text-xs text-muted-foreground mb-1">{msg.from === 'admin' ? 'Admin' : ticketModal.customerName} • {new Date(msg.timestamp).toLocaleString()}</div>
                      <div className="text-sm">{msg.message}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const msg = e.target.message.value;
                  if (msg.trim()) {
                    replyToTicket(ticketModal.id, msg);
                    setTicketModal(null);
                  }
                }} className="mt-3">
                  <textarea name="message" placeholder="Type your reply..." className="w-full p-3 border rounded-lg resize-none" rows="3" />
                  <div className="flex gap-2 mt-2">
                    <Button type="submit" className="bg-emerald2 hover:bg-emerald2-deep">Send Reply</Button>
                    <select onChange={(e) => updateTicket(ticketModal.id, {status: e.target.value})} value={ticketModal.status} className="px-3 py-2 border rounded-lg text-sm">
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="waiting">Waiting for Customer</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </form>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={()=>setTicketModal(null)} variant="outline">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Admin Creation Modal */}
      {adminModal && (
        <Dialog open={!!adminModal} onOpenChange={()=>setAdminModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Admin Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const adminData = {
                name: formData.get('name'),
                email: formData.get('email'),
                role: formData.get('role'),
                password: formData.get('password'),
              };
              createAdmin(adminData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Name</label>
                  <input name="name" required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Admin Name" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <input name="email" type="email" required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="admin@safarcurated.com" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Password</label>
                  <input name="password" type="password" required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Minimum 8 characters" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Role</label>
                  <select name="role" className="w-full mt-1 px-3 py-2 border rounded-lg">
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="support_agent">Support Agent</option>
                  </select>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" onClick={()=>setAdminModal(null)} variant="outline">Cancel</Button>
                <Button type="submit" className="bg-emerald2 hover:bg-emerald2-deep">Create Admin</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Safar Together Plan Details Modal */}
      {safarPlanDetails && (
        <Dialog open={!!safarPlanDetails} onOpenChange={() => setSafarPlanDetails(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Travel Plan Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Plan Information */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-semibold text-lg mb-4">Plan Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Plan ID:</span> <span className="font-mono text-xs">{safarPlanDetails.plan.id?.slice(0, 12)}...</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <StatusPill s={safarPlanDetails.plan.status} /></div>
                  <div><span className="text-muted-foreground">Created:</span> {new Date(safarPlanDetails.plan.createdAt).toLocaleDateString()}</div>
                  <div><span className="text-muted-foreground">Destination:</span> <span className="font-semibold">{safarPlanDetails.plan.destination}</span></div>
                  <div><span className="text-muted-foreground">Start:</span> {safarPlanDetails.plan.dateFrom}</div>
                  <div><span className="text-muted-foreground">End:</span> {safarPlanDetails.plan.dateTo}</div>
                  <div><span className="text-muted-foreground">Duration:</span> {safarPlanDetails.plan.duration}</div>
                  <div><span className="text-muted-foreground">Travelers Joined:</span> {safarPlanDetails.joinedTravelers?.length || 0}</div>
                </div>
              </div>

              {/* Plan Creator */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-semibold text-lg mb-4">Plan Creator</h3>
                {safarPlanDetails.creator && (
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="size-16 rounded-full bg-gradient-emerald grid place-items-center text-white font-bold text-2xl">{safarPlanDetails.creator.name?.[0]}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{safarPlanDetails.creator.name}</div>
                        <div className="text-sm text-muted-foreground">{safarPlanDetails.creator.email}</div>
                        <div className="text-sm text-muted-foreground">{safarPlanDetails.creator.mobile || 'No phone'}</div>
                        <div className="flex gap-2 mt-2">
                          <StatusPill s={safarPlanDetails.creator.role} />
                          <StatusPill s={safarPlanDetails.creator.status || 'active'} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div><span className="text-muted-foreground">Age:</span> {safarPlanDetails.plan.age}</div>
                      <div><span className="text-muted-foreground">Gender:</span> {safarPlanDetails.plan.gender}</div>
                      <div><span className="text-muted-foreground">Languages:</span> {safarPlanDetails.plan.languages}</div>
                      <div><span className="text-muted-foreground">Interests:</span> {safarPlanDetails.plan.interests}</div>
                    </div>
                    <div className="text-sm mb-4"><span className="text-muted-foreground">Introduction:</span> {safarPlanDetails.plan.introduction}</div>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={async () => {
                        await fetch(`/api/admin/safar-together/users/${safarPlanDetails.creator.id}/suspend`, { method: 'POST' });
                        toast.success('Creator suspended');
                        setSafarPlanDetails(null);
                        load();
                      }} size="sm" variant="outline">Suspend Creator</Button>
                      <Button onClick={()=>suspendUser(safarPlanDetails.creator.id)} size="sm" variant="outline" className="text-rose-600">Ban Creator</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Travelers Who Joined */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-semibold text-lg mb-4">Travelers Who Joined ({safarPlanDetails.joinedTravelers?.length || 0})</h3>
                {safarPlanDetails.joinedTravelers?.length > 0 ? (
                  <div className="space-y-3">
                    {safarPlanDetails.joinedTravelers.map((traveler) => (
                      <div key={traveler.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gradient-emerald grid place-items-center text-white font-semibold">{traveler.name?.[0]}</div>
                          <div>
                            <div className="font-semibold">{traveler.name}</div>
                            <div className="text-xs text-muted-foreground">{traveler.email} · Joined {traveler.joinedDate ? new Date(traveler.joinedDate).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button onClick={async () => {
                            await fetch(`/api/admin/safar-together/users/${traveler.id}/suspend`, { method: 'POST' });
                            toast.success('User suspended');
                            loadPlanDetails(safarPlanDetails.plan.id);
                          }} size="sm" variant="outline" className="h-8 text-xs">Suspend</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No travelers joined yet</div>
                )}
              </div>

              {/* Pending Requests */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-semibold text-lg mb-4">Pending Requests ({safarPlanDetails.requests?.filter(r => r.status === 'pending').length || 0})</h3>
                {safarPlanDetails.requests?.filter(r => r.status === 'pending').length > 0 ? (
                  <div className="space-y-2">
                    {safarPlanDetails.requests.filter(r => r.status === 'pending').map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <div>
                          <div className="font-semibold">{req.senderName}</div>
                          <div className="text-xs text-muted-foreground">Requested {new Date(req.createdAt).toLocaleDateString()}</div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs">Delete</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">No pending requests</div>
                )}
              </div>

              {/* Reports */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-semibold text-lg mb-4">Reports ({safarPlanDetails.reports?.length || 0})</h3>
                {safarPlanDetails.reports?.length > 0 ? (
                  <div className="space-y-3">
                    {safarPlanDetails.reports.map((report) => (
                      <div key={report.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold">{report.reporterName}</span> reported <span className="font-semibold">User #{report.reportedUserId?.slice(0, 8)}</span>
                          </div>
                          <StatusPill s={report.status} />
                        </div>
                        <div className="text-muted-foreground mb-2">{report.reason}</div>
                        <div className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">No reports</div>
                )}
              </div>

              {/* Admin Controls */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-semibold text-lg mb-4">Admin Controls</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={async () => {
                    await fetch(`/api/admin/safar-together/plans/${safarPlanDetails.plan.id}/status`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: safarPlanDetails.plan.status === 'active' ? 'hidden' : 'active' }),
                    });
                    toast.success('Plan status updated');
                    setSafarPlanDetails(null);
                    load();
                  }} size="sm" variant="outline">{safarPlanDetails.plan.status === 'active' ? 'Hide Plan' : 'Show Plan'}</Button>
                  <Button onClick={async () => {
                    if (!confirm('Delete this plan permanently?')) return;
                    await fetch(`/api/admin/safar-together/plans/${safarPlanDetails.plan.id}`, { method: 'DELETE' });
                    toast.success('Plan deleted');
                    setSafarPlanDetails(null);
                    load();
                  }} size="sm" variant="outline" className="text-rose-600">Delete Plan</Button>
                  <Button onClick={() => setSafarPlanDetails(null)} size="sm">Close</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Host Creation/Edit Modal */}
      {hostModal && (
        <Dialog open={!!hostModal} onOpenChange={()=>setHostModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{hostModal.mode === 'create' ? 'Create Host Account' : 'Edit Host'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const hostData = {
                name: formData.get('name'),
                email: formData.get('email'),
                mobile: formData.get('mobile'),
                password: formData.get('password'),
                businessName: formData.get('businessName'),
                status: formData.get('status'),
                verified: formData.get('verified') === 'on',
              };
              createHost(hostData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Full Name *</label>
                  <input name="name" required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Host Name" defaultValue={hostModal.name || ''} />
                </div>
                <div>
                  <label className="text-sm font-semibold">Email *</label>
                  <input name="email" type="email" required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="host@example.com" defaultValue={hostModal.email || ''} />
                </div>
                <div>
                  <label className="text-sm font-semibold">Mobile Number *</label>
                  <input name="mobile" type="tel" required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="+91 XXXXX XXXXX" defaultValue={hostModal.mobile || ''} />
                </div>
                {hostModal.mode === 'create' && (
                  <div>
                    <label className="text-sm font-semibold">Password *</label>
                    <input name="password" type="password" required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Minimum 8 characters" />
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold">Business Name</label>
                  <input name="businessName" className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Optional" defaultValue={hostModal.businessName || ''} />
                </div>
                <div>
                  <label className="text-sm font-semibold">Account Status</label>
                  <select name="status" className="w-full mt-1 px-3 py-2 border rounded-lg" defaultValue={hostModal.status || 'active'}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="verified" id="verified" className="size-4" defaultChecked={hostModal.verified} />
                  <label htmlFor="verified" className="text-sm font-semibold">Verified Host</label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" onClick={()=>setHostModal(null)} variant="outline">Cancel</Button>
                <Button type="submit" className="bg-emerald2 hover:bg-emerald2-deep">{hostModal.mode === 'create' ? 'Create Host' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Announcement Modal */}
      {announcementModal && (
        <Dialog open={!!announcementModal} onOpenChange={()=>setAnnouncementModal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const announcementData = {
                title: formData.get('title'),
                message: formData.get('message'),
                target: formData.get('target'),
                priority: formData.get('priority'),
                active: formData.get('active') === 'on',
              };
              createAnnouncement(announcementData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Title</label>
                  <input name="title" required className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Announcement Title" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Message</label>
                  <textarea name="message" required className="w-full mt-1 px-3 py-2 border rounded-lg resize-none" rows="4" placeholder="Your announcement message..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">Target Audience</label>
                    <select name="target" className="w-full mt-1 px-3 py-2 border rounded-lg">
                      <option value="all_users">All Users</option>
                      <option value="all_travelers">All Travelers</option>
                      <option value="all_hosts">All Hosts</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Priority</label>
                    <select name="priority" className="w-full mt-1 px-3 py-2 border rounded-lg">
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input name="active" type="checkbox" defaultChecked />
                    <span className="text-sm font-semibold">Active</span>
                  </label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" onClick={()=>setAnnouncementModal(null)} variant="outline">Cancel</Button>
                <Button type="submit" className="bg-emerald2 hover:bg-emerald2-deep">Create Announcement</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </main>
  );
}

export default function App() {
  return <ProtectedRoute roles={['admin', 'super_admin']}><AdminInner /></ProtectedRoute>;
}
