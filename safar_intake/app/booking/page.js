'use client';
import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, CreditCard, Wallet, Calendar, Users, ShieldCheck, ChevronLeft, ChevronRight, PartyPopper, Mail, Download, Loader2, AlertTriangle, Sparkles, Zap, Coins, Star, Percent } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { LISTINGS } from '@/lib/data';
import { useListing, bookingsApi, useAvailability } from '@/lib/listings-api';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/safar/AuthModal';

const STEPS = ['Dates','Guests','Payment','Review','Confirmed'];

// Helpers
function ymdOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function rangeOverlaps(ciStr, coStr, ranges) {
  if (!ciStr || !coStr) return null;
  const ci = new Date(ciStr), co = new Date(coStr);
  if (isNaN(ci) || isNaN(co) || co <= ci) return null;
  for (const r of ranges) {
    const rci = new Date(r.checkInDate), rco = new Date(r.checkOutDate);
    if (rci < co && rco > ci) return r;
  }
  return null;
}

function BookingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = params.get('id') || params.get('listingId');
  const typeId = params.get('typeId');
  const { listing } = useListing(listingId || '');
  const { bookedRanges } = useAvailability(listingId);
  // Fallback to demo data if no listingId (preview mode)
  const fallback = LISTINGS[0];
  
  // Find selected type if typeId is provided
  const selectedType = (listing && typeId && listing.inventoryTypes?.length > 0) 
    ? listing.inventoryTypes.find(t => t.id === typeId) 
    : null;
  
  const item = listing ? {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    price: selectedType ? selectedType.price : listing.price,
    guests: listing.guests,
    image: selectedType?.images?.[0] || (listing.images && listing.images[0]) || fallback.image,
    typeName: selectedType?.name || null,
  } : fallback;

  const [step, setStep] = useState(0);
  const [pay, setPay] = useState('online');
  const [guests, setGuests] = useState(Number(params.get('guests')) || 2);
  // Dates — prefer URL params, otherwise default 7 → 11 days out (real, modifiable state)
  const [checkIn, setCheckIn] = useState(params.get('checkIn') || ymdOffset(7));
  const [checkOut, setCheckOut] = useState(params.get('checkOut') || ymdOffset(11));
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [emailingSending, setEmailSending] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showVerificationError, setShowVerificationError] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  // Module 11 — dynamic revenue rules (booking fee + online-pay discount)
  const [revenueCfg, setRevenueCfg] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/public/rewards-config');
        const j = await r.json();
        if (j?.ok) setRevenueCfg(j);
      } catch {}
    })();
  }, []);
  const todayStr = ymdOffset(0);

  // Derived values from actual state
  const validRange = !!(checkIn && checkOut && new Date(checkOut) > new Date(checkIn));
  const nights = useMemo(() => {
    if (!validRange) return 0;
    return Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
  }, [checkIn, checkOut, validRange]);
  const subtotal = item.price * nights;
  const tax = Math.round(subtotal * 0.12);
  const total = subtotal + tax + (nights > 0 ? 800 : 0);
  const conflict = useMemo(() => rangeOverlaps(checkIn, checkOut, bookedRanges), [checkIn, checkOut, bookedRanges]);
  const canContinueDates = validRange && !conflict;
  const maxGuests = item.guests || 30;

  // Email invoice handler
  const handleEmailInvoice = async () => {
    if (!bookingId) {
      toast.error('No booking ID available');
      return;
    }
    if (!user) {
      toast.error('Please log in to send invoice');
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/send-invoice`, { 
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Invoice email sent successfully!');
      } else {
        toast.error(data.error || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Email invoice error:', error);
      toast.error('Failed to send invoice email');
    } finally {
      setEmailSending(false);
    }
  };

  // Resend verification email handler
  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }

    setResendingVerification(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification email sent successfully. Please check your inbox and spam folder.');
        setShowVerificationError(false);
      } else {
        toast.error(data.error || 'Unable to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Unable to send verification email. Please try again.');
    } finally {
      setResendingVerification(false);
    }
  };


  // Download PDF handler
  const handleDownloadPDF = () => {
    if (!bookingId) {
      toast.error('No booking ID available');
      return;
    }
    if (!user) {
      toast.error('Please log in to download invoice');
      return;
    }
    
    try {
      setPdfGenerating(true);
      
      const invoiceData = {
        bookingId: bookingId,
        title: item.title,
        location: item.location,
        checkIn: fmt(checkIn),
        checkOut: fmt(checkOut),
        guests: guests,
        nights: nights,
        subtotal: subtotal,
        tax: tax,
        total: total,
        userName: user?.name || 'Guest',
        userEmail: user?.email || ''
      };

      // Generate styled HTML invoice
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoiceData.bookingId.slice(0, 8).toUpperCase()}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1f2937; }
    .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(to right, #10b981, #059669); color: white; border-radius: 12px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; }
    .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f9fafb; border-radius: 8px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: 600; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { width: 150px; color: #6b7280; font-size: 14px; }
    .info-value { flex: 1; font-weight: 500; font-size: 14px; }
    .payment-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .payment-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .payment-table .label { color: #6b7280; }
    .payment-table .amount { text-align: right; font-weight: 500; }
    .total-row { background: #f9fafb; font-weight: 600; font-size: 18px; }
    .total-row .amount { color: #10b981; }
    .footer { text-align: center; margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; color: #6b7280; font-size: 14px; }
    @media print { body { margin: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>SAFAR KASHMIR</h1>
    <p>Tax Invoice</p>
  </div>

  <div class="invoice-meta">
    <div>
      <strong>Invoice #${invoiceData.bookingId.slice(0, 8).toUpperCase()}</strong><br>
      <span style="color: #6b7280;">Date: ${new Date().toLocaleDateString('en-IN')}</span>
    </div>
    <div style="text-align: right;">
      <strong>Booking ID</strong><br>
      <span style="color: #6b7280;">${invoiceData.bookingId}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Guest Information</div>
    <div class="info-row">
      <div class="info-label">Name</div>
      <div class="info-value">${invoiceData.userName}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Email</div>
      <div class="info-value">${invoiceData.userEmail}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Booking Details</div>
    <div class="info-row">
      <div class="info-label">Property</div>
      <div class="info-value">${invoiceData.title}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Location</div>
      <div class="info-value">${invoiceData.location}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Check-in</div>
      <div class="info-value">${invoiceData.checkIn}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Check-out</div>
      <div class="info-value">${invoiceData.checkOut}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Guests</div>
      <div class="info-value">${invoiceData.guests}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Nights</div>
      <div class="info-value">${invoiceData.nights}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Summary</div>
    <table class="payment-table">
      <tr>
        <td class="label">Subtotal</td>
        <td class="amount">INR ${invoiceData.subtotal.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td class="label">GST (12%)</td>
        <td class="amount">INR ${invoiceData.tax.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td class="label">Service Fee</td>
        <td class="amount">INR 800</td>
      </tr>
      <tr class="total-row">
        <td class="label">TOTAL</td>
        <td class="amount">INR ${invoiceData.total.toLocaleString('en-IN')}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p><strong>Thank you for booking with Safar Kashmir!</strong></p>
    <p>For support, visit ${typeof window !== 'undefined' ? window.location.origin : ''}</p>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Print Invoice</button>
  </div>
</body>
</html>`;

      // Open HTML in new window
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice opened in new tab!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container">
        <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Booking</div>
        <h1 className="font-display text-3xl md:text-5xl font-bold mt-2">Confirm and pay</h1>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto scroll-hide">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`size-8 rounded-full grid place-items-center text-xs font-bold ${i<=step ? 'bg-gradient-emerald text-white shadow' : 'bg-secondary text-muted-foreground'}`}>{i<step ? <Check className="size-4" /> : i+1}</div>
              <div className={`text-sm font-medium ${i<=step ? 'text-charcoal' : 'text-muted-foreground'}`}>{s}</div>
              {i < STEPS.length-1 && <div className={`w-10 h-px ${i<step ? 'bg-emerald2' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="container mt-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-white shadow-xl p-6 md:p-8">
            {step === 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Calendar className="size-5 text-emerald2" /> Select dates</h2>
                <p className="text-sm text-muted-foreground mt-1">Choose your check-in and check-out. Dates that overlap an existing booking will be flagged.</p>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="p-4 rounded-2xl border cursor-pointer hover:border-emerald2 transition">
                    <div className="text-[10px] uppercase tracking-wider font-semibold">Check-in</div>
                    <input
                      type="date"
                      min={todayStr}
                      value={checkIn}
                      onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value && checkOut <= e.target.value) setCheckOut(''); }}
                      className="w-full text-base mt-1 font-semibold outline-none bg-transparent [color-scheme:light]"
                    />
                  </label>
                  <label className="p-4 rounded-2xl border cursor-pointer hover:border-emerald2 transition">
                    <div className="text-[10px] uppercase tracking-wider font-semibold">Check-out</div>
                    <input
                      type="date"
                      min={checkIn || todayStr}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-base mt-1 font-semibold outline-none bg-transparent [color-scheme:light]"
                    />
                  </label>
                </div>

                {validRange && !conflict && (
                  <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald2 text-sm flex items-center gap-2">
                    <Check className="size-4" />
                    Available · {nights} {nights === 1 ? 'night' : 'nights'} · {fmt(checkIn)} → {fmt(checkOut)}
                  </div>
                )}
                {conflict && (
                  <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">These dates are not available</div>
                      <div className="text-xs">Conflicts with a {conflict.status} booking from {fmt(conflict.checkInDate)} to {fmt(conflict.checkOutDate)}.</div>
                    </div>
                  </div>
                )}
                {!validRange && checkIn && checkOut && (
                  <div className="mt-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    Check-out must be after check-in.
                  </div>
                )}

                {/* Booked dates summary so traveler knows what's taken */}
                {bookedRanges.length > 0 && (
                  <div className="mt-5">
                    <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Already booked</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {bookedRanges.slice(0, 8).map((r, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary text-charcoal/80 border">
                          {fmt(r.checkInDate)} → {fmt(r.checkOutDate)}
                        </span>
                      ))}
                      {bookedRanges.length > 8 && <span className="text-[11px] text-muted-foreground">+{bookedRanges.length - 8} more</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Users className="size-5 text-emerald2" /> Guests</h2>
                <p className="text-sm text-muted-foreground mt-1">{item.guests ? `This listing accommodates up to ${item.guests} guests.` : 'Tell us your group size.'}</p>
                <div className="mt-5 space-y-3">
                  {['Adults','Children','Infants'].map((g,i)=>(
                    <div key={g} className="flex items-center justify-between p-4 rounded-2xl border">
                      <div><div className="font-semibold">{g}</div><div className="text-xs text-muted-foreground">{i===0?'Age 13+':i===1?'Age 2–12':'Under 2'}</div></div>
                      <div className="flex items-center gap-3">
                        <button onClick={()=>i===0 && setGuests(Math.max(1,guests-1))} className="size-9 rounded-full border hover:bg-secondary transition disabled:opacity-40" disabled={i!==0}>−</button>
                        <div className="w-6 text-center font-semibold">{i===0?guests:0}</div>
                        <button onClick={()=>i===0 && setGuests(Math.min(maxGuests, guests+1))} className="size-9 rounded-full border hover:bg-secondary transition disabled:opacity-40" disabled={i!==0 || guests >= maxGuests}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                {guests >= maxGuests && item.guests && (
                  <div className="mt-3 text-xs text-amber-700">Maximum guest count for this listing reached.</div>
                )}
              </div>
            )}

            {step === 2 && (() => {
              // Module 11 — dynamic payment options driven by revenue-settings
              const bfCfg = revenueCfg?.bookingFee || { enabled: true, mode: 'flat', flat: 99, percent: 5 };
              const opCfg = revenueCfg?.onlinePayDiscount || { enabled: true, percent: 3 };
              const bookingFeeAmt = bfCfg.mode === 'percent'
                ? Math.max(bfCfg.flat || 0, Math.round((total * (bfCfg.percent || 0)) / 100))
                : (bfCfg.flat || 99);
              const discountPct = opCfg.enabled ? (opCfg.percent || 0) : 0;
              const onlineDiscount = Math.round((total * discountPct) / 100);
              const onlineFinal = total - onlineDiscount;
              const showOptionA = bfCfg.enabled !== false;
              return (
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-emerald2" />
                    <h2 className="font-display text-2xl font-bold">Secure your reservation</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Choose the option that works best for you.</p>

                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    {/* OPTION A — Pay Booking Fee */}
                    {showOptionA && (
                      <button
                        type="button"
                        onClick={() => setPay('bookingfee')}
                        className={`text-left p-5 md:p-6 rounded-3xl border-2 transition relative touch-manipulation ${pay==='bookingfee' ? 'border-emerald-600 bg-emerald-50/50 shadow-md' : 'border-border hover:border-emerald-300 bg-white'}`}
                      >
                        <div className="absolute -top-3 left-4 flex flex-wrap gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">Most Popular</span>
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald2">
                            <Zap className="size-2.5 inline mr-1" />Instant
                          </span>
                        </div>
                        <div className={`size-11 rounded-xl grid place-items-center ${pay==='bookingfee'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald2'}`}>
                          <Wallet className="size-5" />
                        </div>
                        <div className="font-display font-bold text-xl mt-4">Pay Booking Fee</div>
                        <p className="text-xs text-muted-foreground mt-1">Reserve instantly with a small booking fee.</p>
                        <div className="mt-4 rounded-xl bg-white border p-3">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Booking fee today</div>
                          <div className="font-display text-3xl font-bold text-emerald2 mt-0.5">₹{bookingFeeAmt.toLocaleString('en-IN')}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">Balance ₹{(total - bookingFeeAmt).toLocaleString('en-IN')} due at check-in</div>
                        </div>
                        <ul className="mt-4 space-y-1.5 text-xs">
                          {[
                            'Booking confirmed immediately',
                            'Booking fee adjusted in final payment',
                            'Refundable per cancellation policy',
                            'Earn Safar Credits',
                          ].map((b) => (
                            <li key={b} className="flex items-start gap-2"><Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" /><span>{b}</span></li>
                          ))}
                        </ul>
                      </button>
                    )}

                    {/* OPTION B — Pay Full Online */}
                    <button
                      type="button"
                      onClick={() => setPay('online')}
                      className={`text-left p-5 md:p-6 rounded-3xl border-2 transition relative touch-manipulation ${pay==='online' ? 'border-emerald-600 bg-emerald-50/50 shadow-md' : 'border-border hover:border-emerald-300 bg-white'}`}
                    >
                      <div className="absolute -top-3 left-4 flex flex-wrap gap-2">
                        {discountPct > 0 && (
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                            <Percent className="size-2.5 inline mr-1" />Save {discountPct}%
                          </span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-700">
                          <Coins className="size-2.5 inline mr-1" />Max Credits
                        </span>
                      </div>
                      <div className={`size-11 rounded-xl grid place-items-center ${pay==='online'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald2'}`}>
                        <CreditCard className="size-5" />
                      </div>
                      <div className="font-display font-bold text-xl mt-4">Pay Full Online</div>
                      <p className="text-xs text-muted-foreground mt-1">Pay the complete booking amount today.</p>
                      <div className="mt-4 rounded-xl bg-white border p-3 text-sm space-y-1">
                        <div className="flex justify-between text-muted-foreground"><span>Accommodation</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                        {discountPct > 0 && (
                          <div className="flex justify-between text-amber-700 font-semibold"><span>Online payment discount ({discountPct}%)</span><span>−₹{onlineDiscount.toLocaleString('en-IN')}</span></div>
                        )}
                        <div className="flex justify-between font-bold pt-1.5 border-t"><span>Final price</span><span className="text-emerald2 font-display text-lg">₹{onlineFinal.toLocaleString('en-IN')}</span></div>
                      </div>
                      <ul className="mt-4 space-y-1.5 text-xs">
                        {[
                          'Instant confirmation',
                          discountPct > 0 ? `${discountPct}% online payment discount` : 'Preferred payment method',
                          'Maximum Safar Credits earned',
                          'Fastest refund processing',
                        ].map((b) => (
                          <li key={b} className="flex items-start gap-2"><Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" /><span>{b}</span></li>
                        ))}
                      </ul>
                    </button>
                  </div>

                  {pay==='online' && (
                    <div className="mt-6 grid sm:grid-cols-2 gap-3">
                      <input placeholder="Card number" className="px-4 py-3 rounded-xl border text-sm sm:col-span-2 touch-manipulation" />
                      <input placeholder="MM / YY" className="px-4 py-3 rounded-xl border text-sm touch-manipulation" />
                      <input placeholder="CVC" className="px-4 py-3 rounded-xl border text-sm touch-manipulation" />
                    </div>
                  )}
                  {pay==='bookingfee' && (
                    <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                      <Star className="size-4 mt-0.5 shrink-0" />
                      <div>
                        You'll pay <b>₹{bookingFeeAmt.toLocaleString('en-IN')}</b> today to lock in your reservation.
                        The remaining <b>₹{(total - bookingFeeAmt).toLocaleString('en-IN')}</b> is due at check-in and adjustable towards
                        your final invoice. Full refund per the cancellation policy.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {step === 3 && (
              <div>
                <h2 className="font-display text-2xl font-bold">Review your booking</h2>
                <div className="mt-5 flex gap-4 p-4 rounded-2xl border">
                  <img src={item.image} alt="" className="size-24 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="font-display font-semibold">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.location}</div>
                    <div className="text-xs mt-1">{fmt(checkIn)} → {fmt(checkOut)} · {guests} {guests === 1 ? 'guest' : 'guests'} · {pay==='online'?'Pay full online':'Pay booking fee'}</div>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-2xl border bg-secondary/40 text-sm space-y-2">
                  <div className="flex justify-between"><span>₹{item.price.toLocaleString('en-IN')} × {nights} {nights === 1 ? 'night' : 'nights'}</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Cleaning fee</span><span>₹800</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Taxes</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-bold pt-2 border-t"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                </div>
                <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald2 mt-0.5" /> Free cancellation until 48h before check-in. Your card is charged only on confirm.</div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="size-20 rounded-full bg-gradient-emerald text-white grid place-items-center mx-auto shadow-2xl"><PartyPopper className="size-10" /></motion.div>
                <h2 className="font-display text-3xl font-bold mt-5">Payment secured 🔒</h2>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Your payment has been securely received by Safar Curated. We are now contacting the best available host for {item.title} · {fmt(checkIn)} — {fmt(checkOut)}. Your payment will only be released after the booking is confirmed according to platform rules.</p>
                <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
                  <Button variant="outline" className="rounded-full" onClick={handleEmailInvoice} disabled={emailingSending}>
                    {emailingSending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Mail className="size-4 mr-2" />} 
                    {emailingSending ? 'Sending...' : 'Email invoice'}
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={handleDownloadPDF} disabled={pdfGenerating}>
                    {pdfGenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
                    {pdfGenerating ? 'Generating...' : 'Download PDF'}
                  </Button>
                  <Button asChild className="rounded-full bg-gradient-emerald"><Link href="/dashboard/traveler">Go to dashboard</Link></Button>
                </div>
                <div className="mt-8 max-w-md mx-auto text-left rounded-2xl border bg-secondary/40 p-5">
                  <div className="text-[10px] uppercase tracking-wider text-emerald2 font-semibold">Email preview</div>
                  <div className="font-display font-bold mt-1">✨ Welcome to Safar, your Kashmir trip is on!</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Booking #{(bookingId || '').slice(0,8) || `SF-${Math.floor(100000+Math.random()*900000)}`} · {item.title} · {fmt(checkIn)} → {fmt(checkOut)} · ₹{total.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}

            {step < 4 && (
              <div className="mt-8">
                {/* Email Verification Error Alert */}
                {showVerificationError && (
                  <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900">Please verify your email address before continuing.</p>
                        <p className="text-xs text-amber-700 mt-1">Check your inbox for the verification email we sent when you registered.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resendingVerification}
                          onClick={handleResendVerification}
                          className="mt-3 rounded-full border-amber-300 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                        >
                          {resendingVerification ? (
                            <>
                              <Loader2 className="size-3 animate-spin mr-2" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="size-3 mr-2" />
                              Resend Verification Email
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between">
                <Button variant="outline" className="rounded-full" onClick={()=>setStep(Math.max(0,step-1))} disabled={step === 0}><ChevronLeft className="size-4 mr-1" /> Back</Button>
                <Button
                  disabled={submitting || (step === 0 && !canContinueDates)}
                  className="rounded-full bg-emerald2 hover:bg-emerald2-deep font-semibold px-6 disabled:opacity-50"
                  onClick={async ()=>{
                    if (step !== 3) { setStep(step+1); return; }
                    // ── Payment-first booking flow (Razorpay) ─────────────────
                    if (!user) { setShowAuth(true); return; }
                    if (!listingId) { toast.error('No listing selected. Pick a stay from Explore first.'); return; }
                    if (!canContinueDates) { toast.error('Please pick valid, available dates.'); setStep(0); return; }
                    if (!total || total <= 0) { toast.error('Invalid amount. Please refresh and try again.'); return; }

                    setSubmitting(true);
                    try {
                      // 1) Load Razorpay checkout script (idempotent — no-op if already there)
                      await new Promise((resolve, reject) => {
                        if (typeof window === 'undefined') return reject(new Error('No window'));
                        if (window.Razorpay) return resolve();
                        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
                        if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay'))); return; }
                        const s = document.createElement('script');
                        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                        s.async = true;
                        s.onload = resolve;
                        s.onerror = () => reject(new Error('Failed to load Razorpay Checkout. Please check your connection.'));
                        document.body.appendChild(s);
                      });

                      // 2) Create Razorpay order (server-side) BEFORE any booking
                      const orderRes = await fetch('/api/payments/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          amount: total,
                          currency: 'INR',
                          purpose: 'booking',
                          refId: listingId,
                          notes: {
                            listingTitle: item.title,
                            checkInDate: checkIn,
                            checkOutDate: checkOut,
                            guests,
                            inventoryTypeId: typeId || '',
                          },
                        }),
                      });
                      const orderData = await orderRes.json().catch(() => ({}));
                      if (!orderRes.ok || !orderData?.ok) {
                        setSubmitting(false);
                        toast.error(orderData?.error || 'Could not initialise payment. Please try again.');
                        return;
                      }
                      const { orderId, keyId, amount: rzpAmount, currency } = orderData;

                      // 3) Open Razorpay Checkout — customer MUST pay before booking is created.
                      await new Promise((resolveCheckout) => {
                        const rzp = new window.Razorpay({
                          key: keyId,
                          order_id: orderId,
                          amount: rzpAmount * 100,
                          currency,
                          name: 'Safar Curated',
                          description: item.title,
                          image: '/logo.png',
                          prefill: {
                            name: user?.name || '',
                            email: user?.email || '',
                          },
                          notes: { listingId, checkInDate: checkIn, checkOutDate: checkOut, guests },
                          theme: { color: '#0F3D2E' },
                          modal: {
                            ondismiss: () => {
                              setSubmitting(false);
                              toast('Payment cancelled — you were not charged.', { icon: '⚠️' });
                              resolveCheckout();
                            },
                          },
                          handler: async (response) => {
                            try {
                              // 4) Verify signature server-side (proves payment authenticity)
                              const verifyRes = await fetch('/api/payments/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                  razorpay_order_id: response.razorpay_order_id,
                                  razorpay_payment_id: response.razorpay_payment_id,
                                  razorpay_signature: response.razorpay_signature,
                                }),
                              });
                              const verifyData = await verifyRes.json().catch(() => ({}));
                              if (!verifyRes.ok || !verifyData?.ok || !verifyData?.verified) {
                                setSubmitting(false);
                                toast.error(verifyData?.error || 'Payment verification failed. Please contact support.');
                                resolveCheckout();
                                return;
                              }

                              // 5) ONLY NOW create the booking — payment is held by Safar Curated.
                              const { ok: bOk, data: bData } = await bookingsApi.create({
                                listingId,
                                checkInDate: checkIn,
                                checkOutDate: checkOut,
                                guests,
                                inventoryTypeId: typeId || null,
                                paymentId: response.razorpay_payment_id,
                                paymentOrderId: response.razorpay_order_id,
                              });
                              if (!bOk) {
                                setSubmitting(false);
                                const errorMsg = bData?.error || 'Booking creation failed after payment. Our team will resolve within 24 hours.';
                                if (errorMsg.toLowerCase().includes('verify your email')) {
                                  setShowVerificationError(true);
                                }
                                toast.error(errorMsg);
                                resolveCheckout();
                                return;
                              }
                              setBookingId(bData.booking.bookingId);
                              toast.success('Payment secured. Your booking request has been sent to the host.');
                              setStep(4);
                              setSubmitting(false);
                              resolveCheckout();
                            } catch (e) {
                              setSubmitting(false);
                              toast.error('Something went wrong finalising your booking. Please contact support with your payment ID.');
                              resolveCheckout();
                            }
                          },
                        });
                        rzp.on('payment.failed', (resp) => {
                          setSubmitting(false);
                          toast.error(resp?.error?.description || 'Payment failed. Please try again.');
                          resolveCheckout();
                        });
                        rzp.open();
                      });
                    } catch (e) {
                      setSubmitting(false);
                      toast.error(e?.message || 'Could not open Razorpay Checkout. Please try again.');
                    }
                  }}
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : (<>{step===3?'Confirm & Pay':'Continue'} <ChevronRight className="size-4 ml-1" /></>)}
                </Button>
                </div>
              </div>
            )}
            <AuthModal open={showAuth} defaultMode="login" onClose={()=>setShowAuth(false)} />
          </motion.div>
        </div>

        {/* Summary */}
        <aside>
          <div className="lg:sticky lg:top-28 rounded-3xl border bg-white shadow-xl p-5">
            <img src={item.image} className="w-full aspect-[4/3] rounded-2xl object-cover" alt="" />
            <div className="mt-4 font-display font-bold">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.location}</div>
            <div className="mt-4 text-sm space-y-2">
              <div className="flex justify-between"><span>Dates</span><span className="font-medium">{fmt(checkIn)} — {fmt(checkOut)}</span></div>
              <div className="flex justify-between"><span>Nights</span><span className="font-medium">{nights}</span></div>
              <div className="flex justify-between"><span>Guests</span><span className="font-medium">{guests}</span></div>
              <div className="flex justify-between"><span>Payment</span><span className="font-medium">{pay==='online'?'Online':'On arrival'}</span></div>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-bold"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          </div>
        </aside>
      </div>
      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald2" />
      </main>
    }>
      <BookingContent />
    </Suspense>
  );
}
