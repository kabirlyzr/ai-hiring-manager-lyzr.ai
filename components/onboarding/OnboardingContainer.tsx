'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store/store';
import { setCurrentStep } from '@/store/onboardingSlice';
import RecruiterDetailsForm from './RecruiterDetailsForm';
import { ProgressIndicator } from './ProgressIndicator';
import CompanyDetailsForm from './CompanyDetailsForm';

const OnboardingContainer = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { currentStep, isComplete } = useSelector((state: RootState) => state.onboarding);

  useEffect(() => {
    if (isComplete) {
      router.push('/');
    }
  }, [isComplete, router]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <CompanyDetailsForm />;
      case 1:
        return <RecruiterDetailsForm />;
      default:
        return <CompanyDetailsForm />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <ProgressIndicator 
          steps={['Company Details', 'Recruiter Details']} 
          currentStep={currentStep} 
          onStepClick={(step) => dispatch(setCurrentStep(step))}
        />
        <div className="mt-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingContainer; 