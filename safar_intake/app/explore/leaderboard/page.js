'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, MapPin, Home, Crown, TrendingUp } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import { BADGES } from '@/lib/explore-v2-data';
import { fetchLeaderboard } from '@/lib/explore-api';

const FALLBACK_LB = [
  { id: 'u1', name: 'Amaan Wani', avatar: 'https://i.pravatar.cc/240?img=12', badge: 'legendary', trips: 24, likes: 5820, hosted: 18, city: 'Srinagar' },
  { id: 'u2', name: 'Zoya Rehman', avatar: 'https://i.pravatar.cc/240?img=25', badge: 'platinum', trips: 21, likes: 4310, hosted: 12, city: 'Anantnag' },
  { id: 'u3', name: 'Faisal Bhat', avatar: 'https://i.pravatar.cc/240?img=33', badge: 'platinum', trips: 19, likes: 3980, hosted: 10, city: 'Sonamarg' },
  { id: 'u4', name: 'Danish Lone', avatar: 'https://i.pravatar.cc/240?img=42', badge: 'gold', trips: 15, likes: 2740, hosted: 7, city: 'Kupwara' },
  { id: 'u5', name: 'Sana Yousuf', avatar: 'https://i.pravatar.cc/240?img=44', badge: 'gold', trips: 14, likes: 2510, hosted: 6, city: 'Pahalgam' },
  { id: 'u6', name: 'Rohit Kapoor', avatar: 'https://i.pravatar.cc/240?img=54', badge: 'silver', trips: 11, likes: 1820, hosted: 4, city: 'Ganderbal' },
  { id: 'u7', name: 'Kabir Khan', avatar: 'https://i.pravatar.cc/240?img=53', badge: 'silver', trips: 10, likes: 1640, hosted: 3, city: 'Baramulla' },
  { id: 'u8', name: 'Uzair Khan', avatar: 'https://i.pravatar.cc/240?img=57', badge: 'bronze', trips: 7, likes: 980, hosted: 2, city: 'Budgam' },
  { id: 'u9', name: 'Sara Malik', avatar: 'https://i.pravatar.cc/240?img=45', badge: 'bronze', trips: 5, likes: 620, hosted: 1, city: 'Bandipora' },
];

const PODIUM_ORDER = [1, 0, 2];

export default function Leaderboard() {
  const [range, setRange] = useState('month');
  const [users, setUsers] = useState(FALLBACK_LB);

  useEffect(() => {
    let alive = true;
    fetchLeaderboard()
      .then(list => { if (alive && list.length > 0) setUsers(list.map(u => ({ ...u, avatar: u.avatar || `https://i.pravatar.cc/240?u=${u.id}`, city: u.city || 'India' }))); })
      .catch(() => {});
    return () => { alive = false; };
  }, [range]);

  const LEADERBOARD = users;

  return (
    <Shell>
      <div className="relative bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 text-white pt-[max(0.75rem,env(safe-area-inset-top))] pb-8">
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -bottom-8 -left-16 size-64 rounded-full bg-violet-500/25 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/explore" className="size-10 grid place-items-center rounded-full bg-white/15 backdrop-blur-xl border border-white/20 active:scale-95"><ArrowLeft className="size-5" /></Link>
            <h1 className="flex-1 font-display font-bold text-[18px] md:text-[22px] tracking-tight">Leaderboard</h1>
          </div>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold"><TrendingUp className="size-3" /> Community Ranking</div>
            <h2 className="mt-3 font-display font-bold text-[26px] md:text-[34px] tracking-tight leading-tight">Top Explorers</h2>
            <p className="mt-1 text-white/70 text-[12.5px] md:text-[14px]">Ranked by trips, likes, and hosted journeys</p>
            <div className="mt-4 inline-flex rounded-full bg-white/10 border border-white/20 p-1">
              {['week','month','all'].map(r => (
                <button key={r} onClick={() => setRange(r)} className={`px-3.5 py-1 rounded-full text-[11.5px] font-semibold capitalize transition ${range === r ? 'bg-white text-slate-900' : 'text-white/80 hover:text-white'}`}>{r === 'all' ? 'All time' : `This ${r}`}</button>
              ))}
            </div>
          </div>

          {/* Podium */}
          <div className="mt-8 grid grid-cols-3 gap-2 md:gap-4 items-end max-w-lg mx-auto">
            {PODIUM_ORDER.map((idx, pos) => {
              const u = LEADERBOARD[idx];
              const b = BADGES[u.badge];
              const rank = idx + 1;
              const heights = ['h-24 md:h-28', 'h-32 md:h-40', 'h-20 md:h-24'];
              return (
                <div key={u.id} className="text-center">
                  <div className="relative inline-block">
                    {rank === 1 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 size-6 text-yellow-400 fill-yellow-400" />}
                    <div className={`relative size-16 md:size-20 rounded-full overflow-hidden border-2 mx-auto ${rank === 1 ? 'border-yellow-400' : rank === 2 ? 'border-slate-300' : 'border-orange-400'}`}>
                      <Image src={u.avatar} alt={u.name} fill className="object-cover" unoptimized />
                    </div>
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 size-6 rounded-full grid place-items-center text-[11px] font-bold text-slate-900 bg-gradient-to-br ${b.color} shadow`}>{rank}</div>
                  </div>
                  <div className="mt-3 font-semibold text-[12.5px] md:text-[13.5px] truncate">{u.name.split(' ')[0]}</div>
                  <div className="text-[10.5px] text-white/60">{u.likes.toLocaleString()} likes</div>
                  <div className={`${heights[pos]} mt-2 rounded-t-2xl bg-gradient-to-t ${b.color} opacity-90`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-5">
        <h3 className="font-display font-bold text-[16px] tracking-tight text-slate-900">Full Ranking</h3>
        <div className="mt-3 space-y-2">
          {LEADERBOARD.map((u, i) => {
            const b = BADGES[u.badge];
            return (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3 hover:shadow-md transition">
                <div className={`size-8 grid place-items-center rounded-full text-[13px] font-bold tabular-nums ${i < 3 ? 'text-white bg-gradient-to-br ' + b.color : 'text-slate-500 bg-slate-100'}`}>{i + 1}</div>
                <Image src={u.avatar} alt={u.name} width={44} height={44} className="rounded-full object-cover" unoptimized />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] text-slate-900 truncate">{u.name}</div>
                  <div className="text-[11.5px] text-slate-500 flex items-center gap-1"><MapPin className="size-3" /> {u.city} {'\u00B7'} <span className={`inline-flex items-center gap-0.5 font-semibold bg-gradient-to-r ${b.color} bg-clip-text text-transparent`}>{b.emoji} {b.label.split(' ')[0]}</span></div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[11.5px] font-semibold text-slate-700">{u.trips} trips</div>
                  <div className="text-[11px] text-slate-500">{u.hosted} hosted</div>
                </div>
                <div className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700"><Heart className="size-3.5 fill-rose-500 text-rose-500" /> {u.likes.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        {/* Badge legend */}
        <div className="mt-6 rounded-3xl bg-slate-100/60 p-4">
          <div className="font-semibold text-[13px] text-slate-800">Badge Tiers</div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(BADGES).map(([id, b]) => (
              <div key={id} className="rounded-2xl bg-white border border-slate-100 p-2.5 text-center">
                <div className={`mx-auto size-10 rounded-xl grid place-items-center bg-gradient-to-br ${b.color} text-white text-[19px]`}>{b.emoji}</div>
                <div className="mt-1.5 font-semibold text-[11.5px] text-slate-900">{b.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </Shell>
  );
}
