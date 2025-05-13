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
    
    const { job_id, candidate_id, result, final_score, status, email } = await request.json();
    
    if (!job_id || !candidate_id) {
      return NextResponse.json({
        success: false,
        message: 'Job ID and Candidate ID are required',
      }, { status: 400 });
    }
    
    console.log(`Creating/updating evaluation for candidate_id: ${candidate_id}, job_id: ${job_id}`);
    
    // First, always delete any existing evaluations for this candidate and job
    // This will ensure we never have duplicates
    const { error: deleteError, count } = await supabase
      .from('evaluations')
      .delete()
      .eq('job_id', job_id)
      .eq('candidate_id', candidate_id)
      .select('count');
      
    if (deleteError) {
      console.error('Error deleting existing evaluations:', deleteError);
      // Continue anyway - we'll try to create a new one
    } else if (count && count > 0) {
      console.log(`Deleted ${count} existing evaluations for candidate_id: ${candidate_id}`);
    }
    
    // Now create a fresh evaluation
    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        job_id,
        candidate_id,
        result,
        final_score,
        status,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Database error when saving evaluation:', error);
      throw error;
    }
    
    console.log(`Successfully created evaluation with ID: ${data.id}`);
    
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
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 