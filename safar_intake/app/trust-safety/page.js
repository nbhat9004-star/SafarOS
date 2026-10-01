import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';

export const metadata = { title: 'Trust & Safety — Safar' };

export default function TrustSafetyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-20 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Trust & Safety</h1>
        <p className="text-muted-foreground mt-3">Your safety is our priority. Here's how we protect you.</p>
        
        <div className="mt-12 space-y-10">
          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Host Verification Process</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>Identity verification:</strong> All hosts must verify their identity with government-issued ID (Aadhaar, PAN, or Passport). Documents are verified by our team before any listing goes live.</p>
              <p><strong>Property verification:</strong> We conduct video verification or in-person inspections for all properties. Photos must accurately represent the space. Misleading listings are immediately removed.</p>
              <p><strong>Background checks:</strong> Hosts are screened for any history of fraud or safety violations. Continuous monitoring ensures ongoing compliance.</p>
              <p><strong>Review system:</strong> Travelers rate hosts after every stay. Hosts with consistent low ratings or safety complaints are investigated and may be removed from the platform.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Secure Payments</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>PCI-DSS compliant:</strong> All payment data is encrypted and processed through PCI-compliant payment gateways. We never store your full card details.</p>
              <p><strong>Payment protection:</strong> Funds are held securely and only released to hosts after you check in. If a booking is cancelled by the host, refunds are automatic and immediate.</p>
              <p><strong>Multiple payment options:</strong> Credit card, debit card, UPI, net banking, and digital wallets—all secured with industry-standard encryption.</p>
              <p><strong>Fraud prevention:</strong> Advanced AI monitors transactions for suspicious activity. Unusual patterns trigger additional verification steps.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Guest Protection</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>Listing accuracy guarantee:</strong> If your accommodation doesn't match the listing description, photos, or amenities promised, contact us within 24 hours of check-in for a full refund or rebooking assistance.</p>
              <p><strong>24/7 support:</strong> Our customer support team is available round the clock via phone, email, and WhatsApp for urgent issues or emergencies.</p>
              <p><strong>Emergency assistance:</strong> In case of safety concerns at your accommodation, we provide immediate assistance including relocation to verified alternative accommodation at no extra cost.</p>
              <p><strong>Dispute resolution:</strong> If issues arise with hosts, our mediation team investigates within 48 hours and makes fair decisions based on evidence from both parties.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Listing Quality Standards</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>Photo authenticity:</strong> All photos must be of the actual property. Stock images or misleading photos result in immediate delisting.</p>
              <p><strong>Accurate descriptions:</strong> Hosts must disclose all limitations (no hot water, shared bathrooms, noise levels, etc.). Omissions are grounds for refunds.</p>
              <p><strong>Minimum standards:</strong> Properties must meet basic safety requirements: working locks, clean bedding, functioning bathrooms, safe electrical systems.</p>
              <p><strong>Regular audits:</strong> We conduct surprise quality checks based on guest feedback. Properties failing standards are suspended until issues are resolved.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Privacy & Data Protection</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>Data encryption:</strong> All personal information is encrypted in transit and at rest. We use industry-standard SSL/TLS protocols.</p>
              <p><strong>Limited sharing:</strong> Your contact information is only shared with hosts after a confirmed booking. We never sell your data to third parties.</p>
              <p><strong>GDPR compliant:</strong> You can request data deletion, export your data, or update your information at any time through your account settings.</p>
              <p><strong>Secure storage:</strong> Data is stored on secure servers with regular backups. Access is restricted to authorized personnel only.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4">Fraud Prevention</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>AI monitoring:</strong> Machine learning algorithms detect unusual booking patterns, fake reviews, and suspicious listings.</p>
              <p><strong>Off-platform payments:</strong> Never pay hosts directly outside Safar. Off-platform transactions void all protections. Report any host requesting direct payment.</p>
              <p><strong>Phishing protection:</strong> Safar will never ask for your password via email or phone. All official communication comes from @safar.travel domains.</p>
              <p><strong>Report suspicious activity:</strong> If something feels wrong, report it immediately. Our team investigates all reports within 24 hours.</p>
            </div>
          </section>

          <section className="bg-secondary/50 rounded-2xl p-6">
            <h3 className="font-display text-xl font-bold mb-3">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">Contact our Trust & Safety team for any concerns:</p>
            <p className="text-sm"><strong>Email:</strong> safety@safar.travel</p>
            <p className="text-sm"><strong>Phone:</strong> +91-XXXXXXXXX (24/7)</p>
            <p className="text-sm"><strong>Response time:</strong> Urgent issues within 1 hour, general inquiries within 24 hours</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
