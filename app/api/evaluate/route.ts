/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractTextFromPDF } from '@/utils/pdfViewer';
import { callLyzrAgent } from '@/utils/LyzrApiCall';
import { jobStorage } from '@/utils/supabase/jobStorage';
import { EvaluationResult } from '@/types/types';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY!;
const EVALUATION_AGENT_ID = process.env.NEXT_PUBLIC_EVALUATION_AGENT_CHAT;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function processCandidate(
  file: File,
  fileId: string,
  jobDetails: any,
  criteria: any[],
  token: string,
  dbCandidateName: string = ""
) {
  try {
    // Ensure file has a name and type
    if (!file.name) {
      const tempName = `resume-${fileId.substring(0, 8)}.pdf`;
      console.log(`File missing name, assigning temporary name: ${tempName}`);
      Object.defineProperty(file, 'name', {
        writable: true,
        value: tempName
      });
    }
    
    if (!file.type) {
      Object.defineProperty(file, 'type', {
        writable: true,
        value: 'application/pdf'
      });
    }
    
    console.log(`Starting process for candidate with fileId: ${fileId}, filename: ${file.name}`);
    
    // Extract PDF text with better error handling
    let pdfText;
    let extractionFailed = false;
    try {
      pdfText = await extractTextFromPDF(file);
      console.log(`PDF Text extraction for ${fileId} completed, text length: ${pdfText.length}`);
      
      // Check if extraction failed - now using a different marker
      extractionFailed = pdfText.includes('[PDF EXTRACTION FAILED]');
      if (extractionFailed) {
        console.log(`PDF extraction issues for ${fileId}, proceeding with limited text: ${pdfText.substring(0, 150)}...`);
      } else {
        // Log a preview of the extracted text
        const textPreview = pdfText.substring(0, 150).replace(/\n/g, ' ');
        console.log(`PDF extraction successful for ${fileId}, text length: ${pdfText.length}`);
        console.log(`Text preview: ${textPreview}...`);
      }
    } catch (error: any) {
      // Critical extraction error not caught by extractTextFromPDF - now should be caught
      console.error(`Critical error extracting PDF for ${fileId}:`, error);
      extractionFailed = true;
      pdfText = `[PDF EXTRACTION FAILED]

The system was unable to extract text content from this PDF file.
Error: ${error.message || "Unknown error"}

Filename: ${file.name}
  
This resume could not be properly processed due to technical issues with the file.`;
    }
    
    // Determine candidate name with priority order:
    // 1. Database name (if available)
    // 2. Name from filename (if extraction failed)
    // 3. Empty string as fallback
    let candidateName = dbCandidateName || "";
    
    // If no DB name and extraction failed, try to get from filename
    if (!candidateName && extractionFailed && file.name) {
      candidateName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').replace(/-/g, ' ').trim();
      console.log(`Using filename for candidate name: ${candidateName}`);
    }

    // If we still don't have a candidate name and fileId exists, use that
    if (!candidateName && fileId) {
      candidateName = `Candidate-${fileId.substring(0, 8)}`;
      console.log(`Using fileId for candidate name: ${candidateName}`);
    }

    // Create a more detailed prompt for the evaluation
    let initialPrompt;
    
    if (extractionFailed) {
      initialPrompt = `
        ## Failed PDF Extraction - Limited Evaluation
        
        The system was unable to extract text from the candidate's resume due to technical issues with the file.
        
        Candidate Name: ${candidateName || "Unknown"}
        Resume Filename: ${file.name}
        
        Error Message: ${pdfText.split('\n')[2] || "PDF Extraction Failed"}
        
        Job Description: ${jobDetails.description}
        
        Evaluation Criteria: ${criteria.map((c: any) => 
          `${c.name}: ${c.description} (Weight: ${c.weight})`).join(', ')}
        
        Instructions:
        1. The candidate's resume could not be properly extracted due to technical issues.
        2. Since there is insufficient information for a proper evaluation, please assign appropriate scores with explanations.
        3. Clearly indicate in your assessment that this evaluation is based on limited information due to file processing issues.
        4. If the job is technical in nature, note that technical difficulties with file formats might not reflect on the candidate's abilities.
        
        Please provide an honest evaluation based on the minimal information available.
      `;
    } else {
      initialPrompt = `
        ## Candidate Evaluation
        
        Resume: ${pdfText}
        ${candidateName ? `Candidate Name: ${candidateName}` : ''}
        Job Description: ${jobDetails.description}
        
        Evaluation Criteria: ${criteria.map((c: any) => 
          `${c.name}: ${c.description} (Weight: ${c.weight})`).join(', ')}
        
        Instructions:
        1. Please provide a detailed evaluation of this candidate for the job described.
        2. Assess how well the candidate's qualifications match the job requirements.
        3. For each criterion, assign a score (0-10) and explain your reasoning.
        4. Provide an overall assessment with final score and hiring recommendation.
        
        Please provide your response in a way that can be easily converted to JSON format.
      `;
    }

    // First Lyzr agent call for evaluation
    console.log(`Making Lyzr agent call for evaluation of candidate ${fileId}...`);
    const evaluationResponse = await callLyzrAgent(
      initialPrompt,
      token,
      EVALUATION_AGENT_ID!
    );

    console.log(`Received evaluation response for ${fileId}, response length: ${evaluationResponse.response.length}`);
    
    const jsonPrompt = `
      Convert this evaluation to JSON format:
      ${evaluationResponse.response}
      
      Required format:
      {
        "name": string,
        "email": string,
        "Final score": number,
        "status": string,
        "reason": string,
        "meeting_scheduled": string,
        "criteria": [
          {
            "criteria": string,
            "score": number,
            "reason": string
          }
        ]
      }
      
      ${extractionFailed ? 
        `For this failed PDF extraction:
        1. Include "PDF Extraction Failed" in the reason field
        2. Set status to "rejected" 
        3. Set the name to: "${candidateName}"
        4. The score should be 0 as we couldn't properly evaluate the resume
        5. Criteria reasons should explain that each area couldn't be evaluated due to technical issues with the file` : 
        ""}
        
      Make sure the name field contains the actual candidate name: ${candidateName || "Unknown"}
      
      Ensure all fields are present and properly formatted.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Convert the evaluation to the specified JSON format." },
        { role: "user", content: jsonPrompt }
      ],
      response_format: { type: "json_object" }
    });

    let evaluationResult;
    try {
      evaluationResult = JSON.parse(completion.choices[0].message.content!) as EvaluationResult;
      
      // Always use the correct name with our priority order
      // 1. Database name
      // 2. Name we determined earlier
      // 3. Name from the AI response if it looks reasonable
      if (dbCandidateName) {
        evaluationResult.name = dbCandidateName;
      } else if (candidateName) {
        evaluationResult.name = candidateName;
      } else if (!evaluationResult.name || evaluationResult.name === "Unknown Candidate" || evaluationResult.name === "Unknown") {
        evaluationResult.name = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').trim() || "Unknown Candidate";
      }
      
    } catch (jsonError) {
      console.error(`Error parsing JSON for ${fileId}:`, jsonError);
      // Create a fallback result if JSON parsing fails
      const fileName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').trim();
      evaluationResult = {
        name: dbCandidateName || candidateName || fileName || "Unknown Candidate",
        email: "unknown@example.com",
        "Final score": 0,
        status: "rejected",
        reason: `Could not properly evaluate this resume due to ${extractionFailed ? 'PDF extraction issues' : 'AI processing error'}.`,
        meeting_scheduled: "no",
        criteria: criteria.map(c => ({
          criteria: c.name,
          score: 0,
          reason: extractionFailed ? 
            "Could not evaluate due to PDF parsing issues" : 
            "Could not evaluate due to processing error"
        }))
      };
    }
    
    console.log(`Final evaluation result for ${fileId}:`, evaluationResult.name);
    return {
      ...evaluationResult,
      fileId
    };
  } catch (error: any) {
    console.error(`Error processing candidate with fileId ${fileId}:`, error);
    // Create a minimal result for the failed candidate
    const fileName = file.name ? file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').trim() : "Unknown";
    return {
      fileId,
      name: dbCandidateName || fileName || "Unknown Candidate",
      email: "unknown@example.com",
      "Final score": 0,
      status: "rejected",
      reason: `Failed to process: ${error.message || "Unknown error"}`,
      meeting_scheduled: "no",
      criteria: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting POST request processing...');
    
    const formData = await request.formData();
    const jobDetailsStr = formData.get('jobDetails') as string;
    const criteriaStr = formData.get('criteria') as string;
    const candidateFiles = formData.getAll('pdfs') as File[];
    const fileIds = formData.getAll('fileIds') as string[];
    const candidateNames = formData.getAll('candidateNames') as string[];
    
    const token = request.cookies.get('token')?.value;
    
    if (!token || !EVALUATION_AGENT_ID) {
      console.error('API token from cookies or Evaluation Agent ID is not configured');
      return NextResponse.json(
        { error: 'API token or Evaluation Agent ID is not configured' },
        { status: 500 }
      );
    }

    console.log('Received files count:', candidateFiles.length);
    console.log('File IDs:', fileIds);
    console.log('Candidate Names:', candidateNames);

    if (!candidateFiles.length || !jobDetailsStr || !criteriaStr) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const jobDetails = JSON.parse(jobDetailsStr);
    const criteria = JSON.parse(criteriaStr);
    
    // Create job in Supabase
    const jobId = await jobStorage.createJob("Candidate Evaluation");
    
    if (!jobId) {
      return NextResponse.json({ error: 'Failed to create job in database' }, { status: 500 });
    }
    
    console.log('Generated jobId:', jobId);

    // Ensure all files have names and types
    candidateFiles.forEach((file, index) => {
      if (!file.name) {
        const tempName = candidateNames[index] 
          ? `${candidateNames[index].replace(/\s+/g, '-')}.pdf`
          : `resume-${fileIds[index].substring(0, 8)}.pdf`;
          
        console.log(`File missing name, assigning: ${tempName}`);
        Object.defineProperty(file, 'name', {
          writable: true,
          value: tempName
        });
      }
      
      if (!file.type) {
        console.log(`File missing type, setting to PDF for file: ${file.name}`);
        Object.defineProperty(file, 'type', {
          writable: true,
          value: 'application/pdf'
        });
      }
    });

    // Process files
    (async () => {
      try {
        console.log(`Starting sequential PDF extraction for ${candidateFiles.length} files`);
        
        // Prepare storage for extracted data and results
        const candidateData = [];
        const allResults = [];
        const allErrors = [];
        
        // Process files one-by-one with more careful handling
        for (let i = 0; i < candidateFiles.length; i++) {
          const file = candidateFiles[i];
          const fileId = fileIds[i];
          const candidateName = candidateNames[i] || "";
          
          console.log(`------------------------------------------`);
          console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Processing file: ${fileId}`);
          
          try {
            // Ensure the file has a name (critical for extraction)
            if (!file.name) {
              console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] File missing name, assigning one`);
              const tempName = candidateName 
                ? `${candidateName.replace(/\s+/g, '-')}.pdf`
                : `resume-${fileId.substring(0, 8)}.pdf`;
                
              Object.defineProperty(file, 'name', {
                writable: true,
                value: tempName
              });
            }
            
            // Ensure the file has a type
            if (!file.type) {
              console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] File missing type, setting to PDF`);
              Object.defineProperty(file, 'type', {
                writable: true,
                value: 'application/pdf'
              });
            }
            
            console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Starting PDF extraction for: ${file.name}, size: ${file.size} bytes`);
            
            // Extract text with multiple retries
            let pdfText = "";
            let extractionFailed = false;
            let retryCount = 0;
            const MAX_RETRIES = 2;
            
            while (retryCount <= MAX_RETRIES) {
              try {
                pdfText = await extractTextFromPDF(file);
                console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] PDF Text extraction attempt #${retryCount+1} completed`);
                
                // Check if extraction failed but we got a fallback message
                if (pdfText.includes('[PDF EXTRACTION FAILED]')) {
                  console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] PDF extraction returned failure message (${pdfText.length} chars)`);
                  extractionFailed = true;
                  
                  // No retry needed since we're getting a clear failure message
                  break;
                } else {
                  // Successful extraction
                  extractionFailed = false;
                  const textPreview = pdfText.substring(0, 150).replace(/\n/g, ' ');
                  console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Successful extraction: ${pdfText.length} chars`);
                  console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Text preview: ${textPreview}...`);
                  break;
                }
              } catch (error: any) {
                console.error(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Error in extraction attempt #${retryCount+1}:`, error);
                extractionFailed = true;
                
                if (retryCount === MAX_RETRIES) {
                  console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] All extraction attempts failed`);
                  pdfText = `[PDF Extraction Failed] Could not extract text from resume. Error: ${error.message || "Unknown error"}`;
                  break;
                }
                
                retryCount++;
                console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Retrying extraction (attempt ${retryCount+1}/${MAX_RETRIES+1})...`);
                // Short delay before retry
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
            
            // Determine final candidate name with clear priority
            let finalCandidateName = candidateName || "";
            
            if (!finalCandidateName) {
              // First try to extract from filename if present
              if (file.name) {
                finalCandidateName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').replace(/-/g, ' ').trim();
                console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Using filename for candidate name: ${finalCandidateName}`);
              }
              
              // If still no name, use fileId
              if (!finalCandidateName) {
                finalCandidateName = `Candidate-${fileId.substring(0, 8)}`;
                console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Using fileId for candidate name: ${finalCandidateName}`);
              }
            }
            
            // Store all processed data for evaluation
            candidateData.push({
              fileId,
              fileName: file.name,
              candidateName: finalCandidateName,
              pdfText,
              extractionFailed,
              file
            });
            
            console.log(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Successfully processed candidate: ${finalCandidateName}`);
            
          } catch (processingError: any) {
            console.error(`[PDF PROCESS][${i+1}/${candidateFiles.length}] Failed to process file:`, processingError);
            
            // Still add to candidateData with error info so we can evaluate with limited data
            candidateData.push({
              fileId,
              fileName: file.name || `unknown-${fileId.substring(0, 8)}.pdf`,
              candidateName: candidateName || `Candidate-${fileId.substring(0, 8)}`,
              pdfText: `[PDF EXTRACTION FAILED]

The system was unable to extract text content from this PDF file.
Error: ${processingError.message || "Unknown error"}

Filename: ${file.name || `unknown-${fileId.substring(0, 8)}.pdf`}
${candidateName ? `Possible Candidate Name: ${candidateName}` : ''}
  
This resume could not be properly processed due to technical issues with the file.`,
              extractionFailed: true,
              file
            });
            
            allErrors.push({
              fileId,
              error: processingError.message || "Unknown error during PDF processing"
            });
          }
          
          // Small delay between files to avoid resource contention
          if (i < candidateFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        console.log(`------------------------------------------`);
        console.log(`[EVALUATION] PDF extraction completed for all ${candidateData.length} files. Starting parallel evaluation with Lyzr API...`);
        
        // Now process all candidates in parallel with Lyzr API
        const evaluationPromises = candidateData.map(async (candidate, index) => {
          const { fileId, fileName, candidateName, pdfText, extractionFailed } = candidate;
          
          try {
            console.log(`[EVALUATION][${index+1}/${candidateData.length}] Starting evaluation for: ${candidateName}, fileId: ${fileId}`);
            
            // Create evaluation prompt based on extraction success/failure
            let initialPrompt;
            
            if (extractionFailed) {
              initialPrompt = `
                ## Failed PDF Extraction - Limited Evaluation
                
                The system was unable to extract text from the candidate's resume due to technical issues with the file.
                
                Candidate Name: ${candidateName || "Unknown"}
                Resume Filename: ${fileName}
                
                Error Message: ${pdfText.split('\n')[2] || "PDF Extraction Failed"}
                
                Job Description: ${jobDetails.description}
                
                Evaluation Criteria: ${criteria.map((c: any) => 
                  `${c.name}: ${c.description} (Weight: ${c.weight})`).join(', ')}
                
                Instructions:
                1. The candidate's resume could not be properly extracted due to technical issues.
                2. Since there is insufficient information for a proper evaluation, please assign appropriate scores with explanations.
                3. Clearly indicate in your assessment that this evaluation is based on limited information due to file processing issues.
                4. If the job is technical in nature, note that technical difficulties with file formats might not reflect on the candidate's abilities.
                
                Please provide an honest evaluation based on the minimal information available.
              `;
            } else {
              initialPrompt = `
                ## Candidate Evaluation
                
                Resume: ${pdfText}
                ${candidateName ? `Candidate Name: ${candidateName}` : ''}
                Job Description: ${jobDetails.description}
                
                Evaluation Criteria: ${criteria.map((c: any) => 
                  `${c.name}: ${c.description} (Weight: ${c.weight})`).join(', ')}
                
                Instructions:
                1. Please provide a detailed evaluation of this candidate for the job described.
                2. Assess how well the candidate's qualifications match the job requirements.
                3. For each criterion, assign a score (0-10) and explain your reasoning.
                4. Provide an overall assessment with final score and hiring recommendation.
                
                Please provide your response in a way that can be easily converted to JSON format.
              `;
            }

            console.log(`[EVALUATION][${index+1}/${candidateData.length}] Calling Lyzr API for: ${candidateName}`);
            
            // Call Lyzr API for evaluation
            const evaluationResponse = await callLyzrAgent(
              initialPrompt,
              token,
              EVALUATION_AGENT_ID!
            );

            console.log(`[EVALUATION][${index+1}/${candidateData.length}] Received Lyzr response: ${evaluationResponse.response.length} chars`);
            
            // Convert to JSON format using OpenAI
            const jsonPrompt = `
              Convert this evaluation to JSON format:
              ${evaluationResponse.response}
              
              Required format:
              {
                "name": string,
                "email": string,
                "Final score": number,
                "status": string,
                "reason": string,
                "meeting_scheduled": string,
                "criteria": [
                  {
                    "criteria": string,
                    "score": number,
                    "reason": string
                  }
                ]
              }
              
              ${extractionFailed ? 
                `For this failed PDF extraction:
                1. Include "PDF Extraction Failed" in the reason field
                2. Set status to "rejected" 
                3. Set the name to: "${candidateName}"
                4. The score should be 0 as we couldn't properly evaluate the resume
                5. Criteria reasons should explain that each area couldn't be evaluated due to technical issues with the file` : 
                ""}
                
              Make sure the name field contains the actual candidate name: ${candidateName || "Unknown"}
              
              Ensure all fields are present and properly formatted.
            `;

            console.log(`[EVALUATION][${index+1}/${candidateData.length}] Converting to JSON with OpenAI for: ${candidateName}`);
            
            const completion = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: "Convert the evaluation to the specified JSON format." },
                { role: "user", content: jsonPrompt }
              ],
              response_format: { type: "json_object" }
            });

            let evaluationResult;
            try {
              evaluationResult = JSON.parse(completion.choices[0].message.content!) as EvaluationResult;
              
              // Always ensure the name is correct based on our earlier processing
              evaluationResult.name = candidateName || evaluationResult.name || "Unknown Candidate";
              
              console.log(`[EVALUATION][${index+1}/${candidateData.length}] JSON conversion successful for: ${candidateName}, score: ${evaluationResult["Final score"] || 0}`);
              
            } catch (jsonError) {
              console.error(`[EVALUATION][${index+1}/${candidateData.length}] Error parsing JSON:`, jsonError);
              
              // Create a fallback result if JSON parsing fails
              evaluationResult = {
                name: candidateName || "Unknown Candidate",
                email: "unknown@example.com",
                "Final score": 0,
                status: "rejected",
                reason: `Could not properly evaluate this resume due to ${extractionFailed ? 'PDF extraction issues' : 'AI processing error'}.`,
                meeting_scheduled: "no",
                criteria: criteria.map((c: { name: any; }) => ({
                  criteria: c.name,
                  score: 0,
                  reason: extractionFailed ? 
                    "Could not evaluate due to PDF parsing issues" : 
                    "Could not evaluate due to processing error"
                }))
              };
              
              console.log(`[EVALUATION][${index+1}/${candidateData.length}] Created fallback evaluation result for: ${candidateName}`);
            }
            
            console.log(`[EVALUATION][${index+1}/${candidateData.length}] Evaluation complete for: ${candidateName}`);
            
            return {
              ...evaluationResult,
              fileId
            };
          } catch (error: any) {
            console.error(`[EVALUATION][${index+1}/${candidateData.length}] Error evaluating candidate:`, error);
            
            // Create a minimal result for the failed candidate
            return {
              fileId,
              name: candidateName || "Unknown Candidate",
              email: "unknown@example.com",
              "Final score": 0,
              status: "rejected",
              reason: `Failed to process: ${error.message || "Unknown error"}`,
              meeting_scheduled: "no",
              criteria: [],
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        });
        
        // Wait for all evaluations to complete
        console.log(`[SAVING] Waiting for all ${evaluationPromises.length} parallel evaluations to complete...`);
        allResults.push(...await Promise.all(evaluationPromises));
        
        // Save results to database
        if (allResults.length > 0) {
          // First save with processing status
          console.log(`[SAVING] Saving ${allResults.length} results with processing status`);
          await jobStorage.appendResultWithStatus(jobId, allResults, "processing");
          
          // Then final save with completed status
          console.log(`[SAVING] Updating ${allResults.length} results with completed status`);
          await jobStorage.appendResult(jobId, allResults);
          console.log(`[SAVING] All ${allResults.length} results saved successfully`);
        }
        
        // Save any errors
        if (allErrors.length > 0) {
          console.log(`[SAVING] Updating job with ${allErrors.length} errors`);
          await jobStorage.updateJob(jobId, {
            error: JSON.stringify(allErrors)
          });
        }
        
        console.log(`[COMPLETE] Evaluation process completed for all ${candidateFiles.length} files`);
        
      } catch (error) {
        console.error('[ERROR] Error in evaluation process:', error);
        await jobStorage.updateJob(jobId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          error_code: 500
        });
      }
    })();

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  console.log('GET request received for jobId:', jobId);

  if (!jobId) {
    console.error('Job ID is missing in GET request');
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  const job = await jobStorage.getJob(jobId);
  
  if (!job) {
    console.error('Job not found for jobId:', jobId);
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  console.log('Returning job data for jobId:', jobId);
  return NextResponse.json(job);
}