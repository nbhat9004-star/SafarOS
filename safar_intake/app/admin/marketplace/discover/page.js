'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  MapPin, 
  Phone, 
  Globe, 
  Star,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function DiscoverInner() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState(new Set());
  const [currentJob, setCurrentJob] = useState(null);
  const [jobPolling, setJobPolling] = useState(null);

  useEffect(() => {
    return () => {
      if (jobPolling) clearInterval(jobPolling);
    };
  }, [jobPolling]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedBusinesses(new Set());

    try {
      const res = await fetch('/api/marketplace/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          city: city || null
        })
      });

      const data = await res.json();

      if (data.ok) {
        setResults(data.results || []);
        if (data.results.length === 0) {
          toast.info('No businesses found for your search');
        } else {
          toast.success(`Found ${data.results.length} businesses`);
        }
      } else {
        toast.error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (placeId) => {
    const newSelection = new Set(selectedBusinesses);
    if (newSelection.has(placeId)) {
      newSelection.delete(placeId);
    } else {
      newSelection.add(placeId);
    }
    setSelectedBusinesses(newSelection);
  };

  const toggleSelectAll = () => {
    const importableBusinesses = results.filter(r => !r.isDuplicate);
    if (selectedBusinesses.size === importableBusinesses.length) {
      setSelectedBusinesses(new Set());
    } else {
      setSelectedBusinesses(new Set(importableBusinesses.map(r => r.placeId)));
    }
  };

  const handleImport = async () => {
    if (selectedBusinesses.size === 0) {
      toast.error('Please select at least one business to import');
      return;
    }

    const businessesToImport = results.filter(r => selectedBusinesses.has(r.placeId));

    setImporting(true);

    try {
      const res = await fetch('/api/marketplace/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businesses: businessesToImport })
      });

      const data = await res.json();

      if (data.ok) {
        toast.success('Import started! Tracking progress...');
        setCurrentJob({ id: data.jobId, status: 'pending' });
        startJobPolling(data.jobId);
      } else {
        toast.error(data.error || 'Import failed');
        setImporting(false);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed');
      setImporting(false);
    }
  };

  const startJobPolling = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/marketplace/jobs/${jobId}`);
        const data = await res.json();

        if (data.ok && data.job) {
          setCurrentJob(data.job);

          if (data.job.status === 'completed') {
            clearInterval(interval);
            setJobPolling(null);
            setImporting(false);
            toast.success(`Import completed! Imported: ${data.job.imported}, Skipped: ${data.job.skipped}, Failed: ${data.job.failed}`);
            
            // Clear results and selection
            setResults([]);
            setSelectedBusinesses(new Set());
          } else if (data.job.status === 'cancelled') {
            clearInterval(interval);
            setJobPolling(null);
            setImporting(false);
            toast.info('Import cancelled');
          }
        }
      } catch (error) {
        console.error('Job polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    setJobPolling(interval);
  };

  const handleCancelJob = async () => {
    if (!currentJob) return;

    try {
      const res = await fetch(`/api/marketplace/jobs/${currentJob.id}/cancel`, {
        method: 'POST'
      });

      const data = await res.json();

      if (data.ok) {
        toast.info('Cancelling import...');
      } else {
        toast.error(data.error || 'Cancel failed');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Cancel failed');
    }
  };

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
          <h1 className="font-display text-3xl font-bold">Business Discovery & Import</h1>
          <p className="text-muted-foreground mt-1">
            Search and import businesses from Google Places
          </p>
        </div>

        {/* Search Form */}
        <section className="rounded-3xl border bg-white p-6 mb-6">
          <h2 className="font-display text-xl font-bold mb-4">Search Businesses</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="query">Search Query or Category</Label>
              <Input
                id="query"
                placeholder="e.g. hotels, restaurants, tourist attractions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="city">City (Optional)</Label>
              <Input
                id="city"
                placeholder="e.g. Srinagar, Gulmarg..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="rounded-full bg-emerald2 hover:bg-emerald2-deep"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="size-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Import Progress */}
        {currentJob && importing && (
          <section className="rounded-3xl border bg-white p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">Import Progress</h2>
              <Button
                onClick={handleCancelJob}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <X className="size-4 mr-2" />
                Cancel Import
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress: {currentJob.progress}%</span>
                  <span>{currentJob.processed}/{currentJob.total} processed</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald2 transition-all duration-300"
                    style={{ width: `${currentJob.progress}%` }}
                  />
                </div>
              </div>

              {currentJob.currentItem && (
                <div className="text-sm text-muted-foreground">
                  Processing: <span className="font-semibold">{currentJob.currentItem}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 rounded-xl bg-emerald-50">
                  <div className="font-bold text-emerald2">{currentJob.imported}</div>
                  <div className="text-xs text-emerald-700">Imported</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50">
                  <div className="font-bold text-amber-700">{currentJob.skipped}</div>
                  <div className="text-xs text-amber-600">Skipped</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-rose-50">
                  <div className="font-bold text-rose-600">{currentJob.failed}</div>
                  <div className="text-xs text-rose-500">Failed</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {results.length > 0 && !importing && (
          <section className="rounded-3xl border bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">
                Search Results ({results.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  {selectedBusinesses.size === results.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedBusinesses.size === 0}
                  className="rounded-full bg-emerald2 hover:bg-emerald2-deep"
                >
                  <Download className="size-4 mr-2" />
                  Import Selected ({selectedBusinesses.size})
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {results.map((business) => {
                const isSelected = selectedBusinesses.has(business.placeId);
                const isDuplicate = business.isDuplicate;
                
                return (
                  <div
                    key={business.placeId}
                    className={`p-4 rounded-xl border-2 transition ${
                      isDuplicate
                        ? 'border-amber-300 bg-amber-50/50 opacity-75'
                        : isSelected
                        ? 'border-emerald2 bg-emerald-50/50 cursor-pointer'
                        : 'border-transparent bg-secondary/40 hover:border-secondary cursor-pointer'
                    }`}
                    onClick={() => !isDuplicate && toggleSelection(business.placeId)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        {isDuplicate ? (
                          <div className="size-6 rounded-full border-2 border-amber-500 bg-amber-100 flex items-center justify-center">
                            <CheckCircle2 className="size-4 text-amber-600" />
                          </div>
                        ) : (
                          <div className={`size-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald2 bg-emerald2'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && (
                              <CheckCircle2 className="size-4 text-white" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-lg">{business.name}</h3>
                          {isDuplicate && (
                            <span className="shrink-0 px-3 py-1 rounded-full bg-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
                              Already Imported
                            </span>
                          )}
                        </div>
                      
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {business.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="size-4 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{business.rating}</span>
                              <span>({business.reviewCount} reviews)</span>
                            </div>
                          )}
                          <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium capitalize">
                            {business.category.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{business.address}</span>
                          </div>
                          
                          {business.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="size-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{business.phone}</span>
                            </div>
                          )}
                          
                          {business.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="size-4 text-muted-foreground" />
                              <a
                                href={business.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald2 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {business.website}
                              </a>
                            </div>
                          )}
                        </div>

                        {business.photos && business.photos.length > 0 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {business.photos.slice(0, 3).map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo.url}
                                alt={business.name}
                                className="size-20 rounded-lg object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && !importing && (
          <div className="rounded-3xl border bg-white p-12 text-center">
            <Search className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold">No Results Yet</h3>
            <p className="text-muted-foreground mt-2">
              Enter a search query above to discover businesses
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <ProtectedRoute requireRole="super_admin">
      <DiscoverInner />
    </ProtectedRoute>
  );
}
