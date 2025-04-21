/* eslint-disable @typescript-eslint/no-unused-vars */
import { useDispatch } from "react-redux";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Info, PenLine } from "lucide-react";
import { CandidateFeedback, Decision } from "@/types/types";
import { updateFeedback } from "@/store/managerFeedbackSlice";

interface FeedbackTableProps {
  feedbacks: CandidateFeedback[];
  onViewFeedback: (feedback: CandidateFeedback) => void;
  filter: "All" | Decision;
  onOpenPDF: (fileId: string) => void;
}

export const FeedbackTable = ({ feedbacks, onViewFeedback, filter, onOpenPDF }: FeedbackTableProps) => {
  const dispatch = useDispatch();

  const getStatusColor = (decision: Decision) => {
    switch (decision) {
      case "Selected": return "text-green-600";
      case "Rejected": return "text-red-600";
      case "Unanswered": return "text-yellow-600";
      default: return "";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Interview Date</TableHead>
          <TableHead>Feedback Date</TableHead>
          <TableHead>Resume</TableHead>
          <TableHead>Response</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {feedbacks.map((feedback) => (
          <TableRow key={feedback.id}>
            <TableCell>{feedback.name}</TableCell>
            <TableCell className={getStatusColor(feedback.decision)}>
              {feedback.decision}
            </TableCell>
            <TableCell>{feedback.interviewDateTime || "Not scheduled"}</TableCell>
            <TableCell>{feedback.feedbackSharedDate || "-"}</TableCell>
            <TableCell className="">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenPDF(feedback.fileId)}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TableCell>
            <TableCell className="">
              {feedback.decision === "Unanswered" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewFeedback(feedback)}
                >
                  <PenLine className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewFeedback(feedback)}
                >
                 <Info className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};