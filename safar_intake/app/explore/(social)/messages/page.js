'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function MessagesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/explore/home'); }, [router]);
  return null;
}
