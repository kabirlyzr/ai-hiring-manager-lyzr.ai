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
  Search
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LogoIcon from "./ui/logosvg";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Job Descriptions",
    icon: Book,
    path: "/job-descriptions",
  },
  {
    title: "Apllicants Evaluator",
    icon: Search,
    path: "/jobs",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

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
                <LogoIcon />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">AI Hiring</span>
                  <span className="font-bold text-lg -mt-1">Manager</span>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {sidebarItems.map((item) => (
                  <li key={item.path}>
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
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 border-r bg-background">
        <div className="px-4 py-4 border-b">
          <div className="flex items-center gap-2">
            <LogoIcon />
            
            <div className="flex flex-col border-l-2 border-gray-600 pl-2">
              <span className="font-semibold text-lg">AI Hiring</span>
              <span className="font-bold text-2xl -mt-3">Manager</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.path}>
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
              </li>
            ))}
          </ul>
        </nav>
       
      </div>
    </>
  );
}
