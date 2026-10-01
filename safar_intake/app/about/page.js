import Link from 'next/link';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Mountain, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { IMG, STATS } from '@/lib/data';

import { generateSafarMetadata } from '@/lib/metadata';

export const metadata = generateSafarMetadata({
  title: 'About Safar',
  description: 'Authentic Kashmir tourism, built with locals for travelers. Discover our mission to showcase real Kashmir experiences.',
  url: '/about',
  image: '/og-about.jpg',
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
        <img src={IMG.mtn1} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative h-full container flex flex-col justify-end pb-14 text-white">
          <div className="text-gold text-xs uppercase tracking-[0.18em] font-semibold">About Safar</div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mt-3 leading-[0.95] max-w-3xl">Built in the valley. Made for travelers.</h1>
          <p className="mt-4 text-white/80 text-lg max-w-2xl">Safar is a marketplace for authentic Kashmir stays, transport and experiences — powered by AI and curated by locals.</p>
        </div>
      </section>
      
      <section className="container py-20 grid md:grid-cols-3 gap-6">
        {[{i:Mountain,t:'Local-first',d:'Every listing is owned and run by Kashmiris — ensuring authenticity and direct income for hosts.'},{i:Sparkles,t:'AI-powered',d:'From itinerary planning to stay comparisons, Safar AI saves hours of research.'},{i:ShieldCheck,t:'Trust & safety',d:'Verified hosts, secure payments and 24/7 support — wherever the road takes you.'}].map((c)=>{const I=c.i;return(
          <div key={c.t} className="p-7 rounded-3xl border bg-white"><I className="size-6 text-emerald2" /><div className="font-display text-xl font-bold mt-3">{c.t}</div><p className="text-sm text-muted-foreground mt-2">{c.d}</p></div>
        );})}
      </section>

      <section className="container py-16 max-w-4xl space-y-12">
        <div>
          <h2 className="font-display text-3xl font-bold mb-4">Our Story</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>Safar was born from a simple observation: Kashmir's beauty deserved better than generic travel platforms. Travelers wanted authentic experiences, not cookie-cutter tours. Hosts needed a platform that understood local context, not just transaction fees.</p>
            <p>Founded in 2024 by Kashmir natives and travel technology experts, we set out to build something different. A platform where AI enhances human connection rather than replacing it. Where technology serves the valley's rich culture and hospitality traditions.</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold mb-4">Our Mission</h2>
          <div className="space-y-3 text-muted-foreground">
            <p><strong>For Travelers:</strong> Discover the real Kashmir through curated stays and experiences. Plan confidently with AI assistance that understands local context, weather patterns, and cultural nuances.</p>
            <p><strong>For Hosts:</strong> Earn sustainable income while sharing culture and hospitality. Access tools that help showcase properties professionally and manage bookings efficiently.</p>
            <p><strong>For Kashmir:</strong> Drive tourism revenue directly to local families. Preserve cultural authenticity while building infrastructure that benefits the entire community.</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold mb-4">Supporting Local Kashmir</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>Every booking on Safar directly supports Kashmir's local economy. We work exclusively with Kashmir-based hosts—families running houseboats for generations, mountain guides born in the valleys, homestay owners in remote villages.</p>
            <p>Unlike global platforms where profits flow abroad, 90% of every booking stays in Kashmir. The remaining 10% platform fee covers operations and reinvestment: better photography for hosts, digital literacy programs, and technology that makes Kashmir more accessible.</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold mb-4">AI + Local Expertise</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>Our AI Trip Planner isn't just another chatbot. It's trained on years of Kashmir travel data, seasonal patterns, local festivals, weather conditions, and insider knowledge from hundreds of hosts and guides.</p>
            <p>But AI is just the starting point. Every recommendation connects to real people—verified hosts who've welcomed travelers for years, guides with decades of mountain experience, families who've run houseboats since their grandparents' time.</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold mb-4">Vision for the Future</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>We envision Kashmir as India's premier sustainable tourism destination—where technology and tradition coexist, where travelers discover authentic experiences, and where local communities thrive from tourism done right.</p>
            <p>In the next five years, we're building real-time translation tools, dynamic pricing for hosts, carbon-neutral travel options, and skills training programs. Kashmir remains our home, our inspiration, and our primary focus.</p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/50 py-16"><div className="container grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s)=>(<div key={s.label} className="text-center md:text-left"><div className="font-display text-3xl md:text-4xl font-bold gradient-text-emerald">{s.value}</div><div className="text-sm text-muted-foreground mt-1">{s.label}</div></div>))}
      </div></section>

      <section className="container py-20 text-center">
        <Heart className="size-7 text-rose-500 fill-rose-500 mx-auto" />
        <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 max-w-3xl mx-auto">Travel that gives back to the valley.</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">A part of every booking funds local skills training and youth tourism programs in Kashmir.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Button asChild className="rounded-full bg-gradient-emerald font-semibold"><Link href="/explore">Explore stays</Link></Button>
          <Button asChild variant="outline" className="rounded-full font-semibold"><Link href="/contact">Contact us</Link></Button>
        </div>
      </section>
      <Footer />
    </main>
  );
}
