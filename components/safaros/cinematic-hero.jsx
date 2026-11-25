'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Check, Globe2, MessageCircle, Plane, Sparkles, Users, Zap, TrendingUp, MapPinned, Wallet } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

function DashboardPreview() {
  const metrics = [
    { label: 'Bookings', value: '128', delta: '+12.8%', icon: CalendarDays },
    { label: 'Revenue', value: '₹24,80,000', delta: '+22%', icon: Wallet },
    { label: 'Trips', value: '56', delta: '+18%', icon: MapPinned },
    { label: 'Customers', value: '423', delta: '+21%', icon: Users },
  ];
  const bars = [18,28,24,42,35,48,43,61,56,74,69,88];
  return (
    <motion.div initial={{opacity:0,y:35,rotate:1.5}} animate={{opacity:1,y:0,rotate:0}} transition={{delay:.25,duration:.9,ease:EASE}} className="safar-wow-dashboard">
      <div className="safar-wow-dash-top">
        <div className="flex items-center gap-2.5"><span className="safar-wow-mini-mark">S</span><div><b>SafarOS</b><small>AGENCY WORKSPACE</small></div></div>
        <div className="flex items-center gap-2"><span className="safar-wow-live"><i/> Live workspace</span><span className="safar-wow-avatar">A</span></div>
      </div>
      <div className="safar-wow-dash-body">
        <aside className="safar-wow-sidebar">
          {['Dashboard','Bookings','Customers','Itineraries','WhatsApp','Operations','Reports'].map((label,i)=><div key={label} className={i===0?'active':''}><span>{['▦','▣','♙','⌖','◉','◇','▥'][i]}</span>{label}</div>)}
          <div className="safar-wow-sidebar-bottom">⚙ &nbsp; Settings</div>
        </aside>
        <div className="safar-wow-dash-content">
          <div className="flex items-start justify-between gap-3"><div><span className="safar-wow-muted">Tuesday, 25 November 2026</span><h3>Good evening, Alex 👋</h3><p>Here’s what’s happening with your travel business.</p></div><span className="safar-wow-agency">◉ <span>Travel Valley<br/>Agency</span>⌄</span></div>
          <div className="safar-wow-metrics">{metrics.map(({label,value,delta,icon:Icon})=><div key={label}><span className="safar-wow-metric-icon"><Icon/></span><small>{label}</small><b>{value}</b><em>↗ {delta}</em></div>)}</div>
          <div className="safar-wow-chart-card"><div className="flex items-center justify-between"><b>Business performance</b><small>Last 12 months⌄</small></div><div className="safar-wow-chart"><div className="safar-wow-ylabels"><span>₹30L</span><span>₹20L</span><span>₹10L</span><span>₹0</span></div><svg viewBox="0 0 620 150" preserveAspectRatio="none" role="img" aria-label="Revenue trend rising over twelve months"><defs><linearGradient id="safarArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a64dff" stopOpacity=".38"/><stop offset="1" stopColor="#a64dff" stopOpacity="0"/></linearGradient></defs>{[25,65,105,145].map(y=><line key={y} x1="0" x2="620" y1={y} y2={y} stroke="#8295c8" strokeOpacity=".16" strokeDasharray="4 5"/>)}<path d="M0 126 C40 116 45 98 82 104 S130 70 166 85 S205 94 248 65 S298 78 330 60 S385 77 420 45 S470 64 500 31 S560 45 620 10 L620 150 L0 150Z" fill="url(#safarArea)"/><path d="M0 126 C40 116 45 98 82 104 S130 70 166 85 S205 94 248 65 S298 78 330 60 S385 77 420 45 S470 64 500 31 S560 45 620 10" fill="none" stroke="#b45cff" strokeWidth="3" strokeLinecap="round"/></svg></div><div className="safar-wow-months"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span></div></div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CinematicHero() {
  return (
    <section className="safar-wow-hero relative overflow-hidden px-4 pb-20 pt-28 sm:px-7 sm:pt-32 lg:px-10">
      <div className="safar-wow-sky"/>
      <div className="safar-wow-stars"/>
      <svg className="safar-wow-landscape" viewBox="0 0 1600 570" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs><linearGradient id="mountainA" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#d4d8ff"/><stop offset=".42" stopColor="#6678b9"/><stop offset="1" stopColor="#101c49"/></linearGradient><linearGradient id="lakeA" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#324e83"/><stop offset="1" stopColor="#081431"/></linearGradient></defs>
        <path d="M0 280 130 170 230 250 370 80 500 235 640 100 790 250 930 92 1070 245 1210 115 1360 245 1480 150 1600 230V570H0Z" fill="url(#mountainA)" opacity=".68"/>
        <path d="m0 355 150-105 130 80 150-170 155 165 130-105 150 110 140-145 130 130 145-90 120 95 100-70v220H0Z" fill="#182b5a"/>
        <path d="M0 410q230-34 420 4t380-4 400 3 400-2v159H0Z" fill="url(#lakeA)"/>
        <path d="M0 448q240-28 460 7t430-5 390 4 320-2" fill="none" stroke="#a5c9ff" strokeOpacity=".24" strokeWidth="3"/>
        <path d="M0 478q250-22 470 5t430-3 390 3 310-2" fill="none" stroke="#a5c9ff" strokeOpacity=".16" strokeWidth="2"/>
      </svg>
      <div className="safar-wow-horizon-glow"/>
      <div className="safar-wow-plane"><Plane/></div>
      <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-9 lg:grid-cols-[.82fr_1.18fr] lg:gap-8">
        <div className="safar-wow-copy">
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.6}} className="safar-wow-kicker"><Sparkles/> TRAVEL AGENCY OPERATING SYSTEM</motion.div>
          <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1,duration:.75,ease:EASE}}>Run &amp; grow your travel business with <span>SafarOS</span></motion.h1>
          <motion.p initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.7}}>All-in-one platform to manage bookings, customers, teams, operations and WhatsApp communication — built for modern travel agencies.</motion.p>
          <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:.3,duration:.7}} className="mt-7 flex flex-wrap gap-3">
            <a href="/signup" className="safar-wow-cta safar-wow-hero-cta">Start Free Trial <ArrowRight/></a>
            <a href="#demo" className="safar-wow-watch"><span>▶</span> Watch Demo <small>(2 min)</small></a>
          </motion.div>
          <div className="safar-wow-proof"><span><Check/> No credit card</span><span><Check/> Setup in minutes</span><span><Check/> Full access</span></div>
        </div>
        <DashboardPreview/>
      </div>
      <div className="safar-wow-stats"><div><Users/><b>500+</b><small>Travel Agencies</small></div><div><CalendarDays/><b>50,000+</b><small>Bookings Monthly</small></div><div><MessageCircle/><b>10M+</b><small>WhatsApp Messages</small></div><div><Globe2/><b>15+</b><small>Countries</small></div><div><Zap/><b>99.9%</b><small>Uptime</small></div></div>
      <div className="safar-wow-scroll-cue">SCROLL TO EXPLORE <span/></div>
    </section>
  );
}
