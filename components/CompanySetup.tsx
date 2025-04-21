/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from 'react-redux';
import { updateCompanySetupData } from '../store/companySetupSlice';
import { RootState } from "@/store/store";

export default function CompanySetup() {
  const router = useRouter();
  const { toast } = useToast();
  const dispatch = useDispatch();
  
  // Add logging for initial store data fetch
  const companyData = useSelector((state: RootState) => {
   
    return state.companySetup;
  });

  // Initialize formData with values from the store
  const [formData, setFormData] = useState({
    companyName: companyData.companyName,
    website: companyData.website,
    about: companyData.about,
  });

  // Update formData when companyData changes
  useEffect(() => {
    if (companyData) {
    
      setFormData({
        companyName: companyData.companyName,
        website: companyData.website,
        about: companyData.about,
      });
    }
  }, [companyData]);



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
   
    try {
      dispatch(updateCompanySetupData(formData));
      toast({
        title: "Success",
        description: "Company information saved successfully",
      });
      
      
      router.push("/create-job");
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "Failed to save company information",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
  
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('New formData:', newData);
      return newData;
    });
  };

  return (
    <div className="container max-w-2xl py-6 animate-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium">
              Company Name
            </label>
            <Input
              id="companyName"
              placeholder="Enter company name"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-medium">
              Company Website
            </label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="about" className="text-sm font-medium">
              About the Company
            </label>
            <Textarea
              id="about"
              placeholder="Enter a brief description of your company"
              value={formData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="submit" size="lg">
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
}