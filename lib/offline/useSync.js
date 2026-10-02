'use client';

// SafarOS — React hook exposing connectivity + sync status to UI components.

import { useEffect, useState } from 'react';
import { getState, subscribe, initSync, syncNow } from './syncManager';

export function useSync() {
  const [snap, setSnap] = useState(getState());
  useEffect(() => {
    initSync();
    const unsub = subscribe(setSnap);
    setSnap(getState());
    return unsub;
  }, []);
  return { ...snap, syncNow };
}
