'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Share2, MoreHorizontal, MapPin, BadgeCheck, ShieldCheck,
  Briefcase, Users, Gift, Star, Bookmark, Lock, Trophy, Award,
  Gift as GiftIcon, Shield as ShieldIcon, Loader2, Tent, Mountain, Bike,
  Backpack, Camera, Pencil, X, Plus, Sparkles, Copy, MessageCircle, LogOut,
} from 'lucide-react';
import Shell from '@/components/explore-v2/Shell';
import { MORE_TRIPS, REWARD_CARDS, BADGES } from '@/lib/explore-v2-data';
import { useAuth } from '@/lib/auth-context';
import AuthGate from '@/components/safar/AuthGate';

// Reuse the EXISTING Safar Curated auth modal (no new auth UI).
const AuthModal = dynamic(() => import('@/components/safar/AuthModal'), { ssr: false });

// ---------------------------------------------------------------------------
// Explore Profile Page — pixel-close to the approved reference design.
// UI-only redesign. No backend/API/routing/state-shape changes.
// Preserved: /explore/me route, ?tab= query param, Shell (bottom nav),
// MORE_TRIPS / REWARD_CARDS / BADGES data sources.
// ---------------------------------------------------------------------------

const CATEGORY_META = {
  Camping:     { icon: Tent,      color: 'text-emerald-700 bg-emerald-50 ring-emerald-100' },
  Bike:        { icon: Bike,      color: 'text-emerald-700 bg-emerald-50 ring-emerald-100' },
  Backpacking: { icon: Backpack,  color: 'text-emerald-700 bg-emerald-50 ring-emerald-100' },
  Trek:        { icon: Mountain,  color: 'text-emerald-700 bg-emerald-50 ring-emerald-100' },
};

// Local storage key used to persist the (client-side only) profile edits.
// This keeps the current UI-only contract — no new API calls are made.
const PROFILE_LS_KEY = 'safar-explore-profile-v1';

const DEFAULT_PROFILE = {
  name: 'Shahnawaz',
  tagline: 'Mountain Explorer',
  location: 'Srinagar, Jammu & Kashmir',
  bio: 'Explorer at heart, host by choice. Sharing incredible places and experiences.',
  about:
    'Born and raised in Srinagar, I love guiding fellow travelers to hidden meadows, secret trails and the most delicious wazwan spots in the valley.',
  avatar: 'https://i.pravatar.cc/300?img=13',
  cover: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=2200&q=85',
  languages: ['English', 'Urdu', 'Kashmiri'],
  interests: ['Trekking', 'Photography', 'Camping', 'Local Food'],
};

function MeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get('tab') || 'trips';
  const [tab, setTab] = useState(initial);
  const [bookmarked, setBookmarked] = useState({});
  const unlocked = REWARD_CARDS.filter((r) => r.unlocked).length;

  // ---- Editable profile (client-only persistence via localStorage) --------
  const { user, logout, loading: authLoading } = useAuth();
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | null
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [editOpen, setEditOpen] = useState(false);
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' && window.localStorage.getItem(PROFILE_LS_KEY);
      if (raw) setProfile((p) => ({ ...p, ...JSON.parse(raw) }));
    } catch { /* ignore */ }
  }, []);
  // Reflect the signed-in Safar account (real name/avatar) once auth resolves.
  useEffect(() => {
    if (!user) return;
    setProfile((p) => ({ ...p, name: user.name || p.name, avatar: user.avatar || p.avatar }));
  }, [user]);
  const saveProfile = (next) => {
    setProfile(next);
    try { window.localStorage.setItem(PROFILE_LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  // Sign Out reuses the EXISTING Safar Curated logout (auth-context).
  const handleSignOut = async () => {
    setMoreOpen(false);
    try { await logout(); } catch { /* ignore */ }
    router.push('/explore');
  };

  // ---- Share + More menu (functionality only; UI unchanged) ---------------
  // /explore/me always renders the authenticated user's OWN profile, so the
  // More menu shows owner actions (Edit Profile + Share Profile).
  const isOwner = true;
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 2200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // The URL of the profile CURRENTLY being viewed (never hardcoded).
  const getProfileUrl = () => (typeof window !== 'undefined' ? window.location.href : '');
  const buildShareData = () => ({
    title: `${profile.name} — Safar Curated`,
    text: 'Explore this profile and discover trips on Safar Curated.',
    url: getProfileUrl(),
  });

  const handleShare = async () => {
    setMoreOpen(false);
    const data = buildShareData();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try { await navigator.share(data); return; }
      catch (e) { if (e && e.name === 'AbortError') return; /* else fall back */ }
    }
    setShareOpen(true);
  };

  const copyLink = async () => {
    const url = getProfileUrl();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
    } catch { /* ignore — still confirm to the user */ }
    setShareOpen(false);
    setToastMsg('Profile link copied');
  };

  const shareWhatsApp = () => {
    const d = buildShareData();
    const text = encodeURIComponent(`${d.text} ${d.url}`);
    if (typeof window !== 'undefined') window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };


  const toggleBookmark = (id) =>
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/explore');
  };

  const stats = [
    { icon: Briefcase, tint: 'bg-emerald-50 text-emerald-700',   value: '12',  label: 'Hosted',  sub: 'Trips' },
    { icon: Users,     tint: 'bg-violet-50 text-violet-700',     value: '8',   label: 'Joined',  sub: 'Trips' },
    { icon: Gift,      tint: 'bg-amber-50 text-amber-600',       value: `${unlocked}/9`, label: 'Rewards', sub: 'Level' },
    { icon: Star,      tint: 'bg-sky-50 text-sky-600',           value: '4.9', label: 'Rating',  sub: '(128 Reviews)', trailing: true },
  ];

  // Not signed in → show the EXISTING Safar Curated auth experience
  // (AuthGate → AuthModal), never a fake demo profile.
  if (!authLoading && !user) {
    return (
      <Shell>
        <AuthGate
          open={!authMode}
          onClose={() => router.push('/explore')}
          onSignIn={() => setAuthMode('login')}
          onCreate={() => setAuthMode('register')}
          title="Sign in to view your profile"
          subtitle="Access your Safar profile, trips and rewards."
        />
        <AuthModal open={!!authMode} defaultMode={authMode || 'login'} onClose={() => setAuthMode(null)} />
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="min-h-screen bg-white pb-6">
        {/* ============================ HERO COVER ============================ */}
        <section className="relative">
          <div className="relative w-full h-[240px] sm:h-[280px] md:h-[320px] lg:h-[340px] overflow-hidden">
            <Image
              src={profile.cover}
              alt="Cover"
              fill
              priority
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
            {/* Soft bottom fade so the floating avatar sits gracefully */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white/40" />
          </div>

          {/* Top-left back button */}
          <button
            onClick={goBack}
            aria-label="Back"
            className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 md:top-6 md:left-6 grid place-items-center size-11 rounded-full bg-white shadow-md ring-1 ring-black/5 hover:scale-105 active:scale-95 transition"
          >
            <ArrowLeft className="size-5 text-slate-800" strokeWidth={2.2} />
          </button>

          {/* Top-right actions */}
          <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 md:top-6 md:right-6 flex items-center gap-2 z-30">
            <button
              onClick={handleShare}
              aria-label="Share profile"
              className="grid place-items-center size-11 rounded-full bg-white shadow-md ring-1 ring-black/5 hover:scale-105 active:scale-95 transition"
            >
              <Share2 className="size-[19px] text-slate-800" strokeWidth={2.2} />
            </button>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className="grid place-items-center size-11 rounded-full bg-white shadow-md ring-1 ring-black/5 hover:scale-105 active:scale-95 transition"
            >
              <MoreHorizontal className="size-5 text-slate-800" strokeWidth={2.2} />
            </button>
          </div>

          {/* More menu — closes on outside tap / action select */}
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMoreOpen(false)} aria-hidden="true" />
              <div
                role="menu"
                className="absolute z-30 top-[calc(max(1rem,env(safe-area-inset-top))+3.25rem)] md:top-[4.75rem] right-4 md:right-6 w-52 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden py-1 origin-top-right"
              >
                {isOwner ? (
                  <>
                    <button
                      role="menuitem"
                      onClick={() => { setMoreOpen(false); setEditOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition"
                    >
                      <Pencil className="size-[18px] text-slate-500" strokeWidth={2.2} /> Edit Profile
                    </button>
                    <button
                      role="menuitem"
                      onClick={handleShare}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition"
                    >
                      <Share2 className="size-[18px] text-slate-500" strokeWidth={2.2} /> Share Profile
                    </button>
                    <button
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition border-t border-slate-100"
                    >
                      <LogOut className="size-[18px]" strokeWidth={2.2} /> Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    role="menuitem"
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition"
                  >
                    <Share2 className="size-[18px] text-slate-500" strokeWidth={2.2} /> Share Profile
                  </button>
                )}
              </div>
            </>
          )}

          {/* Cover edit button — small camera icon at bottom-right of cover */}
          <button
            onClick={() => setEditOpen(true)}
            aria-label="Change cover photo"
            className="absolute bottom-[max(1.75rem,calc(96px-2.75rem))] right-4 md:right-6 grid place-items-center size-10 rounded-full bg-black/55 backdrop-blur-md hover:bg-black/70 text-white ring-1 ring-white/25 shadow-md active:scale-95 transition"
          >
            <Camera className="size-[18px]" strokeWidth={2.2} />
          </button>
        </section>

        {/* ============================ PROFILE INFO ========================== */}
        <section className="relative">
          <div className="max-w-3xl mx-auto px-6 md:px-8">
            {/* Avatar + name row */}
            <div className="-mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              {/* Floating circular avatar with verified check + camera edit button */}
              <div className="relative shrink-0 self-start">
                <div className="relative size-[128px] md:size-[140px] rounded-full overflow-hidden ring-[5px] ring-white shadow-[0_18px_40px_-16px_rgba(15,23,42,0.28)] bg-slate-200">
                  <Image
                    src={profile.avatar}
                    alt="Profile"
                    fill
                    sizes="140px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {/* Verified check pip */}
                <span
                  aria-label="Verified account"
                  className="absolute bottom-2 right-1.5 grid place-items-center size-7 rounded-full bg-emerald-600 ring-[3px] ring-white shadow-sm"
                >
                  <BadgeCheck className="size-4 text-white" strokeWidth={2.6} />
                </span>
                {/* Camera edit button — bottom-left of avatar */}
                <button
                  onClick={() => setEditOpen(true)}
                  aria-label="Change profile photo"
                  className="absolute bottom-1 left-1 grid place-items-center size-8 rounded-full bg-white shadow-md ring-1 ring-black/5 hover:scale-105 active:scale-95 transition"
                >
                  <Camera className="size-[15px] text-slate-800" strokeWidth={2.2} />
                </button>
              </div>

              {/* Name + tagline + location + bio */}
              <div className="flex-1 min-w-0 pt-1 md:pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-slate-900 tracking-tight text-[26px] md:text-[30px] leading-tight">
                    {profile.name}
                  </h1>
                  <BadgeCheck className="size-6 text-violet-600 shrink-0" strokeWidth={2.4} />
                </div>
                {profile.tagline && (
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 ring-1 ring-emerald-100 text-emerald-800 text-[11.5px] md:text-[12px] font-semibold px-2.5 py-1">
                    <Sparkles className="size-3" strokeWidth={2.4} />
                    {profile.tagline}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-[13.5px] md:text-[14px] text-slate-500">
                  <MapPin className="size-[15px] text-slate-400" strokeWidth={2.2} />
                  <span>{profile.location}</span>
                </div>
                <p className="mt-3 text-slate-600 text-[13.5px] md:text-[14.5px] leading-relaxed max-w-md whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            </div>

            {/* Edit Profile button — prominent, below profile information */}
            <div className="mt-5 md:mt-6 flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
              <button
                onClick={() => setEditOpen(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-bold text-[13.5px] md:text-[14px] px-6 py-3 md:py-3 shadow-sm shadow-emerald-900/25 transition"
              >
                <Pencil className="size-4" strokeWidth={2.4} />
                Edit Profile
              </button>

              {/* Languages + Interests chips — subtle profile meta so edits
                  in the modal are visible on the page. */}
              {(profile.languages?.length || profile.interests?.length) ? (
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {(profile.languages || []).slice(0, 3).map((l) => (
                    <span key={`l-${l}`} className="inline-flex items-center rounded-full bg-slate-50 ring-1 ring-slate-100 text-slate-700 text-[11.5px] font-semibold px-2.5 py-1">
                      {l}
                    </span>
                  ))}
                  {(profile.interests || []).slice(0, 3).map((i) => (
                    <span key={`i-${i}`} className="inline-flex items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100 text-emerald-800 text-[11.5px] font-semibold px-2.5 py-1">
                      {i}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* ============================ STATS CARD ==================== */}
            <div className="mt-6 md:mt-7 rounded-[22px] bg-white ring-1 ring-slate-100 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
              <div className="grid grid-cols-4 divide-x divide-slate-100">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="px-1.5 py-4 md:py-5 flex flex-col items-center text-center">
                      <span className={`grid place-items-center size-9 md:size-10 rounded-full ${s.tint}`}>
                        <Icon className={`size-[18px] md:size-5 ${i === 3 ? '' : ''}`} strokeWidth={2.2} />
                      </span>
                      <div className="mt-2 font-display font-extrabold text-slate-900 text-[22px] md:text-[24px] tracking-tight leading-none tabular-nums">
                        {s.value}
                      </div>
                      <div className="mt-1.5 text-[12.5px] md:text-[13px] font-semibold text-slate-800 inline-flex items-center gap-1 leading-tight">
                        {s.label}
                        {s.trailing && (
                          <Star className="size-3 fill-emerald-600 text-emerald-600" strokeWidth={0} />
                        )}
                      </div>
                      <div className="text-[10.5px] md:text-[11px] text-slate-500 mt-0.5">
                        {s.sub}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================ TABS ========================== */}
            <div className="mt-6 md:mt-7 border-b border-slate-100">
              <div role="tablist" aria-label="Profile sections" className="grid grid-cols-3">
                <TabButton active={tab === 'trips'}   onClick={() => setTab('trips')}   label="Trips" />
                <TabButton active={tab === 'rewards'} onClick={() => setTab('rewards')} label="Rewards" icon={GiftIcon} />
                <TabButton active={tab === 'badges'}  onClick={() => setTab('badges')}  label="Badges"  icon={ShieldIcon} />
              </div>
            </div>

            {/* ============================ TAB CONTENT =================== */}
            <div className="mt-5 md:mt-6">
              {tab === 'trips' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {MORE_TRIPS.map((t) => (
                    <ProfileTripCard
                      key={t.id}
                      trip={t}
                      saved={!!bookmarked[t.id]}
                      onToggleBookmark={() => toggleBookmark(t.id)}
                    />
                  ))}
                </div>
              )}

              {tab === 'rewards' && (
                <div className="rounded-[22px] bg-white ring-1 ring-slate-100 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] p-5 md:p-6">
                  <div className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-800">
                    <Trophy className="size-4 text-amber-500" strokeWidth={2.2} />
                    {unlocked} / 9 unlocked
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-[width] duration-500"
                      style={{ width: `${(unlocked / 9) * 100}%` }}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {REWARD_CARDS.map((r) => (
                      <div
                        key={r.id}
                        className={`aspect-square rounded-2xl grid place-items-center text-center p-2 ring-1 transition ${
                          r.unlocked
                            ? 'bg-gradient-to-br from-amber-50 to-orange-50 ring-amber-200/70'
                            : 'bg-slate-50 ring-slate-100'
                        }`}
                      >
                        {r.unlocked ? (
                          <div>
                            <div className="text-[28px] leading-none">{r.icon}</div>
                            <div className="mt-1 text-[10px] font-bold text-slate-800 leading-tight">
                              {r.reward}
                            </div>
                          </div>
                        ) : (
                          <Lock className="size-6 text-slate-300" strokeWidth={2.2} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'badges' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5">
                  {Object.entries(BADGES).map(([id, b]) => (
                    <div
                      key={id}
                      className="rounded-[22px] bg-white ring-1 ring-slate-100 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] p-5 text-center transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(15,23,42,0.2)]"
                    >
                      <div
                        className={`mx-auto grid place-items-center size-14 rounded-2xl bg-gradient-to-br ${b.color} text-white text-[24px] shadow-md`}
                      >
                        {b.emoji}
                      </div>
                      <div className="mt-3 font-semibold text-[13.5px] text-slate-900">{b.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 inline-flex items-center gap-1">
                        <Award className="size-3" strokeWidth={2.2} /> Community
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Edit Profile modal — client-side only, saves to localStorage */}
      {editOpen && (
        <EditProfileModal
          initial={profile}
          onClose={() => setEditOpen(false)}
          onSave={(next) => { saveProfile(next); setEditOpen(false); }}
        />
      )}

      {/* Share fallback sheet — shown only when native Web Share is unavailable */}
      {shareOpen && (
        <div className="fixed inset-0 z-[96]" role="dialog" aria-modal="true" aria-label="Share profile">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShareOpen(false)} />
          <div className="absolute left-1/2 bottom-0 md:bottom-auto md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-full md:w-[420px] max-w-[480px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl ring-1 ring-black/5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-slate-900 text-[18px]">Share profile</h3>
              <button onClick={() => setShareOpen(false)} aria-label="Close" className="grid place-items-center size-9 rounded-full hover:bg-slate-100 active:scale-95 transition">
                <X className="size-5 text-slate-600" strokeWidth={2.2} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={copyLink} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 ring-1 ring-slate-100 hover:bg-slate-100 active:scale-[0.99] py-5 transition">
                <span className="grid place-items-center size-11 rounded-full bg-white ring-1 ring-black/5 shadow-sm"><Copy className="size-5 text-slate-700" strokeWidth={2.2} /></span>
                <span className="text-[13px] font-semibold text-slate-700">Copy Link</span>
              </button>
              <button onClick={shareWhatsApp} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 hover:bg-emerald-100 active:scale-[0.99] py-5 transition">
                <span className="grid place-items-center size-11 rounded-full bg-white ring-1 ring-black/5 shadow-sm"><MessageCircle className="size-5 text-emerald-600" strokeWidth={2.2} /></span>
                <span className="text-[13px] font-semibold text-emerald-800">WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium auto-dismiss toast */}
      {toastMsg && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[max(6rem,calc(env(safe-area-inset-bottom)+6rem))] z-[120] pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white text-[13px] font-semibold px-4 py-2.5 shadow-xl ring-1 ring-white/10">
            <BadgeCheck className="size-4 text-emerald-400" strokeWidth={2.6} /> {toastMsg}
          </div>
        </div>
      )}
    </Shell>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EditProfileModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [languagesInput, setLanguagesInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const avatarFileRef = useRef(null);
  const coverFileRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = (kind) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      alert('Please choose an image under 6 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set(kind, reader.result);
    reader.readAsDataURL(file);
  };

  const addChip = (kind, input, setInput) => {
    const v = input.trim();
    if (!v) return;
    const arr = form[kind] || [];
    if (arr.includes(v)) { setInput(''); return; }
    set(kind, [...arr, v]);
    setInput('');
  };
  const removeChip = (kind, val) => set(kind, (form[kind] || []).filter((x) => x !== val));

  const suggestedTaglines = [
    'Solo Traveler', 'Photographer', 'Adventure Lover', 'Mountain Explorer',
    'Foodie', 'Backpacker', 'Trek Enthusiast',
  ];

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Edit profile">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-0 flex items-start md:items-center justify-center p-0 md:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full md:max-w-[640px] max-h-[100dvh] md:max-h-[86vh] bg-white md:rounded-3xl rounded-t-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] ring-1 ring-slate-100 overflow-hidden flex flex-col mt-auto md:mt-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="font-display font-extrabold text-slate-900 text-[18px] md:text-[20px] tracking-tight">
                Edit profile
              </h2>
              <p className="text-[12px] text-slate-500">Changes are saved to this device.</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid place-items-center size-10 rounded-full hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
            >
              <X className="size-5" strokeWidth={2.2} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Cover */}
            <FieldGroup label="Cover photo" hint="Recommended 1600×600, JPG or PNG (max 6 MB)">
              <div className="relative aspect-[16/6] rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-100">
                {form.cover && (
                  <img src={form.cover} alt="Cover preview" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  className="absolute inset-0 grid place-items-center bg-black/25 hover:bg-black/35 text-white text-[13px] font-bold transition opacity-0 hover:opacity-100 focus:opacity-100"
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-md">
                    <Camera className="size-4" strokeWidth={2.4} /> Change cover
                  </span>
                </button>
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile('cover')}
                />
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  className="absolute bottom-2 right-2 grid place-items-center size-9 rounded-full bg-white text-slate-800 shadow-md ring-1 ring-black/5 active:scale-95 transition"
                  aria-label="Change cover photo"
                >
                  <Camera className="size-4" strokeWidth={2.2} />
                </button>
              </div>
            </FieldGroup>

            {/* Avatar */}
            <FieldGroup label="Profile photo">
              <div className="flex items-center gap-4">
                <div className="relative size-20 rounded-full overflow-hidden ring-2 ring-white shadow-md bg-slate-100">
                  {form.avatar && (
                    <img src={form.avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="absolute inset-x-0 bottom-0 bg-black/55 hover:bg-black/70 text-white text-[10.5px] font-semibold py-1 backdrop-blur-md transition"
                  >
                    Change
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-slate-200 hover:ring-slate-300 text-slate-800 font-semibold text-[13px] px-4 py-2 shadow-sm"
                >
                  <Camera className="size-4" strokeWidth={2.2} /> Upload new
                </button>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile('avatar')}
                />
              </div>
            </FieldGroup>

            {/* Display Name */}
            <FieldGroup label="Display name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 transition"
              />
            </FieldGroup>

            {/* Tagline */}
            <FieldGroup label="Tagline" hint="A short description shown next to your name.">
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="e.g., Mountain Explorer"
                className="w-full rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 transition"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestedTaglines.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('tagline', s)}
                    className={`rounded-full text-[11.5px] font-semibold px-2.5 py-1 ring-1 transition ${
                      form.tagline === s
                        ? 'bg-emerald-700 text-white ring-emerald-700'
                        : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FieldGroup>

            {/* Location */}
            <FieldGroup label="Location">
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="City, Region"
                className="w-full rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 transition"
              />
            </FieldGroup>

            {/* Bio */}
            <FieldGroup label="Bio" hint="Displayed under your name — keep it brief.">
              <textarea
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                rows={3}
                placeholder="Say something about yourself"
                className="w-full rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 resize-y transition"
              />
            </FieldGroup>

            {/* About Me */}
            <FieldGroup label="About me" hint="A longer story about you, hosting style, favourite trails.">
              <textarea
                value={form.about}
                onChange={(e) => set('about', e.target.value)}
                rows={4}
                placeholder="Share your travel philosophy, favourite places, hosting style…"
                className="w-full rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 resize-y transition"
              />
            </FieldGroup>

            {/* Languages */}
            <FieldGroup label="Languages">
              <ChipsRow
                items={form.languages || []}
                onRemove={(v) => removeChip('languages', v)}
                tone="slate"
              />
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addChip('languages', languagesInput, setLanguagesInput); }
                  }}
                  placeholder="Add a language and press Enter"
                  className="flex-1 rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none px-4 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => addChip('languages', languagesInput, setLanguagesInput)}
                  className="grid place-items-center size-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                  aria-label="Add language"
                >
                  <Plus className="size-4" strokeWidth={2.4} />
                </button>
              </div>
            </FieldGroup>

            {/* Interests */}
            <FieldGroup label="Interests">
              <ChipsRow
                items={form.interests || []}
                onRemove={(v) => removeChip('interests', v)}
                tone="emerald"
              />
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addChip('interests', interestsInput, setInterestsInput); }
                  }}
                  placeholder="Add an interest and press Enter"
                  className="flex-1 rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none px-4 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => addChip('interests', interestsInput, setInterestsInput)}
                  className="grid place-items-center size-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                  aria-label="Add interest"
                >
                  <Plus className="size-4" strokeWidth={2.4} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Trekking','Photography','Camping','Local Food','Fishing','Wildlife','Culture'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const arr = form.interests || [];
                      if (arr.includes(s)) return;
                      set('interests', [...arr, s]);
                    }}
                    className="rounded-full text-[11.5px] font-semibold px-2.5 py-1 ring-1 ring-slate-200 bg-white text-slate-600 hover:ring-slate-300 transition"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </FieldGroup>
          </div>

          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 md:flex-none inline-flex items-center justify-center rounded-full bg-white ring-1 ring-slate-200 hover:ring-slate-300 text-slate-800 font-bold text-[14px] px-5 py-3 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[14px] px-5 py-3 shadow-sm shadow-emerald-900/25 transition"
            >
              <Pencil className="size-4" strokeWidth={2.4} />
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, hint, children }) {
  return (
    <div>
      <div className="text-[12.5px] font-bold uppercase tracking-wider text-slate-500 mb-2">
        {label}
      </div>
      {children}
      {hint && <div className="mt-1.5 text-[11.5px] text-slate-400">{hint}</div>}
    </div>
  );
}

function ChipsRow({ items = [], onRemove, tone = 'slate' }) {
  if (items.length === 0) {
    return <div className="text-[12.5px] text-slate-400">None added yet.</div>;
  }
  const toneCls = tone === 'emerald'
    ? 'bg-emerald-50 ring-emerald-100 text-emerald-800'
    : 'bg-slate-50 ring-slate-100 text-slate-700';
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((v) => (
        <span
          key={v}
          className={`inline-flex items-center gap-1 rounded-full ring-1 ${toneCls} text-[12px] font-semibold pl-2.5 pr-1 py-0.5`}
        >
          {v}
          <button
            type="button"
            onClick={() => onRemove(v)}
            aria-label={`Remove ${v}`}
            className="grid place-items-center size-5 rounded-full hover:bg-white/60 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="size-3" strokeWidth={2.4} />
          </button>
        </span>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, label, icon: Icon }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 py-3 md:py-3.5 text-[14px] md:text-[15px] font-semibold transition ${
        active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {Icon && <Icon className="size-[17px]" strokeWidth={2.2} />}
      {label}
      {active && (
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 -bottom-px h-[3px] w-10 rounded-full bg-emerald-600"
        />
      )}
    </button>
  );
}

function ProfileTripCard({ trip, saved, onToggleBookmark }) {
  const Cat = CATEGORY_META[trip.type] || CATEGORY_META.Camping;
  const CatIcon = Cat.icon;

  return (
    <article className="group bg-white rounded-[22px] overflow-hidden ring-1 ring-slate-100 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_44px_-18px_rgba(15,23,42,0.22)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <Image
          src={trip.cover}
          alt={trip.title}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          unoptimized
          loading="lazy"
        />
        {/* Top-left badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${
              trip.mode === 'safar'
                ? 'bg-emerald-700 text-white'
                : 'bg-violet-600 text-white'
            }`}
          >
            {trip.mode === 'safar' && <ShieldCheck className="size-3.5" strokeWidth={2.4} />}
            {trip.mode === 'safar' ? 'Verified by Safar' : 'Self Hosted'}
          </span>
        </div>
        {/* Top-right date pill */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-semibold bg-white text-slate-800 shadow-sm ring-1 ring-black/5">
            {trip.dates}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 flex flex-col flex-1">
        <h3 className="font-display font-extrabold text-slate-900 text-[17px] md:text-[18px] tracking-tight leading-tight line-clamp-1">
          {trip.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-500">
          <MapPin className="size-[14px] text-slate-400" strokeWidth={2.2} />
          <span className="truncate">{trip.location}</span>
        </div>

        {/* Host + Category row */}
        <div className="mt-3.5 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid place-items-center size-7 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold ring-1 ring-emerald-100 shrink-0">
              {trip.host?.[0]?.toUpperCase() || 'H'}
            </span>
            <span className="text-[12.5px] text-slate-500 truncate">
              Hosted by <span className="font-semibold text-slate-900">{trip.host}</span>
            </span>
            {trip.verified && (
              <BadgeCheck className="size-4 text-violet-600 shrink-0" strokeWidth={2.4} />
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ring-1 ${Cat.color} shrink-0`}
          >
            <CatIcon className="size-3.5" strokeWidth={2.2} />
            {trip.type}
          </span>
        </div>

        {/* Joined */}
        <div className="mt-3 flex items-center gap-1.5 text-[12.5px] text-slate-500">
          <Users className="size-[14px] text-slate-400" strokeWidth={2.2} />
          <span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {trip.joined} / {trip.max}
            </span>{' '}
            joined
          </span>
        </div>

        {/* CTA row */}
        <div className="mt-4 flex items-center gap-2.5">
          <Link
            href={`/explore/trip/${trip.id}`}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-bold text-[13.5px] md:text-[14px] py-3 shadow-sm shadow-emerald-900/25 transition"
          >
            Request to Join
          </Link>
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={saved ? 'Remove bookmark' : 'Save trip'}
            className={`grid place-items-center size-11 rounded-xl ring-1 transition active:scale-95 ${
              saved
                ? 'bg-emerald-700 text-white ring-emerald-700'
                : 'bg-white text-slate-500 ring-slate-200 hover:text-slate-800 hover:ring-slate-300'
            }`}
          >
            <Bookmark className={`size-[17px] ${saved ? 'fill-white' : ''}`} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );
}

// ============================================================================
export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">
          <Loader2 className="size-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <MeInner />
    </Suspense>
  );
}
