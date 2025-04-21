import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CandidateFeedback } from "@/types/managerFeedback";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: CandidateFeedback | null;
}

export const FeedbackModal = ({ isOpen, onClose, feedback }: FeedbackModalProps) => {
  if (!feedback) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Feedback for {feedback.name}</DialogTitle>
          <DialogDescription>
            Interview conducted on {feedback.interviewDateTime}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-medium">Decision</h4>
            <p className={feedback.decision === "Selected" ? "text-success" : "text-destructive"}>
              {feedback.decision}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Detailed Feedback</h4>
            <p className="text-muted-foreground">{feedback.feedback}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Feedback shared with HR on {feedback.feedbackSharedDate}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};