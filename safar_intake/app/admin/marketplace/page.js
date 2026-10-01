'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Database,
  Clock,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function MarketplaceInner() {
  const [loading, setLoading] = useState(true);
  const [apiUsage, setApiUsage] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [usageRes, logsRes] = await Promise.all([
        fetch('/api/marketplace/api-usage'),
        fetch('/api/marketplace/audit-logs?limit=10')
      ]);
      
      const usageData = await usageRes.json();
      const logsData = await logsRes.json();
      
      if (usageData.ok) setApiUsage(usageData);
      if (logsData.ok) setRecentLogs(logsData.logs || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Requests Today',
      value: apiUsage?.requestsToday || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Requests This Month',
      value: apiUsage?.requestsThisMonth || 0,
      icon: Calendar,
      color: 'text-emerald2',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Estimated Cost',
      value: `$${(apiUsage?.estimatedCost || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Last API Call',
      value: apiUsage?.lastApiCall 
        ? new Date(apiUsage.lastApiCall).toLocaleDateString()
        : 'Never',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">AI Marketplace Builder</h1>
              <p className="text-muted-foreground mt-1">
                Manage business discovery, imports, and marketplace operations
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/marketplace/dashboard">
                <Button className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  <TrendingUp className="size-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/marketplace/discover">
                <Button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                  <Search className="size-4 mr-2" />
                  Discover & Import
                </Button>
              </Link>
              <Link href="/admin/marketplace/crm">
                <Button variant="outline" className="rounded-full">
                  <Activity className="size-4 mr-2" />
                  Partnership CRM
                </Button>
              </Link>
              <Link href="/admin/marketplace/templates">
                <Button variant="outline" className="rounded-full">
                  <Activity className="size-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link href="/admin/marketplace/audit-logs">
                <Button variant="outline" className="rounded-full">
                  <Activity className="size-4 mr-2" />
                  Audit Logs
                </Button>
              </Link>
              <Link href="/admin/marketplace/settings">
                <Button className="rounded-full bg-emerald2 hover:bg-emerald2-deep">
                  <Settings className="size-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* API Usage Stats */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Database className="size-5 text-emerald2" />
            API Usage Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border bg-white p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        {stat.label}
                      </div>
                      <div className="font-display text-2xl font-bold mt-2">
                        {stat.value}
                      </div>
                    </div>
                    <div className={`size-12 rounded-full ${stat.bgColor} grid place-items-center`}>
                      <Icon className={`size-6 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Sync Status */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="size-5 text-emerald2" />
            Sync Status
          </h2>
          <div className="rounded-3xl border bg-white p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-blue-50 grid place-items-center shrink-0">
                  <Clock className="size-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Last API Call</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {apiUsage?.lastApiCall 
                      ? new Date(apiUsage.lastApiCall).toLocaleString()
                      : 'No API calls yet'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-emerald-50 grid place-items-center shrink-0">
                  <CheckCircle className="size-5 text-emerald2" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Last Successful Sync</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {apiUsage?.lastSuccessfulSync 
                      ? new Date(apiUsage.lastSuccessfulSync).toLocaleString()
                      : 'No successful syncs yet'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-rose-50 grid place-items-center shrink-0">
                  <XCircle className="size-5 text-rose-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Last Failed Sync</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {apiUsage?.lastFailedSync 
                      ? new Date(apiUsage.lastFailedSync).toLocaleString()
                      : 'No failed syncs'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Activity className="size-5 text-emerald2" />
              Recent Activity
            </h2>
            <Link href="/admin/marketplace/audit-logs">
              <Button variant="ghost" size="sm" className="rounded-full">
                View All
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl border bg-white overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading activity...
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="size-6 mx-auto mb-2" />
                No activity yet
              </div>
            ) : (
              <div className="divide-y">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-secondary/40 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{log.action}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          by {log.userName} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {log.details && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <ProtectedRoute requireRole="super_admin">
      <MarketplaceInner />
    </ProtectedRoute>
  );
}
