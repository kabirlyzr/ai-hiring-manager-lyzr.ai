'use client'
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingState {
  currentStep: number;
  isComplete: boolean;
  companyDetails: {
    name: string;
    website: string;
    industry: string;
    size: string;
    description: string;
  };
  recruiterDetails: {
    name: string;
    email: string;
    role: string;
    phone: string;
  };
}

const initialState: OnboardingState = {
  currentStep: 0,
  isComplete: false,
  companyDetails: {
    name: '',
    website: '',
    industry: '',
    size: '',
    description: ''
  },
  recruiterDetails: {
    name: '',
    email: '',
    role: '',
    phone: ''
  }
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setCompanyDetails: (state, action: PayloadAction<OnboardingState['companyDetails']>) => {
      state.companyDetails = action.payload;
    },
    setRecruiterDetails: (state, action: PayloadAction<OnboardingState['recruiterDetails']>) => {
      state.recruiterDetails = action.payload;
    },
    completeOnboarding: (state) => {
      state.isComplete = true;
    },
    resetOnboarding: () => initialState
  }
});

export const { 
  setCurrentStep, 
  setCompanyDetails, 
  setRecruiterDetails,
  completeOnboarding,
  resetOnboarding
} = onboardingSlice.actions;

export default onboardingSlice.reducer; 