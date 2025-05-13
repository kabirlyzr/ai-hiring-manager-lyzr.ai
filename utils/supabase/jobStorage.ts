import { createServerSupabaseClient } from "./server";

const supabase = createServerSupabaseClient();

export interface BatchJob {
  id?: string;
  created_at?: string;
  project_name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results?: any[]; 
  status: "processing" | "completed" | "failed";
  error?: string;
  error_code? : number;
  updated_at?: string;
}

class JobStorage {
  async createJob(project_name: string): Promise<string | null> {
    console.log("Attempting to create job with project_name:", project_name);
    
    try {
      const { data, error } = await supabase
        .from("batch_jobs")
        .insert([
          {
            project_name,
            status: "processing",
            results: [], // Store empty array in JSONB
            updated_at: new Date().toISOString(),
          }
        ])
        .select("id")
        .single();

      if (error) {
        console.error("Error creating job:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return null;
      }
      
      if (!data) {
        console.error("No data returned from insert operation");
        return null;
      }
      
      console.log("Job created successfully with ID:", data.id);
      return data.id;
    } catch (e) {
      console.error("Exception in createJob:", e);
      return null;
    }
  }

  async getJob(id: string): Promise<BatchJob | null> {
    console.log("Fetching job with ID:", id);
    
    try {
      const { data, error } = await supabase
        .from("batch_jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching job:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return null;
      }
      
      if (!data) {
        console.error("No job found with ID:", id);
        return null;
      }
      
      return data;
    } catch (e) {
      console.error("Exception in getJob:", e);
      return null;
    }
  }

  async updateJob(id: string, updates: Partial<BatchJob>): Promise<boolean> {
    console.log("Updating job with ID:", id, "Updates:", updates);
    
    try {
      const { error } = await supabase
        .from("batch_jobs")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error updating job:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return false;
      }
      
      console.log("Job updated successfully");
      return true;
    } catch (e) {
      console.error("Exception in updateJob:", e);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async appendResult(id: string, newResult: any): Promise<boolean> {
    console.log("Appending results to job ID:", id);
    
    try {
      // Get the current results array
      const { data, error: fetchError } = await supabase
        .from("batch_jobs")
        .select("results")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        console.error("Error fetching existing results:", fetchError);
        console.error("Error details:", JSON.stringify(fetchError, null, 2));
        return false;
      }

      // Create a map of existing fileIds to detect duplicates
      const existingFileIds = new Set(data.results.map((result: { fileId: string }) => result.fileId));
      
      // Filter out any new results that already exist
      const uniqueNewResults = Array.isArray(newResult) 
        ? newResult.filter((result: { fileId: string }) => !existingFileIds.has(result.fileId))
        : newResult;
      
      const updatedResults = [...data.results, ...(Array.isArray(uniqueNewResults) ? uniqueNewResults : [uniqueNewResults])];
      console.log("Updating with new results, total count:", updatedResults.length);

      // Update the job with the new results array
      const { error } = await supabase
        .from("batch_jobs")
        .update({ results: updatedResults, status : 'completed', updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error updating results:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return false;
      }
      
      console.log("Results appended successfully");
      return true;
    } catch (e) {
      console.error("Exception in appendResult:", e);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async appendResultWithStatus(id: string, newResult: any, status: "processing" | "completed" | "failed"): Promise<boolean> {
    console.log(`Appending results to job ID: ${id} with status: ${status}`);
    
    try {
      // Get the current results array
      const { data, error: fetchError } = await supabase
        .from("batch_jobs")
        .select("results")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        console.error("Error fetching existing results:", fetchError);
        console.error("Error details:", JSON.stringify(fetchError, null, 2));
        return false;
      }

      // Create a map of existing fileIds to detect duplicates
      const existingFileIds = new Set(data.results.map((result: { fileId: string }) => result.fileId));
      
      // Filter out any new results that already exist
      const uniqueNewResults = Array.isArray(newResult) 
        ? newResult.filter((result: { fileId: string }) => !existingFileIds.has(result.fileId))
        : newResult;
      
      const updatedResults = [...data.results, ...(Array.isArray(uniqueNewResults) ? uniqueNewResults : [uniqueNewResults])];
      console.log("Updating with new results, total count:", updatedResults.length);

      // Update the job with the new results array and specified status
      const { error } = await supabase
        .from("batch_jobs")
        .update({ results: updatedResults, status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error updating results:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return false;
      }
      
      console.log("Results appended successfully with status:", status);
      return true;
    } catch (e) {
      console.error("Exception in appendResultWithStatus:", e);
      return false;
    }
  }

  async deleteJob(id: string): Promise<boolean> {
    console.log("Deleting job with ID:", id);
    
    try {
      const { error } = await supabase.from("batch_jobs").delete().eq("id", id);

      if (error) {
        console.error("Error deleting job:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return false;
      }
      
      console.log("Job deleted successfully");
      return true;
    } catch (e) {
      console.error("Exception in deleteJob:", e);
      return false;
    }
  }

  async cleanupOldJobs(): Promise<boolean> {
    console.log("Cleaning up old jobs");
    
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("batch_jobs")
        .delete()
        .lt("updated_at", oneHourAgo);

      if (error) {
        console.error("Error cleaning up jobs:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return false;
      }
      
      console.log("Old jobs cleaned up successfully");
      return true;
    } catch (e) {
      console.error("Exception in cleanupOldJobs:", e);
      return false;
    }
  }
}

export const jobStorage = new JobStorage();