'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useAuth } from '@/components/auth/AuthProvider';
import OnboardingModal from './OnboardingModal';

const OnboardingCheck = () => {
  const [showModal, setShowModal] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const companyData = useSelector((state: RootState) => state.companySetup);
  const onboardingComplete = useSelector((state: RootState) => state.onboarding.isComplete);
  
  // Check if company data is missing
  const isDataMissing = !companyData.companyName || !companyData.website || !companyData.about;
  
  useEffect(() => {
    // Only show onboarding if authenticated, not loading, data is missing, and onboarding not already completed
    if (isAuthenticated && !isLoading && isDataMissing && !onboardingComplete) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, isLoading, isDataMissing, onboardingComplete]);
  
  // Prevent closing the modal if data is still missing
  const handleOpenChange = (open: boolean) => {
    if (open === false && isDataMissing && !onboardingComplete) {
      // Don't allow closing if data is still missing
      return;
    }
    setShowModal(open);
  };
  
  return (
    <OnboardingModal 
      open={showModal} 
      onOpenChange={handleOpenChange} 
    />
  );
};

export default OnboardingCheck; 