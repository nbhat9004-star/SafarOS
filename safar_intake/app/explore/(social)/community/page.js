'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Community tiles are folded into the new Explore Home in V2.
export default function CommunityRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/explore/home'); }, [router]);
  return null;
}
