import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const supabase = createServerSupabaseClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string } >}
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const {id} = await params
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed: Missing credentials',
      }, { status: 401 });
    }
    
    
    
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      job: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch job',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const {id} = await params
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed: Missing credentials',
      }, { status: 401 });
    }
    
    
    const { job_title, description, requirements } = await request.json();
    
    if (!job_title) {
      return NextResponse.json({
        success: false,
        message: 'Job title is required',
      }, { status: 400 });
    }
    
    // Verify job belongs to user
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (jobError || !jobData) {
      return NextResponse.json({
        success: false,
        message: 'Job not found or access denied',
      }, { status: 404 });
    }
    
    // Update job
    const { data, error } = await supabase
      .from('jobs')
      .update({
        job_title,
        description,
        requirements,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      job: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update job',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 