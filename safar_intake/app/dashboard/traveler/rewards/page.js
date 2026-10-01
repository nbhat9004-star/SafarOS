'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Wallet, Coins, Users, Award, Gift, Ticket, TrendingUp,
  Copy, Share2, Send, Sparkles, Receipt, ExternalLink, CheckCircle2, Clock,
  MessageCircle, Mail as MailIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const TABS = [
  { id:'overview', label:'Overview', icon: TrendingUp },
  { id:'wallet',   label:'Wallet',   icon: Wallet },
  { id:'credits',  label:'Safar Credits', icon: Coins },
  { id:'referral', label:'Referrals',icon: Users },
  { id:'loyalty',  label:'Loyalty',  icon: Award },
  { id:'coupons',  label:'Coupons',  icon: Ticket },
  { id:'cashback', label:'Cashback', icon: Gift },
  { id:'savings',  label:'My Savings', icon: Sparkles },
  { id:'transactions', label:'Transactions', icon: Receipt },
];

function Card({ label, value, icon: Ico, hint, accent='emerald' }) {
  const bg = accent==='emerald' ? 'bg-emerald-50 text-emerald2' : accent==='amber' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600';
  return (
    <div className="rounded-3xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className={`size-8 rounded-full grid place-items-center ${bg}`}><Ico className="size-4" /></div>
      </div>
      <div className="font-display text-3xl font-bold mt-2">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function TxRow({ t, amountKey='amount', showType=true }) {
  const positive = t.type==='credit' || t.type==='earn' || t.type==='cashback' || t.type==='referral';
  return (
    <div className="flex items-center justify-between gap-3 p-3 border rounded-xl bg-white">
      <div className="min-w-0">
        <div className="font-semibold text-sm truncate">{t.description || t.reason || t.type}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(t.createdAt || t.timestamp).toLocaleString('en-IN')}</div>
      </div>
      {showType && <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${positive?'bg-emerald-50 text-emerald2 border-emerald-200':'bg-secondary text-muted-foreground border-border'}`}>{t.type}</span>}
      <div className={`font-semibold ${positive?'text-emerald2':'text-charcoal'}`}>{positive?'+':'-'}₹{Math.abs(t[amountKey]||0).toLocaleString('en-IN')}</div>
    </div>
  );
}

function MyRewardsInner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/me/rewards', { credentials:'include' });
    const j = await r.json();
    if (j.ok) setData(j); else toast.error(j.error||'Failed to load rewards');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <main className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 pb-16 container max-w-6xl"><div className="py-20 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div></div>
    <Footer /></main>
  );

  if (!data) return null;
  const { user, currentTier, nextTier, referral, wallet, credits, loyalty, coupons: myCoupons, cashback, savings, promotions } = data;

  const shareText = `Join Safar Curated with my code ${referral.code} and get bonus rewards! ${referral.link}`;
  const copyCode = () => { navigator.clipboard.writeText(referral.code); toast.success('Referral code copied'); };
  const copyLink = () => { navigator.clipboard.writeText(referral.link); toast.success('Referral link copied'); };
  const shareWhatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  const shareEmail = () => window.open(`mailto:?subject=${encodeURIComponent('Join me on Safar Curated')}&body=${encodeURIComponent(shareText)}`);
  const shareNative = async () => { try { await navigator.share({ title:'Safar Curated', text: shareText, url: referral.link }); } catch {} };

  const progress = nextTier ? Math.min(100, Math.round(((user.loyaltyPoints - (currentTier?.min||0)) / ((nextTier.min - (currentTier?.min||0)) || 1)) * 100)) : 100;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-6xl">
        <Button asChild variant="ghost" size="sm" className="rounded-full mb-6 -ml-2">
          <Link href="/dashboard/traveler"><ArrowLeft className="size-4 mr-2" /> Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2"><Sparkles className="size-3.5" /> My Rewards</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">Rewards, credits & savings</h1>
            <p className="text-muted-foreground mt-2">One place for every benefit you've earned on Safar.</p>
          </div>
          <div className="rounded-2xl border bg-white p-4 md:min-w-[220px] text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Loyalty Tier</div>
            <div className="font-display text-3xl font-bold mt-1">{user.loyaltyTier}</div>
            <div className="text-xs text-emerald2 mt-1">{user.loyaltyPoints} points</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(t => {
            const Ico = t.icon;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`px-4 py-2 rounded-full border text-sm font-semibold inline-flex items-center gap-2 ${tab===t.id?'bg-emerald2 text-white border-emerald2':'bg-white hover:border-emerald2'}`}>
                <Ico className="size-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab==='overview' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card label="Wallet Balance" value={`₹${(wallet.balance||0).toLocaleString('en-IN')}`} icon={Wallet} hint="Use towards any booking" />
              <Card label="Safar Credits" value={credits.balance.toLocaleString('en-IN')} icon={Coins} hint={`${credits.expiring||0} expiring soon`} accent="amber" />
              <Card label="Successful Referrals" value={referral.successfulReferrals} icon={Users} hint={`${referral.pendingReferrals} pending`} accent="blue" />
              <Card label="Lifetime Savings" value={`₹${(savings.total||0).toLocaleString('en-IN')}`} icon={TrendingUp} hint="Coupons + cashback + referrals" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-3xl border bg-gradient-to-br from-emerald-50 to-white p-6">
                <div className="font-display text-xl font-bold flex items-center gap-2"><Award className="size-5 text-emerald2" /> {currentTier?.name || 'Bronze'} Member</div>
                <div className="text-xs text-muted-foreground mt-1">{(currentTier?.benefits || []).slice(0,2).join(' · ')}</div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1"><span>Progress to {nextTier?.name || 'top tier'}</span><span>{progress}%</span></div>
                  <div className="h-2 bg-white rounded-full overflow-hidden border"><div className="h-full bg-emerald2" style={{width:`${progress}%`}} /></div>
                  <div className="text-[11px] text-muted-foreground mt-1">{nextTier ? `${(nextTier.min - user.loyaltyPoints).toLocaleString('en-IN')} points to ${nextTier.name}` : 'You are at the top tier!'}</div>
                </div>
                <Button onClick={()=>setTab('loyalty')} className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep">View benefits</Button>
              </div>
              <div className="rounded-3xl border bg-white p-6">
                <div className="font-display text-xl font-bold flex items-center gap-2"><Users className="size-5 text-emerald2" /> Your Referral Code</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 font-mono text-xl font-bold bg-secondary/50 rounded-xl px-4 py-3 border">{referral.code}</div>
                  <Button onClick={copyCode} variant="outline" className="rounded-full"><Copy className="size-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button onClick={copyLink} size="sm" variant="outline" className="rounded-full"><Copy className="size-3.5 mr-1" /> Link</Button>
                  <Button onClick={shareWhatsapp} size="sm" variant="outline" className="rounded-full"><MessageCircle className="size-3.5 mr-1" /> WhatsApp</Button>
                  <Button onClick={shareEmail} size="sm" variant="outline" className="rounded-full"><MailIcon className="size-3.5 mr-1" /> Email</Button>
                  <Button onClick={shareNative} size="sm" className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Share2 className="size-3.5 mr-1" /> Share</Button>
                </div>
                <div className="text-[11px] text-muted-foreground mt-3">Earn ₹{referral.config?.referrerReward||200} when a friend books their first stay.</div>
              </div>
            </div>
            {promotions?.length > 0 && (
              <div className="rounded-3xl border bg-white p-6">
                <div className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="size-5 text-emerald2" /> Current Offers</div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {promotions.slice(0,6).map(p => (
                    <Link key={p.id} href={p.ctaHref||'/explore'} className="rounded-2xl border p-4 hover:border-emerald2 group transition">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">{p.badge}</div>
                      <div className="font-display text-base font-bold mt-1 group-hover:text-emerald2">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
                      <div className="mt-2 text-xs font-semibold text-emerald2">{p.discountValue}{p.discountType==='percent'?'% off':' ₹ off'} →</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='wallet' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card label="Current Balance" value={`₹${(wallet.balance||0).toLocaleString('en-IN')}`} icon={Wallet} />
              <Card label="Transactions" value={wallet.transactions.length} icon={Receipt} accent="blue" />
              <Card label="Min Redeem" value={`₹${wallet.config?.minRedeem||100}`} icon={Coins} accent="amber" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Link href="/explore">Use Wallet on a Booking</Link></Button>
              <Button variant="outline" className="rounded-full" onClick={()=>setTab('transactions')}>View Transactions</Button>
            </div>
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-3">Wallet History</div>
              {wallet.transactions.length===0 ? <div className="text-sm text-muted-foreground text-center py-6">No wallet transactions yet.</div> :
                <div className="space-y-2">{wallet.transactions.map(t=><TxRow key={t.id} t={t} />)}</div>}
            </div>
          </div>
        )}

        {tab==='credits' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Card label="Current Balance" value={credits.balance.toLocaleString('en-IN')} icon={Coins} />
              <Card label="Credits Earned" value={credits.earned.toLocaleString('en-IN')} icon={CheckCircle2} accent="emerald" />
              <Card label="Credits Redeemed" value={credits.redeemed.toLocaleString('en-IN')} icon={ExternalLink} accent="blue" />
              <Card label="Expiring Soon" value={(credits.expiring||0).toLocaleString('en-IN')} icon={Clock} accent="amber" hint="Within 30 days" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Link href="/explore">Redeem on Booking</Link></Button>
              <Button variant="outline" className="rounded-full" onClick={()=>setTab('transactions')}>View History</Button>
            </div>
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-3">Credits History</div>
              {credits.transactions.length===0 ? <div className="text-sm text-muted-foreground text-center py-6">No credit transactions yet.</div> :
                <div className="space-y-2">{credits.transactions.map(t=><TxRow key={t.id} t={t} />)}</div>}
            </div>
          </div>
        )}

        {tab==='referral' && (
          <div className="space-y-4">
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-2xl font-bold">Refer & Earn</div>
              <p className="text-sm text-muted-foreground mt-1">Earn ₹{referral.config?.referrerReward||200} for every friend who books. They get ₹{referral.config?.refereeReward||100} on signup.</p>
              <div className="mt-5 flex items-center gap-2">
                <div className="flex-1 font-mono text-xl font-bold bg-secondary/50 rounded-xl px-4 py-3 border">{referral.code}</div>
                <Button onClick={copyCode} variant="outline" className="rounded-full"><Copy className="size-4 mr-2" /> Copy Code</Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground break-all">{referral.link}</div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={copyLink} variant="outline" className="rounded-full"><Copy className="size-4 mr-2" /> Copy Link</Button>
                <Button onClick={shareWhatsapp} variant="outline" className="rounded-full"><MessageCircle className="size-4 mr-2" /> WhatsApp</Button>
                <Button onClick={shareEmail} variant="outline" className="rounded-full"><MailIcon className="size-4 mr-2" /> Email</Button>
                <Button onClick={shareNative} className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Share2 className="size-4 mr-2" /> Share</Button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card label="Successful Referrals" value={referral.successfulReferrals} icon={CheckCircle2} />
              <Card label="Pending Rewards" value={referral.pendingReferrals} icon={Clock} accent="amber" />
              <Card label="Total Rewards Earned" value={`₹${(referral.totalRewards||0).toLocaleString('en-IN')}`} icon={Gift} accent="blue" />
            </div>
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-3">Referral History</div>
              {referral.referrals.length===0 ? <div className="text-sm text-muted-foreground text-center py-6">Share your code to see your first referral here!</div> :
                <div className="space-y-2">{referral.referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-3 border rounded-xl bg-white">
                    <div><div className="font-semibold text-sm">{r.refereeName || r.refereeEmail || 'Guest'}</div><div className="text-[11px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-IN')}</div></div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${r.rewardCredited?'bg-emerald-50 text-emerald2 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{r.rewardCredited?'Rewarded':'Pending'}</span>
                    <div className="font-semibold text-emerald2">+₹{r.rewardAmount||0}</div>
                  </div>
                ))}</div>}
            </div>
          </div>
        )}

        {tab==='loyalty' && (
          <div className="space-y-4">
            <div className="rounded-3xl border bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-2xl font-bold">You're a {currentTier?.name} member</div>
                  <div className="text-sm text-muted-foreground mt-1">{user.loyaltyPoints.toLocaleString('en-IN')} loyalty points</div>
                </div>
                <Award className="size-10 text-emerald2" />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1"><span>Progress to {nextTier?.name || 'top tier'}</span><span>{progress}%</span></div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden border"><div className="h-full bg-emerald2" style={{width:`${progress}%`}} /></div>
                {nextTier && <div className="text-[11px] text-muted-foreground mt-1">{(nextTier.min - user.loyaltyPoints).toLocaleString('en-IN')} more points to unlock {nextTier.name}</div>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loyalty.config.tiers.map(t => (
                <div key={t.name} className={`rounded-3xl border bg-white p-5 ${t.name===currentTier?.name?'ring-2 ring-emerald2':''}`}>
                  <div className="font-display text-xl font-bold">{t.name}</div>
                  <div className="text-xs text-emerald2 font-semibold mt-1">{t.min.toLocaleString('en-IN')}+ points</div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{(t.benefits||[]).map((b,i)=><li key={i} className="flex items-start gap-2"><CheckCircle2 className="size-3.5 text-emerald2 mt-0.5 shrink-0" /> {b}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='coupons' && (
          <div className="space-y-4">
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-3">Applied Coupons</div>
              {myCoupons.length===0 ? <div className="text-sm text-muted-foreground text-center py-6">You haven't used any coupons yet. Check current offers on the <Link href="/rewards" className="text-emerald2 hover:underline font-semibold">rewards page</Link>.</div> :
                <div className="space-y-2">{myCoupons.map(u => (
                  <div key={u.id||u.couponCode} className="flex items-center justify-between gap-3 p-3 border rounded-xl">
                    <div><div className="font-mono font-bold">{u.couponCode||u.code}</div><div className="text-[11px] text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('en-IN')}</div></div>
                    <div className="font-semibold text-emerald2">-₹{(u.discountAmount||0).toLocaleString('en-IN')}</div>
                  </div>
                ))}</div>}
            </div>
            <Button asChild className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Link href="/rewards">Browse public offers</Link></Button>
          </div>
        )}

        {tab==='cashback' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card label="Cashback Earned" value={`₹${(cashback.total||0).toLocaleString('en-IN')}`} icon={Gift} />
              <Card label="Entries" value={cashback.entries.length} icon={Receipt} accent="blue" />
              <Card label="Rate" value={`${cashback.config?.defaultPct||2}%`} icon={TrendingUp} accent="amber" hint="On every eligible booking" />
            </div>
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-3">Cashback History</div>
              {cashback.entries.length===0 ? <div className="text-sm text-muted-foreground text-center py-6">No cashback yet. Complete a booking to earn cashback.</div> :
                <div className="space-y-2">{cashback.entries.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-3 border rounded-xl">
                    <div><div className="font-semibold text-sm">{c.reason||'Booking cashback'}</div><div className="text-[11px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('en-IN')}</div></div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${c.credited?'bg-emerald-50 text-emerald2 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{c.credited?'Credited':'Pending'}</span>
                    <div className="font-semibold text-emerald2">+₹{(c.amount||0).toLocaleString('en-IN')}</div>
                  </div>
                ))}</div>}
            </div>
          </div>
        )}

        {tab==='savings' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card label="Coupon Savings" value={`₹${(savings.couponSavings||0).toLocaleString('en-IN')}`} icon={Ticket} />
              <Card label="Cashback Earned" value={`₹${(savings.cashbackEarned||0).toLocaleString('en-IN')}`} icon={Gift} accent="amber" />
              <Card label="Referral Earnings" value={`₹${(savings.referralEarnings||0).toLocaleString('en-IN')}`} icon={Users} accent="blue" />
              <Card label="Wallet Savings" value={`₹${(savings.walletSavings||0).toLocaleString('en-IN')}`} icon={Wallet} />
              <Card label="Online Pay Discount" value={`₹${(savings.onlinePayDiscountSaved||0).toLocaleString('en-IN')}`} icon={TrendingUp} accent="blue" />
              <Card label="Lifetime Total" value={`₹${(savings.total||0).toLocaleString('en-IN')}`} icon={Sparkles} />
            </div>
            <div className="rounded-3xl border bg-gradient-to-br from-emerald-50 to-white p-8 text-center">
              <div className="text-[10px] uppercase tracking-wider font-bold text-emerald2">Your money saved</div>
              <div className="font-display text-5xl font-bold mt-2">₹{(savings.total||0).toLocaleString('en-IN')}</div>
              <div className="text-sm text-muted-foreground mt-2">Keep booking to unlock more rewards</div>
              <Button asChild className="rounded-full mt-4 bg-emerald2 hover:bg-emerald2-deep"><Link href="/explore">Book your next stay</Link></Button>
            </div>
          </div>
        )}

        {tab==='transactions' && (
          <div className="space-y-4">
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-3">All Transactions</div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-semibold text-muted-foreground mb-2">Wallet</div>
                  {wallet.transactions.length===0 ? <div className="text-xs text-muted-foreground py-3">No wallet transactions</div> :
                    <div className="space-y-2">{wallet.transactions.slice(0,10).map(t=><TxRow key={t.id} t={t} />)}</div>}
                </div>
                <div>
                  <div className="text-sm font-semibold text-muted-foreground mb-2">Safar Credits</div>
                  {credits.transactions.length===0 ? <div className="text-xs text-muted-foreground py-3">No credit transactions</div> :
                    <div className="space-y-2">{credits.transactions.slice(0,10).map(t=><TxRow key={t.id} t={t} />)}</div>}
                </div>
              </div>
            </div>
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-3">Invoices</div>
              <p className="text-sm text-muted-foreground">Booking invoices are emailed on approval. See all bookings for individual invoice access.</p>
              <Button asChild className="rounded-full mt-3 bg-emerald2 hover:bg-emerald2-deep"><Link href="/dashboard/traveler/bookings">Open My Bookings</Link></Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <ProtectedRoute roles={['traveler','host','admin','super_admin']}>
      <MyRewardsInner />
    </ProtectedRoute>
  );
}
