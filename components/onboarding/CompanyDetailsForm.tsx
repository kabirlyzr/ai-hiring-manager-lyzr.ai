'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCompanyDetails, setCurrentStep } from '@/store/onboardingSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { RootState } from '@/store/store';

const CompanyDetailsForm = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const companyDetails = useSelector((state: RootState) => state.onboarding.companyDetails);

  const [form, setForm] = useState({
    name: companyDetails.name,
    website: companyDetails.website,
    description: companyDetails.description
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
    
    if (!form.name || !form.website || !form.description) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save to Redux state
      dispatch(setCompanyDetails({
        name: form.name,
        website: form.website,
        description: form.description,
        industry: '',
        size: ''
      }));
      
      // Send to API
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: form.name,
          website: form.website,
          description: form.description
        }),
      });
      
      if (response.ok) {
        dispatch(setCurrentStep(1));
        toast({
          title: "Success",
          description: "Company information saved successfully",
        });
      } else {
        throw new Error('Failed to save company details');
      }
    } catch (error) {
      console.error('Error saving company details:', error);
      toast({
        title: "Error",
        description: "Failed to save company information",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-sm mb-6 text-gray-500">Please provide your company details to customize your hiring experience</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-[200px_1fr] gap-x-4 gap-y-6">
          <div>
            <p className="font-medium">Name of the company</p>
            <p className="text-sm text-muted-foreground">This will appear on all job listings and communications</p>
          </div>
          <Input
            placeholder="Acme Corporation"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
          
          <div>
            <p className="font-medium">Website</p>
            <p className="text-sm text-muted-foreground">Your company&apos;s official website URL</p>
          </div>
          <Input
            placeholder="Example: https://www.acmecorp.com"
            value={form.website}
            onChange={(e) => handleChange('website', e.target.value)}
            required
            className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
          
          <div>
            <p className="font-medium">About the Company</p>
            <p className="text-sm text-muted-foreground">Brief description of your company, culture and values</p>
          </div>
          <Textarea
            placeholder="Acme Corporation is a leading provider of innovative solutions with a mission to transform how businesses operate. Founded in 2010, we have a team of dedicated professionals committed to excellence."
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
            rows={5}
            className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompanyDetailsForm; 