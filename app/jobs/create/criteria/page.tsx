/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Plus, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";

interface Criterion {
  id: string;
  name: string;
  criteria: string;
  weightage: number;
  job_id?: string;
}

export default function EvaluationCriteriaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    // Get job_id from URL params or localStorage
    const paramJobId = searchParams.get('jobId');
    const storedJobId = localStorage.getItem("activeJobId");
    
    // Prioritize URL param over localStorage
    const activeJobId = paramJobId || storedJobId;
    
    if (activeJobId) {
      setJobId(activeJobId);
      fetchCriteria(activeJobId);
      
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
  }, [searchParams]);

  const fetchCriteria = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/criteria?job_id=${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch criteria: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCriteria(data.criteria || []);
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
          setCriteria([...criteria, ...data.criteria]);
        } else {
          // Fallback to our local representation if server doesn't return the new criteria
          setCriteria([...criteria, newCriterion]);
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
      setCriteria(criteria.filter(c => c.id !== id));
      
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
        },
        body: JSON.stringify({ criteria: criteriaWithJobId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save criteria: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
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
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={saveCriteria} disabled={isSaving}>
          Start Evaluating
        </Button>
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
                  <div className="col-span-1">
                    {criterion.name}
                  </div>
                  <div className="col-span-1">
                    {criterion.criteria}
                  </div>
                  <div className="col-span-1 flex justify-between items-center">
                    {criterion.weightage}
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
