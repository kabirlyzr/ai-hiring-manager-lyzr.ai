import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/utils/supabase/server';

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
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        message: 'Job ID is required',
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .eq('job_id', jobId);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      criteria: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching criteria:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch criteria',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

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
    
    const { criteria } = await request.json();
    
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Criteria are required',
      }, { status: 400 });
    }
    
    // Check for operation type - single add or bulk save
    const isSingleCriterion = criteria.length === 1 && !request.headers.get('x-save-all');
    
    if (isSingleCriterion) {
      // Adding a single criterion - don't delete existing ones
      const { data, error } = await supabase
        .from('criteria')
        .insert(criteria)
        .select();
        
      if (error) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        message: 'Criterion added successfully',
        criteria: data
      }, { status: 201 });
    } else {
      // Bulk saving all criteria - replace existing ones
      const jobId = criteria[0].job_id;
      if (jobId) {
        await supabase
          .from('criteria')
          .delete()
          .eq('job_id', jobId);
      }
      
      // Insert new criteria
      const { data, error } = await supabase
        .from('criteria')
        .insert(criteria)
        .select();
        
      if (error) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        message: 'Criteria saved successfully',
        criteria: data
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error saving criteria:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to save criteria',
      error: 'Internal server error'
    }, { status: 500 });
  }
}
