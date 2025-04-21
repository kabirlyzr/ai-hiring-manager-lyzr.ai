/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CandidateFeedback } from "@/types/types";
import { updateFeedback } from "@/store/managerFeedbackSlice";

interface FeedbackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: CandidateFeedback | null;
}

export const FeedbackFormModal = ({ isOpen, onClose, feedback }: FeedbackFormModalProps) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    interviewDateTime: "",
    decision: "",
    feedback: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback) return;

    const now = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }); 
    const updatedFeedback: CandidateFeedback = {
      ...feedback,
      ...formData,
      decision: formData.decision as "Selected" | "Rejected",
      feedbackSharedDate: now,
    };

    dispatch(updateFeedback(updatedFeedback));
    onClose();
  };

  if (!feedback) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Provide Feedback for {feedback.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Interview Date</Label>
            <Input
              type="date"
              value={formData.interviewDateTime}
              onChange={(e) => setFormData({ ...formData, interviewDateTime: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Decision</Label>
            <RadioGroup
              value={formData.decision}
              onValueChange={(value: any) => setFormData({ ...formData, decision: value })}
              required
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Selected" id="selected" />
                <Label htmlFor="selected" className="text-green-600">Selected</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Rejected" id="rejected" />
                <Label htmlFor="rejected" className="text-red-600">Rejected</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Feedback</Label>
            <Textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="Provide detailed feedback about the candidate..."
              required
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Feedback
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};