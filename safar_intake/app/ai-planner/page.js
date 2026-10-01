'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Send, Sparkles, MapPin, Calendar, Wallet, Users, ArrowRight,
  Mountain, Camera, Coffee, Save, X, Mail, Phone, User, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { LISTINGS, AI_PROMPT_SUGGESTIONS, IMG } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { useSavedPlans, saveLead, getPlan } from '@/lib/safar-storage';

function PlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get('plan');
  const { user } = useAuth();
  const { plans, save: persistPlan } = useSavedPlans(user?.id);

  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Salaam! I’m your Kashmir AI concierge. Tell me your travel style, budget and dates — I’ll craft an unforgettable trip.' },
  ]);
  const [input, setInput] = useState('');
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(40000);
  const [travelers, setTravelers] = useState(2);
  const [showPlan, setShowPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Lead Capture modal state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [lead, setLead] = useState({ name: '', email: '', phone: '' });
  const [savingPlan, setSavingPlan] = useState(false);

  // Reopen a previously saved plan
  useEffect(() => {
    if (!planIdParam) return;
    const existing = getPlan(user?.id, planIdParam);
    if (existing) {
      setDays(existing.days || 5);
      setBudget(existing.budget || 40000);
      setTravelers(existing.travelers || 2);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowPlan(true);
      setMessages((m) => [
        ...m,
        { role: 'user', text: `Reopen “${existing.title}”` },
        { role: 'ai',   text: `Loaded your saved ${existing.days}-day plan for ${existing.travelers} traveler(s).` },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planIdParam, user?.id]);

  const send = async (txt) => {
    const q = (txt ?? input).trim();
    if (!q || isLoading) return;
    
    const userMessage = { role: 'user', text: q };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    try {
      // Call real Gemini AI API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${q}\n\nContext: Planning a ${days}-day trip for ${travelers} traveler(s) with a budget of ₹${budget.toLocaleString('en-IN')}.`,
          conversationHistory: messages.slice(-6), // Last 6 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setMessages([...next, { role: 'ai', text: data.reply }]);
      
      // Optionally show plan after certain keywords
      if (q.toLowerCase().includes('itinerary') || q.toLowerCase().includes('plan') || q.toLowerCase().includes('suggest')) {
        setShowPlan(true);
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      toast.error('Failed to get AI response. Please try again.');
      setMessages([...next, { role: 'ai', text: 'I apologize, but I am having trouble processing your request right now. Please try again in a moment.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const itinerary = [
    { day: 1, place: 'Srinagar', stay: LISTINGS[0], activity: 'Arrival + Sunset Shikara on Dal Lake', img: IMG.dal1 },
    { day: 2, place: 'Srinagar', stay: LISTINGS[0], activity: 'Mughal Gardens + Old City Heritage Walk', img: IMG.dal3 },
    { day: 3, place: 'Gulmarg', stay: LISTINGS[1], activity: 'Gondola Phase 1 & 2 + Snow play', img: IMG.cab1 },
    { day: 4, place: 'Pahalgam', stay: LISTINGS[2], activity: 'Aru & Betaab Valley + River walk', img: IMG.cot1 },
    { day: 5, place: 'Srinagar', stay: LISTINGS[5], activity: 'Wazwan Royal Feast + Departure', img: IMG.dal4 },
  ].slice(0, days);

  const total = itinerary.reduce((s, i) => s + i.stay.price, 0) + 4500;

  // ---- Save plan flow (Feature 1.3 + Feature 4 Lead Capture) ----
  const onClickSavePlan = () => {
    if (!showPlan) return;
    if (user) {
      // Logged in — skip lead capture, save directly
      doSavePlan({ name: user.name, email: user.email, phone: user.phone || '' });
    } else {
      // Not logged in — collect lead first
      setShowLeadModal(true);
    }
  };

  const doSavePlan = (leadData) => {
    setSavingPlan(true);
    try {
      // Persist lead (Feature 4) — only when a fresh lead form was filled
      if (!user && leadData?.email) {
        saveLead({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          source: 'ai-planner',
          context: { days, budget, travelers, total },
        });
      }
      // Persist plan (Feature 1.3)
      const slimItin = itinerary.map((d) => ({
        day: d.day, place: d.place, activity: d.activity,
        stayId: d.stay.id, stayTitle: d.stay.title, stayPrice: d.stay.price,
      }));
      persistPlan({
        title: `${days}-day Kashmir trip`,
        days, budget, travelers, total,
        itinerary: slimItin,
        lead: leadData?.email ? leadData : null,
      });
      toast.success(user ? 'Itinerary saved to your dashboard' : 'Itinerary saved! We’ll be in touch.');
      setShowLeadModal(false);
      setLead({ name: '', email: '', phone: '' });
    } catch (err) {
      toast.error('Could not save plan');
      console.error(err);
    } finally {
      setSavingPlan(false);
    }
  };

  const submitLead = (e) => {
    e?.preventDefault();
    if (!lead.name.trim() || !lead.email.trim() || !lead.phone.trim()) {
      toast.error('Please fill name, email and phone');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) {
      toast.error('Please enter a valid email');
      return;
    }
    doSavePlan(lead);
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald2 text-xs uppercase tracking-[0.18em] font-semibold"><Wand2 className="size-3.5" /> Safar AI Trip Planner</div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mt-2 leading-[1.05]">Plan your Kashmir trip <span className="gradient-text-emerald">in 30 seconds</span>.</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">Tell our AI your style and budget. We’ll match the right stays, transport, food and experiences — all bookable on Safar.</p>
          </div>
          {plans.length > 0 && (
            <Button asChild variant="outline" className="rounded-full font-semibold shrink-0">
              <Link href="/dashboard/traveler"><BookOpen className="size-4 mr-2" /> My saved plans ({plans.length})</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="container mt-10 grid lg:grid-cols-5 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border bg-white shadow-xl overflow-hidden h-[78vh] flex flex-col">
            <div className="px-5 py-4 bg-gradient-emerald text-white flex items-center gap-3">
              <div className="size-10 rounded-xl bg-white/15 grid place-items-center"><Wand2 className="size-5" /></div>
              <div><div className="font-display font-semibold">Safar AI · Concierge</div><div className="text-[11px] text-white/80">Demo mode · Mock responses</div></div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-secondary/40">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`whitespace-pre-line max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role==='user' ? 'bg-charcoal text-white rounded-br-md' : 'bg-white text-charcoal rounded-bl-md border'}`}>{m.text}</motion.div>
                </div>
              ))}
            </div>
            <div className="px-5 pt-3 flex flex-wrap gap-2">
              {AI_PROMPT_SUGGESTIONS.slice(0,4).map((s) => (
                <button key={s} onClick={()=>send(s)} className="text-[12px] px-3 py-1.5 rounded-full bg-secondary hover:bg-charcoal hover:text-white border transition">{s}</button>
              ))}
            </div>
            <div className="p-4 flex items-center gap-2 border-t">
              <input 
                value={input} 
                onChange={(e)=>setInput(e.target.value)} 
                onKeyDown={(e)=>e.key==='Enter' && !isLoading && send()} 
                placeholder={isLoading ? "AI is thinking..." : "Describe your dream Kashmir trip..."} 
                disabled={isLoading}
                className="flex-1 bg-secondary rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 disabled:opacity-50" 
              />
              <button 
                onClick={()=>send()} 
                disabled={isLoading}
                className="size-11 grid place-items-center rounded-full bg-gradient-emerald text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Sparkles className="size-4 animate-pulse" /> : <Send className="size-4" />}
              </button>
            </div>
          </div>

          {/* Quick Tuners */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Days', val: days, set: setDays, icon: Calendar, min:2, max:14 },
              { label: 'Budget (₹)', val: budget, set: setBudget, icon: Wallet, min:10000, max:200000, step:5000 },
              { label: 'Travelers', val: travelers, set: setTravelers, icon: Users, min:1, max:10 },
            ].map((c) => {
              const Ico = c.icon;
              return (
                <div key={c.label} className="p-3 rounded-2xl border bg-white">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground"><Ico className="size-3.5" /> {c.label}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <button onClick={()=>c.set(Math.max(c.min, c.val - (c.step||1)))} className="size-7 rounded-full border hover:bg-secondary">−</button>
                    <div className="font-display font-bold text-lg flex-1 text-center">{typeof c.val==='number' && c.val>=1000 ? c.val.toLocaleString('en-IN') : c.val}</div>
                    <button onClick={()=>c.set(Math.min(c.max, c.val + (c.step||1)))} className="size-7 rounded-full border hover:bg-secondary">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan output */}
        <div className="lg:col-span-3">
          <AnimatePresence>
            {showPlan && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="rounded-3xl border bg-white shadow-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-emerald2 font-semibold">AI-generated</div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold">Your {days}-day Kashmir itinerary</h2>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimated total</div>
                      <div className="font-display text-2xl font-bold gradient-text-emerald">₹{total.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {itinerary.map((d, i) => (
                      <motion.div key={d.day} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.07 }}
                        className="flex gap-4 p-3 rounded-2xl border bg-secondary/40 hover:bg-secondary transition">
                        <img src={d.img} className="size-20 md:size-24 rounded-xl object-cover" alt="" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-wider font-bold text-emerald2 bg-emerald-50 px-2 py-0.5 rounded-full">Day {d.day}</span><span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" />{d.place}</span></div>
                          <div className="font-display font-semibold mt-1.5">{d.activity}</div>
                          <div className="text-xs text-muted-foreground mt-1">Stay: {d.stay.title} · ₹{d.stay.price.toLocaleString('en-IN')}/night</div>
                        </div>
                        <Link href={`/property/${d.stay.id}`} className="self-center px-3 py-1.5 rounded-full bg-white border text-xs font-semibold hover:bg-charcoal hover:text-white transition">Book</Link>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={onClickSavePlan} disabled={savingPlan} className="rounded-full bg-gradient-emerald font-semibold">
                      <Save className="size-4 mr-2" /> {savingPlan ? 'Saving…' : 'Save plan'}
                    </Button>
                    <Button asChild variant="outline" className="rounded-full font-semibold"><Link href="/booking">Book entire trip <ArrowRight className="size-4 ml-2" /></Link></Button>
                    <Button variant="ghost" className="rounded-full font-semibold" onClick={()=>setShowPlan(false)}>Tweak with AI</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!showPlan && (
            <div className="rounded-3xl border bg-white shadow-xl p-10 text-center">
              <div className="size-16 mx-auto rounded-2xl bg-gradient-emerald grid place-items-center text-white"><Sparkles className="size-7" /></div>
              <h3 className="font-display text-2xl font-bold mt-4">Ask the AI to start</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">Try one of the suggestions on the left, or describe your trip in natural language. Your itinerary will appear here.</p>
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
                {[{i:Mountain,t:'Adventure'},{i:Camera,t:'Sightseeing'},{i:Coffee,t:'Cultural'}].map((c,k)=>{const I=c.i;return(
                  <div key={k} className="p-4 rounded-2xl border"><I className="size-5 mx-auto text-emerald2" /><div className="text-xs font-semibold mt-2">{c.t}</div></div>
                );})}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* LEAD CAPTURE MODAL — only shown for not-logged-in users when they tap Save */}
      <AnimatePresence>
        {showLeadModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-charcoal/60 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => !savingPlan && setShowLeadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b flex items-center justify-between bg-gradient-emerald text-white">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white/15 grid place-items-center"><Save className="size-5" /></div>
                  <div>
                    <div className="font-display font-bold">Save your itinerary</div>
                    <div className="text-[11px] text-white/80">We’ll email it and follow up only if you want.</div>
                  </div>
                </div>
                <button onClick={()=>setShowLeadModal(false)} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/15"><X className="size-4" /></button>
              </div>
              <form onSubmit={submitLead} className="p-5 space-y-3">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1"><User className="size-3" /> Name</span>
                  <input value={lead.name} onChange={(e)=>setLead({...lead, name: e.target.value})} required
                    className="mt-1 w-full px-4 py-2.5 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30" placeholder="Your full name" />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1"><Mail className="size-3" /> Email</span>
                  <input type="email" value={lead.email} onChange={(e)=>setLead({...lead, email: e.target.value})} required
                    className="mt-1 w-full px-4 py-2.5 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30" placeholder="you@example.com" />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1"><Phone className="size-3" /> Phone</span>
                  <input value={lead.phone} onChange={(e)=>setLead({...lead, phone: e.target.value})} required
                    className="mt-1 w-full px-4 py-2.5 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30" placeholder="+91 9XXXXXXXXX" />
                </label>
                <div className="pt-2 flex gap-2">
                  <Button type="button" variant="outline" className="rounded-full flex-1" onClick={()=>setShowLeadModal(false)} disabled={savingPlan}>Cancel</Button>
                  <Button type="submit" disabled={savingPlan} className="rounded-full flex-1 bg-emerald2 hover:bg-emerald2-deep">
                    {savingPlan ? 'Saving…' : 'Save plan'}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center pt-1">By saving, you agree to be contacted about your Kashmir trip.</p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <PlannerInner />
    </Suspense>
  );
}
