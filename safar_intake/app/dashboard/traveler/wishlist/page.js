'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function WishlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [wishlist, setWishlist] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    Promise.all([
      fetch('/api/wishlist').then(r => r.json()),
      fetch('/api/listings').then(r => r.json()),
    ])
      .then(([wishlistData, listingsData]) => {
        if (wishlistData.ok && listingsData.ok) {
          setWishlist(wishlistData.wishlist || []);
          setListings(listingsData.listings || []);
        }
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  const savedListings = wishlist
    .map(w => listings.find(l => l.id === w.propertyId))
    .filter(Boolean);

  const handleRemove = async (propertyId) => {
    try {
      const res = await fetch(`/api/wishlist/${propertyId}`, { method: 'DELETE' });
      if (res.ok) {
        setWishlist(wishlist.filter(w => w.propertyId !== propertyId));
        toast.success('Removed from wishlist');
      }
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 min-h-[60vh] grid place-items-center">
          <Loader2 className="size-7 animate-spin text-emerald2" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 container">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="size-8 text-rose-500 fill-rose-500" />
          <h1 className="font-display text-4xl font-bold">My Wishlist</h1>
        </div>

        {savedListings.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="size-16 mx-auto text-gray-300 mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Start saving properties you love</p>
            <Link href="/explore" className="inline-block px-6 py-3 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold">
              Explore Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedListings.map((listing) => (
              <div key={listing.id} className="group relative rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition">
                <Link href={`/property/${listing.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={listing.images?.[0] || '/placeholder.jpg'} 
                      alt={listing.title}
                      className="size-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <button
                      onClick={(e) => { e.preventDefault(); handleRemove(listing.id); }}
                      className="absolute top-3 right-3 size-9 grid place-items-center rounded-full bg-white/90 hover:bg-white shadow-lg"
                    >
                      <Heart className="size-5 text-rose-500 fill-rose-500" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{listing.location}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-bold">₹{listing.price?.toLocaleString('en-IN')}</span>
                      <span className="text-sm text-muted-foreground">/ night</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
