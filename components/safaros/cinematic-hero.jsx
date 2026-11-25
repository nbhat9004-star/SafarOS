'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, Plane, TrainFront, CarFront, MessageCircle, Bot, CalendarDays, Users, ChartNoAxesCombined, Sparkles } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

function VehicleScene() {
  return (
    <div className="safar-cinema-scene" aria-label="Animated travel scene with an airplane, train and car">
      <div className="safar-cinema-sky" />
      <div className="safar-cinema-stars" />
      <div className="safar-cinema-cloud cloud-one" />
      <div className="safar-cinema-cloud cloud-two" />
      <div className="safar-cinema-mountain mountain-back" />
      <div className="safar-cinema-mountain mountain-front" />
      <div className="safar-cinema-lake" />
      <div className="safar-cinema-village"><i /><i /><i /><i /><i /></div>
      <svg className="safar-cinema-flight-path" viewBox="0 0 1200 460" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="flightGlow" x1="0" x2="1"><stop stopColor="#22d3ee" stopOpacity="0"/><stop offset=".5" stopColor="#8b5cf6"/><stop offset="1" stopColor="#22d3ee" stopOpacity="0"/></linearGradient></defs>
        <path d="M-80 115 C230 10 390 170 620 90 S970 15 1280 80" fill="none" stroke="url(#flightGlow)" strokeWidth="2" strokeDasharray="7 12" opacity=".8"/>
        <g className="safar-plane">
          <g transform="translate(-42,-18)" fill="#f8fbff" stroke="#9bdcff" strokeWidth="1.2">
            <path d="M0 18 L42 10 L62 0 L68 2 L59 12 L94 17 L100 22 L59 23 L43 34 L38 33 L42 23 L0 21Z"/>
            <path d="M27 17 L40 2 L45 3 L40 18Z" fill="#b9d8ff"/>
          </g>
        </g>
      </svg>
      <div className="safar-rail-bridge"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
      <div className="safar-moving-train" aria-hidden="true">
        <div className="train-engine"><b /><b /><i /><i /></div>
        <div className="train-car"><b /><b /><i /><i /></div>
        <div className="train-car"><b /><b /><i /><i /></div>
        <div className="train-car"><b /><b /><i /><i /></div>
      </div>
      <div className="safar-road"><span className="road-lights" /></div>
      <div className="safar-moving-car" aria-hidden="true">
        <div className="car-shadow" />
        <div className="car-body"><i className="car-window" /><i className="car-headlight" /><i className="car-wheel wheel-a" /><i className="car-wheel wheel-b" /></div>
      </div>
      <div className="safar-cinema-reflection" />
    </div>
  );
}

export default function CinematicHero() {
  const sceneRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ['start start', 'end start'] });
  const cameraY = useTransform(scrollYProgress, [0, 1], [0, 145]);
  const cameraScale = useTransform(scrollYProgress, [0, 1], [1, 1.16]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  return (
    <section ref={sceneRef} className="safar-cinema-hero">
      <motion.div className="safar-cinema-world" style={{ y: cameraY, scale: cameraScale }}>
        <VehicleScene />
      </motion.div>
      <div className="safar-cinema-vignette" />
      <motion.div className="safar-cinema-content" style={{ y: contentY }}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: EASE }} className="safar-cinema-kicker">
          <Sparkles size={14} /> THE OPERATING SYSTEM FOR TRAVEL BUSINESSES
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12, duration: .9, ease: EASE }}>
          Every journey.<br /><span>One powerful command centre.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24, duration: .8, ease: EASE }}>
          Move enquiries, bookings, people and operations forward — all from SafarOS.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .36, duration: .8, ease: EASE }} className="safar-cinema-actions">
          <button onClick={() => document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' })} className="safar-cinema-primary">Start your journey <ArrowRight size={17}/></button>
          <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="safar-cinema-secondary"><Play size={15} fill="currentColor"/> Explore SafarOS</button>
        </motion.div>
        <div className="safar-cinema-proof"><span><i/> Bookings & itineraries</span><span><i/> WhatsApp workflows</span><span><i/> AI-powered operations</span></div>
      </motion.div>
      <motion.div className="safar-cinema-dashboard" initial={{ opacity: 0, y: 60, rotateX: 12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: .5, duration: 1.1, ease: EASE }}>
        <div className="safar-dash-top"><div className="safar-dash-brand"><span className="safar-dash-mark">S</span> SafarOS <small>WORKSPACE PREVIEW</small></div><span className="safar-dash-live"><i/> SYSTEMS IN MOTION</span></div>
        <div className="safar-dash-modules">
          <div><CalendarDays/><span>Bookings</span><b>Plan every detail</b></div>
          <div><MessageCircle/><span>WhatsApp</span><b>Keep conversations moving</b></div>
          <div><Bot/><span>AI Copilot</span><b>Make smarter next moves</b></div>
          <div><Users/><span>CRM & Leads</span><b>Move enquiries forward</b></div>
          <div><ChartNoAxesCombined/><span>Operations</span><b>See the whole journey</b></div>
        </div>
      </motion.div>
      <div className="safar-cinema-scroll"><span/> SCROLL TO ENTER THE JOURNEY</div>
    </section>
  );
}
