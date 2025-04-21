/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Book, Edit, PlusCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface JobDescription {
  id: string;
  title: string;
  description: string;
  requirements: string;
}

export default function JobDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [jobTitle, setJobTitle] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [hasGeneratedJD, setHasGeneratedJD] = useState(false);
  // const [isRegenerating, setIsRegenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("existing");
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<string>("");
  const [isLoadingJds, setIsLoadingJds] = useState(false);
  const [customDescription, setCustomDescription] = useState("");

  useEffect(() => {
    // Get job_id from URL params or localStorage
    const paramJobId = searchParams.get('jobId');
    const storedJobId = localStorage.getItem("activeJobId");
    
    // Prioritize URL param over localStorage
    const activeJobId = paramJobId || storedJobId;
    
    if (activeJobId) {
      setJobId(activeJobId);
      fetchJobDetails(activeJobId);
      
      // Ensure the jobId is stored in localStorage
      if (paramJobId && (!storedJobId || storedJobId !== paramJobId)) {
        localStorage.setItem("activeJobId", paramJobId);
      }
    }
    
    // Check for selected job description in localStorage
    const selectedJdString = localStorage.getItem('selectedJobDescription');
    if (selectedJdString) {
      try {
        const selectedJd = JSON.parse(selectedJdString);
        setJobTitle(selectedJd.title);
        setJobRequirements(selectedJd.requirements);
        setGeneratedDescription(selectedJd.description);
        setSelectedOption("existing");
        setSelectedJdId(selectedJd.id);
        setHasGeneratedJD(true);
        localStorage.removeItem('selectedJobDescription');
      } catch (e) {
        console.error('Error parsing selected job description:', e);
      }
    }
    
    fetchJobDescriptions();
  }, [searchParams]);

  const fetchJobDescriptions = async () => {
    try {
      setIsLoadingJds(true);
      const response = await fetch('/api/job-descriptions');
      const data = await response.json();
      
      if (data.success) {
        setJobDescriptions(data.jobDescriptions);
      }
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
    } finally {
      setIsLoadingJds(false);
    }
  };

  const fetchJobDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const data = await response.json();
      
      if (data.success && data.job) {
        setJobTitle(data.job.job_title || "");
        setJobRequirements(data.job.requirements || "");
        setGeneratedDescription(data.job.description || "");
        
        if (data.job.description) {
          setHasGeneratedJD(true);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const handleImproveDescription = async () => {
    if (!feedback) {
      toast({
        title: "Missing feedback",
        description: "Please provide feedback to improve the description",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on the previous job description, please improve it with this feedback: ${feedback}`,
        }),
      });

      const data = await response.json();
      setGeneratedDescription(data.response || "");
      setFeedback("");
      
      toast({
        title: "Success",
        description: "Job description improved successfully",
      });
    } catch (error) {
      console.error('Error improving job description:', error);
      toast({
        title: "Error",
        description: "Failed to improve job description",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveJobDetails = async () => {
    if (!jobTitle) {
      toast({
        title: "Missing information",
        description: "Please provide a job title",
        variant: "destructive",
      });
      return;
    }

    let finalTitle = jobTitle;
    let finalDescription = generatedDescription;
    let finalRequirements = jobRequirements;

    if (selectedOption === "existing" && selectedJdId) {
      const selectedJd = jobDescriptions.find(jd => jd.id === selectedJdId);
      if (selectedJd) {
        finalDescription = selectedJd.description;
        finalRequirements = selectedJd.requirements;
      } else if (!finalDescription) {
        toast({
          title: "Missing information",
          description: "Please select a job description",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedOption === "custom") {
      if (!customDescription) {
        toast({
          title: "Missing information",
          description: "Please paste your job description",
          variant: "destructive",
        });
        return;
      }
      finalDescription = customDescription;
    } else if (!finalDescription) {
      toast({
        title: "Missing information",
        description: "Please provide a job description",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const method = jobId ? 'PUT' : 'POST';
      const endpoint = jobId ? `/api/jobs/${jobId}` : '/api/jobs';
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title: finalTitle,
          description: finalDescription,
          requirements: finalRequirements,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.job?.id) {
          const newJobId = data.job.id;
          localStorage.setItem("activeJobId", newJobId);
          setJobId(newJobId);
        }
        
        setIsEditing(false);
        
        toast({
          title: "Success",
          description: "Job details saved successfully",
        });
      } else {
        throw new Error(data.message || "Failed to save job details");
      }
    } catch (error) {
      console.error('Error saving job details:', error);
      toast({
        title: "Error",
        description: "Failed to save job details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    
    // If we have a description from the database, set the appropriate option
    if (generatedDescription) {
      // Check if this description matches any of the existing job descriptions
      const matchingJd = jobDescriptions.find(jd => jd.description === generatedDescription);
      
      if (matchingJd) {
        setSelectedOption("existing");
        setSelectedJdId(matchingJd.id);
      } else {
        // If no match found, set it as custom description
        setSelectedOption("custom");
        setCustomDescription(generatedDescription);
      }
    }
  };

  const handleContinue = () => {
    if (jobId) {
      router.push(`/jobs/create/criteria?jobId=${jobId}`);
    } else {
      router.push('/jobs/create/criteria');
    }
  };

  const handleSelectJd = (id: string) => {
    setSelectedJdId(id);
    const selectedJd = jobDescriptions.find(jd => jd.id === id);
    if (selectedJd) {
      setGeneratedDescription(selectedJd.description);
    }
  };

  const renderJobDescriptionSelector = () => {
    return (
      <div className="space-y-4 px-3">
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-sm font-medium">Job Title <span className="text-red-500">*</span></Label>
          <Input
            id="jobTitle"
            placeholder="Enter job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="p-3"
            required
          />
        </div>
        
        <RadioGroup 
          value={selectedOption} 
          onValueChange={setSelectedOption}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2 cursor-pointer">
            <RadioGroupItem value="existing" id="existing" className="text-indigo-500"/>
            <Label htmlFor="existing">Use existing job description</Label>
          </div>
          
          <div className="flex items-center space-x-2 cursor-pointer">
            <RadioGroupItem value="custom" id="custom" className=" text-indigo-500 bg-indigo-500/10"/>
            <Label htmlFor="custom">Paste your own</Label>
          </div>
        </RadioGroup>
        
        {selectedOption === "existing" && (
          <div className="pt-2">
            {isLoadingJds ? (
              <p className="text-sm text-muted-foreground">Loading job descriptions...</p>
            ) : jobDescriptions.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">No job descriptions found</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => router.push('/job-descriptions')}
                >
                  <PlusCircle size={14} />
                  <span>Create Job Description</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                {jobDescriptions.map((jd) => (
                  <div 
                    key={jd.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedJdId === jd.id ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelectJd(jd.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-sm">{jd.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {jd.description.substring(0, 100)}...
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/job-descriptions');
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Button 
              variant="link" 
              size="sm" 
              className="mt-2 p-0 h-auto text-indigo-500"
              onClick={() => router.push('/job-descriptions')}
            >
              <span className="flex items-center gap-1">
                <Book size={14} />
                <span>Manage Job Descriptions</span>
              </span>
            </Button>
          </div>
        )}
        
        {selectedOption === "custom" && (
          <div className="pt-2">
            <Label htmlFor="customDescription" className="text-sm font-medium mb-2">Paste your job description</Label>
            <Textarea
              id="customDescription"
              placeholder="Paste your job description here"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              rows={8}
              className="min-h-[200px] p-3"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full mx-auto px-4 ">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold mb-6">Create Job Posting</h2>
          
          {isEditing ? (
            <>
              {renderJobDescriptionSelector()}
              
              {generatedDescription && selectedOption === "existing" && (
                <div className="transition-all duration-200 ease-in-out px-3">
                  <div className="flex items-center justify-between text-gray-700 cursor-pointer hover:text-gray-900 mb-2">
                    <span className="text-sm font-medium">Improve Description</span>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    <Textarea
                      id="feedback"
                      placeholder="Enter your suggestions for improving the job description"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="w-full resize-none p-3"
                    />
                    <Button 
                      onClick={handleImproveDescription}
                      disabled={isGenerating || !feedback}
                      className="w-full"
                      variant="outline"
                    >
                      {isGenerating ? 'Updating...' : 'Update JD'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-3">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                  <p className="font-medium">{jobTitle}</p>
                </div>
                {jobRequirements && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Requirements</Label>
                    <p className="whitespace-pre-wrap text-sm">{jobRequirements}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Job Description</h2>
            {isEditing ? (
              ((selectedOption === "existing" && selectedJdId) || 
               (selectedOption === "custom" && customDescription)) && (
                <button 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-1 h-8 rounded-md" 
                  onClick={saveJobDetails}
                  disabled={isSaving || !jobTitle}
                >
                  {isSaving ? "Finalizing..." : "Finalize Job Description"}
                </button>
              )
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleEdit}
                  className="text-sm px-3 py-1 h-8"
                >
                  Edit
                </Button>
                <Button 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 h-8" 
                  onClick={handleContinue}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
          
          <Card className="p-4 bg-white border rounded-md shadow-sm h-[68vh] overflow-y-auto preview">
            <div className="h-full  pr-2">
              {((selectedOption === "existing" && selectedJdId) || 
               (selectedOption === "custom" && customDescription) || 
               generatedDescription) ? (
                <div className="text-sm leading-relaxed">
                <ReactMarkdown>
                  {generatedDescription}
                </ReactMarkdown>
              </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Job description will appear here
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
