'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Users, FileText, Megaphone } from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import { CHAT_MESSAGES } from '@/lib/explore-v2-data';

export default function Chat() {
  const [msgs, setMsgs] = useState(CHAT_MESSAGES);
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    setMsgs([...msgs, { id: `me-${Date.now()}`, authorId: 'you', name: 'You', text: text.trim(), time: 'now', kind: 'text', role: 'me' }]);
    setText('');
  };

  return (
    <Shell hideNav>
      <div className="flex flex-col h-[100dvh]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="max-w-3xl mx-auto px-4 md:px-6 pb-3 flex items-center gap-3">
            <Link href="/explore" className="size-10 grid place-items-center rounded-full hover:bg-slate-100 active:scale-95"><ArrowLeft className="size-5" /></Link>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-[15px] tracking-tight text-slate-900 truncate">Kashmir Great Lakes</div>
              <div className="text-[11.5px] text-slate-500 flex items-center gap-1"><Users className="size-3" /> 8 members</div>
            </div>
            <button className="size-10 grid place-items-center rounded-full hover:bg-slate-100"><Users className="size-4 text-slate-600" /></button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 space-y-3">
            <div className="text-center"><span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">Today</span></div>
            {msgs.map(m => {
              const me = m.role === 'me';
              if (m.kind === 'announcement') {
                return (
                  <div key={m.id} className="rounded-2xl border border-violet-200 bg-violet-50 p-3 flex items-start gap-2">
                    <Megaphone className="size-4 text-violet-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-[12px] text-violet-900">Trip Announcement {'\u00B7'} {m.name}</div>
                      <div className="text-[13px] text-slate-700 mt-0.5">{m.text}</div>
                    </div>
                  </div>
                );
              }
              if (m.kind === 'file') {
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3 max-w-md">
                    <div className="size-10 rounded-xl bg-violet-100 grid place-items-center text-violet-600"><FileText className="size-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] text-slate-900 truncate">{m.fileName}</div>
                      <div className="text-[11.5px] text-slate-500">{m.fileSize}</div>
                    </div>
                    <button className="text-[12px] font-semibold text-violet-700">Open</button>
                  </div>
                );
              }
              return (
                <div key={m.id} className={`flex gap-2 ${me ? 'justify-end' : ''}`}>
                  {!me && m.avatar && <Image src={m.avatar} alt={m.name} width={32} height={32} className="rounded-full self-end object-cover" unoptimized />}
                  <div className={`max-w-[75%] ${me ? 'items-end' : ''} flex flex-col`}>
                    {!me && <div className="text-[11px] font-semibold text-slate-500 ml-1 mb-0.5">{m.name}</div>}
                    {m.kind === 'image' ? (
                      <div className="rounded-2xl overflow-hidden"><Image src={m.image} alt="" width={300} height={200} className="object-cover" unoptimized /></div>
                    ) : (
                      <div className={`rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${me ? 'bg-violet-600 text-white rounded-br-md' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-md'}`}>{m.text}</div>
                    )}
                    <div className={`text-[10.5px] text-slate-400 mt-1 ${me ? 'text-right' : 'ml-1'}`}>{m.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-3xl mx-auto px-3 md:px-6 py-2.5 flex items-center gap-2">
            <button className="size-10 grid place-items-center rounded-full hover:bg-slate-100"><Paperclip className="size-4 text-slate-600" /></button>
            <button className="size-10 grid place-items-center rounded-full hover:bg-slate-100"><ImageIcon className="size-4 text-slate-600" /></button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message the group..." className="flex-1 h-11 rounded-full bg-slate-100 px-4 text-[14px] outline-none" />
            <button onClick={send} className="size-11 rounded-full bg-violet-600 grid place-items-center text-white shadow-lg shadow-violet-300 active:scale-95"><Send className="size-4" /></button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
