/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentJobStep, setCurrentJobStep] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Only show horizontal navigation when in job creation flow
  const showJobStepsNav = pathname.startsWith("/jobs/create");

  const jobSteps = [
    { title: "Job Details", path: "/jobs/create/details", stepValue: "details" },
    { title: "Evaluation Criteria", path: "/jobs/create/criteria", stepValue: "criteria" },
    { title: "Applicants Evaluation", path: "/jobs/create/applicants", stepValue: "applicants" },
  ];

  // Update currentJobId when searchParams or localStorage changes
  useEffect(() => {
    // Check if we're in the create flow without a jobId in the URL
    const isNewJobCreation = pathname.includes('/jobs/create/details') && !searchParams.get('jobId');
    
    // If we're creating a new job, clear localStorage and reset the currentJobId
    if (isNewJobCreation) {
      console.log('New job creation detected, clearing localStorage');
      localStorage.removeItem("activeJobId");
      setCurrentJobId(null);
      return;
    }
    
    // Otherwise, get the jobId from URL or localStorage
    const jobId = searchParams.get('jobId') || localStorage.getItem("activeJobId");
    if (jobId !== currentJobId) {
      console.log(`Updating currentJobId from ${currentJobId} to ${jobId}`);
      setCurrentJobId(jobId);
    }
  }, [searchParams, currentJobId, pathname]);

  // Fetch the current job's step from the database
  useEffect(() => {
    let isMounted = true;
    
    const fetchJobStep = async () => {
      console.log(`Fetching job step for jobId: ${currentJobId}`);
      
      // Check if we're in the create flow without a jobId
      const isNewJobCreation = pathname.includes('/jobs/create/details') && !currentJobId;
      
      // If we're creating a new job or no jobId is found, reset states
      if (isNewJobCreation || !currentJobId) {
        if (isMounted) {
          console.log('New job creation or no jobId found, resetting states');
          setCurrentJobStep(null);
          setCompletedSteps([]);
        }
        return;
      }
      
      if (currentJobId && showJobStepsNav) {
        try {
          // Reset states before fetching new job data
          if (isMounted) {
            console.log('Resetting states before fetching new job data');
            setCurrentJobStep(null);
            setCompletedSteps([]);
          }
          
          const response = await fetch(`/api/jobs/${currentJobId}`);
          const data = await response.json();
          
          if (data.success && data.job && data.job.current_step && isMounted) {
            console.log(`Job step fetched: ${data.job.current_step}`);
            setCurrentJobStep(data.job.current_step);
            
            // Determine completed steps based on the current step
            if (data.job.current_step === "criteria") {
              console.log('Setting completed steps: details');
              setCompletedSteps(["details"]);
            } else if (data.job.current_step === "applicants") {
              console.log('Setting completed steps: details, criteria');
              setCompletedSteps(["details", "criteria"]);
            } else {
              console.log('No completed steps');
              setCompletedSteps([]);
            }
          } else if (isMounted) {
            // If no current_step is found, default to the first step
            console.log('No current_step found, defaulting to details');
            setCurrentJobStep("details");
            setCompletedSteps([]);
          }
        } catch (error) {
          console.error("Error fetching job step:", error);
          // Reset states on error
          if (isMounted) {
            console.log('Error occurred, resetting states');
            setCurrentJobStep(null);
            setCompletedSteps([]);
          }
        }
      }
    };

    fetchJobStep();
    
    // Cleanup function to reset state when component unmounts
    return () => {
      isMounted = false;
    };
  }, [pathname, currentJobId, showJobStepsNav]);

  return (
    <div className="flex flex-col h-full  ">
      {showJobStepsNav && (
        <div className="sticky top-0  w-full border-b mt-1 bg-background">
        
          <div className="flex gap-3 px-4 relative">
            {jobSteps.map((step, index) => {
              const isCurrentStep = currentJobStep === step.stepValue;
              const isActive = pathname === step.path;
              const isCompleted = completedSteps.includes(step.stepValue);
              const isNewJobCreation = !currentJobId && pathname.includes('/jobs/create/details');
              const isDisabled = isNewJobCreation && step.stepValue !== "details";
              
              return (
                <div key={step.path} className="flex items-center">
                  <Link
                    href={`${step.path}${currentJobId ? `?jobId=${currentJobId}` : ''}`}
                    className={cn(
                      "text-sm font-medium transition-colors py-3 pb-5 mt-3 px-3 flex items-center gap-1",
                      isActive
                        ? "text-indigo-500 border-b-2 border-indigo-500"
                        : isCompleted
                        ? "text-gray-500 hover:text-gray-600"
                        : isDisabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={(e) => {
                      // If we're in a new job creation flow and trying to navigate to a step other than details,
                      // prevent navigation and show a toast
                      if (isDisabled) {
                        e.preventDefault();
                        // Use alert since we don't have access to toast here
                        alert("Please complete the current step first");
                      }
                    }}
                  >
                 
                    <span className="flex items-center">
                      <span className={cn(
                        "inline-flex justify-center items-center w-5 h-5 rounded-full mr-1.5 text-xs",
                        isCurrentStep 
                          ? "bg-indigo-500 text-white" 
                          : isDisabled
                          ? "bg-gray-200 text-gray-400"
                          : "bg-indigo-100 text-indigo-700"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 " />
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </span>
                      {step.title}
                    </span>
                  </Link>
                </div>
              );
            })}
            <div className="ml-auto border border-gray-200 rounded-md my-2">
              <Link
                href="/jobs"
                className="text-sm font-medium text-muted-foreground hover:text-foreground py-3 px-3 flex items-center"
              >
                Back to All Jobs
                <ChevronRight className="h-5 w-5 ml-1 my-auto mt-0.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
