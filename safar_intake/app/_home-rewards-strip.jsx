'use client';
// PERF: Extracted from /app/app/page.js so the below-the-fold rewards strip is
// code-split into its own chunk (lazy-loaded via next/dynamic in page.js).
// Zero UI/business-logic changes vs. the previous inline implementation.
import { useEffect, useState } from 'react';

export default function RewardsPromoStrip() {
  const [config, setConfig] = useState(null);
  const [promos, setPromos] = useState([]);
  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        fetch('/api/public/rewards-config').then(r => r.json()).catch(() => ({})),
        fetch('/api/public/promotions').then(r => r.json()).catch(() => ({})),
      ]);
      if (c && c.ok) setConfig(c);
      if (p && p.ok) setPromos(p.promotions || []);
    })();
  }, []);
  const pub = config?.publicDisplay || { showRewards: true, showReferral: true, showPromotions: true };
  if (!pub.showRewards && !pub.showReferral && !pub.showPromotions) return null;
  return (
    <section className="py-20 bg-gradient-to-b from-emerald-50/60 to-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Safar Rewards</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-2">Save more every time you travel</h2>
          <p className="text-muted-foreground mt-3">Earn Safar Credits on every booking, refer friends, unlock loyalty tiers and grab limited-time offers.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PromoTile emoji="🪙" title="Earn Safar Credits" desc={`Get ${config?.credits?.signupBonus||100} bonus credits on signup`} href="/rewards" />
          <PromoTile emoji="🎁" title="Refer Friends" desc={`Give ₹${config?.referral?.refereeReward||100}, earn ₹${config?.referral?.referrerReward||200}`} href="/rewards" />
          <PromoTile emoji="🏆" title="Join Loyalty Program" desc="Bronze → Platinum benefits" href="/rewards" />
          <PromoTile emoji="💸" title="Cashback Offers" desc={`Up to ${config?.cashback?.defaultPct||2}% cashback on bookings`} href="/rewards" />
        </div>
        {pub.showPromotions && promos.length > 0 && (
          <div className="mt-10">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Limited Offers</div>
                <div className="font-display text-2xl font-bold mt-1">Current promotions</div>
              </div>
              <a href="/rewards" className="text-sm text-emerald2 hover:underline font-semibold">See all →</a>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {promos.slice(0, 6).map((p) => (
                <a key={p.id} href={p.ctaHref || '/explore'}
                  className="group rounded-2xl border bg-white p-5 hover:border-emerald2 hover:shadow-md transition">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border bg-emerald-50 text-emerald2 border-emerald-200">{p.badge}</span>
                  <div className="font-display text-lg font-bold mt-2 group-hover:text-emerald2">{p.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
                  <div className="mt-3 text-sm font-semibold text-emerald2">{p.discountValue}{p.discountType==='percent'?'% off':' ₹ off'} →</div>
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="mt-10 text-center">
          <a href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald2 hover:bg-emerald2-deep text-white font-semibold">
            Create free account to start earning
          </a>
        </div>
      </div>
    </section>
  );
}

function PromoTile({ emoji, title, desc, href }) {
  return (
    <a href={href} className="group rounded-3xl border bg-white p-6 hover:border-emerald2 hover:shadow-md transition block">
      <div className="text-3xl">{emoji}</div>
      <div className="font-display text-lg font-bold mt-3 group-hover:text-emerald2">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
      <div className="mt-3 text-xs font-semibold text-emerald2">Learn more →</div>
    </a>
  );
}
