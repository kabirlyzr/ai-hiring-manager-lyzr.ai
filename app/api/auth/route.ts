/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// import { createSupabaseClient } from '@/utils/supabase/client';
import { createServerSupabaseClient } from '@/utils/supabase/server';
// import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createServerSupabaseClient();


export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const userId = cookieStore.get('user_id')?.value;

        if (!token || !userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication failed: Missing credentials',
                error: 'Missing token or userId'
            }, { status: 401 });
        }

        try {
            // Check if user exists in Supabase
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
                throw fetchError;
            }

            if (existingUser) {
                // Verify if token matches
                if (existingUser.api_key === token) {
                    return NextResponse.json({
                        success: true,
                        message: 'Authentication successful',
                        user: {
                            user_id: existingUser.user_id,
                            is_onboarded: existingUser.is_onboarded || false
                        }
                    }, { status: 200 });
                } else {
                    return NextResponse.json({
                        success: false,
                        message: 'Authentication failed: Invalid token',
                        error: 'Token mismatch'
                    }, { status: 401 });
                }
            }

            // If user doesn't exist, create new user
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{
                    user_id: userId,
                    api_key: token,
                    created_at: new Date().toISOString(),
                    last_login_at: new Date().toISOString(),
                    is_onboarded: false
                }])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            return NextResponse.json({
                success: true,
                message: 'Authentication successful',
                user: {
                    user_id: newUser.user_id,
                    is_onboarded: false,
                    is_new_user: true
                }
            }, { status: 200 });

        } catch (dbError) {
            console.error('Database operation failed:', dbError);
            return NextResponse.json({
                success: false,
                message: 'Database operation failed',
                error: 'Internal server error'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json({
            success: false,
            message: 'Authentication failed',
            error: 'Internal server error'
        }, { status: 500 });
    }
} 