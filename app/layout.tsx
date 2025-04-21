import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from '../components/provider'
import { AuthProvider } from '@/components/auth/AuthProvider';
import OnboardingCheck from '@/components/onboarding/OnboardingCheck';
import { AmplifyProvider } from './providers';
import { AppLayout } from "@/components/AppLayout";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LYZR AI ",
  description: "AI Hiring Manager Powered by Lyzr AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AmplifyProvider>
          <Providers>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <OnboardingCheck />
                <AppLayout>{children}</AppLayout>
              </TooltipProvider>
            </AuthProvider>
          </Providers>
        </AmplifyProvider>
      </body>
    </html>
  );
}
