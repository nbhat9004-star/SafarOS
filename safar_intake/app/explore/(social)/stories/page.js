'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Stories are hidden in Explore V2. Redirect to the new Explore Home.
export default function StoriesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/explore/home'); }, [router]);
  return null;
}
