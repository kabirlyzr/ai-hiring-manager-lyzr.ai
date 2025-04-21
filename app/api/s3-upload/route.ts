// app/api/s3-upload/route.ts
import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { configureServerAmplify } from '@/utils/amplify-config';

// Initialize Amplify on server with your environment variable credentials
configureServerAmplify();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const jobId = formData.get('jobId') as string;
    
    if (!file || !userId || !jobId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields',
      }, { status: 400 });
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${jobId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload to S3 using server-side credentials
    await uploadData({
      key: fileName,
      data: buffer,
      options: {
        contentType: file.type,
      },
    });
    
    // Get the URL for the uploaded file
    const { url } = await getUrl({ key: fileName });
    
    return NextResponse.json({
      success: true,
      url,
      fileName: file.name,
      size: Math.round(file.size / 1024) + ' KB'
    });
    
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file',
    }, { status: 500 });
  }
}