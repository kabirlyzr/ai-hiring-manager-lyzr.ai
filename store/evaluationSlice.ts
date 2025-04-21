import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Candidate, EvaluationResult } from '../types/types';
import { FileStorage } from '@/utils/fileStorage';

interface EvaluationState {
  candidates: Candidate[];
  results: EvaluationResult[] | null;
}

const initialState: EvaluationState = {
  candidates: [],
  results: null
};

const evaluationSlice = createSlice({
  name: 'evaluation',
  initialState,
  reducers: {
    addCandidates: (state, action: PayloadAction<Candidate[]>) => {
      state.candidates.push(...action.payload);
    },
    updateCandidate: (state, action: PayloadAction<Candidate>) => {
      const index = state.candidates.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.candidates[index] = action.payload;
      }
    },
    removeCandidate: (state, action: PayloadAction<string>) => {
      const candidate = state.candidates.find(c => c.id === action.payload);
      if (candidate) {
        FileStorage.remove(candidate.fileId);
      }
      state.candidates = state.candidates.filter(c => c.id !== action.payload);
    },
    clearCandidates: (state) => {
      state.candidates.forEach(candidate => {
        FileStorage.remove(candidate.fileId);
      });
      state.candidates = [];
    },
    setEvaluationResults: (state, action: PayloadAction<EvaluationResult[]>) => {
      state.results = action.payload;
    },
    resetEvaluation: (state) => {
      state.candidates.forEach(candidate => {
        FileStorage.remove(candidate.fileId);
      });
      state.candidates = [];
      state.results = null;
    }
  }
});

export const {
  addCandidates,
  updateCandidate,
  removeCandidate,
  clearCandidates,
  setEvaluationResults,
  resetEvaluation
} = evaluationSlice.actions;

export default evaluationSlice.reducer;