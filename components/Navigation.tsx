/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { cn } from "@/lib/utils";
import { Building2, FileText, Settings, Users, LayoutDashboard, Book } from "lucide-react";
import LogoIcon from "./ui/logosvg";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from 'react-redux';
import { RootState } from "@/store/store";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Jobs",
    icon: FileText,
    path: "/jobs",
  },
  {
    title: "Job Descriptions",
    icon: Book,
    path: "/job-descriptions",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

// Job process steps
const jobSteps = [
  {
    title: "Job Details",
    path: "/jobs/create/details",
  },
  {
    title: "Evaluation Criteria",
    path: "/jobs/create/criteria",
  },
  {
    title: "Applicants Evaluation",
    path: "/jobs/create/applicants",
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  const companyData = useSelector((state: RootState) => state.companySetup);
  const evaluatedCandidates = useSelector((state: RootState) => state.evaluation.candidates);
  const jobDescription = useSelector((state: RootState) => state.jobDescription.savedJobs);
  const evaluationCriteria = useSelector((state: RootState) => state.criteria.criteria);

  const isCompanySetupComplete = () => {
    return Boolean(
      companyData.companyName &&
      companyData.website &&
      companyData.about 
    );
  };

  const isJobDescriptionComplete = () => {
    return Boolean(jobDescription && jobDescription.length > 0);
  };

  const isEvaluationCriteriaComplete = () => {
    return Boolean(evaluationCriteria && evaluationCriteria.length > 0);
  };

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/settings" && !isCompanySetupComplete()) {
      toast({
        title: "Company Setup Required",
        description: "Please complete company setup in Settings before accessing other pages",
        variant: "destructive",
      });
      router.push("/settings");
    }

    if (pathname === "/jobs/create/applicants" && (!isJobDescriptionComplete() || !isEvaluationCriteriaComplete())) {
      toast({
        title: "Setup Required",
        description: "Please complete job description and evaluation criteria before accessing applicants",
        variant: "destructive",
      });
      router.push("/jobs/create/details");
    }

    if (pathname === "/jobs/create/criteria" && !isJobDescriptionComplete()) {
      toast({
        title: "Job Description Required",
        description: "Please complete job description before setting evaluation criteria",
        variant: "destructive",
      });
      router.push("/jobs/create/details");
    }
  }, [pathname, router, toast]);

  const renderNavItem = (item: typeof navItems[0]) => {
    const isDisabled = 
      (item.path !== "/" && item.path !== "/settings" && !isCompanySetupComplete());

    const tooltipMessage = "Complete company setup in Settings first";

    const navContent = (
      <div
        className={cn(
          "flex items-center space-x-3 px-1 text-sm font-medium transition-colors",
          pathname === item.path || (item.path === "/jobs" && pathname.startsWith("/jobs"))
            ? "text-indigo-500 border-b-2 pb-[15px] border-b-indigo-500"
            : isDisabled
            ? "text-muted-foreground/40 cursor-not-allowed"
            : "text-muted-foreground hover:text-accent-foreground cursor-pointer"
        )}
      >
        <item.icon className={cn("h-5 w-fit", isDisabled && "opacity-40")} />
        <span>{item.title}</span>
      </div>
    );

    if (isDisabled) {
      return (
        <TooltipProvider key={item.path}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-not-allowed">
                {navContent}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link 
        key={item.path}
        href={item.path}
      >
        {navContent}
      </Link>
    );
  };

  // Render secondary navigation for job creation steps
  const renderJobStepsNav = () => {
    if (!pathname.startsWith("/jobs/create")) return null;
    
    return (
      <div className="w-full border-b bg-white py-2">
        <div className="container flex justify-between">
          <div className="flex gap-6">
            {jobSteps.map((step) => {
              const isActive = pathname === step.path;
              const isDisabled = 
                (step.path === "/jobs/create/applicants" && (!isJobDescriptionComplete() || !isEvaluationCriteriaComplete())) ||
                (step.path === "/jobs/create/criteria" && !isJobDescriptionComplete());
              
              let tooltipMessage = "";
              if (step.path === "/jobs/create/applicants" && !isJobDescriptionComplete()) {
                tooltipMessage = "Complete job description first";
              } else if (step.path === "/jobs/create/applicants" && !isEvaluationCriteriaComplete()) {
                tooltipMessage = "Complete evaluation criteria first";
              } else if (step.path === "/jobs/create/criteria" && !isJobDescriptionComplete()) {
                tooltipMessage = "Complete job description first";
              }
              
              const stepContent = (
                <div className={cn(
                  "py-2 px-4 text-sm transition-colors",
                  isActive ? "text-indigo-500 font-semibold border-b-2 border-indigo-500" : 
                  isDisabled ? "text-muted-foreground/40 cursor-not-allowed" : 
                  "text-muted-foreground hover:text-accent-foreground"
                )}>
                  {step.title}
                </div>
              );
              
              if (isDisabled) {
                return (
                  <TooltipProvider key={step.path}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-not-allowed">
                          {stepContent}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tooltipMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }
              
              return (
                <Link key={step.path} href={step.path}>
                  {stepContent}
                </Link>
              );
            })}
          </div>
          <Link href="/jobs" className="flex items-center">
            <button className="py-2 px-4 text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
              Back to All Jobs
            </button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      <nav className="fixed left-0 top-0 h-[4.2rem] w-full bg-white/80 backdrop-blur-sm border-r shadow-sm">
        <div className="p-4 flex flex-row gap-16 w-full">
          <span className="font-bold text-[#292929] mb-6 w-fit flex flex-row gap-3">
            <LogoIcon />
            <div className="border border-l border-l-[#cacaca]"></div>
            <span className="-mt-1">
              <p className="text-md text-bold">AI Hiring </p>
              <p className="text-2xl -mt-3">Manager</p>
            </span>
          </span>
          <div className="flex flex-row space-y-0.4 mt-[15px] gap-10">
            {navItems.map((item) => renderNavItem(item))}
          </div>
        </div>
      </nav>
      {renderJobStepsNav()}
    </>
  );
}