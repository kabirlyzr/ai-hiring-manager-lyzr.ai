'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import OnboardingContainer from '@/components/onboarding/OnboardingContainer';
import { useAuth } from '@/components/auth/AuthProvider';

export default function OnboardingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const isOnboardingComplete = useSelector((state: RootState) => state.onboarding.isComplete);
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (isOnboardingComplete) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, isOnboardingComplete, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <OnboardingContainer />;
} 