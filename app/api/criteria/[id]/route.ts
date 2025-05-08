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
    const criterionId = id;
    
    if (!criterionId) {
      return NextResponse.json({
        success: false,
        message: 'Criterion ID is required',
      }, { status: 400 });
    }

    const { criterion } = await request.json();
    
    if (!criterion || !criterion.name) {
      return NextResponse.json({
        success: false,
        message: 'Criterion data is required',
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('criteria')
      .update({
        name: criterion.name,
        criteria: criterion.criteria,
        weightage: criterion.weightage,
        updated_at: new Date().toISOString()
      })
      .eq('id', criterionId);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Criterion updated successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating criterion:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update criterion',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 