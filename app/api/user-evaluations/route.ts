import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const supabase = createServerSupabaseClient();

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed: Missing credentials',
      }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const jobId = url.searchParams.get('job_id');
    
    // First, get all candidates for this user
    const { data: userCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('id')
      .eq('user_id', userId);
      
    if (candidatesError) {
      throw candidatesError;
    }
    
    if (!userCandidates || userCandidates.length === 0) {
      // No candidates found for this user
      return NextResponse.json({
        success: true,
        evaluations: []
      }, { status: 200 });
    }
    
    // Extract candidate IDs
    const candidateIds = userCandidates.map(c => c.id);
    
    // Query evaluations for these candidates
    let query = supabase
      .from('evaluations')
      .select('*, candidates(*)')
      .in('candidate_id', candidateIds);
      
    // Add job filter if provided
    if (jobId && jobId !== 'all') {
      query = query.eq('job_id', jobId);
    }
    
    const { data, error } = await query;
      
    if (error) {
      throw error;
    }
    
    // Deduplicate evaluations (keep only the latest for each candidate)
    const evaluationMap = new Map();
    
    (data || []).forEach(evaluation => {
      const existingEval = evaluationMap.get(evaluation.candidate_id);
      
      if (!existingEval || 
          (evaluation.updated_at && existingEval.updated_at && 
           new Date(evaluation.updated_at) > new Date(existingEval.updated_at))) {
        evaluationMap.set(evaluation.candidate_id, evaluation);
      }
    });
    
    const dedupedEvaluations = Array.from(evaluationMap.values());
    
    return NextResponse.json({
      success: true,
      evaluations: dedupedEvaluations
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching user evaluations:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch evaluations',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 