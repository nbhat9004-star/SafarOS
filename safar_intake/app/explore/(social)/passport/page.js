'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Passport is retired in Explore V2. This route now redirects to the new
// Explore Home so any legacy links continue to work.
export default function PassportRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/explore/home'); }, [router]);
  return null;
}
