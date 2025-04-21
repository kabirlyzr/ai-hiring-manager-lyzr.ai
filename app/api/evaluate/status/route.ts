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

  return NextResponse.json({
    status: job.status,
    result: job.results,
    error: job.error
  });
}