'use client';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, BadgeCheck, Bookmark, ShieldCheck } from 'lucide-react';

export default function TripCard({ trip }) {
  return (
    <article className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(15,23,42,0.15)] hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 flex flex-col">
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <Image src={trip.cover} alt={trip.title} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-[600ms] ease-out" sizes="(max-width: 640px) 100vw, 400px" unoptimized />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${trip.mode === 'safar' ? 'bg-emerald-500 text-white' : 'bg-violet-600 text-white'}`}>
            {trip.mode === 'safar' && <ShieldCheck className="size-3" />}
            {trip.mode === 'safar' ? 'Verified by Safar' : 'Self Hosted'}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold bg-white/95 backdrop-blur text-slate-700 shadow-sm">{trip.dates}</span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-bold text-[15.5px] tracking-tight text-slate-900 line-clamp-1">{trip.title}</h3>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-slate-500"><MapPin className="size-3.5" /> <span className="truncate">{trip.location}</span></div>
        <div className="mt-3 flex items-center gap-2">
          <div className="size-6 rounded-full bg-slate-200 grid place-items-center text-[10px] font-bold text-slate-500">{trip.host?.[0] || 'H'}</div>
          <span className="text-[12px] text-slate-500 truncate">Hosted by <span className="font-semibold text-slate-800">{trip.host}</span></span>
          {trip.verified && <BadgeCheck className="size-3.5 text-violet-600 shrink-0" />}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-slate-800 tabular-nums">{trip.joined} / {trip.max} joined</span>
          <span className="text-[11px] font-semibold text-slate-500">{trip.type}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 pt-1 mt-auto">
          <Link href={`/explore/trip/${trip.id}`} className="flex-1 text-center rounded-xl bg-violet-50 hover:bg-violet-100 active:scale-[0.98] text-violet-700 text-[13px] font-semibold py-2.5 transition">Request to Join</Link>
          <button className="size-10 grid place-items-center rounded-xl bg-violet-50 hover:bg-violet-100 active:scale-95 text-violet-600 transition" aria-label="Save"><Bookmark className="size-4" /></button>
        </div>
      </div>
    </article>
  );
}
