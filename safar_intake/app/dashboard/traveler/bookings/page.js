'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Loader2, X, Phone, ArrowLeft, Filter, Search
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { bookingsApi } from '@/lib/listings-api';

const StatusPill = ({ s }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald2 border-emerald-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    cancelled:'bg-secondary text-muted-foreground border-border',
  };
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${map[s]||'bg-secondary'}`}>{s}</span>;
};

function MyBookingsInner() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, pending, approved, cancelled
  const [searchTerm, setSearchTerm] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    const { ok, data } = await bookingsApi.list();
    if (ok && data?.ok) setBookings(data.bookings || []);
    setLoading(false);
  };

  useEffect(() => { loadBookings(); }, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    const { ok, data } = await bookingsApi.patch(id, 'cancelled');
    if (!ok) return toast.error(data?.error || 'Cancel failed');
    toast.success('Booking cancelled');
    loadBookings();
  };

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    // Status filter
    if (filter === 'upcoming') {
      const checkIn = new Date(b.checkInDate);
      const today = new Date();
      return (b.status === 'approved' || b.status === 'pending') && checkIn >= today;
    }
    if (filter !== 'all' && b.status !== filter) return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        b.listingTitle?.toLowerCase().includes(term) ||
        b.hostName?.toLowerCase().includes(term) ||
        b.bookingId?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => {
      const checkIn = new Date(b.checkInDate);
      const today = new Date();
      return (b.status === 'approved' || b.status === 'pending') && checkIn >= today;
    }).length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Button asChild variant="ghost" size="sm" className="rounded-full mb-3 -ml-2">
              <Link href="/dashboard/traveler"><ArrowLeft className="size-4 mr-2" /> Back to Dashboard</Link>
            </Button>
            <h1 className="font-display text-4xl md:text-5xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground mt-2">Track all your reservation requests and confirmed stays</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'All Bookings', value: stats.total, key: 'all' },
            { label: 'Upcoming', value: stats.upcoming, key: 'upcoming' },
            { label: 'Pending', value: stats.pending, key: 'pending' },
            { label: 'Approved', value: stats.approved, key: 'approved' },
            { label: 'Cancelled', value: stats.cancelled, key: 'cancelled' },
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilter(stat.key)}
              className={`rounded-2xl border bg-white p-4 text-left transition ${
                filter === stat.key ? 'border-emerald2 ring-2 ring-emerald2/20' : 'hover:border-emerald2/50'
              }`}
            >
              <div className="font-display text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by property name, host, or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-emerald2/20 focus:border-emerald2"
            />
          </div>
        </div>

        {/* Bookings List */}
        {loading && (
          <div className="py-20 grid place-items-center">
            <Loader2 className="size-8 animate-spin text-emerald2" />
            <p className="text-sm text-muted-foreground mt-3">Loading your bookings...</p>
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="p-12 border rounded-3xl bg-white text-center">
            <Calendar className="size-10 mx-auto text-emerald2" />
            <div className="font-display text-2xl font-bold mt-4">No bookings yet</div>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Start your Kashmir adventure! Browse our curated stays and send your first booking request.
            </p>
            <Button asChild className="rounded-full mt-6 bg-emerald2 hover:bg-emerald2-deep">
              <Link href="/explore">Explore Properties</Link>
            </Button>
          </div>
        )}

        {!loading && bookings.length > 0 && filteredBookings.length === 0 && (
          <div className="p-12 border rounded-3xl bg-white text-center">
            <Filter className="size-10 mx-auto text-muted-foreground" />
            <div className="font-display text-xl font-bold mt-4">No bookings found</div>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters or search term
            </p>
            <Button
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
              }}
              variant="outline"
              className="rounded-full mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((b, i) => (
              <motion.div
                key={b.bookingId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-3xl border bg-white overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition"
              >
                {b.listingImage && (
                  <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
                    <img 
                      src={b.listingImage} 
                      alt={b.listingTitle}
                      className="absolute inset-0 size-full object-cover hover:scale-105 transition duration-500" 
                    />
                  </div>
                )}
                <div className="p-6 flex-1">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <StatusPill s={b.status} />
                      {b.status === 'approved' && new Date(b.checkInDate) > new Date() && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      #{b.bookingId.slice(0, 12)}
                    </div>
                  </div>

                  {/* Property Details */}
                  <h3 className="font-display text-xl font-bold">{b.listingTitle}</h3>
                  {b.inventoryTypeName && (
                    <p className="text-sm text-emerald2 font-medium mt-0.5">{b.inventoryTypeName}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Host: <span className="font-medium text-foreground">{b.hostName}</span>
                  </p>

                  {/* Booking Details */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Check-in:</span>{' '}
                      <span className="font-semibold">
                        {new Date(b.checkInDate).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-out:</span>{' '}
                      <span className="font-semibold">
                        {new Date(b.checkOutDate).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nights:</span>{' '}
                      <span className="font-semibold">{b.nights}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Guests:</span>{' '}
                      <span className="font-semibold">{b.guests}</span>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Total Amount</div>
                        <div className="font-display text-2xl font-bold text-emerald2">
                          ₹{(b.totalPrice || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline"
                          className="rounded-full"
                        >
                          <Link href={`/dashboard/traveler/bookings/${b.bookingId}`}>View Details</Link>
                        </Button>
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline"
                          className="rounded-full"
                        >
                          <Link href={`/property/${b.listingId}`}>View Property</Link>
                        </Button>
                        {b.hostPhone && (
                          <Button 
                            asChild 
                            size="sm" 
                            variant="outline" 
                            className="rounded-full"
                          >
                            <a href={`tel:${b.hostPhone}`}>
                              <Phone className="size-3.5 mr-1" /> Call Host
                            </a>
                          </Button>
                        )}
                        {(b.status === 'pending' || b.status === 'approved') && (
                          <Button
                            onClick={() => cancel(b.bookingId)}
                            size="sm"
                            variant="outline"
                            className="rounded-full text-rose-600 hover:bg-rose-50"
                          >
                            <X className="size-4 mr-1" /> Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredBookings.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredBookings.length} of {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <ProtectedRoute roles={['traveler', 'host', 'admin']}>
      <MyBookingsInner />
    </ProtectedRoute>
  );
}
