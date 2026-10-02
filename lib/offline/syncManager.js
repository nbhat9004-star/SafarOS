'use client';

// SafarOS — reusable sync engine + global connectivity/status singleton.
//
// Design principles:
//  - The SERVER remains authoritative (agencyId, RBAC, validation, ownership).
//  - Mutations are replayed through the EXISTING authenticated module endpoints,
//    so tenant isolation + validation are never bypassed (no generic sync bypass).
//  - No aggressive polling. Triggers: startup, connectivity-restored, explicit, enqueue.

import {
  MUTATION_STATUS, enqueueMutation, listPending, updateMutation,
  removeMutation, countPending,
} from './syncQueue';
import { offlineAvailable, mapLocalToServer } from './offlineDb';
import { isLocalId } from './localId';

export const SYNC_STATUS = {
  synced: 'synced', syncing: 'syncing', pending: 'pending', offline: 'offline', error: 'error',
};

const MAX_RETRY = 5;

// entityType -> API base path. Future modules can register their own.
const registry = {};
export function registerEntity(entityType, basePath) { registry[entityType] = { basePath }; }

let state = {
  online: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
  status: 'synced',
  pendingCount: 0,
  lastError: null,
  lastSyncedAt: '',
};

const listeners = new Set();
export function getState() { return { ...state }; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { for (const l of listeners) { try { l(getState()); } catch (e) { /* ignore */ } } }
function setState(patch) { state = { ...state, ...patch }; emit(); }

function computeIdle(online, pending) {
  if (!online) return 'offline';
  return pending > 0 ? 'pending' : 'synced';
}

async function refreshPending() {
  try {
    const n = await countPending();
    setState({ pendingCount: n, status: state.status === 'syncing' ? 'syncing' : computeIdle(state.online, n) });
  } catch (e) { /* ignore */ }
}

function classify(status) {
  if (status === 401 || status === 403) return 'auth';       // do not auto-retry
  if (status === 409) return 'conflict';                      // needs resolution
  if (status === 400 || status === 422) return 'validation';  // do not auto-retry
  return 'server';                                            // 5xx / other -> retry
}

async function applyMutation(m) {
  const reg = registry[m.entityType];
  if (!reg) return { outcome: 'failed', error: 'Unknown entity type: ' + m.entityType };
  let url = '/api' + reg.basePath;
  let method = 'POST';
  if (m.op === 'update') { method = 'PUT'; url += '/' + m.serverId; }
  else if (m.op === 'delete') { method = 'DELETE'; url += '/' + m.serverId; }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: m.op === 'delete' ? undefined : JSON.stringify(m.payload || {}),
    });
  } catch (e) {
    return { outcome: 'retry', error: 'network: ' + ((e && e.message) || 'request failed') };
  }

  if (res.ok) {
    let data = {};
    try { data = await res.json(); } catch (e) { /* ignore */ }
    return { outcome: 'synced', data };
  }

  const kind = classify(res.status);
  let msg = 'HTTP ' + res.status;
  try { const j = await res.json(); if (j && j.error) msg = j.error; } catch (e) { /* ignore */ }
  if (kind === 'server') return { outcome: 'retry', error: msg };
  if (kind === 'conflict') return { outcome: 'conflict', error: msg };
  return { outcome: 'failed', error: kind + ': ' + msg };
}

function extractServerId(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.id) return data.id;
  // Module endpoints return { client }, { booking }, { vehicle } etc.
  const first = Object.values(data)[0];
  return first && typeof first === 'object' && first.id ? first.id : null;
}

let _running = false;
export async function processQueue() {
  if (!offlineAvailable() || _running || !state.online) return;
  _running = true;
  setState({ status: 'syncing' });
  let hadTransient = false;
  try {
    const pending = await listPending();
    for (const m of pending) {
      if (m.status === MUTATION_STATUS.error && (m.retryCount || 0) >= MAX_RETRY) continue; // keep, stop auto-retry
      await updateMutation(m.id, { status: MUTATION_STATUS.syncing, lastAttemptAt: new Date().toISOString() });
      const r = await applyMutation(m);
      if (r.outcome === 'synced') {
        if (m.op === 'create' && isLocalId(m.localId)) {
          const serverId = extractServerId(r.data);
          if (serverId) { try { await mapLocalToServer(m.localId, serverId, m.entityType); } catch (e) { /* ignore */ } }
        }
        await removeMutation(m.id);
      } else if (r.outcome === 'retry') {
        hadTransient = true;
        await updateMutation(m.id, { status: MUTATION_STATUS.error, retryCount: (m.retryCount || 0) + 1, error: { kind: 'transient', message: r.error } });
      } else if (r.outcome === 'conflict') {
        await updateMutation(m.id, { status: MUTATION_STATUS.conflict, error: { kind: 'conflict', message: r.error } });
      } else {
        await updateMutation(m.id, { status: MUTATION_STATUS.failed, error: { kind: 'permanent', message: r.error } });
      }
    }
    const remaining = await countPending();
    setState({
      status: hadTransient ? 'error' : computeIdle(state.online, remaining),
      pendingCount: remaining,
      lastSyncedAt: new Date().toISOString(),
      lastError: hadTransient ? state.lastError : null,
    });
  } finally {
    _running = false;
  }
}

export async function syncNow() {
  if (!state.online) { setState({ status: 'offline' }); return; }
  await processQueue();
}

// Enqueue + opportunistically sync. This is the primary API future modules call.
export async function enqueue(args) {
  const m = await enqueueMutation(args);
  await refreshPending();
  if (state.online) processQueue();
  return m;
}

let _inited = false;
export function initSync() {
  if (_inited || typeof window === 'undefined') return;
  _inited = true;
  const onOnline = () => { setState({ online: true }); refreshPending().then(() => processQueue()); };
  const onOffline = () => setState({ online: false, status: 'offline' });
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  setState({ online: navigator.onLine !== false });
  refreshPending().then(() => { if (state.online) processQueue(); });
}

// Default registrations for known SafarOS entities so future modules can opt in
// simply by enqueuing { entityType: 'client', op: 'create', ... }.
registerEntity('client', '/clients');
registerEntity('lead', '/leads');
registerEntity('contact', '/contacts');
registerEntity('followup', '/followups');
registerEntity('task', '/tasks');
registerEntity('quotation', '/quotations');
registerEntity('package', '/packages');
registerEntity('itinerary', '/itineraries');
registerEntity('supplier', '/suppliers');
registerEntity('booking', '/bookings');
registerEntity('vehicle', '/vehicles');
registerEntity('driver', '/drivers');
