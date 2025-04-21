/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCurrentStep } from '@/store/onboardingSlice';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CompanyDetailsForm from './CompanyDetailsForm';
import RecruiterDetailsForm from './RecruiterDetailsForm';
import { Check, CircleDashed } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OnboardingModal = ({ open, onOpenChange }: OnboardingModalProps) => {
  const dispatch = useDispatch();
  const { currentStep, isComplete } = useSelector((state: RootState) => state.onboarding);
  const companyDetails = useSelector((state: RootState) => state.onboarding.companyDetails);
  
  // Check if company setup is complete
  const isCompanyComplete = Boolean(
    companyDetails.name && 
    companyDetails.website && 
    companyDetails.description
  );

  // Array of steps for the onboarding process
  const steps = [
    { id: "company-setup", label: "Company Setup" },
    { id: "recruiter", label: "Recruiter Information" }
  ];

  useEffect(() => {
    if (isComplete) {
      onOpenChange(false);
    }
  }, [isComplete, onOpenChange]);

  const handleStepClick = (index: number) => {
    // Only allow moving to next step if current step is complete
    if (index > 0 && !isCompanyComplete) {
      return;
    }
    dispatch(setCurrentStep(index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70%] p-6 bg-white rounded-lg overflow-hidden max-h-[85vh]">
        <div>
          <h1 className="text-xl font-semibold mb-6">Onboarding</h1>
          
          {/* Steps indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button 
                    onClick={() => handleStepClick(index)}
                    disabled={index > 0 && !isCompanyComplete}
                    className={`flex items-center ${index > 0 && !isCompanyComplete ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 ${
                      currentStep > index 
                        ? 'bg-green-50 text-green-600 border border-green-200' 
                        : currentStep === index 
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      {currentStep > index ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className={`
                      text-sm font-medium 
                      ${currentStep === index ? 'text-indigo-600' : currentStep > index ? 'text-green-600' : 'text-gray-500'}
                    `}>
                      {step.label}
                    </span>
                  </button>
                  
                  {/* Connector line between steps */}
                  {index < steps.length - 1 && (
                    <div className={`h-[2px] w-24 mx-2 ${currentStep > index ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="py-4">
            {currentStep === 0 ? <CompanyDetailsForm /> : <RecruiterDetailsForm />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal; 