// import { uploadData, getUrl } from 'aws-amplify/storage';

/**
 * Uploads a file to AWS S3 via server-side API
 */
export const uploadFileToS3 = async (file: File, userId: string, jobId: string) => {
  try {
    // Create form data for server API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('jobId', jobId);
    
    // Call the server-side API
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Server error uploading file');
    }
    
    const data = await response.json();
    
    return {
      url: data.url,
      fileName: file.name,
      size: Math.round(file.size / 1024) + ' KB'
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};
