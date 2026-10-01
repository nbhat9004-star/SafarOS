import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';

export const metadata = { title: 'Host Tips — Safar', description: 'Expert tips to maximize bookings and create great guest experiences.' };

export default function HostTipsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-20 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Host Tips</h1>
        <p className="text-muted-foreground mt-3 text-lg">Proven strategies to attract more guests and earn better reviews.</p>
        
        <div className="mt-12 space-y-10">
          <section>
            <h2 className="font-display text-2xl font-bold">Better Photos</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p><strong>Golden hour photography:</strong> Shoot during early morning or late afternoon for natural, warm lighting</p>
              <p><strong>Clean and declutter:</strong> Remove personal items, organize spaces before photographing</p>
              <p><strong>Show the view:</strong> If you have mountain or lake views, make them prominent</p>
              <p><strong>Wide angles:</strong> Use wide-angle shots to show room size accurately</p>
              <p><strong>Detail shots:</strong> Include close-ups of unique features (handcrafted furniture, traditional decor)</p>
              <p><strong>Before and after:</strong> Show seasonal variations if relevant (summer gardens, winter snow)</p>
              <p><strong>Hire a photographer:</strong> Professional photos increase bookings by 40% on average</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">Better Descriptions</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p><strong>Start with benefits:</strong> Lead with what makes your property special</p>
              <p><strong>Be specific:</strong> Instead of "nice view" say "180° panoramic view of Dal Lake"</p>
              <p><strong>Mention nearby attractions:</strong> List distances to popular spots (Gulmarg 50km, Mughal Gardens 5km)</p>
              <p><strong>Highlight amenities:</strong> WiFi, hot water, heater, traditional Kashmiri meals</p>
              <p><strong>Tell a story:</strong> Share history or cultural significance of your property</p>
              <p><strong>Set expectations:</strong> Be honest about limitations (no AC, shared bathroom, etc.)</p>
              <p><strong>Use keywords:</strong> Include search terms travelers use (houseboat, shikara, trekking base)</p>
              <p><strong>Keep it concise:</strong> 150-300 words is ideal, break into short paragraphs</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">Pricing Strategy</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p><strong>Dynamic pricing:</strong> Adjust rates based on season, weekends, and local events</p>
              <p><strong>Early bird discounts:</strong> Offer 10-15% off for bookings made 30+ days ahead</p>
              <p><strong>Minimum stay pricing:</strong> Higher nightly rate for 1-2 nights, discount for week-long stays</p>
              <p><strong>Last-minute deals:</strong> Fill empty dates by reducing prices 3-7 days before</p>
              <p><strong>Competitive analysis:</strong> Check competitor pricing weekly and adjust accordingly</p>
              <p><strong>Value additions:</strong> Justify higher pricing with unique offerings (airport pickup, guided tours)</p>
              <p><strong>Seasonal peaks:</strong> May-August is peak season - increase rates by 30-50%</p>
              <p><strong>Festival pricing:</strong> Major festivals (Eid, Tulip Festival) command premium rates</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">Guest Communication</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p><strong>Quick responses:</strong> Reply to inquiries within 2 hours when possible</p>
              <p><strong>Be proactive:</strong> Message guests before arrival with check-in details and local tips</p>
              <p><strong>Welcome personally:</strong> Greet guests on arrival, offer traditional Kahwa tea</p>
              <p><strong>Share local knowledge:</strong> Recommend restaurants, taxi services, hidden spots tourists miss</p>
              <p><strong>Check-in smoothly:</strong> Provide clear directions, be flexible with arrival times</p>
              <p><strong>Regular check-ins:</strong> Ask if they need anything without being intrusive</p>
              <p><strong>Handle issues fast:</strong> Address complaints immediately, offer solutions or refunds if needed</p>
              <p><strong>Request reviews:</strong> After checkout, politely ask satisfied guests to leave a review</p>
              <p><strong>Stay available:</strong> Share WhatsApp number for easy communication during stay</p>
            </div>
          </section>

          <section className="bg-secondary/50 rounded-2xl p-6 mt-8">
            <h3 className="font-display text-xl font-bold">Pro Tips from Top Hosts</h3>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>• "I increased bookings 60% by adding 'Free shikara ride' to my listing" - Houseboat owner, Srinagar</p>
              <p>• "Professional photos paid for themselves in 2 weeks" - Homestay host, Gulmarg</p>
              <p>• "Quick responses are key - I respond within 30 minutes and my booking rate is 85%" - Hotel manager, Pahalgam</p>
              <p>• "I created a welcome booklet with local recommendations. Guests love it and mention it in reviews" - Cottage owner, Sonamarg</p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
