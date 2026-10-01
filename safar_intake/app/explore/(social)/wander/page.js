'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Wander (swipe discovery) is retired in Explore V2 — the new Explore Home
// serves this purpose with a cleaner trip-first experience.
export default function WanderRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/explore/home'); }, [router]);
  return null;
}
