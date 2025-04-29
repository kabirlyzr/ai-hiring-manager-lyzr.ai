/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Upload, FileUp, Trash, Check, X, Info, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { uploadResumeToStorage } from '@/utils/supabase/fileStorage';
import Cookies from "js-cookie";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadFileToS3 } from "@/utils/s3Storage";
import MultiStepLoader from "@/components/ui/loader";
import { cn } from "@/lib/utils";

interface Candidate {
  id: string;
  name: string;
  filename: string;
  size: string;
  status?: "Selected" | "Rejected" | null;
  final_score?: number;
  meeting_scheduled?: string | null;
  resume_url?: string; 
}

interface EvaluationResult {
  id: string;
  candidate_id: string;
  job_id: string;
  final_score: number;
  status: "Selected" | "Rejected";
  meeting_scheduled?: string | null;
  details: {
    criteria_id: string;
    score: number;
    comments: string;
  }[];
  name?: string;
  fileId?: string;
  "Final score"?: number;
  reason?: string;
  criteria?: any[];
}

interface RecruiterWithSmtp {
  id: string;
  name: string;
  role: string;
  has_smtp: boolean;
}

export default function ApplicantsEvaluationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [jobTitle, setJobTitle] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedCandidateName, setSelectedCandidateName] = useState<string>("");
  const [recruiters, setRecruiters] = useState<RecruiterWithSmtp[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("");
  const [candidateEmail, setCandidateEmail] = useState<string>("");
  const [ccEmail, setCcEmail] = useState<string>("");
  const [emailMessage, setEmailMessage] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [selectedDetailsCandidate, setSelectedDetailsCandidate] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Loading states for different actions
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [removingCandidate, setRemovingCandidate] = useState<string | null>(null);
  const [loadingJobDetails, setLoadingJobDetails] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  // For the multi-step loader (same as in CandidateEvaluation component)
  const loadingStates = [
    { text: "Reviewing resumes...", duration: 8000 },
    { text: "Understanding the job description...", duration: 8000 },
    { text: "Assessing evaluation criteria...", duration: 8000 },
    { text: "Shortlisting candidates...", duration: 6000 },
    { text: "Checking the hiring manager's calendar...", duration: 4000 },
    // { text: "Scheduling the meeting...", duration: 15000 },
  ];

  // Polling configuration constants
  const MAX_RETRY_ATTEMPTS = 3;
  const POLLING_INTERVAL = 5000;
  const MAX_POLLING_ATTEMPTS = 60;

  useEffect(() => {
    const fetchJobDetails = async (id: string) => {
      setLoadingJobDetails(true);
      try {
        const response = await fetch(`/api/jobs/${id}`);
        const data = await response.json();
        
        if (data.success && data.job) {
          setJobTitle(data.job.job_title || "");
          setJobDescription(data.job.description || "");
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
        toast({
          title: "Error",
          description: "Failed to load job details",
          variant: "destructive",
        });
      } finally {
        setLoadingJobDetails(false);
      }
    };

    const fetchCriteria = async (id: string) => {
      try {
        const response = await fetch(`/api/criteria?job_id=${id}`);
        const data = await response.json();
        
        if (data.success) {
          setCriteria(data.criteria || []);
        }
      } catch (error) {
        console.error("Error fetching criteria:", error);
        toast({
          title: "Error",
          description: "Failed to load evaluation criteria",
          variant: "destructive",
        });
      }
    };

    // Get job_id from localStorage
    const fetchJobId = async () => {
      try {
        const activeJobId = localStorage.getItem("activeJobId");
        if (activeJobId) {
          setJobId(activeJobId);
          await fetchCandidates(activeJobId);
          await fetchEvaluations(activeJobId);
          await fetchJobDetails(activeJobId);
          await fetchCriteria(activeJobId);
        } else {
          setLoadingJobDetails(false);
          setLoadingCandidates(false);
        }
      } catch (error) {
        console.error("Error fetching job ID:", error);
        setLoadingJobDetails(false);
        setLoadingCandidates(false);
      }
    };

    fetchJobId();
  }, [toast]);

  const fetchCandidates = async (id: string) => {
    setLoadingCandidates(true);
    try {
      const response = await fetch(`/api/candidates?job_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      });
    } finally {
      setLoadingCandidates(false);
    }
  };

  const fetchEvaluations = async (id: string) => {
    try {
      const response = await fetch(`/api/evaluations?job_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setEvaluations(data.evaluations || []);
        
        // If there are evaluations, show the results view
        if (data.evaluations?.length > 0) {
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      toast({
        title: "Error",
        description: "Failed to load evaluation results",
        variant: "destructive",
      });
    }
  };

  const fetchRecruiters = async () => {
    try {
      const response = await fetch('/api/recruiters-with-smtp');
      const data = await response.json();
      
      if (data.success) {
        setRecruiters(data.recruiters || []);
      } else {
        throw new Error(data.message || "Failed to fetch recruiters");
      }
    } catch (error) {
      console.error('Error fetching recruiters:', error);
      toast({
        title: "Error",
        description: "Failed to load recruiters",
        variant: "destructive",
      });
    }
  };

  const openUploadDialog = () => {
    setPendingFiles([]);
    setUploadDialogOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      // Add new files to existing pending files
      const newFiles = Array.from(e.dataTransfer.files);
      setPendingFiles(prevFiles => [...newFiles, ...prevFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Add new files to existing pending files
      const newFiles = Array.from(e.target.files);
      setPendingFiles(prevFiles => [...newFiles, ...prevFiles]);
    }
  };

  const confirmUpload = () => {
    if (pendingFiles.length > 0) {
      handleFiles(pendingFiles as unknown as FileList);
      // Don't close the dialog, let it close when the upload completes successfully
    } else {
      toast({
        title: "No files selected",
        description: "Please select files to upload first",
        variant: "destructive",
      });
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
  };

  const renderFilePreview = () => {
    if (pendingFiles.length === 0) return null;
    
    return (
      <div className="mt-4 w-full max-w-md">
        <h3 className="text-sm font-medium mb-2">Selected Files</h3>
        <div className="overflow-y-auto max-h-[30vh] space-y-2 pr-2 mb-2">
          {pendingFiles.map((file, index) => (
            <div key={index} className="flex items-center py-2 px-3 border rounded-md bg-white">
              <div className="flex-shrink-0 mr-3">
                <div className="h-5 w-5 rounded border border-gray-300 flex items-center justify-center">
                  <FileUp className="h-3 w-3 text-gray-500" />
                </div>
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePendingFile(index)}
                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-transparent"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleFiles = async (files: FileList) => {
    if (!jobId) {
      toast({
        title: "Error",
        description: "No active job found. Please create a job first.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingFiles(true);
    
    try {
      // Show loading toast
      toast({
        title: "Uploading",
        description: `Uploading ${files.length} file(s)...`,
      });
      
      // Get userId from client-side cookies instead of server-side
      const userId = Cookies.get('user_id');
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Process each file
      const uploadPromises = Array.from(files).map(async (file) => {
        // Extract filename for display
        const fileName = file.name;
        const displayName = fileName.split('.')[0].replace(/_/g, ' ');
        
        // Upload file to S3
        const { url, fileName: storedFileName, size } = await uploadFileToS3(file, userId, jobId);
     
        // Create candidate in database
        const response = await fetch('/api/candidates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            job_id: jobId,
            name: displayName,
            filename: fileName,
            size: size,
            resume_url: url
          }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || "Failed to create candidate");
        }
        
        return data.candidate;
      });
      
      // Wait for all uploads to complete
      const newCandidates = await Promise.all(uploadPromises);
      
      // Update state with new candidates
      setCandidates([...candidates, ...newCandidates]);
      
      toast({
        title: "Success",
        description: `${files.length} resume(s) added successfully`,
      });

      // Close the upload dialog only on success
      setUploadDialogOpen(false);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload one or more files",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeCandidate = async (id: string) => {
    setRemovingCandidate(id);
    try {
      // Find the candidate to get its resume_url
      const candidate = candidates.find(c => c.id === id);
      
      if (!candidate) {
        throw new Error("Candidate not found");
      }
      
      // Delete from database (this will also trigger S3 deletion through our API)
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setCandidates(candidates.filter(c => c.id !== id));
        
        toast({
          title: "Success",
          description: "Candidate has been removed",
        });
      } else {
        throw new Error(data.message || "Failed to remove candidate");
      }
      
    } catch (error) {
      console.error('Error removing candidate:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove candidate",
        variant: "destructive",
      });
    } finally {
      setRemovingCandidate(null);
    }
  };

  // Polling function for evaluation status
  const pollResults = async (jobId: string): Promise<any[]> => {
    let attempts = 0;
  
    while (attempts < MAX_POLLING_ATTEMPTS) {
      try {
        const response = await fetch(`/api/evaluate/status?jobId=${jobId}`);
        if (!response.ok) throw new Error('JOB_NOT_FOUND');
  
        const data = await response.json();
        
        if (data.status === 'completed' && Array.isArray(data.result)) {
          const results = data.result.map((result: any) => ({
            ...result,
            fileId: result.fileId || ''
          }));
          
          return results;
        }
  
        if (data.status === 'failed') {
          throw new Error(data.error || 'Evaluation failed');
        }
  
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        attempts++;
      } catch (error) {
        if (error instanceof Error && error.message === 'JOB_NOT_FOUND') throw error;
        attempts++;
        if (attempts === MAX_POLLING_ATTEMPTS) throw new Error('Polling timed out');
      }
    }
    throw new Error('Polling timed out');
  };

  const evaluateCandidates = async () => {
    if (!jobId) {
      toast({
        title: "Error",
        description: "No active job found",
        variant: "destructive",
      });
      return;
    }
    
    if (candidates.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one resume",
        variant: "destructive",
      });
      return;
    }

    if (criteria.length === 0) {
      toast({
        title: "Error",
        description: "No evaluation criteria found. Please add criteria first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsEvaluating(true);
    
    try {
      // Create form data for API call
      const formData = new FormData();
      
      // Get resumes from candidate urls and add to formData
      const candidatePromises = candidates.map(async (candidate) => {
        if (!candidate.resume_url) {
          throw new Error(`Resume URL not found for candidate ${candidate.name}`);
        }
        
        // Use the proxy endpoint instead of fetching directly
        const response = await fetch(`/api/proxy-file?url=${encodeURIComponent(candidate.resume_url)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const file = new File([blob], candidate.filename, { type: 'application/pdf' });
        
        // Add to formData
        formData.append('pdfs', file);
        formData.append('fileIds', candidate.id); // Using candidate ID as the fileId
      });
      
      // Wait for all candidates to be processed
      await Promise.all(candidatePromises);
      
      // Add job details and criteria
      formData.append('jobDetails', JSON.stringify({
        description: jobDescription,
      }));
      
      formData.append('criteria', JSON.stringify(criteria.map(c => ({
        name: c.name,
        description: c.description,
        weight: c.weightage
      }))));
      
      // Call the evaluation API
      const evalResponse = await fetch('/api/evaluate', {
        method: 'POST',
        body: formData
      });
      
      if (!evalResponse.ok) {
        throw new Error(`Evaluation API error: ${evalResponse.status}`);
      }
      
      const { jobId: evaluationJobId } = await evalResponse.json();
      
      // Poll for results
      const results = await pollResults(evaluationJobId);
      
      // Process results and save to database
      const evaluationPromises = results.map(async (result) => {
        // Map evaluation results to our database schema
        const candidateId = result.fileId; // fileId contains the candidate ID
        
        // Create criteria results array
        const criteriaResults = result.criteria.map((criterion: any) => ({
          criteria_id: criteria.find(c => c.name === criterion.criteria)?.id || '',
          score: criterion.score,
          comments: criterion.reason,
          criteria: criterion.criteria
        }));
        
        // Determine final status based on score
        const status = result.status === 'shortlisted' ? "Selected" : "Rejected";
        
        // Save to database - POST handles both create and update in our API
        const evalSaveResponse = await fetch('/api/evaluations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            job_id: jobId,
            candidate_id: candidateId,
            final_score: result["Final score"],
            status: status,
            result: criteriaResults
          }),
        });
        
        const evalData = await evalSaveResponse.json();
        
        if (!evalData.success) {
          throw new Error(`Failed to save evaluation for candidate ID ${candidateId}`);
        }
        
        return evalData.evaluation;
      });
      
      // Wait for all evaluations to be saved to the database
      await Promise.all(evaluationPromises);
      
      // Explicitly fetch fresh data from the database to ensure we have the latest state
      await fetchEvaluations(jobId);
      
      // Update candidates with names from results
      const updatedCandidates = candidates.map(candidate => {
        const matchingResult = results.find(r => r.fileId === candidate.id);
        if (matchingResult) {
          return {
            ...candidate,
            name: matchingResult.name
          };
        }
        return candidate;
      });
      
      setCandidates(updatedCandidates);
      
      // Show results view
      setShowResults(true);
      
      toast({
        title: "Evaluation complete",
        description: `${candidates.length} candidate(s) evaluated successfully`,
      });
      
    } catch (error) {
      console.error("Error evaluating candidates:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to evaluate candidates",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleScheduleClick = (candidateId: string, candidateName: string) => {
    setSelectedCandidateId(candidateId);
    setSelectedCandidateName(candidateName);
    fetchRecruiters();
    setScheduleDialogOpen(true);
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
    
    setSending(true);
    
    try {
      // Send the email
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recruiter_id: selectedRecruiter,
          candidate_name: selectedCandidateName,
          candidate_email: candidateEmail,
          cc_email: ccEmail,
          job_title: jobTitle,
          message: emailMessage
        }),
      });
      
      const emailData = await emailResponse.json();
      
      if (!emailData.success) {
        throw new Error(emailData.message || 'Failed to send email');
      }
      
      // Update the candidate record to mark as scheduled
      const updateResponse = await fetch(`/api/candidates/${selectedCandidateId}`, {
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
      
      // Update local state
      setEvaluations(evaluations.map(evaluation => {
        if (evaluation.candidate_id === selectedCandidateId) {
          return {
            ...evaluation,
            meeting_scheduled: "yes"
          };
        }
        return evaluation;
      }));
      
      toast({
        title: "Success",
        description: "Interview scheduled and email sent successfully"
      });
      
      // Reset form
      setSelectedRecruiter("");
      setCandidateEmail("");
      setCcEmail("");
      setEmailMessage("");
      setScheduleDialogOpen(false);
      
    } catch (error: unknown) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule interview",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const startNewEvaluation = () => {
    router.push('/jobs');
  };

  const showCandidateDetails = (candidate: any) => {
    setSelectedDetailsCandidate(candidate);
    setDetailsDialogOpen(true);
  };

  // Upload Dialog Component
  const renderUploadDialog = () => {
    return (
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!uploadingFiles) setUploadDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Resumes</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div 
              className={`w-full h-40 border-2 ${isDragging ? 'border-primary' : 'border-dashed'} rounded-lg flex flex-col items-center justify-center mb-4 cursor-pointer`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('modal-resume-upload')?.click()}
            >
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-center mb-2">
                Click to upload <span className="text-gray-500">or drag and drop</span>
              </p>
              <p className="text-xs text-gray-500">
                .pdf files (max 5MB)
              </p>
            </div>
            
            <input
              type="file"
              id="modal-resume-upload"
              multiple
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileInput}
            />
            
            {renderFilePreview()}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={uploadingFiles}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={confirmUpload}
              disabled={uploadingFiles || pendingFiles.length === 0}
              className="bg-primary text-white"
            >
              {uploadingFiles ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${pendingFiles.length || 0} file(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // When loading job details
  if (loadingJobDetails || loadingCandidates) {
    return (
      <div className="h-[90%] flex justify-center items-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // When evaluating show the multi-step loader
  if (isEvaluating) {
    return (
      <div className="h-[90%] flex justify-center items-center">
        <MultiStepLoader loadingStates={loadingStates} loading={true} loop={false} />
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-medium">Evaluation Results</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => evaluateCandidates()} 
              disabled={isEvaluating}
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                "Refresh Results"
              )}
            </Button>
            <Button 
              variant="default" 
              onClick={startNewEvaluation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Start New Evaluation
            </Button>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Final Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Meeting Scheduled</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((evaluation) => {
              const candidate = candidates.find(c => c.id === evaluation.candidate_id);
              return (
                <TableRow key={evaluation.id}>
                  <TableCell>{candidate?.name || evaluation.name || "-"}</TableCell>
                  <TableCell>{evaluation.final_score || evaluation["Final score"] || "-"}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "flex items-center gap-2",
                      evaluation.status === "Selected" ? "text-green-600" : "text-red-600"
                    )}>
                      {evaluation.status === "Selected" ? 
                        <CheckCircle className="h-4 w-4" /> : 
                        <XCircle className="h-4 w-4" />
                      }
                      {evaluation.status || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {evaluation.meeting_scheduled ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showCandidateDetails(evaluation)}
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                    {candidate?.resume_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => candidate.resume_url && window.open(`/api/proxy-file?url=${encodeURIComponent(candidate.resume_url)}`, '_blank')}
                      >
                        <FileText className="h-5 w-5" />
                      </Button>
                    )}
                    {evaluation.status === "Selected" && !evaluation.meeting_scheduled && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 px-2 my-auto"
                        onClick={() => handleScheduleClick(
                          evaluation.candidate_id, 
                          candidate?.name || evaluation.name || "Candidate"
                        )}
                      >
                        Schedule
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Candidate Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Evaluation Details</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold">
                <span className="text-green-700">{selectedDetailsCandidate?.status }</span> - {selectedDetailsCandidate?.final_score || selectedDetailsCandidate?.["Final score"]}%
              </h3>
              <p className="text-muted-foreground">{selectedDetailsCandidate?.reason}</p>

              <div className="space-y-2">
                <h4 className="font-semibold">Criteria Breakdown</h4>
                {selectedDetailsCandidate?.criteria?.map((score: any, index: number) => (
                  <div key={index} className="border-b pb-2">
                    <div className="font-medium">{score.criteria} - {score.score}/10</div>
                    <div className="text-sm text-muted-foreground">{score.reason}</div>
                  </div>
                ))}
                {(() => {
                  let resultData = selectedDetailsCandidate?.result || [];
                  
                  // Check if result is a string (JSON string from DB) and parse it
                  if (typeof resultData === 'string') {
                    try {
                      resultData = JSON.parse(resultData);
                    } catch (e) {
                      console.error("Error parsing result JSON:", e);
                      resultData = [];
                    }
                  }
                  
                  return Array.isArray(resultData) ? resultData.map((result: any, index: number) => {
                    // Try to determine criterion name
                    let criterionName = 'Criterion';
                    
                    if (result.criteria_id && criteria.find(c => c.id === result.criteria_id)) {
                      criterionName = criteria.find(c => c.id === result.criteria_id)?.criteria || 'Criterion';
                    }
                    
                    return (
                      <div key={`result-${index}`} className="border-b pb-2">
                        <div className="font-medium">{result.criteria} - {result.score}/10</div>
                        <div className="text-sm text-muted-foreground">{result.comments}</div>
                      </div>
                    );
                  }) : null;
                })()}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Interview Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
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
                              (SMTP not setup)
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
                <Label htmlFor="cc_email">CC Mail ID</Label>
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
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Enter any additional information for the candidate"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSchedule} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Render Upload Dialog */}
        {renderUploadDialog()}
      </div>
    );
  }

  // If no results yet, show upload UI
  if (candidates.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div 
          className={`w-full max-w-md h-40 border-2 ${isDragging ? 'border-primary' : 'border-dashed'} rounded-lg flex flex-col items-center justify-center mb-4 cursor-pointer`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('resume-upload')?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-center mb-2">
            Click to upload <span className="text-gray-500">or drag and drop</span>
          </p>
          <p className="text-xs text-gray-500">
            .pdf files (max 5MB)
          </p>
        </div>
        
        {pendingFiles.length === 0 && !uploadingFiles ? (
          <div className="text-center">
            <input
              type="file"
              id="resume-upload"
              multiple
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileInput}
            />
            <button className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-md text-white">
              <label htmlFor="resume-upload" className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4 inline" />
                Upload Files
              </label>
            </button>
          </div>
        ) : pendingFiles.length > 0 && !uploadingFiles && (
          <div className="text-center">
            <button 
              onClick={() => handleFiles(pendingFiles as unknown as FileList)} 
              className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-md text-white"
            >
              <FileUp className="mr-2 h-4 w-4 inline" />
              Upload {pendingFiles.length} file(s)
            </button>
          </div>
        )}
        
        {uploadingFiles && (
          <div className="text-center mt-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Uploading files...</p>
          </div>
        )}
        
        {renderFilePreview()}
      </div>
    );
  }

  // Show list of uploaded files
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-medium">Applicants Evaluation</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="text-gray-700"
            onClick={openUploadDialog}
            disabled={uploadingFiles}
          >
            {uploadingFiles ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload Files
              </>
            )}
          </Button>
          <Button 
            className="bg-primary text-white" 
            onClick={evaluateCandidates} 
            disabled={isEvaluating || candidates.length === 0}
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              "Evaluate"
            )}
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="flex items-center py-2 px-3 border-b">
            <div className="flex-shrink-0 mr-3">
              <div className="h-7 w-7 rounded border border-gray-300 flex items-center justify-center">
                <FileUp className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium my-auto">{candidate.name || candidate.filename}</p>
              {/* <p className="text-xs text-gray-500">{candidate.filename} ({candidate.size})</p> */}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCandidate(candidate.id)}
              disabled={removingCandidate === candidate.id}
              className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-transparent"
            >
              {removingCandidate === candidate.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
      
      {/* Render Upload Dialog */}
      {renderUploadDialog()}
    </div>
  );
}