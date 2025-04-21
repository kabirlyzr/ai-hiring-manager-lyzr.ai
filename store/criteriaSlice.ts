// store/criteriaSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Criterion {
  id: number;
  name: string;
  description: string;
  weight: number;
}

interface CriteriaState {
  criteria: Criterion[];
}

const initialState: CriteriaState = {
  criteria: []
};

const criteriaSlice = createSlice({
  name: 'criteria',
  initialState,
  reducers: {
    addCriterion: (state, action: PayloadAction<Criterion>) => {
      state.criteria.push(action.payload);
    },
    removeCriterion: (state, action: PayloadAction<number>) => {
      state.criteria = state.criteria.filter(c => c.id !== action.payload);
    },
    resetCriteria: (state) => {
      state.criteria = [];
    }
  }
});

export const { addCriterion, removeCriterion, resetCriteria } = criteriaSlice.actions;
export default criteriaSlice.reducer;