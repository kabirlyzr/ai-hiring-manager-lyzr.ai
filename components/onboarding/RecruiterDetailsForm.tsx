'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRecruiterDetails, completeOnboarding, setCurrentStep } from '@/store/onboardingSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { RootState } from '@/store/store';

const RecruiterDetailsForm = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const recruiterDetails = useSelector((state: RootState) => state.onboarding.recruiterDetails);

  const [form, setForm] = useState({
    name: recruiterDetails.name,
    email: recruiterDetails.email,
    role: recruiterDetails.role
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Save to Redux state
      dispatch(setRecruiterDetails({
        name: form.name,
        email: form.email,
        role: form.role,
        phone: ''
      }));
      
      // Only make API call if some info was provided
      if (form.name || form.email || form.role) {
        // Send to API
        const response = await fetch('/api/recruiters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            email: form.email
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save recruiter details');
        }
      }
      
      // Mark onboarding as complete
      const completeResponse = await fetch('/api/company/onboarding-complete', {
        method: 'POST',
      });
      
      if (completeResponse.ok) {
        dispatch(completeOnboarding());
        toast({
          title: "Success",
          description: "Onboarding completed successfully",
        });
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    
    try {
      // Mark onboarding as complete in the database
      const response = await fetch('/api/company/onboarding-complete', {
        method: 'POST',
      });
      
      if (response.ok) {
        dispatch(completeOnboarding());
        toast({
          title: "Success",
          description: "Onboarding completed successfully",
        });
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    dispatch(setCurrentStep(0));
  };

  return (
    <div>
      <p className="text-sm mb-6 text-gray-500">Add your primary recruiter information (optional) to personalize communications</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-[200px_1fr] gap-x-4 gap-y-6">
          <div>
            <p className="font-medium">Name</p>
            <p className="text-sm text-muted-foreground">Full name of the recruiter or hiring manager</p>
          </div>
          <Input
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
          
          <div>
            <p className="font-medium">Email</p>
            <p className="text-sm text-muted-foreground">Professional email for candidate communications</p>
          </div>
          <Input
            placeholder="jane.smith@acmecorp.com"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
          
          <div>
            <p className="font-medium">Role</p>
            <p className="text-sm text-muted-foreground">Position title within your organization</p>
          </div>
          <Input
            placeholder="HR Manager"
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleBack}
            disabled={isSubmitting}
            className="border-gray-300"
          >
            Back
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSkip}
            disabled={isSubmitting}
            className="border-gray-300"
          >
            Skip
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? "Saving..." : "Complete"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RecruiterDetailsForm; 