import { createServerSupabaseClient } from './server';

export const uploadResumeToStorage = async (file: File, userId: string, jobId: string) => {
  const supabase = createServerSupabaseClient();
  
  // Create a unique filename to avoid collisions
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${jobId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw error;
  }
  
  // Get the public URL for the file
  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName);
  
  return {
    path: data.path,
    publicUrl
  };
};
