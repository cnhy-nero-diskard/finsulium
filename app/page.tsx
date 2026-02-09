'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import OnboardingWizard from '@/components/onboarding-wizard';

export default function Home() {
  const router = useRouter();
  const { isOnboarded, setLoading } = useStore();

  useEffect(() => {
    if (isOnboarded) {
      setLoading(true);
      router.push('/dashboard');
    }
  }, [isOnboarded, router, setLoading]);

  if (isOnboarded) {
    return null; // Will redirect
  }

  return <OnboardingWizard />;
}
