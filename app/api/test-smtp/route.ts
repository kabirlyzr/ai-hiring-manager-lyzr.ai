import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

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
    
    const { username, password, host, port } = await request.json();
    
    if (!username || !password || !host || !port) {
      return NextResponse.json({
        success: false,
        message: 'All SMTP fields are required',
      }, { status: 400 });
    }
    
    // Special handling for Gmail
    const isGmail = host.includes('gmail.com');
    const securePort = port === '465';
    
    // Create transporter with provided settings
    const transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port),
      secure: securePort,
      auth: {
        user: username,
        pass: password,
      },
      ...(isGmail && {
        // Special settings for Gmail
        service: 'gmail',
        auth: {
          user: username,
          pass: password
        }
      })
    });
    
    // Verify connection configuration
    await transporter.verify();
    
    return NextResponse.json({
      success: true,
      message: 'SMTP connection successful',
    });
    
  } catch (error: unknown) {
    console.error('Error testing SMTP connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({
      success: false,
      message: 'SMTP connection failed',
      error: errorMessage,
    }, { status: 500 });
  }
} 