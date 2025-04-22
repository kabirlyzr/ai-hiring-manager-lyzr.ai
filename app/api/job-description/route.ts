// app/api/chat/route.ts
import { callLyzrAgent } from '@/utils/LyzrApiCall';
import { NextRequest, NextResponse } from 'next/server';

const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_CHAT!;

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    const token = req.cookies.get('token')?.value;
    
    if (!token || !AGENT_ID) {
      console.log("API token from cookies or Agent ID is not configured");
      return NextResponse.json(
        { error: 'API token or Agent ID is not configured' },
        { status: 500 }
      );
    }
    
    const response = await callLyzrAgent(
      message,
      token,
      AGENT_ID,
      sessionId
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}