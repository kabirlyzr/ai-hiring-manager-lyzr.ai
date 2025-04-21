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
    
    // Update user as onboarded
    const { error } = await supabase
      .from('users')
      .update({ is_onboarded: true })
      .eq('user_id', userId);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to complete onboarding',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 