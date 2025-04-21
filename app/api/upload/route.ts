/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Log environment variables (safely)
console.log('=== S3 CONFIGURATION ===');
console.log('AWS_REGION:', process.env.NEXT_PUBLIC_AWS_REGION || 'not set');
console.log('AWS_S3_BUCKET_NAME:', process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ai-hiring-manager-bucket');
console.log('AWS_ACCESS_KEY_ID:', process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ? 
  `exists (first 4 chars: ${process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID.substring(0, 4)}...)` : 
  'not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ? 
  'exists (hidden for security)' : 'not set');

// Initialize S3 client with environment variables (only available server-side)
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    console.log('Upload endpoint called');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const jobId = formData.get('jobId') as string;
    
    console.log('Received upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId,
      jobId
    });
    
    if (!file || !userId || !jobId) {
      console.log('Missing required fields:', { file: !!file, userId: !!userId, jobId: !!jobId });
      return NextResponse.json({
        success: false,
        message: 'Missing required fields',
      }, { status: 400 });
    }
    
    // Create a buffer from the file
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('Created buffer from file, size:', buffer.length);
    
    // Create unique key/filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${jobId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    console.log('Generated S3 key:', fileName);
    
    // Upload to S3 using server-side credentials
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    
    if (!bucketName) {
      console.log('S3 bucket name not configured');
      return NextResponse.json({
        success: false,
        message: 'S3 bucket name not configured',
      }, { status: 500 });
    }
    
    if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
      console.log('AWS credentials not configured');
      return NextResponse.json({
        success: false,
        message: 'AWS credentials not configured',
      }, { status: 500 });
    }
    
    // Create upload params
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    };
    
    console.log('Attempting S3 upload with params:', {
      Bucket: uploadParams.Bucket,
      Key: uploadParams.Key,
      ContentType: uploadParams.ContentType,
      BodySize: buffer.length
    });
    
    // Upload to S3
    console.log('Sending PutObjectCommand to S3...');
    try {
      const uploadResult = await s3Client.send(new PutObjectCommand(uploadParams));
      console.log('S3 upload successful:', uploadResult);
      
      // Generate a pre-signed URL that works for all regions
      const getObjectParams = {
        Bucket: bucketName,
        Key: fileName,
      };
      
      const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), {
        expiresIn: 3600 * 24 * 7, // URL valid for 7 days
      });
      
      // Alternatively, create a standard S3 URL (Virtual-hosted style)
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
      
      console.log('Generated file URL:', url);
      
      return NextResponse.json({
        success: true,
        url: signedUrl, // Use signed URL for better security
        standardUrl: url, // Also return standard URL as fallback
        fileName: file.name,
        size: Math.round(file.size / 1024) + ' KB'
      });
    } catch (uploadError:any) {
      console.error('S3 upload error:', uploadError);
      if (uploadError.Code) {
        console.error('AWS Error Code:', uploadError.Code);
        console.error('AWS Error Message:', uploadError.Message);
      }
      
      if (uploadError.name === 'CredentialsProviderError') {
        return NextResponse.json({
          success: false,
          message: 'AWS credentials error - check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY',
          error: uploadError.message
        }, { status: 500 });
      }
      
      if (uploadError.name === 'NoSuchBucket') {
        return NextResponse.json({
          success: false,
          message: `Bucket ${bucketName} does not exist or you don't have access to it`,
          error: uploadError.message
        }, { status: 500 });
      }
      
      throw uploadError;
    }
  } catch (error:any) {
    console.error('Error uploading to S3:', error);
    // Log detailed error information
    if (error.name) console.error('Error name:', error.name);
    if (error.message) console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.requestId) console.error('AWS requestId:', error.requestId);
    if (error.time) console.error('Error time:', error.time);
    if (error.statusCode) console.error('Status code:', error.statusCode);
    if (error.stack) console.error('Stack trace:', error.stack);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
