import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const supabase = createServerSupabaseClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed: Missing credentials',
      }, { status: 401 });
    }
    
    // Fetch all recruiters
    const { data: recruiters, error: recruitersError } = await supabase
      .from('recruiters')
      .select('*')
      .eq('user_id', userId);
      
    if (recruitersError) {
      throw recruitersError;
    }
    
    if (!recruiters || recruiters.length === 0) {
      return NextResponse.json({
        success: true,
        recruiters: []
      });
    }
    
    // Fetch SMTP settings to determine which recruiters have SMTP configured
    const { data: smtpSettings, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('recruiter_id')
      .eq('user_id', userId);
      
    if (smtpError) {
      throw smtpError;
    }
    
    // Create a set of recruiter IDs with SMTP configured
    const recruitersWithSmtp = new Set(smtpSettings?.map(setting => setting.recruiter_id) || []);
    
    // Enhance recruiter data with has_smtp flag
    const enhancedRecruiters = recruiters.map(recruiter => ({
      id: recruiter.id,
      name: recruiter.name,
      role: recruiter.role,
      has_smtp: recruitersWithSmtp.has(recruiter.id)
    }));
    
    return NextResponse.json({
      success: true,
      recruiters: enhancedRecruiters
    });
    
  } catch (error) {
    console.error('Error fetching recruiters with SMTP:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch recruiters',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 