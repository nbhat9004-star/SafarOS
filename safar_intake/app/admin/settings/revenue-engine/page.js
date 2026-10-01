'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Save, CreditCard, Wallet, Coins, Users, Award, Gift, Ticket,
  Percent, Sparkles, BadgeIndianRupee, Landmark, RotateCcw, Receipt, BarChart3, Eye,
  Plus, Trash2, ArrowUpRight, Settings2, Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import ProtectedRoute from '@/components/safar/ProtectedRoute';
import { Button } from '@/components/ui/button';

const SUBMENUS = [
  { id:'payment-gateways', title:'Payment Gateways', icon: CreditCard, href:'/admin/settings/payment-gateways', desc:'Configure Razorpay and other providers' },
  { id:'booking-fee',      title:'Booking Fee Rules', icon: BadgeIndianRupee, tab:'rules', desc:'Flat/percent booking fee configuration' },
  { id:'wallet',           title:'Wallet',            icon: Wallet, tab:'rules', desc:'Traveler wallet rules & limits' },
  { id:'credits',          title:'Safar Credits',     icon: Coins, tab:'rules', desc:'Signup bonus, expiry & redemption' },
  { id:'referral',         title:'Referral Program',  icon: Users, tab:'rules', desc:'Referrer/referee rewards' },
  { id:'loyalty',          title:'Loyalty Program',   icon: Award, tab:'rules', desc:'Bronze / Silver / Gold / Platinum tiers' },
  { id:'promotions',       title:'Promotions',        icon: Sparkles, tab:'promo', desc:'Festival, flash & limited offers' },
  { id:'coupons',          title:'Coupons',           icon: Ticket, tab:'coupons', desc:'Flat / percent coupon codes' },
  { id:'cashback',         title:'Cashback Rules',    icon: Gift, tab:'rules', desc:'Cashback percentage on bookings' },
  { id:'rewards',          title:'Rewards',           icon: Award, tab:'rules', desc:'Overall rewards toggles' },
  { id:'membership',       title:'Membership',        icon: Shield, tab:'rules', desc:'Future-ready plans (Free/Premium/Business/VIP)' },
  { id:'commission',       title:'Commission Rules',  icon: Percent, tab:'rules', desc:'Host commission percentages' },
  { id:'refund',           title:'Refund Rules',      icon: RotateCcw, tab:'rules', desc:'Cancellation window & auto-approve' },
  { id:'tax',              title:'Tax Rules',         icon: Landmark, tab:'rules', desc:'GST configuration' },
  { id:'analytics',        title:'Analytics',         icon: BarChart3, tab:'analytics', desc:'Revenue, loyalty distribution, coupon usage' },
];

