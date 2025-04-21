"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileHeader() {
  const router = useRouter();

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

  return (
    <div className="flex items-center justify-end h-full px-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLogout} 
        className="flex items-center mr-4 "
      >
        <LogOut className="h-4 w-4 my-auto" />
        <span>Logout</span>
      </Button>
    </div>
  );
}