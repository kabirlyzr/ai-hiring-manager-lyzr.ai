import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CandidateFeedback, ManagerFeedbackState } from '@/types/types';

const initialState: ManagerFeedbackState = {
  feedbacks: []
};

export const managerFeedbackSlice = createSlice({
  name: 'managerFeedback',
  initialState,
  reducers: {
    initializeFeedbacks: (state, action: PayloadAction<CandidateFeedback[]>) => {
      state.feedbacks = action.payload;
    },
    updateFeedback: (state, action: PayloadAction<CandidateFeedback>) => {
      const index = state.feedbacks.findIndex((f: { id: string; }) => f.id === action.payload.id);
      if (index !== -1) {
        state.feedbacks[index] = action.payload;
      }
    },
    addFeedback: (state, action: PayloadAction<CandidateFeedback>) => {
      state.feedbacks.push(action.payload);
    }
  }
});

export const { initializeFeedbacks, updateFeedback, addFeedback } = managerFeedbackSlice.actions;
export default managerFeedbackSlice.reducer;