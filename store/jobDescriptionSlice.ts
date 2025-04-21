'use client'
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface JobDescription {
  id: string;
  jobTitle: string;
  requirements: string;
  description: string;
  createdAt: string;
}

interface JobDescriptionState {
  savedJobs: JobDescription[];
}

const initialState: JobDescriptionState = {
  savedJobs: [],
};

const jobDescriptionSlice = createSlice({
  name: 'jobDescription',
  initialState,
  reducers: {
    saveJobDescription: (state, action: PayloadAction<JobDescription>) => {
      state.savedJobs.push(action.payload);
    },
  },
});

export const { saveJobDescription } = jobDescriptionSlice.actions;
export default jobDescriptionSlice.reducer;