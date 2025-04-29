import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const supabase = createServerSupabaseClient();

export async function PUT(
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
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Recruiter ID is required',
      }, { status: 400 });
    }
    
    const { name, role, calendly_link } = await request.json();
    
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Recruiter name is required',
      }, { status: 400 });
    }
    
    // Update the recruiter
    const { data, error } = await supabase
      .from('recruiters')
      .update({
        name,
        role,
        calendly_link,
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
      message: 'Recruiter updated successfully',
      recruiter: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating recruiter:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update recruiter',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 