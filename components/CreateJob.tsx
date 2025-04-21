/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useSelector, useDispatch } from 'react-redux';
import { saveJobDescription } from '@/store/jobDescriptionSlice';
import { useToast } from "@/components/ui/use-toast";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
interface Conversation {
  message: string;
  response: string;
}

interface APIResponse {
  session_id?: string;
  response: string;
}

export default function CreateJob() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [requirements, setRequirements] = useState("");
  const [generatedJD, setGeneratedJD] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<Conversation[]>([]);

  const companyData = useSelector((state: RootState) => state.companySetup);
  const savedJobs = useSelector((state: RootState) => state.jobDescription.savedJobs);
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Get the latest saved job
  const latestSavedJob = savedJobs[savedJobs.length - 1];

  useEffect(() => {
    if (latestSavedJob) {
      setJobTitle(latestSavedJob.jobTitle);
      setRequirements(latestSavedJob.requirements);
      setGeneratedJD(latestSavedJob.description);
      setIsEditing(false);
    }
  }, [latestSavedJob]);

  const callJobDescriptionAPI = async (prompt: string, currentSessionId?: string | null) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          sessionId: currentSessionId
        }),
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data: APIResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling API:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateJD = async () => {
    if (!jobTitle || !requirements) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in both Job Title and Requirements",
        variant: "destructive",
      });
      return;
    }

    try {
      const prompt = `companyData:${JSON.stringify(companyData)}\n\n Job Title: ${jobTitle} Job Requirements: ${requirements}`;
      const response = await callJobDescriptionAPI(prompt, null);

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      setGeneratedJD(response.response);
      setConversationHistory([
        ...conversationHistory,
        { message: prompt, response: response.response }
      ]);
      setIsEditing(true);

      toast({
        title: "Success",
        description: "Job description generated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate job description. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateJD = async () => {
    if (!feedback || !generatedJD) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback to improve the description",
        variant: "destructive",
      });
      return;
    }

    try {
      const historyPrompt = conversationHistory
        .map(conv => `Previous input: ${conv.message}\nPrevious response: ${conv.response}`)
        .join('\n\n');

      const prompt = `companyData:${JSON.stringify(companyData)}\n\n ${historyPrompt}\n\nBased on the previous job description, please improve it with this feedback: ${feedback}`;

      const response = await callJobDescriptionAPI(prompt, sessionId);

      setGeneratedJD(response.response);
      setConversationHistory([
        ...conversationHistory,
        { message: prompt, response: response.response }
      ]);
      setFeedback('');
      setIsEditing(true);

      toast({
        title: "Success",
        description: "Job description updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job description. Please try again.",
        variant: "destructive",
      });
    }
  };
  const formatContent = (content: string): JSX.Element[] => {
    return content.split('/n').reduce<JSX.Element[]>((acc, line, index) => {
      // Function to process text and convert markdown links to anchor tags
      const processText = (text: string) => {
        const parts = [];
        let lastIndex = 0;
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
          // Add text before the link
          if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
          }

          // Add the link
          parts.push(
            <a
              key={match.index}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 underline"
            >
              {match[1]}
            </a>
          );

          lastIndex = match.index + match[0].length;
        }


        if (lastIndex < text.length) {
          parts.push(text.substring(lastIndex));
        }

        return parts;
      };

      if (line.startsWith('**') && line.endsWith('**')) {
        acc.push(
          <h2 key={index} className="text-xl hidden text-center font-bold my-2">
            {processText(line.replace(/\*\*/g, ''))}
          </h2>
        );
      } else if (line.includes('**')) {
        acc.push(
          <p key={index} className="my-1">
            {line.split('**').map((part, i) =>
              i % 2 === 0 ? processText(part) : <strong key={i}>{processText(part)}</strong>
            )}
          </p>
        );
      } else if (line.startsWith('-') && line.endsWith('**:')) {
        acc.push(
          <li key={index} className="ml-14 text-center">
            {processText(line.trim().substring(1).trim())}
          </li>
        );
      } else if (line.trim().startsWith('-')) {
        acc.push(
          <li key={index} className="ml-24">
            {processText(line.trim().substring(1).trim())}
          </li>
        );
      } else if (line.trim()) {
        acc.push(
          <p key={index} className="my-1">
            {processText(line)}
          </p>
        );
      }
      return acc;
    }, []);
  };
  const handleSaveJD = async () => {
    try {
      setIsSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay

      dispatch(saveJobDescription({
        id: Date.now().toString(),
        jobTitle,
        requirements,
        description: generatedJD,
        createdAt: new Date().toISOString(),
      }));

      setIsEditing(false);

      toast({
        title: "Success",
        description: "Job description finalized successfully!",
      });
      router.push('/evaluation-criteria');

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to finalize job description.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSessionId(null);
    setConversationHistory([]);
    toast({
      title: "Edit Mode",
      description: "You can now make changes to the job description.",
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Job Posting</h1>
        <div className="flex gap-2">
          {!isEditing && (
            <Button
              onClick={handleEdit}
              variant="outline"
            >
              Edit Description
            </Button>
          )}
          {isEditing && (
            <Button
              onClick={handleSaveJD}
              disabled={isSaving || !generatedJD}
              className="ml-4"
            >
              {isSaving ? 'Finalizing...' : 'Finalize Job Description'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Input Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Enter job title"
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Job Requirements</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Enter required qualifications, skills, experience level, etc."
              className="min-h-[200px]"
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <Button
              onClick={handleGenerateJD}
              className="w-full"
              disabled={isLoading || !jobTitle || !requirements}
            >
              {isLoading ? 'Generating...' : 'Generate Job Description'}
            </Button>
          )}
        </div>

        {/* Right Column - Generated JD and Feedback */}
        <div className="space-y-6">
          <Card className="p-4">
            <Label>
              {isEditing ? 'Generated Job Description' : 'Finalized Job Description'}
            </Label>
            <div className="max-h-[35vh] preview overflow-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm  placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50">
              <p className="text-wrap  whitespace-pre-line flex min-h-[200px] ">
                {formatContent(generatedJD)}
              </p>
            </div>
            {/* <Textarea
              value={generatedJD}
              readOnly
              className="mt-2 min-h-[200px]"
            /> */}
          </Card>

          {isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="feedback">Improve Description</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter your suggestions for improving the job description"
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleUpdateJD}
                variant="outline"
                className="w-full"
                disabled={isLoading || !feedback || !generatedJD}
              >
                {isLoading ? 'Updating...' : 'Update JD'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}