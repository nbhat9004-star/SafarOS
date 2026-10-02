'use client';

// SafarOS — temporary local id strategy for offline-created records.
// Local ids are prefixed so they can never collide with server UUIDs.

export const LOCAL_PREFIX = 'local_';

export function newLocalId() {
  const rnd = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
  return LOCAL_PREFIX + rnd;
}

export function isLocalId(id) {
  return typeof id === 'string' && id.startsWith(LOCAL_PREFIX);
}
