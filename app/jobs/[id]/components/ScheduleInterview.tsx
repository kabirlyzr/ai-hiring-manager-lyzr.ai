/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";

interface RecruiterWithSmtp {
  id: string;
  name: string;
  role: string;
  has_smtp: boolean;
}

interface ScheduleInterviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  onScheduled: () => void;
}

export default function ScheduleInterview({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  jobId,
  jobTitle,
  onScheduled
}: ScheduleInterviewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recruiters, setRecruiters] = useState<RecruiterWithSmtp[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("");
  const [ccEmail, setCcEmail] = useState<string>("");
  const [candidateEmail, setCandidateEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  
  useEffect(() => {
    if (open) {
      fetchRecruiters();
    }
  }, [open]);
  
  const fetchRecruiters = async () => {
    try {
      const response = await fetch('/api/recruiters-with-smtp');
      const data = await response.json();
      
      if (data.success) {
        setRecruiters(data.recruiters || []);
      }
    } catch (error) {
      console.error('Error fetching recruiters:', error);
    }
  };
  
  const handleSchedule = async () => {
    if (!selectedRecruiter || !candidateEmail) {
      toast({
        title: "Required Fields",
        description: "Please select a recruiter and enter the candidate's email",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Send the email
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recruiter_id: selectedRecruiter,
          candidate_name: candidateName,
          candidate_email: candidateEmail,
          cc_email: ccEmail,
          job_title: jobTitle,
          message: message
        }),
      });
      
      const emailData = await emailResponse.json();
      
      if (!emailData.success) {
        throw new Error(emailData.message || 'Failed to send email');
      }
      
      // Update the candidate record to mark as scheduled
      const updateResponse = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meeting_scheduled: true
        }),
      });
      
      const updateData = await updateResponse.json();
      
      if (!updateData.success) {
        throw new Error(updateData.message || 'Failed to update candidate');
      }
      
      toast({
        title: "Success",
        description: "Interview scheduled and email sent successfully"
      });
      
      onScheduled();
      onOpenChange(false);
      
    } catch (error: unknown) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule interview",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recruiter">Select Recruiter</Label>
            <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {recruiters.length > 0 ? (
                  recruiters.map((recruiter) => (
                    <SelectItem 
                      key={recruiter.id} 
                      value={recruiter.id}
                      disabled={!recruiter.has_smtp}
                    >
                      {recruiter.name} - {recruiter.role}
                      {!recruiter.has_smtp && (
                        <span className="text-amber-500 ml-2 flex items-center text-xs">
                          <AlertCircle size={12} className="mr-1" />
                          No SMTP
                        </span>
                      )}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No recruiters available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="candidate_email">Candidate Email</Label>
            <Input
              id="candidate_email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              placeholder="candidate@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cc_email">CC Email ID</Label>
            <Input
              id="cc_email"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
              placeholder="Placeholder"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter any additional information for the candidate"
              rows={4}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? "Scheduling..." : "Schedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 