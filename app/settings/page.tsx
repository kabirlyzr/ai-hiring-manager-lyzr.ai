/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Mail, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import EmptySVG1 from "@/components/ui/emptySvg";
// import Link from "next/link";

interface CompanyData {
  id?: string;
  company_name: string;
  website: string;
  description: string;
}

interface RecruiterData {
  id?: string;
  name: string;
  role: string;
  calendly_link: string;
}

interface SmtpData {
  id?: string;
  recruiter_id: string;
  username: string;
  password: string;
  host: string;
  port: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  // const [enableSettings, setEnableSettings] = useState(true);
  
  // Define setting steps for navigation
  const settingSteps = [
    { title: "Company", path: "company" },
    { title: "Recruiters", path: "recruiters" },
    // { title: "Email", path: "email" },
  ];
  
  // Company state
  const [companyData, setCompanyData] = useState<CompanyData>({
    company_name: "",
    website: "",
    description: ""
  });
  
  // Recruiter state
  const [recruiters, setRecruiters] = useState<RecruiterData[]>([]);
  const [addRecruiterOpen, setAddRecruiterOpen] = useState(false);
  const [editRecruiterOpen, setEditRecruiterOpen] = useState(false);
  const [currentRecruiter, setCurrentRecruiter] = useState<RecruiterData>({
    name: "",
    role: "",
    calendly_link: ""
  });
  
  // SMTP state
  const [smtpDialogOpen, setSmtpDialogOpen] = useState(false);
  const [smtpData, setSmtpData] = useState<SmtpData>({
    recruiter_id: "",
    username: "",
    password: "",
    host: "",
    port: ""
  });
  
  // Add state to track which recruiters have SMTP configured
  const [recruiterSmtpStatus, setRecruiterSmtpStatus] = useState<Record<string, boolean>>({});
  
  const [saving, setSaving] = useState(false);
  