function Section({ title, children }) {
  return (
    <div className="rounded-3xl border bg-white p-6">
      <div className="font-display text-lg font-bold mb-4">{title}</div>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
function Field({ label, children, hint }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}
const Input = (props) => (
  <input {...props} className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm ${props.className||''}`} />
);
const Toggle = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
    <input type="checkbox" checked={!!checked} onChange={(e)=>onChange(e.target.checked)} className="size-4 accent-emerald-600" />
    <span className="text-sm text-muted-foreground">{label}</span>
  </label>
);

function RevenueEngineInner() {
  const [tab, setTab] = useState('hub'); // hub | rules | promo | coupons | analytics
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [promos, setPromos] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newPromo, setNewPromo] = useState({ title:'', description:'', badge:'Festival', category:'general', audience:'traveler', discountType:'percent', discountValue:10, ctaHref:'/explore', ctaText:'Book Now', active:true });
  const [newCoupon, setNewCoupon] = useState({ code:'', title:'', description:'', discountType:'percent', discountValue:10, minBooking:0, maxDiscount:0, usageLimit:0, perUserLimit:1, isPublic:true, active:true });

  const load = async () => {
    setLoading(true);
    const [s, p, c, a] = await Promise.all([
      fetch('/api/admin/revenue-settings', { credentials:'include' }).then(r=>r.json()).catch(()=>({})),
      fetch('/api/admin/promotions', { credentials:'include' }).then(r=>r.json()).catch(()=>({})),
      fetch('/api/admin/coupons', { credentials:'include' }).then(r=>r.json()).catch(()=>({})),
      fetch('/api/admin/revenue-analytics', { credentials:'include' }).then(r=>r.json()).catch(()=>({})),
    ]);
    if (s.ok) setSettings(s.settings);
    if (p.ok) setPromos(p.promotions||[]);
    if (c.ok) setCoupons(c.coupons||[]);
    if (a.ok) setAnalytics(a.analytics);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/revenue-settings', {
      method:'PUT', credentials:'include',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { toast.success('Revenue settings saved'); setSettings(data.settings); }
    else toast.error(data.error||'Save failed');
  };

  const createPromo = async () => {
    if (!newPromo.title) return toast.error('Title required');
    const res = await fetch('/api/admin/promotions', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newPromo) });
    const data = await res.json();
    if (data.ok) { toast.success('Promotion created'); setNewPromo({ ...newPromo, title:'', description:'' }); load(); }
    else toast.error(data.error||'Failed');
  };
  const togglePromo = async (p) => {
    const res = await fetch(`/api/admin/promotions/${p.id}`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active: !p.active }) });
    const data = await res.json(); if (data.ok) { toast.success(!p.active?'Activated':'Deactivated'); load(); }
  };
  const removePromo = async (id) => {
    if (!confirm('Delete promotion?')) return;
    await fetch(`/api/admin/promotions/${id}`, { method:'DELETE', credentials:'include' });
    toast.success('Deleted'); load();
  };

  const createCoupon = async () => {
    if (!newCoupon.code) return toast.error('Code required');
    const res = await fetch('/api/admin/coupons', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...newCoupon, code: newCoupon.code.toUpperCase() }) });
    const data = await res.json();
    if (data.ok) { toast.success('Coupon created'); setNewCoupon({ ...newCoupon, code:'', title:'', description:'' }); load(); }
    else toast.error(data.error||'Failed');
  };
  const toggleCoupon = async (c) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active: !c.active }) });
    const data = await res.json(); if (data.ok) { toast.success('Updated'); load(); }
  };
  const removeCoupon = async (id) => {
    if (!confirm('Delete coupon?')) return;
    await fetch(`/api/admin/coupons/${id}`, { method:'DELETE', credentials:'include' });
    toast.success('Deleted'); load();
  };

  const upd = (path, val) => {
    setSettings((s) => {
      const c = structuredClone(s || {});
      const keys = path.split('.'); let o = c;
      for (let i=0; i<keys.length-1; i++) { o[keys[i]] = o[keys[i]] || {}; o = o[keys[i]]; }
      o[keys[keys.length-1]] = val;
      return c;
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container max-w-7xl">
        <Button asChild variant="ghost" size="sm" className="rounded-full mb-6 -ml-2">
          <Link href="/admin"><ArrowLeft className="size-4 mr-2" /> Back to Admin</Link>
        </Button>
        <div className="mb-6">
          <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2">
            <Shield className="size-3.5" /> Super Admin · Settings
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-2 flex items-center gap-3">
            <Settings2 className="size-9 text-emerald2" /> Revenue Engine
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Every rule powering booking fees, wallets, credits, referrals, loyalty tiers, promotions,
            coupons, cashback, commissions, refunds and taxes — configurable from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            {id:'hub', label:'All Modules'},
            {id:'rules', label:'Rules & Programs'},
            {id:'promo', label:'Promotions'},
            {id:'coupons', label:'Coupons'},
            {id:'analytics', label:'Analytics'},
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`px-4 py-2 rounded-full border text-sm font-semibold ${tab===t.id ? 'bg-emerald2 text-white border-emerald2' : 'bg-white hover:border-emerald2'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="py-20 grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald2" /></div>}

        {!loading && tab==='hub' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBMENUS.map(m => {
              const Ico = m.icon;
              const inner = (
                <div className="group rounded-2xl border bg-white p-5 flex items-start gap-4 hover:border-emerald2 hover:shadow-md transition h-full">
                  <div className="size-11 rounded-xl bg-emerald-50 grid place-items-center text-emerald2 shrink-0 group-hover:bg-emerald2 group-hover:text-white transition"><Ico className="size-5" /></div>
                  <div className="flex-1">
                    <div className="font-display text-base font-bold">{m.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-emerald2 transition" />
                </div>
              );
              return m.href ? (
                <Link key={m.id} href={m.href}>{inner}</Link>
              ) : (
                <button key={m.id} onClick={() => setTab(m.tab)} className="text-left">{inner}</button>
              );
            })}
          </div>
        )}

        {!loading && tab==='rules' && settings && (
          <div className="space-y-5">
            <Section title="Booking Fee">
              <Field label="Enabled"><Toggle checked={settings.bookingFee.enabled} onChange={v=>upd('bookingFee.enabled', v)} label="Charge a booking fee" /></Field>
              <Field label="Mode">
                <div className="flex gap-2">
                  {['percent','flat'].map(m => (
                    <button key={m} type="button" onClick={()=>upd('bookingFee.mode', m)}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-semibold uppercase ${settings.bookingFee.mode===m?'bg-emerald2 text-white border-emerald2':'bg-white'}`}>{m}</button>
                  ))}
                </div>
              </Field>
              <Field label="Percent (%)"><Input type="number" value={settings.bookingFee.percent} onChange={e=>upd('bookingFee.percent', Number(e.target.value))} /></Field>
              <Field label="Flat Amount"><Input type="number" value={settings.bookingFee.flat} onChange={e=>upd('bookingFee.flat', Number(e.target.value))} /></Field>
              <Field label="Minimum"><Input type="number" value={settings.bookingFee.minAmount} onChange={e=>upd('bookingFee.minAmount', Number(e.target.value))} /></Field>
              <Field label="Maximum"><Input type="number" value={settings.bookingFee.maxAmount} onChange={e=>upd('bookingFee.maxAmount', Number(e.target.value))} /></Field>
            </Section>

            <Section title="Online Payment Discount">
              <Field label="Enabled"><Toggle checked={settings.onlinePayDiscount.enabled} onChange={v=>upd('onlinePayDiscount.enabled', v)} label="Reward pay-online guests" /></Field>
              <Field label="Discount %">
                <div className="flex gap-2 flex-wrap">
                  {[0,1,2,3,5].map(p => (
                    <button key={p} type="button" onClick={()=>upd('onlinePayDiscount.percent', p)}
                      className={`px-4 py-2 rounded-full border text-sm font-semibold ${settings.onlinePayDiscount.percent===p?'bg-emerald2 text-white border-emerald2':'bg-white'}`}>{p}%</button>
                  ))}
                </div>
              </Field>
            </Section>

            <Section title="Wallet">
              <Field label="Enabled"><Toggle checked={settings.wallet.enabled} onChange={v=>upd('wallet.enabled', v)} label="Enable wallet payments" /></Field>
              <Field label="Min Redeem"><Input type="number" value={settings.wallet.minRedeem} onChange={e=>upd('wallet.minRedeem', Number(e.target.value))} /></Field>
              <Field label="Max Usage per Booking (%)"><Input type="number" value={settings.wallet.maxUsagePctPerBooking} onChange={e=>upd('wallet.maxUsagePctPerBooking', Number(e.target.value))} /></Field>
            </Section>

            <Section title="Safar Credits">
              <Field label="Enabled"><Toggle checked={settings.credits.enabled} onChange={v=>upd('credits.enabled', v)} label="Enable Safar Credits" /></Field>
              <Field label="Signup Bonus"><Input type="number" value={settings.credits.signupBonus} onChange={e=>upd('credits.signupBonus', Number(e.target.value))} /></Field>
              <Field label="Referral Award"><Input type="number" value={settings.credits.referralAward} onChange={e=>upd('credits.referralAward', Number(e.target.value))} /></Field>
              <Field label="Expiry Days"><Input type="number" value={settings.credits.expiryDays} onChange={e=>upd('credits.expiryDays', Number(e.target.value))} /></Field>
              <Field label="Min Redeem"><Input type="number" value={settings.credits.minRedeem} onChange={e=>upd('credits.minRedeem', Number(e.target.value))} /></Field>
            </Section>

            <Section title="Referral Program">
              <Field label="Enabled"><Toggle checked={settings.referral.enabled} onChange={v=>upd('referral.enabled', v)} label="Enable referral program" /></Field>
              <Field label="Referrer Reward"><Input type="number" value={settings.referral.referrerReward} onChange={e=>upd('referral.referrerReward', Number(e.target.value))} /></Field>
              <Field label="Referee Reward"><Input type="number" value={settings.referral.refereeReward} onChange={e=>upd('referral.refereeReward', Number(e.target.value))} /></Field>
              <Field label="Reward Type">
                <select value={settings.referral.rewardType} onChange={e=>upd('referral.rewardType', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm">
                  <option value="credits">Safar Credits</option>
                  <option value="wallet">Wallet Balance</option>
                  <option value="coupon">Coupon</option>
                </select>
              </Field>
              <Field label="Code Prefix"><Input value={settings.referral.codePrefix} onChange={e=>upd('referral.codePrefix', e.target.value)} /></Field>
            </Section>

            <Section title="Loyalty Program">
              <Field label="Enabled"><Toggle checked={settings.loyalty.enabled} onChange={v=>upd('loyalty.enabled', v)} label="Enable loyalty tiers" /></Field>
              <div className="md:col-span-2 space-y-2">
                {settings.loyalty.tiers.map((t, i) => (
                  <div key={t.name} className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end p-3 rounded-xl bg-secondary/40">
                    <div><div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Tier</div><div className="font-bold">{t.name}</div></div>
                    <Field label="Min Points"><Input type="number" value={t.min} onChange={e=>{const tiers=[...settings.loyalty.tiers]; tiers[i]={...tiers[i], min:Number(e.target.value)}; upd('loyalty.tiers', tiers);}} /></Field>
                    <Field label="Credit %"><Input type="number" value={t.creditPct||0} onChange={e=>{const tiers=[...settings.loyalty.tiers]; tiers[i]={...tiers[i], creditPct:Number(e.target.value)}; upd('loyalty.tiers', tiers);}} /></Field>
                    <Field label="Benefits (comma sep)"><Input value={(t.benefits||[]).join(', ')} onChange={e=>{const tiers=[...settings.loyalty.tiers]; tiers[i]={...tiers[i], benefits:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}; upd('loyalty.tiers', tiers);}} /></Field>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Cashback Rules">
              <Field label="Enabled"><Toggle checked={settings.cashback.enabled} onChange={v=>upd('cashback.enabled', v)} label="Enable cashback" /></Field>
              <Field label="Default %"><Input type="number" value={settings.cashback.defaultPct} onChange={e=>upd('cashback.defaultPct', Number(e.target.value))} /></Field>
              <Field label="Min Booking Amount"><Input type="number" value={settings.cashback.minBookingAmount} onChange={e=>upd('cashback.minBookingAmount', Number(e.target.value))} /></Field>
              <Field label="Credit to"><select value={settings.cashback.walletMode?'wallet':'credits'} onChange={e=>upd('cashback.walletMode', e.target.value==='wallet')} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm"><option value="wallet">Wallet</option><option value="credits">Safar Credits</option></select></Field>
            </Section>

            <Section title="Membership (Future)">
              <Field label="Enabled"><Toggle checked={settings.membership.enabled} onChange={v=>upd('membership.enabled', v)} label="Enable membership subscriptions" /></Field>
              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                {settings.membership.tiers.map((m, i) => (
                  <div key={m.name} className="rounded-xl border p-3 bg-secondary/30">
                    <div className="font-display font-bold">{m.name}</div>
                    <Field label="₹ / month"><Input type="number" value={m.pricePerMonth} onChange={e=>{const tiers=[...settings.membership.tiers]; tiers[i]={...tiers[i], pricePerMonth:Number(e.target.value)}; upd('membership.tiers', tiers);}} /></Field>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Commission Rules">
              <Field label="Default Host Commission (%)"><Input type="number" value={settings.commission.hostCommissionPct} onChange={e=>upd('commission.hostCommissionPct', Number(e.target.value))} /></Field>
            </Section>
            <Section title="Refund Rules">
              <Field label="Auto-approve refunds"><Toggle checked={settings.refund.autoApprove} onChange={v=>upd('refund.autoApprove', v)} label="Approve without manual review" /></Field>
              <Field label="Refund Window (days)"><Input type="number" value={settings.refund.refundWindowDays} onChange={e=>upd('refund.refundWindowDays', Number(e.target.value))} /></Field>
              <Field label="Cancellation Fee (%)"><Input type="number" value={settings.refund.cancellationFeePct} onChange={e=>upd('refund.cancellationFeePct', Number(e.target.value))} /></Field>
            </Section>
            <Section title="Tax Rules">
              <Field label="GST Enabled"><Toggle checked={settings.tax.gstEnabled} onChange={v=>upd('tax.gstEnabled', v)} label="Charge GST" /></Field>
              <Field label="GST %"><Input type="number" value={settings.tax.gstPct} onChange={e=>upd('tax.gstPct', Number(e.target.value))} /></Field>
              <Field label="Tax Inclusive"><Toggle checked={settings.tax.taxInclusive} onChange={v=>upd('tax.taxInclusive', v)} label="Prices are tax-inclusive" /></Field>
            </Section>
            <Section title="Public Website Display">
              <Field label="Show Rewards Section"><Toggle checked={settings.publicDisplay.showRewards} onChange={v=>upd('publicDisplay.showRewards', v)} label="On homepage & rewards page" /></Field>
              <Field label="Show Referral Section"><Toggle checked={settings.publicDisplay.showReferral} onChange={v=>upd('publicDisplay.showReferral', v)} label="On homepage" /></Field>
              <Field label="Show Promotions"><Toggle checked={settings.publicDisplay.showPromotions} onChange={v=>upd('publicDisplay.showPromotions', v)} label="On homepage" /></Field>
              <Field label="Show Cashback Offers"><Toggle checked={settings.publicDisplay.showCashback} onChange={v=>upd('publicDisplay.showCashback', v)} label="On homepage" /></Field>
              <Field label="Show Loyalty Program"><Toggle checked={settings.publicDisplay.showLoyalty} onChange={v=>upd('publicDisplay.showLoyalty', v)} label="On homepage" /></Field>
            </Section>

            <div className="flex justify-end gap-3 sticky bottom-4">
              <Button onClick={save} disabled={saving} className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold shadow-lg">
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                Save All Rules
              </Button>
            </div>
          </div>
        )}

        {!loading && tab==='promo' && (
          <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-4">Create Promotion</div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Title"><Input value={newPromo.title} onChange={e=>setNewPromo({...newPromo, title:e.target.value})} placeholder="Diwali Flash Sale" /></Field>
                <Field label="Badge"><Input value={newPromo.badge} onChange={e=>setNewPromo({...newPromo, badge:e.target.value})} placeholder="Limited Offer" /></Field>
                <Field label="Description"><Input value={newPromo.description} onChange={e=>setNewPromo({...newPromo, description:e.target.value})} placeholder="Save up to 20% on beach stays" /></Field>
                <Field label="Category">
                  <select value={newPromo.category} onChange={e=>setNewPromo({...newPromo, category:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm">
                    <option value="general">General</option>
                    <option value="festival">Festival</option>
                    <option value="flash">Flash Sale</option>
                    <option value="limited">Limited</option>
                    <option value="category">Category</option>
                  </select>
                </Field>
                <Field label="Audience">
                  <select value={newPromo.audience} onChange={e=>setNewPromo({...newPromo, audience:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm">
                    <option value="traveler">Travelers</option>
                    <option value="host">Hosts</option>
                    <option value="all">Everyone</option>
                  </select>
                </Field>
                <Field label="Discount Type">
                  <select value={newPromo.discountType} onChange={e=>setNewPromo({...newPromo, discountType:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm">
                    <option value="percent">Percentage</option><option value="flat">Flat amount</option>
                  </select>
                </Field>
                <Field label="Discount Value"><Input type="number" value={newPromo.discountValue} onChange={e=>setNewPromo({...newPromo, discountValue:Number(e.target.value)})} /></Field>
                <Field label="CTA Text"><Input value={newPromo.ctaText} onChange={e=>setNewPromo({...newPromo, ctaText:e.target.value})} /></Field>
                <Field label="CTA Link"><Input value={newPromo.ctaHref} onChange={e=>setNewPromo({...newPromo, ctaHref:e.target.value})} /></Field>
              </div>
              <div className="mt-4 flex justify-end"><Button onClick={createPromo} className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Plus className="size-4 mr-2" /> Create Promotion</Button></div>
            </div>

            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-4">All Promotions ({promos.length})</div>
              {promos.length===0 ? <div className="text-sm text-muted-foreground py-6 text-center">No promotions yet.</div> :
                <div className="space-y-2">
                  {promos.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{p.title} <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ml-2 bg-secondary">{p.badge}</span></div>
                        <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{p.discountValue}{p.discountType==='percent'?'%':' ₹'} · {p.audience} · {p.category}</div>
                      </div>
                      <button onClick={()=>togglePromo(p)} className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${p.active?'bg-emerald-50 text-emerald2 border-emerald-200':'bg-secondary text-muted-foreground border-border'}`}>{p.active?'Active':'Inactive'}</button>
                      <button onClick={()=>removePromo(p.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-full"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        )}

        {!loading && tab==='coupons' && (
          <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-4">Create Coupon</div>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Code"><Input value={newCoupon.code} onChange={e=>setNewCoupon({...newCoupon, code:e.target.value.toUpperCase()})} placeholder="SAFAR50" /></Field>
                <Field label="Title"><Input value={newCoupon.title} onChange={e=>setNewCoupon({...newCoupon, title:e.target.value})} placeholder="Save 50% on first booking" /></Field>
                <Field label="Description"><Input value={newCoupon.description} onChange={e=>setNewCoupon({...newCoupon, description:e.target.value})} /></Field>
                <Field label="Discount Type">
                  <select value={newCoupon.discountType} onChange={e=>setNewCoupon({...newCoupon, discountType:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm">
                    <option value="percent">Percentage</option><option value="flat">Flat amount</option>
                  </select>
                </Field>
                <Field label="Discount Value"><Input type="number" value={newCoupon.discountValue} onChange={e=>setNewCoupon({...newCoupon, discountValue:Number(e.target.value)})} /></Field>
                <Field label="Min Booking (₹)"><Input type="number" value={newCoupon.minBooking} onChange={e=>setNewCoupon({...newCoupon, minBooking:Number(e.target.value)})} /></Field>
                <Field label="Max Discount (₹)"><Input type="number" value={newCoupon.maxDiscount} onChange={e=>setNewCoupon({...newCoupon, maxDiscount:Number(e.target.value)})} /></Field>
                <Field label="Usage Limit (0=∞)"><Input type="number" value={newCoupon.usageLimit} onChange={e=>setNewCoupon({...newCoupon, usageLimit:Number(e.target.value)})} /></Field>
                <Field label="Per User Limit"><Input type="number" value={newCoupon.perUserLimit} onChange={e=>setNewCoupon({...newCoupon, perUserLimit:Number(e.target.value)})} /></Field>
                <Field label="Public"><Toggle checked={newCoupon.isPublic} onChange={v=>setNewCoupon({...newCoupon, isPublic:v})} label="Show on public offers page" /></Field>
              </div>
              <div className="mt-4 flex justify-end"><Button onClick={createCoupon} className="rounded-full bg-emerald2 hover:bg-emerald2-deep"><Plus className="size-4 mr-2" /> Create Coupon</Button></div>
            </div>

            <div className="rounded-3xl border bg-white p-6">
              <div className="font-display text-lg font-bold mb-4">All Coupons ({coupons.length})</div>
              {coupons.length===0 ? <div className="text-sm text-muted-foreground py-6 text-center">No coupons yet.</div> :
                <div className="space-y-2">
                  {coupons.map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-bold">{c.code} <span className="text-xs font-normal font-sans text-muted-foreground ml-2">{c.title}</span></div>
                        <div className="text-[11px] text-muted-foreground mt-1">{c.discountValue}{c.discountType==='percent'?'%':' ₹'} · min ₹{c.minBooking} · max ₹{c.maxDiscount||'∞'} · used {c.usedCount}/{c.usageLimit||'∞'}</div>
                      </div>
                      <button onClick={()=>toggleCoupon(c)} className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${c.active?'bg-emerald-50 text-emerald2 border-emerald-200':'bg-secondary text-muted-foreground border-border'}`}>{c.active?'Active':'Inactive'}</button>
                      <button onClick={()=>removeCoupon(c.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-full"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        )}

        {!loading && tab==='analytics' && analytics && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {l:'Total Bookings', v:analytics.totalBookings, i:Receipt},
              {l:'Total Revenue', v:`₹${(analytics.totalRevenue||0).toLocaleString('en-IN')}`, i:BadgeIndianRupee},
              {l:'Wallet Outstanding', v:`₹${(analytics.walletOutstanding||0).toLocaleString('en-IN')}`, i:Wallet},
              {l:'Wallet Issued (Lifetime)', v:`₹${(analytics.walletIssued||0).toLocaleString('en-IN')}`, i:Wallet},
              {l:'Credits Issued', v:(analytics.creditsIssued||0).toLocaleString('en-IN'), i:Coins},
              {l:'Credits Redeemed', v:(analytics.creditsRedeemed||0).toLocaleString('en-IN'), i:Coins},
              {l:'Credits Outstanding', v:(analytics.creditsOutstanding||0).toLocaleString('en-IN'), i:Coins},
              {l:'Coupon Uses', v:analytics.couponUses, i:Ticket},
              {l:'Cashback Issued', v:`₹${(analytics.cashbackIssued||0).toLocaleString('en-IN')}`, i:Gift},
              {l:'Active Promotions', v:analytics.activePromotions, i:Sparkles},
              {l:'Active Coupons', v:analytics.activeCoupons, i:Ticket},
              {l:'Travelers', v:analytics.travelerCount, i:Users},
            ].map(k => {
              const Ico = k.i;
              return (
                <div key={k.l} className="rounded-2xl border bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{k.l}</div>
                    <Ico className="size-4 text-emerald2" />
                  </div>
                  <div className="font-display text-2xl font-bold mt-2">{k.v}</div>
                </div>
              );
            })}
            <div className="md:col-span-2 lg:col-span-4 rounded-2xl border bg-white p-5">
              <div className="font-display text-lg font-bold mb-3">Loyalty Distribution</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Bronze','Silver','Gold','Platinum'].map(t => (
                  <div key={t} className="rounded-xl border p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t}</div>
                    <div className="font-display text-2xl font-bold mt-1">{(analytics.loyaltyDistribution||{})[t] || 0}</div>
                    <div className="text-[11px] text-muted-foreground">travelers</div>
                  </div>
                ))}
              </div>
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
    <ProtectedRoute roles={['super_admin','admin']}>
      <RevenueEngineInner />
    </ProtectedRoute>
  );
}
