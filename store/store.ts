'use client';
import { configureStore } from '@reduxjs/toolkit';
import companySetupReducer from './companySetupSlice';
import jobDescriptionReducer from './jobDescriptionSlice';
import evaluationReducer from './evaluationSlice';
import managerFeedbackReducer from './managerFeedbackSlice';
import criterionReducer from "./criteriaSlice"
import onboardingReducer from './onboardingSlice';

export const store = configureStore({
  reducer: {
    companySetup: companySetupReducer,
    jobDescription: jobDescriptionReducer,
    evaluation: evaluationReducer,
    managerFeedback:managerFeedbackReducer,
    criteria:criterionReducer,
    onboarding: onboardingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;