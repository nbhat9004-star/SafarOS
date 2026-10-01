'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// AI Host Wizard - Feature disabled, redirects to standard host onboarding
export default function AIListingWizard() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/add-listing');
  }, [router]);

  return null;
}
