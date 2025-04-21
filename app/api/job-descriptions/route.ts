/* eslint-disable @typescript-eslint/no-unused-vars */
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
    
    const { title, description, requirements } = await request.json();
    
    if (!title) {
      return NextResponse.json({
        success: false,
        message: 'Job title is required',
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('job_descriptions')
      .insert({
        user_id: userId,
        title,
        description,
        requirements
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Job description created successfully',
      jobDescription: data
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating job description:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create job description',
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
      .from('job_descriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      jobDescriptions: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch job descriptions',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 