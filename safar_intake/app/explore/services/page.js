'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Search, Star, BadgeCheck, Plus, Check, ShieldCheck } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';

const CATEGORIES = [
  { id: 'stay', label: 'Accommodation', emoji: '\u{1F3E8}' },
  { id: 'transport', label: 'Transport', emoji: '\u{1F68C}' },
  { id: 'guide', label: 'Tour Guides', emoji: '\u{1F9ED}' },
  { id: 'gear', label: 'Camping Gear', emoji: '\u26FA' },
  { id: 'bike', label: 'Bike Rental', emoji: '\u{1F3CD}\uFE0F' },
  { id: 'car', label: 'Car Rental', emoji: '\u{1F697}' },
  { id: 'photo', label: 'Photography', emoji: '\u{1F4F8}' },
  { id: 'meals', label: 'Meals', emoji: '\u{1F35C}' },
  { id: 'activities', label: 'Activities', emoji: '\u{1F3AF}' },
];

const SERVICES = {
  stay: [
    { id: 's1', name: 'Aru Valley Homestay', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', price: 2200, rating: 4.8, reviews: 214, city: 'Pahalgam' },
    { id: 's2', name: 'Sonamarg Alpine Cottage', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80', price: 3600, rating: 4.9, reviews: 328, city: 'Sonamarg' },
    { id: 's3', name: 'Gulmarg Chalet Rooms', img: 'https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=800&q=80', price: 4400, rating: 4.7, reviews: 176, city: 'Gulmarg' },
    { id: 's4', name: 'Dal Lake Deluxe Houseboat', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80', price: 2800, rating: 4.6, reviews: 412, city: 'Srinagar' },
  ],
  transport: [
    { id: 't1', name: 'Kashmir Traveller Tempo (12 seats)', img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80', price: 1800, rating: 4.7, reviews: 118, city: 'Srinagar' },
    { id: 't2', name: 'Innova Crysta \u2013 Full Day', img: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80', price: 2600, rating: 4.6, reviews: 78, city: 'Srinagar' },
  ],
  guide: [
    { id: 'g1', name: 'Amaan \u2013 Certified Trek Guide', img: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=800&q=80', price: 1800, rating: 4.9, reviews: 132, city: 'Sonamarg' },
    { id: 'g2', name: 'Danish \u2013 Photography Guide', img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80', price: 2200, rating: 4.8, reviews: 87, city: 'Gulmarg' },
  ],
  gear: [
    { id: 'c1', name: '3-Season Tent (2 person)', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', price: 500, rating: 4.6, reviews: 33, city: 'Srinagar' },
    { id: 'c2', name: 'Sleeping Bag \u2013 Sub-Zero', img: 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=800&q=80', price: 300, rating: 4.7, reviews: 46, city: 'Srinagar' },
  ],
  bike: [
    { id: 'b1', name: 'Royal Enfield Himalayan', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80', price: 1400, rating: 4.9, reviews: 92, city: 'Srinagar' },
  ],
  car: [
    { id: 'ca1', name: 'Mahindra Thar 4x4', img: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80', price: 3200, rating: 4.7, reviews: 41, city: 'Srinagar' },
  ],
  photo: [
    { id: 'p1', name: 'Full-day Trip Photographer', img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80', price: 3500, rating: 4.9, reviews: 27, city: 'Srinagar' },
  ],
  meals: [
    { id: 'm1', name: 'Traditional Wazwan Dinner', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', price: 700, rating: 4.6, reviews: 156, city: 'Srinagar' },
  ],
  activities: [
    { id: 'a1', name: 'Gulmarg Gondola Phase 2', img: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800&q=80', price: 1900, rating: 4.7, reviews: 39, city: 'Gulmarg' },
  ],
};

export default function Services() {
  const [cat, setCat] = useState('stay');
  const [added, setAdded] = useState([]);
  const [q, setQ] = useState('');

  const toggle = (id) => setAdded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const list = (SERVICES[cat] || []).filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/explore/create" className="size-10 grid place-items-center rounded-full hover:bg-slate-100 active:scale-95"><ArrowLeft className="size-5" /></Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-[17px] md:text-[22px] tracking-tight">Verified Services</h1>
              <p className="text-[11.5px] text-emerald-700 font-semibold inline-flex items-center gap-1"><ShieldCheck className="size-3" /> Verified by Safar</p>
            </div>
            {added.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold"><Check className="size-3" /> {added.length} added</span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-100/70 border border-slate-100 px-3 h-11">
            <Search className="size-4 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search verified providers" className="flex-1 bg-transparent outline-none text-[14px]" />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${cat === c.id ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-violet-300'}`}>
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(s => {
            const isAdded = added.includes(s.id);
            return (
              <div key={s.id} className="group rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition">
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <Image src={s.img} alt={s.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="400px" unoptimized />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-bold shadow"><BadgeCheck className="size-3" /> Verified</span>
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur text-slate-700 px-2 py-0.5 text-[11px] font-semibold shadow"><Star className="size-3 fill-amber-400 text-amber-400" /> {s.rating}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-[14.5px] tracking-tight text-slate-900 line-clamp-1">{s.name}</h3>
                  <div className="mt-1 text-[11.5px] text-slate-500">{s.city} {'\u00B7'} {s.reviews} reviews</div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="font-display font-bold text-[15.5px] text-slate-900">{'\u20B9'}{s.price.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-500"> / unit</span>
                    </div>
                    <button onClick={() => toggle(s.id)} className={`rounded-xl px-3 py-2 text-[12.5px] font-semibold transition active:scale-95 ${isAdded ? 'bg-emerald-600 text-white' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
                      {isAdded ? <span className="inline-flex items-center gap-1"><Check className="size-3.5" /> Added</span> : <span className="inline-flex items-center gap-1"><Plus className="size-3.5" /> Add</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {list.length === 0 && (
          <div className="py-14 text-center rounded-3xl bg-white border border-slate-100">
            <div className="font-display font-bold text-slate-900">No services yet</div>
            <p className="text-[13px] text-slate-500 mt-1">Try a different category.</p>
          </div>
        )}

        {added.length > 0 && (
          <div className="fixed bottom-24 md:bottom-8 inset-x-0 z-30 px-4 md:px-8">
            <div className="max-w-md mx-auto rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-500/40 px-4 py-3 flex items-center gap-3">
              <ShieldCheck className="size-5" />
              <div className="flex-1 text-[13px] font-semibold">{added.length} verified service{added.length > 1 ? 's' : ''} added</div>
              <button className="rounded-lg bg-white text-emerald-700 px-3 py-1.5 text-[12.5px] font-bold">Continue</button>
            </div>
          </div>
        )}
      </main>
    </Shell>
  );
}
