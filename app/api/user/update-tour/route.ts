import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

// Initialize Supabase client
const supabase = createServerSupabaseClient();

export async function POST(request: Request) {
  try {
    const { userId, tourCompleted } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Missing userId',
      }, { status: 400 });
    }

    // Update tour completion status
    const { error } = await supabase
      .from('users')
      .update({ 
        tour_completed: tourCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update user data',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tour status updated successfully',
    });

  } catch (error) {
    console.error('Update tour status error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
} 