'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Users, Award, Gift, Ticket, Wallet, Coins, Percent, ArrowRight, CheckCircle2, TrendingUp,
} from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';

export default function App() {
  const [config, setConfig] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, p, co] = await Promise.all([
        fetch('/api/public/rewards-config').then(r=>r.json()).catch(()=>({})),
        fetch('/api/public/promotions').then(r=>r.json()).catch(()=>({})),
        fetch('/api/public/coupons').then(r=>r.json()).catch(()=>({})),
      ]);
      if (c.ok) setConfig(c);
      if (p.ok) setPromotions(p.promotions||[]);
      if (co.ok) setCoupons(co.coupons||[]);
      setLoading(false);
    })();
  }, []);

  const pub = config?.publicDisplay || { showRewards:true, showReferral:true, showPromotions:true, showCashback:true, showLoyalty:true };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-emerald-50 to-background">
        <div className="container max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold"><Sparkles className="size-3.5" /> Safar Rewards</div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mt-3">Travel more. Save more.</h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Every booking earns Safar Credits, cashback and loyalty points. Refer friends to unlock even more.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold"><Link href="/auth/signup">Create free account <ArrowRight className="size-4 ml-2" /></Link></Button>
            <Button asChild variant="outline" className="rounded-full font-semibold"><Link href="/dashboard/traveler/rewards">Open my rewards</Link></Button>
          </div>
        </div>
      </section>

      {/* Value pillars */}
      {pub.showRewards && (
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PillarCard icon={Coins} title="Earn Safar Credits" desc={`Get ${config?.credits?.signupBonus||100} credits just for signing up. Earn more with every booking.`} accent="amber" />
              <PillarCard icon={Users} title="Refer Friends" desc={`Give ₹${config?.referral?.refereeReward||100}, earn ₹${config?.referral?.referrerReward||200} when they book.`} accent="blue" />
              <PillarCard icon={Award} title="Loyalty Program" desc="Bronze to Platinum. Unlock upgrades, priority support & concierge." />
              <PillarCard icon={Gift} title="Cashback" desc={`Up to ${config?.cashback?.defaultPct||2}% cashback on every booking, credited to your wallet.`} accent="amber" />
            </div>
          </div>
        </section>
      )}

      {/* Promotions grid */}
      {pub.showPromotions && promotions.length > 0 && (
        <section className="py-20 bg-secondary/40">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Current Promotions</div>
                <h2 className="font-display text-4xl md:text-5xl font-bold mt-2">Limited-time offers</h2>
              </div>
              <Button asChild variant="outline" className="rounded-full"><Link href="/explore">Browse stays</Link></Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map(p => (
                <Link key={p.id} href={p.ctaHref||'/explore'} className="group rounded-3xl border bg-white p-6 hover:border-emerald2 hover:shadow-md transition">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border bg-emerald-50 text-emerald2 border-emerald-200">{p.badge}</span>
                  <div className="font-display text-xl font-bold mt-3 group-hover:text-emerald2">{p.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-semibold text-emerald2">{p.discountValue}{p.discountType==='percent'?'% off':' ₹ off'}</span>
                    <ArrowRight className="size-4 text-emerald2 group-hover:translate-x-1 transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Public coupons */}
      {coupons.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold text-center">Coupons</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-2 text-center">Ready-to-use codes</h2>
            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map(c => (
                <div key={c.code} className="rounded-3xl border-2 border-dashed border-emerald2/40 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-lg font-bold text-emerald2">{c.code}</div>
                    <button onClick={()=>{ navigator.clipboard.writeText(c.code); }} className="text-xs text-emerald2 hover:underline">Copy</button>
                  </div>
                  <div className="font-display text-xl font-bold mt-2">{c.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{c.description}</div>
                  <div className="text-xs text-muted-foreground mt-3">{c.discountValue}{c.discountType==='percent'?'% off':' ₹ off'} · Min ₹{c.minBooking||0}{c.maxDiscount?` · Max ₹${c.maxDiscount}`:''}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loyalty tiers */}
      {pub.showLoyalty && (
        <section className="py-20 bg-secondary/40">
          <div className="container">
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold text-center">Loyalty Program</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-2 text-center">Earn your tier</h2>
            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(config?.loyalty?.tiers || [{name:'Bronze',min:0,benefits:[]},{name:'Silver',min:5000,benefits:[]},{name:'Gold',min:20000,benefits:[]},{name:'Platinum',min:50000,benefits:[]}]).map(t => (
                <div key={t.name} className="rounded-3xl border bg-white p-6">
                  <div className="font-display text-2xl font-bold">{t.name}</div>
                  <div className="text-xs text-emerald2 font-semibold mt-1">{t.min.toLocaleString('en-IN')}+ points</div>
                  <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">{(t.benefits||[]).map((b,i)=><li key={i} className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald2 mt-0.5 shrink-0" /> {b}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Referral CTA */}
      {pub.showReferral && (
        <section className="py-24">
          <div className="container">
            <div className="relative overflow-hidden rounded-[2.5rem] p-10 md:p-16 bg-charcoal text-white">
              <div className="relative z-10 max-w-2xl">
                <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Refer & Earn</div>
                <h3 className="font-display text-4xl md:text-6xl font-bold mt-3">Bring friends, earn together.</h3>
                <p className="mt-4 text-white/70">Share your unique code. Every friend who books earns you real money into your Safar wallet.</p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold"><Link href="/auth/signup">Get my code <ArrowRight className="size-4 ml-2" /></Link></Button>
                  <Button asChild variant="outline" className="rounded-full text-white border-white/30 hover:bg-white/10"><Link href="/dashboard/traveler/rewards">View my rewards</Link></Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

function PillarCard({ icon: Ico, title, desc, accent='emerald' }) {
  const bg = accent==='amber' ? 'bg-amber-50 text-amber-700' : accent==='blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald2';
  return (
    <div className="rounded-3xl border bg-white p-6">
      <div className={`size-11 rounded-xl grid place-items-center ${bg}`}><Ico className="size-5" /></div>
      <div className="font-display text-xl font-bold mt-4">{title}</div>
      <div className="text-sm text-muted-foreground mt-2">{desc}</div>
    </div>
  );
}
