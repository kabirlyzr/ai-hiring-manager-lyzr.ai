export type Decision = "Selected" | "Rejected";

export interface CandidateFeedback {
  id: string;
  name: string;
  resumeLink: string;
  interviewDateTime: string;
  decision: Decision;
  feedback: string;
  feedbackSharedDate: string;
}