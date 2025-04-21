import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const supabase = createServerSupabaseClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed: Missing credentials',
      }, { status: 401 });
    }
    const {id} = await params
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      jobDescription: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching job description:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch job description',
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
    
    const { title, description, requirements } = await request.json();
    
    if (!title) {
      return NextResponse.json({
        success: false,
        message: 'Job title is required',
      }, { status: 400 });
    }
    
    // Verify job description belongs to user
    const { data: jdData, error: jdError } = await supabase
      .from('job_descriptions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (jdError || !jdData) {
      return NextResponse.json({
        success: false,
        message: 'Job description not found or access denied',
      }, { status: 404 });
    }
    
    // Update job description
    const { data, error } = await supabase
      .from('job_descriptions')
      .update({
        title,
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
      message: 'Job description updated successfully',
      jobDescription: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating job description:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update job description',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(
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
    
    // Verify job description belongs to user
    const { data: jdData, error: jdError } = await supabase
      .from('job_descriptions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (jdError || !jdData) {
      return NextResponse.json({
        success: false,
        message: 'Job description not found or access denied',
      }, { status: 404 });
    }
    
    // Delete job description
    const { error } = await supabase
      .from('job_descriptions')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Job description deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting job description:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete job description',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 