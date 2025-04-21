/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/FeedbackModal";
import { FeedbackFormModal } from "@/components/feedbackFormModel";
import { FeedbackTable } from "@/components/FeedbackTable";
import { CandidateFeedback, Decision } from "@/types/types";
import { initializeFeedbacks } from "@/store/managerFeedbackSlice";
import { RootState } from "@/store/store";
import { FileStorage } from "@/utils/fileStorage";

const ManagerFeedback = () => {
  const dispatch = useDispatch();
  const feedbacks = useSelector((state: RootState) => state.managerFeedback.feedbacks);
  const evaluationCandidates = useSelector((state: RootState) => state.evaluation.candidates);
  
  const [viewFeedback, setViewFeedback] = useState<CandidateFeedback | null>(null);
  const [editFeedback, setEditFeedback] = useState<CandidateFeedback | null>(null);
  const [filter, setFilter] = useState<"All" | Decision>("All");
  
  useEffect(() => {
    const initialFeedbacks: CandidateFeedback[] = evaluationCandidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      fileId: candidate.fileId,
      decision: "Unanswered",
    }));
    
    const mergedFeedbacks = initialFeedbacks.map(feedback => {
      const existing = feedbacks.find(f => f.id === feedback.id);
      return existing || feedback;
    });
    
    dispatch(initializeFeedbacks(mergedFeedbacks));
  }, [evaluationCandidates, dispatch]);

  const handleFeedbackClick = (feedback: CandidateFeedback) => {
    if (feedback.decision === "Unanswered") {
      setEditFeedback(feedback);
    } else {
      setViewFeedback(feedback);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => 
    filter === "All" ? true : feedback.decision === filter
  );

  const getFeedbackCount = (decision: Decision | "All") => {
    return decision === "All" 
      ? feedbacks.length 
      : feedbacks.filter(f => f.decision === decision).length;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Hiring Manager Feedback</h1>
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === "All" ? "default" : "outline"}
            onClick={() => setFilter("All")}
          >
            All ({getFeedbackCount("All")})
          </Button>
          <Button
            variant={filter === "Selected" ? "default" : "outline"}
            onClick={() => setFilter("Selected")}
            className={filter === "Selected" ? "text-white" : "text-green-500"}
          >
            Selected ({getFeedbackCount("Selected")})
          </Button>
          <Button
            variant={filter === "Rejected" ? "default" : "outline"}
            onClick={() => setFilter("Rejected")}
            className={filter === "Rejected" ? "text-white" : "text-red-500"}
          >
            Rejected ({getFeedbackCount("Rejected")})
          </Button>
          <Button
            variant={filter === "Unanswered" ? "default" : "outline"}
            onClick={() => setFilter("Unanswered")}
            className={filter === "Unanswered" ? "text-white" : "text-purple-500"}
          >
            Pending ({getFeedbackCount("Unanswered")})
          </Button>
        </div>
      </div>

      <FeedbackTable
        feedbacks={filteredFeedbacks}
        onViewFeedback={handleFeedbackClick}
        filter={filter}
        onOpenPDF={(fileId) => {
          const file = FileStorage.get(fileId);
          if (file) {
            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
          }
        }}
      />

      {/* View Modal for completed feedbacks */}
      <FeedbackModal
        isOpen={!!viewFeedback}
        onClose={() => setViewFeedback(null)}
        feedback={viewFeedback}
      />

      {/* Form Modal for unanswered feedbacks */}
      <FeedbackFormModal
        isOpen={!!editFeedback}
        onClose={() => setEditFeedback(null)}
        feedback={editFeedback}
      />
    </div>
  );
};

export default ManagerFeedback;