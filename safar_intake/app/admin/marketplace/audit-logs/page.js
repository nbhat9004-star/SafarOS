'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Loader2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function AuditLogsInner() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 50;

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await fetch(`/api/marketplace/audit-logs?limit=${limit}&skip=${skip}`);
      const data = await res.json();
      
      if (data.ok) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } else {
        toast.error(data.error || 'Failed to load audit logs');
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(query) ||
      log.userName?.toLowerCase().includes(query) ||
      JSON.stringify(log.details).toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/marketplace">
            <Button variant="ghost" className="rounded-full mb-4">
              <ArrowLeft className="size-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-2">
                <Activity className="size-8 text-emerald2" />
                Audit Logs
              </h1>
              <p className="text-muted-foreground mt-1">
                Track all marketplace activities and changes
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {total} total events
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              placeholder="Search by action, user, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-3xl border bg-white overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="size-8 animate-spin text-emerald2 mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search query' : 'Activity will appear here once marketplace operations begin'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/40 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-secondary/20 transition">
                        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {log.userRole?.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-md">
                          <div className="truncate">
                            {log.details ? JSON.stringify(log.details) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-secondary/20">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} • {total} total events
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-full"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-full"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <ProtectedRoute requireRole="super_admin">
      <AuditLogsInner />
    </ProtectedRoute>
  );
}
