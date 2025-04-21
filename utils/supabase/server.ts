import { createClient } from "@supabase/supabase-js";

export const createServerSupabaseClient = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!, // Using service role key for admin access
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    ); 