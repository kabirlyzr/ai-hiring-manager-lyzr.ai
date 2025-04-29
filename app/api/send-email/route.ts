import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

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
    
    const { 
      recruiter_id, 
      candidate_name,
      candidate_email,
      cc_email,
      job_title,
      company_name,
      message 
    } = await request.json();
    
    if (!recruiter_id || !candidate_name || !candidate_email || !job_title) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields',
      }, { status: 400 });
    }
    
    // Fetch the recruiter details
    const { data: recruiterData, error: recruiterError } = await supabase
      .from('recruiters')
      .select('*')
      .eq('id', recruiter_id)
      .eq('user_id', userId)
      .single();
      
    if (recruiterError || !recruiterData) {
      return NextResponse.json({
        success: false,
        message: 'Recruiter not found',
      }, { status: 404 });
    }
    
    // Fetch the SMTP settings for this recruiter
    const { data: smtpData, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('recruiter_id', recruiter_id)
      .eq('user_id', userId)
      .single();
      
    if (smtpError || !smtpData) {
      return NextResponse.json({
        success: false,
        message: 'SMTP settings not found for this recruiter',
      }, { status: 404 });
    }
    
    // Create email transporter
    const isGmail = smtpData.host.includes('gmail.com');
    const securePort = smtpData.port === '465';

    const transporter = nodemailer.createTransport({
      host: smtpData.host,
      port: parseInt(smtpData.port),
      secure: securePort,
      auth: {
        user: smtpData.username,
        pass: smtpData.password,
      },
      ...(isGmail && {
        // Special settings for Gmail
        service: 'gmail',
        auth: {
          user: smtpData.username,
          pass: smtpData.password
        }
      })
    });
    
    // Fetch company details for email signature
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    // Prepare email content
    const emailSubject = `Interview Invitation: ${job_title} position at ${company_name || (companyData?.company_name || 'our company')}`;
    
    // Create email HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Dear ${candidate_name},</p>
        
        <p>Thank you for your application to the <strong>${job_title}</strong> position at ${company_name || (companyData?.company_name || 'our company')}.</p>
        
        <p>We were impressed with your qualifications and would like to invite you for an interview.</p>
        
        ${recruiterData.calendly_link ? `
        <p><strong>Schedule your interview:</strong> <a href="${recruiterData.calendly_link}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Book a time slot</a></p>
        ` : ''}
        
        ${message ? `<p>${message}</p>` : ''}
        
        <p>If you have any questions, please don't hesitate to reach out.</p>
        
        <p>Best regards,<br>
        ${recruiterData.name}<br>
        ${recruiterData.role || 'Recruiter'}<br>
        ${company_name || (companyData?.company_name || '')}<br>
        ${recruiterData.calendly_link ? `<a href="${recruiterData.calendly_link}">Schedule a meeting with me</a>` : ''}
        </p>
      </div>
    `;
    
    // Configure email options
    const mailOptions: {
      from: string;
      to: string;
      subject: string;
      html: string;
      cc?: string;
    } = {
      from: `"${recruiterData.name}" <${smtpData.username}>`,
      to: candidate_email,
      subject: emailSubject,
      html: htmlContent,
    };
    
    // Add CC if provided
    if (cc_email) {
      mailOptions.cc = cc_email;
    }
    
    // Send the email
    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
    
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({
      success: false,
      message: 'Failed to send email',
      error: errorMessage,
    }, { status: 500 });
  }
} 