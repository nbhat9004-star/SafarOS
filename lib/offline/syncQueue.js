'use client';

// SafarOS — reusable local sync queue (backed by IndexedDB).
// A single shared queue serves all modules; entity-specific behaviour is
// expressed via `entityType` + `op`, not via separate queues.

import { STORES, idbGet, idbGetAll, idbPut, idbDelete } from './offlineDb';

export const MUTATION_STATUS = {
  pending: 'pending',   // waiting to sync
  syncing: 'syncing',   // in-flight
  synced: 'synced',     // succeeded (usually removed)
  conflict: 'conflict', // server/local conflict — needs resolution
  failed: 'failed',     // permanent (auth/validation) — needs attention
  error: 'error',       // transient (network/server) — will retry
};

export const OP_TYPES = ['create', 'update', 'delete'];

function genId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
}

// Enqueue a mutation. entityType maps to an API route via the sync engine registry.
export async function enqueueMutation({ op, entityType, localId, serverId, payload }) {
  if (!OP_TYPES.includes(op)) throw new Error('Invalid operation type: ' + op);
  if (!entityType) throw new Error('entityType is required');
  const now = new Date().toISOString();
  const mutation = {
    id: genId(),
    op,
    entityType,
    localId: localId || '',
    serverId: serverId || '',
    payload: payload || {},
    status: MUTATION_STATUS.pending,
    retryCount: 0,
    lastAttemptAt: '',
    error: null,
    createdAt: now,
    updatedAt: now,
  };
  await idbPut(STORES.mutations, mutation);
  return mutation;
}

export async function listMutations() {
  return (await idbGetAll(STORES.mutations)) || [];
}

// Pending = anything safe to (re)try automatically: fresh or transient-error.
export async function listPending() {
  return (await listMutations()).filter(
    (m) => m.status === MUTATION_STATUS.pending || m.status === MUTATION_STATUS.error,
  );
}

// Unresolved = everything that still needs attention (for future resolution UI).
export async function listUnresolved() {
  return (await listMutations()).filter((m) => m.status !== MUTATION_STATUS.synced);
}

export async function updateMutation(id, patch) {
  const m = await idbGet(STORES.mutations, id);
  if (!m) return null;
  const next = { ...m, ...patch, updatedAt: new Date().toISOString() };
  await idbPut(STORES.mutations, next);
  return next;
}

export async function removeMutation(id) {
  return idbDelete(STORES.mutations, id);
}

export async function countPending() {
  return (await listPending()).length;
}
