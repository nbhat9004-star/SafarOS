'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Star, Phone, Globe, Mail, CheckCircle2, ShieldCheck, ArrowRight, Loader2,
} from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';

export default function PresentationPage() {
  const params = useParams();
  const token = params?.token;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/token/${token}`);
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) { setError(json.error || 'Invalid link.'); }
        else { setData(json); }
      } catch (e) {
        if (!cancelled) setError('Unable to load listing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading listing preview…
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

  const l = data?.listing || {};
  const images = Array.isArray(l.images) ? l.images.filter(Boolean) : [];
  const cover = images[0] || l.coverImage || null;
  const services = Array.isArray(l.services) ? l.services : [];
  const amenities = Array.isArray(l.amenities) ? l.amenities : [];

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />

      <main className="pt-20 lg:pt-24 pb-24">
        {/* Banner */}
        <section className="container max-w-6xl mx-auto px-4">
          <div className="rounded-3xl overflow-hidden border bg-white">
            {cover ? (
              <div className="relative aspect-[16/8] w-full bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt={l.title || 'Listing'} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur border">Public Preview</span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white">Safar Curated</span>
                </div>
              </div>
            ) : (
              <div className="aspect-[16/8] grid place-items-center bg-secondary text-muted-foreground text-sm">No image</div>
            )}
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold">{l.title || 'Untitled Listing'}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    {l.city && (<span className="inline-flex items-center gap-1"><MapPin className="size-4" />{l.city}{l.location ? ` · ${l.location}` : ''}</span>)}
                    {l.category && (<span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium capitalize">{l.category}</span>)}
                    {l.rating && (<span className="inline-flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" />{l.rating} {l.reviews ? `(${l.reviews})` : ''}</span>)}
                  </div>
                </div>
                <div className="text-right">
                  {typeof l.price === 'number' && (
                    <div>
                      <div className="text-3xl font-bold">₹{l.price.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-muted-foreground">per {l.duration || 'night'}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Two-column body */}
        <section className="container max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {l.description && (
              <div className="rounded-3xl border bg-white p-6">
                <h2 className="font-semibold mb-2">About this listing</h2>
                <p className="text-sm leading-relaxed text-charcoal/80 whitespace-pre-line">{l.description}</p>
              </div>
            )}

            {images.length > 1 && (
              <div className="rounded-3xl border bg-white p-6">
                <h2 className="font-semibold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.slice(0, 12).map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt={`${l.title || 'Listing'} ${i + 1}`} className="w-full aspect-square object-cover rounded-2xl" />
                  ))}
                </div>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="rounded-3xl border bg-white p-6">
                <h2 className="font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {amenities.slice(0, 30).map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span>{typeof a === 'string' ? a : (a?.name || a?.label || 'Amenity')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div className="rounded-3xl border bg-white p-6">
                <h2 className="font-semibold mb-4">Included services</h2>
                <div className="flex flex-wrap gap-2">
                  {services.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border bg-white p-6">
              <h2 className="font-semibold mb-4">Location</h2>
              <div className="aspect-[16/8] rounded-2xl overflow-hidden bg-secondary">
                {(l.latitude && l.longitude) ? (
                  <iframe
                    title="Map"
                    src={`https://www.google.com/maps?q=${l.latitude},${l.longitude}&hl=en&z=14&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-muted-foreground">
                    <div className="text-center">
                      <MapPin className="size-6 mx-auto mb-2" />
                      <div>{l.location || l.city || 'Location not available'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="size-5 text-emerald-600" />
                <h3 className="font-semibold">Verified by Safar</h3>
              </div>
              <p className="text-sm text-muted-foreground">This preview is exactly what visitors will see when this listing is live.</p>
            </div>

            {(l.contact?.phone || l.phone || l.contact?.website || l.website || l.contact?.email || l.email) && (
              <div className="rounded-3xl border bg-white p-6">
                <h3 className="font-semibold mb-3">Contact</h3>
                <div className="space-y-2 text-sm">
                  {(l.contact?.phone || l.phone) && (
                    <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{l.contact?.phone || l.phone}</div>
                  )}
                  {(l.contact?.email || l.email) && (
                    <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{l.contact?.email || l.email}</div>
                  )}
                  {(l.contact?.website || l.website) && (
                    <a href={l.contact?.website || l.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-700 hover:underline">
                      <Globe className="size-4" />Visit website
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-3xl border bg-emerald-50 p-6">
              <h3 className="font-semibold">Own this business?</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Claim this listing to manage bookings and update details.</p>
              <Link href={`/review/${token}#claim`}>
                <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700">
                  Claim this Listing <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
}
