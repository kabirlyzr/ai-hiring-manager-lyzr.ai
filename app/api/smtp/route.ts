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
    
    const { id, recruiter_id, username, password, host, port } = await request.json();
    
    if (!recruiter_id || !username || !password || !host || !port) {
      return NextResponse.json({
        success: false,
        message: 'All SMTP fields and recruiter ID are required',
      }, { status: 400 });
    }
    
    // Check if settings exist for this recruiter
    if (id) {
      // Update existing settings
      const { data, error } = await supabase
        .from('smtp_settings')
        .update({
          username,
          password,
          host,
          port
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        message: 'SMTP settings updated successfully',
        smtp: data
      }, { status: 200 });
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('smtp_settings')
        .insert({
          user_id: userId,
          recruiter_id,
          username,
          password,
          host,
          port
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        message: 'SMTP settings created successfully',
        smtp: data
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to save SMTP settings',
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
    const recruiterId = url.searchParams.get('recruiter_id');
    
    let query = supabase
      .from('smtp_settings')
      .select('*')
      .eq('user_id', userId);
    
    if (recruiterId) {
      query = query.eq('recruiter_id', recruiterId);
    }
    
    const { data, error } = await query;
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      smtp_settings: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch SMTP settings',
      error: 'Internal server error'
    }, { status: 500 });
  }
}
