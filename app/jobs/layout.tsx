"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Only show horizontal navigation when in job creation flow
  const showJobStepsNav = pathname.startsWith("/jobs/create");

  const jobSteps = [
    { title: "Job Details", path: "/jobs/create/details" },
    { title: "Evaluation Criteria", path: "/jobs/create/criteria" },
    { title: "Applicants Evaluation", path: "/jobs/create/applicants" },
  ];

  return (
    <div className="flex flex-col h-full">
      {showJobStepsNav && (
        <div className="sticky top-0 z-10 w-full border-b bg-background">
        
          <div className="flex gap-3 px-4 ">
            {jobSteps.map((step) => (
              <div key={step.path} className="flex items-center">

                <Link
                  href={step.path}
                  className={cn(
                    "text-sm font-medium transition-colors py-3 pb-5 mt-3 px-3",
                    pathname === step.path
                      ? "text-indigo-500 border-b-2 border-indigo-500 "
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {step.title}
                </Link>
              </div>
            ))}
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
