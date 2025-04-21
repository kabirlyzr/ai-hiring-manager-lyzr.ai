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

    const { name, role, calendly_link } = await request.json();

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Recruiter name is required',
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('recruiters')
      .insert({
        user_id: userId,
        name,
        role,
        calendly_link
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Recruiter created successfully',
      recruiter: data
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating recruiter:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create recruiter',
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

    const { data: recruiters, error: recruitersError } = await supabase
      .from('recruiters')
      .select('*')
      .eq('user_id', userId);

    if (recruitersError) {
      throw recruitersError;
    }
    const { data: smtpSettings, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('user_id', userId);

    if (smtpError) {
      throw smtpError;
    }

    // Combine the data
    const recruitersWithSmtp = recruiters.map(recruiter => {
      const smtp = smtpSettings.find(smtp => smtp.recruiter_id === recruiter.id);
      return {
        ...recruiter,
        smtp: smtp || null
      };
    }); return NextResponse.json({
      success: true,
      recruiters: recruitersWithSmtp
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching recruiters:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch recruiters',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Recruiter ID is required',
      }, { status: 400 });
    }
    
    // First delete any associated SMTP settings
    const { error: smtpError } = await supabase
      .from('smtp_settings')
      .delete()
      .eq('recruiter_id', id)
      .eq('user_id', userId);
      
    if (smtpError) {
      throw smtpError;
    }
    
    // Then delete the recruiter
    const { error } = await supabase
      .from('recruiters')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Recruiter deleted successfully',
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting recruiter:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete recruiter',
      error: 'Internal server error'
    }, { status: 500 });
  }
}
