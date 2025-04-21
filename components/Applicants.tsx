/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ChangeEvent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Trash, Info, CheckCircle, XCircle, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { RootState } from '@/store/store';
import { addCandidates, removeCandidate, resetEvaluation, setEvaluationResults, updateCandidate } from '@/store/evaluationSlice';
import { Candidate, EvaluationResult } from '../types/types';
import { FileStorage } from '@/utils/fileStorage';
import MultiStepLoader from './ui/loader';
interface EvaluationResponse {
  status: 'completed' | 'failed' | 'pending';
  result?: Array<{
    id: string;
    fileId: string;
    name: string;
    email:string;
    status: 'shortlisted' | 'rejected';
    'Final score': number;
    meeting_scheduled: 'yes' | 'no';
    reason: string;
    criteria: Array<{
      criteria: string;
      score: number;
      reason: string;
    }>;
  }>;
  error?: string;
}

const CandidateEvaluation = () => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const storedCandidates = useSelector((state: RootState) => state.evaluation.candidates);
  const criteria = useSelector((state: RootState) => state.criteria.criteria);
  const evaluationResults = useSelector((state: RootState) => state.evaluation.results) || [];
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<EvaluationResult | null>(null);

  const loadingStates = [
    { text: "Reviewing resumes...", duration: 8000 },
    { text: "Understanding the job description...", duration: 8000 },
    { text: "Assessing evaluation criteria...", duration: 8000 },
    { text: "Shortlisting candidates...", duration: 6000 },
    { text: "Checking the hiring manager's calendar...", duration: 4000 },
    { text: "Scheduling the meeting...", duration: 15000 },
  ];

  const MAX_RETRY_ATTEMPTS = 3;
  const POLLING_INTERVAL = 5000;
  const MAX_POLLING_ATTEMPTS = 60;

  // const pollResults = async (jobId: string): Promise<EvaluationResult[]> => {
  //   let attempts = 0;

  //   while (attempts < MAX_POLLING_ATTEMPTS) {
  //     try {
  //       const response = await fetch(`/api/evaluate/status?jobId=${jobId}`);
  //       if (!response.ok) throw new Error('JOB_NOT_FOUND');

  //       const data = await response.json();
  //       if (data.status === 'completed' && Array.isArray(data.result)) {
  //         const results = data.result.map((result: any) => ({
  //           ...result,
  //           fileId: result.fileId || ''
  //         }));
          
  //         // Update each candidate's name using updateCandidate action
  //         results.forEach((result: { fileId: string; name: any; }) => {
  //           const matchingCandidate = storedCandidates.find(c => c.fileId === result.fileId);
  //           if (matchingCandidate) {
  //             dispatch(updateCandidate({
  //               ...matchingCandidate,
  //               name: result.name
  //             }));
  //           }
  //         });
          
  //         return results;
  //       }

  //       if (data.status === 'failed') {
  //         throw new Error(data.error || 'Evaluation failed');
  //       }

  //       await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  //       attempts++;
  //     } catch (error) {
  //       if (error instanceof Error && error.message === 'JOB_NOT_FOUND') throw error;
  //       attempts++;
  //       if (attempts === MAX_POLLING_ATTEMPTS) throw new Error('Polling timed out');
  //     }
  //   }
  //   throw new Error('Polling timed out');
  // };
  

  const pollResults = async (jobId: string): Promise<EvaluationResult[]> => {
    let attempts = 0;
  
    while (attempts < MAX_POLLING_ATTEMPTS) {
      try {
        const response = await fetch(`/api/evaluate/status?jobId=${jobId}`);
        if (!response.ok) throw new Error('JOB_NOT_FOUND');
  
        const data: EvaluationResponse = await response.json();
        
        if (data.status === 'completed' && Array.isArray(data.result)) {
          const results: EvaluationResult[] = data.result.map((result) => ({
            ...result,
            fileId: result.fileId || ''
          }));
  
          // Filter candidates based on status
          const rejectedFileIds: string[] = results
            .filter((result): result is EvaluationResult => result.status !== "shortlisted")
            .map(result => result.fileId);
  
          // Remove rejected candidates from store and file storage
          rejectedFileIds.forEach((fileId: string) => {
            const candidateToRemove = storedCandidates.find((c): c is Candidate => c.fileId === fileId);
            if (candidateToRemove) {
              dispatch(removeCandidate(candidateToRemove.id));
            }
          });
  
          // Update names only for shortlisted candidates
          results
            .filter((result): result is EvaluationResult => result.status === "shortlisted")
            .forEach((result: EvaluationResult) => {
              const matchingCandidate = storedCandidates.find((c): c is Candidate => c.fileId === result.fileId);
              if (matchingCandidate) {
                dispatch(updateCandidate({
                  ...matchingCandidate,
                  name: result.name
                }));
              }
            });
  
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
  const jobDetails = useSelector((state: RootState) => 
    state.jobDescription.savedJobs[state.jobDescription.savedJobs.length - 1]
  );

  const processEvaluation = async () => {
    if (isLoading || !criteria.length) return;
    setIsLoading(true);

    let currentAttempt = 0;
    while (currentAttempt < MAX_RETRY_ATTEMPTS) {
      try {
        const formData = new FormData();
        storedCandidates.forEach((candidate) => {
          const file = FileStorage.get(candidate.fileId);
          if (!file) throw new Error(`File not found for candidate ${candidate.name}`);
          formData.append('pdfs', file);
          formData.append('fileIds', candidate.fileId);
        });
        formData.append('jobDetails', JSON.stringify({
          description: jobDetails.description,
        }));
        formData.append('criteria', JSON.stringify(criteria));

        const response = await fetch('/api/evaluate', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error(`Failed to start evaluation: ${response.status}`);

        const { jobId } = await response.json();
        const results = await pollResults(jobId);
        
        dispatch(setEvaluationResults(results));
        setIsLoading(false);
        return;
      } catch (error) {
        currentAttempt++;
        if (currentAttempt === MAX_RETRY_ATTEMPTS) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to evaluate candidates",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newCandidates: Candidate[] = files.map((file, index) => ({
      id: `candidate-${Date.now()}-${index}`,
      name: "",
      fileId: FileStorage.store(file),
      fileName: file.name
    }));
    dispatch(addCandidates(newCandidates));
  };

  const handleRestart = () => {
    dispatch(resetEvaluation());
  };

  if (isLoading) {
    return (
      <div className="h-[90%] flex justify-center items-center">
        <MultiStepLoader loadingStates={loadingStates} loading={true} loop={false} />
      </div>
    );
  }

  if (evaluationResults && evaluationResults.length > 0) {
    return (
      <div className="p-8">
        <div className="flex flex-row justify-between mb-8">
          <h1 className="text-2xl font-bold">Evaluation Results</h1>
          <Button onClick={handleRestart}>
            Start New Evaluation
          </Button>
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
            {evaluationResults.map((candidate) => (
              <TableRow key={candidate.fileId || candidate.id}>
                <TableCell>{candidate.name}</TableCell>
                <TableCell>{candidate["Final score"] || '-'}</TableCell>
                <TableCell>
                  <span className={cn(
                    "flex items-center gap-2",
                    candidate.status === "shortlisted" ? "text-green-600" : "text-red-600"
                  )}>
                    {candidate.status === "shortlisted" ? 
                      <CheckCircle className="h-4 w-4" /> : 
                      <XCircle className="h-4 w-4" />
                    }
                    {candidate.status || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  {candidate.meeting_scheduled ? "Yes" : "No"}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const file = FileStorage.get(candidate.fileId);
                      if (file) {
                        const url = URL.createObjectURL(file);
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Evaluation Details</DialogTitle>
              <DialogDescription>
                <div className="mt-4 space-y-4">
                  <h3 className="font-semibold">
                    {selectedCandidate?.name} - {selectedCandidate?.["Final score"]}%
                  </h3>
                  <p className="text-muted-foreground">{selectedCandidate?.reason}</p>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Criteria Breakdown</h4>
                    {selectedCandidate?.criteria?.map((score, index) => (
                      <div key={index} className="border-b pb-2">
                        <div className="font-medium">{score.criteria} - {score.score}/10</div>
                        <div className="text-sm text-muted-foreground">{score.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className='flex justify-end'>
      <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Resumes
          </Button>
      </div>
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {storedCandidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>{candidate.fileName}</TableCell>
                <TableCell className="justify-end flex">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => dispatch(removeCandidate(candidate.id))}
                  >
                    <Trash className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end items-center mt-4">
          <Button
            onClick={processEvaluation}
            disabled={storedCandidates.length === 0 || criteria.length === 0}
          >
            Evaluate
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default CandidateEvaluation;