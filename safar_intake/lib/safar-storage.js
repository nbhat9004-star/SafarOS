'use client';
/* eslint-disable react-hooks/set-state-in-effect */
// Safar client-side storage for wishlist, saved AI plans, and leads.
// Uses localStorage — NO new API endpoints. Keyed by user.id when logged in,
// otherwise by an anonymous key. All hooks are SSR-safe.

import { useCallback, useEffect, useState } from 'react';

const ANON_KEY = 'anon';
const nsKey = (userId, ns) => `safar:${ns}:${userId || ANON_KEY}`;
const LEADS_KEY = 'safar:leads';

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Notify same-tab listeners (storage event only fires in OTHER tabs)
    window.dispatchEvent(new CustomEvent('safar-storage', { detail: { key } }));
  } catch (err) {
    console.error('safar-storage write failed', err);
  }
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------
export function getWishlist(userId) {
  return read(nsKey(userId, 'wishlist'), []);
}

export function setWishlist(userId, ids) {
  write(nsKey(userId, 'wishlist'), ids);
}

export function toggleWishlist(userId, listingId) {
  const list = getWishlist(userId);
  const next = list.includes(listingId)
    ? list.filter((x) => x !== listingId)
    : [listingId, ...list];
  setWishlist(userId, next);
  return next;
}

export function useWishlist(userId) {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(getWishlist(userId));
    const onChange = (e) => {
      const k = e?.detail?.key || e?.key;
      if (!k || k.startsWith(nsKey(userId, 'wishlist'))) {
        setIds(getWishlist(userId));
      }
    };
    window.addEventListener('safar-storage', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('safar-storage', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [userId]);

  const toggle = useCallback(
    (listingId) => {
      const next = toggleWishlist(userId, listingId);
      setIds(next);
      return next;
    },
    [userId]
  );

  return { ids, has: (id) => ids.includes(id), toggle };
}

// ---------------------------------------------------------------------------
// Saved AI Plans
// ---------------------------------------------------------------------------
export function getSavedPlans(userId) {
  return read(nsKey(userId, 'plans'), []);
}

export function savePlan(userId, plan) {
  const list = getSavedPlans(userId);
  const id = plan.id || `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    title: plan.title || `${plan.days || 5}-day Kashmir trip`,
    days: plan.days,
    budget: plan.budget,
    travelers: plan.travelers,
    itinerary: plan.itinerary || [],
    total: plan.total,
    lead: plan.lead || null,
    createdAt: plan.createdAt || new Date().toISOString(),
  };
  const filtered = list.filter((p) => p.id !== id);
  const next = [record, ...filtered].slice(0, 50);
  write(nsKey(userId, 'plans'), next);
  return record;
}

export function getPlan(userId, id) {
  return getSavedPlans(userId).find((p) => p.id === id) || null;
}

export function deletePlan(userId, id) {
  const next = getSavedPlans(userId).filter((p) => p.id !== id);
  write(nsKey(userId, 'plans'), next);
  return next;
}

export function useSavedPlans(userId) {
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlans(getSavedPlans(userId));
    const onChange = (e) => {
      const k = e?.detail?.key || e?.key;
      if (!k || k.startsWith(nsKey(userId, 'plans'))) {
        setPlans(getSavedPlans(userId));
      }
    };
    window.addEventListener('safar-storage', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('safar-storage', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [userId]);
  return {
    plans,
    save: (p) => savePlan(userId, p),
    remove: (id) => setPlans(deletePlan(userId, id)),
  };
}

// ---------------------------------------------------------------------------
// Leads (AI Planner lead-capture)
// ---------------------------------------------------------------------------
export function saveLead(lead) {
  const list = read(LEADS_KEY, []);
  const record = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    source: lead.source || 'ai-planner',
    context: lead.context || null,
    createdAt: new Date().toISOString(),
  };
  write(LEADS_KEY, [record, ...list].slice(0, 500));
  return record;
}

export function getLeads() {
  return read(LEADS_KEY, []);
}
