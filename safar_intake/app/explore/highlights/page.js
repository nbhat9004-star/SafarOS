'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import { HIGHLIGHTS, BADGES } from '@/lib/explore-v2-data';
import { fetchHighlights, likeHighlight } from '@/lib/explore-api';

export default function Highlights() {
  const [liked, setLiked] = useState({});
  const [tab, setTab] = useState('latest');
  const [items, setItems] = useState(HIGHLIGHTS);

  useEffect(() => {
    let alive = true;
    fetchHighlights(tab)
      .then(list => {
        if (!alive) return;
        if (list.length > 0) {
          setItems(list.map(h => ({
            id: h.id, img: h.image, user: h.userName || 'Traveler',
            avatar: h.userAvatar || `https://i.pravatar.cc/60?u=${h.userId}`,
            trip: h.location || 'Community trip', likes: h.likes || 0,
            badge: h.likes >= 400 ? 'gold' : h.likes >= 200 ? 'silver' : 'bronze',
          })));
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [tab]);

  const toggle = (id) => {
    setLiked(p => ({ ...p, [id]: !p[id] }));
    likeHighlight(id).catch(() => {});
  };

  return (
    <Shell>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-3 flex items-center gap-3">
          <Link href="/explore" className="size-10 grid place-items-center rounded-full hover:bg-slate-100 active:scale-95"><ArrowLeft className="size-5" /></Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-[17px] md:text-[22px] tracking-tight">Highlights</h1>
            <p className="text-[11.5px] text-slate-500">Community trip photos</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {items.map((h, i) => {
            const isLiked = liked[h.id];
            const count = h.likes + (isLiked ? 1 : 0);
            const badge = BADGES[h.badge];
            return (
              <article key={h.id} id={h.id} className="rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2.5">
                    <Image src={h.avatar} alt={h.user} width={36} height={36} className="rounded-full object-cover" unoptimized />
                    <div>
                      <div className="font-semibold text-[13.5px] text-slate-900">{h.user}</div>
                      <div className="text-[11.5px] text-slate-500">{h.trip}</div>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-br ${badge.color} text-white px-2 py-1 text-[10.5px] font-bold shadow`}>
                    <span>{badge.emoji}</span> {badge.label.split(' ')[0]}
                  </div>
                </div>
                <div className="relative aspect-square bg-slate-100">
                  <Image src={h.img} alt={h.trip} fill className="object-cover" unoptimized />
                </div>
                <div className="p-3 flex items-center gap-3">
                  <button onClick={() => toggle(h.id)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${isLiked ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    <Heart className={`size-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} strokeWidth={2.2} />
                    <span className="tabular-nums">{count}</span>
                  </button>
                  <span className="text-[11.5px] text-slate-400">Tap to \u2764 like</span>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </Shell>
  );
}
