'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Lock, ChevronRight, Sparkles, Gift, Check } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import { REWARD_CARDS } from '@/lib/explore-v2-data';
import { fetchRewards } from '@/lib/explore-api';

const RECENT = [
  { id: 'r1', name: 'Free Camping Tent', icon: '\u26FA', at: 'Kashmir Great Lakes \u00B7 May 2026' },
  { id: 'r2', name: 'Trek Voucher \u20B92000', icon: '\u{1F39F}\uFE0F', at: 'Warwan Backpack \u00B7 Apr 2026' },
  { id: 'r3', name: 'Free Homestay Night', icon: '\u{1F3E1}', at: 'Tarsar Marsar \u00B7 Mar 2026' },
];

export default function Rewards() {
  const [cards, setCards] = useState(REWARD_CARDS);

  useEffect(() => {
    let alive = true;
    fetchRewards()
      .then(({ cards: remote }) => { if (alive && remote.length > 0) setCards(remote); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const unlocked = cards.filter(r => r.unlocked);
  const locked = cards.filter(r => !r.unlocked);
  const progress = Math.round((unlocked.length / 9) * 100);
  const remaining = 9 - unlocked.length;

  return (
    <Shell>
      {/* Header banner */}
      <div className="relative bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 text-white pt-[max(0.75rem,env(safe-area-inset-top))] pb-14 rounded-b-[32px] md:rounded-b-[48px]">
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-violet-500/25 blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/explore" className="size-10 grid place-items-center rounded-full bg-white/15 backdrop-blur-xl border border-white/20 active:scale-95"><ArrowLeft className="size-5" /></Link>
            <h1 className="flex-1 font-display font-bold text-[18px] md:text-[22px] tracking-tight">Reward Discovery</h1>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold"><Trophy className="size-3" /> {unlocked.length} of 9 unlocked</div>
            <h2 className="mt-3 font-display font-bold text-[30px] md:text-[42px] tracking-tight leading-tight">Complete trips.<br/><span className="bg-gradient-to-r from-violet-300 to-fuchsia-200 bg-clip-text text-transparent">Unlock rewards.</span></h2>
            <p className="mt-2 text-white/70 text-[13px] md:text-[14.5px] max-w-md mx-auto">Every verified trip you complete reveals one of nine mystery reward cards.</p>
          </div>

          {/* Progress ring */}
          <div className="mt-8 relative mx-auto size-44 md:size-52">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#g)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(progress / 100) * 283} 283`} className="transition-all duration-1000" />
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#e879f9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display font-bold text-[38px] md:text-[48px] leading-none">{unlocked.length}<span className="text-white/40 text-[22px]">/9</span></div>
                <div className="mt-1 text-[11px] text-white/60 uppercase tracking-widest">{progress}% complete</div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[12.5px] text-white/70">Complete <span className="font-bold text-white">{remaining}</span> more verified trip{remaining !== 1 ? 's' : ''} to unlock the grand prize.</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-8">
        {/* Recently unlocked */}
        {unlocked.length > 0 && (
          <section>
            <div className="flex items-center gap-2"><Check className="size-4 text-emerald-600" /><h3 className="font-display font-bold text-[16px] tracking-tight">Recently Unlocked</h3></div>
            <div className="mt-3 space-y-2">
              {RECENT.slice(0, unlocked.length).map(r => (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3.5">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center text-[24px] shadow shrink-0">{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] text-amber-900">{r.name}</div>
                    <div className="text-[11.5px] text-amber-700 mt-0.5">{r.at}</div>
                  </div>
                  <button className="rounded-lg bg-white/80 text-amber-800 px-2.5 py-1.5 text-[11.5px] font-bold">Claim</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available (unlocked) rewards */}
        <section>
          <div className="flex items-center gap-2"><Gift className="size-4 text-violet-600" /><h3 className="font-display font-bold text-[16px] tracking-tight">Your Rewards</h3></div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {unlocked.map(r => (
              <div key={r.id} className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white p-4 shadow-lg shadow-amber-500/20">
                <div className="text-[26px]">{r.icon}</div>
                <div className="mt-2 font-display font-bold text-[13.5px] leading-tight">{r.reward}</div>
                <button className="mt-3 w-full rounded-lg bg-white/25 hover:bg-white/40 text-white text-[11.5px] font-bold py-1.5 transition">Redeem</button>
              </div>
            ))}
          </div>
        </section>

        {/* Locked cards */}
        <section>
          <div className="flex items-center gap-2"><Lock className="size-4 text-slate-500" /><h3 className="font-display font-bold text-[16px] tracking-tight">Locked Cards</h3></div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {locked.map(r => (
              <div key={r.id} className="aspect-square rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center relative">
                <Lock className="size-7 text-slate-300" />
                <span className="absolute bottom-2 inset-x-0 text-center text-[10px] font-bold text-slate-500">???</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-slate-500 text-center">Complete a verified trip to reveal the next card.</p>
        </section>

        {/* How it works */}
        <section className="rounded-3xl bg-violet-50 border border-violet-100 p-4">
          <div className="flex items-center gap-2 text-violet-700"><Sparkles className="size-4" /><h3 className="font-display font-bold text-[14.5px] tracking-tight">How it works</h3></div>
          <ol className="mt-3 space-y-2">
            {['Create or join a Verified Safar trip','Complete the trip end-to-end','A random reward card gets revealed','Unlock all 9 for the grand prize'].map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="size-5 rounded-full bg-violet-600 text-white text-[10px] font-bold grid place-items-center shrink-0 mt-0.5">{i + 1}</div>
                <span className="text-[12.5px] text-violet-900 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          <Link href="/explore/create" className="mt-4 flex items-center justify-between rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 text-[13px] font-semibold active:scale-[0.98] transition">
            Start a Verified Trip <ChevronRight className="size-4" />
          </Link>
        </section>
      </main>
    </Shell>
  );
}
