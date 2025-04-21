'use client'
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface JobStep {
  currentStep: string;
  steps: {
    title: string;
    path: string;
    completed: boolean;
  }[];
}

const initialState: JobStep = {
  currentStep: "/jobs/create/details",
  steps: [
    { title: "Job Details", path: "/jobs/create/details", completed: false },
    { title: "Evaluation Criteria", path: "/jobs/create/criteria", completed: false },
    { title: "Applicants Evaluation", path: "/jobs/create/applicants", completed: false },
  ]
};

const jobStepSlice = createSlice({
  name: 'jobStep',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<string>) => {
      state.currentStep = action.payload;
    },
    markStepCompleted: (state, action: PayloadAction<string>) => {
      const stepIndex = state.steps.findIndex(step => step.path === action.payload);
      if (stepIndex !== -1) {
        state.steps[stepIndex].completed = true;
      }
    },
    resetSteps: (state) => {
      state.currentStep = "/jobs/create/details";
      state.steps.forEach(step => {
        step.completed = false;
      });
    }
  },
});

export const { setCurrentStep, markStepCompleted, resetSteps } = jobStepSlice.actions;
export default jobStepSlice.reducer; 