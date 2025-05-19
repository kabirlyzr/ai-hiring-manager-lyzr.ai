/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  LayoutDashboard,
  Settings,
  ChevronRight,
  PlusCircle,
  Menu,
  Book,
  Search,
  LogOut,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LogoIcon from "./ui/logosvg";
import { useAuth } from "./auth/AuthProvider";
import { createServerSupabaseClient } from "@/utils/supabase/server";

// Tour steps with descriptions
const tourSteps = [
  {
    title: "Dashboard",
    description: "View your hiring overview, including metrics on jobs created, candidates shortlisted, applicants processed, and interviews scheduled.",
    path: "/",
  },
  {
    title: "Applicants Evaluator",
    description: "First input job details, then set evaluation criteria. Upload applicant resumes and let AI evaluate them according to your criteria and job description.",
    path: "/jobs",
  },
  {
    title: "Job Descriptions",
    description: "Generate professional job descriptions using AI that attract the right candidates for your open positions.",
    path: "/job-descriptions",
  },
  {
    title: "Settings",
    description: "Update your company details and recruiter information to personalize your hiring experience.",
    path: "/settings",
  },
];

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Applicants Evaluator",
    icon: Search,
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

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated, isOnboarded, userId, tourCompleted: authTourCompleted } = useAuth();
  const [tourActive, setTourActive] = useState(false);
  const [showTourIndicators, setShowTourIndicators] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [localTourCompleted, setLocalTourCompleted] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const sidebarItemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // Check if tour has been completed in localStorage first
    const localStorageTourCompleted = localStorage.getItem('tourCompleted') === 'true';
    
    // Only show tour indicators for authenticated, onboarded users who haven't completed the tour
    if (isAuthenticated && isOnboarded && !authTourCompleted && !localStorageTourCompleted) {
      setShowTourIndicators(true);
      setLocalTourCompleted(false);
    } else {
      setShowTourIndicators(false);
      setTourActive(false);
      setLocalTourCompleted(true);
    }
  }, [isAuthenticated, isOnboarded, authTourCompleted]);

  const startTour = () => {
    setTourActive(true);
    const currentPathIndex = tourSteps.findIndex(step => step.path === pathname);
    if (currentPathIndex >= 0) {
      setCurrentTourStep(currentPathIndex);
    } else {
      setCurrentTourStep(0);
      router.push(tourSteps[0].path);
    }
  };

  const handleNextStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(currentTourStep + 1);
      router.push(tourSteps[currentTourStep + 1].path);
    } else {
      completeTour();
    }
  };

  const completeTour = async () => {
    setTourActive(false);
    setShowTourIndicators(false);
    setLocalTourCompleted(true);
    
    // Save to localStorage to prevent tour showing on page reload
    localStorage.setItem('tourCompleted', 'true');
    
    if (userId) {
      try {
        // Save tour completion status to server
        await fetch('/api/user/update-tour', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            tourCompleted: true
          }),
        });
      } catch (error) {
        console.error("Failed to save tour status:", error);
      }
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const handleLogout = async () => {
    try {
      const { default: lyzr } = await import("lyzr-agent");
      await lyzr.logout();
      window.location.reload()
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  // Find current step index based on pathname
  const getCurrentStepFromPath = () => {
    const stepIndex = tourSteps.findIndex(step => step.path === pathname);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  // Update current step when pathname changes
  useEffect(() => {
    if (tourActive) {
      setCurrentTourStep(getCurrentStepFromPath());
    }
  }, [pathname, tourActive]);

  // Update tooltip position when current step changes
  useEffect(() => {
    if (tourActive && sidebarItemRefs.current[currentTourStep]) {
      const rect = sidebarItemRefs.current[currentTourStep]?.getBoundingClientRect();
      let position = rect?.top || 0;
      
      // Ensure tooltip doesn't go above screen - add offset for top items
      if (currentTourStep < 2) {
        position = Math.max(position, 120); // Keep tooltip at least 120px from top
      }
      
      setTooltipPosition(position);
    }
  }, [currentTourStep, tourActive]);

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                {/* <LogoIcon /> */}
                <div className="flex flex-col">
                  {/* <span className="font-semibold text-sm"></span> */}
                  <span className="font-bold text-lg -mt-1">AI Hiring Assistant</span>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4 justify-between">
              <ul className="space-y-2">
                {sidebarItems.map((item, index) => (
                  <li 
                    key={item.path} 
                    className="relative"
                    ref={el => {
                      if (isMobileOpen) sidebarItemRefs.current[index] = el;
                    }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                        isActive(item.path)
                          ? "bg-indigo-500/10 text-indigo-500"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                    {tourActive && !localTourCompleted && currentTourStep === index && isMobileOpen && (
                      <>
                        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-pulse w-3 h-3 bg-indigo-500 rounded-full" />
                        </div>
                      </>
                    )}
                    {!tourActive && showTourIndicators && !localTourCompleted && isMobileOpen && item.path === "/" && (
                      <div 
                        className="absolute -right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          startTour();
                        }}
                        title="Click to start tour"
                      >
                        <div className="animate-pulse w-4 h-4 bg-indigo-500 rounded-full hover:bg-indigo-700" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center mr-4 "
              >
                <LogOut className="h-4 w-4 my-auto" />
                <span>Logout</span>
              </Button>
            </nav>
          </div>
        </SheetContent>
        
        {/* Mobile Tour Tooltip */}
        {tourActive && !localTourCompleted && isMobileOpen && (
          <div style={{
            position: 'fixed',
            left: '256px', /* 64px sidebar width */
            top: `${tooltipPosition}px`,
            transform: 'translateY(-50%)',
            marginLeft: '8px',
          }} className="bg-white shadow-2xl rounded-lg p-4 w-64 z-[9999] border border-indigo-100">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg text-indigo-600">{tourSteps[currentTourStep].title}</h3>
              <Button variant="ghost" size="sm" onClick={skipTour} className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-700 mb-5 leading-relaxed">{tourSteps[currentTourStep].description}</p>
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={skipTour} className="text-gray-600 hover:text-gray-800 border-gray-300">
                Skip Tour
              </Button>
              <Button variant="default" size="sm" onClick={handleNextStep} className="bg-indigo-600 hover:bg-indigo-700">
                {currentTourStep < tourSteps.length - 1 ? "Next" : "Finish"}
              </Button>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {tourSteps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentTourStep ? 'bg-indigo-600 w-3 h-3' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        )}
      </Sheet>

      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 border-r bg-background">
        <div className="px-4 py-4 border-b">
          <div className="flex items-center gap-2">
            <LogoIcon />

            <div className="flex flex-col border-l-4  border-gray-800 pl-2">
              <span className="font-bold text-3xl text-gray-800">AI Hiring</span>
              <span className="font-bold text-xl border-gray-800 -mt-2">Assistant</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 bg-gray-100 flex justify-between flex-col">
          <ul className="space-y-2">
            {sidebarItems.map((item, index) => (
              <li 
                key={item.path} 
                className="relative" 
                ref={el => {
                  if (!isMobileOpen) sidebarItemRefs.current[index] = el;
                }}
              >
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-indigo-500/10 text-indigo-500"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
                {tourActive && !localTourCompleted && currentTourStep === index && !isMobileOpen && (
                  <>
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                      <div className="animate-pulse w-3 h-3 bg-indigo-500 rounded-full" />
                    </div>
                  </>
                )}
                {!tourActive && showTourIndicators && !localTourCompleted && !isMobileOpen && item.path === "/" && (
                  <div 
                    className="absolute -right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      startTour();
                    }}
                    title="Click to start tour"
                  >
                    <div className="animate-pulse w-4 h-4 bg-indigo-500 rounded-full hover:bg-indigo-700" />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center mr-4 "
              >
                <LogOut className="h-4 w-4 my-auto" />
                <span>Logout</span>
              </Button>
        </nav>
      </div>
      
      {/* Desktop Tour Tooltip */}
      {tourActive && !localTourCompleted && !isMobileOpen && (
        <div 
          className="fixed left-60 ml-2 bg-white shadow-2xl rounded-lg p-4 w-80 z-[9999] border border-indigo-100"
          style={{
            top: `${tooltipPosition}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg text-indigo-600">{tourSteps[currentTourStep].title}</h3>
            <Button variant="ghost" size="sm" onClick={skipTour} className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-700 mb-5 leading-relaxed">{tourSteps[currentTourStep].description}</p>
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={skipTour} className="text-gray-600 hover:text-gray-800 border-gray-300">
              Skip Tour
            </Button>
            <Button variant="default" size="sm" onClick={handleNextStep} className="bg-indigo-600 hover:bg-indigo-700">
              {currentTourStep < tourSteps.length - 1 ? "Next" : "Finish"}
            </Button>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {tourSteps.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all ${idx === currentTourStep ? 'bg-indigo-600 w-3 h-3' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
