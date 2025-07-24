/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
// import {
//   Table, 
//   TableBody, 
//   TableCell, 
//   TableHead,
//   TableHeader,
//   TableRow
// } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Trash, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";

interface Criterion {
  id: string;
  name: string;
  criteria: string;
  weightage: number;
  job_id?: string;
}

interface LyzrCriterionResponse {
  criteria_name: string;
  evaluation_criteria: string;
  Weightage: number | string;
}

interface JobDetails {
  job_title?: string;
  description?: string;
  requirements?: string;
  id?: string;
}

export default function EvaluationCriteriaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [criteriaName, setCriteriaName] = useState("");
  const [criteriaDescription, setCriteriaDescription] = useState("");
  const [weightage, setWeightage] = useState<string>("3");
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [isDeletingCriterion, setIsDeletingCriterion] = useState<string | null>(null);
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string; criteria: string; weightage: string}>({
    name: "",
    criteria: "",
    weightage: "3"
  });
  const [isUpdatingCriterion, setIsUpdatingCriterion] = useState(false);
  const [lastFetchedJobId, setLastFetchedJobId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  
  // Add useRef to track initial mount and prevent duplicate API calls
  const initialFetchRef = useRef(false);
  // Add useRef to track if Lyzr API has been called for a job
  const lyzrApiCalledRef = useRef<Set<string>>(new Set());

  // Store criteria in localStorage when it changes
  useEffect(() => {
    if (jobId && criteria.length > 0) {
      localStorage.setItem(`criteria_${jobId}`, JSON.stringify(criteria));
    }
  }, [criteria, jobId]);

  useEffect(() => {
    // Get job_id from URL params or localStorage
    const paramJobId = searchParams.get('jobId');
    const storedJobId = localStorage.getItem("activeJobId");
    
    // Prioritize URL param over localStorage
    const activeJobId = paramJobId || storedJobId;
    
    if (activeJobId) {
      setJobId(activeJobId);
      
      // Check if we have cached criteria for faster UI response
      const cachedCriteria = localStorage.getItem(`criteria_${activeJobId}`);
      if (cachedCriteria) {
        try {
          setCriteria(JSON.parse(cachedCriteria));
        } catch (e) {
          console.error("Error parsing cached criteria", e);
        }
      }
      
      // Only fetch from server if we have a new job ID or we're returning to this page
      // AND we haven't already fetched in this component lifecycle
      if ((activeJobId !== lastFetchedJobId) && !initialFetchRef.current) {
        initialFetchRef.current = true;
        fetchJobDetails(activeJobId);
        fetchCriteria(activeJobId);
        setLastFetchedJobId(activeJobId);
      }
      
      // Ensure the jobId is stored in localStorage
      if (paramJobId && (!storedJobId || storedJobId !== paramJobId)) {
        localStorage.setItem("activeJobId", paramJobId);
      }
    } else {
      // If no job ID is found, redirect to job details page
      toast({
        title: "Missing job information",
        description: "Please create a job first",
        variant: "destructive",
      });
      router.push('/jobs/create/details');
    }
  }, [searchParams, pathname]); // Added pathname dependency to refetch on navigation

  const fetchJobDetails = async (id: string) => {
    try {
      console.log("Fetching job details for ID:", id);
      const response = await fetch(`/api/jobs/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Job details API response:", data);
      
      if (data.success && data.job) {
        const job = data.job;
        console.log("Setting job details:", job);
        setJobDetails(job);
        // Return the job details for immediate use
        return job;
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
    return null;
  };

  const fetchCriteria = async (id: string) => {
    // If we already have criteria in state, don't fetch again
    if (criteria.length > 0 && criteria[0].job_id === id) {
      console.log("Using existing criteria from state");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/criteria?job_id=${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch criteria: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (data.criteria && data.criteria.length > 0) {
          setCriteria(data.criteria || []);
          // Update cache
          localStorage.setItem(`criteria_${id}`, JSON.stringify(data.criteria || []));
        } else {
          // No criteria found, fetch from Lyzr API
          await fetchFromLyzrApi(id);
        }
      } else {
        throw new Error(data.message || "Failed to fetch criteria");
      }
    } catch (error) {
      console.error("Error fetching criteria:", error);
      toast({
        title: "Error",
        description: "Failed to load evaluation criteria",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFromLyzrApi = async (jobId: string) => {
    try {
      // Check if we've already called the Lyzr API for this job ID
      if (lyzrApiCalledRef.current.has(jobId)) {
        console.log("Skipping duplicate Lyzr API call for job:", jobId);
        return;
      }
      
      // Mark this job ID as processed
      lyzrApiCalledRef.current.add(jobId);
      
      // Directly fetch job details and use them immediately
      console.log("Starting Lyzr API fetch for job:", jobId);
      
      // Fetch fresh job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      if (!jobResponse.ok) {
        throw new Error(`Failed to fetch job details: ${jobResponse.status}`);
      }
      
      const jobData = await jobResponse.json();
      console.log("Job data received:", jobData);
      
      if (!jobData.success || !jobData.job) {
        throw new Error("Could not retrieve job details");
      }
      
      const job = jobData.job;
      
      // Update the state with the job details
      setJobDetails(job);
      
      // Now use these details to call the Lyzr API
      console.log("Sending to Lyzr API:", {
        job_description: job.description || "Not specified",
        job_title: job.job_title || "Not specified",
        requirements: job.requirements || "Not specified"
      });
      
      const response = await fetch(`/api/lyzr-criteria?jobId=${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_description: job.description || "Not specified",
          job_title: job.job_title || "Not specified",
          requirements: job.requirements || "Not specified"
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch criteria from Lyzr: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Lyzr API response:", data);
      
      if (data.success && data.criteria && data.criteria.length > 0) {
        // Transform and store the criteria
        const transformedCriteria = data.criteria.map((item: LyzrCriterionResponse) => ({
          id: uuidv4(),
          name: item.criteria_name,
          criteria: item.evaluation_criteria,
          weightage: typeof item.Weightage === 'string' ? parseInt(item.Weightage) : item.Weightage,
          job_id: jobId
        }));
        
        console.log("Transformed criteria:", transformedCriteria);
        setCriteria(transformedCriteria);
        localStorage.setItem(`criteria_${jobId}`, JSON.stringify(transformedCriteria));
        
        // Save to database
        await saveLyzrCriteriaToDb(transformedCriteria);
      } else {
        console.warn("No criteria returned from Lyzr API");
      }
    } catch (error) {
      console.error("Error fetching from Lyzr API:", error);
      toast({
        title: "Note",
        description: "Could not load suggested criteria. You can add criteria manually.",
      });
    }
  };

  const saveLyzrCriteriaToDb = async (criteriaToSave: Criterion[]) => {
    try {
      const response = await fetch("/api/criteria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-save-all": "true"
        },
        body: JSON.stringify({ criteria: criteriaToSave }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save Lyzr criteria: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Suggested evaluation criteria loaded",
        });
      }
    } catch (error) {
      console.error("Error saving Lyzr criteria:", error);
    }
  };

  const handleAddCriterion = async () => {
    if (!criteriaName.trim()) {
      toast({
        title: "Required Field",
        description: "Criteria name is required",
        variant: "destructive",
      });
      return;
    }

    if (!jobId) {
      toast({
        title: "Error",
        description: "No active job found",
        variant: "destructive",
      });
      return;
    }

    const newCriterion: Criterion = {
      id: uuidv4(),
      name: criteriaName,
      criteria: criteriaDescription,
      weightage: parseInt(weightage),
      job_id: jobId
    };

    setIsAddingCriterion(true);
    try {
      const response = await fetch("/api/criteria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ criteria: [newCriterion] }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save criterion: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Criterion added successfully",
        });
        
        // Update local state with the added criterion from server response
        if (data.criteria && data.criteria.length > 0) {
          // Use functional update to ensure we're working with the latest state
          setCriteria(prevCriteria => {
            const updated = [...prevCriteria, ...data.criteria];
            // Update cache
            if (jobId) localStorage.setItem(`criteria_${jobId}`, JSON.stringify(updated));
            return updated;
          });
        } else {
          // Fallback to our local representation if server doesn't return the new criteria
          setCriteria(prevCriteria => {
            const updated = [...prevCriteria, newCriterion];
            // Update cache
            if (jobId) localStorage.setItem(`criteria_${jobId}`, JSON.stringify(updated));
            return updated;
          });
        }
        
        // Clear input fields
        setCriteriaName("");
        setCriteriaDescription("");
        setWeightage("3");
      } else {
        throw new Error(data.message || "Failed to add criterion");
      }
    } catch (error) {
      console.error("Error adding criterion:", error);
      toast({
        title: "Error",
        description: "Failed to add criterion",
        variant: "destructive",
      });
    } finally {
      setIsAddingCriterion(false);
    }
  };

  const handleRemoveCriterion = async (id: string) => {
    if (!jobId) {
      toast({
        title: "Error",
        description: "No active job found",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingCriterion(id);
    try {
      // First update local state for immediate UI feedback
      setCriteria(prevCriteria => {
        const updated = prevCriteria.filter(c => c.id !== id);
        // Update cache
        if (jobId) localStorage.setItem(`criteria_${jobId}`, JSON.stringify(updated));
        return updated;
      });
      
      // Then delete from database
      const response = await fetch(`/api/criteria/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete criterion: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Criterion deleted successfully",
        });
      } else {
        throw new Error(data.message || "Failed to delete criterion");
      }
    } catch (error) {
      console.error("Error deleting criterion:", error);
      toast({
        title: "Error",
        description: "Failed to delete criterion",
        variant: "destructive",
      });
      // Revert the local state change if the deletion failed
      fetchCriteria(jobId);
    } finally {
      setIsDeletingCriterion(null);
    }
  };

  const handleStartEdit = (criterion: Criterion) => {
    setEditingCriterionId(criterion.id);
    setEditForm({
      name: criterion.name,
      criteria: criterion.criteria,
      weightage: criterion.weightage.toString()
    });
  };

  const handleCancelEdit = () => {
    setEditingCriterionId(null);
    setEditForm({
      name: "",
      criteria: "",
      weightage: "3"
    });
  };

  const handleUpdateCriterion = async () => {
    if (!editingCriterionId || !jobId) return;
    
    if (!editForm.name.trim()) {
      toast({
        title: "Required Field",
        description: "Criteria name is required",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingCriterion(true);
    
    try {
      const updatedCriterion = {
        id: editingCriterionId,
        name: editForm.name,
        criteria: editForm.criteria,
        weightage: parseInt(editForm.weightage),
        job_id: jobId
      };

      const response = await fetch(`/api/criteria/${editingCriterionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ criterion: updatedCriterion }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update criterion: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setCriteria(prevCriteria => {
          const updated = prevCriteria.map(c => 
            c.id === editingCriterionId ? updatedCriterion : c
          );
          // Update cache
          if (jobId) localStorage.setItem(`criteria_${jobId}`, JSON.stringify(updated));
          return updated;
        });
        
        // Clear edit state
        setEditingCriterionId(null);
        setEditForm({
          name: "",
          criteria: "",
          weightage: "3"
        });
        
        toast({
          title: "Success",
          description: "Criterion updated successfully",
        });
      } else {
        throw new Error(data.message || "Failed to update criterion");
      }
    } catch (error) {
      console.error("Error updating criterion:", error);
      toast({
        title: "Error",
        description: "Failed to update criterion",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingCriterion(false);
    }
  };

  const saveCriteria = async () => {
    if (!jobId) {
      toast({
        title: "Error",
        description: "No active job found. Please create a job first.",
        variant: "destructive",
      });
      router.push("/jobs/create/details");
      return;
    }

    if (criteria.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one evaluation criterion",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Add job_id to all criteria
      const criteriaWithJobId = criteria.map(c => ({
        ...c,
        job_id: jobId
      }));

      const response = await fetch("/api/criteria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-save-all": "true"
        },
        body: JSON.stringify({ criteria: criteriaWithJobId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save criteria: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update the job's current step
        await fetch(`/api/jobs/${jobId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_step: "applicants"
          }),
        });
        
        toast({
          title: "Success",
          description: "Evaluation criteria saved successfully",
        });
        router.push(`/jobs/create/applicants?jobId=${jobId}`);
      } else {
        throw new Error(data.message || "Failed to save criteria");
      }
    } catch (error) {
      console.error("Error saving criteria:", error);
      toast({
        title: "Error",
        description: "Failed to save evaluation criteria",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mt-2 mb-6">
        {!isLoading && (
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={saveCriteria} disabled={isSaving}>
            Save & Continue
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading criteria...</div>
      ) : (
        <div className="flex flex-col space-y-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-1">
              <h3 className="text-sm font-medium">Criteria Name</h3>
              <Input 
                placeholder="Enter name"
                value={criteriaName}
                onChange={(e) => setCriteriaName(e.target.value)}
                className="w-full mt-2"
              />
            </div>
            <div className="col-span-1">
              <h3 className="text-sm font-medium">Evaluation Criteria</h3>
              <Input 
                placeholder="Enter criteria"
                value={criteriaDescription}
                onChange={(e) => setCriteriaDescription(e.target.value)}
                className="w-full mt-2"
              />
            </div>
            <div className="col-span-1 flex items-end gap-2">
              <div className="flex-grow">
                <h3 className="text-sm font-medium">Weightage</h3>
                <Select value={weightage} onValueChange={setWeightage}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select weightage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Lowest Weightage)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5 (Highest Weightage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="p-0 w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 mb-[2px] ml-4"
                onClick={handleAddCriterion}
                disabled={isAddingCriterion}
              >
                <Plus className="h-7 w-7 text-white" />
              </Button>
            </div>
          </div>
          
          {criteria.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-3 gap-4 items-center bg-gray-50 py-3 px-4 border-b">
                <div className="col-span-1 font-medium">Name</div>
                <div className="col-span-1 font-medium">Criteria</div>
                <div className="col-span-1 font-medium">Weightage</div>
              </div>
              
              {criteria.map((criterion) => (
                <div key={criterion.id} className="grid grid-cols-3 gap-4 items-center py-3 px-4 border-b">
                  {editingCriterionId === criterion.id ? (
                    <>
                      <div className="col-span-1">
                        <Input 
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full"
                        />
                      </div>
                      <div className="col-span-1">
                        <Input 
                          value={editForm.criteria}
                          onChange={(e) => setEditForm({...editForm, criteria: e.target.value})}
                          className="w-full"
                        />
                      </div>
                      <div className="col-span-1 flex justify-between items-center">
                        <Select 
                          value={editForm.weightage} 
                          onValueChange={(value) => setEditForm({...editForm, weightage: value})}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleUpdateCriterion}
                            className="h-6 w-6 text-green-500 hover:text-green-700 hover:bg-transparent p-0"
                            disabled={isUpdatingCriterion}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                            className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-transparent p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-1">
                        {criterion.name}
                      </div>
                      <div className="col-span-1">
                        {criterion.criteria}
                      </div>
                      <div className="col-span-1 flex justify-between items-center">
                        {criterion.weightage}
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(criterion)}
                            className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-transparent p-0 mr-2"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCriterion(criterion.id)}
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-transparent p-0"
                            disabled={isDeletingCriterion === criterion.id}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {criteria.length === 0 && (
            <div className="text-center py-8 text-gray-500 border rounded-md">
              No criteria added yet. Add criteria to evaluate candidates.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
