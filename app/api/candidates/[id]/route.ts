import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const supabase = createServerSupabaseClient();
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed: Missing credentials',
      }, { status: 401 });
    }
    const {id} = await params
    // First, get the candidate to retrieve the resume_url
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    if (!candidate) {
      return NextResponse.json({
        success: false,
        message: 'Candidate not found',
      }, { status: 404 });
    }
    
    // If there's a resume_url, delete the file from S3
    if (candidate.resume_url) {
      try {
        // Extract bucket and key from the resume_url
        const urlObj = new URL(candidate.resume_url);
        const hostParts = urlObj.hostname.split('.');
        const bucketName = hostParts[0];
        const key = urlObj.pathname.substring(1); // Remove the leading slash
        
        // Delete from S3
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        await s3Client.send(deleteCommand);
        console.log(`Deleted file from S3: ${key}`);
      } catch (s3Error) {
        console.error('Error deleting file from S3:', s3Error);
        // Continue with deletion from database even if S3 deletion fails
      }
    }
    
    // Delete the candidate from the database
    const { error: deleteError } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      throw deleteError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete candidate',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed: Missing credentials',
      }, { status: 401 });
    }
    
    const updateData = await request.json();
    const {id} = await params
    
    // Update the candidate
    const { data, error } = await supabase
      .from('candidates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Candidate updated successfully',
      candidate: data
    });
    
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update candidate',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 