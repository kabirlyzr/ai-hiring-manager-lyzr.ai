/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({
        success: false,
        message: 'File URL is required',
      }, { status: 400 });
    }
    
    console.log(`Proxy file request for URL: ${url}`);
    
    // Extract bucket and key from the S3 URL
    // Assuming URL format: https://bucket-name.s3.region.amazonaws.com/path/to/file
    const urlObj = new URL(url);
    const hostParts = urlObj.hostname.split('.');
    const bucketName = hostParts[0];
    const key = urlObj.pathname.substring(1); // Remove the leading slash
    
    console.log(`Extracting file from S3: bucket=${bucketName}, key=${key}`);
    
    // Get the file from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('Failed to fetch file from S3: Body is empty');
    }
    
    // Read the file data
    const stream = response.Body as any;
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Determine content type and filename
    const contentType = response.ContentType || 'application/pdf';
    
    // Extract meaningful filename, defaulting to key
    let filename = key.split('/').pop() || 'resume.pdf';
    
    // Ensure the filename has an extension if it doesn't have one
    if (!filename.includes('.')) {
      filename = `${filename}.pdf`;
    }
    
    console.log(`Successfully fetched file: ${filename}, size: ${buffer.length} bytes, type: ${contentType}`);
    
    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      }
    });
    
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch file',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 