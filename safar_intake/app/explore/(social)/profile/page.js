'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Bookmark, Camera, Settings, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { TripCard } from '../home/page';

const TABS = [
  { key: 'trips',    label: 'My Trips',        icon: User },
  { key: 'saved',    label: 'Saved Trips',     icon: Bookmark },
  { key: 'memories', label: 'Travel Memories', icon: Camera },
  { key: 'settings', label: 'Settings',        icon: Settings },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('trips');
  const [myTrips, setMyTrips] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const [mine, saved] = await Promise.all([
          fetch('/api/circle/journeys/mine?includeArchived=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
          fetch('/api/circle/bookmarks/mine?type=journey', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
        ]);
        if (mine?.ok) setMyTrips(mine.journeys || []);
        if (saved?.ok) {
          // Bookmarks store targetId; fetch minimal trips info
          const targetIds = (saved.bookmarks || []).map((b) => b.targetId).filter(Boolean);
          if (targetIds.length) {
            // Reuse discover endpoint filtered client-side (avoids new backend route)
            const all = await fetch('/api/circle/journeys?limit=120', { cache: 'no-store' }).then((r) => r.json());
            if (all?.ok) setSavedTrips((all.journeys || []).filter((j) => targetIds.includes(j.id)));
          } else setSavedTrips([]);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user]);

  // Memories: photos from completed trips the user was part of.
  const memories = myTrips.filter((t) => t.endDate && new Date(t.endDate) < new Date()).flatMap((t) =>
    [...(t.photos || []), t.cover].filter(Boolean).map((img) => ({ tripId: t.id, tripName: t.name, img }))
  );

  if (!user) return (
    <div className="container py-16 text-center">
      <User className="size-12 mx-auto text-emerald2" />
      <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">Sign in to see your profile</h1>
      <Link href="/?auth=1" className="mt-4 inline-flex items-center gap-2 px-6 h-11 rounded-full bg-emerald2 text-white font-semibold">Sign in</Link>
    </div>
  );

  return (
    <div className="container py-8 md:py-10 max-w-5xl">
      {/* Identity */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-emerald-950 grid place-items-center text-2xl font-bold shadow">{(user.name || 'S').charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-amber-300">Traveller</div>
            <div className="font-display text-2xl md:text-3xl font-bold truncate">{user.name || 'Traveller'}</div>
            <div className="text-white/70 text-sm truncate">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 border-b overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition ${tab === key ? 'border-emerald2 text-emerald2' : 'border-transparent text-muted-foreground hover:text-charcoal'}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? <div className="py-16 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div> : (
          <>
            {tab === 'trips' && (
              myTrips.length === 0 ? (
                <EmptyTab label="You haven\u2019t created a trip yet." cta="Publish a Trip" href="/explore/journey" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myTrips.map((t) => <TripCard key={t.id} trip={t} />)}
                </div>
              )
            )}
            {tab === 'saved' && (
              savedTrips.length === 0 ? (
                <EmptyTab label="No saved trips yet." cta="Discover Trips" href="/explore/home" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {savedTrips.map((t) => <TripCard key={t.id} trip={t} />)}
                </div>
              )
            )}
            {tab === 'memories' && (
              memories.length === 0 ? (
                <EmptyTab label="Your travel memories will appear here after your first completed trip." cta="Discover Trips" href="/explore/home" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {memories.map((m, i) => (
                    <Link key={i} href={`/explore/j/${m.tripId}`} className="relative aspect-square rounded-xl overflow-hidden bg-secondary group">
                      <Image src={m.img} alt={m.tripName} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                        <div className="text-white text-[10px] font-semibold truncate">{m.tripName}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
            {tab === 'settings' && (
              <div className="bg-white rounded-2xl border p-6 max-w-lg">
                <div className="text-sm text-charcoal/80">Manage your account, notifications and privacy in the main Safar account settings.</div>
                <Link href="/account" className="mt-4 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-emerald2 text-white font-semibold">Open Account Settings</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyTab({ label, cta, href }) {
  return (
    <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-10 text-center">
      <div className="text-charcoal font-semibold">{label}</div>
      <Link href={href} className="mt-4 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-emerald2 text-white font-semibold"><Plus className="size-4" /> {cta}</Link>
    </div>
  );
}
