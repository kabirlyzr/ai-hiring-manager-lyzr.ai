/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from 'js-cookie';

/**
 * Extract text from PDF using Lyzr OCR API or mock data for testing
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Ensure file has a name
    let processedFile = file;
    if (!file.name || file.name === 'undefined') {
      const fileContent = await file.arrayBuffer();
      const blob = new Blob([fileContent], { type: file.type || 'application/pdf' });
      processedFile = new File([blob], `resume-${Date.now().toString(36)}.pdf`, { 
        type: file.type || 'application/pdf',
        lastModified: file.lastModified || Date.now()
      });
    }
    
    // Create form data for API request
    const formData = new FormData();
    formData.append('file', processedFile);
    
    // Get API key from cookies
    const apiKey = Cookies.get('token') || '';

    // Make API request
    const url = `https://lyzr-ocr.lyzr.app/extract?api_key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success' && data.data) {
      // Combine content from all pages
      let combinedText = '';
      Object.values(data.data).forEach((page: any) => {
        if (page.content) {
          combinedText += page.content + '\n';
        }
      });
      
      return combinedText.trim();
    } else {
      throw new Error('API returned invalid data format');
    }
  } catch (error) {
    console.error('PDF extraction failed:', error);
    return '';
  }
}