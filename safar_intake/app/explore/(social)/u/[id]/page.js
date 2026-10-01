'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin, Globe, Languages, Sparkles, Users, UserPlus, UserMinus, Route, MessageCircle,
  ArrowLeft, Loader2, Check, ShieldCheck, Activity, Gem, PenLine,
} from 'lucide-react';
import AuroraBg from '@/components/explore/AuroraBg';
import BadgeChip from '@/components/explore/BadgeChip';
import { useAuth } from '@/lib/auth-context';

export default function TravelerProfile() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('journeys');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/users/${id}/profile`);
      const j = await r.json();
      if (j.user) setData(j);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    if (!user) { router.push('/?auth=1'); return; }
    setBusy(true);
    // optimistic
    setData(d => d ? { ...d, user: { ...d.user, isFollowing: !d.user.isFollowing, stats: { ...d.user.stats, followers: d.user.stats.followers + (d.user.isFollowing ? -1 : 1) } } } : d);
    await fetch(`/api/users/${data.user.id}/follow`, { method: 'POST' });
    setBusy(false);
  };

  if (loading) return <div className="e-container pt-24 pb-24 text-center"><Loader2 className="size-6 animate-spin mx-auto text-white/60" /></div>;
  if (!data) return (
    <div className="e-container pt-24 pb-24 text-center">
      <div className="e-chip mx-auto">Not found</div>
      <p className="mt-4" style={{ color: 'var(--e-text-muted)' }}>Traveler not found.</p>
      <Link href="/explore/home" className="mt-6 inline-flex items-center gap-1 e-btn-ghost rounded-full px-4 py-2 text-sm"><ArrowLeft className="size-4" /> Back</Link>
    </div>
  );

  const u = data.user;
  const isSelf = u.isSelf;

  return (
    <div className="relative">
      <section className="relative overflow-hidden pt-14 md:pt-20 pb-6">
        <AuroraBg />
        <div className="relative e-container e-fade-in">
          <Link href="/explore/home" className="inline-flex items-center gap-1 text-xs e-btn-ghost rounded-full px-3 py-1.5 mb-4"><ArrowLeft className="size-3" /> Back</Link>
          <div className="e-glass rounded-3xl p-6 md:p-8">
            <div className="flex items-start gap-5 flex-wrap">
              {u.avatar
                ? <Image src={u.avatar} alt={u.name} width={96} height={96} className="rounded-2xl ring-1 ring-white/20 shrink-0" unoptimized />
                : <div className="size-24 rounded-2xl bg-gradient-to-br from-emerald-300 to-violet-400 grid place-items-center text-[#06080f] font-bold text-3xl shrink-0">{(u.name||'?')[0]}</div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="display font-bold text-[clamp(1.4rem,3.4vw,2rem)] leading-tight">{u.name}</h1>
                  {u.verified && <ShieldCheck className="size-5 text-emerald-300" />}
                  {u.role && u.role !== 'traveler' && <BadgeChip type="new">{u.role}</BadgeChip>}
                </div>
                {u.username && <div className="text-sm" style={{ color: 'var(--e-text-muted)' }}>@{u.username}</div>}
                {u.bio && <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--e-text-muted)' }}>{u.bio}</p>}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--e-text-muted)' }}>
                  {(u.city || u.country) && <span><MapPin className="inline size-3.5 mr-0.5" />{[u.city, u.country].filter(Boolean).join(', ')}</span>}
                  {Array.isArray(u.languages) && u.languages.length > 0 && <span><Languages className="inline size-3.5 mr-0.5" />{u.languages.join(', ')}</span>}
                  {Array.isArray(u.interests) && u.interests.length > 0 && <span><Sparkles className="inline size-3.5 mr-0.5" />{u.interests.join(' · ')}</span>}
                </div>
                {/* Stats */}
                <div className="mt-4 grid grid-cols-4 gap-3 max-w-md">
                  <Stat label="Followers" value={u.stats?.followers ?? 0} />
                  <Stat label="Following" value={u.stats?.following ?? 0} />
                  <Stat label="Journeys" value={u.stats?.journeys ?? 0} />
                  <Stat label="Posts" value={u.stats?.posts ?? 0} />
                </div>
                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {isSelf ? (
                    <button onClick={() => setEditing(true)} className="e-btn-primary rounded-full px-5 py-2 text-sm inline-flex items-center gap-2"><PenLine className="size-4" /> Edit profile</button>
                  ) : (
                    <button onClick={toggleFollow} disabled={busy} className={`rounded-full px-5 py-2 text-sm inline-flex items-center gap-2 ${u.isFollowing ? 'e-btn-ghost' : 'e-btn-primary'}`}>
                      {busy ? <Loader2 className="size-4 animate-spin"/> : (u.isFollowing ? <UserMinus className="size-4" /> : <UserPlus className="size-4" />)}
                      {u.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="relative e-container mb-4">
        <div className="flex items-center gap-2 overflow-x-auto e-scroll-x pb-1">
          {[
            { id: 'journeys', label: `Journeys (${u.stats?.journeys ?? 0})`, icon: Route },
            { id: 'posts',    label: `Posts (${u.stats?.posts ?? 0})`,       icon: MessageCircle },
            { id: 'activity', label: 'Activity',                              icon: Activity },
          ].map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid)} className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition border ${tab===tid ? 'e-btn-primary border-transparent' : 'bg-white/[0.04] border-white/10 text-white/75 hover:bg-white/[0.08] hover:text-white'}`}>
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </section>

      <section className="relative e-container pb-24">
        {tab === 'journeys' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.journeys.length === 0 && <div className="e-glass rounded-3xl p-8 text-center col-span-full"><div className="e-chip mx-auto">Nothing yet</div><p className="mt-3 text-sm" style={{color:'var(--e-text-muted)'}}>No published journeys.</p></div>}
            {data.journeys.map(j => (
              <Link key={j.id} href={`/explore/j/${j.slug}`} className="e-card e-lift-in">
                {j.cover && <div className="e-card-media relative"><Image src={j.cover} alt={j.name} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" unoptimized /></div>}
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--e-text-dim)' }}>{j.destination?.name || 'Kashmir'} · {j.theme?.replace(/_/g,' ')}</div>
                  <div className="font-semibold mt-1 line-clamp-2">{j.name}</div>
                  {j.budget && <div className="mt-2 text-xs" style={{ color: 'var(--e-text-muted)' }}>from <span className="font-semibold" style={{ color: 'var(--e-text)' }}>₹{Number(j.budget).toLocaleString('en-IN')}</span></div>}
                </div>
              </Link>
            ))}
          </div>
        )}
        {tab === 'posts' && (
          <div className="grid md:grid-cols-2 gap-4">
            {data.posts.length === 0 && <div className="e-glass rounded-3xl p-8 text-center col-span-full"><div className="e-chip mx-auto">Nothing yet</div><p className="mt-3 text-sm" style={{color:'var(--e-text-muted)'}}>No community posts.</p></div>}
            {data.posts.map(p => (
              <div key={p.id} className="e-glass rounded-2xl p-4">
                <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--e-text-dim)' }}>{p.category?.replace('_',' ')} · {new Date(p.createdAt).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                {p.title && <div className="font-semibold mt-1">{p.title}</div>}
                {p.content && <p className="mt-1 text-sm line-clamp-4" style={{ color: 'var(--e-text-muted)' }}>{p.content}</p>}
                {p.image && <div className="mt-2 rounded-lg overflow-hidden border border-white/10">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image} alt="" className="w-full h-auto object-cover max-h-48" loading="lazy"/></div>}
                <div className="mt-3 text-xs flex gap-4" style={{ color: 'var(--e-text-muted)' }}>
                  <span>❤ {p.likesCount || 0}</span><span>💬 {p.commentsCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'activity' && (
          <div className="e-glass rounded-3xl p-6">
            {data.activity.length === 0 && <div className="text-center text-sm" style={{color:'var(--e-text-muted)'}}>No activity yet.</div>}
            <div className="space-y-3">
              {data.activity.map((a, i) => <ActivityRow key={i} item={a} />)}
            </div>
          </div>
        )}
      </section>

      {editing && <EditProfileModal user={u} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center e-glass rounded-xl px-2 py-2">
      <div className="text-lg font-bold e-grad-text">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--e-text-dim)' }}>{label}</div>
    </div>
  );
}

function ActivityRow({ item }) {
  const ICONS = {
    journey_published: Route,
    journey_joined:    Check,
    post_shared:       MessageCircle,
    discussion_posted: MessageCircle,
    gem_shared:        Gem,
  };
  const LABELS = {
    journey_published: 'Published a journey',
    journey_joined:    'Joined a journey',
    post_shared:       'Shared a post',
    discussion_posted: 'Started a discussion',
    gem_shared:        'Shared a hidden gem',
  };
  const Icon = ICONS[item.type] || Activity;
  const label = LABELS[item.type] || 'Activity';
  const isJourney = item.type === 'journey_published' || item.type === 'journey_joined';
  const href = isJourney && item.ref?.slug ? `/explore/j/${item.ref.slug}` : null;
  const title = item.ref?.name || item.ref?.title || '';
  const inner = (
    <div className="flex items-start gap-3">
      <div className="size-9 rounded-full bg-white/[0.06] border border-white/10 grid place-items-center shrink-0"><Icon className="size-4 text-emerald-300" /></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm"><span className="font-semibold">{label}</span>{title ? ` · ${title}` : ''}</div>
        <div className="text-[11px]" style={{ color: 'var(--e-text-dim)' }}>{item.at ? new Date(item.at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : ''}</div>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90 transition">{inner}</Link> : inner;
}

function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    country: user.country || '',
    city: user.city || '',
    languages: (user.languages || []).join(', '),
    interests: (user.interests || []).join(', '),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = {
        name: form.name.trim(),
        username: form.username.trim() || null,
        bio: form.bio,
        country: form.country,
        city: form.city,
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
      };
      const r = await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Save failed');
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="e-glass rounded-3xl w-full max-w-lg p-6 border border-white/15" style={{ background: 'rgba(15,20,32,0.9)' }}>
        <div className="e-chip"><PenLine className="size-3 text-emerald-300" /> Edit profile</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Fld label="Name" full><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="e-input"/></Fld>
          <Fld label="Username"><input value={form.username} onChange={e=>setForm({...form, username:e.target.value})} placeholder="alphahiker" className="e-input"/></Fld>
          <Fld label="Country"><input value={form.country} onChange={e=>setForm({...form, country:e.target.value})} placeholder="India" className="e-input"/></Fld>
          <Fld label="City"><input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} placeholder="Mumbai" className="e-input"/></Fld>
          <Fld label="Languages (comma-separated)" full><input value={form.languages} onChange={e=>setForm({...form, languages:e.target.value})} placeholder="English, Hindi" className="e-input"/></Fld>
          <Fld label="Travel interests (comma-separated)" full><input value={form.interests} onChange={e=>setForm({...form, interests:e.target.value})} placeholder="Photography, Trekking" className="e-input"/></Fld>
          <Fld label="Bio" full><textarea value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} rows={3} className="e-input"/></Fld>
        </div>
        {err && <div className="mt-2 text-xs text-rose-300">{err}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="e-btn-ghost rounded-full px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={busy} className="e-btn-primary rounded-full px-5 py-2 text-sm inline-flex items-center gap-1.5">{busy ? <Loader2 className="size-4 animate-spin"/> : <Check className="size-4"/>} Save</button>
        </div>
      </div>
      <style jsx global>{`.e-input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:8px 12px;color:white;font-size:13px;width:100%;outline:none}`}</style>
    </div>
  );
}

function Fld({ label, children, full }) {
  return (
    <label className={`block ${full ? 'col-span-2' : ''}`}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/55 mb-1">{label}</div>
      {children}
    </label>
  );
}
