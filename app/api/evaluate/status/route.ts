import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/utils/supabase/jobStorage';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  const job = await jobStorage.getJob(jobId);
  
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 422 }
    );
  }

  // Deduplicate results by fileId - keep only the last result for each fileId
  let dedupedResults = [];
  if (job.results && Array.isArray(job.results)) {
    const resultMap = new Map();
    
    // For each result, add it to the map keyed by fileId, so later entries override earlier ones
    job.results.forEach((result) => {
      if (result && result.fileId) {
        resultMap.set(result.fileId, result);
      }
    });
    
    // Convert map values back to array
    dedupedResults = Array.from(resultMap.values());
    
    console.log(`Deduplicated ${job.results.length} results to ${dedupedResults.length} unique results`);
  }

  return NextResponse.json({
    status: job.status,
    result: dedupedResults,
    error: job.error
  });
}