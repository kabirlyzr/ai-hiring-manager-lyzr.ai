import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

// Initialize Supabase client
const supabase = createServerSupabaseClient();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Missing userId parameter',
      }, { status: 400 });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('tour_completed')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to retrieve user data',
      }, { status: 500 });
    }

    // If tour_completed field doesn't exist or is null, we consider the tour as not completed
    const tourCompleted = user?.tour_completed ?? false;

    return NextResponse.json({
      success: true,
      tourCompleted,
    });

  } catch (error) {
    console.error('Tour status check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
} 