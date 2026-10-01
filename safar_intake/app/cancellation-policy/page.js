import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';

export const metadata = { title: 'Cancellation Policy — Safar' };

export default function CancellationPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-20 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Cancellation & Refund Policy</h1>
        <p className="text-muted-foreground mt-3">Last updated: June 2026</p>
        
        <div className="mt-12 space-y-10">
          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Booking Types</h2>
            <div className="space-y-4">
              <div className="p-5 rounded-xl border bg-white">
                <h3 className="font-bold text-lg text-emerald2">Flexible Booking</h3>
                <p className="text-sm text-muted-foreground mt-2">Cancel up to 24 hours before check-in for a full refund. Cancellations within 24 hours: 50% refund. No-shows: no refund.</p>
              </div>
              <div className="p-5 rounded-xl border bg-white">
                <h3 className="font-bold text-lg">Moderate Booking</h3>
                <p className="text-sm text-muted-foreground mt-2">Cancel up to 5 days before check-in for a full refund. Cancellations 2-4 days before: 50% refund. Within 48 hours or no-shows: no refund.</p>
              </div>
              <div className="p-5 rounded-xl border bg-white">
                <h3 className="font-bold text-lg">Non-Refundable</h3>
                <p className="text-sm text-muted-foreground mt-2">Lowest price, no cancellations. Full payment charged immediately. No refunds for any reason except host cancellation.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Refund Timeline</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>Processing time:</strong> Refunds are initiated within 2 business days of cancellation approval.</p>
              <p><strong>Bank transfer:</strong> 5-7 business days to reflect in your account.</p>
              <p><strong>UPI/Wallet:</strong> 2-3 business days.</p>
              <p><strong>Credit/Debit card:</strong> 7-10 business days depending on your bank.</p>
              <p>Original payment method is used for all refunds. Platform fees (if any) are non-refundable.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Host Cancellations</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>If a host cancels your confirmed booking, you receive a full refund within 24 hours plus a 10% credit for your next booking.</p>
              <p>Safar will assist in finding alternative accommodation of equal or better quality at no additional cost if available.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Force Majeure</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>In cases of natural disasters, government travel restrictions, or other unforeseeable circumstances beyond anyone's control:</p>
              <p>• Bookings can be rescheduled without penalty to any available dates within 12 months</p>
              <p>• Full refunds available if rescheduling isn't possible</p>
              <p>• Documentation may be required for verification</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">How to Cancel</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>1. Log in to your Safar account</p>
              <p>2. Go to "My Bookings" in your traveler dashboard</p>
              <p>3. Select the booking you wish to cancel</p>
              <p>4. Click "Cancel Booking" and confirm</p>
              <p>5. Refund (if applicable) will be processed automatically based on the cancellation policy</p>
              <p>For assistance, contact support at hello@safar.travel or call +91-XXXXXXXXX</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Disputes</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>If you believe your cancellation should be treated as an exception, contact our support team within 24 hours of the incident with relevant documentation.</p>
              <p>All disputes are reviewed within 48 hours. Safar's decision on refund eligibility is final.</p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
