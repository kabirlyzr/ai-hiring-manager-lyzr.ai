'use client'
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CompanySetupData {
  companyName: string;
  website: string;
  about: string;
}

const initialState: CompanySetupData = {
  companyName: '',
  website: '',
  about: '',
};

const companySetupSlice = createSlice({
  name: 'companySetup',
  initialState,
  reducers: {
    updateCompanySetupData: (state, action: PayloadAction<CompanySetupData>) => {
      state.companyName = action.payload.companyName;
      state.website = action.payload.website;
      state.about = action.payload.about;
    },
  },
});

export const { updateCompanySetupData } = companySetupSlice.actions;
export default companySetupSlice.reducer;