'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import PropertyCard from '@/components/safar/PropertyCard';
import AIAssistantFloating from '@/components/safar/AIAssistantFloating';
import { Button } from '@/components/ui/button';
import { LISTINGS } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { useWishlist } from '@/lib/safar-storage';
import { Heart } from 'lucide-react';

function App() {
  const { user } = useAuth();
  const { ids } = useWishlist(user?.id);

  // Resolve listing objects by id from local catalog (and accept stray ids gracefully).
  const list = useMemo(() => {
    const byId = Object.fromEntries(LISTINGS.map((l) => [l.id, l]));
    return ids.map((id) => byId[id]).filter(Boolean);
  }, [ids]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-rose-50 grid place-items-center">
            <Heart className="size-6 text-rose-500 fill-rose-500" />
          </div>
          <div>
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Wishlist</div>
            <h1 className="font-display text-3xl md:text-5xl font-bold">Saved for later</h1>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">
          {list.length} stays and experiences you’ve loved.
        </p>

        {list.length === 0 ? (
          <div className="mt-10 p-10 border rounded-3xl bg-white text-center max-w-xl">
            <Heart className="size-7 mx-auto text-rose-500" />
            <div className="font-display text-lg font-bold mt-3">Your wishlist is empty</div>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the heart on any stay, houseboat, homestay or experience to save it here.
            </p>
            <Button asChild className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep">
              <Link href="/explore">Browse listings</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((l, i) => (
              <PropertyCard key={l.id} item={l} index={i} />
            ))}
          </div>
        )}
        <div className="h-12" />
      </div>
      <Footer />
      <AIAssistantFloating />
    </main>
  );
}
export default App;
