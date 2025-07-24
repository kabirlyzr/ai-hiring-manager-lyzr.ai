/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/jobs/route.ts
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
    
    const { job_title, description, requirements, current_step } = await request.json();
    
    if (!job_title) {
      return NextResponse.json({
        success: false,
        message: 'Job title is required',
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        job_title,
        description,
        requirements,
        current_step: current_step || "details" // Default to first step if not provided
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Job created successfully',
      job: data
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create job',
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
    
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      jobs: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch jobs',
      error: 'Internal server error'
    }, { status: 500 });
  }
}