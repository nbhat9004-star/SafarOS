import Link from 'next/link';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { FileText, Mail, AlertTriangle, ShieldCheck, DollarSign, UserX } from 'lucide-react';
import { IMG } from '@/lib/data';

import { generateSafarMetadata } from '@/lib/metadata';

export const metadata = generateSafarMetadata({
  title: 'Terms of Service',
  description: 'Terms and conditions for using Safar Kashmir travel marketplace.',
  url: '/terms',
});

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden">
        <img src={IMG.mtn1} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative h-full container flex flex-col justify-end pb-14 text-white">
          <div className="text-gold text-xs uppercase tracking-[0.18em] font-semibold">Legal</div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mt-3 leading-[0.95] max-w-3xl">Terms of Service</h1>
          <p className="mt-4 text-white/80 text-lg max-w-2xl">The rules and guidelines for using Safar Kashmir.</p>
        </div>
      </section>

      <section className="container py-16 max-w-4xl">
        <div className="text-sm text-muted-foreground mb-8">Last updated: June 2025</div>

        <div className="space-y-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="size-6 text-emerald2" />
              <h2 className="font-display text-2xl font-bold">Agreement to Terms</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p>Welcome to Safar Kashmir ("Safar", "we", "us", or "our"). By accessing or using our travel marketplace platform, you agree to be bound by these Terms of Service ("Terms").</p>
              <p>If you do not agree to these Terms, please do not use our platform.</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="size-6 text-emerald2" />
              <h2 className="font-display text-2xl font-bold">Eligibility</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p>You must be at least 18 years old to use Safar. By using our platform, you represent and warrant that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are 18 years of age or older</li>
                <li>You have the legal capacity to enter into binding contracts</li>
                <li>You will provide accurate and complete information</li>
                <li>You will not violate any applicable laws or regulations</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">User Accounts</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Account Creation</h3>
                <p>You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Account Roles</h3>
                <p><strong>Travelers:</strong> Can search, book, and review listings.</p>
                <p><strong>Hosts:</strong> Can create listings, manage bookings, and provide services.</p>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Account Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and current information</li>
                  <li>Keep your password secure</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Do not share your account with others</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">For Travelers</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Bookings</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All bookings are subject to host approval</li>
                  <li>You must provide accurate booking information</li>
                  <li>You are responsible for reviewing listing details before booking</li>
                  <li>Booking confirmations will be sent via email</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Payment</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payment is required at the time of booking confirmation</li>
                  <li>Prices are displayed in Indian Rupees (INR)</li>
                  <li>Total price includes accommodations, service fees, and applicable taxes</li>
                  <li>Safar charges a 10% service fee on bookings</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Cancellations & Refunds</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Free cancellation up to 48 hours before check-in</li>
                  <li>Cancellations within 48 hours may incur charges</li>
                  <li>Refunds are processed within 7-10 business days</li>
                  <li>Host-specific cancellation policies may apply</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Guest Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Treat properties with respect</li>
                  <li>Follow house rules set by hosts</li>
                  <li>Report any issues or damages immediately</li>
                  <li>Leave properties in good condition</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">For Hosts</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Listing Requirements</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete listing information</li>
                  <li>Use high-quality, authentic photos of your property</li>
                  <li>Set reasonable pricing and availability</li>
                  <li>All listings are subject to admin approval</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Host Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Respond to booking requests within 24 hours</li>
                  <li>Honor confirmed bookings</li>
                  <li>Maintain property standards as described</li>
                  <li>Provide accurate availability information</li>
                  <li>Communicate clearly with travelers</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Payments to Hosts</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hosts receive 90% of booking price (10% platform fee)</li>
                  <li>Payments are processed after guest check-in</li>
                  <li>Payouts occur on a weekly basis</li>
                  <li>Hosts must provide valid payment information</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Host Cancellations</h3>
                <p>Hosts should not cancel confirmed bookings. Repeated cancellations may result in penalties or account suspension.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="size-6 text-rose-500" />
              <h2 className="font-display text-2xl font-bold">Prohibited Activities</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide false or misleading information</li>
                <li>Impersonate another person or entity</li>
                <li>Engage in fraudulent activities</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post inappropriate or offensive content</li>
                <li>Attempt to bypass or hack our systems</li>
                <li>Use the platform for illegal activities</li>
                <li>Scrape or collect data without permission</li>
                <li>Interfere with platform operations</li>
              </ul>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="size-6 text-emerald2" />
              <h2 className="font-display text-2xl font-bold">Fees & Taxes</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>Service Fee:</strong> Safar charges a 10% service fee on all bookings, paid by travelers.</p>
              <p><strong>Taxes:</strong> Applicable GST (12%) and other taxes are added to bookings.</p>
              <p><strong>Payment Processing:</strong> Additional payment processing fees may apply based on payment method.</p>
              <p><strong>Fee Changes:</strong> We reserve the right to modify fees with 30 days' notice.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Intellectual Property</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>All content on Safar, including text, graphics, logos, and software, is owned by Safar or our licensors and protected by intellectual property laws.</p>
              <p><strong>User Content:</strong> By posting content (listings, reviews, photos), you grant Safar a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on our platform.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Liability Limitations</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Safar acts as a marketplace connecting travelers and hosts. We are not responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The condition, quality, or safety of properties</li>
                <li>Accuracy of listing descriptions</li>
                <li>Actions or omissions of hosts or travelers</li>
                <li>Property damage or personal injury</li>
                <li>Disputes between hosts and travelers</li>
              </ul>
              <p><strong>Disclaimer:</strong> Our platform is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.</p>
              <p><strong>Limitation of Liability:</strong> To the maximum extent permitted by law, Safar's liability is limited to the amount paid for the specific booking in question.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Dispute Resolution</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>If disputes arise between users, we encourage direct resolution. Safar may provide assistance but is not obligated to mediate disputes.</p>
              <p>For disputes with Safar, please contact us at <a href="mailto:support@safarcurated.com" className="text-emerald2 hover:underline">support@safarcurated.com</a>. We will attempt to resolve issues amicably.</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <UserX className="size-6 text-rose-500" />
              <h2 className="font-display text-2xl font-bold">Account Termination</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>By You:</strong> You may delete your account at any time through your account settings.</p>
              <p><strong>By Safar:</strong> We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or pose risks to our community.</p>
              <p><strong>Effect of Termination:</strong> Upon termination, your access to the platform will be revoked. Active bookings will be honored according to cancellation policies.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Changes to Terms</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We may update these Terms from time to time. Changes will be posted on this page with an updated "Last updated" date. Continued use of Safar after changes constitutes acceptance of the new Terms.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Governing Law</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of courts in Jammu & Kashmir.</p>
            </div>
          </div>

          <div className="mt-12 p-6 rounded-2xl border bg-secondary/40">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="size-5 text-emerald2" />
              <h2 className="font-display text-xl font-bold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground mb-3">If you have questions about these Terms of Service, please contact us:</p>
            <div className="space-y-1 text-sm">
              <p><strong>Email:</strong> <a href="mailto:support@safarcurated.com" className="text-emerald2 hover:underline">support@safarcurated.com</a></p>
              <p><strong>Platform:</strong> Safar Kashmir</p>
              <p><strong>Service:</strong> Kashmir Travel Marketplace</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
