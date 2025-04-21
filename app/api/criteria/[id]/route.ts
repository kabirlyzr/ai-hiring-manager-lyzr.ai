import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/utils/supabase/server';

const supabase = createServerSupabaseClient();

export async function DELETE(
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
     const {id} = await params

    const criterionId = id;
    
    if (!criterionId) {
      return NextResponse.json({
        success: false,
        message: 'Criterion ID is required',
      }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('criteria')
      .delete()
      .eq('id', criterionId);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Criterion deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting criterion:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete criterion',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 