/* eslint-disable @typescript-eslint/no-explicit-any */
import pdf from 'pdf-parse';

/**
 * Extract text from PDF with improved error handling and clear decision  making for corrupted files
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // Ensure file has basic properties set with proper defaults
  if (!file.name) {
    console.log(`[PDF-EXTRACT] Warning: File has no name, setting a default name`);
    Object.defineProperty(file, 'name', {
      writable: true,
      value: `unknown-${Date.now().toString(36)}.pdf`
    });
  }

  if (!file.type) {
    console.log(`[PDF-EXTRACT] Warning: File has no type, setting to application/pdf`);
    Object.defineProperty(file, 'type', {
      writable: true,
      value: 'application/pdf'
    });
  }
  
  // Store errors for better reporting
  let errorMessage = '';
  
  // Get the filename for logging
  const filename = file.name;
  
  console.log(`[PDF-EXTRACT] Starting extraction for: ${filename}, size: ${file.size} bytes`);
  
  // Check for obviously corrupted or tiny PDFs
  if (file.size < 500) {
    console.log(`[PDF-EXTRACT] File too small (${file.size} bytes), likely corrupted or empty`);
    return createFailedExtractionMessage(filename, "File too small to be a valid PDF");
  }
  
  try {
    // Load the file buffer
    const buffer = await file.arrayBuffer();
    console.log(`[PDF-EXTRACT] Buffer loaded for ${filename}, size: ${buffer.byteLength} bytes`);
    
    // Quick check for PDF signature - should start with %PDF
    const signature = new Uint8Array(buffer.slice(0, 5));
    const signatureText = String.fromCharCode.apply(null, Array.from(signature));
    
    if (signatureText !== '%PDF-') {
      console.log(`[PDF-EXTRACT] Invalid PDF signature: ${signatureText}, file is not a valid PDF`);
      return createFailedExtractionMessage(filename, "Invalid PDF signature");
    }
    
    try {
      // Attempt PDF extraction with timeout
      const extractionPromise = pdf(Buffer.from(buffer));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("PDF extraction timed out")), 5000)
      );
      
      // Race between extraction and timeout
      const data = await Promise.race([extractionPromise, timeoutPromise]) as any;
      
      // Check if we got valid text
      if (data && data.text && data.text.trim().length > 0) {
        const textPreview = data.text.substring(0, 100).replace(/\n/g, ' ');
        console.log(`[PDF-EXTRACT] SUCCESS: ${filename} (${data.text.length} chars). Preview: ${textPreview}...`);
        return data.text;
      } else {
        console.log(`[PDF-EXTRACT] PDF extraction returned empty text for ${filename}`);
        return createFailedExtractionMessage(filename, "Extraction returned empty text");
      }
    } catch (parseError: any) {
      // Log detailed error information
      errorMessage = parseError.message || "PDF parsing failed";
      console.error(`[PDF-EXTRACT] Error parsing PDF ${filename}: ${errorMessage}`);
      
      // Create a consistent failure message
      return createFailedExtractionMessage(filename, errorMessage);
    }
  } catch (error: any) {
    // Capture file reading errors
    errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PDF-EXTRACT] Error reading file ${filename}: ${errorMessage}`);
    
    // Create a consistent failure message
    return createFailedExtractionMessage(filename, errorMessage);
  }
}

/**
 * Creates a consistent message for failed PDF extractions
 */
function createFailedExtractionMessage(filename: string, errorMessage: string): string {
  const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const candidateName = filenameWithoutExt
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .trim();
  
  console.log(`[PDF-EXTRACT] Creating failed extraction message for ${filename} with error: ${errorMessage}`);
  
  return `[PDF EXTRACTION FAILED]

The system was unable to extract text content from this PDF file.
Error: ${errorMessage}

Filename: ${filename}
${candidateName && candidateName !== 'unknown' ? `Possible Candidate Name: ${candidateName}` : ''}

This resume could not be properly processed due to technical issues with the file.
Please try uploading a different PDF file format or contact support for assistance.
`;
}