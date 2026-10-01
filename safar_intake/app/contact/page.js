'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send, MessageCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';

function App() {
  const [sent, setSent] = useState(false);
  const submit = (e) => { e.preventDefault(); setSent(true); toast.success('Message sent! We’ll reply within 24 hours.'); };
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container grid lg:grid-cols-2 gap-10">
        <div>
          <div className="text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold">Contact</div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-2">Let’s plan your journey</h1>
          <p className="mt-3 text-muted-foreground max-w-md">Have questions about a stay, transport or want to host with us? We’d love to hear from you.</p>
          <div className="mt-8 space-y-4">
            {[{i:Mail,t:'hello@safar.travel',s:'24/7 email support'},{i:Phone,t:'+91 90000 12345',s:'Mon–Sat · 10am–7pm IST'},{i:MapPin,t:'Boulevard Road, Srinagar',s:'Jammu & Kashmir, India'},{i:MessageCircle,t:'WhatsApp Concierge',s:'Instant trip help'}].map((c)=>{const I=c.i;return(
              <div key={c.t} className="flex items-center gap-4 p-4 rounded-2xl border bg-white"><div className="size-11 rounded-xl bg-gradient-emerald grid place-items-center text-white"><I className="size-5" /></div><div><div className="font-semibold">{c.t}</div><div className="text-xs text-muted-foreground">{c.s}</div></div></div>
            );})}
          </div>
        </div>
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-white shadow-xl p-8 self-start">
          <div className="flex items-center gap-2 text-emerald2"><Sparkles className="size-4" /><span className="text-xs uppercase tracking-wider font-semibold">Send us a message</span></div>
          <h2 className="font-display text-2xl font-bold mt-2">We reply within 24 hours.</h2>
          <div className="mt-5 space-y-3">
            <input required placeholder="Your name" className="w-full px-4 py-3 rounded-xl border" />
            <input required type="email" placeholder="Email address" className="w-full px-4 py-3 rounded-xl border" />
            <select className="w-full px-4 py-3 rounded-xl border bg-white"><option>I’m a traveler</option><option>I want to host</option><option>Press / partnerships</option></select>
            <textarea required rows={5} placeholder="Tell us how we can help" className="w-full px-4 py-3 rounded-xl border" />
            <Button type="submit" className="w-full h-12 rounded-2xl bg-gradient-emerald font-semibold">{sent ? 'Sent ✓' : (<>Send message <Send className="size-4 ml-2" /></>)}</Button>
          </div>
        </motion.form>
      </div>
      <div className="h-16" />
      <Footer />
    </main>
  );
}
export default App;
