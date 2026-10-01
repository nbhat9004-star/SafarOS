'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Building2,
  CheckCircle,
  Download,
  Users,
  FileCheck,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Search,
  Activity,
  Settings,
  Mail,
  Database,
  AlertCircle,
  Clock,
  Shield,
  User,
  MapPin,
  BarChart3,
  PieChart,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function DashboardInner() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [overviewRes, analyticsRes, activityRes, statusRes] = await Promise.all([
        fetch('/api/marketplace/dashboard/overview'),
        fetch('/api/marketplace/dashboard/analytics'),
        fetch('/api/marketplace/dashboard/activity?limit=10'),
        fetch('/api/marketplace/dashboard/system-status')
      ]);
      
      const [overviewData, analyticsData, activityData, statusData] = await Promise.all([
        overviewRes.json(),
        analyticsRes.json(),
        activityRes.json(),
        statusRes.json()
      ]);
      
      if (overviewData.ok) setStats(overviewData.stats);
      if (analyticsData.ok) setAnalytics(analyticsData);
      if (activityData.ok) setActivities(activityData.activities || []);
      if (statusData.ok) setSystemStatus(statusData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Listings', 
      value: stats?.totalListings || 0, 
      icon: Building2, 
      color: 'bg-blue-50 text-blue-600',
      change: '+12%',
      trend: 'up'
    },
    { 
      label: 'Published', 
      value: stats?.publishedListings || 0, 
      icon: CheckCircle, 
      color: 'bg-emerald-50 text-emerald-600',
      change: '+8%',
      trend: 'up'
    },
    { 
      label: 'Imported', 
      value: stats?.importedBusinesses || 0, 
      icon: Download, 
      color: 'bg-purple-50 text-purple-600',
      change: '+15%',
      trend: 'up'
    },
    { 
      label: 'Claimed', 
      value: stats?.claimedBusinesses || 0, 
      icon: FileCheck, 
      color: 'bg-cyan-50 text-cyan-600',
      change: '+5%',
      trend: 'up'
    },
    { 
      label: 'Pending Approvals', 
      value: stats?.pendingApprovals || 0, 
      icon: Clock, 
      color: 'bg-amber-50 text-amber-600',
      change: '-2%',
      trend: 'down'
    },
    { 
      label: 'Active Hosts', 
      value: stats?.activeHosts || 0, 
      icon: Users, 
      color: 'bg-pink-50 text-pink-600',
      change: '+10%',
      trend: 'up'
    },
    { 
      label: 'Total Bookings', 
      value: stats?.totalBookings || 0, 
      icon: Calendar, 
      color: 'bg-indigo-50 text-indigo-600',
      change: '+18%',
      trend: 'up'
    },
    { 
      label: 'Revenue', 
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, 
      icon: DollarSign, 
      color: 'bg-green-50 text-green-600',
      change: '+25%',
      trend: 'up'
    },
    { 
      label: 'Total Users', 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: 'bg-violet-50 text-violet-600',
      change: '+14%',
      trend: 'up'
    },
    { 
      label: 'Draft Listings', 
      value: stats?.draftListings || 0, 
      icon: FileCheck, 
      color: 'bg-gray-50 text-gray-600',
      change: '+3%',
      trend: 'up'
    }
  ];

  const quickActions = [
    { label: 'Import Businesses', href: '/admin/marketplace/discover', icon: Download, color: 'bg-purple-600' },
    { label: 'Partnership CRM', href: '/admin/marketplace/crm', icon: Users, color: 'bg-blue-600' },
    { label: 'Templates', href: '/admin/marketplace/templates', icon: Mail, color: 'bg-cyan-600' },
    { label: 'Settings', href: '/admin/marketplace/settings', icon: Settings, color: 'bg-emerald2' }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'import': return Download;
      case 'booking': return Calendar;
      case 'user': return User;
      case 'admin': return Shield;
      case 'audit': return Activity;
      default: return Activity;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'error': return 'text-rose-600 bg-rose-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'idle': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20 pt-20 lg:pt-24">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">Marketplace Operations Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Complete overview of your Safar Curated platform
              </p>
            </div>
            <Button onClick={loadDashboard} variant="outline" className="rounded-full">
              <Activity className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald2"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl border bg-white p-6 hover:shadow-sm transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`size-10 rounded-full ${stat.color} grid place-items-center shrink-0`}>
                          <Icon className="size-5" />
                        </div>
                        {stat.change && (
                          <div className={`flex items-center gap-1 text-xs font-semibold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            <TrendIcon className="size-3" />
                            {stat.change}
                          </div>
                        )}
                      </div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        {stat.label}
                      </div>
                      <div className="font-display text-2xl font-bold mt-2">
                        {stat.value}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="mb-8">
              <h2 className="font-display text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.href}>
                      <div className="rounded-3xl border bg-white p-6 hover:shadow-md transition cursor-pointer group">
                        <div className={`size-12 rounded-full ${action.color} text-white grid place-items-center mb-4 group-hover:scale-110 transition`}>
                          <Icon className="size-6" />
                        </div>
                        <h3 className="font-semibold">{action.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Quick access</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Analytics */}
              <div className="lg:col-span-2 space-y-6">
                {/* Top Categories */}
                <div className="rounded-3xl border bg-white p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <PieChart className="size-5 text-emerald2" />
                    <h2 className="font-display text-xl font-bold">Top Categories</h2>
                  </div>
                  
                  {analytics?.topCategories && analytics.topCategories.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.topCategories.map((cat, idx) => {
                        const total = analytics.topCategories.reduce((sum, c) => sum + c.count, 0);
                        const percentage = ((cat.count / total) * 100).toFixed(1);
                        return (
                          <div key={idx}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium capitalize">{cat._id || 'Uncategorized'}</span>
                              <span className="text-sm text-muted-foreground">{cat.count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="bg-emerald2 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No category data available</p>
                  )}
                </div>

                {/* Top Cities */}
                <div className="rounded-3xl border bg-white p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin className="size-5 text-emerald2" />
                    <h2 className="font-display text-xl font-bold">Top Cities</h2>
                  </div>
                  
                  {analytics?.topCities && analytics.topCities.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {analytics.topCities.map((city, idx) => (
                        <div key={idx} className="p-4 rounded-xl border">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="size-4 text-muted-foreground" />
                            <span className="font-semibold">{city._id}</span>
                          </div>
                          <div className="text-2xl font-display font-bold">{city.count}</div>
                          <div className="text-xs text-muted-foreground">listings</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No city data available</p>
                  )}
                </div>

                {/* Recently Imported */}
                <div className="rounded-3xl border bg-white p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Download className="size-5 text-emerald2" />
                    <h2 className="font-display text-xl font-bold">Recently Imported Businesses</h2>
                  </div>
                  
                  {analytics?.recentlyImported && analytics.recentlyImported.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.recentlyImported.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl border hover:shadow-sm transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{item.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{item.city || 'Unknown city'}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                              item.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent imports</p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* System Status */}
                <div className="rounded-3xl border bg-white p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Database className="size-5 text-emerald2" />
                    <h2 className="font-display text-xl font-bold">System Status</h2>
                  </div>
                  
                  {systemStatus && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(systemStatus.database.status)}`}>
                          {systemStatus.database.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Import Engine</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(systemStatus.importEngine.status)}`}>
                          {systemStatus.importEngine.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Email Templates</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(systemStatus.emailTemplates.status)}`}>
                          {systemStatus.emailTemplates.count} active
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">API Health</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(systemStatus.apiHealth.status)}`}>
                          {systemStatus.apiHealth.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="rounded-3xl border bg-white p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Activity className="size-5 text-emerald2" />
                      <h2 className="font-display text-xl font-bold">Recent Activity</h2>
                    </div>
                  </div>
                  
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.slice(0, 8).map((activity) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <div key={activity.id} className="flex gap-3">
                            <div className="shrink-0 size-8 rounded-full bg-secondary grid place-items-center">
                              <Icon className="size-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{activity.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function MarketplaceDashboard() {
  return (
    <ProtectedRoute requireRole="super_admin">
      <DashboardInner />
    </ProtectedRoute>
  );
}
