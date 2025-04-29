/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, Edit, Trash, ChevronLeft, Loader2 } from "lucide-react";
import EmptySVG1 from "@/components/ui/emptySvg";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";

interface JobDescription {
  id: string;
  title: string;
  description: string;
  requirements: string;
  created_at: string;
}

export default function JobDescriptionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasGeneratedJD, setHasGeneratedJD] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingRequirements, setEditingRequirements] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchJobDescriptions();
  }, []);

  const fetchJobDescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/job-descriptions');
      const data = await response.json();

      if (data.success) {
        setJobDescriptions(data.jobDescriptions);
      } else {
        throw new Error(data.message || 'Failed to fetch job descriptions');
      }
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load job descriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!jobTitle || !jobRequirements) {
      toast({
        title: "Missing information",
        description: "Please provide a job title and requirements",
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
          message: `Generate a job description for ${jobTitle} with these requirements: ${jobRequirements}`,
          sessionId: null
        }),
      });

      const data = await response.json();
      setGeneratedDescription(data.response || "");
      setHasGeneratedJD(true);
      setEditMode(false);

      // Store session ID for conversation continuity
      if (data.session_id) {
        setSessionId(data.session_id);
      }

    } catch (error) {
      console.error('Error generating job description:', error);
      toast({
        title: "Error",
        description: "Failed to generate job description",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
          message: `Job Description:\n\n${generatedDescription}\n\nFeedback:\n\n${feedback}\n`,
          sessionId: sessionId
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

  const saveJobDescription = async () => {
    if (!jobTitle || !generatedDescription) {
      toast({
        title: "Missing information",
        description: "Please provide a job title and generate a description",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `/api/job-descriptions/${editingId}` : '/api/job-descriptions';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: jobTitle,
          description: generatedDescription,
          requirements: jobRequirements,
        }),
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        fetchJobDescriptions();

        toast({
          title: "Success",
          description: "Job description saved successfully",
        });
      } else {
        throw new Error(data.message || "Failed to save job description");
      }
    } catch (error) {
      console.error('Error saving job description:', error);
      toast({
        title: "Error",
        description: "Failed to save job description",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const editJobDescription = (jd: JobDescription) => {
    setJobTitle(jd.title);
    setJobRequirements(jd.requirements);
    setGeneratedDescription(jd.description);
    setEditingId(jd.id);
    setHasGeneratedJD(true);
    setShowCreateForm(true);
    setEditMode(false);
  };

  const deleteJobDescription = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job description?")) {
      return;
    }

    try {
      const response = await fetch(`/api/job-descriptions/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchJobDescriptions();
        toast({
          title: "Success",
          description: "Job description deleted successfully",
        });
      } else {
        throw new Error(data.message || "Failed to delete job description");
      }
    } catch (error) {
      console.error('Error deleting job description:', error);
      toast({
        title: "Error",
        description: "Failed to delete job description",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setJobTitle("");
    setJobRequirements("");
    setGeneratedDescription("");
    setFeedback("");
    setSessionId(null);
    setHasGeneratedJD(false);
    setEditingId(null);
    setShowCreateForm(false);
    setEditingTitle(false);
    setEditingRequirements(false);
    setEditMode(false);
  };

  const toggleTitleEdit = () => {
    setEditingTitle(!editingTitle);
  };

  const toggleRequirementsEdit = () => {
    setEditingRequirements(!editingRequirements);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setEditingTitle(false);
    setEditingRequirements(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {showCreateForm &&(
            <>
            <a
              className="p-0 cursor-pointer my-auto"
              onClick={resetForm}
            >
              <ChevronLeft className="font-bold text-4xl hover:text-gray-500" />
            </a>
             <h1 className="text-2xl font-bold">
             Job Descriptions
           </h1>
            </>
          )}
         { jobDescriptions.length > 0 && (
          <h1 className="text-2xl font-bold">
            Job Descriptions
          </h1>
        )}
        </div>
        {!showCreateForm && jobDescriptions.length > 0 && (
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <PlusCircle size={16} />
            <span>Create Job Description</span>
          </Button>
        )}
      </div>

      {showCreateForm ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              {/* <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-8 w-8"
                  onClick={resetForm}
                >
                  <ChevronLeft size={18} />
                </Button>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit Job Description" : "Create Job Description"}
                </h2>
              </div> */}

              {/* {hasGeneratedJD && !editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEditMode}
                  className="flex items-center gap-1"
                >
                  <Edit size={14} />
                  <span>Edit</span>
                </Button>
              )} */}
            </div>

            <div className="space-y-6 px-3">
              {hasGeneratedJD && !editMode ? (
                <div className="relative space-y-4 group">
                  <div>
                    <Label htmlFor="jobTitle" className="text-sm font-medium">Job Title</Label>
                    <div className="p-3 bg-gray-100 rounded-md text-gray-700 cursor-default">
                      {jobTitle}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="jobRequirements" className="text-sm font-medium">Job Requirements</Label>
                    <div className="p-3 bg-gray-100 rounded-md text-gray-700 min-h-[100px] cursor-default whitespace-pre-wrap">
                      {jobRequirements}
                    </div>
                  </div>
                  
                  <div className="absolute group-hover:bg-black/10 group-hover:rounded-xl group-hover:h-[15rem] group-hover:-mt-4 group-hover:w-[103%] group-hover:-ml-2 inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleEditMode}
                      className="bg-white shadow-md flex items-center gap-1"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-sm font-medium">Job Title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="Enter job title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="p-3"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jobRequirements" className="text-sm font-medium">Job Requirements</Label>
                    <Textarea
                      id="jobRequirements"
                      placeholder="Enter job requirements"
                      value={jobRequirements}
                      onChange={(e) => setJobRequirements(e.target.value)}
                      rows={8}
                      className="min-h-[200px] p-3"
                    />
                  </div>
                </>
              )}
            </div>

            {(!hasGeneratedJD || editMode) && (
              <div className="flex px-3">
                <Button
                  variant="default"
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || !jobTitle || !jobRequirements}
                >
                  {isGenerating ? "Generating..." : "Generate Job Description"}
                </Button>

                {editMode && (
                  <Button
                    variant="outline"
                    onClick={toggleEditMode}
                    className="ml-2 px-4"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}

            {generatedDescription && !editingTitle && !editingRequirements && !editMode && (
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
                    variant="default"
                  >
                    {isGenerating ? 'Updating...' : 'Update Description'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Generated Job Description</h2>
              {generatedDescription && (
                <Button
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-1 h-8"
                  onClick={saveJobDescription}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
            </div>

            <Card className="p-4 bg-white border rounded-md shadow-sm h-[68vh] overflow-y-auto">
              <div className="h-full overflow-y-auto pr-2">
                {generatedDescription ? (
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown >
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
      ) : (
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading job descriptions...</p>
              </div>
            </div>
          ) : jobDescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full my-auto py-24 ">
              <EmptySVG1 />
              <p className="text-muted-foreground mt-4">No job descriptions found</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 bg-indigo-500 hover:bg-indigo-600"
              >
                Create Your First Job Description
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobDescriptions.map((jd) => (
                <Card key={jd.id} className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-start">
                      <span>{jd.title}</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => editJobDescription(jd)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => deleteJobDescription(jd.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {jd.description.substring(0, 150)}...
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <p className="text-xs text-muted-foreground">
                      {new Date(jd.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        localStorage.setItem('selectedJobDescription', JSON.stringify(jd));
                        router.push('/jobs/create/details');
                      }}
                    >
                      Use this
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 