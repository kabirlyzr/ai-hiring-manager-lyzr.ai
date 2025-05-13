/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const supabase = createServerSupabaseClient();

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed: Missing credentials',
      }, { status: 401 });
    }
    
    const { job_id } = await request.json();
    
    if (!job_id) {
      return NextResponse.json({
        success: false,
        message: 'Job ID is required',
      }, { status: 400 });
    }
    
    // 1. Get all evaluations for this job
    const { data: evaluations, error: fetchError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('job_id', job_id)
      .order('updated_at', { ascending: false });
      
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`Found ${evaluations?.length || 0} evaluations for job ${job_id}`);
    
    // Group evaluations by candidate_id
    const candidateGroups = new Map();
    evaluations?.forEach(evaluation => {
      if (!candidateGroups.has(evaluation.candidate_id)) {
        candidateGroups.set(evaluation.candidate_id, []);
      }
      candidateGroups.get(evaluation.candidate_id).push(evaluation);
    });
    
    // For each candidate with multiple evaluations, keep only the latest one
    let deleteCount = 0;
    for (const [candidateId, evals] of candidateGroups.entries()) {
      if (evals.length > 1) {
        // Keep the first one (newest by our order), delete the rest
        const toDelete = evals.slice(1).map((e: { id: any; }) => e.id);
        
        if (toDelete.length > 0) {
          console.log(`Deleting ${toDelete.length} duplicate evaluations for candidate ${candidateId}`);
          
          const { error: deleteError } = await supabase
            .from('evaluations')
            .delete()
            .in('id', toDelete);
            
          if (deleteError) {
            console.error(`Error deleting evaluations: ${deleteError.message}`);
          } else {
            deleteCount += toDelete.length;
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteCount} duplicate evaluations`,
      cleaned: deleteCount
    });
    
  } catch (error) {
    console.error('Error cleaning evaluations:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to clean evaluations',
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 