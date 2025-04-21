// app/api/evaluations/route.ts
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
    
    const { job_id, candidate_id, result, final_score, status } = await request.json();
    
    if (!job_id || !candidate_id) {
      return NextResponse.json({
        success: false,
        message: 'Job ID and Candidate ID are required',
      }, { status: 400 });
    }
    
    // Check if evaluation exists
    const { data: existingEval, error: findError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('job_id', job_id)
      .eq('candidate_id', candidate_id)
      .maybeSingle();
      
    if (findError) {
      throw findError;
    }
    
    let data, error;
    
    if (existingEval) {
      // Update existing evaluation
      ({ data, error } = await supabase
        .from('evaluations')
        .update({
          result,
          final_score,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEval.id)
        .select()
        .single());
    } else {
      // Create new evaluation
      ({ data, error } = await supabase
        .from('evaluations')
        .insert({
          job_id,
          candidate_id,
          result,
          final_score,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single());
    }
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Evaluation saved successfully',
      evaluation: data
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to save evaluation',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

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
    const candidateId = url.searchParams.get('candidate_id');
    
    let query = supabase
      .from('evaluations')
      .select('*, candidates(*)');
      
    if (jobId) {
      query = query.eq('job_id', jobId);
    }
    
    if (candidateId) {
      query = query.eq('candidate_id', candidateId);
    }
    
    const { data, error } = await query;
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      evaluations: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch evaluations',
      error: 'Internal server error'
    }, { status: 500 });
  }
}