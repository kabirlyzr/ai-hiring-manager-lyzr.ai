/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractTextFromPDF } from '@/utils/pdfViewer';
import { callLyzrAgent } from '@/utils/LyzrApiCall';
import { jobStorage } from '@/utils/supabase/jobStorage';
// import { v4 as uuidv4 } from 'uuid';
import { EvaluationResult } from '@/types/types';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY!;
const EVALUATION_AGENT_ID = process.env.NEXT_PUBLIC_EVALUATION_AGENT_CHAT;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function processCandidate(
  file: File,
  fileId: string,
  jobDetails: any,
  criteria: any[],
  token: string
) {
  try {
    console.log(`Starting process for candidate with fileId: ${fileId}`);
    
    const pdfText = await extractTextFromPDF(file);
    console.log('PDF Text extracted successfully');

    const initialPrompt = `
      Resume: ${pdfText}
      Job Description: ${jobDetails.description}
      Evaluation Criteria: ${criteria.map((c: any) => 
        `${c.name}: ${c.description} (Weight: ${c.weight})`).join(', ')}
      Note: Please provide response in JSON format
    `;

    // First Lyzr agent call for evaluation
    console.log('Making first Lyzr agent call for evaluation...');
    const evaluationResponse = await callLyzrAgent(
      initialPrompt,
      token,
      EVALUATION_AGENT_ID!
    );


    
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
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Convert the evaluation to the specified JSON format." },
        { role: "user", content: jsonPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const evaluationResult = JSON.parse(completion.choices[0].message.content!) as EvaluationResult;
    console.log('Final evaluation result:', evaluationResult);
    return {
      ...evaluationResult,
      fileId
    };
  } catch (error) {
    console.error(`Error processing candidate with fileId ${fileId}:`, error);
    return {
      fileId,
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

    if (!candidateFiles.length || !jobDetailsStr || !criteriaStr) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const jobDetails = JSON.parse(jobDetailsStr);
    const criteria = JSON.parse(criteriaStr);
    
    // Create job in Supabase
    // const project_name = jobDetails.title || "Candidate Evaluation";
    const jobId = await jobStorage.createJob("Candidate Evaluation");
    
    if (!jobId) {
      return NextResponse.json({ error: 'Failed to create job in database' }, { status: 500 });
    }
    
    console.log('Generated jobId:', jobId);

    (async () => {
      try {
        console.log('Starting batch processing of candidates...');
        const results = await Promise.all(
          candidateFiles.map((file, index) => 
            processCandidate(file, fileIds[index], jobDetails, criteria, token)
          )
        );
        console.log('Batch processing completed');

        const successfulResults = results.filter((r): r is EvaluationResult => 
          'name' in r && 'Final score' in r
        );
        console.log('Successful results count:', successfulResults.length);

        const errors = results
          .filter((r): r is { fileId: string; error: string } => 'error' in r)
          .map(({ fileId, error }) => ({ fileId, error }));
        console.log('Errors count:', errors.length);

        // Update job in Supabase with results
        await jobStorage.appendResult(jobId, successfulResults);
        
        if (errors.length > 0) {
          await jobStorage.updateJob(jobId, {
            error: JSON.stringify(errors)
          });
        }
        
      } catch (error) {
        console.error('Error in batch processing:', error);
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