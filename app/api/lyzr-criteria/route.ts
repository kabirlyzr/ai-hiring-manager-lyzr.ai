import { NextRequest, NextResponse } from 'next/server';
import { callLyzrAgent } from '@/utils/LyzrApiCall';
import { cookies } from 'next/headers';

// Changed from GET to POST to receive job details in the request body
export async function POST(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json(
                { success: false, message: 'Job ID is required' },
                { status: 400 }
            );
        }

        // Get the API key from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value || '';
        const agentId = process.env.NEXT_PUBLIC_CRITERIA_AGENT_ID || "";

        if (!token) {
            console.warn('Lyzr API key not found in cookies. Please ensure user is logged in.');
            return NextResponse.json({
                success: true,
                criteria: []
            });
        }

        // Parse job details from request body
        const jobData = await req.json();
        const { job_description, job_title, requirements } = jobData;

        // Create a prompt using job details from the request body
        let message = "";

        if (job_description) {
            message = `Generate evaluation criteria for the following job: 
            
Job Title: ${job_title || 'Not specified'}

Job Description: 
${job_description}

${requirements ? `Job Requirements: 
${requirements}` : ''}

Based on the job details above, please generate a comprehensive set of evaluation criteria that can be used to assess candidates for this position. Each criterion should include a name, detailed evaluation criteria description, and a weightage from 1-5 (with 5 being the highest importance).`;
        }
        
        const response = await callLyzrAgent(message, token, agentId);
        
        // Log the raw response to understand its structure
        console.log('Raw Lyzr response:', JSON.stringify(response));
        
        // Parse the response - it contains the criteria in the response field as a JSON string
        let criteria = [];
        if (response && response.response) {
            try {
                // The response is a string that needs parsing
                const parsedOutput = JSON.parse(response.response);
                
                console.log('Parsed output:', JSON.stringify(parsedOutput));
                
                if (parsedOutput.fields && Array.isArray(parsedOutput.fields)) {
                    criteria = parsedOutput.fields;
                }
            } catch (error) {
                console.error('Error parsing Lyzr response:', error);
                return NextResponse.json(
                    { success: false, message: 'Failed to parse criteria from Lyzr' },
                    { status: 500 }
                );
            }
        }
        console.log('Final criteria array:', JSON.stringify(criteria));
        return NextResponse.json({
            success: true,
            criteria: criteria.length > 0 ? criteria : []
        });
    } catch (error) {
        console.error('Error in Lyzr criteria API:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to generate criteria' },
            { status: 500 }
        );
    }
}

// Mock criteria data for development/testing when API key is not available
