/* eslint-disable @typescript-eslint/no-unused-vars */
// app/jobs/page.tsx
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { PlusCircle, FileText, Loader2 } from "lucide-react";
import EmptySVG1 from "@/components/ui/emptySvg";

interface Job {
  id: string;
  job_title: string;
  description: string;
  requirements: string;
  created_at: string;
  current_step?: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();

        if (data.success) {
          setJobs(data.jobs || []);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleCreateJob = () => {
    // Clear the activeJobId from localStorage to ensure a fresh start
    localStorage.removeItem("activeJobId");
    router.push('/jobs/create/details');
  };

  const handleViewJob = async (jobId: string) => {
    try {
      // Fetch job details to determine current step
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch job details');
      }
      
      const job = data.job;

      // Set job ID in localStorage for persistence across steps
      localStorage.setItem("activeJobId", jobId);
      
      // Determine which step to navigate to
      let targetStep = '/jobs/create/details';
      
      if (job.current_step) {
        // If job has a stored step, navigate to that step
        targetStep = job.current_step;
      } else {
        // If no current step is set, update the job with the first step
        await updateJobStep(jobId, targetStep);
      }
      
      // Navigate to the appropriate step
      router.push(`${targetStep}?jobId=${jobId}`);
    } catch (error) {
      console.error('Error handling job view:', error);
      // Fallback to job details step
      router.push(`/jobs/create/details?jobId=${jobId}`);
    }
  };
  
  const updateJobStep = async (jobId: string, stepPath: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_step: stepPath,
        }),
      });
      
      return response.json();
    } catch (error) {
      console.error('Error updating job step:', error);
      return { success: false };
    }
  };

  return (
    <div className="container mx-auto h-[80vh]">
      <div className="flex justify-between items-center mb-6">

      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center h-full my-auto">
          <EmptySVG1 />
          <h3 className="text-lg font-medium mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-4">Create your first job to get started</p>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md" onClick={handleCreateJob}>Create New Job</button>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">All Jobs</h1>
            <button className="bg-indigo-500 hover:bg-indigo-600 flex flex-row items-center text-white px-4 py-2 rounded-md" onClick={handleCreateJob}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Job
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow flex flex-col justify-between h-full border border-gray-200">
                <div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-800">{job.job_title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {job.description.length > 150
                        ? job.description.substring(0, 150) + '...'
                        : job.description}
                    </p>
                  </CardContent>
                </div>
                <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium" onClick={() => handleViewJob(job.id)}>
                    View Details
                  </button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}