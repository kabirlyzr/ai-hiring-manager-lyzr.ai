"use client"
/* eslint-disable @typescript-eslint/no-unused-vars */
// import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

// Define interfaces for our data types
interface Job {
  id: string;
  job_title: string;
  created_at: string;
}

interface Candidate {
  id: string;
  job_id: string;
  created_at: string;
}

interface Evaluation {
  job_id: string;
  candidate_id: string;
  score: number;
  status: string;
}

interface TrendData {
  date: string;
  jobs: number;
  candidates: number;
}

interface StageData {
  name: string;
  value: number;
}

interface EfficiencyData {
  name: string;
  applicants: number;
  shortlisted: number;
  timeToHire: number;
}

interface DashboardData {
  jobsCreated: number;
  candidatesShortlisted: number;
  applicantsProcessed: number;
  interviewsScheduled: number;
  candidateData: Candidate[];
  jobTrends: TrendData[];
  applicantStages: StageData[];
  hiringEfficiency: EfficiencyData[];
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    jobsCreated: 0,
    candidatesShortlisted: 0,
    applicantsProcessed: 0,
    interviewsScheduled: 0,
    candidateData: [],
    jobTrends: [],
    applicantStages: [],
    hiringEfficiency: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch jobs data
        const jobsResponse = await fetch('/api/jobs');
        const jobsData = await jobsResponse.json();
        
        // Fetch candidates data
        const candidatesResponse = await fetch('/api/candidates?job_id=all');
        const candidatesData = await candidatesResponse.json();
        
        // Fetch evaluations data
        const evaluationsResponse = await fetch('/api/evaluations');
        const evaluationsData = await evaluationsResponse.json();
        
        // Process the data for dashboard
        const jobs: Job[] = jobsData.success ? jobsData.jobs : [];
        const candidates: Candidate[] = candidatesData.success ? candidatesData.candidates : [];
        const evaluations: Evaluation[] = evaluationsData.success ? evaluationsData.evaluations : [];
        
        // Calculate metrics
        const shortlistedCandidates = evaluations.filter((e: Evaluation) => e.score > 70).length;
        const interviewsScheduled = evaluations.filter((e: Evaluation) => e.status === 'scheduled').length;
        
        // Create time-series data for job trends (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();
        
        const jobTrends = last7Days.map(date => {
          const jobsOnDate = jobs.filter((job: Job) => 
            new Date(job.created_at).toISOString().split('T')[0] === date
          ).length;
          
          const candidatesOnDate = candidates.filter((candidate: Candidate) => 
            new Date(candidate.created_at).toISOString().split('T')[0] === date
          ).length;
          
          return {
            date,
            jobs: jobsOnDate,
            candidates: candidatesOnDate
          };
        });
        
        // Create applicant stages distribution
        const applicantStages = [
          { name: 'Applied', value: candidates.length },
          { name: 'Screened', value: evaluations.length },
          { name: 'Shortlisted', value: shortlistedCandidates },
          { name: 'Interviewed', value: interviewsScheduled },
          { name: 'Hired', value: evaluations.filter((e: Evaluation) => e.status === 'hired').length }
        ];
        
        // Calculate hiring efficiency by job
        const hiringEfficiency = jobs.slice(0, 5).map((job: Job) => {
          const jobCandidates = candidates.filter((c: Candidate) => c.job_id === job.id);
          const jobEvaluations = evaluations.filter((e: Evaluation) => e.job_id === job.id);
          
          return {
            name: job.job_title,
            applicants: jobCandidates.length,
            shortlisted: jobEvaluations.filter((e: Evaluation) => e.score > 70).length,
            timeToHire: Math.floor(Math.random() * 15) + 5 // Simulated data
          };
        });
        
        setDashboardData({
          jobsCreated: jobs.length,
          candidatesShortlisted: shortlistedCandidates,
          applicantsProcessed: candidates.length,
          interviewsScheduled,
          candidateData: candidates,
          jobTrends,
          applicantStages,
          hiringEfficiency
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="overflow-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Hiring Overview</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Jobs Created</CardDescription>
                <CardTitle className="text-2xl">{dashboardData.jobsCreated}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-muted-foreground">↑ 20% from last period</span>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Candidates Shortlisted</CardDescription>
                <CardTitle className="text-2xl">{dashboardData.candidatesShortlisted}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-muted-foreground">↑ 10% from last period</span>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Applicants Processed</CardDescription>
                <CardTitle className="text-2xl">{dashboardData.applicantsProcessed}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-muted-foreground">↑ 10% from last period</span>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Interviews Scheduled</CardDescription>
                <CardTitle className="text-2xl">{dashboardData.interviewsScheduled}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-muted-foreground">↑ 20% from last period</span>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Activity Trends</CardTitle>
                <CardDescription>Jobs and candidates over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.jobTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="jobs" stroke="#8884d8" name="Jobs Created" />
                    <Line type="monotone" dataKey="candidates" stroke="#82ca9d" name="Candidates Applied" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Applicant Pipeline Stages</CardTitle>
                <CardDescription>Distribution across hiring funnel</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.applicantStages}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.applicantStages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Efficiency by Job</CardTitle>
                <CardDescription>Applicants vs shortlisted candidates and time to hire</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.hiringEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="applicants" name="Total Applicants" fill="#8884d8" />
                    <Bar yAxisId="left" dataKey="shortlisted" name="Shortlisted" fill="#82ca9d" />
                    <Bar yAxisId="right" dataKey="timeToHire" name="Days to Hire" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
