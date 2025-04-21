/* eslint-disable @typescript-eslint/no-explicit-any */
// types/evaluation.ts

export interface EvaluationCriterion {
  criteria: string;
  score: number;
  reason: string;
}

export interface EvaluationResult {
  name: string;
  "Final score": number;
  status: string;
  reason: string;
  meeting_scheduled: string;
  criteria: EvaluationCriterion[];
  fileId: string;
}

export interface BatchJobData {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  fileIds: string[];
  totalCandidates: number;
  completedCandidates: number;
  results: EvaluationResult[];
  errors: Array<{
    fileId: string;
    error: string;
  }>;
  error?: string;
  startTime: Date;
  lastUpdated: Date;
}

export type BatchJobUpdateData = Partial<Omit<BatchJobData, 'jobId' | 'startTime'>>;

export interface EvaluationJob {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  startTime: Date;
  lastUpdated: Date;
  fileId: string;
  result?: any;
  error?: string;
}

export interface Candidate {
    fileName: string;
    id: string;
    name: string;
    fileId: string; // Instead of storing File object, store a reference
  }

export interface Criterion {
    id: number;
    name: string;
    description: string;
    weight: number;
}

export interface CriteriaScore {
    criteria: string;
    score: string;
    reason: string;
}

export interface EvaluationResult {
  id: string;
  name: string;
  fileId: string; // Add this
  "Final score": number;
  email:string;
  status: string;
  reason: string;
  meeting_scheduled: string;
  criteria: {
    criteria: string;
    score: number;
    reason: string;
  }[];
}

export type Decision = "Selected" | "Rejected" | "Unanswered";

export interface CandidateFeedback {
  id: string;
  name: string;
  fileId: string;  // Changed from resumeLink to fileId for PDF storage
  interviewDateTime?: string;
  decision: Decision;
  feedback?: string;
  feedbackSharedDate?: string;
}

export interface ManagerFeedbackState {
  feedbacks: CandidateFeedback[];
}



// types/evaluation.ts

// Basic Types
export interface Candidate {
  id: string;
  name: string;
  fileId: string;
  fileName: string;
}

export interface JobDetails {
  title: string;
  description: string;
}

export interface Criterion {
  id: number;
  name: string;
  description: string;
  weight: number;
}

// Evaluation Status Types
export type EvaluationStatus = 'pending' | 'completed' | 'failed';


// Hook Return Type
export interface UseEvaluationPollingReturn {
  isPolling: boolean;
}


export interface UseEvaluationPollingProps {
  jobId: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  retryCount?: number;
}