  // Add a new state to track verification status
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  // Add loading states for data fetching
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingRecruiters, setLoadingRecruiters] = useState(true);
  
  useEffect(() => {
    // Fetch company data
    const fetchCompanyData = async () => {
      setLoadingCompany(true);
      try {
        const response = await fetch('/api/company');
        const data = await response.json();
        
        if (data.success && data.companies?.length > 0) {
          const company = data.companies[0];
          setCompanyData({
            id: company.id,
            company_name: company.company_name || "",
            website: company.website || "",
            description: company.description || ""
          });
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoadingCompany(false);
      }
    };
    
    // Fetch recruiters
    const fetchRecruiters = async () => {
      setLoadingRecruiters(true);
      try {
        const response = await fetch('/api/recruiters');
        const data = await response.json();
        
        if (data.success) {
          setRecruiters(data.recruiters || []);
          
          // Check SMTP status for each recruiter
          if (data.recruiters?.length > 0) {
            const statuses: Record<string, boolean> = {};
            
            // Fetch all SMTP settings and check if each recruiter has one
            const smtpResponse = await fetch('/api/smtp');
            if (smtpResponse.ok) {
              const smtpData = await smtpResponse.json();
              
              if (smtpData.success && smtpData.smtp_settings?.length > 0) {
                // Create a map of recruiter_id -> boolean indicating if SMTP exists
                smtpData.smtp_settings.forEach((smtp: any) => {
                  statuses[smtp.recruiter_id] = true;
                });
              }
            }
            
            setRecruiterSmtpStatus(statuses);
          }
        }
      } catch (error) {
        console.error('Error fetching recruiters:', error);
      } finally {
        setLoadingRecruiters(false);
      }
    };
    
    fetchCompanyData();
    fetchRecruiters();
  }, []);
  
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRecruiterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentRecruiter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (value: string) => {
    setCurrentRecruiter(prev => ({ ...prev, role: value }));
  };
  
  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSmtpData(prev => ({ ...prev, [name]: value }));
  };
  
  const saveCompanyData = async () => {
    if (!companyData.company_name) {
      toast({
        title: "Required Field",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Company information saved successfully",
        });
        if (data.company?.id) {
          setCompanyData(prev => ({ ...prev, id: data.company.id }));
        }
      } else {
        throw new Error(data.message || "Failed to save company information");
      }
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: "Error",
        description: "Failed to save company information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const addRecruiter = async () => {
    if (!currentRecruiter.name) {
      toast({
        title: "Required Field",
        description: "Recruiter name is required",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/recruiters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentRecruiter),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Recruiter added successfully",
        });
        
        setRecruiters(prev => [...prev, data.recruiter]);
        setCurrentRecruiter({ name: "", role: "", calendly_link: "" });
        setAddRecruiterOpen(false);
      } else {
        throw new Error(data.message || "Failed to add recruiter");
      }
    } catch (error) {
      console.error('Error adding recruiter:', error);
      toast({
        title: "Error",
        description: "Failed to add recruiter",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const editRecruiter = (recruiter: RecruiterData) => {
    setCurrentRecruiter(recruiter);
    setEditRecruiterOpen(true);
  };
  
  const updateRecruiter = async () => {
    if (!currentRecruiter.name || !currentRecruiter.id) {
      toast({
        title: "Required Field",
        description: "Recruiter name is required",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`/api/recruiters/${currentRecruiter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentRecruiter),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Recruiter updated successfully",
        });
        
        // Update the recruiter in the state
        setRecruiters(prev => 
          prev.map(r => r.id === currentRecruiter.id ? {...currentRecruiter} : r)
        );
        setEditRecruiterOpen(false);
      } else {
        throw new Error(data.message || "Failed to update recruiter");
      }
    } catch (error) {
      console.error('Error updating recruiter:', error);
      toast({
        title: "Error",
        description: "Failed to update recruiter",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteRecruiter = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recruiter?")) {
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`/api/recruiters?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Recruiter deleted successfully",
        });
        
        // Remove from state
        setRecruiters(recruiters.filter(r => r.id !== id));
        // Also remove from SMTP status tracking
        setRecruiterSmtpStatus(prev => {
          const updated = {...prev};
          delete updated[id];
          return updated;
        });
      } else {
        throw new Error(data.message || "Failed to delete recruiter");
      }
    } catch (error) {
      console.error('Error deleting recruiter:', error);
      toast({
        title: "Error",
        description: "Failed to delete recruiter",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const openSmtpDialog = (recruiterId: string) => {
    setSmtpData({
      recruiter_id: recruiterId,
      username: "",
      password: "",
      host: "",
      port: ""
    });
    
    // Check if SMTP settings already exist for this recruiter
    const fetchSmtpSettings = async () => {
      try {
        const response = await fetch(`/api/smtp?recruiter_id=${recruiterId}`);
        const data = await response.json();
        
        if (data.success && data.smtp_settings?.length > 0) {
          const smtp = data.smtp_settings[0];
          setSmtpData({
            id: smtp.id,
            recruiter_id: smtp.recruiter_id,
            username: smtp.username || "",
            password: smtp.password || "",
            host: smtp.host || "",
            port: smtp.port || ""
          });
        }
      } catch (error) {
        console.error('Error fetching SMTP settings:', error);
      }
    };
    
    fetchSmtpSettings();
    setSmtpDialogOpen(true);
  };
  
  // Add test connection function
  const testSmtpConnection = async () => {
    if (!smtpData.username || !smtpData.password || !smtpData.host || !smtpData.port) {
      toast({
        title: "Required Fields",
        description: "All SMTP fields are required",
        variant: "destructive",
      });
      return;
    }
    
    setVerifying(true);
    setVerificationStatus(null);
    
    try {
      const testResponse = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smtpData),
      });
      
      const testData = await testResponse.json();
      
      if (testData.success) {
        setVerificationStatus({
          success: true,
          message: "Connection successful! You can now save these settings."
        });
      } else {
        setVerificationStatus({
          success: false,
          message: testData.error || "Connection failed. Please verify your credentials."
        });
      }
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      setVerificationStatus({
        success: false,
        message: "Connection test failed. Please try again."
      });
    } finally {
      setVerifying(false);
    }
  };
  
  // Modify the saveSmtpSettings function
  const saveSmtpSettings = async () => {
    if (!smtpData.username || !smtpData.password || !smtpData.host || !smtpData.port) {
      toast({
        title: "Required Fields",
        description: "All SMTP fields are required",
        variant: "destructive",
      });
      return;
    }
    
    // If we haven't verified yet, do it first
    if (!verificationStatus?.success) {
        toast({
        title: "Verification Required",
        description: "Please test the connection before saving",
          variant: "destructive",
        });
        return;
      }
      
    setSaving(true);
    try {
      // Skip the test since we already verified
      const response = await fetch('/api/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smtpData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the recruiterSmtpStatus immediately
        setRecruiterSmtpStatus(prev => ({
          ...prev,
          [smtpData.recruiter_id]: true
        }));
        
        toast({
          title: "Success",
          description: "SMTP settings saved successfully",
        });
        setSmtpDialogOpen(false);
      } else {
        throw new Error(data.message || "Failed to save SMTP settings");
      }
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save SMTP settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Navigation bar similar to create job */}
      <div className="sticky top-0  w-full border-b bg-background">
        <div className="flex flex-col px-4">
          {/* Switch above the title */}
          {/* <div className="flex justify-end pt-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="settings-enabled">Enable Settings</Label>
              <Switch 
                id="settings-enabled" 
                checked={enableSettings} 
                onCheckedChange={setEnableSettings} 
              />
            </div>
          </div> */}
          
          {/* Settings navigation */}
          <div className="flex gap-3">
            {settingSteps.map((step) => (
              <div key={step.path} className="flex items-center">
                <button
                  onClick={() => setActiveTab(step.path)}
                  className={cn(
                    "text-sm font-medium transition-colors py-3 px-3",
                    activeTab === step.path
                      ? "text-indigo-500 border-b-2 border-indigo-500"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  // disabled={!enableSettings}
                >
                  {step.title}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto ">
        {/* Company Settings */}
        {activeTab === "company" && (
          <div >
            {loadingCompany ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Loading company data...</p>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Update your company information to use in communications and job descriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-w-2xl">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Name of the company</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={companyData.company_name}
                        onChange={handleCompanyChange}
                        placeholder="Acme Corporation"
                      />
                      <p className="text-sm text-muted-foreground">This will appear on all job listings and communications</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={companyData.website}
                        onChange={handleCompanyChange}
                        placeholder="https://www.acmecorp.com"
                      />
                      <p className="text-sm text-muted-foreground">Your company&apos;s official website URL</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">About the Company</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={companyData.description}
                        onChange={handleCompanyChange}
                        placeholder="Acme Corporation is a leading provider of innovative solutions with a mission to transform how businesses operate. Founded in 2010, we have a team of dedicated professionals committed to excellence."
                        rows={5}
                      />
                      <p className="text-sm text-muted-foreground">Brief description of your company, culture and values</p>
                    </div>
                    
                    <Button 
                      onClick={saveCompanyData} 
                      disabled={saving}
                      className="mt-4"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Recruiters Settings */}
        {activeTab === "recruiters" && (
          <div >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recruiters</h2>
              
              <Dialog open={addRecruiterOpen} onOpenChange={setAddRecruiterOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Reciter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Recruiter</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="recruiter_name">Name</Label>
                      <Input
                        id="recruiter_name"
                        name="name"
                        value={currentRecruiter.name}
                        onChange={handleRecruiterChange}
                        placeholder="Placeholder"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={currentRecruiter.role} onValueChange={handleRoleChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HR Manager">HR Manager</SelectItem>
                          <SelectItem value="Recruiter">Recruiter</SelectItem>
                          <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
                          <SelectItem value="Technical Interviewer">Technical Interviewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="calendly_link">Calendly Link</Label>
                      <Input
                        id="calendly_link"
                        name="calendly_link"
                        value={currentRecruiter.calendly_link}
                        onChange={handleRecruiterChange}
                        placeholder="Placeholder"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={addRecruiter} disabled={saving}>
                        Add
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={editRecruiterOpen} onOpenChange={setEditRecruiterOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Recruiter</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_recruiter_name">Name</Label>
                      <Input
                        id="edit_recruiter_name"
                        name="name"
                        value={currentRecruiter.name}
                        onChange={handleRecruiterChange}
                        placeholder="Placeholder"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_role">Role</Label>
                      <Select value={currentRecruiter.role} onValueChange={handleRoleChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HR Manager">HR Manager</SelectItem>
                          <SelectItem value="Recruiter">Recruiter</SelectItem>
                          <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
                          <SelectItem value="Technical Interviewer">Technical Interviewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_calendly_link">Calendly Link</Label>
                      <Input
                        id="edit_calendly_link"
                        name="calendly_link"
                        value={currentRecruiter.calendly_link}
                        onChange={handleRecruiterChange}
                        placeholder="Placeholder"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={updateRecruiter} disabled={saving}>
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={smtpDialogOpen} onOpenChange={setSmtpDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>SMTP Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_username">SMTP Username</Label>
                      <Input
                        id="smtp_username"
                        name="username"
                        value={smtpData.username}
                        onChange={handleSmtpChange}
                        placeholder="email@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp_password">SMTP Password</Label>
                      <Input
                        id="smtp_password"
                        name="password"
                        type="password"
                        value={smtpData.password}
                        onChange={handleSmtpChange}
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp_host">SMTP Host</Label>
                      <Input
                        id="smtp_host"
                        name="host"
                        value={smtpData.host}
                        onChange={handleSmtpChange}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">SMTP Port</Label>
                      <Input
                        id="smtp_port"
                        name="port"
                        value={smtpData.port}
                        onChange={handleSmtpChange}
                        placeholder="587"
                      />
                    </div>
                    
                    {smtpData.host.includes('gmail.com') && (
                      <div className="bg-amber-50 p-3 rounded-md text-sm border border-amber-200 mt-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-800 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-amber-800 font-medium">Gmail Setup Instructions</p>
                            <ul className="text-amber-700 list-disc pl-4 mt-1 space-y-1">
                              <li>Use your Gmail address as username</li>
                              <li>For password, use an App Password, not your regular Gmail password</li>
                              <li><a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">Create an App Password</a> in your Google Account</li>
                              <li>Use &quot;smtp.gmail.com&quot; as host and 587 as port</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Verification result display */}
                    {verificationStatus && (
                      <div className={`p-3 rounded-md text-sm border mt-2 ${
                        verificationStatus.success 
                          ? "bg-green-50 border-green-200 text-green-800" 
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}>
                        <div className="flex items-center gap-2">
                          {verificationStatus.success 
                            ? <CheckCircle size={16} className="text-green-700" /> 
                            : <XCircle size={16} className="text-red-700" />
                          }
                          <p>{verificationStatus.message}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        onClick={testSmtpConnection} 
                        variant="outline" 
                        disabled={verifying}
                        type="button"
                      >
                        {verifying ? "Testing..." : "Test Connection"}
                      </Button>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        onClick={saveSmtpSettings} 
                        disabled={saving || !verificationStatus?.success}
                      >
                        Save SMTP Settings
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {loadingRecruiters ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Loading recruiter data...</p>
                </div>
              </div>
            ) : recruiters.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Calendly Link</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recruiters.map((recruiter) => (
                      <TableRow key={recruiter.id}>
                        <TableCell>{recruiter.name}</TableCell>
                        <TableCell>{recruiter.role}</TableCell>
                        <TableCell>{recruiter.calendly_link}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => editRecruiter(recruiter)}
                            >
                              <Pencil size={16} />
                            </Button>
                            
                            {recruiterSmtpStatus[recruiter.id!] ? (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openSmtpDialog(recruiter.id!)}
                              >
                                <Mail size={16} />
                              </Button>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => openSmtpDialog(recruiter.id!)}
                                    >
                                      <AlertCircle size={16} className="text-amber-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>SMTP not setup</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteRecruiter(recruiter.id!)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <div className="mb-4">
                <EmptySVG1 />
                </div>
                <p className="text-lg font-medium mb-2">Add your first Recruiter</p>
                <Button 
                  className="mt-2"
                  onClick={() => setAddRecruiterOpen(true)}
                >
                  Create New
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
