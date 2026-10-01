'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  FileText, 
  CheckCircle, 
  XCircle,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  Users,
  ArrowLeft,
  Star,
  MapPin,
  Globe,
  Clock,
  LayoutGrid,
  List,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function CRMInner() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'pipeline'
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [filters, setFilters] = useState({
    pipelineStage: '',
    category: '',
    city: ''
  });

  useEffect(() => {
    loadDashboard();
    loadBusinesses();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/marketplace/crm/dashboard');
      const data = await res.json();
      if (data.ok) setStats(data.stats);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        search, 
        limit: '100',
        ...filters 
      });
      const res = await fetch(`/api/marketplace/crm/businesses?${params}`);
      const data = await res.json();
      if (data.ok) setBusinesses(data.businesses || []);
    } catch (error) {
      console.error('Failed to load businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadBusinesses();
  };

  const statCards = [
    { label: 'Total Businesses', value: stats?.total || 0, icon: Building2, color: 'bg-blue-50 text-blue-600' },
    { label: 'Draft Listings', value: stats?.draft || 0, icon: FileText, color: 'bg-amber-50 text-amber-600' },
    { label: 'Claimed', value: stats?.claimed || 0, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Active Partners', value: stats?.activePartners || 0, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Contacted', value: stats?.contacted || 0, icon: Phone, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Upcoming Follow-ups', value: stats?.upcomingFollowups || 0, icon: Calendar, color: 'bg-rose-50 text-rose-600' },
  ];

  const getWhatsAppLink = (phone) => {
    if (!phone) return '#';
    const cleaned = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const pipelineStages = [
    { id: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
    { id: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
    { id: 'interested', label: 'Interested', color: 'bg-cyan-100 text-cyan-700' },
    { id: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-purple-100 text-purple-700' },
    { id: 'negotiating', label: 'Negotiating', color: 'bg-amber-100 text-amber-700' },
    { id: 'live_partner', label: 'Live Partner', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700' },
  ];


  const groupByPipelineStage = () => {
    const grouped = {};
    pipelineStages.forEach(stage => {
      grouped[stage.id] = businesses.filter(b => 
        (b.crmData?.pipelineStage || 'pending') === stage.id
      );
    });
    return grouped;
  };

  const getPipelineColor = (stageId) => {
    const stage = pipelineStages.find(s => s.id === stageId);
    return stage ? stage.color : 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-secondary/20 pt-20 lg:pt-24">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/marketplace">
            <Button variant="ghost" className="rounded-full mb-4">
              <ArrowLeft className="size-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">Partnership CRM</h1>
              <p className="text-muted-foreground mt-1">
                Manage outreach, partnerships, and business relationships
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="rounded-full"
              >
                <List className="size-4 mr-2" />
                List View
              </Button>
              <Button
                variant={viewMode === 'pipeline' ? 'default' : 'outline'}
                onClick={() => setViewMode('pipeline')}
                className="rounded-full"
              >
                <LayoutGrid className="size-4 mr-2" />
                Pipeline View
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-3xl border bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full ${stat.color} grid place-items-center shrink-0`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold truncate">
                      {stat.label}
                    </div>
                    <div className="font-display text-xl font-bold">
                      {stat.value}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="rounded-3xl border bg-white p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                placeholder="Search businesses by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-12 rounded-full"
              />
            </div>
            <Button onClick={handleSearch} className="rounded-full h-12 px-8 bg-emerald2 hover:bg-emerald2-deep">
              <Search className="size-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Pipeline Stage</label>
              <Select
                value={filters.pipelineStage}
                onValueChange={(value) => {
                  setFilters({...filters, pipelineStage: value});
                  setTimeout(() => loadBusinesses(), 100);
                }}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Stages</SelectItem>
                  {pipelineStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) => {
                  setFilters({...filters, category: value});
                  setTimeout(() => loadBusinesses(), 100);
                }}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="stay">Stay</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="tour">Tour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">City</label>
              <Input
                placeholder="Filter by city..."
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
                className="rounded-full"
              />
            </div>
          </div>
        </div>


        {/* Pipeline View */}
        {viewMode === 'pipeline' && (
          <div className="mb-8">
            {loading ? (
              <div className="rounded-3xl border bg-white p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald2"></div>
                <p className="text-sm text-muted-foreground mt-4">Loading pipeline...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pipelineStages.slice(0, 6).map((stage) => {
                  const stageBusinesses = groupByPipelineStage()[stage.id] || [];
                  return (
                    <div key={stage.id} className="rounded-3xl border bg-white overflow-hidden">
                      <div className={`p-4 ${stage.color}`}>
                        <h3 className="font-bold">{stage.label}</h3>
                        <p className="text-xs mt-1 opacity-75">{stageBusinesses.length} businesses</p>
                      </div>
                      <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                        {stageBusinesses.length === 0 ? (
                          <p className="text-xs text-center text-muted-foreground py-8">No businesses</p>
                        ) : (
                          stageBusinesses.map(business => (
                            <Link 
                              key={business.id}
                              href={`/admin/marketplace/crm/business/${business.id}`}
                            >
                              <div className="p-3 rounded-xl border hover:shadow-sm transition cursor-pointer bg-white">
                                <h4 className="font-semibold text-sm truncate">{business.title}</h4>
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {business.city || business.location}
                                </p>
                                {business.rating && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Star className="size-3 fill-amber-400 text-amber-400" />
                                    <span className="text-xs font-medium">{business.rating}</span>
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="rounded-3xl border bg-white overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Businesses ({businesses.length})</h2>
              <Link href="/admin/marketplace/discover">
                <Button size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                  <Building2 className="size-4 mr-2" />
                  Import More
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald2"></div>
                <p className="text-sm text-muted-foreground mt-4">Loading businesses...</p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-semibold">No businesses found</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Import businesses from Google Places to get started
                </p>
                <Link href="/admin/marketplace/discover">
                  <Button className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                    <Building2 className="size-4 mr-2" />
                    Import Businesses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {businesses.map((business) => {
                  const stage = getPipelineColor(business.crmData?.pipelineStage || 'pending');
                  return (
                    <div key={business.id} className="p-6 hover:bg-secondary/20 transition">
                      <div className="flex items-start gap-4">
                        {/* Business Image */}
                        {business.images && business.images[0] && (
                          <div className="shrink-0">
                            <img 
                              src={business.images[0]} 
                              alt={business.title}
                              className="size-20 rounded-xl object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Business Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg truncate">{business.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${stage}`}>
                                  {business.crmData?.pipelineStage || 'pending'}
                                </span>
                                {business.status === 'draft' && (
                                  <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase shrink-0">
                                    DRAFT
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
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
                                  <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium capitalize">
                                    {business.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 mt-4 flex-wrap">
                            {business.contact?.phone && (
                              <a href={`tel:${business.contact.phone}`}>
                                <Button size="sm" variant="outline" className="rounded-full">
                                  <Phone className="size-4 mr-2" />
                                  Call
                                </Button>
                              </a>
                            )}
                            {business.contact?.phone && (
                              <a href={getWhatsAppLink(business.contact.phone)} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="rounded-full">
                                  <MessageCircle className="size-4 mr-2" />
                                  WhatsApp
                                </Button>
                              </a>
                            )}
                            {business.contact?.website && (
                              <a href={business.contact.website} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="rounded-full">
                                  <Globe className="size-4 mr-2" />
                                  Website
                                </Button>
                              </a>
                            )}
                            <Link href={`/admin/marketplace/crm/business/${business.id}`}>
                              <Button size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                                View Profile
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function CRMPage() {
  return (
    <ProtectedRoute requireRole="super_admin">
      <CRMInner />
    </ProtectedRoute>
  );
}
