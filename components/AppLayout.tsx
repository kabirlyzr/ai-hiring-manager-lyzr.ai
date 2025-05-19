"use client"

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

function GlobalLoader() {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading application...</p>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Simulate auth check - replace with actual auth check
    const checkAuth = async () => {
      try {
        // Replace this with your actual authentication verification
        // For example: await fetchUserProfile() or await checkSession()
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating auth call
        setIsAuthReady(true);
      } catch (error) {
        console.error("Authentication error:", error);
        // Handle auth error if needed
        setIsAuthReady(true); // Still set to true to avoid blocking UI
      }
    };

    checkAuth();
  }, []);

  if (!isAuthReady) {
    return <GlobalLoader />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="fixed top-0 right-0 h-[88px] bg-background w-[86%] justify-end flex z-10">
        {/* <ProfileHeader /> */}
      </div>
      <main className="flex-1 mt-[88px] overflow-auto pl-0 md:pl-60 border-t border-gray-200">
        {children}
      </main>
    </div>
  );
} 