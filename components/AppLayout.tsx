/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth/AuthProvider";
import Cookies from "js-cookie";

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
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // List of paths that don't require authentication
  const publicPaths = ['/', '/onboarding'];
  const isPublicPath = publicPaths.some(path => pathname === path);

  useEffect(() => {
    // Check authentication status on route change
    const verifyAuth = async () => {
      // Skip auth check for public paths
      if (isPublicPath) return;

      const userId = Cookies.get('user_id');
      const token = Cookies.get('token');

      // If no cookies and path requires auth, redirect to home
      if (!userId || !token) {
        router.push('/');
        return;
      }

      // If we have cookies but aren't authenticated yet, run checkAuth
      if (!isAuthenticated) {
        await checkAuth();
      }
    };

    verifyAuth();
  }, [pathname, isAuthenticated, isPublicPath, router, checkAuth]);

  // Show loader while initial auth check is in progress
  if (isLoading) {
    return <GlobalLoader />;
  }

  // If path requires authentication and user is not authenticated, show loader
  // This gives time for the auth check to complete
  if (!isPublicPath && !isAuthenticated) {
    return <GlobalLoader />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="fixed top-0 right-0 h-[88px] bg-background w-[70%] xl:w-[80%] 2xl:w-[85%] justify-end flex z-10">
        {/* <ProfileHeader /> */}
      </div>
      <main className="flex-1 mt-[88px] overflow-auto pl-0 md:pl-60 border-t border-gray-200">
        {children}
      </main>
    </div>
  );
} 