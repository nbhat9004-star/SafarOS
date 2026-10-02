'use client';

// SafarOS — IndexedDB abstraction (reusable offline persistence foundation).
// Intentionally dependency-free. All browser access is SSR-guarded.
// NOTE: This is foundation only — it does NOT mirror server collections.

const DB_NAME = 'safaros_offline';
const DB_VERSION = 1;

export const STORES = {
  records: 'records',     // optional cached entity records (future use)
  mutations: 'mutations', // pending sync queue
  syncMeta: 'syncMeta',   // per-entity / per-record sync metadata
  idMap: 'idMap',         // localId -> serverId mapping
};

let _dbPromise = null;

function hasIDB() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

export function offlineAvailable() {
  return hasIDB();
}

function openDb() {
  if (!hasIDB()) return Promise.reject(new Error('IndexedDB unavailable'));
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    let req;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.records)) {
        const s = db.createObjectStore(STORES.records, { keyPath: 'key' });
        s.createIndex('entityType', 'entityType', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.mutations)) {
        const s = db.createObjectStore(STORES.mutations, { keyPath: 'id' });
        s.createIndex('status', 'status', { unique: false });
        s.createIndex('entityType', 'entityType', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.syncMeta)) {
        db.createObjectStore(STORES.syncMeta, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.idMap)) {
        db.createObjectStore(STORES.idMap, { keyPath: 'localId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function run(storeName, mode, makeReq) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const r = makeReq(store);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }));
}

export const idbGet = (store, key) => run(store, 'readonly', (s) => s.get(key));
export const idbGetAll = (store) => run(store, 'readonly', (s) => s.getAll());
export const idbPut = (store, value) => run(store, 'readwrite', (s) => s.put(value));
export const idbDelete = (store, key) => run(store, 'readwrite', (s) => s.delete(key));
export const idbClear = (store) => run(store, 'readwrite', (s) => s.clear());

// --- id mapping helpers (localId -> serverId) ---
export const mapLocalToServer = (localId, serverId, entityType) =>
  idbPut(STORES.idMap, { localId, serverId, entityType, mappedAt: new Date().toISOString() });
export const getServerId = async (localId) => {
  const rec = await idbGet(STORES.idMap, localId);
  return rec ? rec.serverId : null;
};

// --- sync metadata helpers ---
export const putSyncMeta = (meta) => idbPut(STORES.syncMeta, meta);
export const getSyncMeta = (key) => idbGet(STORES.syncMeta, key);
