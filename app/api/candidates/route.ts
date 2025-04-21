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
    
    const { job_id, name, resume_url } = await request.json();
    
    if (!job_id || !name) {
      return NextResponse.json({
        success: false,
        message: 'Job ID and name are required',
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('candidates')
      .insert({
        user_id: userId,
        job_id,
        name,
        resume_url
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Candidate created successfully',
      candidate: data
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create candidate',
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
    
    let query = supabase.from('candidates').select('*');
    
    // Only filter by job_id if it's provided and not 'all'
    if (jobId && jobId !== 'all') {
      query = query.eq('job_id', jobId);
    }
    
    // Always filter by user_id for security
    query = query.eq('user_id', userId);
    
    const { data, error } = await query;
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      candidates: data
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch candidates',
      error: 'Internal server error'
    }, { status: 500 });
  }
}
