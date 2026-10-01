// Shared SEO Guide layout. Server component. Reuses existing Safar Navbar, Footer,
// PropertyCard, AIAssistantFloating and Tailwind/typography. No new UI system.

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, MessageCircle, MapPin, ArrowRight, Check, HelpCircle } from 'lucide-react';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import PropertyCard from '@/components/safar/PropertyCard';
import AIAssistantFloating from '@/components/safar/AIAssistantFloating';
import { Button } from '@/components/ui/button';
import { IMG, LISTINGS } from '@/lib/data';

export default function GuideLayout({ guide }) {
  const heroImg = IMG[guide.heroImageKey] || IMG.dal2;
  const listings = (guide.listingIds || [])
    .map((id) => LISTINGS.find((l) => l.id === id))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* HERO — reuses About-page hero pattern */}
      <section className="relative h-[58vh] min-h-[420px] overflow-hidden">
        <Image
          src={heroImg}
          alt={guide.h1}
          fill
          priority
          sizes="100vw"
          quality={75}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative h-full container flex flex-col justify-end pb-14 text-white">
          <div className="text-gold text-xs uppercase tracking-[0.18em] font-semibold">
            {guide.eyebrow}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-3 leading-[1.02] max-w-4xl">
            {guide.h1}
          </h1>
          <p className="mt-4 text-white/85 text-base md:text-lg max-w-3xl">
            {guide.description}
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="container py-14 md:py-16 max-w-4xl">
        <h2 className="font-display text-3xl font-bold mb-4">Overview</h2>
        <p className="text-muted-foreground text-[15px] leading-relaxed">{guide.intro}</p>
      </section>

      {/* LISTINGS — reuse PropertyCard */}
      {listings.length > 0 && (
        <section className="container pb-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">
                Recommended on Safar
              </div>
              <h2 className="font-display text-3xl font-bold mt-2">Top picks for this guide</h2>
            </div>
            {guide.exploreLink && (
              <Link
                href={guide.exploreLink}
                className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-emerald2 hover:text-charcoal transition"
              >
                {guide.exploreLabel || 'See all'} <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {listings.map((item, i) => (
              <PropertyCard key={item.id} item={item} index={i} />
            ))}
          </div>
          {guide.exploreLink && (
            <div className="mt-8 md:hidden">
              <Link
                href={guide.exploreLink}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald2"
              >
                {guide.exploreLabel || 'See all'} <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* TRAVEL TIPS */}
      <section className="container py-14 md:py-16 max-w-4xl">
        <h2 className="font-display text-3xl font-bold mb-6">Travel tips</h2>
        <ul className="space-y-3">
          {guide.tips.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl border bg-white"
            >
              <span className="mt-0.5 size-6 rounded-full bg-emerald-50 grid place-items-center shrink-0">
                <Check className="size-3.5 text-emerald2" />
              </span>
              <span className="text-sm md:text-[15px] text-charcoal/90 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="container py-14 md:py-16 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="size-5 text-emerald2" />
          <h2 className="font-display text-3xl font-bold">Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
          {guide.faqs.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl border bg-white">
              <div className="font-display font-semibold text-lg text-charcoal">{f.q}</div>
              <p className="mt-2 text-muted-foreground text-[15px] leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        {/* FAQ JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: guide.faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      </section>

      {/* CTAs — AI Planner + AI Concierge (reuses existing routes & button styles) */}
      <section className="container py-16">
        <div className="rounded-3xl overflow-hidden relative bg-charcoal text-white">
          <div className="aurora opacity-40" />
          <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-gold text-xs uppercase tracking-[0.18em] font-semibold">
                Plan smarter with Safar AI
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mt-3 leading-tight">
                Get a personalized Kashmir itinerary in 60 seconds
              </h3>
              <p className="mt-3 text-white/75 text-[15px] max-w-xl">
                Tell our AI your dates, group size and budget. Get a day-by-day plan with verified
                stays, transport and experiences — all bookable on Safar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
              <Button
                asChild
                size="lg"
                className="bg-gradient-emerald text-white hover:opacity-95"
              >
                <Link href="/ai-planner">
                  <Sparkles className="size-4 mr-1.5" /> Plan with AI
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white bg-white/5 hover:bg-white/15"
              >
                <Link href="/ai-planner?mode=concierge">
                  <MessageCircle className="size-4 mr-1.5" /> Ask AI Concierge
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Related explore link */}
      {guide.exploreLink && (
        <section className="container pb-20">
          <div className="flex items-center justify-between flex-wrap gap-4 p-6 rounded-2xl border bg-white">
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-emerald2" />
              <div>
                <div className="font-display font-semibold text-charcoal">
                  {guide.exploreLabel || 'Explore more on Safar'}
                </div>
                <div className="text-xs text-muted-foreground">Verified Kashmiri hosts · 24/7 support</div>
              </div>
            </div>
            <Link
              href={guide.exploreLink}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald2 hover:text-charcoal transition"
            >
              View listings <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

      <AIAssistantFloating />
      <Footer />
    </main>
  );
}
