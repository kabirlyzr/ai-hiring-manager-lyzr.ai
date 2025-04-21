// app/api/company/route.ts
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
    
    const { company_name, website, description } = await request.json();
    
    if (!company_name) {
      return NextResponse.json({
        success: false,
        message: 'Company name is required',
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('companies')
      .insert({
        user_id: userId,
        company_name,
        website,
        description
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Company created successfully',
      company: data
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create company',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      .from('companies')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      companies: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch companies',
      error: 'Internal server error'
    }, { status: 500 });
  }
}