'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, UserPlus, CheckCircle2, Clock, Trophy, Heart, MessageCircle, Bell, MoreHorizontal, Check } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import { fetchNotifications, markNotifRead } from '@/lib/explore-api';

const TYPE_META = {
  request:  { icon: UserPlus,     tone: 'violet' },
  accept:   { icon: CheckCircle2, tone: 'emerald' },
  decline:  { icon: Clock,        tone: 'rose' },
  reward:   { icon: Trophy,       tone: 'amber' },
  like:     { icon: Heart,        tone: 'rose' },
  message:  { icon: MessageCircle,tone: 'sky' },
  reminder: { icon: Clock,        tone: 'orange' },
  highlight:{ icon: Bell,         tone: 'violet' },
  system:   { icon: Bell,         tone: 'violet' },
};

const FALLBACK_NOTIFS = [
  { id: 'n1', type: 'request', unread: true, title: 'Zeeshan Ali requested to join', body: 'Kashmir Great Lakes Trek \u00B7 May 25', time: '2m', avatar: 'https://i.pravatar.cc/80?img=15' },
  { id: 'n2', type: 'accept', unread: true, title: 'Request accepted', body: 'Danish accepted your request for Gurez Valley Camp', time: '1h', avatar: 'https://i.pravatar.cc/80?img=42' },
  { id: 'n3', type: 'reward', unread: true, title: 'Reward unlocked', body: 'You unlocked \u201CFree Homestay Night\u201D \u2013 3/9 revealed', time: '3h' },
  { id: 'n4', type: 'like', unread: false, title: 'Amaan liked your highlight', body: 'Your photo from Kashmir Great Lakes got a new like', time: '5h', avatar: 'https://i.pravatar.cc/80?img=12' },
  { id: 'n5', type: 'message', unread: false, title: 'New group message', body: 'Zoya: \u201CI made a shared checklist \u2013 tap below.\u201D', time: '8h', avatar: 'https://i.pravatar.cc/80?img=25' },
  { id: 'n6', type: 'reminder', unread: false, title: 'Trip reminder', body: 'Weekend in Gulmarg starts in 3 days. Pack warm layers.', time: '1d' },
  { id: 'n7', type: 'highlight', unread: false, title: 'New highlight', body: 'Faisal posted a new photo from Chadar Trek', time: '2d', avatar: 'https://i.pravatar.cc/80?img=33' },
];

function timeAgo(d) {
  if (!d) return '';
  const t = new Date(d).getTime(); if (isNaN(t)) return '';
  const diff = Date.now() - t;
  const days = Math.floor(diff / 86400000); if (days > 0) return `${days}d`;
  const hrs = Math.floor(diff / 3600000);   if (hrs > 0) return `${hrs}h`;
  const mins = Math.max(1, Math.floor(diff / 60000));   return `${mins}m`;
}

const TONE = {
  violet: 'bg-violet-100 text-violet-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  rose: 'bg-rose-100 text-rose-500',
  sky: 'bg-sky-100 text-sky-600',
  orange: 'bg-orange-100 text-orange-600',
};

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const [readMap, setReadMap] = useState({});
  const [remote, setRemote] = useState([]);

  useEffect(() => {
    let alive = true;
    fetchNotifications()
      .then(({ items }) => {
        if (!alive) return;
        setRemote(items.map(n => ({
          id: n.id, type: n.type || 'system',
          unread: !n.readAt, title: n.title || '', body: n.body || '',
          time: timeAgo(n.createdAt), avatar: n.avatar || null,
        })));
      })
      .catch(() => setRemote([]));
    return () => { alive = false; };
  }, []);

  const source = remote.length > 0 ? remote : FALLBACK_NOTIFS;
  const list = source.map(n => ({ ...n, unread: n.unread && !readMap[n.id] }))
    .filter(n => tab === 'all' || (tab === 'unread' && n.unread));
  const unreadCount = source.filter(n => n.unread && !readMap[n.id]).length;

  const markRead = (id) => {
    setReadMap(m => ({ ...m, [id]: true }));
    markNotifRead(id).catch(() => {});
  };

  return (
    <Shell>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/explore" className="size-10 grid place-items-center rounded-full hover:bg-slate-100 active:scale-95"><ArrowLeft className="size-5" /></Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-[18px] md:text-[24px] tracking-tight">Notifications</h1>
              {unreadCount > 0 && <p className="text-[11.5px] text-violet-700 font-semibold">{unreadCount} unread</p>}
            </div>
            <button onClick={() => { setReadMap(Object.fromEntries(source.map(n => [n.id, true]))); source.forEach(n => n.unread && markNotifRead(n.id).catch(()=>{})); }} className="text-[12px] font-semibold text-violet-700 hover:underline">Mark all read</button>
          </div>
          <div className="mt-3 rounded-2xl bg-slate-100/70 p-1 grid grid-cols-2 max-w-sm">
            {['all', 'unread'].map(id => (
              <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[13px] font-semibold capitalize transition ${tab === id ? 'bg-violet-600 text-white shadow' : 'text-slate-600'}`}>
                {id}
                {id === 'unread' && unreadCount > 0 && <span className={`text-[10px] font-bold size-5 grid place-items-center rounded-full ${tab === id ? 'bg-white/25 text-white' : 'bg-white text-violet-700'}`}>{unreadCount}</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-4">
        {list.length === 0 && (
          <div className="py-14 text-center rounded-3xl bg-white border border-slate-100">
            <div className="mx-auto size-12 rounded-2xl bg-emerald-100 grid place-items-center text-emerald-600 mb-3"><Check className="size-6" /></div>
            <div className="font-display font-bold text-slate-900">All caught up</div>
            <p className="text-[13px] text-slate-500 mt-1">You have no unread notifications.</p>
          </div>
        )}
        <div className="space-y-2">
          {list.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            const Icon = meta.icon;
            const tone = meta.tone;
            return (
              <div key={n.id} onClick={() => markRead(n.id)} className={`relative flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer active:scale-[0.99] transition ${n.unread ? 'bg-violet-50/40 border-violet-100' : 'bg-white border-slate-100'}`}>
                {n.unread && <span className="absolute top-3.5 right-3.5 size-2 rounded-full bg-violet-600" />}
                <div className="relative shrink-0">
                  {n.avatar ? (
                    <Image src={n.avatar} alt="" width={44} height={44} className="rounded-full object-cover" unoptimized />
                  ) : (
                    <div className={`size-11 rounded-full grid place-items-center ${TONE[tone]}`}><Icon className="size-5" /></div>
                  )}
                  {n.avatar && (
                    <div className={`absolute -bottom-0.5 -right-0.5 size-5 rounded-full grid place-items-center ring-2 ring-white ${TONE[tone]}`}>
                      <Icon className="size-3" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="font-semibold text-[13.5px] text-slate-900 leading-snug">{n.title}</div>
                  <div className="mt-0.5 text-[12.5px] text-slate-600 leading-snug">{n.body}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{n.time} ago</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </Shell>
  );
}
