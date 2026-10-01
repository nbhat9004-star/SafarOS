'use client';
import { useCallback, useEffect, useState } from 'react';

// Reusable client for the Safar listings API
export async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-json */ }
  return { ok: res.ok, status: res.status, data };
}

export function buildQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue;
    if (Array.isArray(v)) { if (v.length) q.set(k, v.join(',')); }
    else q.set(k, String(v));
  }
  const s = q.toString();
  return s ? '?' + s : '';
}

// Listings list hook
export function useListings(params = {}, deps = []) {
  const [data, setData] = useState({ listings: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcher = useCallback(async () => {
    setLoading(true); setError(null);
    const { ok, data, status } = await apiJson('/api/listings' + buildQuery(params));
    if (ok && data?.ok) setData({ listings: data.listings || [], total: data.total || 0 });
    else setError(data?.error || `Failed to load listings (${status})`);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { fetcher(); }, [fetcher]);
  return { ...data, loading, error, refresh: fetcher };
}

// Single listing hook
export function useListing(id) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      setLoading(true); setError(null);
      const { ok, data, status } = await apiJson(`/api/listings/${id}`);
      if (cancel) return;
      if (ok && data?.ok) setListing(data.listing);
      else setError(data?.error || `Failed to load (${status})`);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [id]);
  return { listing, loading, error };
}

// CRUD helpers
export const listingsApi = {
  list: (params) => apiJson('/api/listings' + buildQuery(params)),
  get:  (id) => apiJson(`/api/listings/${id}`),
  create: (payload) => apiJson('/api/listings', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => apiJson(`/api/listings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => apiJson(`/api/listings/${id}`, { method: 'DELETE' }),
  myHostListings: () => apiJson('/api/listings/host/me'),
  byHost: (hostId) => apiJson(`/api/listings/host/${hostId}`),
  approve: (id) => apiJson(`/api/listings/${id}/approve`, { method: 'POST' }),
  reject:  (id, reason) => apiJson(`/api/listings/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

export const bookingsApi = {
  create: (payload) => apiJson('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  list:   (view) => apiJson('/api/bookings' + buildQuery({ view })),
  get:    (id) => apiJson(`/api/bookings/${id}`),
  patch:  (id, status) => apiJson(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  availability: (listingId) => apiJson(`/api/listings/${listingId}/availability`),
  timeline: (id) => apiJson(`/api/bookings/${id}/timeline`),
};

// Hook to fetch a listing's booked date ranges
export function useAvailability(listingId) {
  const [bookedRanges, setBookedRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    const { ok, data } = await bookingsApi.availability(listingId);
    if (ok && data?.ok) setBookedRanges(data.bookedRanges || []);
    setLoading(false);
  }, [listingId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { bookedRanges, loading, refresh };
}
