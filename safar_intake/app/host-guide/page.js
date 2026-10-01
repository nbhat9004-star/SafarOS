import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';

export const metadata = { title: 'Host Listing Guide — Safar', description: 'Step-by-step guide to list your property on Safar Kashmir.' };

export default function HostGuidePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-20 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Host Listing Guide</h1>
        <p className="text-muted-foreground mt-3 text-lg">Everything you need to know to list your property on Safar Kashmir.</p>
        
        <div className="mt-12 space-y-10">
          <section>
            <h2 className="font-display text-2xl font-bold">How to List a Single Property</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>1. Click "Add Listing" from your host dashboard</p>
              <p>2. Select your property type (houseboat, hotel, homestay, cottage)</p>
              <p>3. Fill in basic details: name, location, description</p>
              <p>4. Upload at least 5 high-quality photos</p>
              <p>5. Add amenities and services you provide</p>
              <p>6. Set your nightly price in INR</p>
              <p>7. Submit for admin approval (usually within 24 hours)</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">How to List Multiple Properties</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>If you manage a hotel or multiple properties:</p>
              <p>1. Enable "Multi-Type Inventory" in the pricing step</p>
              <p>2. Add each room/property type (e.g., Standard Room, Deluxe Suite)</p>
              <p>3. Set individual prices and quantities for each type</p>
              <p>4. Guests can choose from available types when booking</p>
              <p>5. Each type can have its own pricing and availability</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">How to List Experiences</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>1. Select "Experience" or "Tour" as your category</p>
              <p>2. Describe what guests will do (e.g., shikara ride, trekking, cooking class)</p>
              <p>3. Include duration, meeting point, and what's included</p>
              <p>4. Set per-person pricing</p>
              <p>5. Add photos showing the experience in action</p>
              <p>6. Specify maximum group size</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">Photo Requirements</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p><strong>Minimum:</strong> 5 photos per listing</p>
              <p><strong>Recommended:</strong> 8-12 photos showing different angles and features</p>
              <p><strong>Quality:</strong> High resolution, well-lit, clear focus</p>
              <p><strong>What to show:</strong> Exterior, interior rooms, amenities, views, surrounding area</p>
              <p><strong>Avoid:</strong> Blurry images, dark photos, cluttered spaces</p>
              <p><strong>Pro tip:</strong> First photo is your main listing image - make it count!</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">Pricing Tips</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p><strong>Research competitors:</strong> Check similar properties in your area</p>
              <p><strong>Season matters:</strong> Peak season (May-Aug) can be 30-50% higher</p>
              <p><strong>Start competitive:</strong> Lower initial pricing builds reviews faster</p>
              <p><strong>Factor in costs:</strong> Remember the 10% platform fee</p>
              <p><strong>Update regularly:</strong> Adjust pricing based on demand and bookings</p>
              <p><strong>Suggested ranges:</strong></p>
              <p>• Budget homestay: INR 1,500 - 2,500/night</p>
              <p>• Mid-range houseboat: INR 3,000 - 6,000/night</p>
              <p>• Premium hotel room: INR 5,000 - 12,000/night</p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
