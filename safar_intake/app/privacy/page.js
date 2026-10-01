import Link from 'next/link';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Shield, Mail, Lock, Eye, Cookie, FileText } from 'lucide-react';
import { IMG } from '@/lib/data';

import { generateSafarMetadata } from '@/lib/metadata';

export const metadata = generateSafarMetadata({
  title: 'Privacy Policy',
  description: 'How Safar protects your data and privacy when booking Kashmir travel experiences.',
  url: '/privacy',
});

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden">
        <img src={IMG.dal1} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative h-full container flex flex-col justify-end pb-14 text-white">
          <div className="text-gold text-xs uppercase tracking-[0.18em] font-semibold">Legal</div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mt-3 leading-[0.95] max-w-3xl">Privacy Policy</h1>
          <p className="mt-4 text-white/80 text-lg max-w-2xl">How we collect, use, and protect your personal information.</p>
        </div>
      </section>

      <section className="container py-16 max-w-4xl">
        <div className="text-sm text-muted-foreground mb-8">Last updated: June 2025</div>

        <div className="space-y-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="size-6 text-emerald2" />
              <h2 className="font-display text-2xl font-bold">Introduction</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p>Safar Kashmir ("Safar", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our travel marketplace platform.</p>
              <p>By using Safar, you agree to the collection and use of information in accordance with this policy.</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="size-6 text-emerald2" />
              <h2 className="font-display text-2xl font-bold">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Account Information</h3>
                <p>When you create an account, we collect your name, email address, phone number, password, and role (traveler or host).</p>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Booking Information</h3>
                <p>When you make or receive bookings, we collect check-in/check-out dates, guest count, property details, pricing, and booking status.</p>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Host Listings</h3>
                <p>Hosts provide property details, photos, amenities, pricing, location, availability, and service offerings.</p>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Payment Information</h3>
                <p>We process payments securely. Payment card details are handled by third-party payment processors and are not stored on our servers.</p>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-2">Communications</h3>
                <p>We collect information when you contact us via email, support forms, or other communication channels.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="size-6 text-emerald2" />
              <h2 className="font-display text-2xl font-bold">How We Use Your Information</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>Service Delivery:</strong> To create and manage accounts, process bookings, facilitate host-traveler communication, and provide customer support.</p>
              <p><strong>Platform Operations:</strong> To maintain platform security, prevent fraud, enforce our Terms of Service, and improve our services.</p>
              <p><strong>Communications:</strong> To send booking confirmations, account updates, verification emails, and important service notifications.</p>
              <p><strong>Analytics:</strong> To understand how users interact with our platform and improve user experience.</p>
              <p><strong>Legal Compliance:</strong> To comply with legal obligations and respond to lawful requests from authorities.</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="size-6 text-emerald2" />
              <h2 className="font-display text-2xl font-bold">Data Security</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p>We implement industry-standard security measures to protect your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encrypted data transmission using HTTPS/TLS</li>
                <li>Secure password storage with bcrypt hashing</li>
                <li>JWT-based authentication for secure sessions</li>
                <li>Regular security audits and updates</li>
                <li>Restricted access to personal data</li>
              </ul>
              <p>However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="size-6 text-emerald2" />
              <h2 className="font-display text-2xl font-bold">Cookies & Tracking</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <p>We use cookies and similar tracking technologies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep you logged in to your account</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Improve user experience</li>
              </ul>
              <p>You can control cookie preferences through your browser settings.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Information Sharing</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Hosts & Travelers:</strong> Booking details necessary to fulfill reservations</li>
                <li><strong>Service Providers:</strong> Payment processors, email services, cloud hosting (with strict data protection agreements)</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights and safety</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Your Rights</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data</li>
              </ul>
              <p>To exercise these rights, contact us at <a href="mailto:support@safarcurated.com" className="text-emerald2 hover:underline">support@safarcurated.com</a>.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Data Retention</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We retain your personal information for as long as necessary to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide our services</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>
              <p>When you delete your account, we anonymize or delete your personal data within 30 days, except where retention is required by law.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Third-Party Links</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Children's Privacy</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Safar is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Changes to This Policy</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of Safar after changes constitutes acceptance of the updated policy.</p>
            </div>
          </div>

          <div className="mt-12 p-6 rounded-2xl border bg-secondary/40">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="size-5 text-emerald2" />
              <h2 className="font-display text-xl font-bold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground mb-3">If you have questions about this Privacy Policy or how we handle your data, please contact us:</p>
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
