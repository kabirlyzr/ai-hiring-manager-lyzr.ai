import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { configureServerAmplify } from '@/utils/amplify-config';

// Initialize Amplify on the server with credentials
configureServerAmplify();

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
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;
    
    if (!file || !jobId) {
      return NextResponse.json({
        success: false,
        message: 'File and jobId are required',
      }, { status: 400 });
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique key for the file
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${jobId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload using Amplify Storage
    await uploadData({
      key: fileName,
      data: buffer,
      options: {
        contentType: file.type,
        onProgress: (progress) => {
          console.log(`Uploaded: ${progress.transferredBytes}/${progress.totalBytes}`);
        },
      },
    });
    
    // Get the URL for the uploaded file
    const { url } = await getUrl({ key: fileName });
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url,
      fileName: file.name,
      size: Math.round(file.size / 1024) + ' KB'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file',
      error: 'Internal server error'
    }, { status: 500 });
  }
}
