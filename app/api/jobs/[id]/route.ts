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
    
    
    const requestBody = await request.json();
    const { job_title, description, requirements, current_step } = requestBody;
    
    // Check if this is a step update only
    const isStepUpdateOnly = 'current_step' in requestBody && 
      Object.keys(requestBody).length === 1;
    
    // Only validate job_title if this is not a step-only update
    if (!isStepUpdateOnly && !job_title) {
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
    
    // Prepare update object
    const updateData: {
      job_title?: string;
      description?: string;
      requirements?: string;
      current_step?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString()
    };
    
    // Add fields that are present in the request
    if (job_title) updateData.job_title = job_title;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (current_step !== undefined) updateData.current_step = current_step;
    
    // Update job
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
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

export async function DELETE(
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
    
    // Delete job
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete job',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 