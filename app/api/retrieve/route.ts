import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const ragId = process.env.NEXT_PUBLIC_RAG_ID;

    if (!ragId) {
      return NextResponse.json(
        { error: 'RAG_ID not configured' },
        { status: 500 }
      );
    }

    const response = await axios.get(
      `https://rag-agent-api.dev.app.lyzr.ai/rag/retrieve/${ragId}`,
      {
        params: {
          query: message
        },
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
console.log(response.data)
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in RAG retrieval:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve RAG chunks' },
      { status: 500 }
    );
  }
}